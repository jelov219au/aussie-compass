# First-sale mobile incident card

첫 실제 Resume Pro 결제 직후 승인된 private-source 담당자가 확인한 고객
문서·가격·세금 표시와 환불·접근·고객지원 상태를 인계받는 모바일용
**상태-only** 카드다.
이 카드는 `/payment-help`의 고객 안내,
`docs/payment-alerts.md`의 webhook·outbox·mailbox 증거,
`docs/accounting-reconciliation.md`의 원거래·조정·payout 대사,
`docs/first-payment-24-hour-operations-packet.md`의 15분·24시간·첫 payout
packet을 대체하지 않는다. 원본 증거는 승인된 private 위치와 원래 시스템에
남기고 이 카드에는 상태와 담당 handoff만 기록한다.

## Hard privacy and action boundary

- 고객 이름·연락처·주소, 구매 이메일, 이메일 제목·본문, 이력서·문서 원문,
  금액·통화 원문, 카드·은행정보, 전체 Stripe·주문·사건 식별자, URL,
  키·secret·cookie·복구 코드를 복사하거나 기록하지 않는다. 이 카드에 허용되는
  참조는 같은 원거래 chain의 마지막 8자 suffix 하나, 관찰 UTC 시각 하나와
  아래 고정 상태뿐이다.
- 휴대폰에서는 결제, 환불, dispute 응답, payout, entitlement 변경, gate
  reopen, 이메일·메시지 전송, 외부 제출 또는 설정 변경을 실행하지 않는다.
- 휴대폰에서는 Stripe 고객·거래 상세, Checkout, receipt, invoice, tax report
  또는 고객별 문서 화면을 열지 않는다. 승인된 private-source 담당자가 통제된
  기기에서 원본을 확인하고 마지막 8자 suffix 하나, UTC 관찰 시각 하나와 아래
  고정 상태만 전달한다.
- 화면의 원문을 이 카드에 옮기지 않는다. 모바일 운영자는 전달받은 허용 필드
  외에 고객·거래·문서 정보를 추가로 요청하지 않는다.
- 원본을 열 수 없거나 결과가 서로 다르거나 아직 pending이면 `HOLD`다.
  개인정보·비밀값 노출, 잘못된 계정/mode/product, 실제 paid 상태와
  entitlement/access의 충돌 또는 첫 15분 필수 증거 실패는 `STOP`이다.
- 고객의 환불 **요청**은 환불 **완료** 증거가 아니다. 접근 문제가 있다는
  사실도 결제 실패나 환불 사유를 자동으로 증명하지 않는다.

## One-minute status card

아래 고정 필드만 사용한다. 설명, 원인, 수량, 전체 식별자 또는 고객 메시지를
추가하지 않는다. suffix는 정확히 마지막 8자만, 시각은 관찰 시각을 UTC
`YYYY-MM-DDTHH:MM:SSZ`로만 기록한다.

```text
POST_FIRST_SALE_INCIDENT=PASS|HOLD|STOP
EVIDENCE_SUFFIX=........|MISSING
OBSERVED_AT_UTC=YYYY-MM-DDTHH:MM:SSZ|MISSING
PAYMENT_SOURCE=PASS|HOLD|STOP
SIGNED_WEBHOOK=PASS|HOLD|STOP
ENTITLEMENT_ACCESS=PASS|HOLD|STOP
REFUND_DISPUTE_SOURCE=PASS|HOLD|STOP
SUPPORT_ALERT=PASS|HOLD|STOP
ACCOUNTING_LINK=PASS|HOLD|STOP
CUSTOMER_DOCUMENT_ROUTE=PASS|HOLD|STOP
TRANSACTION_SELLER=PRESENT|ABSENT|UNVERIFIED
DOCUMENT_ISSUER=PRESENT|ABSENT|UNVERIFIED
PRICE_CURRENCY_MATCH=PASS|HOLD|STOP
TAX_DISPLAY=PASS|HOLD|STOP
TRANSACTION_SUPPORT_ROUTE=PRESENT|ABSENT|UNVERIFIED
REFUND_STATE=none_confirmed|refund_request_pending|partial_refund_succeeded|full_refund_succeeded|unresolved
DATA_MINIMISATION=PASS|HOLD|STOP
PRIMARY_HANDOFF=NONE|SUPPORT_OWNER|TECHNICAL_OWNER|PAYMENT_OPERATOR|ACCOUNTING_OPERATOR|BUSINESS_OWNER|SECURITY_OWNER
SECOND_SALE=HOLD
```

