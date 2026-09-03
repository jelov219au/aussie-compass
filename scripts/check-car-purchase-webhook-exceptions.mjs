import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), Stripe = require("stripe"), modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "carPurchaseProWebhookFulfillment"]) {
  const compiledModule = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { exports: compiledModule.exports, module: compiledModule, Buffer, Date, require: name => {
    if (name === "server-only") return {};
    if (modules.has(name)) return modules.get(name);
    throw new Error("Unexpected import: " + name);
  } });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseWebhookFulfillment: create } = modules.get("./carPurchaseProWebhookFulfillment");
const { verifyCarPurchaseCheckout, inspectCarPurchaseCheckoutForException } = modules.get("./carPurchaseProCheckoutContract");
const now = Date.parse("2026-09-04T00:00:00Z"), secret = "whsec_synthetic_exception_fixture";
// Synthetic amount, not a sales offer. No Stripe client or network call is made.
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_exception", stripeProductId: "prod_exception", termsVersion: "2026-09-03" };
const checkout = { id: "cs_test_exception", object: "checkout.session", payment_intent: "pi_exception", customer: "cus_exception",
  status: "complete", payment_status: "unpaid", mode: "payment", livemode: false,
  metadata: { product_code: offer.productCode, billing_model: offer.billing, purchase_terms_version: offer.termsVersion },
  currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: offer.stripePriceId, product: offer.stripeProductId, type: "one_time", currency: "aud", unit_amount: 1234 } }] } };
const pi = { id: "pi_exception", object: "payment_intent", customer: "cus_exception", livemode: false,
  currency: "aud", amount: 1234, status: "processing" };
const charge = { id: "ch_exception", object: "charge", payment_intent: pi.id, customer: pi.customer, livemode: false,
  currency: "aud", amount: 1234, paid: true, captured: true, status: "succeeded", disputed: true, refunded: false, amount_refunded: 0 };
const dispute = { id: "dp_exception", object: "dispute", charge: charge.id, payment_intent: pi.id,
  livemode: false, currency: "aud", amount: 1234, status: "needs_response" };
