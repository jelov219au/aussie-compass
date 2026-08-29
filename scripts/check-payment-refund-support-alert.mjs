import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  containsSensitivePaymentRefundSupportAlertEvidence,
  createPaymentRefundSupportAlertTemplate,
  evaluatePaymentRefundSupportAlertEvidence,
  paymentRefundSupportAlertChecks,
} from "./payment-refund-support-alert-contract.mjs";

const [verifier, runbook, customerDocumentVerifier, reconciliationVerifier, packageSource] = await Promise.all([
  readFile(new URL("./verify-payment-refund-support-alert.mjs", import.meta.url), "utf8"),
  readFile(new URL("../docs/payment-alerts.md", import.meta.url), "utf8"),
  readFile(new URL("./verify-managed-payments-customer-document-evidence.mjs", import.meta.url), "utf8"),
  readFile(new URL("./verify-controlled-payment-reconciliation.mjs", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);
const compactRunbook = runbook.replace(/\s+/g, " ");

function passingPacket() {
  const packet = createPaymentRefundSupportAlertTemplate();
  packet.observed_at = "2026-08-25T02:00:00.000Z";
  packet.transport_state = "verified";
  packet.purchase_alert_state = "received";
  packet.refund_alert_state = "received";
  for (const check of paymentRefundSupportAlertChecks) packet.checks[check] = "PASS";
  return packet;
}

assert.equal(createPaymentRefundSupportAlertTemplate().schema_version, 1);
assert.deepEqual(Object.keys(createPaymentRefundSupportAlertTemplate().checks), paymentRefundSupportAlertChecks);
assert.equal(evaluatePaymentRefundSupportAlertEvidence(createPaymentRefundSupportAlertTemplate()).decision, "HOLD");
assert.equal(evaluatePaymentRefundSupportAlertEvidence(passingPacket()).decision, "PASS");

const transportOnly = passingPacket();
transportOnly.purchase_alert_state = "unresolved";
transportOnly.refund_alert_state = "unresolved";
assert.equal(evaluatePaymentRefundSupportAlertEvidence(transportOnly).decision, "HOLD");

const missingRefundMailbox = passingPacket();
missingRefundMailbox.checks.controlled_refund_mailbox_received_same_suffix = "MISSING";
assert.equal(evaluatePaymentRefundSupportAlertEvidence(missingRefundMailbox).decision, "HOLD");

const failedPurchaseOutbox = passingPacket();
failedPurchaseOutbox.checks.controlled_purchase_outbox_single_sent = "FAIL";
assert.equal(evaluatePaymentRefundSupportAlertEvidence(failedPurchaseOutbox).decision, "HOLD");

const missingObservationTime = passingPacket();
missingObservationTime.observed_at = null;
assert.equal(evaluatePaymentRefundSupportAlertEvidence(missingObservationTime).decision, "HOLD");

const nonCanonicalTime = passingPacket();
nonCanonicalTime.observed_at = "2026-08-25T12:00:00+10:00";
assert.ok(evaluatePaymentRefundSupportAlertEvidence(nonCanonicalTime).errors.includes("observed_at"));

const testMode = passingPacket();
testMode.environment = "test";
assert.ok(evaluatePaymentRefundSupportAlertEvidence(testMode).errors.includes("environment"));

const extraSuffix = passingPacket();
extraSuffix.event_suffix = "ABCDEFGH";
assert.ok(evaluatePaymentRefundSupportAlertEvidence(extraSuffix).errors.includes("packet_shape"));

for (const unsafe of [
  "buyer@example.com",
  "https://mail.example.invalid/message/secret",
  "evt_1234567890ABCDEF",
  "re_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  "whsec_1234567890ABCDEF",
  "postgresql://operator:secret@example.invalid/database",
  '{"event_suffix":"ABCDEFGH"}',
]) assert.equal(containsSensitivePaymentRefundSupportAlertEvidence(unsafe), true);
assert.equal(containsSensitivePaymentRefundSupportAlertEvidence(JSON.stringify(passingPacket())), false);

for (const forbiddenBoundary of ["process.env", "fetch(", "node:child_process", "new Stripe(", "writeFile", "mkdir", "sendMail"]) {
  assert.ok(!verifier.includes(forbiddenBoundary), `the support-alert classifier must stay local and read-only: ${forbiddenBoundary}`);
}
for (const outputBoundary of [
  "PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS mode=production",
  "PAYMENT_REFUND_SUPPORT_ALERT_GATE=HOLD mode=production",
  "secrets_printed=no",
]) assert.ok(verifier.includes(outputBoundary), `the verifier is missing canonical output: ${outputBoundary}`);

assert.doesNotMatch(
  paymentRefundSupportAlertChecks.join("\n"),
  /gross|fee|payout|balance_transaction|transaction_seller|document_issuer|transaction_support_route/,
  "the support-alert gate must not duplicate accounting or customer-document fields",
);
assert.ok(!customerDocumentVerifier.includes("PAYMENT_REFUND_SUPPORT_ALERT_GATE"));
assert.ok(!reconciliationVerifier.includes("PAYMENT_REFUND_SUPPORT_ALERT_GATE"));

for (const boundary of [
  "Status-only pre-customer support-alert gate",
  "npm.cmd run payments:alerts:evidence -- --template",
  "PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS mode=production",
  "does not replace `CUSTOMER_DOCUMENT_TRUST_GATE=GO`",
  "does not replace `CONTROLLED_PAYMENT_RECONCILIATION=PASS`",
  "transport PASS alone is insufficient",
]) assert.ok(compactRunbook.includes(boundary), `payment-alert runbook is missing: ${boundary}`);

assert.ok(packageSource.includes('"payments:alerts:evidence": "node scripts/verify-payment-refund-support-alert.mjs"'));
assert.ok(packageSource.includes('"test:payment-alert-evidence": "node scripts/check-payment-refund-support-alert.mjs"'));
assert.ok(packageSource.includes("npm run test:payment-alert-evidence"));

console.log("Controlled payment/refund support-alert status contract passed.");
