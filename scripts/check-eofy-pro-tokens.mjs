import assert from "node:assert/strict";

import {
  createEofyProRestoreCode,
  decodeEofyProAccessToken,
  deriveEofyProAccessSessionId,
  deriveEofyProRestoreSourceHash,
  encodeEofyProAccessToken,
  hashEofyProAccessSessionId,
  hashEofyProRestoreCode,
  hashEofyProRestoreNonce,
  eofyProAccessLifetimeSeconds,
} from "../src/lib/eofyProTokens.ts";

const now = Date.parse("2026-08-30T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "eofy_pro", status: "active" };
const activationHash = "a".repeat(64);
const accessSessionId = deriveEofyProAccessSessionId("activation", activationHash, secret);
const token = encodeEofyProAccessToken(entitlement, accessSessionId, secret, now);

assert.deepEqual(decodeEofyProAccessToken(token, secret, now), {
  v: 2,
  entitlementId: "84",
  productCode: "eofy_pro",
  accessSessionId,
  exp: Math.floor(now / 1000) + eofyProAccessLifetimeSeconds,
});
assert.equal(decodeEofyProAccessToken(`${token}x`, secret, now), null, "tampered signatures must fail");
assert.equal(decodeEofyProAccessToken(token, `${secret}x`, now), null, "the wrong secret must fail");
assert.equal(
  decodeEofyProAccessToken(token, secret, now + eofyProAccessLifetimeSeconds * 1000),
  null,
  "expired access tokens must fail",
);
assert.throws(
  () => encodeEofyProAccessToken({ ...entitlement, productCode: "resume_pro" }, accessSessionId, secret, now),
  /active EOFY Pack Pro entitlement/,
  "a Resume Pro entitlement must never unlock EOFY Pack Pro",
);
assert.throws(
  () => encodeEofyProAccessToken({ ...entitlement, status: "revoked" }, accessSessionId, secret, now),
  /active EOFY Pack Pro entitlement/,
  "revoked entitlements must never receive a token",
);
assert.throws(
  () => encodeEofyProAccessToken(entitlement, "not-a-session", secret, now),
  /Invalid access session identifier/,
  "an untracked access session must never receive a cookie",
);
assert.match(accessSessionId, /^[A-Za-z0-9_-]{43}$/);
assert.match(hashEofyProAccessSessionId(accessSessionId), /^[a-f0-9]{64}$/);
assert.notEqual(
  accessSessionId,
  deriveEofyProAccessSessionId("restore", activationHash, secret),
  "activation and restore sessions must be domain-separated",
);

const restore = createEofyProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashEofyProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + eofyProAccessLifetimeSeconds * 1000);

const restoreNonce = "b".repeat(43);
const nonceHash = hashEofyProRestoreNonce(restoreNonce);
const restoreSourceHash = deriveEofyProRestoreSourceHash(restore.tokenHash, nonceHash);
assert.match(nonceHash, /^[a-f0-9]{64}$/);
assert.match(restoreSourceHash, /^[a-f0-9]{64}$/);
assert.notEqual(restoreSourceHash, deriveEofyProRestoreSourceHash(restore.tokenHash, hashEofyProRestoreNonce("c".repeat(43))), "a restore replay from another browser nonce must derive a different session");
assert.throws(() => hashEofyProRestoreNonce("short"), /Invalid restore nonce/);

console.log("EOFY Pack Pro server-tracked access and restore-token checks passed.");
