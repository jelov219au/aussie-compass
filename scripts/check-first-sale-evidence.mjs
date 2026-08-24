import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  containsSensitiveEvidence,
  createFirstSaleEvidenceTemplate,
  evaluateFirstSaleEvidence,
} from "./first-sale-evidence-contract.mjs";

const [packageSource, runbookSource, cliSource] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url), "utf8"),
  readFile(new URL("./verify-first-sale-evidence.mjs", import.meta.url), "utf8"),
]);

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
  packet.first_payout.observed_at = "2026-08-26T00:00:00.000Z";
  packet.first_payout.cash_difference_cents = 1;
  for (const section of [packet.fifteen_minute, packet.twenty_four_hour, packet.first_payout]) {
    for (const name of Object.keys(section.checks)) section.checks[name] = "PASS";
  }
  return packet;
}

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
