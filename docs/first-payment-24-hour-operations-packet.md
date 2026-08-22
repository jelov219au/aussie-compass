# 첫 고객 결제 직후 24시간 운영 패킷

이 문서는 첫 실제 고객 결제 후 24시간의 내부 처리 기준이다. **응답 문구는 초안일 뿐이며 고객 연락, 환불, Stripe 변경, 접근권한 수동 변경 또는 세무 분류를 승인하지 않는다.** 모든 외부 실행은 owner 승인을 받은 뒤 한다.

## 1. 공통 시간표와 중단 기준

| 시점 | 내부 확인 | 완료 기준 |
| --- | --- | --- |
| 0~5분 | live Checkout/PaymentIntent의 `paid`, AUD, Resume Pro Price와 서명 웹훅 2xx 확인 | 테스트 거래와 분리된 live 주문 1건이 식별됨 |
| 5~15분 | 서버 이용권, gate, outbox, 실제 메일 수신, 활성화 결과 확인 | 아래 15분 필수 증거가 모두 PASS |
| 15~30분 | 영수증·invoice/tax 문서, Balance Transaction 확인 | 지원·증빙·수수료의 원본 위치가 확인됨 |
| 30분~4영업시간 | 결제했으나 접근이 없는 건을 최우선 확인 | 재결제 요청 없이 정상 접근 또는 owner 에스컬레이션 |
| 1영업일 이내 | 모든 문의의 1차 응답 초안을 owner에게 제출 | 승인된 경우에만 고객에게 전송 |
| 2영업일 이내 | 환불·분쟁·개인정보 요청의 owner 결정 | 결정과 근거가 내부 사건 기록에 남음 |
| 24시간 마감 | gross·표시 GST·fee·refund 상태·Stripe 잔액을 분리 기록하고 미결 항목 인계 | payout을 매출로 잡지 않고 모든 미결 건에 owner와 다음 기한이 있음 |

다음 중 하나면 신규 판매를 즉시 닫는 **NO-GO 에스컬레이션** 대상으로 표시한다: 결제 환경 또는 가격 불일치, 서명 웹훅 실패, 서버 이용권 불일치, 지원함·알림 미작동, 수수료·Balance 원본 미확보, 첫 live 세금 문서의 발행자·표시 세금·liability party 불명확, 개인정보 또는 보안 사고 의심. 실제 `PAYMENTS_ENABLED=false` 변경은 owner 승인 후 실행한다. 다만 payout이 24시간 안에 생성되지 않은 것만으로는 NO-GO가 아니다. fee와 ending Stripe balance가 원문에 맞으면 payout을 `pending`으로 넘긴다.

### 15분·24시간 HOLD/STOP 기준

- 결제 후 15분 안에 webhook 2xx, first-sale `LOCKED`, active entitlement, outbox `sent`, 실제 mailbox 수신, activation `consumed` 또는 같은 nonce의 `idempotent`가 모두 확인되지 않으면 **STOP**이다. 신규 결제를 열지 말고 같은 고객에게 재결제를 요청하지 않는다.
- outbox가 `pending`이거나 `busy`, attempts 증가, SMTP 미수신, activation `used/released/revoked/review`, entitlement 불일치가 하나라도 있으면 **HOLD**로 에스컬레이션한다. 내부 해시·전체 Stripe ID·고객 이메일을 증거표에 넣지 않는다.
- 24시간 안에 gross·표시 GST·fee·refund·ending balance, 영수증/세금 문서 발행자, 실제 알림 수신, 이용권·환불 연결이 모두 PASS가 아니면 다음 판매 재개는 **HOLD**다. payout만 `pending`이고 나머지가 PASS인 경우에만 payout 후속 대사로 넘긴다.
- STOP/HOLD 중에는 `PAYMENTS_ENABLED=false`를 유지하고, Stripe/DB 재시도나 gate reopen은 owner 승인과 런북 증거 없이 실행하지 않는다.

### 첫 결제 launch packet 비민감 필드

| 영역 | 기록할 필드 | PASS 기준 |
| --- | --- | --- |
| Outbox | `pending_count`, `sent_count`, 해당 사건 `attempts`, 마지막 시도/전송 시각, event suffix | intent 1개, 최종 sent, 누락 없음 |
| Mailbox | purchase/refund `received=true/false`, 수신 시각, 동일 suffix | 실제 모니터링 메일함에 도착 |
| Activation | `consumed/idempotent/released` 결과, binding 수, access-session suffix, response-loss same-nonce stable-session PASS, different-nonce DENIED | binding·activation session 각 1개, 쿠키는 consumed/idempotent active에만 발급 |
| Replay/restore | URL query removed, replay DENIED, release-response-loss old-cookie DENIED, restore-session PASS, other-session ACTIVE | 해제한 기기만 차단되고 다른 기기 세션은 유지 |
| Access session | activation/restore source, active/expired/revoked boolean, legacy-cookie DENIED | 서버 검증 wrapper만 접근 허용, 원문 session ID·cookie 미기록 |
| 상태 보호 | refund `revoked`, review `review`, first-sale `LOCKED` | 환불/검토 뒤 자동 재결제·자동 reopen 없음 |
| 고객 다음 행동 | 환불 완료는 환불 내역 문의, 검토 중은 상태 재확인·지원, replay/restore는 무료 Builder로 연결 | 환불·검토 화면에서 작업공간 열기·복구를 우선하지 않고 구매 페이지나 `Resume Pro Viewed`로 되돌리지 않음 |

