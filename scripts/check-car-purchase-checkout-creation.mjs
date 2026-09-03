import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "firstSaleGate", "carPurchaseProCheckoutCreation"]) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017,
  } }).outputText, { exports: compiledModule.exports, module: compiledModule, Date, URL,
    require: dependency => {
      if (dependency === "server-only") return {};
      if (dependency === "node:crypto") return crypto;
      if (modules.has(dependency)) return modules.get(dependency);
      throw new Error("Unexpected checkout creation import: " + dependency);
    },
  }, { filename: name + ".ts" });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseCheckoutCreation: create } = modules.get("./carPurchaseProCheckoutCreation");
const productCode = "car_purchase_pro";
const at = Date.parse("2026-09-04T00:00:00Z");
// Synthetic IDs/amount only, never an offer or sale approval.
const offer = { productCode, currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_creation", stripeProductId: "prod_creation", termsVersion: "2026-09-03" };
const priceFixture = { id: offer.stripePriceId, active: true, type: "one_time", currency: "aud",
  unit_amount: offer.priceCents, tax_behavior: "inclusive", livemode: false,
  product: { id: offer.stripeProductId, active: true, livemode: false,
    metadata: { product_code: productCode, billing_model: "one_time" } } };
let cases = 0;
function fixture(options = {}) {
  const events = [], claims = [], creates = [], attachments = [], releases = [], errors = [];
  let time = at;
  const check = fn => { try { fn(); } catch (error) { errors.push(error); throw error; } };
  const mode = options.mode ?? "test";
  const deps = {
    enabled: true, approvedOffer: { ...offer }, expectedMode: mode, stripeMode: mode,
    deployment: mode === "live" ? "production" : "nonproduction", expectedOrigin: "https://integration.example",
    now: () => time,
    checkPrerequisites: async reviewed => {
      events.push("prerequisites");
      check(() => { assert.equal(reviewed.productCode, productCode); assert.equal(reviewed.priceCents, 1234); });
      if (options.mutateOffer) deps.approvedOffer.priceCents = 1;
      if (options.prerequisiteError) throw new Error("private prerequisite detail");
      return options.prerequisites ?? true;
    },
    hasActiveAccess: async () => { events.push("access"); if (options.accessError) throw new Error("private lookup detail"); return "active" in options ? options.active : false; },
    provider: {
      retrievePrice: async (id, expand) => {
        events.push("price");
        check(() => { assert.equal(id, offer.stripePriceId); assert.equal(JSON.stringify(expand), '{"expand":["product"]}'); });
        if (options.priceError) throw new Error("private price detail");
        return options.price ?? { ...priceFixture, livemode: mode === "live", product: { ...priceFixture.product, livemode: mode === "live" } };
      },
      createSession: async (params, requestOptions) => {
        events.push("create"); creates.push({ params, requestOptions });
        if (options.createError) throw options.createError;
        if ("afterCreateTime" in options) time = options.afterCreateTime;
        const id = `cs_${mode}_creation`;
        const session = { id, url: `https://checkout.stripe.com/c/pay/${id}#synthetic`, livemode: mode === "live",
          mode: "payment", status: "open", payment_status: "unpaid", currency: "aud", amount_total: 1234,
          amount_subtotal: 1234, metadata: { ...params.metadata }, expires_at: params.expires_at };
        return options.session ? { ...session, ...options.session } : session;
      },
    },
    gate: {
      claimReservation: async input => {
        events.push("claim"); claims.push(input);
        if (options.claimError) throw new Error("private claim detail");
        if ("afterClaimTime" in options) time = options.afterClaimTime;
        return "claim" in options ? options.claim : { outcome: "claimed", generation: 7 };
      },
      attachCheckoutSession: async input => {
        events.push("attach"); attachments.push(input);
        if (options.attachError) throw options.attachError;
        if ("afterAttachTime" in options) time = options.afterAttachTime;
        return "attached" in options ? options.attached : true;
      },
      releaseFailedReservation: async input => {
        events.push("release"); releases.push(input);
        if (options.releaseError) throw new Error("private release detail");
        return "released" in options ? options.released : true;
      },
    },
    ...options.deps,
  };
  return { events, claims, creates, attachments, releases,
    async run(reason, terms = offer.termsVersion) {
      const result = await create(deps)(terms);
      cases++;
      assert.equal(errors.length, 0, errors[0]?.stack);
      assert.equal(result.ok, reason === undefined);
      if (reason) { assert.equal(result.reason, reason); assert.equal("checkoutUrl" in result, false); }
      assert.equal(JSON.stringify(result).includes("private"), false);
      return result;
    },
  };
}

for (const deps of [{ enabled: false }, { approvedOffer: null }, { expectedMode: null }, { stripeMode: "missing" },
  { stripeMode: "live" }, { deployment: "production" }, { gate: null }, { provider: null },
  { expectedOrigin: "https://integration.example/path" }, { expectedOrigin: "http://integration.example" },
  { approvedOffer: { ...offer, priceCents: 0 } }]) {
  const f = fixture({ deps }); await f.run("unavailable"); assert.deepEqual(f.events, []);
}
const terms = fixture(); await terms.run("invalid_terms", "2026-09-02"); assert.deepEqual(terms.events, []);
for (const options of [{ prerequisites: false }, { prerequisiteError: true }, { active: null }, { accessError: true }]) {
  const f = fixture(options); await f.run("unavailable"); assert.equal(f.creates.length, 0); assert.equal(f.claims.length, 0);
}
const purchased = fixture({ active: true }); await purchased.run("already_purchased"); assert.deepEqual(purchased.events, ["prerequisites", "access"]);
for (const patch of [{ id: "price_other" }, { active: false }, { type: "recurring" }, { currency: "usd" },
  { unit_amount: 1 }, { tax_behavior: "exclusive" }, { livemode: true }, { product: "prod_creation" },
  { product: { ...priceFixture.product, id: "prod_other" } }, { product: { ...priceFixture.product, active: false } },
  { product: { ...priceFixture.product, metadata: { product_code: "eofy_pro", billing_model: "one_time" } } }]) {
  const f = fixture({ price: { ...priceFixture, ...patch } }); await f.run("unavailable"); assert.equal(f.claims.length, 0);
}
const priceError = fixture({ priceError: true }); await priceError.run("unavailable"); assert.equal(priceError.claims.length, 0);

for (const [claim, reason] of [[{ outcome: "reserved" }, "retry_later"], [{ outcome: "locked" }, "sales_closed"],
  [{ outcome: "verify_expiry", generation: 6, checkoutSessionId: "cs_test_old" }, "support_required"],
  [{ outcome: "manual_review" }, "support_required"], [null, "support_required"],
  [{ outcome: "claimed", generation: 0 }, "support_required"], [{ outcome: "claimed", generation: "7" }, "support_required"]]) {
  const f = fixture({ claim }); await f.run(reason); assert.equal(f.creates.length, 0); assert.equal(f.releases.length, 0);
}
const claimError = fixture({ claimError: true }); await claimError.run("support_required"); assert.equal(claimError.creates.length, 0);
for (const type of ["StripeAuthenticationError", "StripeInvalidRequestError", "StripePermissionError"]) {
  const f = fixture({ createError: { type } }); await f.run("provider_rejected");
  assert.deepEqual(f.events, ["prerequisites", "access", "price", "claim", "create", "release"]);
  const released = f.releases[0];
  assert.equal(released.claimTokenHash, f.claims[0].claimTokenHash);
  assert.equal(released.generation, 7); assert.equal(released.productCode, productCode);
  assert.equal(released.reason, "stripe_rejected_before_session");
}
for (const type of ["StripeConnectionError", "StripeAPIError", "StripeRateLimitError", "unknown"]) {
  const f = fixture({ createError: { type } }); await f.run("support_required"); assert.equal(f.releases.length, 0);
}
for (const options of [{ released: false }, { released: "true" }, { releaseError: true }]) {
  const f = fixture({ ...options, createError: { type: "StripePermissionError" } }); await f.run("support_required"); assert.equal(f.releases.length, 1);
}
for (const session of [{ url: null }, { url: "https://checkout.stripe.com.evil.example/c/pay/cs_test_creation" },
  { url: "https://user:pass@checkout.stripe.com/c/pay/cs_test_creation" }, { url: "https://checkout.stripe.com/c/pay/cs_test_other" },
  { id: "cs_live_creation" }, { livemode: true }, { status: "complete" }, { payment_status: "paid" },
  { amount_total: 1 }, { expires_at: Math.floor(at / 1000) + 3600 },
  { metadata: { ...priceFixture.product.metadata, purchase_terms_version: "2026-09-02" } }]) {
  const f = fixture({ session }); await f.run("support_required"); assert.equal(f.attachments.length, 0); assert.equal(f.releases.length, 0);
}
for (const options of [{ attached: false }, { attached: "true" }, { attachError: { type: "StripeInvalidRequestError" } }]) {
  const f = fixture(options); await f.run("support_required"); assert.equal(f.attachments.length, 1); assert.equal(f.releases.length, 0);
}
for (const afterClaimTime of [at + 61000, NaN, at - 1000]) {
  const f = fixture({ afterClaimTime }); await f.run("support_required"); assert.equal(f.creates.length, 0); assert.equal(f.releases.length, 0);
}
for (const clockField of ["afterCreateTime", "afterAttachTime"]) {
  for (const value of [NaN, at - 1000, at + 1860000]) {
    const f = fixture({ [clockField]: value }); await f.run("support_required"); assert.equal(f.releases.length, 0);
  }
}
for (const mode of ["test", "live"]) {
  const f = fixture({ mode, mutateOffer: true }); const result = await f.run();
  assert.deepEqual(f.events, ["prerequisites", "access", "price", "claim", "create", "attach"]);
  assert.equal(result.checkoutUrl, `https://checkout.stripe.com/c/pay/cs_${mode}_creation#synthetic`);
  const claim = f.claims[0], attached = f.attachments[0];
  const { params, requestOptions } = f.creates[0];
  assert.equal(claim.productCode, productCode); assert.equal(claim.environment, mode);
  assert.equal(claim.amountCents, 1234); assert.equal(claim.currency, "aud");
  assert.match(claim.claimTokenHash, /^[a-f0-9]{64}$/);
  assert.equal(requestOptions.idempotencyKey, `${productCode}_first_sale_${claim.claimTokenHash}`);
  assert.equal(claim.expiresAt.getTime(), params.expires_at * 1000);
  assert.equal(attached.expiresAt.getTime(), claim.expiresAt.getTime());
  assert.equal(attached.claimTokenHash, claim.claimTokenHash); assert.equal(attached.generation, 7);
  assert.equal(attached.checkoutSessionId, `cs_${mode}_creation`);
  assert.equal(params.expires_at, Math.floor(at / 1000) + 1860);
  assert.equal(JSON.stringify(params.line_items), '[{"price":"price_creation","quantity":1}]');
  assert.match(params.integration_identifier, /^hoju_compass_car_purchase_pro_[a-z]{8}$/);
  assert.equal(params.metadata.purchase_terms_version, offer.termsVersion);
  assert.equal(params.customer_creation, "always"); assert.equal(params.managed_payments.enabled, true);
  assert.equal(params.success_url, "https://integration.example/car-purchase-pro/success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(params.cancel_url, "https://integration.example/car-purchase-pro?checkout=cancelled");
  for (const field of ["payment_method_types", "customer", "customer_email", "discounts", "allow_promotion_codes"]) assert.equal(field in params, false);
  assert.equal(f.releases.length, 0);
}
console.log(`PASS car checkout creation: ${cases} synthetic cases; prerequisites/price/mode/terms gates, exact reservation/create/attach linkage, safe compensation, uncertain results held. No Stripe/DB/network/runtime activation.`);
