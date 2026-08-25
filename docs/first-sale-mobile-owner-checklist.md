# First-sale mobile owner checklist

이 문서는 Resume Pro 첫 결제 준비 상태를 휴대폰에서 **읽기 전용**으로
확인하기 위한 짧은 소유자 절차다. 휴대폰 확인은 결제 준비의 일부일 뿐이며
결제, 환불, 고객 연락, 설정 변경 또는 launch 승인을 실행하지 않는다.

## Scope and hard stop

- [ ] 개인 휴대폰의 최신 OS와 신뢰할 수 있는 네트워크를 사용하고, 공식
  Vercel·Stripe·Neon 앱 또는 직접 연 공식 로그인 화면만 사용한다.
- [ ] 비밀번호 관리자, passkey 또는 인증 앱으로 로그인한다. 비밀번호,
  복구 코드, API 키, webhook secret, database URL이나 연결 문자열의 값은
  표시·복사·붙여넣기·메모·스크린샷·화면녹화·채팅 공유하지 않는다.
- [ ] 이름, 이메일, ABN, 은행정보, 고객·거래·문서 식별자와 고객별 화면은
  열거나 기록하지 않는다. 상태는 `PASS`, `HOLD`, `STOP`만 기록한다.
- [ ] 잘못된 계정·프로젝트·mode, 경고 또는 미해결 task, Source SHA 불일치,
  예상하지 않은 값 표시 요청, 설정 편집 요청, 개인정보·비밀값 노출 중
  하나라도 보이면 즉시 `STOP`하고 화면을 닫는다. 추측으로 PASS 처리하지
  않는다.
- [ ] 모바일 확인은 `READY_FOR_LAPTOP`, `HOLD` 또는 `STOP`만 낸다.
  `READY_FOR_LAPTOP`은 결제 승인이나 launch `GO`가 아니다.

## Mobile owner — read-only checks

어떤 항목도 수정하거나 저장하지 않는다. 전체 SHA, endpoint ID, 주소 또는
식별자를 체크리스트에 옮기지 않고 화면끼리 육안 비교한 결과만 기록한다.

### Vercel

- [ ] 올바른 team과 Hoju Compass project임을 화면 제목으로 확인한다.
- [ ] Production deployment가 성공 상태이고, 화면의 전체 Source SHA가
  별도로 승인된 후보의 전체 SHA와 한 글자도 빠짐없이 일치하는지 육안으로
  비교한다. branch, deployment URL, alias, 시간 또는 성공 배지만으로
  대체하지 않는다.
- [ ] Production과 Preview 범위가 구분되어 있고 Preview가 보호 상태임을
  확인한다. Preview 페이지나 bypass 기능을 열어 보지 않는다.
- [ ] Production 환경 설정은 필요한 **이름이 존재하는 상태**만 확인한다.
  값 표시, reveal, edit, copy, redeploy 또는 promotion을 누르지 않는다.
- [ ] 공개 Resume Pro 화면이 아직 결제 준비 중 상태인지 GET으로만 확인한다.
  Checkout, restore, form 제출 또는 결제 링크 열기를 시도하지 않는다.

### Stripe

- [ ] 올바른 Hoju Compass 계정과 live mode 표시를 확인하고, 다른 계정이나
  test mode이면 `STOP`한다.
- [ ] account status 화면에서 결제·정산 capability가 제한 또는 paused로
  표시되지 않고 미해결 identity/compliance task가 없는지 상태만 확인한다.
- [ ] business profile의 구매자 지원 연락처가 configured 상태인지 확인하되
  주소 값을 열거나 복사하지 않는다.
- [ ] webhook endpoint와 required subscription이 enabled 상태인지 요약
  화면에서만 확인한다. endpoint URL, signing secret, event/customer/payment
  상세 화면은 열지 않는다.
- [ ] API key 화면, 고객 목록, PaymentIntent·Charge·refund·payout 상세,
  receipt/invoice 원문은 휴대폰에서 열지 않는다. 결제·환불·dispute 또는
  payout 작업 버튼을 누르지 않는다.

### Neon

- [ ] 올바른 Hoju Compass project와 Production의 Primary branch/compute가
  선택되어 있고 active 상태인지 확인한다.
- [ ] branch/compute에 경고, suspended 또는 unavailable 상태가 없는지
  확인한다. endpoint ID는 승인된 기준과 육안 비교만 하고 기록하지 않는다.