SMTP 재시도나 동일 Message-ID의 중복 이메일은 회계 사건이 아니다. 회계 장부는 Stripe 원거래와 실제 refund/charge/dispute 식별자를 private 원본에서 대사해 각각 한 번만 반영하며, 메일 수신 횟수나 outbox attempts를 매출·환불 건수로 사용하지 않는다.

### First-sale gate 회계·운영 수용 기준

이 gate는 “첫 결제 알림을 받은 뒤 사람이 결제를 끄는 절차”가 아니다. Checkout을 만들기 전에 서버가 한 개의 판매 슬롯을 원자적으로 예약하고, 첫 paid 거래가 확인되는 순간 추가 Checkout을 차단해야 한다. 아래는 개발팀 구현의 수용 기준이며 이 문서만으로 코드·DB·Stripe 설정 변경을 승인하지 않는다.

| 상태 | 의미와 허용 동작 | 다음 상태 |
| --- | --- | --- |
| `OPEN` | 사전 출시 gate가 모두 통과했고 예약이 없는 상태다. 한 요청만 원자적으로 슬롯을 얻을 수 있으며 Stripe Checkout 생성은 예약 성공 후에만 허용한다. | 예약 성공 시 `RESERVED` |
| `RESERVED` | 정확히 한 live Checkout 시도에 슬롯이 귀속된 상태다. 다른 Checkout 생성 요청은 거절하고 재결제를 유도하지 않는다. 예약에는 만료 시각과 축약된 Checkout 참조를 연결한다. | 서명된 paid 사건 확인 시 `SOLD`; 검증된 abandoned 만료 시에만 `OPEN` |
| `SOLD` | 서명 웹훅으로 첫 live paid 거래, 상품·금액·통화가 확인된 불변 사건이다. 같은 원자적 처리에서 판매 슬롯을 닫고 이용권·사건번호를 연결한다. 외부 요청이 관찰 가능한 열린 상태로 남기지 않는다. | 즉시 `LOCKED` |
| `LOCKED` | 두 번째 Checkout을 만들 수 없는 상태다. 환불·분쟁·접근 회수 여부와 무관하게 유지하며, 증거 완료와 owner의 명시적 승인 전에는 자동 해제하지 않는다. | 아래 재개 gate를 모두 만족한 owner 승인 시에만 `OPEN` |

상태 전이는 compare-and-set, DB transaction 또는 동등한 단일 승자 보장으로 처리한다. 프로세스 메모리, 이메일 알림, Vercel 환경변수 수동 전환만으로는 동시 요청을 막는 first-sale gate로 인정하지 않는다. 중복 웹훅과 재시도는 같은 사건에 idempotent해야 하며 `SOLD`/`LOCKED`에서 새 판매를 만들면 안 된다.

#### Abandoned 예약 만료

- 단순히 시간이 지났다는 이유만으로 `RESERVED`를 `OPEN`으로 바꾸지 않는다. 연결된 Checkout이 `expired` 또는 결제 불가 상태이고 paid·비동기 성공·Charge가 없다는 서버 측 근거를 확인해야 한다.
- 예약 만료 시각은 연결된 Checkout의 실제 만료 시각을 기준으로 한다. Checkout 생성 전에 실패한 임시 예약은 “Stripe Session ID가 생성되지 않음”이 확인된 경우에만 실패 사건과 함께 해제한다.
- 만료 확인 중 상태 조회가 실패하거나 결과가 불명확하면 `RESERVED`를 유지하고 owner에게 에스컬레이션한다. `MISSING`을 abandoned로 간주하지 않는다.
- 만료·해제와 거의 동시에 paid 웹훅이 도착하는 경쟁 상황에서는 paid 사건이 우선해 `SOLD` 후 `LOCKED`가 되어야 한다. 이미 새 예약이 생겼다면 새 Checkout도 즉시 중단 대상으로 표시하고 결제 가능 여부를 조사한다.

#### 결제·환불·재개 규칙

