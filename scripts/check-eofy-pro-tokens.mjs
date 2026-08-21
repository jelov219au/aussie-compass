import assert from "node:assert/strict";
import {
  createEofyProRestoreCode,
  decodeEofyProAccessToken,
  encodeEofyProAccessToken,
  eofyProAccessLifetimeSeconds,
  hashEofyProRestoreCode,
} from "../src/lib/eofyProTokens.ts";

const now = Date.UTC(2026, 7, 21, 9, 0, 0);
const secret = "eofy-pack-pro-test-session-secret-1234567890";
const entitlement = { id: "109", productCode: "eofy_pro", status: "active" };
const token = encodeEofyProAccessToken(entitlement, secret, now);

assert.deepEqual(decodeEofyProAccessToken(token, secret, now), {
  v: 1,
  entitlementId: "109",
  productCode: "eofy_pro",
  exp: Math.floor(now / 1000) + eofyProAccessLifetimeSeconds,
});
assert.equal(decodeEofyProAccessToken(`${token}x`, secret, now), null);
assert.equal(decodeEofyProAccessToken(token, `${secret}x`, now), null);
assert.equal(decodeEofyProAccessToken(token, secret, now + eofyProAccessLifetimeSeconds * 1000), null);
assert.throws(() => encodeEofyProAccessToken({ ...entitlement, productCode: "resume_pro" }, secret, now), /active EOFY Pack Pro entitlement/);
assert.throws(() => encodeEofyProAccessToken({ ...entitlement, status: "revoked" }, secret, now), /active EOFY Pack Pro entitlement/);

const restore = createEofyProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{43}$/);
assert.equal(hashEofyProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.tokenHash.length, 64);

console.log("EOFY Pack Pro access-token checks passed.");