`POST_FIRST_SALE_INCIDENT=PASS`는 각 증거 chain이 현재 서로 일치한다는
뜻일 뿐이다. 환불, 고객 답변, 장부 입력, entitlement 변경이나 다음 판매를
승인하지 않는다. 첫 payout까지 기존 packet이 완료되고 별도 owner 승인이
있기 전에는 `SECOND_SALE=HOLD`를 바꾸지 않는다.

### Immediate document and accounting summary

이 요약은 기존 9행 customer-document packet을 반복하지 않는다. 승인된
private-source 담당자가 통제된 기기에서 Checkout과 실제 발행 문서를 읽기
전용으로 확인하고, 모바일 운영자는 아래 집계 상태만 카드에 옮긴다.

| Field | 기록 기준 | Fail-closed 경계 |
| --- | --- | --- |
| `EVIDENCE_SUFFIX` | 같은 live Resume Pro 원거래 chain의 마지막 8자 하나 | 원거래 연결을 확인할 수 없으면 `MISSING`; 전체 ID나 여러 suffix를 기록하지 않음 |
| `OBSERVED_AT_UTC` | 이 카드 상태를 원본과 대조한 단일 UTC 관찰 시각 | 거래 시각으로 추정하거나 지역 시각을 섞지 않음 |
| `TRANSACTION_SELLER` | Checkout과 모든 실제 발행 문서의 seller 상태를 기존 9행 packet 기준으로 집계 | 한 행이라도 `ABSENT/UNVERIFIED`, 발행 문서 집합 미확정 또는 artifact 간 불일치면 `PRESENT` 금지 |
| `DOCUMENT_ISSUER` | 모든 실제 발행 문서의 issuer 상태를 기존 9행 packet 기준으로 집계 | 미발행 여부를 추정하거나 다른 artifact에서 복사하면 `UNVERIFIED` |
| `PRICE_CURRENCY_MATCH` | 고객 화면의 고정 예상 가격 **A$19.90 AUD** 일치 여부만 상태로 기록 | 금액 원문을 카드에 복사하거나 amount만으로 원거래를 연결하지 않음 |
| `TAX_DISPLAY` | 고객 화면의 tax-inclusive/GST 표시와 실제 발행 문서의 일치 여부만 상태로 기록 | `PASS`는 세금 책임·BAS·회계 결론이 아니며 불명확하면 `HOLD` |
| `TRANSACTION_SUPPORT_ROUTE` | Checkout과 모든 실제 발행 문서의 거래 지원 경로 상태를 기존 9행 packet 기준으로 집계 | 주소·URL을 복사하지 않고, 제품 지원을 거래 지원으로 추정하지 않음 |
| `REFUND_STATE` | dated private source의 기존 회계 enum을 그대로 선택 | 요청을 성공으로 바꾸지 않음. `none_confirmed`는 닫힌 source window가 있을 때만 사용하고 즉시 확인만으로는 `unresolved` 유지 |

seller·issuer·지원 경로의 실제 명칭이나 값, 금액·세금 원문과 문서 URL은 원래
시스템과 승인된 private packet에만 남긴다. 이 카드의 집계 상태는 9행
`CUSTOMER_DOCUMENT_TRUST_GATE`, 15분·24시간·첫 payout 증거 또는 장부 분개를
대체하지 않는다.

## PASS, HOLD and STOP rules

