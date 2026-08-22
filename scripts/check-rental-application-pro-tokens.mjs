import assert from "node:assert/strict";

import {
  createRentalApplicationProRestoreCode,
  decodeRentalApplicationProAccessToken,
  encodeRentalApplicationProAccessToken,
  hashRentalApplicationProRestoreCode,
  rentalApplicationProAccessLifetimeSeconds,
} from "../src/lib/rentalApplicationProTokens.ts";

const now = Date.parse("2026-08-22T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "rental_application_pro", status: "active" };
const token = encodeRentalApplicationProAccessToken(entitlement, secret, now);

assert.deepEqual(decodeRentalApplicationProAccessToken(token, secret, now), {
  v: 1,
  entitlementId: "84",
  productCode: "rental_application_pro",
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
  () => encodeRentalApplicationProAccessToken({ ...entitlement, productCode: "resume_pro" }, secret, now),
  /active Rental Application Pack Pro entitlement/,
  "a Resume Pro entitlement must never unlock Rental Application Pack Pro",
);
assert.throws(
  () => encodeRentalApplicationProAccessToken({ ...entitlement, status: "revoked" }, secret, now),
  /active Rental Application Pack Pro entitlement/,
  "revoked entitlements must never receive a token",
);

const restore = createRentalApplicationProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashRentalApplicationProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + rentalApplicationProAccessLifetimeSeconds * 1000);

console.log("Rental Application Pack Pro access-token and restore-code checks passed.");
