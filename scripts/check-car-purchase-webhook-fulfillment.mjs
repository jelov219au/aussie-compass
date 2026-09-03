import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), Stripe = require("stripe");
const modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "carPurchaseProWebhookFulfillment"]) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
    { exports: compiledModule.exports, module: compiledModule, Buffer, Date, require: dependency => {
      if (dependency === "server-only") return {};
      if (modules.has(dependency)) return modules.get(dependency);
      throw new Error("Unexpected webhook import: " + dependency);
    } });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseWebhookFulfillment: create } = modules.get("./carPurchaseProWebhookFulfillment");
const now = Date.parse("2026-09-04T00:00:00Z"), secret = "whsec_synthetic_local_webhook_fixture";
const productCode = "car_purchase_pro", sessionId = "cs_test_webhook", piId = "pi_webhook", chargeId = "ch_webhook", customerId = "cus_webhook";
// Synthetic price only. The SDK is used solely for local signature operations.
const offer = { productCode, currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_webhook", stripeProductId: "prod_webhook", termsVersion: "2026-09-03" };
const checkout = { id: sessionId, object: "checkout.session", customer: customerId, payment_intent: piId,
  status: "complete", payment_status: "paid", mode: "payment", livemode: false,
  metadata: { product_code: productCode, billing_model: "one_time", purchase_terms_version: offer.termsVersion },
  currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: offer.stripePriceId, product: offer.stripeProductId, type: "one_time", currency: "aud", unit_amount: 1234 } }] },
};
const paymentIntent = { id: piId, object: "payment_intent", customer: customerId, latest_charge: chargeId,
  livemode: false, status: "succeeded", currency: "aud", amount: 1234, amount_received: 1234 };
const charge = { id: chargeId, object: "charge", payment_intent: piId, customer: customerId, livemode: false,
  currency: "aud", amount: 1234, paid: true, captured: true, status: "succeeded", disputed: false, refunded: false, amount_refunded: 0 };
function event(type = "checkout.session.completed", object = checkout, patch = {}) {
  return { id: "evt_webhook", object: "event", type, created: Math.floor(now / 1000) - 60, livemode: false,
    data: { object: structuredClone(object) }, ...patch };
}
const refund = { id: "re_webhook", object: "refund", charge: chargeId, payment_intent: piId, status: "succeeded" };
let currentCheckout = checkout, currentPi = paymentIntent, currentCharge = charge;
let currentList = { data: [{ id: sessionId }], has_more: false };
let readiness = true, readinessThrows = false, providerThrows = false, storeThrows = false;
let storeResult = { outcome: "processed" }, verificationCalls = 0, readinessCalls = 0, checks = 0;
const calls = [], stored = [], boundaryErrors = [];
function boundary(fn) { try { fn(); } catch (error) { boundaryErrors.push(error); throw error; } }
const deps = { enabled: true, approvedOffer: { ...offer }, expectedMode: "test", stripeMode: "test", deployment: "nonproduction", now: () => now,
  verifySignature: (payload, signature) => {
    verificationCalls++;
    return Stripe.webhooks.constructEvent(payload, signature, secret, 300, undefined, now);
  },
  checkPrerequisites: async (snapshot, mode) => {
    readinessCalls++;
    boundary(() => { assert.equal(JSON.stringify(snapshot), JSON.stringify(offer)); assert.ok(Object.isFrozen(snapshot)); assert.equal(mode, "test"); });
    if (readinessThrows) throw new Error("private readiness error");
    return readiness;
  },
  provider: {
    async retrieveCheckout(id, options) {
      calls.push("checkout"); boundary(() => { assert.equal(id, sessionId); assert.equal(JSON.stringify(options), '{"expand":["line_items"]}'); });
      if (providerThrows) throw new Error("private provider error"); return currentCheckout;
    },
    async retrievePaymentIntent(id) { calls.push("pi"); boundary(() => assert.equal(id, piId)); return currentPi; },
    async retrieveCharge(id) { calls.push("charge"); boundary(() => assert.equal(id, chargeId)); return currentCharge; },
    async listCheckoutsForPaymentIntent(id, options) {
      calls.push("list"); boundary(() => { assert.equal(id, piId); assert.equal(options.limit, 2); }); return currentList;
    },
  },
  store: {
    async applyPaidEventAndEntitlement(input) { stored.push({ method: "paid", input }); if (storeThrows) throw new Error("private store error"); return storeResult; },
    async applyReversal(input) { stored.push({ method: "reversal", input }); if (storeThrows) throw new Error("private store error"); return storeResult; },
  },
};
const fulfill = create(deps);
deps.approvedOffer.priceCents = 9000; // Frozen snapshot must survive later caller mutation.
async function send(value, expected, handler = fulfill, signingPatch = {}) {
  const payload = JSON.stringify(value);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(now / 1000), ...signingPatch });
  const result = await handler(payload, header);
  checks++;
  assert.deepEqual(JSON.parse(JSON.stringify(result)), expected);
  assert.equal(boundaryErrors.length, 0, boundaryErrors[0]?.stack);
  for (const raw of [secret, sessionId, piId, chargeId, customerId, "private"]) assert.equal(JSON.stringify(result).includes(raw), false);
  return result;
}
const fail = reason => ({ ok: false, reason });
const done = outcome => ({ ok: true, handled: true, outcome });
const unhandled = { ok: true, handled: false };

