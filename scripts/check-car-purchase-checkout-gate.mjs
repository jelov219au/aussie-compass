import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "firstSaleGate", "carPurchaseProCheckoutCreation", "carPurchaseProCheckoutGate"]) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
    { exports: compiledModule.exports, module: compiledModule, Date, URL, require: dependency => {
      if (dependency === "server-only") return {};
      if (dependency === "node:crypto") return crypto;
      if (modules.has(dependency)) return modules.get(dependency);
      throw new Error("Unexpected gate test import: " + dependency);
    } });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseCheckoutGate: createGate } = modules.get("./carPurchaseProCheckoutGate");
const { createCarPurchaseCheckoutCreation: createCheckout } = modules.get("./carPurchaseProCheckoutCreation");
const productCode = "car_purchase_pro", now = Date.parse("2026-09-04T00:00:00Z");
const offer = { productCode, currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_gate", stripeProductId: "prod_gate", termsVersion: "2026-09-03" };
const hash = "a".repeat(64), expiresAt = new Date(now + 1860000);
const claim = { productCode, claimTokenHash: hash, expiresAt, environment: "test", currency: "aud", amountCents: 1234 };
const identity = { productCode, generation: 7, claimTokenHash: hash };
const attach = { ...identity, checkoutSessionId: "cs_test_gate", expiresAt };
const release = { ...identity, reason: "stripe_rejected_before_session" };
const claimRow = { outcome: "claimed", generation: "7", stripe_checkout_session_id: null };
const queryCalls = [];
let result = [claimRow];
const gate = createGate({ query: async (sql, values) => { queryCalls.push({ sql, values: [...values] }); return result; },
  approvedOffer: offer, expectedMode: "test", now: () => now });
assert.equal((await gate.claimReservation(claim)).generation, 7);
assert.deepEqual(queryCalls.at(-1), {
  sql: "select * from public.claim_first_sale_reservation($1::text,$2::text,$3::timestamptz,$4::text,$5::text,$6::integer)",
  values: [productCode, hash, expiresAt.toISOString(), "test", "aud", "1234"],
});
for (const value of [7, 7n, "9007199254740991"]) {
  result = [{ ...claimRow, generation: value }]; assert.equal((await gate.claimReservation(claim)).generation, Number(value));
}
for (const outcome of ["reserved", "locked", "manual_review"]) {
  result = [{ ...claimRow, outcome, generation: "0" }]; assert.equal((await gate.claimReservation(claim)).outcome, outcome);
}
result = [{ ...claimRow, outcome: "verify_expiry", stripe_checkout_session_id: "cs_test_old" }];
assert.equal((await gate.claimReservation(claim)).checkoutSessionId, "cs_test_old");
for (const bad of [[], null, [claimRow, claimRow], [null], [[]],
  ...[null, "07", "7.5", "1e2", "-1", "9007199254740992", 9007199254740992, 9007199254740992n]
    .map(generation => [{ ...claimRow, generation }]),
  [{ ...claimRow, generation: 0 }], [{ ...claimRow, outcome: "unknown" }],
  [{ ...claimRow, stripe_checkout_session_id: "cs_test_existing" }],
  [{ ...claimRow, stripe_checkout_session_id: undefined }],
  [{ ...claimRow, outcome: "verify_expiry", stripe_checkout_session_id: "cs_live_other" }],
  [{ ...claimRow, outcome: "verify_expiry", stripe_checkout_session_id: null }]]) {
  result = bad; await assert.rejects(gate.claimReservation(claim));
}
result = [{ attached: true }]; assert.equal(await gate.attachCheckoutSession(attach), true);
assert.deepEqual(queryCalls.at(-1), {
  sql: "select public.attach_first_sale_checkout($1::text,$2::bigint,$3::text,$4::text,$5::timestamptz) as attached",
  values: [productCode, "7", hash, "cs_test_gate", expiresAt.toISOString()],
});
result = [{ released: true }]; assert.equal(await gate.releaseFailedReservation(release), true);
assert.deepEqual(queryCalls.at(-1), {
  sql: "select public.release_failed_first_sale_reservation($1::text,$2::bigint,$3::text,$4::text) as released",
  values: [productCode, "7", hash, "stripe_rejected_before_session"],
});
for (const [method, input, field] of [["attachCheckoutSession", attach, "attached"], ["releaseFailedReservation", release, "released"]]) {
  result = [{ [field]: false }]; assert.equal(await gate[method](input), false);
  for (const bad of [[], null, [{}], [{ [field]: "true" }], [{ [field]: 1 }], [{ [field]: true }, { [field]: true }]]) {
    result = bad; await assert.rejects(gate[method](input));
  }
}
const beforeInvalid = queryCalls.length;
for (const patch of [{ productCode: "car_buy_pro" }, { environment: "live" }, { currency: "usd" }, { amountCents: 1235 },
  { claimTokenHash: "raw_claim" }, { claimTokenHash: "a';select 1;--" },
  { expiresAt: new Date(now + 1799999) }, { expiresAt: new Date(now + 2100001) }, { expiresAt: new Date(NaN) }]) {
  await assert.rejects(gate.claimReservation({ ...claim, ...patch }));
}
for (const patch of [{ productCode: "eofy_pro" }, { generation: 0 }, { generation: "7" }, { generation: 1.5 }, { claimTokenHash: "bad" }]) {
  await assert.rejects(gate.attachCheckoutSession({ ...attach, ...patch }));
  await assert.rejects(gate.releaseFailedReservation({ ...release, ...patch }));
}
for (const patch of [{ checkoutSessionId: "cs_live_other" }, { checkoutSessionId: "cs_test_x';select 1" },
  { expiresAt: new Date(now) }, { expiresAt: new Date(now + 2100001) }]) await assert.rejects(gate.attachCheckoutSession({ ...attach, ...patch }));
await assert.rejects(gate.releaseFailedReservation({ ...release, reason: "timeout" }));
assert.equal(queryCalls.length, beforeInvalid, "Invalid input must never execute a query");
for (const configuration of [{ approvedOffer: null }, { expectedMode: null },
  { approvedOffer: { ...offer, priceCents: 2147483648 } }, { now: () => NaN }]) {
  let calls = 0;
  const closed = createGate({ query: async () => { calls++; return [claimRow]; }, approvedOffer: offer, expectedMode: "test", now: () => now, ...configuration });
  await assert.rejects(closed.claimReservation(claim)); assert.equal(calls, 0);
}

// Real creation service -> real gate -> scripted query, with only Stripe's port mocked.
const integrationQueries = [], events = [];
let fault = "none", claimValues, createParams;
const integratedGate = createGate({ approvedOffer: offer, expectedMode: "test", now: () => now,
  query: async (sql, values) => {
    const operation = /public\.([a-z_]+)\(/.exec(sql)?.[1];
    events.push(operation); integrationQueries.push({ operation, values: [...values] });
    if (operation === "claim_first_sale_reservation") {
      claimValues = [...values];
      if (fault === "claim_throw") throw new Error("private DB detail");
      return [{ ...claimRow, generation: fault === "bad_generation" ? "9007199254740992" : "7",
        outcome: fault === "reserved" ? "reserved" : "claimed" }];
    }
    if (operation === "attach_first_sale_checkout") {
      if (fault === "attach_throw") throw { type: "StripeInvalidRequestError" };
      return [{ attached: fault === "attach_false" ? false : fault === "attach_string" ? "true" : true }];
    }
    if (operation === "release_failed_first_sale_reservation") return [{ released: fault !== "release_false" }];
    throw new Error("Unexpected SQL boundary");
  },
});
const checkout = createCheckout({ enabled: true, approvedOffer: offer, expectedMode: "test", stripeMode: "test",
  deployment: "nonproduction", expectedOrigin: "https://integration.example", gate: integratedGate, now: () => now,
  checkPrerequisites: async () => true, hasActiveAccess: async () => false,
  provider: {
    retrievePrice: async () => ({ id: offer.stripePriceId, active: true, type: "one_time", currency: "aud",
      unit_amount: 1234, tax_behavior: "inclusive", livemode: false, product: { id: offer.stripeProductId, active: true,
        livemode: false, metadata: { product_code: productCode, billing_model: "one_time" } } }),
    createSession: async (params, options) => {
      events.push("create"); createParams = { params, options };
      if (fault === "reject" || fault === "release_false") throw { type: "StripeInvalidRequestError" };
      if (fault === "uncertain") throw { type: "StripeConnectionError" };
      return { id: "cs_test_gate", url: "https://checkout.stripe.com/c/pay/cs_test_gate", livemode: false,
        mode: "payment", status: "open", payment_status: "unpaid", currency: "aud", amount_total: 1234,
        amount_subtotal: 1234, expires_at: params.expires_at, metadata: params.metadata };
    },
  },
});
assert.equal((await checkout(offer.termsVersion)).ok, true);
assert.deepEqual(events, ["claim_first_sale_reservation", "create", "attach_first_sale_checkout"]);
assert.deepEqual(claimValues, [productCode, claimValues[1], expiresAt.toISOString(), "test", "aud", "1234"]);
assert.equal(createParams.options.idempotencyKey, `${productCode}_first_sale_${claimValues[1]}`);
assert.deepEqual(integrationQueries.at(-1).values, [productCode, "7", claimValues[1], "cs_test_gate", claimValues[2]]);
for (const [kind, reason, tail] of [["reserved", "retry_later", []], ["bad_generation", "support_required", []],
  ["claim_throw", "support_required", []], ["reject", "provider_rejected", ["create", "release_failed_first_sale_reservation"]],
  ["release_false", "support_required", ["create", "release_failed_first_sale_reservation"]],
  ["uncertain", "support_required", ["create"]], ["attach_false", "support_required", ["create", "attach_first_sale_checkout"]],
  ["attach_string", "support_required", ["create", "attach_first_sale_checkout"]],
  ["attach_throw", "support_required", ["create", "attach_first_sale_checkout"]]]) {
  fault = kind; events.length = 0;
  const result = await checkout(offer.termsVersion);
  assert.equal(result.ok, false); assert.equal(result.reason, reason); assert.equal("checkoutUrl" in result, false);
  assert.deepEqual(events, ["claim_first_sale_reservation", ...tail]);
  if (tail.at(-1) === "release_failed_first_sale_reservation") {
    assert.deepEqual(integrationQueries.at(-1).values, [productCode, "7", claimValues[1], "stripe_rejected_before_session"]);
  }
}
console.log(`PASS car checkout gate: three fixed parameter bindings, strict claim rows/generations/booleans, pre-query guards and 10 real-creation/mock-query flows (${integrationQueries.length} scripted queries). No SQL/Stripe/network/runtime activation.`);
