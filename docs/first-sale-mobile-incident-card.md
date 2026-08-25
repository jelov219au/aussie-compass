# First-sale mobile incident card

첫 실제 Resume Pro 결제 직후 환불, 접근 또는 고객지원 문제가 보일 때 쓰는
모바일용 **상태-only** 카드다. 이 카드는 `/payment-help`의 고객 안내,
`docs/payment-alerts.md`의 webhook·outbox·mailbox 증거,
`docs/accounting-reconciliation.md`의 원거래·조정·payout 대사,
`docs/first-payment-24-hour-operations-packet.md`의 15분·24시간·첫 payout
packet을 대체하지 않는다. 원본 증거는 승인된 private 위치와 원래 시스템에
남기고 이 카드에는 상태와 담당 handoff만 기록한다.

## Hard privacy and action boundary

- 고객 이름·연락처·주소, 구매 이메일, 이메일 제목·본문, 이력서·문서 원문,
  금액·통화, 카드·은행정보, 전체 또는 축약 Stripe·주문·사건 식별자, URL,
  키·secret·cookie·복구 코드를 열거나 복사하거나 기록하지 않는다.
- 휴대폰에서는 결제, 환불, dispute 응답, payout, entitlement 변경, gate
  reopen, 이메일·메시지 전송, 외부 제출 또는 설정 변경을 실행하지 않는다.
- 화면의 원문을 이 카드에 옮기지 않는다. 승인된 owner가 private 원본에서
  확인한 결과를 `PASS`, `HOLD`, `STOP` 중 하나로만 전달받는다.
- 원본을 열 수 없거나 결과가 서로 다르거나 아직 pending이면 `HOLD`다.
  개인정보·비밀값 노출, 잘못된 계정/mode/product, 실제 paid 상태와
  entitlement/access의 충돌 또는 첫 15분 필수 증거 실패는 `STOP`이다.
- 고객의 환불 **요청**은 환불 **완료** 증거가 아니다. 접근 문제가 있다는
  사실도 결제 실패나 환불 사유를 자동으로 증명하지 않는다.

## One-minute status card

아래 고정 필드만 사용한다. 설명, 원인, 시각, 수량, 식별자 또는 고객 메시지를
추가하지 않는다.

```text
POST_FIRST_SALE_INCIDENT=PASS|HOLD|STOP
PAYMENT_SOURCE=PASS|HOLD|STOP
SIGNED_WEBHOOK=PASS|HOLD|STOP
ENTITLEMENT_ACCESS=PASS|HOLD|STOP
REFUND_DISPUTE_SOURCE=PASS|HOLD|STOP
SUPPORT_ALERT=PASS|HOLD|STOP
ACCOUNTING_LINK=PASS|HOLD|STOP
CUSTOMER_DOCUMENT_ROUTE=PASS|HOLD|STOP
DATA_MINIMISATION=PASS|HOLD|STOP
PRIMARY_HANDOFF=NONE|SUPPORT_OWNER|TECHNICAL_OWNER|PAYMENT_OPERATOR|ACCOUNTING_OPERATOR|BUSINESS_OWNER|SECURITY_OWNER
SECOND_SALE=HOLD
```

`POST_FIRST_SALE_INCIDENT=PASS`는 각 증거 chain이 현재 서로 일치한다는
뜻일 뿐이다. 환불, 고객 답변, 장부 입력, entitlement 변경이나 다음 판매를
승인하지 않는다. 첫 payout까지 기존 packet이 완료되고 별도 owner 승인이
있기 전에는 `SECOND_SALE=HOLD`를 바꾸지 않는다.

## PASS, HOLD and STOP rules