const invalidConfigs = [{ enabled: false }, { enabled: "true" }, { approvedOffer: null }, { expectedMode: null },
  { stripeMode: "live" }, { deployment: "production" }, { deployment: "unknown" }, { verifySignature: null },
  { checkPrerequisites: null }, { provider: null }, { provider: { ...deps.provider, retrieveCharge: null } },
  { store: null }, { store: { ...deps.store, applyReversal: null } }];
for (const patch of invalidConfigs) await send(event(), fail("unavailable"), create({ ...deps, approvedOffer: offer, ...patch }));
assert.equal(verificationCalls + readinessCalls + calls.length + stored.length, 0);
await send(event(), fail("invalid_signature"), fulfill, { secret: secret + "wrong" });
await send(event(), fail("invalid_signature"), fulfill, { timestamp: Math.floor(now / 1000) - 301 });
const signedPayload = JSON.stringify(event());
const signedHeader = Stripe.webhooks.generateTestHeaderString({ payload: signedPayload, secret, timestamp: now / 1000 });
assert.equal((await fulfill(signedPayload + " ", signedHeader)).reason, "invalid_signature");
let beforeVerify = verificationCalls;
assert.equal((await fulfill("x".repeat(1024 * 1024 + 1), signedHeader)).reason, "invalid_event");
assert.equal((await fulfill(signedPayload, "")).reason, "invalid_event");
assert.equal(verificationCalls, beforeVerify);
assert.equal(readinessCalls + calls.length + stored.length, 0);

for (const patch of [{ id: "bad" }, { object: "thin_event" }, { created: 0 }, { created: now / 1000 + 301 },
  { created: 1.5 }, { data: {} }, { account: "acct_other" }, { context: "acct_context" }]) await send(event(undefined, undefined, patch), fail("invalid_event"));
await send(event(undefined, undefined, { livemode: true }), fail("wrong_environment"));
await send(event("invoice.paid"), unhandled);
await send(event(undefined, { ...checkout, metadata: { product_code: "eofy_pro" } }), unhandled);
assert.equal(calls.length + stored.length, 0);
for (const value of [false, "true", null]) { readiness = value; await send(event(), fail("unavailable")); }
readiness = true; readinessThrows = true;
await send(event(), fail("unavailable")); readinessThrows = false;
assert.equal(calls.length + stored.length, 0);

await send(event(), done("processed"));
assert.deepEqual(calls, ["checkout", "pi", "charge"]);
const first = stored.at(-1);
assert.equal(first.method, "paid");
assert.equal(JSON.stringify(first.input.command), JSON.stringify({ checkoutSessionId: sessionId, paymentIntentId: piId, customerId,
  chargeId, productCode, action: "grant", currency: "aud", amountTotal: 1234, reason: "checkout_paid" }));
assert.equal(first.input.receipt.createdAt.toISOString(), new Date(now - 60000).toISOString());
await send(event("checkout.session.async_payment_succeeded"), done("processed"));
assert.equal(stored.at(-1).input.command.reason, "async_payment_succeeded");
for (const outcome of ["duplicate", "ignored_stale"]) {
  storeResult = { outcome }; await send(event(undefined, undefined, { created: now / 1000 - 86400 }), done(outcome));
  assert.equal(stored.at(-1).input.receipt.createdAt.toISOString(), new Date(now - 86400000).toISOString());
}
for (const result of [null, {}, { outcome: "unknown" }, { outcome: "tombstoned" }]) {
  storeResult = result; await send(event(), fail("persistence_failed"));
}
storeResult = { outcome: "processed" }; storeThrows = true;
await send(event(), fail("persistence_failed")); storeThrows = false;