1. 첫 live paid 웹훅이 검증되면 `RESERVED → SOLD → LOCKED`를 원자적으로 기록하고, 그 뒤의 Checkout 생성 요청은 모두 차단한다.
2. 전액·부분 환불, chargeback, dispute, 이용권 회수 또는 고객의 제품 데이터 삭제는 `LOCKED → OPEN` 조건이 아니다. 환불 후에도 gate는 자동 재개되지 않는다.
3. 재개는 15분 증거, 24시간 증거와 첫 payout 증거가 모두 `PASS`, 필수 필드의 `MISSING`/`FAIL`이 0건, cash 차이가 ±A$0.01 이내, 접근·알림·필요한 환불/credit note·revocation 연결이 확인된 경우에만 검토한다.
4. 위 시스템 gate가 통과해도 사업자 owner가 승인 사건번호, 승인 시각과 재개 사유를 명시적으로 기록해야 한다. 스케줄러·만료 작업·환불 웹훅·배포·서버 재시작은 재개 권한이 없다.
5. owner 승인 후 `LOCKED → OPEN` 전이는 새 gate 사건으로 남기며, 다음 판매도 다시 한 슬롯만 예약한다. 자동 다건 판매 모드로 전환하지 않는다.

#### 감사 로그의 비민감 필드

감사 로그는 append-only로 남기고 다음 필드만 사용한다.

- gate event ID와 gate version
- `from_state`, `to_state`, UTC 사건 시각, Australia/Sydney 운영일
- `product_code=resume_pro`, `environment=live/test`, 통화와 기대 금액
- actor type(`system`, `webhook`, `owner`)과 허용된 reason code
- 예약 만료 시각, Checkout·PaymentIntent·Charge·webhook 참조의 마지막 8자
- FP-/WH-/ENT- 사건번호, idempotency 결과, entitlement와 signed-access 결과
- 증거 gate의 `PASS/MISSING/FAIL`, cash 대사 차이, payout `pending/matched`
- owner 승인 사건번호·승인 시각, 배포/스키마 버전처럼 재현에 필요한 비밀이 아닌 버전값

일반 로그에는 고객 이름·이메일·주소, 카드 정보, 전체 Stripe ID, 전체 webhook payload, 영수증 원문, 은행 정보, API key·webhook secret를 남기지 않는다. 전체 객체 참조와 원본 문서는 접근 제한된 원래 시스템 또는 private 회계자료에서 사건번호로 연결한다.

#### 운영자가 수동 삭제하면 안 되는 증거

아래 항목은 일반 운영자가 사건을 “정리”하기 위해 수정·덮어쓰기·수동 삭제하면 안 된다. 보존기간 종료, 법적 요청 또는 오류 정정이 필요하면 owner가 승인한 기록관리 절차로 처리하고 삭제·정정 자체의 감사 흔적을 남긴다.

- append-only gate 상태 전이와 예약 만료·해제 근거
- 첫 paid 사건의 receipt/invoice, tax 문서와 고객 노출 판매자·발행자·liability 표기 원본
- Stripe Balance/Ending Balance, `withheld_tax`, `fee_net_of_withheld_tax`, refund/credit note와 itemised payout 원본
- 첫 payout의 은행 입금 일치 증거와 Stripe clearing 대사
- 서명 webhook의 event 참조·수신 시각·검증·처리·idempotency 결과와 전달 실패 기록
- entitlement grant/revoke, signed access와 workspace 차단 결과
- 환불·분쟁·chargeback 원거래 연결과 관련 FP-/WH-/ENT- 사건 기록
- 두 번째 판매 system gate 결과와 owner의 승인·거부·재개 기록

원본에 개인정보가 포함될 수 있다는 이유로 일반 티켓이나 소스 저장소에 복사하지 않는다. 반대로 개인정보 최소화 규칙을 이유로 회계·세무·거래 증거를 임의 삭제하지도 않는다.

#### 개발팀 인계 검증 시나리오

| 시나리오 | 수용 결과 |
| --- | --- |
| 동시에 두 Checkout 요청 | 정확히 하나만 `OPEN → RESERVED`; 나머지는 Stripe Session 생성 전 차단 |
| Checkout 생성 실패 | Session 미생성 근거와 실패 사건을 남긴 뒤에만 예약 해제 |
| abandoned Checkout | 실제 만료·미결제 확인 후 한 번만 `RESERVED → OPEN` |
| 만료와 paid 웹훅 경쟁 | paid가 승리해 `SOLD → LOCKED`; 새 판매 없음 |
| 첫 paid 및 중복 웹훅 | 첫 사건 한 건만 기록되고 gate는 `LOCKED`; 중복은 idempotent |
| 전액/부분 환불 또는 dispute | 접근·장부는 원문대로 조정하되 gate는 `LOCKED` 유지 |
| 서버 재시작·배포·스케줄러 실행 | 저장된 상태를 유지하고 자동 `OPEN` 금지 |
| 증거 `MISSING/FAIL` 또는 payout pending | owner가 승인 값을 입력해도 `LOCKED` 유지 |
| 모든 증거 완료와 owner 명시 승인 | 감사 사건을 남긴 뒤에만 `LOCKED → OPEN` |

