import assert from "node:assert/strict";

import {
  createLeavingAustraliaProRestoreCode,
  decodeLeavingAustraliaProAccessToken,
  deriveLeavingAustraliaProAccessSessionId,
  deriveLeavingAustraliaProRestoreSourceHash,
  encodeLeavingAustraliaProAccessToken,
  hashLeavingAustraliaProAccessSessionId,
  hashLeavingAustraliaProRestoreCode,
  hashLeavingAustraliaProRestoreNonce,
  leavingAustraliaProAccessLifetimeSeconds,
} from "../src/lib/leavingAustraliaProTokens.ts";

const now = Date.parse("2026-08-30T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "leaving_australia_pro", status: "active" };
const activationHash = "a".repeat(64);
const accessSessionId = deriveLeavingAustraliaProAccessSessionId("activation", activationHash, secret);
const token = encodeLeavingAustraliaProAccessToken(entitlement, accessSessionId, secret, now);

assert.deepEqual(decodeLeavingAustraliaProAccessToken(token, secret, now), {
  v: 2,
  entitlementId: "84",
  productCode: "leaving_australia_pro",
  accessSessionId,
  exp: Math.floor(now / 1000) + leavingAustraliaProAccessLifetimeSeconds,
});
assert.equal(decodeLeavingAustraliaProAccessToken(`${token}x`, secret, now), null, "tampered signatures must fail");
assert.equal(decodeLeavingAustraliaProAccessToken(token, `${secret}x`, now), null, "the wrong secret must fail");
assert.equal(
  decodeLeavingAustraliaProAccessToken(token, secret, now + leavingAustraliaProAccessLifetimeSeconds * 1000),
  null,
  "expired access tokens must fail",
);
assert.throws(
  () => encodeLeavingAustraliaProAccessToken({ ...entitlement, productCode: "resume_pro" }, accessSessionId, secret, now),
  /active Leaving Australia Pack Pro entitlement/,
  "a Resume Pro entitlement must never unlock Leaving Australia Pack Pro",
);
assert.throws(
  () => encodeLeavingAustraliaProAccessToken({ ...entitlement, status: "revoked" }, accessSessionId, secret, now),
  /active Leaving Australia Pack Pro entitlement/,
  "revoked entitlements must never receive a token",
);
assert.throws(
  () => encodeLeavingAustraliaProAccessToken(entitlement, "not-a-session", secret, now),
  /Invalid access session identifier/,
  "an untracked access session must never receive a cookie",
);
assert.match(accessSessionId, /^[A-Za-z0-9_-]{43}$/);
assert.match(hashLeavingAustraliaProAccessSessionId(accessSessionId), /^[a-f0-9]{64}$/);
assert.notEqual(
  accessSessionId,
  deriveLeavingAustraliaProAccessSessionId("restore", activationHash, secret),
  "activation and restore sessions must be domain-separated",
);

const restore = createLeavingAustraliaProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashLeavingAustraliaProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + leavingAustraliaProAccessLifetimeSeconds * 1000);

const restoreNonce = "b".repeat(43);
const nonceHash = hashLeavingAustraliaProRestoreNonce(restoreNonce);
const restoreSourceHash = deriveLeavingAustraliaProRestoreSourceHash(restore.tokenHash, nonceHash);
assert.match(nonceHash, /^[a-f0-9]{64}$/);
assert.match(restoreSourceHash, /^[a-f0-9]{64}$/);
assert.notEqual(restoreSourceHash, deriveLeavingAustraliaProRestoreSourceHash(restore.tokenHash, hashLeavingAustraliaProRestoreNonce("c".repeat(43))), "a restore replay from another browser nonce must derive a different session");
assert.throws(() => hashLeavingAustraliaProRestoreNonce("short"), /Invalid restore nonce/);

console.log("Leaving Australia Pack Pro server-tracked access and restore-token checks passed.");
