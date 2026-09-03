import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as contract from "../src/lib/carPurchaseProCheckoutContract.ts";
const require = createRequire(import.meta.url), ts = require("typescript");
const compiledModule = { exports: {} };
let realClientRequests = 0;
const source = await readFile(new URL("../src/lib/carPurchaseProPurchase.ts", import.meta.url), "utf8");
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports: compiledModule.exports, module: compiledModule, process: { env: { VERCEL_ENV: "production" } }, require: name => {
    if (name === "server-only") return {};
    if (name === "./carPurchaseProCheckoutContract") return contract;
    if (name === "./stripe") return { getStripeSecretMode: () => "live", getStripe: () => { realClientRequests++; throw new Error("unexpected real client access"); } };
    throw new Error(name);
  } });
const { createCarPurchaseCheckoutVerifier: create, getVerifiedCarPurchaseProCheckout: closed } = compiledModule.exports;
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_synthetic", stripeProductId: "prod_synthetic", termsVersion: "2026-09-03" };
const id = "cs_test_synthetic", customerId = "cus_synthetic";
const session = { id, customer: customerId, status: "complete", payment_status: "paid", mode: "payment", livemode: false,
  metadata: { product_code: "car_purchase_pro", billing_model: "one_time", purchase_terms_version: "2026-09-03" },
  currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: "price_synthetic", product: "prod_synthetic", type: "one_time", currency: "aud", unit_amount: 1234 } }] } };
let calls = 0;
const deps = { approvedOffer: offer, expectedMode: "test", stripeMode: "test", retrieveSession: async (requested, options) => {
  calls++; assert.equal(requested, id); assert.equal(JSON.stringify(options), '{"expand":["line_items"]}'); return session;
} };
for (const patch of [{ approvedOffer: null }, { stripeMode: "live" }, { stripeMode: "missing" }, { expectedMode: null }]) {
  assert.equal(await create({ ...deps, ...patch })(id), null);
}
assert.equal(await create(deps)("cs_live_synthetic"), null);
assert.equal(await create(deps)("not-a-session"), null);
assert.equal(calls, 0, "invalid configuration/input cannot make provider calls");
const valid = await create(deps)(id);
assert.equal(valid.id, id); assert.equal(valid.customerId, customerId); assert.equal(calls, 1);
for (const patch of [{ id: "cs_test_other" }, { customer: null }, { customer: { id: customerId, deleted: true } },
  { customer: "bad" }, { payment_status: "unpaid" }, { livemode: true }, { amount_total: 1 }]) {
  assert.equal(await create({ ...deps, retrieveSession: async () => ({ ...session, ...patch }) })(id), null);
}
assert.equal((await create({ ...deps, retrieveSession: async () => ({ ...session, customer: { id: customerId } }) })(id)).customerId, customerId);
assert.equal(await create({ ...deps, retrieveSession: async () => { throw new Error("synthetic provider failure"); } })(id), null);
assert.equal(await closed("cs_live_synthetic"), null, "default server adapter stays closed without approved offer");
assert.equal(realClientRequests, 0);
console.log("PASS server checkout verifier: configuration/mode preflight, exact retrieval ID, expanded line items, customer contract and safe failure. No real provider calls.");
