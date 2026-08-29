import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  containsSensitiveRegisteredTaxAgentHandoffEvidence,
  createRegisteredTaxAgentHandoffTemplate,
  evaluateRegisteredTaxAgentHandoff,
  registeredTaxAgentHandoffChecks,
} from "./registered-tax-agent-handoff-contract.mjs";

const [verifier, handoff, reconciliationVerifier, customerDocumentVerifier, supportAlertVerifier, packageSource] = await Promise.all([
  readFile(new URL("./verify-registered-tax-agent-handoff.mjs", import.meta.url), "utf8"),
  readFile(new URL("../docs/registered-tax-agent-first-sale-handoff.md", import.meta.url), "utf8"),
  readFile(new URL("./verify-controlled-payment-reconciliation.mjs", import.meta.url), "utf8"),
  readFile(new URL("./verify-managed-payments-customer-document-evidence.mjs", import.meta.url), "utf8"),
  readFile(new URL("./verify-payment-refund-support-alert.mjs", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);
const compactHandoff = handoff.replace(/\s+/g, " ");

function passingPacket() {
  const packet = createRegisteredTaxAgentHandoffTemplate();
  packet.observed_at = "2026-08-25T03:00:00.000Z";
  packet.adviser_registration_verified = "VERIFIED";
  packet.overall_tax_handoff = "PASS";
  for (const check of registeredTaxAgentHandoffChecks) packet.checks[check] = "PASS";
  return packet;
}

assert.equal(createRegisteredTaxAgentHandoffTemplate().schema_version, 2);
assert.deepEqual(Object.keys(createRegisteredTaxAgentHandoffTemplate().checks), registeredTaxAgentHandoffChecks);
assert.equal(evaluateRegisteredTaxAgentHandoff(createRegisteredTaxAgentHandoffTemplate()).decision, "HOLD");
assert.equal(evaluateRegisteredTaxAgentHandoff(passingPacket()).decision, "PASS");

const legacyPreSaleScope = passingPacket();
legacyPreSaleScope.schema_version = 1;
legacyPreSaleScope.handoff_scope = "registered_tax_agent_first_sale";
assert.ok(evaluateRegisteredTaxAgentHandoff(legacyPreSaleScope).errors.includes("schema_version"));
assert.ok(evaluateRegisteredTaxAgentHandoff(legacyPreSaleScope).errors.includes("handoff_scope"));

const claimedOverallOnly = createRegisteredTaxAgentHandoffTemplate();
claimedOverallOnly.observed_at = "2026-08-25T03:00:00.000Z";
claimedOverallOnly.overall_tax_handoff = "PASS";
assert.equal(evaluateRegisteredTaxAgentHandoff(claimedOverallOnly).decision, "HOLD");

const unverifiedAdviser = passingPacket();
unverifiedAdviser.adviser_registration_verified = "UNRESOLVED";
assert.equal(evaluateRegisteredTaxAgentHandoff(unverifiedAdviser).decision, "HOLD");

for (const check of [
  "entity_and_abn_gst_applicability_concluded",
  "gst_reporting_treatment_concluded",
  "managed_payments_gross_sale_treatment_concluded",
  "managed_payments_fee_and_fee_tax_treatment_concluded",
  "managed_payments_refund_dispute_treatment_concluded",
  "managed_payments_payout_clearing_treatment_concluded",
  "private_source_retention_requirements_concluded",
  "registered_tax_agent_confirmation_retained_private",
  "dated_advice_record_retained_private",
]) {
  const missing = passingPacket();
  missing.checks[check] = "MISSING";
  assert.equal(evaluateRegisteredTaxAgentHandoff(missing).decision, "HOLD", `${check} must fail closed`);
}

const failedContradictions = passingPacket();
failedContradictions.checks.contradictions_none = "FAIL";
assert.equal(evaluateRegisteredTaxAgentHandoff(failedContradictions).decision, "HOLD");

const missingTime = passingPacket();
missingTime.observed_at = null;
assert.equal(evaluateRegisteredTaxAgentHandoff(missingTime).decision, "HOLD");

const nonCanonicalTime = passingPacket();
nonCanonicalTime.observed_at = "2026-08-25T13:00:00+10:00";
assert.ok(evaluateRegisteredTaxAgentHandoff(nonCanonicalTime).errors.includes("observed_at"));

const wrongEnvironment = passingPacket();
wrongEnvironment.environment = "test";
assert.ok(evaluateRegisteredTaxAgentHandoff(wrongEnvironment).errors.includes("environment"));

const extraAdvice = passingPacket();
extraAdvice.advice = "free-form conclusion";
assert.ok(evaluateRegisteredTaxAgentHandoff(extraAdvice).errors.includes("packet_shape"));

for (const unsafe of [
  '{"name":"Private Adviser"}',
  '{"abn":"12 345 678 901"}',
  "adviser@example.com",
  '{"amount":"19.90"}',
  "https://private.example.invalid/advice/123",
  "pi_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  '{"advice_text":"original advice"}',
  '{"registration_reference":"private-ref"}',
]) assert.equal(containsSensitiveRegisteredTaxAgentHandoffEvidence(unsafe), true);
assert.equal(containsSensitiveRegisteredTaxAgentHandoffEvidence(JSON.stringify(passingPacket())), false);

for (const forbiddenBoundary of ["process.env", "fetch(", "node:child_process", "new Stripe(", "writeFile", "mkdir"]) {
  assert.ok(!verifier.includes(forbiddenBoundary), `the tax-agent classifier must stay local and read-only: ${forbiddenBoundary}`);
}
for (const outputBoundary of [
  "REGISTERED_TAX_AGENT_HANDOFF_GATE=PASS mode=production",
  "REGISTERED_TAX_AGENT_HANDOFF_GATE=HOLD mode=production",
  "sensitive_data_printed=no",
]) assert.ok(verifier.includes(outputBoundary), `the verifier is missing canonical output: ${outputBoundary}`);

assert.doesNotMatch(
  registeredTaxAgentHandoffChecks.join("\n"),
  /payment_intent|balance_transaction|mailbox|outbox|transaction_seller_visible|document_issuer_visible/,
  "the tax-agent gate must not duplicate transaction reconciliation, customer-document or support-alert observations",
);
for (const otherVerifier of [reconciliationVerifier, customerDocumentVerifier, supportAlertVerifier]) {
  assert.ok(!otherVerifier.includes("REGISTERED_TAX_AGENT_HANDOFF_GATE"));
}

for (const boundary of [
  "Status-only registered-tax-agent handoff gate",
  "npm.cmd run accounting:tax-agent-handoff -- --template",
  "REGISTERED_TAX_AGENT_HANDOFF_GATE=PASS mode=production",
  "adviser_registration_verified",
  "overall_tax_handoff=PASS` alone",
  "does not replace `CONTROLLED_PAYMENT_RECONCILIATION=PASS`",
  "does not replace `CUSTOMER_DOCUMENT_TRUST_GATE=GO`",
  "does not replace `PAYMENT_REFUND_SUPPORT_ALERT_GATE=PASS`",
  "not a Stripe Managed Payments prerequisite",
  "before a second sale",
  "registered_tax_agent_post_first_sale",
  "https://docs.stripe.com/payments/managed-payments/how-it-works",
  "https://docs.stripe.com/payments/managed-payments/set-up",
  "https://docs.stripe.com/payments/managed-payments/tax-compliance",
]) assert.ok(compactHandoff.includes(boundary), `tax-agent handoff is missing: ${boundary}`);

assert.ok(packageSource.includes('"accounting:tax-agent-handoff": "node scripts/verify-registered-tax-agent-handoff.mjs"'));
assert.ok(packageSource.includes('"test:registered-tax-agent-handoff": "node scripts/check-registered-tax-agent-handoff.mjs"'));
assert.ok(packageSource.includes("npm run test:registered-tax-agent-handoff"));

console.log("Registered tax-agent first-sale status-only handoff contract passed.");
