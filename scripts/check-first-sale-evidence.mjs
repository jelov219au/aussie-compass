import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  containsSensitiveEvidence,
  createFirstSaleEvidenceTemplate,
  evaluateFirstSaleEvidence,
  fifteenMinuteChecks,
  firstPayoutChecks,
  twentyFourHourChecks,
} from "./first-sale-evidence-contract.mjs";

const [packageSource, runbookSource, accountingRunbookSource, cliSource] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/accounting-reconciliation.md", import.meta.url), "utf8"),
  readFile(new URL("./verify-first-sale-evidence.mjs", import.meta.url), "utf8"),
]);
const compactRunbookSource = runbookSource.replace(/\s+/g, " ");
const compactAccountingRunbookSource = accountingRunbookSource.replace(/\s+/g, " ");

assert.ok(packageSource.includes('"first-sale:evidence": "node scripts/verify-first-sale-evidence.mjs"'));
assert.ok(packageSource.includes('"test:first-sale-evidence": "node scripts/check-first-sale-evidence.mjs"'));
for (const command of ["--template", "--phase 15m", "--phase 24h", "--phase payout"]) {
  assert.ok(runbookSource.includes(command), `the runbook is missing ${command}`);
}
for (const forbiddenBoundary of ["process.env", "fetch(", "node:child_process", "@neondatabase", "new Stripe("]) {
  assert.ok(!cliSource.includes(forbiddenBoundary), `the evidence classifier must stay local and read-only: ${forbiddenBoundary}`);
}

function passingPacket() {
  const packet = createFirstSaleEvidenceTemplate();
  packet.event_suffix = "A1B2C3D4";
  packet.paid_at = "2026-08-24T00:00:00.000Z";
  packet.fifteen_minute.observed_at = "2026-08-24T00:14:59.000Z";
  packet.twenty_four_hour.observed_at = "2026-08-25T00:00:00.000Z";
  packet.twenty_four_hour.financial_event_outcome = "none_confirmed";
  packet.twenty_four_hour.entitlement_outcome = "active";
  packet.twenty_four_hour.accounting_outcome = "no_adjustment";
  packet.twenty_four_hour.support_outcome = "no_refund_or_dispute";
  packet.first_payout.observed_at = "2026-08-26T00:00:00.000Z";
  packet.first_payout.cash_difference_cents = 1;
  for (const section of [packet.fifteen_minute, packet.twenty_four_hour, packet.first_payout]) {
    for (const name of Object.keys(section.checks)) section.checks[name] = "PASS";
  }
  return packet;
}

assert.equal(createFirstSaleEvidenceTemplate().schema_version, 4, "the integrated preflight evidence chain requires schema v4");
const legacyPacket = passingPacket();
legacyPacket.schema_version = 3;
assert.ok(
  evaluateFirstSaleEvidence(legacyPacket, "24h").errors.includes("schema_version"),
  "a v3 packet must not bypass the integrated first-sale preflight chain",
);

for (const phase of ["15m", "24h", "payout"]) {
  const result = evaluateFirstSaleEvidence(passingPacket(), phase);
  assert.equal(result.passed, true, `${phase} complete evidence must pass`);
  assert.equal(result.decision, "PASS");
}

const firstWindowMissing = passingPacket();
firstWindowMissing.fifteen_minute.checks.mailbox_received_same_suffix = "MISSING";
assert.deepEqual(
  evaluateFirstSaleEvidence(firstWindowMissing, "15m").decision,
  "STOP",
  "missing live 15-minute evidence must stop",
);

const firstWindowLate = passingPacket();
firstWindowLate.fifteen_minute.observed_at = "2026-08-24T00:15:01.000Z";
assert.equal(evaluateFirstSaleEvidence(firstWindowLate, "15m").decision, "STOP");

const earlyClose = passingPacket();
earlyClose.twenty_four_hour.observed_at = "2026-08-24T23:59:59.000Z";
assert.equal(evaluateFirstSaleEvidence(earlyClose, "24h").decision, "HOLD");

const payoutDifference = passingPacket();
payoutDifference.first_payout.cash_difference_cents = 2;
assert.equal(evaluateFirstSaleEvidence(payoutDifference, "payout").decision, "HOLD");

assert.ok(fifteenMinuteChecks.includes("integrated_first_sale_preflight_preserved"));
assert.ok(twentyFourHourChecks.includes("integrated_first_sale_preflight_unchanged"));
assert.ok(firstPayoutChecks.includes("integrated_first_sale_preflight_carried_forward"));