## 2. 개인정보 최소화 규칙

- 원본은 원래 시스템에 둔다: 고객 이메일은 Zoho, 결제 원본은 Stripe, 이용권 상태는 서버 이용권 저장소, 회계 원본은 private accounting 폴더가 기준이다.
- 내부 사건번호는 `FP-YYYYMMDD-###` 형식을 쓰고, 티켓에는 상품 코드, 발생·확인 시각, 문제 유형, 상태, owner, 다음 기한, Stripe 참조값의 마지막 8자와 원본 위치만 남긴다.
- 전체 Stripe 식별자가 대사에 꼭 필요할 때만 private 회계자료에 기록한다. 고객 이름·이메일·주소·카드 정보는 회계 워크북과 일반 운영 로그에 복사하지 않는다.
- 카드번호 전체, CVC, 비밀번호, 인증번호, TFN, 신분증·비자 사본, 건강정보, 이력서·커버레터 원문, 복구 코드 원문, 서명 쿠키, API key, webhook secret와 전체 webhook payload를 요청하거나 저장하지 않는다.
- 이메일 본문·첨부파일을 티켓에 복사하지 않고 Zoho message reference만 남긴다. 스크린샷이 불가피하면 이름·이메일·주소·결제수단을 가린 private 파일만 보존한다.
- 로그에는 `paid/unpaid`, `live/test`, 상품 코드, 처리 결과, 이벤트 시각처럼 진단에 필요한 상태만 남기고 고객 입력 원문은 남기지 않는다.
- 요청자의 신원이나 주문 연결이 불명확하면 추가 개인정보를 요구하지 말고 owner에게 에스컬레이션한다. 전체 카드번호나 신분증 사본으로 본인 확인하지 않는다.

## 3. 첫 문의 최소 응대 런북

### 역할과 접수 원칙

- **Hoju Compass 제품 지원:** Resume Pro 제공, 결제 후 접근, 복구 코드, 기능 오류와 브라우저에 저장된 작성 데이터 문제를 확인한다.
- **Managed Payments 거래 지원:** 최종 결제 화면·영수증에 표시된 거래상 판매자(Merchant of Record)와 지원 경로가 결제, 영수증·인보이스, 거래 환불과 분쟁을 처리한다. 첫 실제 문서에서 확인하지 않은 사업자명은 티켓이나 고객 답변에서 추정하지 않는다.
- 고객이 Hoju Compass에 먼저 문의했다는 이유로 제품 문제나 Australian Consumer Law 관련 주장을 거래 지원으로 떠넘기지 않는다. Hoju Compass가 제품 사실과 접근 증거를 확인하고 필요한 거래 절차를 조율한다.
- 아래 응답은 접수와 확인 일정을 알리는 초안이다. **자동 환불, 환불 완료, 법률상 결론, 즉시 삭제 또는 세금 문서의 법적 성격을 약속하지 않는다.** 실제 외부 답변·환불·삭제는 owner 승인과 원본 시스템 절차를 따른다.

### 허용하는 최소 식별자

고객에게는 다음 중 해당 문제를 찾는 데 필요한 값만 요청한다: `Resume Pro` 제품명, 대략적인 결제일·시각과 시간대, 결제 통화·금액, 구매에 사용한 이메일, 영수증·인보이스 또는 결제 참조의 마지막 8자, 문제 유형과 발생 시각. 구매 이메일과 원문 메시지는 Zoho에만 두고 일반 티켓에는 Zoho message reference만 남긴다.

다음은 요청하거나 티켓에 복사하지 않는다: 카드번호 전체·일부, CVC, 카드 만료일, 은행계좌·은행 화면 전체, 비밀번호·인증번호, TFN, 신분증·비자 사본, 주소, 이력서·커버레터 원문, 복구 코드, 쿠키, API key, webhook secret 또는 전체 Stripe/webhook payload. 허용 식별자로 주문을 안전하게 연결할 수 없으면 자료를 더 받지 말고 owner에게 에스컬레이션한다.

### 문의 분기표