- [ ] connection details, password, database URL, SQL editor, role/privilege,
  migration 또는 reset 화면은 열거나 실행하지 않는다.
- [ ] exact endpoint, migration, role separation과 effective write denial은
  모바일에서 PASS 처리하지 않고 보호된 노트북 preflight로 넘긴다.

### Mobile status-only summary

각 값은 `PASS`, `HOLD`, `STOP` 중 하나만 사용한다. 설명, ID, URL, 계정명,
시간, 화면 캡처 또는 원문을 붙이지 않는다.

```text
MOBILE_OWNER_READINESS=READY_FOR_LAPTOP|HOLD|STOP
vercel=PASS|HOLD|STOP
stripe=PASS|HOLD|STOP
neon=PASS|HOLD|STOP
secrets_copied=no pii_opened=no changes_made=no payment_attempted=no refund_attempted=no contact_attempted=no
```

세 서비스가 모두 `PASS`이고 모든 `no` 경계가 유지될 때만
`READY_FOR_LAPTOP`을 선택한다. 하나라도 미확인하면 `HOLD`, 잘못된 범위나
민감정보 노출·변경 위험이 있으면 `STOP`한다.

## Agent — local, no-credential work

- [ ] 에이전트는 repository의 코드·문서·commit ancestry와 계약 검사만
  읽는다. Vercel, Stripe, Neon, mailbox 또는 고객 시스템에 로그인하지
  않고 환경변수, secret store, clipboard 또는 브라우저 세션을 읽지 않는다.
- [ ] 에이전트는 이 문서의 독립 계약 검사를 로컬에서 실행할 수 있다:
  `node scripts/check-first-sale-mobile-owner-checklist.mjs`.
- [ ] 에이전트는 후보 SHA와 문서·검사 결과를 비민감 상태로 보고할 수 있지만
  Production promotion, 설정 변경, 결제, 환불, 고객 연락, 세무 판단 또는
  gate 승인을 수행하지 않는다.
- [ ] 에이전트 결과는 휴대폰 관찰이나 보호된 노트북 preflight를 대체하지
  않으며 독자적으로 어떤 live gate도 PASS로 만들지 않는다.

## Owner laptop — protected operations

- [ ] 휴대폰 결과가 `READY_FOR_LAPTOP`이어도 payments-off 상태를 유지한다.
- [ ] 신뢰할 수 있는 소유자 노트북에서
  `docs/live-payment-launch-checklist.md`의 통합 Production preflight 절차를
  따른다. 자격증명은 승인된 wrapper의 masked prompt에만 직접 입력하고
  shell history, 명령 인자, 파일, clipboard, chat 또는 에이전트에 전달하지
  않는다.
- [ ] 정확한 최종 `FIRST_SALE_PREFLIGHT=PASS` 상태만 인정한다. 중단, 누락,
  FAIL 또는 supporting line만 있으면 `HOLD`다.
- [ ] 승인된 private accounting 위치에서만 아래 독립 결과를 확인한다.
  값, 원본 문서, 고객정보, 금액, 은행정보와 전체 식별자는 이 체크리스트에
  옮기지 않는다.
  - `REGISTERED_TAX_AGENT_HANDOFF_GATE=PASS`
  - `CONTROLLED_PAYMENT_RECONCILIATION=PASS`
  - `CUSTOMER_DOCUMENT_TRUST_GATE=GO`
  - `PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS`
- [ ] 위 결과 중 하나라도 없거나 HOLD/STOP/NO-GO이면 첫 결제는 `NO-GO`다.
  새 결제, 환불, 이메일·메시지 전송 또는 외부 문의로 증거를 즉석에서
  만들지 말고 해당 owner에게 인계한다.

### One-screen first-sale operating order

아래는 25 August 현재의 비민감 상태와 다음 순서다. 휴대폰에서는 상태와
담당 인계만 확인하며, 키 생성·preflight·SMTP·rehearsal·승인·결제는 실행하지
않는다. 전체 SHA와 key 값은 이 화면에 옮기지 않는다.