const missingIntegratedPreflightAtFifteenMinutes = passingPacket();
missingIntegratedPreflightAtFifteenMinutes.fifteen_minute.checks.integrated_first_sale_preflight_preserved = "MISSING";
assert.equal(
  evaluateFirstSaleEvidence(missingIntegratedPreflightAtFifteenMinutes, "15m").decision,
  "STOP",
  "a paid Resume transaction must not pass without its exact integrated preflight handoff",
);

const changedIntegratedPreflightAtTwentyFourHours = passingPacket();
changedIntegratedPreflightAtTwentyFourHours.twenty_four_hour.checks.integrated_first_sale_preflight_unchanged = "FAIL";
assert.equal(
  evaluateFirstSaleEvidence(changedIntegratedPreflightAtTwentyFourHours, "24h").decision,
  "HOLD",
  "a changed or superseded integrated preflight reference must hold the 24-hour close",
);

const missingIntegratedPreflightAtPayout = passingPacket();
missingIntegratedPreflightAtPayout.first_payout.checks.integrated_first_sale_preflight_carried_forward = "MISSING";
assert.equal(
  evaluateFirstSaleEvidence(missingIntegratedPreflightAtPayout, "payout").decision,
  "HOLD",
  "the first payout close must carry the same integrated preflight reference",
);

assert.ok(
  twentyFourHourChecks.includes("support_ledger_original_transaction_chain_preserved"),
  "24-hour evidence must join the original payment, ledger row and support incident",
);
const unlinkedSupportLedgerChain = passingPacket();
unlinkedSupportLedgerChain.twenty_four_hour.checks.support_ledger_original_transaction_chain_preserved = "MISSING";
assert.equal(
  evaluateFirstSaleEvidence(unlinkedSupportLedgerChain, "24h").decision,
  "HOLD",
  "separately complete accounting and support checks must not pass without one original-transaction chain",
);

const outcomeMatrixCases = [
  ["none_confirmed", "active", "no_adjustment", "refund_request_pending"],
  ["partial_refund_succeeded", "review", "partial_refund_adjustment", "partial_refund_confirmed"],
  ["full_refund_succeeded", "revoked", "full_refund_adjustment", "full_refund_confirmed"],
  ["dispute_open", "revoked", "dispute_open_adjustment", "dispute_needs_response"],
  ["dispute_won_or_funds_reinstated", "active", "dispute_reinstatement_adjustment", "dispute_won_or_funds_reinstated"],
  ["dispute_lost", "revoked", "dispute_loss_adjustment", "dispute_lost"],
];
for (const [financial, entitlement, accounting, support] of outcomeMatrixCases) {
  const packet = passingPacket();
  packet.twenty_four_hour.financial_event_outcome = financial;
  packet.twenty_four_hour.entitlement_outcome = entitlement;
  packet.twenty_four_hour.accounting_outcome = accounting;
  packet.twenty_four_hour.support_outcome = support;
  assert.equal(
    evaluateFirstSaleEvidence(packet, "24h").passed,
    true,
    `the documented ${financial} outcome must pass only with its matching handoff states`,
  );
}

const inconsistentOutcomeCases = [
  ["partial_refund_succeeded", "active", "partial_refund_adjustment", "partial_refund_confirmed"],
  ["full_refund_succeeded", "revoked", "partial_refund_adjustment", "full_refund_confirmed"],
  ["dispute_open", "revoked", "dispute_open_adjustment", "full_refund_confirmed"],
  ["unresolved", "unresolved", "unresolved", "unresolved"],
];
for (const [financial, entitlement, accounting, support] of inconsistentOutcomeCases) {
  const packet = passingPacket();
  packet.twenty_four_hour.financial_event_outcome = financial;
  packet.twenty_four_hour.entitlement_outcome = entitlement;
  packet.twenty_four_hour.accounting_outcome = accounting;
  packet.twenty_four_hour.support_outcome = support;
  const result = evaluateFirstSaleEvidence(packet, "24h");
  assert.equal(result.decision, "HOLD", `the inconsistent ${financial} handoff must fail closed`);
  assert.equal(
    result.rows.find(({ check }) => check === "refund_dispute_outcome_matrix_consistent")?.status,
    "FAIL",
  );
}

