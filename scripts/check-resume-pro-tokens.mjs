import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import fs from "node:fs";

import {
  createResumeProRestoreCode,
  decodeResumeProAccessToken,
  deriveResumeProAccessSessionId,
  encodeResumeProAccessToken,
  hashResumeProAccessSessionId,
  hashResumeProRestoreCode,
  resumeProAccessLifetimeSeconds,
} from "../src/lib/resumeProTokens.ts";

const now = Date.parse("2026-08-19T00:00:00.000Z");
const secret = "test-only-secret-that-is-longer-than-thirty-two-characters";
const entitlement = { id: "42", productCode: "resume_pro", status: "active" };
const activationSourceHash = "a".repeat(64);
const accessSessionId = deriveResumeProAccessSessionId("activation", activationSourceHash, secret);
const token = encodeResumeProAccessToken(entitlement, accessSessionId, secret, now);

assert.deepEqual(decodeResumeProAccessToken(token, secret, now), {
  v: 2,
  entitlementId: "42",
  productCode: "resume_pro",
  accessSessionId,
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
  () => encodeResumeProAccessToken({ ...entitlement, status: "revoked" }, accessSessionId, secret, now),
  /active Resume Pro entitlement/,
  "revoked entitlements must never receive a token",
);
assert.throws(
  () => encodeResumeProAccessToken(entitlement, accessSessionId, "too-short", now),
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
  sessions = [];
  now = now;

  async consume(candidate, input) {
    if (candidate.status !== "active"
      || candidate.checkoutSessionId !== input.checkoutSessionId
      || candidate.productCode !== input.productCode
      || candidate.customerId !== input.customerId) {
      return { outcome: candidate.status === "revoked" ? "revoked" : candidate.status === "review" ? "review" : "missing" };
    }
    if (this.binding?.released) return { outcome: "released" };
    if (this.binding) {
      if (this.binding.nonceHash !== input.nonceHash) return { outcome: "used" };
      const access = this.sessions.find((session) => session.source === "activation");
      if (!access || access.sessionHash !== input.accessSessionHash) return { outcome: "used" };
      if (access.revoked || access.expiresAt <= this.now) return { outcome: "released" };
      return { outcome: "idempotent", entitlement: candidate };
    }
    this.binding = { entitlementId: candidate.id, nonceHash: input.nonceHash, released: false };
    this.sessions.push({
      entitlementId: candidate.id,
      productCode: candidate.productCode,
      sessionHash: input.accessSessionHash,
      source: "activation",
      expiresAt: input.expiresAt,
      revoked: false,
    });
    return { outcome: "consumed", entitlement: candidate };
  }

  addRestoreSession(candidate, sessionHash, expiresAt) {
    this.sessions.push({
      entitlementId: candidate.id,
      productCode: candidate.productCode,
      sessionHash,
      source: "restore",
      expiresAt,
      revoked: false,
    });
  }

  access(candidate, sessionHash) {
    const session = this.sessions.find((entry) => entry.sessionHash === sessionHash);
    return candidate.status === "active"
      && session?.entitlementId === candidate.id
      && session.productCode === candidate.productCode
      && !session.revoked
      && session.expiresAt > this.now;
  }

  release(sessionHash) {
    const session = this.sessions.find((entry) => entry.sessionHash === sessionHash);
    if (!session) return false;
    session.revoked = true;
    if (session.source === "activation" && this.binding) this.binding.released = true;
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
  accessSessionHash: hashResumeProAccessSessionId(accessSessionId),
  expiresAt: now + resumeProAccessLifetimeSeconds * 1000,
};
const activationModel = new ActivationModel();
const concurrent = await Promise.all([
  activationModel.consume(activePurchase, activationInput),
  activationModel.consume(activePurchase, activationInput),
]);
assert.deepEqual(concurrent.map((result) => result.outcome), ["consumed", "idempotent"], "concurrent same-browser activation must create one binding");
assert.equal(activationModel.binding.entitlementId, activePurchase.id);
assert.equal((await activationModel.consume(activePurchase, activationInput)).outcome, "idempotent", "response-loss retry with the same nonce must remint access");
assert.equal(activationModel.access(activePurchase, activationInput.accessSessionHash), true, "an active server session must allow access");
assert.equal((await activationModel.consume(activePurchase, { ...activationInput, nonceHash: "b".repeat(64) })).outcome, "used", "another browser nonce must not remint access");
assert.equal((await activationModel.consume(activePurchase, { ...activationInput, accessSessionHash: "b".repeat(64) })).outcome, "used", "a session mismatch must fail closed");
const restoreSessionHash = "c".repeat(64);
activationModel.addRestoreSession(activePurchase, restoreSessionHash, activationInput.expiresAt);
assert.equal(activationModel.access(activePurchase, restoreSessionHash), true);
assert.equal(activationModel.release(activationInput.accessSessionHash), true);
assert.equal(activationModel.access(activePurchase, activationInput.accessSessionHash), false, "release response loss must leave the old cookie denied by the server");
assert.equal(activationModel.access(activePurchase, restoreSessionHash), true, "releasing this device must not revoke another restore session");
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

const expiredModel = new ActivationModel();
await expiredModel.consume(activePurchase, { ...activationInput, expiresAt: now - 1 });
assert.equal(expiredModel.access(activePurchase, activationInput.accessSessionHash), false, "an expired access session must be denied");
assert.equal(activationModel.access({ ...activePurchase, status: "revoked" }, restoreSessionHash), false, "a refund must deny every session");
assert.equal(activationModel.access({ ...activePurchase, status: "review" }, restoreSessionHash), false, "review must deny every session");

const schema = fs.readFileSync(new URL("../docs/entitlement-storage.sql", import.meta.url), "utf8");
const gateSchema = fs.readFileSync(new URL("../docs/first-sale-gate.sql", import.meta.url), "utf8");
const activateRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/access/activate/route.ts", import.meta.url), "utf8");
const activationForm = fs.readFileSync(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8");
const releaseRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/access/release/route.ts", import.meta.url), "utf8");
const restoreRoute = fs.readFileSync(new URL("../src/app/api/resume-pro/restore/route.ts", import.meta.url), "utf8");
const storeSource = fs.readFileSync(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const activationMigration = fs.readFileSync(new URL("../docs/migrations/20260823_checkout_activation_nonce_v1.sql", import.meta.url), "utf8");
const accessSessionMigration = fs.readFileSync(new URL("../docs/migrations/20260823_purchase_access_sessions_v1.sql", import.meta.url), "utf8");
const successPage = fs.readFileSync(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8");
const resumeProPage = fs.readFileSync(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8");
const tokenSource = fs.readFileSync(new URL("../src/lib/resumeProTokens.ts", import.meta.url), "utf8");
const accessSource = fs.readFileSync(new URL("../src/lib/resumeProAccess.ts", import.meta.url), "utf8");

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
assert.match(gateSchema, /grant execute on function public\.consume_checkout_activation\(text, text, text, text, text, text, timestamptz\) to hoju_app_runtime/);
assert.match(gateSchema, /grant execute on function public\.release_purchase_access_session\(bigint, text, text\) to hoju_app_runtime/);
assert.match(gateSchema, /grant execute on function public\.find_active_purchase_entitlement_by_access_session\(bigint, text, text\) to hoju_app_runtime/);
assert.match(gateSchema, /purchase_checkout_activations[\s\S]*from hoju_app_runtime/);
assert.match(storeSource, /select \* from consume_checkout_activation/);
assert.match(storeSource, /select \* from find_active_purchase_entitlement_by_checkout/);
assert.match(storeSource, /select \* from find_active_purchase_entitlement_by_id/);
assert.match(storeSource, /select \* from find_active_purchase_entitlement_by_access_session/);
assert.match(storeSource, /select release_purchase_access_session/);
assert.doesNotMatch(storeSource, /from (?:public\.)?purchase_entitlements/, "the runtime adapter must use limited read wrappers rather than direct table SELECT");
assert.match(activationMigration, /20260823_payment_operator_alert_outbox_v1[\s\S]*20260823_checkout_activation_nonce_v1/);
assert.match(activationMigration, /revoke select, insert, update, delete on table public\.purchase_checkout_activations, public\.purchase_entitlements from public/);
for (const contract of [
  "create table if not exists public.purchase_access_sessions",
  "access_session_hash text not null unique",
  "session_source text not null check (session_source in ('activation', 'restore'))",
  "drop function if exists public.consume_checkout_activation(text, text, text, text)",
  "create function public.consume_checkout_activation(",
  "p_access_session_hash text",
  "drop function if exists public.consume_entitlement_restore_token(text, text)",
  "create function public.consume_entitlement_restore_token(",
  "create function public.find_active_purchase_entitlement_by_access_session(",
  "create function public.release_purchase_access_session(",
  "access.revoked_at is null and access.expires_at > now()",
  "set revoked_at = coalesce(access.revoked_at, now())",
  "session_source = 'activation'",
  "20260823_purchase_access_sessions_v1",
  "revoke all on table public.purchase_access_sessions from public",
]) assert.ok(accessSessionMigration.includes(contract), `server access-session SQL contract is missing: ${contract}`);
assert.match(activateRoute, /consumeCheckoutActivation/);
assert.ok(
  activateRoute.indexOf("await store.consumeCheckoutActivation") < activateRoute.indexOf("await setResumeProAccessCookie"),
  "the cookie must be minted only after the database consume wins",
);
assert.match(accessSessionId, /^[A-Za-z0-9_-]{43}$/);
assert.match(hashResumeProAccessSessionId(accessSessionId), /^[a-f0-9]{64}$/);
assert.equal(
  deriveResumeProAccessSessionId("activation", activationSourceHash, secret),
  accessSessionId,
  "the same activation nonce hash must derive one stable access session",
);
assert.notEqual(
  deriveResumeProAccessSessionId("restore", activationSourceHash, secret),
  accessSessionId,
  "activation and restore sources must be domain-separated",
);

const legacyPayload = Buffer.from(JSON.stringify({
  v: 1,
  entitlementId: "42",
  productCode: "resume_pro",
  exp: Math.floor(now / 1000) + resumeProAccessLifetimeSeconds,
})).toString("base64url");
const legacySignature = createHmac("sha256", secret).update(legacyPayload).digest("base64url");
assert.equal(
  decodeResumeProAccessToken(`${legacyPayload}.${legacySignature}`, secret, now),
  null,
  "legacy cookies without a server access session must fail closed",
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
assert.match(releaseRoute, /releaseAccessSession/);
assert.ok(
  releaseRoute.indexOf("await store.releaseAccessSession") < releaseRoute.indexOf("await clearResumeProAccessCookie"),
  "server release must revoke the exact access session before clearing the cookie",
);
assert.match(restoreRoute, /consumeRestoreTokenHash/);
assert.match(restoreRoute, /setResumeProAccessCookie/);
assert.match(activateRoute, /createAccessSession\("activation", nonceHash\)/);
assert.match(restoreRoute, /createAccessSession\("restore", restoreHash\)/);
assert.match(tokenSource, /v: 2/);
assert.match(tokenSource, /accessSessionId: string/);
assert.match(accessSource, /findActiveByAccessSession/);
assert.match(accessSource, /hashResumeProAccessSessionId\(payload\.accessSessionId\)/);
assert.doesNotMatch(accessSource, /findActiveById\(payload\.entitlementId/, "cookie validation must require the server access session");

console.log("Resume Pro access-token and restore-code checks passed.");
