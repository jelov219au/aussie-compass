import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [card, ownerChecklist] = await Promise.all([
  readFile(new URL("../docs/first-sale-mobile-incident-card.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-sale-mobile-owner-checklist.md", import.meta.url), "utf8"),
]);
const compact = card.replace(/\s+/g, " ");
const compactOwnerChecklist = ownerChecklist.replace(/\s+/g, " ");

for (const heading of [
  "# First-sale mobile incident card",
  "## Hard privacy and action boundary",
  "## One-minute status card",
  "## PASS, HOLD and STOP rules",
  "## Primary handoff",
  "## Mobile handoff sequence",
]) assert.ok(card.includes(heading), `mobile incident card is missing heading: ${heading}`);

for (const reference of [
  "/payment-help",
  "docs/payment-alerts.md",
  "docs/accounting-reconciliation.md",
  "docs/first-payment-24-hour-operations-packet.md",
]) assert.ok(card.includes(reference), `mobile incident card is missing role boundary: ${reference}`);

for (const field of [
  "POST_FIRST_SALE_INCIDENT=PASS|HOLD|STOP",
  "PAYMENT_SOURCE=PASS|HOLD|STOP",
  "EVIDENCE_SUFFIX=........|MISSING",
  "OBSERVED_AT_UTC=YYYY-MM-DDTHH:MM:SSZ|MISSING",
  "SIGNED_WEBHOOK=PASS|HOLD|STOP",
  "ENTITLEMENT_ACCESS=PASS|HOLD|STOP",
  "REFUND_DISPUTE_SOURCE=PASS|HOLD|STOP",
  "SUPPORT_ALERT=PASS|HOLD|STOP",
  "ACCOUNTING_LINK=PASS|HOLD|STOP",
  "CUSTOMER_DOCUMENT_ROUTE=PASS|HOLD|STOP",
  "TRANSACTION_SELLER=PRESENT|ABSENT|UNVERIFIED",
  "DOCUMENT_ISSUER=PRESENT|ABSENT|UNVERIFIED",
  "PRICE_CURRENCY_MATCH=PASS|HOLD|STOP",
  "TAX_DISPLAY=PASS|HOLD|STOP",
  "TRANSACTION_SUPPORT_ROUTE=PRESENT|ABSENT|UNVERIFIED",
  "REFUND_STATE=none_confirmed|refund_request_pending|partial_refund_succeeded|full_refund_succeeded|unresolved",
  "DATA_MINIMISATION=PASS|HOLD|STOP",
  "PRIMARY_HANDOFF=NONE|SUPPORT_OWNER|TECHNICAL_OWNER|PAYMENT_OPERATOR|ACCOUNTING_OPERATOR|BUSINESS_OWNER|SECURITY_OWNER",
  "SECOND_SALE=HOLD",
]) assert.ok(card.includes(field), `mobile incident card is missing fixed field: ${field}`);

for (const boundary of [
  "고객의 환불 **요청**은 환불 **완료** 증거가 아니다",
  "접근 문제가 있다는 사실도 결제 실패나 환불 사유를 자동으로 증명하지 않는다",
  "15분까지 미수신",
  "원 gross를 보존하고 실제 refund/dispute만 별도 조정으로 연결",
  "seller·issuer·support route 집계가 모두 `PRESENT`이고 기존 9행 gate와 일치",
  "기존 9행 customer-document packet을 반복하지 않는다",
  "고정 예상 가격 **A$19.90 AUD** 일치 여부만 상태로 기록",
  "`PASS`는 세금 책임·BAS·회계 결론이 아니며",
  "`none_confirmed`는 닫힌 source window가 있을 때만 사용",
  "suffix 하나와 UTC 관찰 시각만 존재",
  "휴대폰에서는 Stripe 고객·거래 상세, Checkout, receipt, invoice, tax report 또는 고객별 문서 화면을 열지 않는다",
  "승인된 private-source 담당자가 통제된 기기에서 원본을 확인하고 마지막 8자 suffix 하나, UTC 관찰 시각 하나와 아래 고정 상태만 전달한다",
  "모바일 운영자는 전달받은 허용 필드 외에 고객·거래·문서 정보를 추가로 요청하지 않는다",
  "하나라도 `STOP`이면 전체 `STOP`",
  "수동 owner 승인으로 `HOLD`나 `STOP`을 PASS로 덮어쓰지 않는다",
  "여러 문제가 동시에 보이면 아래 위에서부터 처음 일치하는 역할 하나만",
  "이 카드는 메시지를 보내지 않음",
  "전부 PASS여도 이 카드를 재판매 승인으로 사용하지 않고",
]) assert.ok(compact.includes(boundary), `mobile incident card is missing fail-closed boundary: ${boundary}`);

assert.ok(
  compactOwnerChecklist.includes("고객·거래·문서 식별자와 고객별 화면은 열거나 기록하지 않는다"),
  "mobile owner checklist must keep its customer-detail prohibition",
);
assert.ok(
  !compact.includes("승인된 live mode에서 첫 Resume Pro 원거래와 실제 발행 문서를 읽기 전용으로 확인한다"),
  "mobile incident operator must not be told to open customer transaction artifacts",
);

for (const owner of [
  "`SECURITY_OWNER`",
  "`TECHNICAL_OWNER`",
  "`BUSINESS_OWNER`",
  "`PAYMENT_OPERATOR`",
  "`ACCOUNTING_OPERATOR`",
  "`SUPPORT_OWNER`",
  "`NONE`",
]) assert.ok(card.includes(owner), `mobile incident card is missing handoff owner: ${owner}`);

for (const forbidden of [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /https?:\/\/[^\s)]+/i,
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
  /\bwhsec_[A-Za-z0-9_]+\b/,
  /postgres(?:ql)?:\/\/[^\s"']+/i,
  /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_|txn_)[A-Za-z0-9_]{8,}\b/,
  /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/,
]) assert.doesNotMatch(card, forbidden, `mobile incident card contains forbidden raw data pattern: ${forbidden}`);

assert.equal((card.match(/A\$19\.90 AUD/g) ?? []).length, 1, "the fixed expected product price may appear once and must not be copied as observed transaction data");
const cardWithoutExpectedPrice = card.replace("A$19.90 AUD", "");
assert.doesNotMatch(
  cardWithoutExpectedPrice,
  /(?:A\$|\$)\s*\d|\b\d+(?:\.\d{1,2})?\s*AUD\b/i,
  "the mobile card must not contain any other amount",
);
assert.ok(card.includes("전체 ID나 여러 suffix를 기록하지 않음"));
assert.ok(card.includes("금액 원문을 카드에 복사"));
assert.ok(card.includes("주소·URL을 복사하지 않고"));

assert.ok(!card.includes("SECOND_SALE=PASS"));
assert.ok(!card.includes("PRIMARY_HANDOFF=APPROVED"));
assert.ok(card.includes("node scripts/check-first-sale-mobile-incident-card.mjs"));

console.log("First-sale mobile refund/access/support incident card contract passed.");