| # | 현재 상태 | 담당 위치 | 다음 단계와 PASS 경계 |
| --- | --- | --- | --- |
| 0 | `DONE` | local evidence / owner | Production exact-SHA identity, payment-off Checkout HTTP 503/no URL, 전체 quality gate가 각각 PASS다. 이 세 결과는 아래 미완료 gate를 대신하지 않는다. |
| 1 | `HOLD` | payment operator | Stripe 지원 회신을 확인한다. 회신은 키 생성 절차의 입력일 뿐 restricted-key PASS가 아니다. key·URL·계정값을 메일·채팅·이 표에 복사하지 않는다. |
| 2 | `HOLD` | owner laptop | Account Read 전용 audit key와 Balance Transactions Read 전용 accounting key를 각각 만들고 runtime key와 서로 다른 세 `rk_live_` 역할임을 masked wrapper 안에서만 확인한다. 생성 사실만으로 PASS 처리하지 않는다. |
| 3 | `HOLD` | owner laptop | payments off 상태에서 통합 Production preflight를 실행한다. 정확한 최종 `FIRST_SALE_PREFLIGHT=PASS` 한 줄만 PASS이며 중단·누락·FAIL은 `HOLD`다. |
| 4 | `HOLD` | mailbox owner / owner laptop | no-send SMTP 인증 PASS 뒤 별도 승인된 labelled non-customer test의 실제 mailbox 수신까지 확인한다. 설정 존재나 send 결과만으로 수신 PASS를 만들지 않는다. |
| 5 | `HOLD` | technical owner / owner laptop | payments off 상태에서 승인된 Production rehearsal을 수행하고 정확한 `PRODUCTION_PAYMENT_PATH_EVIDENCE=PASS`를 확인한다. Preview rehearsal이나 Production zero-row는 대체 증거가 아니다. |
| 6 | `NO-GO` | business owner | 위 1~5와 기존 tax/customer-document/support gate를 모두 검토한 뒤 한 건의 첫 판매만 명시적으로 승인한다. 증거가 하나라도 `HOLD/STOP/MISSING/FAIL`이면 승인하지 않는다. |
| 7 | `NOT_STARTED` | payment → technical → accounting owner | 첫 실제 고객 결제 후 15분에는 paid/webhook/`LOCKED`/entitlement/outbox/mailbox/access를, 24시간에는 gross·표시 GST·fee·refund·ending balance·문서를, 첫 payout에는 itemised payout·은행 입금·clearing 차이 ±A$0.01을 순서대로 대사한다. 환불은 원거래 보존·실제 조정·접근 revoke/review를 연결하고 자동 reopen하지 않으며, 접근 문제는 재결제 없이 entitlement/access/restore 경로로 인계한다. |

현재 상태의 고정 요약은 다음과 같다. `DONE`을 아래 `HOLD`로 전파하지
않고, 첫 고객 결제 전에는 `POST_SALE_EVIDENCE=NOT_STARTED`를 유지한다.

```text
DEPLOYMENT_IDENTITY=PASS
CHECKOUT_OFF_BOUNDARY=PASS
LOCAL_QUALITY_GATE=PASS
STRIPE_SUPPORT_REPLY=HOLD
RESTRICTED_KEY_SET=HOLD
INTEGRATED_PREFLIGHT=HOLD
SMTP_RECEIPT=HOLD
PRODUCTION_REHEARSAL=HOLD
FIRST_SALE_OWNER_DECISION=NO-GO
POST_SALE_EVIDENCE=NOT_STARTED
SECOND_SALE=HOLD
```

## Status-only handoff

최종 소유자 기록에는 아래 상태만 남긴다. 모바일 결과나 이 문서만으로
첫 결제 승인 상태를 기록할 수 없다.

```text
MOBILE_OWNER_READINESS=READY_FOR_LAPTOP|HOLD|STOP
LAPTOP_PREFLIGHT=PASS|HOLD|STOP
PAYMENTS_OFF=PASS|HOLD|STOP
TAX_AGENT_HANDOFF=PASS|HOLD|STOP
CONTROLLED_RECONCILIATION=PASS|HOLD|STOP
CUSTOMER_DOCUMENTS=GO|NO-GO|STOP
SUPPORT_ALERTS=PASS|HOLD|STOP
FIRST_SALE_OWNER_DECISION=NO-GO
```

별도 owner가 모든 필수 private 증거와 정확한 통합 preflight 결과를 검토한
뒤에만 기존 launch 절차에서 결정을 기록한다. 이 체크리스트는 결제 switch,
실결제, 환불, 고객 연락, 외부 제출 또는 설정 변경을 승인하지 않는다.