| Field | `PASS` | `HOLD` | `STOP` |
| --- | --- | --- | --- |
| `PAYMENT_SOURCE` | 승인된 private 원본이 live paid Resume Pro 원거래를 확인 | 원본 미열람, pending 또는 mode/product 미확정 | 서로 다른 원거래, wrong mode/product 또는 paid 여부 충돌 |
| `SIGNED_WEBHOOK` | 서명 검증된 결제 event와 처리 결과가 private packet에서 확인 | 처리 중이거나 결과 미확인 | 서명 실패, 처리 실패 또는 결제 source와 event 불일치 |
| `ENTITLEMENT_ACCESS` | paid·entitlement·access 상태가 서로 일치 | 접근 문제 조사 중 또는 한 상태 미확인 | paid인데 entitlement/access가 충돌하거나 잘못된 상품 접근이 열림 |
| `REFUND_DISPUTE_SOURCE` | 실제 refund/dispute 없음이 dated source에서 확인되거나, 실제 사건과 entitlement·accounting 조정이 일치 | 요청만 존재, pending, partial/full/dispute 상태 또는 후속 결과 미확인 | 완료된 full refund 뒤 entitlement active, 중복 조정 또는 원거래 연결 실패 |
| `SUPPORT_ALERT` | 예상 결제·환불 alert가 단일 logical incident로 mailbox에 확인 | 15분 안에서 pending/busy/delivery 확인 중 | 15분까지 미수신, 잘못된 product 분류 또는 webhook/outbox/mailbox chain 불일치 |
| `ACCOUNTING_LINK` | 원 gross를 보존하고 실제 refund/dispute만 별도 조정으로 연결 | fee, refund, balance 또는 payout source가 아직 미확정 | payout을 매출로 기록, 원 gross 삭제, 중복 조정 또는 원거래 chain 단절 |
| `CUSTOMER_DOCUMENT_ROUTE` | 실제 발행 문서의 seller·issuer·support route 상태가 기존 9행 gate와 일치 | 문서 미열람·미발행 여부 미확정 또는 9행 gate 미완료 | 다른 문서에서 추정하거나 seller·issuer·support route가 서로 충돌 |
| `DATA_MINIMISATION` | 이 카드에 상태와 handoff만 존재 | 불필요한 정보 포함 여부 미확인 | 고객정보, 금액, 식별자, URL, key 또는 이메일 원문이 카드에 들어옴 |

모든 field가 `PASS`일 때만 `POST_FIRST_SALE_INCIDENT=PASS`다. 하나라도
`STOP`이면 전체 `STOP`, 그 외 하나라도 `HOLD`이면 전체 `HOLD`다. 수동
owner 승인으로 `HOLD`나 `STOP`을 PASS로 덮어쓰지 않는다.

## Primary handoff

여러 문제가 동시에 보이면 아래 위에서부터 처음 일치하는 역할 하나만
`PRIMARY_HANDOFF`로 기록한다. 휴대폰 사용자는 해결을 시도하지 않는다.

| Priority | Condition | `PRIMARY_HANDOFF` | Owner action outside this card |
| --- | --- | --- | --- |
| 1 | 개인정보·비밀값 노출 또는 잘못된 계정/mode 의심 | `SECURITY_OWNER` | 노출 경로를 닫고 기존 incident 절차로 인계; 값을 카드에 복사하지 않음 |
| 2 | paid·webhook·entitlement·access 충돌 또는 15분 필수 chain 실패 | `TECHNICAL_OWNER` | 두 번째 판매를 닫고 private 15분 packet에서 원인을 조사 |
| 3 | refund/ACL 결정, partial/full refund, dispute 또는 chargeback 상태 | `BUSINESS_OWNER` | 제품 사실과 private source를 검토하고 승인·정책 판단을 별도 수행 |
| 4 | 거래 상태, Managed Payments 지원 route 또는 고객 문서 불명확 | `PAYMENT_OPERATOR` | 실제 발행 artifact와 거래 source를 private 위치에서 확인 |
| 5 | gross·fee·refund·balance·payout 원거래 연결 미완료 | `ACCOUNTING_OPERATOR` | 기존 reconciliation 계약으로 연결 상태만 완료 |
| 6 | 증거 chain은 일치하고 고객 문의 접수·진행 상태만 남음 | `SUPPORT_OWNER` | 승인된 지원 절차에서 답변을 준비; 이 카드는 메시지를 보내지 않음 |
| 7 | 모든 field PASS이고 열린 문의도 없음 | `NONE` | 기존 24시간·첫 payout packet을 계속 진행 |

## Mobile handoff sequence

1. 공개 `/payment-help`나 고객 메시지에서 내용을 복사하지 말고, 문의가
   있다는 사실만 인지한다.
2. 승인된 담당자가 private 원본에서 고정 field 결과만 전달할 때까지
   `POST_FIRST_SALE_INCIDENT=HOLD`, `SECOND_SALE=HOLD`를 유지한다.
3. 받은 상태를 카드에 선택하고 우선순위에 따라 `PRIMARY_HANDOFF` 하나를
   지정한다. customer reply, refund decision 또는 기술 조치를 쓰지 않는다.
4. `STOP`이면 즉시 두 번째 판매를 닫은 상태로 security/technical/business
   owner에게 인계한다. `HOLD`이면 지정 owner의 확인을 기다린다.
5. 전부 PASS여도 이 카드를 재판매 승인으로 사용하지 않고 기존 24시간 및
   첫 payout 증거 절차로 넘긴다.

로컬 계약 검사는
`node scripts/check-first-sale-mobile-incident-card.mjs`로 실행한다. 이 검사는
문서만 읽으며 Stripe, mailbox, 고객 시스템, 환경변수 또는 private packet을
열지 않는다.