let currentCheckout, currentPi, currentCharge, currentDispute, currentList, readiness, storeResult, throwAt;
let checks = 0, grantCalls = 0, reversalCalls = 0;
const reads = [], writes = [];
function reset() {
  currentCheckout = structuredClone(checkout); currentPi = structuredClone(pi); currentCharge = structuredClone(charge);
  currentDispute = structuredClone(dispute); currentList = { has_more: false, data: [{ id: checkout.id }] };
  readiness = true; storeResult = { outcome: "processed", alertDurable: true }; throwAt = null;
}
reset();
const deps = { enabled: true, approvedOffer: offer, expectedMode: "test", stripeMode: "test", deployment: "nonproduction", now: () => now,
  verifySignature: (body, signature) => Stripe.webhooks.constructEvent(body, signature, secret, 300, undefined, now),
  checkPrerequisites: async () => readiness,
  provider: {
    async retrieveCheckout(id, options) { reads.push(["checkout", id, options]); if (throwAt === "checkout") throw Error("private"); return currentCheckout; },
    async retrievePaymentIntent(id) { reads.push(["pi", id]); return currentPi; },
    async retrieveCharge(id) { reads.push(["charge", id]); return currentCharge; },
    async retrieveDispute(id) { reads.push(["dispute", id]); if (throwAt === "dispute") throw Error("private"); return currentDispute; },
    async listCheckoutsForPaymentIntent(id, options) { reads.push(["list", id, options]); return currentList; },
  },
  store: { async applyPaidEventAndEntitlement() { grantCalls++; return { outcome: "processed" }; },
    async applyReversal() { reversalCalls++; return { outcome: "processed" }; } },
  exceptionStore: { async applyExceptionAndEnqueueAlert(input) { writes.push(input); if (throwAt === "store") throw Error("private"); return storeResult; } },
};
const handler = create(deps), fail = reason => ({ ok: false, reason }), done = outcome => ({ ok: true, handled: true, outcome });
function event(type = "checkout.session.completed", object = checkout, patch = {}) {
  return { id: "evt_exception", object: "event", type, created: now / 1000 - 60, livemode: false, data: { object }, ...patch };
}
async function send(value, expected = done("processed"), target = handler, signing = {}) {
  const body = JSON.stringify(value);
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret, timestamp: now / 1000, ...signing });
  const before = writes.length, result = await target(body, signature);
  assert.equal(JSON.stringify(result), JSON.stringify(expected));
  if (!expected.ok || expected.handled === false) assert.equal(writes.length, before + (expected.reason === "persistence_failed" ? 1 : 0));
  assert.equal(grantCalls + reversalCalls, 0, "Exception must never call paid or legacy reversal port.");
  for (const sensitive of [secret, pi.id, pi.customer, "private"]) assert.equal(JSON.stringify(result).includes(sensitive), false);
  checks++;
}
assert.equal(verifyCarPurchaseCheckout(checkout, offer, "test").ok, false, "Unpaid cannot become grant proof.");
assert.equal(inspectCarPurchaseCheckoutForException(checkout, offer, "test").ok, true);
assert.equal(inspectCarPurchaseCheckoutForException({ ...checkout, payment_status: "no_payment_required" }, offer, "test").ok, false);
await send(event());
assert.equal(JSON.stringify(reads), JSON.stringify([["checkout", checkout.id, { expand: ["line_items"] }], ["pi", pi.id]]));
assert.equal(writes.at(-1).command.action, "pending"); assert.equal(writes.at(-1).command.chargeId, null);
assert.equal(writes.at(-1).command.reason, "checkout_payment_pending");
// Delayed pending receipt must remain an observation, even when the payment now succeeded.
currentCheckout.payment_status = "paid"; currentPi.status = "succeeded";
await send(event(undefined, undefined, { created: now / 1000 - 86400 }));
assert.equal(writes.at(-1).command.action, "pending");
reset(); currentPi.status = "requires_payment_method";
await send(event("checkout.session.async_payment_failed"));
assert.equal(writes.at(-1).command.action, "revoke"); assert.equal(writes.at(-1).command.reason, "async_payment_failed");
currentPi.status = "canceled"; await send(event("checkout.session.async_payment_failed"));
assert.equal(writes.at(-1).command.action, "revoke");
currentCheckout.payment_status = "paid"; currentPi.status = "succeeded";
await send(event("checkout.session.async_payment_failed"));
assert.equal(writes.at(-1).command.action, "review"); assert.equal(writes.at(-1).command.reason, "async_failure_requires_review");
reset();
for (const patch of [{ exceptionStore: null }, { exceptionStore: {} }, { enabled: false }, { approvedOffer: null }]) {
  await send(event(), fail("unavailable"), create({ ...deps, ...patch }));
}
await send(event(), fail("invalid_signature"), handler, { secret: secret + "wrong" });
await send(event(), fail("invalid_signature"), handler, { timestamp: now / 1000 - 301 });
await send(event(undefined, undefined, { livemode: true }), fail("wrong_environment"));
await send(event(undefined, undefined, { account: "acct_other" }), fail("invalid_event"));
readiness = false; await send(event(), fail("unavailable")); reset();
await send(event(undefined, { ...checkout, metadata: { product_code: "eofy_pro" } }), { ok: true, handled: false });
for (const patch of [{ object: "other" }, { id: "cs_live_other" }, { status: "open" }, { mode: "subscription" },
  { livemode: true }, { customer: "cus_other" }, { payment_intent: "pi_other" }, { currency: "usd" },
  { amount_total: 1 }, { amount_subtotal: 1 }, { metadata: { ...checkout.metadata, purchase_terms_version: "2020-01-01" } }]) {
  await send(event(undefined, { ...checkout, ...patch }), fail("contract_mismatch"));
}
for (const patch of [{ id: "cs_test_other" }, { object: "wrong" }, { payment_status: "no_payment_required" },
  { currency: "usd" }, { amount_total: 1 }, { payment_intent: null }, { customer: { id: pi.customer, deleted: true } },
  { metadata: { ...checkout.metadata, product_code: "car_buy_pro" } }, { line_items: { has_more: true, data: [] } }]) {
  currentCheckout = { ...checkout, ...patch }; await send(event(), fail("contract_mismatch"));
}
reset();
for (const patch of [{ id: "pi_other" }, { object: "charge" }, { livemode: true }, { currency: "usd" },
  { amount: 1 }, { customer: "cus_other" }, { status: "unknown" }]) {
  currentPi = { ...pi, ...patch }; await send(event(), fail("contract_mismatch"));
}
reset(); throwAt = "checkout"; await send(event(), fail("unavailable")); reset();
for (const outcome of ["processed", "duplicate"]) { storeResult = { outcome, alertDurable: true }; await send(event(), done(outcome)); }
for (const result of [null, {}, { outcome: "processed" }, { outcome: "duplicate", alertDurable: false },
  { outcome: "processed", alertDurable: "true" }, { outcome: "ignored_stale", alertDurable: true }, { outcome: "tombstoned", alertDurable: true }]) {
  storeResult = result; await send(event(), fail("persistence_failed"));
}
reset(); throwAt = "store"; await send(event(), fail("persistence_failed")); reset();