| 문의 | 1차 담당과 내부 확인 | 최소 응답 | 에스컬레이션·금지 |
| --- | --- | --- | --- |
| 결제 완료·접근 미부여 | **Hoju Compass 제품 지원.** `paid` live 거래, 서명 웹훅, `resume_pro` entitlement와 접근 세션을 확인한다. | “같은 상품을 다시 결제하지 말아 주세요. 결제와 이용권 처리를 확인해 4영업시간 이내 결과 또는 다음 조치를 안내드리겠습니다.” | 30분 안에 원인 불명, paid/entitlement 충돌 또는 반복 발생이면 owner와 판매 중단 gate로 올린다. 수동 DB 변경·재결제를 유도하지 않는다. |
| 영수증·인보이스·거래 문의 | **Managed Payments 거래 지원 우선, Hoju Compass 안내 보조.** 최종 결제 화면·영수증의 거래상 판매자와 지원 경로, 문서 제목·발행자·금액을 원문 그대로 확인한다. | “발급된 원본 문서와 거래 지원 경로를 확인해 1영업일 이내 안내드리겠습니다.” | 확인하지 않은 발행 법인·세금 책임·`tax invoice` 여부를 단정하거나 별도 문서를 만들지 않는다. 제품·접근 문의는 Hoju Compass가 계속 맡는다. |
| 중복 결제 주장 | **공동 처리.** Hoju Compass가 서로 다른 live paid 거래가 실제 2건인지 확인하고, 거래 환불 절차는 영수증에 표시된 Managed Payments 지원 경로와 조율한다. | “추가 결제를 하지 말아 주세요. 실제 결제가 두 건인지 확인해 1영업일 이내 다음 절차를 안내드리겠습니다.” | 단일 거래의 중복 웹훅을 중복 청구로 보지 않는다. 원본 확인 전 자동 환불·환불 완료를 약속하지 않는다. 실제 paid 2건이면 owner와 판매 중단 gate로 올린다. |
| 환불·ACL 문제 | **Hoju Compass가 제품 사실·제공 상태를 확인하고 Managed Payments 거래 지원과 필요한 절차를 조율한다.** terms version, 접근·문제 증거와 기존 refund/dispute를 owner 검토용으로 정리한다. | “요청을 접수했습니다. 1영업일 이내 1차 안내, 늦어도 2영업일 이내 결정 또는 추가 확인 사항을 안내드리겠습니다. 현재 환불이 완료된 것은 아닙니다.” | 법률 판단이나 환불 결과를 선약하지 않는다. ACL 권리를 축소하지 않고 중대한 불일치·지속 접근 불가·dispute는 즉시 owner에게 올린다. 실제 환불 전 Stripe·이용권·장부를 변경하지 않는다. |
| 개인정보 삭제 요청 | **시스템별 분리.** Hoju Compass는 Zoho·이용권 저장소·기술 로그의 보유 범위를, 고객은 영수증에 표시된 Managed Payments 경로를 통해 결제 시스템 보유분의 절차를 확인한다. | “삭제 요청 범위와 주문 연결을 최소 정보로 확인해 1영업일 이내 다음 절차를 안내드리겠습니다.” | 즉시·전면 삭제를 약속하지 않는다. 신원 불명확, 제3자 정보, 보안 사고 또는 세무·법정 보존 기록과 충돌하면 owner에게 올리고 임의 삭제하지 않는다. |

첫 응답 후에는 아래 상세 처리 카드의 증거·장부·판매 중단 규칙을 이어서 적용한다.

## 4. 상황별 처리 카드

### A. 주문 확인

**내부 처리 순서**

1. `livemode=true`, `payment_status=paid`, AUD, Resume Pro Price와 결제 시각을 확인한다.
2. 서명 웹훅 2xx와 `resume_pro` active 이용권을 확인한다.
3. Stripe receipt/invoice의 정확한 문서 제목·발행자·총액을 확인하고 결제 알림 수신을 확인한다.
4. 사건 기록을 완료한 뒤 아래 초안을 owner에게 제출한다.

**필수 증거:** Checkout Session, PaymentIntent/Charge, 서명 웹훅 event 결과, 서버 이용권 상태, receipt/invoice, Balance Transaction reference.

**응답 초안:** “Resume Pro 결제가 확인되었습니다. 결제 후 제공된 접근 경로에서 작업 공간을 열어 주세요. 접근이 열리지 않으면 다시 결제하지 마시고 이 메일에 결제 시각과 Stripe 영수증 참조만 알려 주세요. 카드번호나 보안번호는 보내지 마세요.”

**에스컬레이션:** 가격·통화·상품·live/test 불일치, paid인데 웹훅 또는 이용권 없음, 알림·문서·Balance 원본 미확보 시 owner에게 즉시 보고하고 신규 판매 중단 후보로 표시한다.

**장부 반영:** 인식일의 gross sale을 기록하고 표시 GST/`withheld_tax`는 live 문서 근거가 확인될 때까지 `검토 대기`로 분리한다. 보고서의 `fee_net_of_withheld_tax`를 Stripe fee 기준으로 쓰며, 합산 `fee`를 전액 수수료로 처리하지 않는다. payout은 기록하지 않는다.

### B. 결제했지만 접근권한 미부여

**내부 처리 순서**

1. 고객에게 재결제를 요청하지 않는다.
2. live paid 상태와 서명 웹훅 처리 결과를 확인하고, event 순서·중복·실패 여부를 확인한다.
3. 서버 이용권의 product code, active/revoked 상태와 signed access 경로를 확인한다.
4. verified server entitlement 경로로만 복구안을 준비하고 owner 승인을 받는다.