for (const boundary of [
  "첫 결제 → 회계 원장 → 지원 인계 연결 gate",
  "support_ledger_original_transaction_chain_preserved",
  "NONE_CONFIRMED",
  "Checkout → PaymentIntent → Charge",
  "Balance Transaction",
  "음수 조정이 정확히 한 번 반영",
  "동일 금액 또는 가까운 시각은 chain 증거가 아니다",
  "24시간 결과는 `HOLD`",
  "환불·분쟁 결과 일관성 gate",
  "refund_dispute_outcome_matrix_consistent",
  "financial_event_outcome",
  "support_outcome",
  "부분 환불은 전액 환불 완료로 안내하지 않는다",
  "dispute는 refund가 아니다",
  "혼합·순서 불명·원본 미열람",
  "통합 FIRST_SALE_PREFLIGHT 증거 chain",
  "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no",
  "integrated_first_sale_preflight_preserved",
  "integrated_first_sale_preflight_unchanged",
  "integrated_first_sale_preflight_carried_forward",
  "standalone `ACCOUNTING_PREFLIGHT=PASS`로 대체할 수 없다",
  "Rental accounting product-isolation PASS로 재사용할 수 없다",
  "schema_version=4",
  "기존 v1/v2/v3 파일에 PASS를 복사하거나 필드를 손으로 덧붙이지 않는다",
]) assert.ok(compactRunbookSource.includes(boundary), `the 24-hour runbook is missing financial-event handoff evidence: ${boundary}`);
for (const boundary of [
  "First-payment support handoff link",
  "same live Checkout → PaymentIntent → Charge → Balance Transaction source chain",
  "Do not join records by amount, timestamp, receipt wording or alert suffix",
  "support_ledger_original_transaction_chain_preserved",
  "keeps the 24-hour close at `HOLD`",
  "Refund/dispute outcome isolation",
  "partial refund, full refund and dispute movements are not interchangeable",
  "refund_dispute_outcome_matrix_consistent",
  "Do not duplicate a refund adjustment for a dispute movement",
  "Integrated first-sale preflight handoff",
  "not separate first-customer launch evidence",
  "cannot replace the exact integrated `FIRST_SALE_PREFLIGHT=PASS`",
]) assert.ok(compactAccountingRunbookSource.includes(boundary), `the accounting runbook is missing first-payment support linkage: ${boundary}`);

const unexpectedField = passingPacket();
unexpectedField.customer_email = "not-allowed";
assert.ok(evaluateFirstSaleEvidence(unexpectedField, "15m").errors.includes("packet_shape"));
assert.ok(
  evaluateFirstSaleEvidence(createFirstSaleEvidenceTemplate(), "15m").errors.includes("event_suffix"),
  "the untouched suffix placeholder must never validate",
);

const futureSectionsMissing = createFirstSaleEvidenceTemplate();
futureSectionsMissing.event_suffix = "A1B2C3D4";
futureSectionsMissing.paid_at = "2026-08-24T00:00:00.000Z";
futureSectionsMissing.fifteen_minute.observed_at = "2026-08-24T00:10:00.000Z";
for (const name of Object.keys(futureSectionsMissing.fifteen_minute.checks)) {
  futureSectionsMissing.fifteen_minute.checks[name] = "PASS";
}
assert.equal(
  evaluateFirstSaleEvidence(futureSectionsMissing, "15m").passed,
  true,
  "future evidence sections may remain MISSING during the 15-minute check",
);

for (const unsafe of [
  "buyer@example.com",
  "cs_live_1234567890ABCDEF",
  "pi_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  "whsec_1234567890ABCDEF",
  "postgresql://operator:secret@example.invalid/database",
]) assert.equal(containsSensitiveEvidence(unsafe), true, "private evidence patterns must be rejected");

assert.equal(containsSensitiveEvidence(JSON.stringify(passingPacket())), false);
const templateKeys = [];
function collectKeys(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value)) {
    templateKeys.push(key);
    collectKeys(child);
  }
}
collectKeys(createFirstSaleEvidenceTemplate());
for (const forbiddenKey of ["customer_email", "customer_name", "receipt_url", "stripe_id", "session_id", "raw_identifier"]) {
  assert.equal(templateKeys.includes(forbiddenKey), false, `the template must not invite ${forbiddenKey}`);
}

console.log("First-sale post-payment evidence contract passed.");
