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
  binding = null;

  async consume(candidate, input) {
    if (candidate.status !== "active"
      || candidate.checkoutSessionId !== input.checkoutSessionId
      || candidate.productCode !== input.productCode
      || candidate.customerId !== input.customerId) {
      return { outcome: candidate.status === "revoked" ? "revoked" : candidate.status === "review" ? "review" : "missing" };
    }
    if (this.binding?.released) return { outcome: "released" };
    if (this.binding) {
      return this.binding.nonceHash === input.nonceHash
        ? { outcome: "idempotent", entitlement: candidate }
        : { outcome: "used" };
    }
    this.binding = { entitlementId: candidate.id, nonceHash: input.nonceHash, released: false };
    return { outcome: "consumed", entitlement: candidate };
  }

  release() {
    if (!this.binding) return false;
    this.binding.released = true;
    return true;
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
  nonceHash: "a".repeat(64),
};
const activationModel = new ActivationModel();
const concurrent = await Promise.all([
  activationModel.consume(activePurchase, activationInput),
  activationModel.consume(activePurchase, activationInput),
]);
assert.deepEqual(concurrent.map((result) => result.outcome), ["consumed", "idempotent"], "concurrent same-browser activation must create one binding");
assert.equal(activationModel.binding.entitlementId, activePurchase.id);
assert.equal((await activationModel.consume(activePurchase, activationInput)).outcome, "idempotent", "response-loss retry with the same nonce must remint access");
assert.equal((await activationModel.consume(activePurchase, { ...activationInput, nonceHash: "b".repeat(64) })).outcome, "used", "another browser nonce must not remint access");
assert.equal(activationModel.release(), true);
assert.equal((await activationModel.consume(activePurchase, activationInput)).outcome, "released", "release must permanently close the activation binding");

for (const mismatch of [
  { ...activationInput, checkoutSessionId: "cs_test_other123" },
  { ...activationInput, productCode: "rental_application_pro" },
  { ...activationInput, customerId: "cus_other123" },
]) {
  assert.equal((await new ActivationModel().consume(activePurchase, mismatch)).outcome, "missing", "session/customer/product mismatch must fail closed");
}
for (const status of ["revoked", "review"]) {
  const deniedModel = new ActivationModel();
  assert.equal((await deniedModel.consume({ ...activePurchase, status }, activationInput)).outcome, status);
  assert.equal(deniedModel.binding, null, `${status} must not mutate activation state`);
}