// Every bad paid contract must stop before either persistence port.
let before = stored.length;
await send(event(undefined, { ...checkout, payment_status: "unpaid" }), fail("unavailable")); // Exception store required.
for (const patch of [{ object: "wrong" }, { status: "open" }, { mode: "subscription" },
  { livemode: true }, { customer: "cus_other" }, { payment_intent: "pi_other" }, { currency: "usd" },
  { amount_total: 1 }, { amount_subtotal: 1 }, { metadata: { ...checkout.metadata, purchase_terms_version: "2020-01-01" } }]) {
  await send(event(undefined, { ...checkout, ...patch }), fail("contract_mismatch"));
}
for (const patch of [{ id: "cs_test_other" }, { currency: "usd" }, { amount_total: 1 }, { customer: { id: customerId, deleted: true } },
  { line_items: { ...checkout.line_items, has_more: true } }, { metadata: { ...checkout.metadata, product_code: "car_buy_pro" } }]) {
  currentCheckout = { ...checkout, ...patch }; await send(event(), fail("contract_mismatch"));
}
currentCheckout = checkout;
for (const patch of [{ id: "pi_other" }, { status: "processing" }, { amount: 1 }, { amount_received: 1 }, { customer: "cus_other" },
  { latest_charge: null }, { latest_charge: { id: chargeId, deleted: true } }, { livemode: true }]) {
  currentPi = { ...paymentIntent, ...patch }; await send(event(), fail("contract_mismatch"));
}
currentPi = paymentIntent;
for (const patch of [{ id: "ch_other" }, { payment_intent: "pi_other" }, { customer: "cus_other" }, { amount: 1235 },
  { currency: "usd" }, { paid: false }, { captured: false }, { status: "pending" }, { disputed: true },
  { refunded: true, amount_refunded: 1234 }, { amount_refunded: 1 }, { amount_refunded: -1 }, { amount_refunded: 1.1 },
  { amount_refunded: 1235 }, { refunded: true }, { livemode: true }]) {
  currentCharge = { ...charge, ...patch }; await send(event(), fail("contract_mismatch"));
}
currentCharge = charge; providerThrows = true;
await send(event(), fail("unavailable")); providerThrows = false;
assert.equal(stored.length, before);

// Reversal path resolves the exact original checkout server-side, never by metadata on the refund.
currentCharge = { ...charge, amount_refunded: 500 };
await send(event("charge.refunded", { ...currentCharge, payment_intent: null }), done("processed"));
assert.equal(stored.at(-1).method, "reversal");
assert.equal(stored.at(-1).input.command.action, "review");
assert.equal(stored.at(-1).input.command.reason, "charge_partially_refunded");
currentCharge = { ...charge, amount_refunded: 1234, refunded: true };
for (const type of ["charge.refunded", "refund.created", "refund.updated", "refund.failed"]) {
  await send(event(type, type === "charge.refunded" ? currentCharge : refund), done("processed"));
  assert.equal(stored.at(-1).method, "reversal"); assert.equal(stored.at(-1).input.command.action, "revoke");
}
for (const outcome of ["duplicate", "ignored_stale", "tombstoned"]) {
  storeResult = { outcome };
  await send(event("refund.updated", refund, { created: now / 1000 - 86400 }), done(outcome));
  assert.equal(stored.at(-1).input.command.action, "revoke");
}
storeResult = { outcome: "processed" };
before = stored.length;
await send(event(), fail("contract_mismatch"));
assert.equal(stored.length, before, "A delayed paid event cannot dispatch a grant after the current charge was refunded.");
currentCharge = charge;
await send(event("refund.failed", { ...refund, status: "failed" }), done("processed"));
assert.equal(stored.at(-1).input.command.action, "review", "Refund failure does not automatically restore access.");

before = stored.length;
currentCharge = { ...charge, amount_refunded: 500 };
for (const list of [null, { data: [], has_more: false }, { data: [{ id: sessionId }, { id: sessionId }], has_more: false },
  { data: [{ id: sessionId }], has_more: true }, { data: [{ id: "cs_live_other" }], has_more: false }]) {
  currentList = list; await send(event("refund.updated", refund), fail("contract_mismatch"));
}
currentList = { data: [{ id: sessionId }], has_more: false };
for (const patch of [{ id: "cs_test_other" }, { payment_intent: "pi_other" }, { customer: "cus_other" }, { amount_total: 1 }]) {
  currentCheckout = { ...checkout, ...patch }; await send(event("refund.updated", refund), fail("contract_mismatch"));
}
currentCheckout = checkout;
await send(event("refund.updated", { ...refund, payment_intent: "pi_other" }), fail("contract_mismatch"));
// Unrelated products, including a different price/currency, must remain with the shared router.
currentCharge = { ...charge, amount: 1990, currency: "usd", amount_refunded: 1990, refunded: true };
currentCheckout = { ...checkout, metadata: { product_code: "resume_pro" } };
await send(event("refund.updated", refund), unhandled);
assert.equal(stored.length, before);
currentCharge = { ...charge, amount_refunded: 500 }; currentCheckout = checkout;
storeThrows = true; await send(event("refund.updated", refund), fail("persistence_failed")); storeThrows = false;
storeResult = { outcome: "success" }; await send(event("refund.updated", refund), fail("persistence_failed"));
assert.equal(boundaryErrors.length, 0);
console.log(`PASS car webhook preparation: ${checks} signed-event cases, real local Stripe signature/tolerance checks, ${invalidConfigs.length} closed configurations, exact receipt/PI/charge matching, refund isolation and strict store outcomes. Store ordering/tombstones are mocked; no SQL/network/Stripe API/route activation.`);
