import assert from "node:assert/strict";
import { createRentalProRestoreCode, decodeRentalProAccessToken, encodeRentalProAccessToken, hashRentalProRestoreCode, rentalProAccessLifetimeSeconds } from "../src/lib/rentalProTokens.ts";

const now = Date.parse("2026-08-21T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "rental_application_pro", status: "active" };
const token = encodeRentalProAccessToken(entitlement, secret, now);

assert.deepEqual(decodeRentalProAccessToken(token, secret, now), { v: 1, entitlementId: "84", productCode: "rental_application_pro", exp: Math.floor(now / 1000) + rentalProAccessLifetimeSeconds });
assert.equal(decodeRentalProAccessToken(`${token}x`, secret, now), null);
assert.equal(decodeRentalProAccessToken(token, `${secret}x`, now), null);
assert.equal(decodeRentalProAccessToken(token, secret, now + rentalProAccessLifetimeSeconds * 1000), null);
assert.throws(() => encodeRentalProAccessToken({ ...entitlement, productCode: "resume_pro" }, secret, now), /active Rental Pro entitlement/);
assert.throws(() => encodeRentalProAccessToken({ ...entitlement, status: "revoked" }, secret, now), /active Rental Pro entitlement/);

const restore = createRentalProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashRentalProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + rentalProAccessLifetimeSeconds * 1000);

console.log("Rental Pro access-token and restore-code checks passed.");
