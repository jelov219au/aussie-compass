import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checklist = await readFile(
  new URL("../docs/first-sale-mobile-owner-checklist.md", import.meta.url),
  "utf8",
);
const compact = checklist.replace(/\s+/g, " ");

for (const heading of [
  "# First-sale mobile owner checklist",
  "## Scope and hard stop",
  "## Mobile owner — read-only checks",
  "### Vercel",
  "### Stripe",
  "### Neon",
  "### Mobile status-only summary",
  "## Agent — local, no-credential work",
  "## Owner laptop — protected operations",
  "## Status-only handoff",
]) assert.ok(checklist.includes(heading), `mobile owner checklist is missing heading: ${heading}`);

for (const boundary of [
  "모바일 확인은 `READY_FOR_LAPTOP`, `HOLD` 또는 `STOP`만 낸다",
  "`READY_FOR_LAPTOP`은 결제 승인이나 launch `GO`가 아니다",
  "전체 Source SHA",
  "branch, deployment URL, alias, 시간 또는 성공 배지만으로 대체하지 않는다",
  "reveal, edit, copy, redeploy 또는 promotion을 누르지 않는다",
  "다른 계정이나 test mode이면 `STOP`",
  "결제·정산 capability가 제한 또는 paused로 표시되지 않고",
  "API key 화면, 고객 목록",
  "Production의 Primary branch/compute",
  "SQL editor, role/privilege, migration 또는 reset 화면은 열거나 실행하지 않는다",
  "보호된 노트북 preflight로 넘긴다",
  "node scripts/check-first-sale-mobile-owner-checklist.mjs",
  "환경변수, secret store, clipboard 또는 브라우저 세션을 읽지 않는다",
  "masked prompt",
  "정확한 최종 `FIRST_SALE_PREFLIGHT=PASS` 상태만 인정한다",
  "PAYMENTS_OFF=PASS|HOLD|STOP",
  "CUSTOMER_DOCUMENTS=GO|NO-GO|STOP",
  "FIRST_SALE_OWNER_DECISION=NO-GO",
]) assert.ok(compact.includes(boundary), `mobile owner checklist is missing boundary: ${boundary}`);

for (const gate of [
  "REGISTERED_TAX_AGENT_HANDOFF_GATE=PASS",
  "CONTROLLED_PAYMENT_RECONCILIATION=PASS",
  "CUSTOMER_DOCUMENT_TRUST_GATE=GO",
  "PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS",
]) assert.ok(checklist.includes(gate), `mobile owner checklist is missing independent gate: ${gate}`);

for (const noAction of [
  "secrets_copied=no",
  "pii_opened=no",
  "changes_made=no",
  "payment_attempted=no",
  "refund_attempted=no",
  "contact_attempted=no",
]) assert.ok(checklist.includes(noAction), `mobile status summary is missing: ${noAction}`);

const mobileSection = checklist.slice(
  checklist.indexOf("## Mobile owner — read-only checks"),
  checklist.indexOf("## Agent — local, no-credential work"),
);
assert.doesNotMatch(
  mobileSection,
  /\b(?:npm|node|PowerShell|pwsh|CLI|curl)\b/i,
  "the mobile section must not ask the owner to run laptop or agent commands",
);

for (const forbidden of [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /https?:\/\/[^\s)]+/i,
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
  /\bwhsec_[A-Za-z0-9_]+\b/,
  /postgres(?:ql)?:\/\/[^\s"']+/i,
  /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_|txn_)[A-Za-z0-9_]{8,}\b/,
  /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/,
]) assert.doesNotMatch(checklist, forbidden, `mobile owner checklist contains forbidden raw data pattern: ${forbidden}`);

assert.ok(checklist.includes("docs/live-payment-launch-checklist.md"));
assert.ok(!checklist.includes("FIRST_SALE_OWNER_DECISION=APPROVED"));

console.log("First-sale mobile owner checklist contract passed.");