| Field | `PASS` | `HOLD` | `STOP` |
| --- | --- | --- | --- |
| `PAYMENT_SOURCE` | 승인된 private 원본이 live paid Resume Pro 원거래를 확인 | 원본 미열람, pending 또는 mode/product 미확정 | 서로 다른 원거래, wrong mode/product 또는 paid 여부 충돌 |
| `SIGNED_WEBHOOK` | 서명 검증된 결제 event와 처리 결과가 private packet에서 확인 | 처리 중이거나 결과 미확인 | 서명 실패, 처리 실패 또는 결제 source와 event 불일치 |
| `ENTITLEMENT_ACCESS` | paid·entitlement·access 상태가 서로 일치 | 접근 문제 조사 중 또는 한 상태 미확인 | paid인데 entitlement/access가 충돌하거나 잘못된 상품 접근이 열림 |
| `REFUND_DISPUTE_SOURCE` | 실제 refund/dispute 없음이 dated source에서 확인되거나, 실제 사건과 entitlement·accounting 조정이 일치 | 요청만 존재, pending, partial/full/dispute 상태 또는 후속 결과 미확인 | 완료된 full refund 뒤 entitlement active, 중복 조정 또는 원거래 연결 실패 |
| `SUPPORT_ALERT` | 예상 결제·환불 alert가 단일 logical incident로 mailbox에 확인 | 15분 안에서 pending/busy/delivery 확인 중 | 15분까지 미수신, 잘못된 product 분류 또는 webhook/outbox/mailbox chain 불일치 |
| `ACCOUNTING_LINK` | 원 gross를 보존하고 실제 refund/dispute만 별도 조정으로 연결 | fee, refund, balance 또는 payout source가 아직 미확정 | payout을 매출로 기록, 원 gross 삭제, 중복 조정 또는 원거래 chain 단절 |
| `CUSTOMER_DOCUMENT_ROUTE` | seller·issuer·support route 집계가 모두 `PRESENT`이고 기존 9행 gate와 일치 | 문서 미열람·미발행 여부 미확정, 집계 `ABSENT/UNVERIFIED` 또는 9행 gate 미완료 | 다른 문서에서 추정하거나 seller·issuer·support route가 서로 충돌 |
| `DATA_MINIMISATION` | 고정 상태, suffix 하나와 UTC 관찰 시각만 존재 | 불필요한 정보 포함 여부 미확인 | 고객정보, 금액·세금 원문, 전체 식별자, URL, key 또는 이메일 원문이 카드에 들어옴 |

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

1. 휴대폰에서는 첫 Resume Pro 고객·거래·문서 상세 화면을 열지 않고, 공개
   `/payment-help`나 고객 메시지에서도 내용을 복사하지 않는다.
2. 승인된 private-source 담당자가 통제된 기기에서 live 원거래와 실제 발행
   문서를 확인해 suffix 하나, UTC 관찰 시각 하나와 고정 상태만 전달한다.
3. 모바일 운영자는 전달받은 suffix·UTC 시각과 seller, issuer, 고정 가격·통화,
   tax/GST 표시, 거래 지원 경로와 refund 상태의 고정 field만 기록한다.
4. 승인된 담당자가 private 원본과 기존 packet에서 고정 field 결과를 확인할 때까지
   `POST_FIRST_SALE_INCIDENT=HOLD`, `SECOND_SALE=HOLD`를 유지한다.
5. 받은 상태를 카드에 선택하고 우선순위에 따라 `PRIMARY_HANDOFF` 하나를
   지정한다. customer reply, refund decision 또는 기술 조치를 쓰지 않는다.
6. `STOP`이면 즉시 두 번째 판매를 닫은 상태로 security/technical/business
   owner에게 인계한다. `HOLD`이면 지정 owner의 확인을 기다린다.
7. 전부 PASS여도 이 카드를 재판매 승인으로 사용하지 않고 기존 24시간 및
   첫 payout 증거 절차로 넘긴다.

로컬 계약 검사는
`node scripts/check-first-sale-mobile-incident-card.mjs`로 실행한다. 이 검사는
문서만 읽으며 Stripe, mailbox, 고객 시스템, 환경변수 또는 private packet을
열지 않는다.