const schema = fs.readFileSync(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const gateSchema = fs.readFileSync(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8");
const activateRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/access/activate/route.ts", import.meta.url), "utf8");
const activationForm = fs.readFileSync(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8");
const releaseRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/access/release/route.ts", import.meta.url), "utf8");
const restoreRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/restore/route.ts", import.meta.url), "utf8");
const storeSource = fs.readFileSync(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const activationMigration = fs.readFileSync(new URL("../docs/migrations/20260823_checkout_activation_nonce_v1.sql", import.meta.url), "utf8");
const successPage = fs.readFileSync(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8");
const resumeProPage = fs.readFileSync(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8");

for (const contract of [
  "create table if not exists purchase_checkout_activations",
  "entitlement_id bigint primary key",
  "checkout_session_key text not null unique",
  "drop function if exists consume_checkout_activation(text, text)",
  "drop function if exists consume_checkout_activation(text, text, text)",
  "drop function if exists consume_checkout_activation(text, text, text, text)",
  "create or replace function consume_checkout_activation(",
  "entitlement.stripe_customer_id = p_customer_id",
  "activation.activation_nonce_hash is distinct from p_activation_nonce_hash",
  "'idempotent'::text",
  "'released'::text",
  "create or replace function release_checkout_activation(",
  "20260823_checkout_activation_once_v1",
  "20260823_checkout_activation_nonce_v1",
  "revoke insert, update, delete on purchase_checkout_activations from public",
  "revoke all on function consume_checkout_activation(text, text, text, text) from public",
  "revoke all on function release_checkout_activation(bigint, text) from public",
]) {
  assert.ok(schema.includes(contract), `one-time activation SQL contract is missing: ${contract}`);
}
assert.match(gateSchema, /grant execute on function public\.consume_checkout_activation\(text, text, text, text\) to hoju_app_runtime/);
assert.match(gateSchema, /grant execute on function public\.release_checkout_activation\(bigint, text\) to hoju_app_runtime/);
assert.match(gateSchema, /purchase_checkout_activations[\s\S]*from hoju_app_runtime/);
assert.match(storeSource, /select \* from consume_checkout_activation/);
assert.match(storeSource, /select \* from find_active_purchase_entitlement_by_checkout/);
assert.match(storeSource, /select \* from find_active_purchase_entitlement_by_id/);
assert.doesNotMatch(storeSource, /from (?:public\.)?purchase_entitlements/, "the runtime adapter must use limited read wrappers rather than direct table SELECT");
assert.match(activationMigration, /20260823_payment_operator_alert_outbox_v1[\s\S]*20260823_checkout_activation_nonce_v1/);
assert.match(activationMigration, /revoke select, insert, update, delete on table public\.purchase_checkout_activations, public\.purchase_entitlements from public/);
assert.match(activateRoute, /consumeCheckoutActivation/);
assert.ok(
  activateRoute.indexOf("await store.consumeCheckoutActivation") < activateRoute.indexOf("await setResumeProAccessCookie"),
  "the cookie must be minted only after the database consume wins",
);
assert.match(activateRoute, /createHash\("sha256"\)\.update\(activationNonce\)\.digest\("hex"\)/);
assert.match(activateRoute, /result\.outcome === "consumed" \|\| result\.outcome === "idempotent"/);
assert.match(activateRoute, /\/resume-pro\/restore\?status=activation-used/);
assert.match(activateRoute, /\/resume-pro\/restore\?status=activation-released/);
assert.match(activationForm, /window\.crypto\.getRandomValues/);
assert.match(activationForm, /window\.sessionStorage\.setItem\(activationStorageKey/);
assert.match(activationForm, /window\.history\.replaceState\(window\.history\.state, "", window\.location\.pathname\)/);
assert.ok(
  activationForm.indexOf("window.history.replaceState") < activationForm.indexOf("async function activate"),
  "session_id and query state must be removed during hydration, before the activation button is used",
);
assert.match(activationForm, /aria-live="polite"/);
assert.match(activationForm, /min-h-12 w-full[\s\S]*sm:w-auto/);
assert.match(activationForm, /activation_used[\s\S]*activation_released[\s\S]*activation_revoked[\s\S]*activation_review/);
assert.doesNotMatch(activationForm, /track\(/, "activation recovery must not add a new analytics event");
assert.match(successPage, /<ResumeProActivationForm initialSessionId=\{sessionId\}/);
assert.match(resumeProPage, /!existingBuyerIssue && <ResumeProVisitTracker/);
assert.match(resumeProPage, /const canOfferCheckout = checkoutAvailable && !existingBuyerIssue/);
assert.doesNotMatch(successPage, /서명된 웹훅|접근 세션/);
assert.doesNotMatch(activateRoute, /setResumeProAccessCookie\([^)]*findActiveByCheckoutSession/);
assert.match(releaseRoute, /releaseCheckoutActivation/);
assert.ok(
  releaseRoute.indexOf("await store.releaseCheckoutActivation") < releaseRoute.indexOf("await clearResumeProAccessCookie"),
  "server release must permanently close nonce recovery before clearing the cookie",
);
assert.match(restoreRoute, /consumeRestoreTokenHash/);
assert.match(restoreRoute, /setResumeProAccessCookie/);

console.log("Resume Pro access-token and restore-code checks passed.");
