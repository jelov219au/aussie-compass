import assert from "node:assert/strict";
import {
  carBuyProAccessLifetimeSeconds,
  createCarBuyProRestoreCode,
  decodeCarBuyProAccessToken,
  encodeCarBuyProAccessToken,
  hashCarBuyProRestoreCode,
} from "../src/lib/carBuyProTokens.ts";

const now = Date.UTC(2026, 7, 21, 8, 0, 0);
const secret = "car-buy-pro-test-session-secret-1234567890";
const entitlement = { id: "108", productCode: "car_buy_pro", status: "active" };
const token = encodeCarBuyProAccessToken(entitlement, secret, now);

assert.deepEqual(decodeCarBuyProAccessToken(token, secret, now), {
  v: 1,
  entitlementId: "108",
  productCode: "car_buy_pro",
  exp: Math.floor(now / 1000) + carBuyProAccessLifetimeSeconds,
});
assert.equal(decodeCarBuyProAccessToken(`${token}x`, secret, now), null);
assert.equal(decodeCarBuyProAccessToken(token, `${secret}x`, now), null);
assert.equal(decodeCarBuyProAccessToken(token, secret, now + carBuyProAccessLifetimeSeconds * 1000), null);
assert.throws(() => encodeCarBuyProAccessToken({ ...entitlement, productCode: "resume_pro" }, secret, now), /active Car Buy Pack Pro entitlement/);
assert.throws(() => encodeCarBuyProAccessToken({ ...entitlement, status: "revoked" }, secret, now), /active Car Buy Pack Pro entitlement/);

const restore = createCarBuyProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{43}$/);
assert.equal(hashCarBuyProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.tokenHash.length, 64);

console.log("Car Buy Pack Pro access-token checks passed.");
