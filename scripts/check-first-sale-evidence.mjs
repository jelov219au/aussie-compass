import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { accountingLedgerHeader, normaliseAccountingRows } from "./accounting-ledger-schema.mjs";
import {
  controlledPaymentReconciliationChecks,
  createControlledPaymentReconciliationTemplate,
  evaluateControlledPaymentReconciliation,
} from "./controlled-payment-reconciliation-contract.mjs";
import {
  accountingOutcomes,
  containsSensitiveEvidence,
  createFirstSaleEvidenceTemplate,
  entitlementOutcomes,
  evaluateFirstSaleEvidence,
  fifteenMinuteChecks,
  financialEventOutcomes,
  firstPayoutChecks,
  supportOutcomes,
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
const packageJson = JSON.parse(packageSource);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

assert.ok(packageSource.includes('"first-sale:evidence": "node scripts/verify-first-sale-evidence.mjs"'));
assert.equal(packageJson.scripts["accounting:export"], "node scripts/export-stripe-accounting.mjs");
assert.equal(packageJson.scripts["first-sale:evidence"], "node scripts/verify-first-sale-evidence.mjs");
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

function retainedFeeUnsettledPacket() {
  const packet = passingPacket();
  packet.twenty_four_hour.financial_event_outcome = "full_refund_succeeded";
  packet.twenty_four_hour.entitlement_outcome = "revoked";
  packet.twenty_four_hour.accounting_outcome = "full_refund_adjustment";
  packet.twenty_four_hour.support_outcome = "full_refund_confirmed";
  packet.twenty_four_hour.checks.refund_credit_note_handled = "MISSING";
  packet.twenty_four_hour.checks.payout_status_recorded = "MISSING";
  packet.first_payout.cash_difference_cents = null;
  packet.first_payout.checks.itemised_payout_retained = "MISSING";
  packet.first_payout.checks.bank_arrival_matched = "MISSING";
  packet.first_payout.checks.stripe_clearing_reconciled = "MISSING";
  return packet;
}

function retainedSaleControlledReconciliationPacket() {
  const packet = createControlledPaymentReconciliationTemplate();
  packet.observed_at = "2026-08-25T00:05:00.000Z";
  packet.refund_state = "none_confirmed";
  packet.payout_state = "pending";
  for (const check of controlledPaymentReconciliationChecks) packet.checks[check] = "PASS";
  packet.checks.payout_bank_match_or_verified_none = "MISSING";
  packet.checks.cash_difference_within_one_cent = "MISSING";
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

for (const documentedCommand of [
  "npm.cmd run accounting:export -- --from <YYYY-MM-DD> --to <YYYY-MM-DD>",
  "npm.cmd run first-sale:evidence -- --file <private-json-path> --phase 24h",
  "npm.cmd run accounting:controlled-reconciliation -- --file <private-status-json-path>",
  "npm.cmd run first-sale:evidence -- --file <private-json-path> --phase payout",
]) assert.ok(runbookSource.includes(documentedCommand), `the 24-hour run sheet is missing the real repo command: ${documentedCommand}`);
assert.ok(runbookSource.includes("`--to` 날짜는 exporter 구현대로 exclusive"));

for (const exporterField of accountingLedgerHeader) {
  assert.ok(runbookSource.includes(exporterField), `the 24-hour run sheet is missing exporter field: ${exporterField}`);
}
for (const nonExporterBoundary of [
  "`fee_details`는 exporter 열이 아니므로",
  "`payout_status_recorded=PASS/MISSING/FAIL`",
  "임의 `payout_state`를 추가하면 판정기는 구조 오류 `STOP`",
]) assert.ok(compactRunbookSource.includes(nonExporterBoundary.replace(/\s+/g, " ")), `the 24-hour run sheet is missing tool boundary: ${nonExporterBoundary}`);

const exporterFixtureRows = normaliseAccountingRows(
  "stripe-balance-live-2026-08-24-to-2026-08-26-exclusive.csv",
  [
    accountingLedgerHeader,
    ["live", "2026-08-24T00:00:00.000Z", "2026-08-25T00:00:00.000Z", "AUD", "charge", "100.00", "3.00", "97.00", "available", "charge_fixture", "sale_fixture"],
    ["live", "2026-08-24T01:00:00.000Z", "2026-08-25T01:00:00.000Z", "AUD", "refund", "-100.00", "0.00", "-100.00", "available", "refund_fixture", "refund_balance_fixture"],
  ],
);
const grossIndex = accountingLedgerHeader.indexOf("gross_amount");
const feeIndex = accountingLedgerHeader.indexOf("fee_amount");
const netIndex = accountingLedgerHeader.indexOf("net_amount");
assert.equal(exporterFixtureRows.reduce((sum, row) => sum + Number(row[grossIndex]), 0), 0, "the synthetic sale and full refund must offset gross");
assert.ok(exporterFixtureRows.reduce((sum, row) => sum + Number(row[feeIndex]), 0) > 0, "the synthetic full refund must retain a fee source");
assert.ok(exporterFixtureRows.reduce((sum, row) => sum + Number(row[netIndex]), 0) < 0, "the retained fee must remain visible in net activity");

const retainedFeeAtTwentyFourHours = evaluateFirstSaleEvidence(retainedFeeUnsettledPacket(), "24h");
assert.equal(retainedFeeAtTwentyFourHours.decision, "HOLD");
assert.equal(retainedFeeAtTwentyFourHours.rows.find(({ check }) => check === "refund_credit_note_handled")?.status, "MISSING");
const retainedFeeAtPayout = evaluateFirstSaleEvidence(retainedFeeUnsettledPacket(), "payout");
assert.equal(retainedFeeAtPayout.decision, "HOLD");
for (const check of ["itemised_payout_retained", "bank_arrival_matched", "stripe_clearing_reconciled", "cash_difference_within_one_cent"]) {
  assert.notEqual(retainedFeeAtPayout.rows.find((row) => row.check === check)?.status, "PASS", `${check} must not be completed from a retained fee`);
}

const retainedSaleAtTwentyFourHours = evaluateFirstSaleEvidence(passingPacket(), "24h");
assert.equal(retainedSaleAtTwentyFourHours.decision, "PASS", "the 24-hour packet may record a verified pending payout state");
const retainedSaleControlledReconciliation = evaluateControlledPaymentReconciliation(retainedSaleControlledReconciliationPacket());
assert.equal(retainedSaleControlledReconciliation.outcome, "retained_sale");
assert.equal(retainedSaleControlledReconciliation.decision, "HOLD", "pending payout and missing bank evidence must not become cash received");
for (const check of [
  "original_gross_sale_preserved_once",
  "stripe_fee_recorded_separately",
  "gross_fee_refund_net_reconciled",
  "ending_balance_reconciled",
  "refund_state_source_window_verified",
]) {
  assert.equal(
    retainedSaleControlledReconciliation.rows.find((row) => row.check === check)?.status,
    "PASS",
    `${check} must stay separate from pending payout and bank evidence`,
  );
}
for (const check of ["payout_state_resolved", "payout_bank_match_or_verified_none", "cash_difference_within_one_cent"]) {
  assert.notEqual(
    retainedSaleControlledReconciliation.rows.find((row) => row.check === check)?.status,
    "PASS",
    `${check} must remain unresolved before payout and bank evidence`,
  );
}
const retainedSaleMissingNet = retainedSaleControlledReconciliationPacket();
retainedSaleMissingNet.checks.gross_fee_refund_net_reconciled = "MISSING";
assert.equal(evaluateControlledPaymentReconciliation(retainedSaleMissingNet).decision, "HOLD");

for (const status of ["PASS", "MISSING", "FAIL"]) {
  const packet = passingPacket();
  packet.twenty_four_hour.checks.gross_captured = status;
  const result = evaluateFirstSaleEvidence(packet, "24h");
  assert.equal(result.errors.length, 0, `${status} must be accepted by the fixed check schema`);
  assert.equal(result.decision, status === "PASS" ? "PASS" : "HOLD");
}

for (const allowedCode of [
  ...financialEventOutcomes,
  ...entitlementOutcomes,
  ...accountingOutcomes,
  ...supportOutcomes,
]) assert.ok(runbookSource.includes(allowedCode), `the run sheet must document the accepted outcome code: ${allowedCode}`);

for (const [field, allowedCodes] of Object.entries({
  financial_event_outcome: financialEventOutcomes,
  entitlement_outcome: entitlementOutcomes,
  accounting_outcome: accountingOutcomes,
  support_outcome: supportOutcomes,
})) {
  for (const allowedCode of allowedCodes) {
    const packet = passingPacket();
    packet.twenty_four_hour[field] = allowedCode;
    assert.equal(
      evaluateFirstSaleEvidence(packet, "24h").errors.length,
      0,
      `${field} must structurally accept documented code ${allowedCode}`,
    );
  }
}

const cliTemplate = spawnSync(process.execPath, ["scripts/verify-first-sale-evidence.mjs", "--template"], {
  cwd: repoRoot,
  encoding: "utf8",
});
assert.equal(cliTemplate.status, 0, cliTemplate.stderr);
assert.deepEqual(JSON.parse(cliTemplate.stdout), createFirstSaleEvidenceTemplate(), "the actual CLI template must match the imported contract");

const fixtureRoot = await mkdtemp(path.join(tmpdir(), "first-sale-evidence-"));
try {
  const fixturePath = path.join(fixtureRoot, "24h-status-only.json");
  await writeFile(fixturePath, JSON.stringify(passingPacket()), "utf8");
  const cliResult = spawnSync(process.execPath, ["scripts/verify-first-sale-evidence.mjs", "--file", fixturePath, "--phase", "24h"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(cliResult.status, 0, cliResult.stderr || cliResult.stdout);
  assert.match(cliResult.stdout, /결과: PASS/);

  const unexpectedPayoutField = passingPacket();
  unexpectedPayoutField.twenty_four_hour.payout_state = "pending";
  await writeFile(fixturePath, JSON.stringify(unexpectedPayoutField), "utf8");
  const stoppedCli = spawnSync(process.execPath, ["scripts/verify-first-sale-evidence.mjs", "--file", fixturePath, "--phase", "24h"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(stoppedCli.status, 2);
  assert.match(stoppedCli.stderr, /STOP/);
  assert.doesNotMatch(`${stoppedCli.stdout}\n${stoppedCli.stderr}`, /pending/, "the classifier must not echo an unsupported private workbook value");

  await writeFile(fixturePath, JSON.stringify(retainedFeeUnsettledPacket()), "utf8");
  for (const [phase, requiredMissingCheck] of [["24h", "refund_credit_note_handled"], ["payout", "bank_arrival_matched"]]) {
    const heldCli = spawnSync(process.execPath, ["scripts/verify-first-sale-evidence.mjs", "--file", fixturePath, "--phase", phase], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    assert.equal(heldCli.status, 1, heldCli.stderr || heldCli.stdout);
    assert.match(heldCli.stdout, /결과: HOLD/);
    assert.match(heldCli.stdout, new RegExp(`MISSING\\s+${requiredMissingCheck}`));
    assert.doesNotMatch(heldCli.stdout, /결과: PASS/);
    for (const forbiddenFixtureDetail of ["100.00", "3.00", "charge_fixture", "refund_fixture"]) {
      assert.ok(!heldCli.stdout.includes(forbiddenFixtureDetail), "the status-only CLI must not print exporter fixture details");
    }
  }
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
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
  "FIRST_SALE_PREFLIGHT=PASS mode=live payments_off=yes monitoring=<smtp|manual> keys=three-distinct-rk-live required_reads=verified checkout_create=not-exercised database=strict-pass secrets_printed=no",
  "같은 실행의 outer",
  "integrated_first_sale_preflight_preserved",
  "integrated_first_sale_preflight_unchanged",
  "integrated_first_sale_preflight_carried_forward",
  "standalone `ACCOUNTING_PREFLIGHT=PASS`로 대체할 수 없다",
  "Rental accounting product-isolation PASS로 재사용할 수 없다",
  "schema_version=4",
  "기존 v1/v2/v3 파일에 PASS를 복사하거나 필드를 손으로 덧붙이지 않는다",
  "24시간 마감 단일 실행표 (읽기 전용)",
  "자동·기계 상태는 후보와 원본 위치를 제공할 뿐 수동 확인을 대신하지 않는다",
  "Checkout → PaymentIntent → Charge",
  "Refund 원본이 `succeeded`",
  "실제 발급 Receipt·Invoice",
  "Credit Note는 발행/미발행·열람 상태만 확인",
  "24시간에 payout이 없으면 `pending`으로 이월",
  "`payout_status_recorded=PASS`는 `pending` 같은 현재 상태를 원본에서 확인해 기록했다는 뜻일 뿐",
  "schema v2 controlled-reconciliation",
  "refund_state=none_confirmed",
  "refund_state_source_window_verified=PASS",
  "payout_bank_match_or_verified_none=MISSING",
  "cash_difference_within_one_cent=MISSING",
  "outcome=retained_sale ... payout=pending",
  "외부 증거를 생성하거나 대체하지 않는다",
  "`source_verified_none`은 닫힌 Stripe source window와 은행 증거가 함께 no-movement를 입증한 경우만 사용",
  "환불 요청은 성공한 refund가 아니며",
]) assert.ok(compactRunbookSource.includes(boundary), `the 24-hour runbook is missing financial-event handoff evidence: ${boundary}`);
assert.doesNotMatch(
  compactRunbookSource,
  /refund `nil\/발생`|payout `nil\/pending\/paid`/,
  "the 24-hour handoff must not collapse refund requests or unverified payouts into ambiguous states",
);
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
