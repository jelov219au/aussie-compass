import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const card = await readFile(
  new URL("../docs/first-sale-mobile-incident-card.md", import.meta.url),
  "utf8",
);
const compact = card.replace(/\s+/g, " ");

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
  "SIGNED_WEBHOOK=PASS|HOLD|STOP",
  "ENTITLEMENT_ACCESS=PASS|HOLD|STOP",
  "REFUND_DISPUTE_SOURCE=PASS|HOLD|STOP",
  "SUPPORT_ALERT=PASS|HOLD|STOP",
  "ACCOUNTING_LINK=PASS|HOLD|STOP",
  "CUSTOMER_DOCUMENT_ROUTE=PASS|HOLD|STOP",
  "DATA_MINIMISATION=PASS|HOLD|STOP",
  "PRIMARY_HANDOFF=NONE|SUPPORT_OWNER|TECHNICAL_OWNER|PAYMENT_OPERATOR|ACCOUNTING_OPERATOR|BUSINESS_OWNER|SECURITY_OWNER",
  "SECOND_SALE=HOLD",
]) assert.ok(card.includes(field), `mobile incident card is missing fixed field: ${field}`);

for (const boundary of [
  "고객의 환불 **요청**은 환불 **완료** 증거가 아니다",
  "접근 문제가 있다는 사실도 결제 실패나 환불 사유를 자동으로 증명하지 않는다",
  "15분까지 미수신",
  "원 gross를 보존하고 실제 refund/dispute만 별도 조정으로 연결",
  "실제 발행 문서의 seller·issuer·support route 상태가 기존 9행 gate와 일치",
  "하나라도 `STOP`이면 전체 `STOP`",
  "수동 owner 승인으로 `HOLD`나 `STOP`을 PASS로 덮어쓰지 않는다",
  "여러 문제가 동시에 보이면 아래 위에서부터 처음 일치하는 역할 하나만",
  "이 카드는 메시지를 보내지 않음",
  "전부 PASS여도 이 카드를 재판매 승인으로 사용하지 않고",
]) assert.ok(compact.includes(boundary), `mobile incident card is missing fail-closed boundary: ${boundary}`);

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
  /\b(?:AUD|A\$|\$)\s*\d/i,
]) assert.doesNotMatch(card, forbidden, `mobile incident card contains forbidden raw data pattern: ${forbidden}`);

assert.ok(!card.includes("SECOND_SALE=PASS"));
assert.ok(!card.includes("PRIMARY_HANDOFF=APPROVED"));
assert.ok(card.includes("node scripts/check-first-sale-mobile-incident-card.mjs"));

console.log("First-sale mobile refund/access/support incident card contract passed.");
