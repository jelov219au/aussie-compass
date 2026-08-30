import assert from "node:assert/strict";

import {
  createPayEvidenceProRestoreCode,
  decodePayEvidenceProAccessToken,
  derivePayEvidenceProAccessSessionId,
  derivePayEvidenceProRestoreSourceHash,
  encodePayEvidenceProAccessToken,
  hashPayEvidenceProAccessSessionId,
  hashPayEvidenceProRestoreCode,
  hashPayEvidenceProRestoreNonce,
  payEvidenceProAccessLifetimeSeconds,
} from "../src/lib/payEvidenceProTokens.ts";

const now = Date.parse("2026-08-30T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "pay_evidence_pro", status: "active" };
const activationHash = "a".repeat(64);
const accessSessionId = derivePayEvidenceProAccessSessionId("activation", activationHash, secret);
const token = encodePayEvidenceProAccessToken(entitlement, accessSessionId, secret, now);

assert.deepEqual(decodePayEvidenceProAccessToken(token, secret, now), {
  v: 2,
  entitlementId: "84",
  productCode: "pay_evidence_pro",
  accessSessionId,
  exp: Math.floor(now / 1000) + payEvidenceProAccessLifetimeSeconds,
});
assert.equal(decodePayEvidenceProAccessToken(`${token}x`, secret, now), null, "tampered signatures must fail");
assert.equal(decodePayEvidenceProAccessToken(token, `${secret}x`, now), null, "the wrong secret must fail");
assert.equal(
  decodePayEvidenceProAccessToken(token, secret, now + payEvidenceProAccessLifetimeSeconds * 1000),
  null,
  "expired access tokens must fail",
);
assert.throws(
  () => encodePayEvidenceProAccessToken({ ...entitlement, productCode: "resume_pro" }, accessSessionId, secret, now),
  /active Pay Evidence Pack Pro entitlement/,
  "a Resume Pro entitlement must never unlock Pay Evidence Pack Pro",
);
assert.throws(
  () => encodePayEvidenceProAccessToken({ ...entitlement, status: "revoked" }, accessSessionId, secret, now),
  /active Pay Evidence Pack Pro entitlement/,
  "revoked entitlements must never receive a token",
);
assert.throws(
  () => encodePayEvidenceProAccessToken(entitlement, "not-a-session", secret, now),
  /Invalid access session identifier/,
  "an untracked access session must never receive a cookie",
);
assert.match(accessSessionId, /^[A-Za-z0-9_-]{43}$/);
assert.match(hashPayEvidenceProAccessSessionId(accessSessionId), /^[a-f0-9]{64}$/);
assert.notEqual(
  accessSessionId,
  derivePayEvidenceProAccessSessionId("restore", activationHash, secret),
  "activation and restore sessions must be domain-separated",
);

const restore = createPayEvidenceProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashPayEvidenceProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + payEvidenceProAccessLifetimeSeconds * 1000);

const restoreNonce = "b".repeat(43);
const nonceHash = hashPayEvidenceProRestoreNonce(restoreNonce);
const restoreSourceHash = derivePayEvidenceProRestoreSourceHash(restore.tokenHash, nonceHash);
assert.match(nonceHash, /^[a-f0-9]{64}$/);
assert.match(restoreSourceHash, /^[a-f0-9]{64}$/);
assert.notEqual(restoreSourceHash, derivePayEvidenceProRestoreSourceHash(restore.tokenHash, hashPayEvidenceProRestoreNonce("c".repeat(43))), "a restore replay from another browser nonce must derive a different session");
assert.throws(() => hashPayEvidenceProRestoreNonce("short"), /Invalid restore nonce/);

console.log("Pay Evidence Pack Pro server-tracked access and restore-token checks passed.");
