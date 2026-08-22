import assert from "node:assert/strict";
import fs from "node:fs";

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

class ActivationModel {
  consumed = new Set();

  async consume(candidate, input) {
    if (candidate.status !== "active"
      || candidate.checkoutSessionId !== input.checkoutSessionId
      || candidate.productCode !== input.productCode
      || candidate.customerId !== input.customerId
      || this.consumed.has(candidate.id)) return null;
    this.consumed.add(candidate.id);
    return candidate;
  }
}

const activePurchase = {
  id: "42",
  status: "active",
  productCode: "resume_pro",
  checkoutSessionId: "cs_test_activation123",
  customerId: "cus_activation123",
};
const activationInput = {
  checkoutSessionId: activePurchase.checkoutSessionId,
  productCode: activePurchase.productCode,
  customerId: activePurchase.customerId,
};
const activationModel = new ActivationModel();
const concurrent = await Promise.all([
  activationModel.consume(activePurchase, activationInput),
  activationModel.consume(activePurchase, activationInput),
]);
assert.equal(concurrent.filter(Boolean).length, 1, "concurrent activation must have exactly one winner");
assert.equal(await activationModel.consume(activePurchase, activationInput), null, "the success URL must be one-time");
assert.equal(activationModel.consumed.size, 1, "releasing a browser cookie must not reopen activation");

for (const mismatch of [
  { ...activationInput, checkoutSessionId: "cs_test_other123" },
  { ...activationInput, productCode: "rental_application_pro" },
  { ...activationInput, customerId: "cus_other123" },
]) {
  assert.equal(await new ActivationModel().consume(activePurchase, mismatch), null, "session/customer/product mismatch must fail closed");
}
for (const status of ["revoked", "review"]) {
  const deniedModel = new ActivationModel();
  assert.equal(await deniedModel.consume({ ...activePurchase, status }, activationInput), null);
  assert.equal(deniedModel.consumed.size, 0, `${status} must not mutate activation state`);
}

const schema = fs.readFileSync(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const gateSchema = fs.readFileSync(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8");
const activateRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/access/activate/route.ts", import.meta.url), "utf8");
const activationForm = fs.readFileSync(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8");
const releaseRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/access/release/route.ts", import.meta.url), "utf8");
const restoreRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/restore/route.ts", import.meta.url), "utf8");
const storeSource = fs.readFileSync(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");

for (const contract of [
  "create table if not exists purchase_checkout_activations",
  "entitlement_id bigint primary key",
  "checkout_session_key text not null unique",
  "drop function if exists consume_checkout_activation(text, text)",
  "drop function if exists consume_checkout_activation(text, text, text)",
  "create or replace function consume_checkout_activation(",
  "entitlement.status = 'active'",
  "entitlement.stripe_customer_id = p_customer_id",
  "on conflict do nothing",
  "20260823_checkout_activation_once_v1",
  "revoke insert, update, delete on purchase_checkout_activations from public",
  "revoke all on function consume_checkout_activation(text, text, text) from public",
]) {
  assert.ok(schema.includes(contract), `one-time activation SQL contract is missing: ${contract}`);
}
assert.match(gateSchema, /grant execute on function public\.consume_checkout_activation\(text, text, text\) to hoju_app_runtime/);
assert.match(gateSchema, /purchase_checkout_activations[\s\S]*from hoju_app_runtime/);
assert.match(storeSource, /select \* from consume_checkout_activation/);
assert.match(activateRoute, /consumeCheckoutActivation/);
assert.ok(
  activateRoute.indexOf("await store.consumeCheckoutActivation") < activateRoute.indexOf("await setResumeProAccessCookie"),
  "the cookie must be minted only after the database consume wins",
);
assert.match(activateRoute, /\/resume-pro\/restore\?status=activation-used/);
assert.match(activateRoute, /new URL\("\/resume-pro\/workspace"/);
assert.match(activationForm, /window\.history\.replaceState\(null, "", "\/resume-pro\/success"\)/);
assert.ok(
  activationForm.indexOf("window.history.replaceState") < activationForm.indexOf("session_id"),
  "the current history entry must drop session_id when activation is submitted",
);
assert.doesNotMatch(activateRoute, /setResumeProAccessCookie\([^)]*findActiveByCheckoutSession/);
assert.doesNotMatch(releaseRoute, /purchase_checkout_activations|consumeCheckoutActivation/, "cookie release must never reopen activation");
assert.match(restoreRoute, /consumeRestoreTokenHash/);
assert.match(restoreRoute, /setResumeProAccessCookie/);

console.log("Resume Pro access-token and restore-code checks passed.");
