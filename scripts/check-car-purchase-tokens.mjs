import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  carPurchaseProAccessLifetimeSeconds,
  carPurchaseProRestoreLifetimeSeconds,
  encodeCarPurchaseProAccessToken as encode,
  decodeCarPurchaseProAccessToken as decode,
  deriveCarPurchaseProAccessSessionId as deriveSession,
  hashCarPurchaseProAccessSessionId as hashSession,
  createCarPurchaseProRestoreCode as createRestore,
  hashCarPurchaseProRestoreCode as hashRestore,
  hashCarPurchaseProRestoreNonce as hashNonce,
  deriveCarPurchaseProRestoreSourceHash as deriveRestore,
} from "../src/lib/carPurchaseProTokens.ts";
import {
  encodeLeavingAustraliaProAccessToken as encodeLeaving,
  decodeLeavingAustraliaProAccessToken as decodeLeaving,
  deriveLeavingAustraliaProAccessSessionId as deriveLeavingSession,
  hashLeavingAustraliaProRestoreCode as hashLeavingRestore,
} from "../src/lib/leavingAustraliaProTokens.ts";

// Synthetic credentials only. No network, database, or entitlement mutation.
const secret = "synthetic-car-token-secret-".repeat(2);
const now = Date.parse("2026-09-03T00:00:00Z");
const entitlement = { id: "101", productCode: "car_purchase_pro", status: "active" };
const sourceHash = "a".repeat(64);
const session = deriveSession("activation", sourceHash, secret);
const token = encode(entitlement, session, secret, now);
const payload = decode(token, secret, now);
assert.equal(payload.entitlementId, "101");
assert.equal(payload.accessSessionId, session);
assert.equal(payload.exp, now / 1000 + carPurchaseProAccessLifetimeSeconds);
assert.equal(decode(token, secret, payload.exp * 1000), null, "expiry boundary");
assert.ok(decode(token, secret, payload.exp * 1000 - 1));
assert.equal(deriveSession("activation", sourceHash, secret), session);
assert.notEqual(deriveSession("restore", sourceHash, secret), session);
assert.notEqual(deriveLeavingSession("activation", sourceHash, secret), session);

for (const invalid of [undefined, "", "x".repeat(4097), token + ".", token + ".extra", token.slice(0, -1), token.replace(/.$/, "!"), "invalid.signature"]) {
  assert.equal(decode(invalid, secret, now), null, "malformed token rejected");
}
for (const wrongSecret of [undefined, null, "short", "wrong-key-".repeat(5)]) {
  assert.equal(decode(token, wrongSecret, now), null, "missing/wrong key rejected");
}
const signed = (value) => {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return encoded + "." + createHmac("sha256", secret).update("car-purchase-pro-token-v1:" + encoded).digest("base64url");
};
for (const value of [null, [], {}, { ...payload, v: 1 }, { ...payload, entitlementId: 101 }, { ...payload, entitlementId: "bad" }, { ...payload, accessSessionId: "bad" }, { ...payload, exp: "future" }, { ...payload, exp: payload.exp + 0.5 }, { ...payload, exp: Number.MAX_SAFE_INTEGER + 1 }]) {
  assert.equal(decode(signed(value), secret, now), null, "signed invalid payload rejected");
}
for (const productCode of ["resume_pro", "rental_application_pro", "pay_evidence_pro", "eofy_pro", "leaving_australia_pro", "car_buy_pro", ""]) {
  assert.throws(() => encode({ ...entitlement, productCode }, session, secret, now));
  assert.equal(decode(signed({ ...payload, productCode }), secret, now), null);
}
for (const status of ["pending", "refunded", "revoked", "expired"]) {
  assert.throws(() => encode({ ...entitlement, status }, session, secret, now));
}
const leavingToken = encodeLeaving({ ...entitlement, productCode: "leaving_australia_pro" }, session, secret, now);
assert.equal(decode(leavingToken, secret, now), null);
assert.equal(decodeLeaving(token, secret, now), null);
// Even a valid car payload signed with another Pack's unprefixed scheme is rejected.
const encoded = token.split(".")[0];
assert.equal(decode(encoded + "." + createHmac("sha256", secret).update(encoded).digest("base64url"), secret, now), null);
for (const invalidTime of [NaN, Infinity, -Infinity]) {
  assert.throws(() => encode(entitlement, session, secret, invalidTime));
  assert.throws(() => createRestore(invalidTime));
  assert.equal(decode(token, secret, invalidTime), null);
}
assert.throws(() => encode(entitlement, "bad", secret, now));
assert.throws(() => encode(entitlement, session, "short", now));
assert.throws(() => deriveSession("other", sourceHash, secret));
assert.throws(() => deriveSession("activation", "bad", secret));
assert.throws(() => hashSession("bad"));
assert.match(hashSession(session), /^[a-f0-9]{64}$/);

const restore = createRestore(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{43}$/);
assert.equal(restore.tokenHash, hashRestore(restore.token));
assert.equal(hashRestore(" " + restore.token + "\n"), restore.tokenHash);
assert.notEqual(hashLeavingRestore(restore.token), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + carPurchaseProRestoreLifetimeSeconds * 1000);
const nonceHash = hashNonce("n".repeat(40));
const restoreSource = deriveRestore(restore.tokenHash, nonceHash);
assert.match(restoreSource, /^[a-f0-9]{64}$/);
assert.notEqual(restoreSource, deriveRestore(restore.tokenHash, hashNonce("m".repeat(40))));
for (const invalid of ["", "x".repeat(42), "!".repeat(43), "x".repeat(44)]) assert.throws(() => hashRestore(invalid));
for (const invalid of ["", "x".repeat(39), "x".repeat(129), "!".repeat(40)]) assert.throws(() => hashNonce(invalid));
assert.throws(() => deriveRestore("bad", nonceHash));
assert.throws(() => deriveRestore(restore.tokenHash, "bad"));

// Single-use restore, active status after issuance, and revocation require DB integration.
console.log("PASS car purchase token isolation, signature, expiry, and restore-hash contracts (no DB lifecycle assertions)");