**필수 증거:** paid Checkout/PaymentIntent, webhook event와 2xx/실패 결과, entitlement 상태·처리 시각, access-session 발급 결과. 이력서 원문이나 고객 브라우저 데이터는 받지 않는다.

**응답 초안:** “결제 여부와 이용권 처리를 우선 확인하고 있습니다. 같은 상품을 다시 결제하지 말아 주세요. 4영업시간 이내에 확인 결과 또는 다음 조치를 안내드리겠습니다. 카드번호, 비밀번호나 이력서 원문은 보내지 마세요.”

**에스컬레이션:** 30분 안에 원인이 확인되지 않거나 여러 고객에게 반복되면 즉시 owner에게 보고하고 신규 판매 중단 후보로 표시한다. paid와 entitlement가 충돌하면 수동 DB 변경이나 재구매 유도 없이 owner 결정을 기다린다.

**장부 반영:** 결제 자체가 유효하면 기존 gross sale 1건을 유지한다. 접근 복구는 별도 매출이나 환불이 아니다. owner 승인 환불이 실행된 경우에만 원거래를 보존하고 refund를 별도 음수 매출 조정으로 추가한다.

### C. 중복 결제 의심

**내부 처리 순서**

1. 동일 화면·이메일만으로 중복을 단정하지 않고 서로 다른 live Checkout/PaymentIntent/Charge가 실제로 paid인지 확인한다.
2. 각 거래의 시각, 금액, 상품, Balance Transaction과 이용권 event를 비교한다.
3. 단일 주문의 중복 웹훅이면 idempotent 처리 결과만 기록하고 금전 환불 대상으로 만들지 않는다.
4. 실제 paid 거래가 2건이면 환불 후보와 이용권 상태를 정리해 owner 승인을 요청한다.

**필수 증거:** 두 주문의 Stripe reference, paid 상태, 금액·통화·상품·시각, Balance Transaction, webhook idempotency 결과, 기존 refund/dispute 상태.

**응답 초안:** “중복 청구 여부를 거래 기록으로 확인하고 있습니다. 추가 결제를 하지 말아 주세요. 실제 결제가 두 건인지 확인한 뒤 1영업일 이내에 다음 절차를 안내드리겠습니다. 카드번호 전체나 은행 화면 전체를 보내지 마세요.”

**에스컬레이션:** 실제 live paid 거래 2건, 금액·상품 불일치, 이미 dispute가 열린 경우 즉시 owner에게 보고한다. 첫 고객의 실제 paid 거래가 2건이면 원인과 환불 계획이 확인될 때까지 신규 판매 중단 후보가 아니라 중단 gate로 취급한다. 승인 없이 환불하거나 고객에게 환불을 확약하지 않는다.

**장부 반영:** 확인된 paid 거래는 각각 gross sale로 기록한다. owner 승인 후 실제 refund가 생성되면 원거래를 삭제하지 않고 연결된 refund를 별도로 기록하며, 각 거래의 fee와 refund fee 처리도 원문대로 분리한다.

### D. 환불·ACL 문제

**내부 처리 순서**

1. 요청 접수 시각, 주문 reference, 제품, 문제 유형과 현재 이용권 상태를 기록한다.
2. purchase terms 버전, 제공·접근 증거, 기존 refund/dispute와 Australian Consumer Law 관련 사유를 owner 검토용으로 정리한다.
3. 가능한 재제공·복구·수정·환불 대안을 구분하되 결과를 미리 약속하지 않는다.
4. Hoju Compass가 환불을 시작하는 경우 owner가 2영업일 이내 결정하도록 올리고 승인 전 Stripe나 이용권을 변경하지 않는다. 최종 결제 화면·영수증에 표시된 Managed Payments 거래 지원 주체가 이미 환불한 경우에는 사후 승인을 기다리지 말고 원본 환불·credit note·webhook 이용권 회수·장부를 즉시 대사한다.

**필수 증거:** 원주문과 terms version, receipt/invoice, 고객 이메일의 Zoho reference, 제공·접근 상태, refund/dispute 상태, 문제 재현 기록. 고객 이메일 본문은 티켓에 복사하지 않는다.

**응답 초안:** “환불 요청을 접수했습니다. 구매 기록과 제공 상태를 확인한 뒤 1영업일 이내 1차 안내, 늦어도 2영업일 이내 결정 또는 추가 확인 사항을 안내드리겠습니다. 현재 단계에서는 환불이 완료된 것이 아니며, 카드번호나 신분증 사본은 보내지 마세요.”

