import assert from "node:assert/strict";

import {
  createRentalApplicationProRestoreCode,
  decodeRentalApplicationProAccessToken,
  deriveRentalApplicationProAccessSessionId,
  deriveRentalApplicationProRestoreSourceHash,
  encodeRentalApplicationProAccessToken,
  hashRentalApplicationProAccessSessionId,
  hashRentalApplicationProRestoreCode,
  hashRentalApplicationProRestoreNonce,
  rentalApplicationProAccessLifetimeSeconds,
} from "../src/lib/rentalApplicationProTokens.ts";

const now = Date.parse("2026-08-22T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "rental_application_pro", status: "active" };
const activationHash = "a".repeat(64);
const accessSessionId = deriveRentalApplicationProAccessSessionId("activation", activationHash, secret);
const token = encodeRentalApplicationProAccessToken(entitlement, accessSessionId, secret, now);

assert.deepEqual(decodeRentalApplicationProAccessToken(token, secret, now), {
  v: 2,
  entitlementId: "84",
  productCode: "rental_application_pro",
  accessSessionId,
  exp: Math.floor(now / 1000) + rentalApplicationProAccessLifetimeSeconds,
});
assert.equal(decodeRentalApplicationProAccessToken(`${token}x`, secret, now), null, "tampered signatures must fail");
assert.equal(decodeRentalApplicationProAccessToken(token, `${secret}x`, now), null, "the wrong secret must fail");
assert.equal(
  decodeRentalApplicationProAccessToken(token, secret, now + rentalApplicationProAccessLifetimeSeconds * 1000),
  null,
  "expired access tokens must fail",
);
assert.throws(
  () => encodeRentalApplicationProAccessToken({ ...entitlement, productCode: "resume_pro" }, accessSessionId, secret, now),
  /active Rental Application Pack Pro entitlement/,
  "a Resume Pro entitlement must never unlock Rental Application Pack Pro",
);
assert.throws(
  () => encodeRentalApplicationProAccessToken({ ...entitlement, status: "revoked" }, accessSessionId, secret, now),
  /active Rental Application Pack Pro entitlement/,
  "revoked entitlements must never receive a token",
);
assert.throws(
  () => encodeRentalApplicationProAccessToken(entitlement, "not-a-session", secret, now),
  /server-tracked access session/,
  "an untracked access session must never receive a cookie",
);
assert.match(accessSessionId, /^[A-Za-z0-9_-]{43}$/);
assert.match(hashRentalApplicationProAccessSessionId(accessSessionId), /^[a-f0-9]{64}$/);
assert.notEqual(
  accessSessionId,
  deriveRentalApplicationProAccessSessionId("restore", activationHash, secret),
  "activation and restore sessions must be domain-separated",
);

const restore = createRentalApplicationProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashRentalApplicationProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + rentalApplicationProAccessLifetimeSeconds * 1000);

const restoreNonce = "b".repeat(43);
const nonceHash = hashRentalApplicationProRestoreNonce(restoreNonce);
const restoreSourceHash = deriveRentalApplicationProRestoreSourceHash(restore.tokenHash, nonceHash);
assert.match(nonceHash, /^[a-f0-9]{64}$/);
assert.match(restoreSourceHash, /^[a-f0-9]{64}$/);
assert.notEqual(restoreSourceHash, deriveRentalApplicationProRestoreSourceHash(restore.tokenHash, hashRentalApplicationProRestoreNonce("c".repeat(43))), "a restore replay from another browser nonce must derive a different session");
assert.throws(() => hashRentalApplicationProRestoreNonce("short"), /Invalid restore nonce/);

console.log("Rental Application Pack Pro server-tracked access and restore-token checks passed.");
