import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  containsSensitiveProductionPathEvidence,
  createProductionPaymentPathEvidenceTemplate,
  evaluateProductionPaymentPathEvidence,
} from "./production-payment-path-evidence-contract.mjs";

function passingPacket() {
  const packet = createProductionPaymentPathEvidenceTemplate();
  packet.observed_at = "2026-08-25T00:00:00.000Z";
  for (const key of Object.keys(packet.migrations)) packet.migrations[key] = true;
  Object.assign(packet.webhook, { signed_delivery_http_status: 200, receipt_count_delta: 1, duplicate_receipt_count_delta: 0 });
  Object.assign(packet.outbox, { intent_count_delta: 1, sent_count_delta: 1, pending_count_delta: 0, delivery_attempt_count: 1, mailbox_received: true });
  Object.assign(packet.activation, {
    binding_count_delta: 1,
    access_session_count_delta: 1,
    first_outcome: "consumed",
    same_nonce_retry_outcome: "idempotent",
    same_nonce_new_binding_count: 0,
    same_nonce_new_session_count: 0,
    different_nonce_outcome: "used",
    different_nonce_cookie_issued: false,
  });
  Object.assign(packet.release, { release_result: true, released_at_recorded: true, old_session_active: false, retry_outcome: "released", retry_cookie_issued: false });
  Object.assign(packet.restore, {
    binding_count_delta: 1,
    access_session_count_delta: 1,
    first_outcome: "consumed",
    same_nonce_retry_outcome: "idempotent",
    same_nonce_new_binding_count: 0,
    same_nonce_new_session_count: 0,
    different_nonce_outcome: "used",
    different_nonce_cookie_issued: false,
    access_session_active_unexpired_unrevoked: true,
  });
  return packet;
}

assert.deepEqual(evaluateProductionPaymentPathEvidence(passingPacket()), { passed: true, reason: null });

for (const [reason, mutate] of [
  ["payments_not_off", (packet) => { packet.payments_enabled = true; }],
  ["migrations_unverified", (packet) => { packet.migrations.restore_activation_nonce_v1 = false; }],
  ["webhook_unverified", (packet) => { packet.webhook.duplicate_receipt_count_delta = 1; }],
  ["outbox_unverified", (packet) => { packet.outbox.sent_count_delta = 0; }],
  ["activation_unverified", (packet) => { packet.activation.same_nonce_new_session_count = 1; }],
  ["release_unverified", (packet) => { packet.release.old_session_active = true; }],
  ["restore_unverified", (packet) => { packet.restore.different_nonce_cookie_issued = true; }],
]) {
  const packet = passingPacket();
  mutate(packet);
  assert.deepEqual(evaluateProductionPaymentPathEvidence(packet), { passed: false, reason });
}

const unexpected = passingPacket();
unexpected.event_suffix = "FORBIDDEN";
assert.equal(evaluateProductionPaymentPathEvidence(unexpected).reason, "invalid_shape");

for (const unsafe of [
  "buyer@example.com",
  "evt_1234567890ABCDEF",
  "rk_live_1234567890ABCDEF",
  "whsec_1234567890ABCDEF",
  "postgresql://operator:secret@example.invalid/database",
  "a".repeat(64),
]) assert.equal(containsSensitiveProductionPathEvidence(unsafe), true);
assert.equal(containsSensitiveProductionPathEvidence(JSON.stringify(passingPacket())), false);

const directory = await mkdtemp(join(tmpdir(), "hoju-production-path-evidence-"));
try {
  const verifier = fileURLToPath(new URL("./verify-production-payment-path-evidence.mjs", import.meta.url));
  const passPath = join(directory, "pass.json");
  await writeFile(passPath, JSON.stringify(passingPacket()), "utf8");
  const pass = spawnSync(process.execPath, [verifier, "--file", passPath], { encoding: "utf8" });
  assert.equal(pass.status, 0);
  assert.equal(pass.stdout.trim(), "PRODUCTION_PAYMENT_PATH_EVIDENCE=PASS mode=production payments_off=yes webhook=verified outbox=sent nonce=bound release=denied restore=verified identifiers_printed=no secrets_printed=no");

  const unsafePath = join(directory, "unsafe.json");
  await writeFile(unsafePath, '{"customer_email":"buyer@example.com"}', "utf8");
  const unsafe = spawnSync(process.execPath, [verifier, "--file", unsafePath], { encoding: "utf8" });
  assert.equal(unsafe.status, 2);
  assert.match(unsafe.stdout, /^PRODUCTION_PAYMENT_PATH_EVIDENCE=FAIL .* reason=sensitive_evidence\s*$/);
  assert.doesNotMatch(`${unsafe.stdout}\n${unsafe.stderr}`, /buyer@example\.com/);
} finally {
  await rm(directory, { recursive: true, force: true });
}

console.log("Production payment-path redacted evidence contract passed.");