**에스컬레이션:** 접근 불가가 지속됨, 제품 설명과 중대한 불일치 주장, chargeback/dispute, 부분환불 또는 금액 불일치, 2영업일 내 owner 결정 불가 시 신규 판매 중단 후보로 표시한다. Managed Payments 거래 지원 에스컬레이션에는 48시간 안에 응답한다. Stripe 공식 흐름상 거래 지원 과정에서 환불이 이뤄질 수 있고 사업자가 응답하지 않으면 사전 owner 승인 없이 처리될 수 있으므로, 외부 환불을 발견하면 원본 문서와 상태를 즉시 대사한다. 환불 자체만으로는 판매 중단 사유가 아니지만 refund webhook, 접근 revoke 또는 Stripe 잔액 대사 중 하나라도 실패하면 판매를 중단한다.

**장부 반영:** 요청만으로 장부를 바꾸지 않는다. 실제 refund 생성 시 원 gross sale을 보존하고 refund/credit document와 연결한 음수 매출 조정을 기록한다. 표시 GST는 credit 문서의 실제 금액을 근거로 조정하고 접근권한 revoke 결과를 별도 운영 증거로 남긴다.

### E. 영수증·인보이스·거래 문의

**내부 처리 순서**

1. 해당 live 거래의 receipt/invoice/tax report에서 정확한 문서 제목, 발행자, 총액, 표시 세금과 liability party를 확인한다.
2. 고객 문서를 임의로 `tax invoice`라고 바꾸거나 세율·세액을 계산해 새 문서를 만들지 않는다.
3. Stripe의 원본 문서 재전송·다운로드 경로만 확인하고, 책임 주체가 불명확하면 owner에게 올린다.

**필수 증거:** live receipt/invoice 원본, tax report, 결제 화면의 표시 세금, 문서 issuer와 liability party, 재발급 경로.

**응답 초안:** “해당 결제에 발급된 Stripe 문서의 명칭과 발행 정보를 확인하고 있습니다. 발급된 원본 문서를 기준으로 안내드리며, 문서 명칭이나 세액을 임의로 변경하지 않습니다. 확인 후 1영업일 이내에 원본 확인 경로를 안내드리겠습니다.”

**에스컬레이션:** 문서 발행자·표시 세금·liability party가 불명확하거나 결제 화면과 원본 문서가 다르면 두 번째 판매 전에 owner에게 보고하고 신규 판매 중단 후보로 표시한다. 개인 세무 판단 요청에는 일반 정보를 넘어 답하지 않는다.

**장부 반영:** 원 gross와 `fee_net_of_withheld_tax`를 유지하고 표시 GST/`withheld_tax`는 근거가 확인될 때까지 `검토 대기`로 둔다. 현금 대사에서는 보고서의 합산 `fee`를 사용하되 표시 GST를 별도로 다시 차감하지 않으며, 근거 확정 후 분류만 조정한다.

### F. 개인정보·삭제 요청

**내부 처리 순서**

1. 요청 유형을 열람·정정·삭제·보관·보안 우려로 분류하고 Zoho message reference만 티켓에 기록한다.
2. 결제 이메일과 주문 reference 등 이미 보유한 최소 정보로 연결 가능성을 확인하되, 전체 카드번호나 신분증 사본을 요구하지 않는다.
3. Zoho, 서버 이용권 저장소와 기술 로그에 존재할 수 있는 Hoju Compass 보유 범위와 Managed Payments 거래 시스템 보유 범위를 분리해 목록화한다. 결제 시스템 보유분은 최종 결제 화면·영수증에 표시된 거래 지원 경로의 삭제 절차를 확인하며, 이력서·커버레터 원문은 별도 안내가 없는 한 서버 이용권 DB에 저장하지 않는다는 현재 공개 안내와 대조한다.
4. 열람 제공·정정·삭제·비식별화·보존 여부는 아래 경계표와 owner의 개인정보 처리 검토에 따라 시스템별로 결정한다. 거래 증거를 보존해야 한다는 이유로 제품·지원 데이터를 일괄 보존하지 않고, 제품 데이터 삭제 요청만으로 거래 증거를 지우지 않는다. 보안 사고 의심이면 일반 지원 건과 분리한다.

#### 삭제·보존 경계표

