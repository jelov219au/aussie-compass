import assert from "node:assert/strict";

import {
  createResumeProRestoreCode,
  decodeResumeProAccessToken,
  encodeResumeProAccessToken,
  hashResumeProRestoreCode,
  resumeProAccessLifetimeSeconds,
} from "../src/lib/resumeProTokens.ts";

const now = Date.parse("2026-08-19T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "42", productCode: "resume_pro", status: "active" };
const token = encodeResumeProAccessToken(entitlement, secret, now);

assert.deepEqual(decodeResumeProAccessToken(token, secret, now), {
  v: 1,
  entitlementId: "42",
  productCode: "resume_pro",
  exp: Math.floor(now / 1000) + resumeProAccessLifetimeSeconds,
});
assert.equal(decodeResumeProAccessToken(`${token}x`, secret, now), null, "tampered signatures must fail");
assert.equal(decodeResumeProAccessToken(token, `${secret}x`, now), null, "the wrong secret must fail");
assert.equal(
  decodeResumeProAccessToken(token, secret, now + resumeProAccessLifetimeSeconds * 1000),
  null,
  "expired access tokens must fail",
);
assert.throws(
  () => encodeResumeProAccessToken({ ...entitlement, status: "revoked" }, secret, now),
  /active Resume Pro entitlement/,
  "revoked entitlements must never receive a token",
);
assert.throws(
  () => encodeResumeProAccessToken(entitlement, "too-short", now),
  /not configured/,
  "short signing secrets must fail closed",
);

const restore = createResumeProRestoreCode(now);
assert.match(restore.token, /^[A-Za-z0-9_-]{40,}$/);
assert.match(restore.tokenHash, /^[a-f0-9]{64}$/);
assert.equal(hashResumeProRestoreCode(` ${restore.token} `), restore.tokenHash);
assert.equal(restore.expiresAt.getTime(), now + resumeProAccessLifetimeSeconds * 1000);

console.log("Resume Pro access-token and restore-code checks passed.");
