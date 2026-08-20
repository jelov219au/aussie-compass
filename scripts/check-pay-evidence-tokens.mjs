import assert from "node:assert/strict";
import {
  createPayEvidenceRestoreCode,
  decodePayEvidenceAccessToken,
  encodePayEvidenceAccessToken,
  hashPayEvidenceRestoreCode,
  payEvidenceAccessLifetimeSeconds,
} from "../src/lib/payEvidenceTokens.ts";

const now = Date.parse("2026-08-21T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "84", productCode: "pay_evidence_pro", status: "active" };
const token = encodePayEvidenceAccessToken(entitlement, secret, now);

assert.deepEqual(decodePayEvidenceAccessToken(token, secret, now), {
  v: 1,
  entitlementId: "84",
  productCode: "pay_evidence_pro",
  exp: Math.floor(now / 1000) + payEvidenceAccessLifetimeSeconds,
});
assert.equal(decodePayEvidenceAccessToken(`${token}x`, secret, now), null);
assert.equal(decodePayEvidenceAccessToken(token, `${secret}x`, now), null);
assert.equal(decodePayEvidenceAccessToken(token, secret, now + payEvidenceAccessLifetimeSeconds * 1000), null);
assert.throws(() => encodePayEvidenceAccessToken({ ...entitlement, productCode: "resume_pro" }, secret, now), /active Pay Evidence Pro entitlement/);
assert.throws(() => encodePayEvidenceAccessToken({ ...entitlement, status: "revoked" }, secret, now), /active Pay Evidence Pro entitlement/);

const restore = createPayEvidenceRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.equal(hashPayEvidenceRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + payEvidenceAccessLifetimeSeconds * 1000);

console.log("Pay Evidence Pro access-token and restore-code checks passed.");