| 데이터 구분 | 기본 처리 | 경계와 최소 증거 |
| --- | --- | --- |
| 브라우저 이력서·커버레터·localStorage·cache와 사용자가 만든 백업 | 사용자가 해당 기기·파일에서 삭제한다. 서버에 사본이 없다는 현재 설계와 대조한다. | Hoju Compass가 보유하지 않은 로컬 원문을 삭제했다고 약속하지 않는다. 로컬 삭제는 결제 취소·환불·거래 기록 삭제가 아니다. |
| 접근·보안 데이터 | 기기의 서명 쿠키는 로컬에서 제거하고, 서버 entitlement·복구 코드 해시·보안 상태는 접근 종료와 사건 처리에 필요한 범위를 먼저 확인한 뒤 삭제·비식별화 또는 제한 보존을 결정한다. | 문서 원문·복구 코드 원문은 보존하지 않는다. 감사가 필요하면 사건번호, 상태, 시각과 축약 참조만 남기고 보존 사유·검토일을 기록한다. |
| Zoho 지원 문의 | 사건 처리와 허용되는 보존 목적에 더 이상 필요하지 않은 본문·첨부·연락처 사본은 삭제 또는 비식별화 후보로 분류한다. | 세무 기록 보존을 이유로 메일함 전체를 일괄 보존하지 않는다. 일반 티켓에는 Zoho message reference, 사건 결과와 다음 검토일만 둔다. |
| 회계·세무·거래 증거 | receipt/invoice, tax·credit 문서, gross·fee·refund·payout 대사와 거래를 설명하는 최소 참조를 private 회계자료에 보존한다. | ATO는 GST 기록에 일반적으로 작성·취득일 또는 관련 거래 완료일 중 늦은 때부터 5년을 안내한다. 더 긴 기간·예외·진행 중인 review/dispute 여부는 owner가 기록별로 확인한다. 카드 정보·이력서 원문·불필요한 주소는 회계 증거에 복사하지 않는다. |
| Managed Payments 보유 데이터 | 최종 결제 화면·영수증의 거래 지원 경로로 요청 범위와 결과를 확인한다. | Hoju Compass가 Stripe/Link 보유분의 즉시·전면 삭제를 약속하지 않는다. 내부 티켓에는 요청·응답 reference와 미결 상태만 남긴다. |

**필수 증거:** 요청 원본의 Zoho reference, 요청 유형·시각, 최소 주문 연결 결과, 관련 시스템 목록, 보존 필요성이 있는 결제·세무 기록 여부. 불필요한 데이터 사본을 새로 만들지 않는다.

**응답 초안:** “개인정보 삭제 요청을 접수했습니다. 요청 범위와 본인 주문의 연결을 최소한의 정보로 확인한 뒤 1영업일 이내에 시스템별 다음 절차를 안내드리겠습니다. 브라우저의 제품 데이터와 결제·세무·거래 기록은 별도로 검토하며, 보존이 필요한 기록이 있다면 범위와 이유를 구분해 안내하겠습니다. 전체 카드번호, 비밀번호, TFN 또는 신분증 전체 사본은 보내지 마세요. 현재 단계에서 삭제가 완료된 것은 아닙니다.”

**에스컬레이션:** 무단 접근·유출·계정 탈취 의심, 요청자 신원 불명확, 삭제 요청과 결제·세무 기록 보존 의무의 충돌, 제3자 정보 포함 시 즉시 owner에게 보고한다. 보안 사고 의심이면 고객에게 원인을 단정하지 않는다.

**장부 반영:** 개인정보 문의 자체는 장부 분개가 없다. 환불·chargeback 등 실제 금전 사건이 별도로 발생한 경우에만 해당 원거래와 연결해 기록한다. 법정·세무 증빙은 임의 삭제하지 않고 보존 필요성을 owner가 판단한다.

## 5. 24시간 마감 인계

- 사건별 상태를 `확인 중 / owner 승인 대기 / 조치 승인 / 완료 / 판매 중단 후보` 중 하나로 남긴다.
- 고객별 메모 대신 사건번호, 원본 시스템 reference, 다음 조치와 기한만 인계한다.
- first-sale gate의 현재 `OPEN/RESERVED/SOLD/LOCKED`, 마지막 gate event ID, 예약 만료 시각, 증거 gate 결과와 owner 승인 상태를 함께 인계한다. 고객 식별정보나 전체 Stripe ID는 복사하지 않는다.
- 첫 결제의 gross, 표시 GST 검토 상태, fee, refund `nil/발생`, payout `nil/pending/paid`, Stripe ending balance를 회계 워크북에 분리한다. payout 대기 잔액은 다음 대사로 이월한다.
- 미결 항목 하나라도 owner·기한 없이 남거나 NO-GO 조건이 해소되지 않으면 다음 판매를 열지 않는다.

관련 기준: `docs/first-payment-go-no-go-decision-memo.md`, `docs/first-live-customer-payment-runbook.md`, `docs/first-payment-tabletop-validation.md`, `docs/payment-alerts.md`, 공개 `/purchase-information`, `/payment-help`, `/privacy` 안내.

공식 역할·권리 기준:

- Stripe Managed Payments 고객 흐름: https://docs.stripe.com/payments/managed-payments/how-it-works
- ACCC 소비자 구제 기준: https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought/repair-replace-refund-cancel
- ACCC 영수증·구매 증명 기준: https://www.accc.gov.au/consumers/buying-products-and-services/receipts-bills-proof-of-purchase
- ATO 사업 기록 보존 기준: https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business
- OAIC APP 11 삭제·비식별화 기준: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-11-app-11-security-of-personal-information
- OAIC 소규모 사업자 적용 범위 안내: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