function disputeSetup() { reset(); currentCheckout.payment_status = "paid"; }
disputeSetup(); reads.length = 0;
await send(event("charge.dispute.created", dispute));
assert.equal(JSON.stringify(reads), JSON.stringify([["dispute", dispute.id], ["charge", charge.id],
  ["list", pi.id, { limit: 2 }], ["checkout", checkout.id, { expand: ["line_items"] }]]));
assert.equal(writes.at(-1).command.action, "revoke"); assert.equal(writes.at(-1).command.reason, "dispute_opened");
for (const type of ["charge.dispute.updated", "charge.dispute.closed", "charge.dispute.funds_reinstated"]) {
  for (const status of ["won", "warning_closed", "under_review", "lost"]) {
    currentDispute = { ...dispute, status };
    await send(event(type, { ...dispute, status }, { created: now / 1000 - 86400 }));
    assert.equal(writes.at(-1).command.action, status === "lost" ? "revoke" : "review");
  }
}
currentDispute.status = "won";
await send(event("charge.dispute.created", dispute)); // Old opened event must still restrict.
assert.equal(writes.at(-1).command.action, "revoke");
await send(event("charge.dispute.funds_withdrawn", dispute));
assert.equal(writes.at(-1).command.action, "revoke");
currentCharge.refunded = true; currentCharge.amount_refunded = 1234;
await send(event("charge.dispute.funds_reinstated", { ...dispute, status: "won" }));
assert.equal(writes.at(-1).command.action, "revoke");
assert.equal(writes.at(-1).command.reason, "charge_fully_refunded");
disputeSetup(); currentDispute.amount = 500;
await send(event("charge.dispute.created", { ...dispute, amount: 500 }));
assert.equal(writes.at(-1).command.action, "revoke");
disputeSetup();
await send(event("charge.dispute.created", dispute), fail("unavailable"), create({ ...deps, provider: { ...deps.provider, retrieveDispute: null } }));
for (const patch of [{ id: "dp_other", charge: "ch_other" }, { object: "refund" }, { livemode: true },
  { status: "unknown" }, { currency: "usd" }, { payment_intent: "pi_other" }, { amount: 1 }]) {
  await send(event("charge.dispute.created", { ...dispute, ...patch }), fail("contract_mismatch"));
}
for (const patch of [{ id: "dp_other" }, { object: "refund" }, { livemode: true }, { charge: "ch_other" },
  { payment_intent: "pi_other" }, { status: "unknown" }, { currency: "usd" }, { amount: 0 }, { amount: 1235 }, { amount: 1.5 }]) {
  currentDispute = { ...dispute, ...patch }; await send(event("charge.dispute.created", dispute), fail("contract_mismatch"));
}
disputeSetup();
for (const patch of [{ id: "ch_other" }, { customer: "cus_other" }, { payment_intent: "pi_other" }, { paid: false },
  { amount: 1 }, { currency: "usd" }, { livemode: true }, { amount_refunded: -1 }]) {
  currentCharge = { ...charge, ...patch }; await send(event("charge.dispute.created", dispute), fail("contract_mismatch"));
}
disputeSetup();
for (const list of [null, { has_more: true, data: [{ id: checkout.id }] }, { has_more: false, data: [] },
  { has_more: false, data: [{ id: checkout.id }, { id: checkout.id }] }]) {
  currentList = list; await send(event("charge.dispute.created", dispute), fail("contract_mismatch"));
}
disputeSetup(); currentCheckout.metadata.product_code = "eofy_pro";
await send(event("charge.dispute.created", dispute), { ok: true, handled: false });
disputeSetup(); currentCheckout.payment_intent = "pi_other";
await send(event("charge.dispute.created", dispute), fail("contract_mismatch"));
disputeSetup(); throwAt = "dispute"; await send(event("charge.dispute.created", dispute), fail("unavailable"));
disputeSetup();
for (const outcome of ["processed", "duplicate", "tombstoned"]) {
  storeResult = { outcome, alertDurable: true }; await send(event("charge.dispute.created", dispute), done(outcome));
}
storeResult = { outcome: "duplicate", alertDurable: false };
await send(event("charge.dispute.created", dispute), fail("persistence_failed"));
assert.equal(grantCalls + reversalCalls, 0);
for (const input of writes) {
  assert.equal(input.command.productCode, offer.productCode);
  assert.ok(["pending", "revoke", "review"].includes(input.command.action));
  assert.equal("data" in input, false); assert.equal("metadata" in input.command, false);
  assert.equal(input.command.checkoutSessionId, checkout.id); assert.equal(input.command.paymentIntentId, pi.id);
  assert.equal(input.command.customerId, pi.customer);
}
console.log(JSON.stringify({ status: "PASS", signedCases: checks, grantCalls, legacyReversalCalls: reversalCalls,
  provider: "mock", exceptionPersistence: "mock atomic state+outbox port; DB NOT_RUN", realStripeApiCalls: 0 }));
