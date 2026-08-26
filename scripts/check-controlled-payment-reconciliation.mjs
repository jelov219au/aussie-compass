import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  containsSensitiveControlledPaymentReconciliation,
  controlledPaymentReconciliationChecks,
  createControlledPaymentReconciliationTemplate,
  evaluateControlledPaymentReconciliation,
} from "./controlled-payment-reconciliation-contract.mjs";

const [verifier, accountingRunbook, customerDocumentVerifier, packageSource] = await Promise.all([
  readFile(new URL("./verify-controlled-payment-reconciliation.mjs", import.meta.url), "utf8"),
  readFile(new URL("../docs/accounting-reconciliation.md", import.meta.url), "utf8"),
  readFile(new URL("./verify-managed-payments-customer-document-evidence.mjs", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);
const compactAccountingRunbook = accountingRunbook.replace(/\s+/g, " ");

function passingPacket({ payoutState = "matched", refundState = "full_refund_succeeded" } = {}) {
  const packet = createControlledPaymentReconciliationTemplate();
  packet.observed_at = "2026-08-25T01:00:00.000Z";
  packet.refund_state = refundState;
  packet.payout_state = payoutState;
  for (const check of controlledPaymentReconciliationChecks) packet.checks[check] = "PASS";
  return packet;
}

assert.equal(createControlledPaymentReconciliationTemplate().schema_version, 2);
assert.deepEqual(Object.keys(createControlledPaymentReconciliationTemplate().checks), controlledPaymentReconciliationChecks);
assert.equal(evaluateControlledPaymentReconciliation(createControlledPaymentReconciliationTemplate()).decision, "HOLD");
const fullRefund = evaluateControlledPaymentReconciliation(passingPacket());
assert.equal(fullRefund.decision, "PASS");
assert.equal(fullRefund.outcome, "full_refund");

const retainedSale = evaluateControlledPaymentReconciliation(passingPacket({ refundState: "none_confirmed" }));
assert.equal(retainedSale.decision, "PASS");
assert.equal(retainedSale.outcome, "retained_sale");
assert.notEqual(retainedSale.outcome, fullRefund.outcome);
assert.equal(evaluateControlledPaymentReconciliation(passingPacket({ payoutState: "source_verified_none" })).decision, "PASS");

const fixtureDirectory = await mkdtemp(join(tmpdir(), "hoju-controlled-reconciliation-"));
const verifierPath = fileURLToPath(new URL("./verify-controlled-payment-reconciliation.mjs", import.meta.url));
const fixturePaths = [join(fixtureDirectory, "retained.json"), join(fixtureDirectory, "full-refund.json")];
try {
  await Promise.all([
    writeFile(fixturePaths[0], JSON.stringify(passingPacket({ refundState: "none_confirmed" })), "utf8"),
    writeFile(fixturePaths[1], JSON.stringify(passingPacket()), "utf8"),
  ]);
  const retainedRun = spawnSync(process.execPath, [verifierPath, "--file", fixturePaths[0]], { encoding: "utf8" });
  const fullRefundRun = spawnSync(process.execPath, [verifierPath, "--file", fixturePaths[1]], { encoding: "utf8" });
  assert.equal(retainedRun.status, 0, retainedRun.stderr);
  assert.equal(fullRefundRun.status, 0, fullRefundRun.stderr);
  assert.match(retainedRun.stdout, /outcome=retained_sale refund=none_confirmed/);
  assert.match(fullRefundRun.stdout, /outcome=full_refund refund=full_refund_succeeded/);
  assert.doesNotMatch(`${retainedRun.stdout}\n${fullRefundRun.stdout}`, /(?:@|https?:\/\/|\b(?:pi|ch|re|txn)_)/i);
} finally {
  await Promise.all(fixturePaths.map((fixturePath) => unlink(fixturePath).catch(() => undefined)));
  await rmdir(fixtureDirectory).catch(() => undefined);
}

const pendingPayout = passingPacket({ payoutState: "pending" });
assert.equal(evaluateControlledPaymentReconciliation(pendingPayout).decision, "HOLD");

const missingFee = passingPacket();
missingFee.checks.stripe_fee_recorded_separately = "MISSING";
assert.equal(evaluateControlledPaymentReconciliation(missingFee).decision, "HOLD");

const failedRefundStateSource = passingPacket();
failedRefundStateSource.checks.refund_state_source_window_verified = "FAIL";
assert.equal(evaluateControlledPaymentReconciliation(failedRefundStateSource).decision, "HOLD");

const missingRefundFeeAdjustment = passingPacket();
missingRefundFeeAdjustment.checks.refund_fee_adjustment_state_recorded = "MISSING";
assert.equal(evaluateControlledPaymentReconciliation(missingRefundFeeAdjustment).decision, "HOLD");

const assumedNoRefund = passingPacket({ refundState: "none_confirmed" });
assumedNoRefund.checks.refund_state_source_window_verified = "MISSING";
assert.equal(evaluateControlledPaymentReconciliation(assumedNoRefund).decision, "HOLD");

const unresolvedRefund = passingPacket();
unresolvedRefund.refund_state = "unresolved";
assert.equal(evaluateControlledPaymentReconciliation(unresolvedRefund).decision, "HOLD");

const missingObservationTime = passingPacket();
missingObservationTime.observed_at = null;
assert.equal(evaluateControlledPaymentReconciliation(missingObservationTime).decision, "HOLD");

const nonCanonicalObservationTime = passingPacket();
nonCanonicalObservationTime.observed_at = "2026-08-25T11:00:00+10:00";
assert.ok(evaluateControlledPaymentReconciliation(nonCanonicalObservationTime).errors.includes("observed_at"));

const testMode = passingPacket();
testMode.environment = "test";
assert.ok(evaluateControlledPaymentReconciliation(testMode).errors.includes("environment"));

const wrongProduct = passingPacket();
wrongProduct.product_code = "rental_application_pro";
assert.ok(evaluateControlledPaymentReconciliation(wrongProduct).errors.includes("product_code"));

const extraAmount = passingPacket();
extraAmount.gross_amount = "123.45";
assert.ok(evaluateControlledPaymentReconciliation(extraAmount).errors.includes("packet_shape"));

for (const unsafe of [
  '{"amount":"123.45"}',
  "buyer@example.com",
  "https://pay.example.invalid/report?token=sensitive",
  "txn_1234567890ABCDEF",
  "po_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  "postgresql://operator:secret@example.invalid/database",
]) assert.equal(containsSensitiveControlledPaymentReconciliation(unsafe), true);
assert.equal(containsSensitiveControlledPaymentReconciliation(JSON.stringify(passingPacket())), false);

for (const forbiddenBoundary of ["process.env", "fetch(", "node:child_process", "new Stripe(", "writeFile", "mkdir"]) {
  assert.ok(!verifier.includes(forbiddenBoundary), `the reconciliation classifier must stay local and read-only: ${forbiddenBoundary}`);
}
for (const outputBoundary of [
  "CONTROLLED_PAYMENT_RECONCILIATION=PASS mode=live",
  "CONTROLLED_PAYMENT_RECONCILIATION=HOLD mode=live",
  "outcome=${result.outcome} refund=${packet.refund_state}",
  "amounts_printed=no identifiers_printed=no",
]) assert.ok(verifier.includes(outputBoundary), `the verifier is missing canonical output: ${outputBoundary}`);

assert.doesNotMatch(
  controlledPaymentReconciliationChecks.join("\n"),
  /transaction_seller|document_issuer|transaction_support_route/,
  "the accounting classifier must not duplicate the customer-document trust gate",
);
assert.ok(!verifier.includes("CUSTOMER_DOCUMENT_TRUST_GATE"));
assert.ok(!customerDocumentVerifier.includes("CONTROLLED_PAYMENT_RECONCILIATION"));

for (const boundary of [
  "Status-only controlled-payment reconciliation gate",
  "npm.cmd run accounting:controlled-reconciliation -- --template",
  "CONTROLLED_PAYMENT_RECONCILIATION=PASS mode=live",
  "outcome=retained_sale refund=none_confirmed",
  "outcome=full_refund refund=full_refund_succeeded",
  "refund_state_source_window_verified",
  "does not replace `CUSTOMER_DOCUMENT_TRUST_GATE=GO`",
  "source_verified_none",
  "pending` and `unresolved` remain `HOLD",
  "must not contain amounts",
]) assert.ok(compactAccountingRunbook.includes(boundary), `accounting runbook is missing: ${boundary}`);

assert.ok(packageSource.includes('"accounting:controlled-reconciliation": "node scripts/verify-controlled-payment-reconciliation.mjs"'));
assert.ok(packageSource.includes('"test:controlled-payment-reconciliation": "node scripts/check-controlled-payment-reconciliation.mjs"'));
assert.ok(packageSource.includes("npm run test:controlled-payment-reconciliation"));

console.log("Controlled live payment status-only reconciliation contract passed.");
