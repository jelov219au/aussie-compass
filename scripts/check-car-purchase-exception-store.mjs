import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "carPurchaseProWebhookFulfillment", "carPurchaseProExceptionStore"]) {
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
const { createCarPurchaseExceptionStore: create } = modules.get("./carPurchaseProExceptionStore");
const { createCarPurchaseWebhookFulfillment: fulfillFactory } = modules.get("./carPurchaseProWebhookFulfillment");
const now = Date.parse("2026-09-04T00:00:00Z");
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_store", stripeProductId: "prod_store", termsVersion: "2026-09-03" };
const receipt = { eventId: "evt_store", eventType: "checkout.session.completed", livemode: false, createdAt: new Date(now - 60000) };
const command = { productCode: offer.productCode, checkoutSessionId: "cs_test_store", paymentIntentId: "pi_store",
  chargeId: null, customerId: "cus_store", action: "pending", reason: "checkout_payment_pending", referenceId: "cs_test_store", currentStatus: "processing" };
const pending = { receipt, command };
const failure = { receipt: { ...receipt, eventType: "checkout.session.async_payment_failed" },
  command: { ...command, action: "revoke", reason: "async_payment_failed", currentStatus: "requires_payment_method" } };
const dispute = { receipt: { ...receipt, eventType: "charge.dispute.closed" },
  command: { ...command, action: "review", reason: "dispute_requires_review", chargeId: "ch_store", referenceId: "dp_store", currentStatus: "won" } };
function row(input = pending, patch = {}) {
  const r = input.receipt, c = input.command;
  return { outcome: "processed", event_id: r.eventId, event_type: r.eventType, livemode: r.livemode,
    product_code: c.productCode, checkout_session_id: c.checkoutSessionId, payment_intent_id: c.paymentIntentId,
    charge_id: c.chargeId, customer_id: c.customerId, reference_id: c.referenceId,
    alert_kind: r.eventType.startsWith("charge.dispute.") ? "dispute_event" : "fulfillment_attention",
    alert_durable: true, sale_hold_durable: true, gate_state: "RESERVED", restriction_durable: c.action !== "pending",
    entitlement_status: c.action === "pending" ? null : c.action === "revoke" ? "revoked" : "review", ...patch };
}
let rows = [row()], throws = false, assertions = 0;
const queries = [];
const query = async (sql, values) => { queries.push({ sql, values }); if (throws) throw Error("private query failure"); return rows; };
const config = { query, approvedOffer: offer, expectedMode: "test", now: () => now };
const store = create(config);
async function success(input = pending, patch = {}) {
  rows = [row(input, patch)]; const result = await store.applyExceptionAndEnqueueAlert(input);
  assert.equal(JSON.stringify(result), JSON.stringify({ outcome: rows[0].outcome, alertDurable: true })); assertions++;
}
async function reject(input = pending, instance = store, beforeQuery = false) {
  const before = queries.length;
  await assert.rejects(instance.applyExceptionAndEnqueueAlert(input));
  assert.equal(queries.length, before + (beforeQuery ? 0 : 1)); assertions++;
}
await success();
assert.equal(queries[0].sql, "select * from public.apply_car_purchase_exception_event_v1($1::text,$2::text,$3::boolean,$4::timestamptz,$5::text,$6::text,$7::text,$8::text,$9::text,$10::text,$11::text,$12::text,$13::text)");
assert.equal(JSON.stringify(queries[0].values), JSON.stringify(["evt_store", "checkout.session.completed", "false", receipt.createdAt.toISOString(),
  "car_purchase_pro", "cs_test_store", "pi_store", null, "cus_store", "pending", "checkout_payment_pending", "cs_test_store", "processing"]));
await success(failure); await success(dispute);
assert.equal(queries[2].values[7], "ch_store"); assert.equal(queries[2].values[11], "dp_store");
await success(pending, { outcome: "duplicate", entitlement_status: "active", gate_state: "LOCKED" });
await success(dispute, { outcome: "duplicate", entitlement_status: "revoked", gate_state: "OPEN" });
await success(pending, { outcome: "duplicate", entitlement_status: "revoked", restriction_durable: true });
await success(failure, { outcome: "duplicate" });
await success(failure, { outcome: "tombstoned", entitlement_status: null });
await success(dispute, { outcome: "duplicate", entitlement_status: "revoked" });
await success(dispute, { outcome: "duplicate", entitlement_status: null });
await success({ receipt: { ...receipt, eventType: "charge.dispute.created" },
  command: { ...dispute.command, action: "revoke", reason: "dispute_opened", currentStatus: "needs_response" } });
await success({ receipt: { ...receipt, eventType: "charge.dispute.funds_withdrawn" },
  command: { ...dispute.command, action: "revoke", reason: "dispute_lost", currentStatus: "lost" } });
await success({ receipt: { ...receipt, eventType: "charge.dispute.funds_reinstated" },
  command: { ...dispute.command, action: "revoke", reason: "charge_fully_refunded" } });
for (const cfg of [{ approvedOffer: null }, { approvedOffer: { ...offer, priceCents: 2147483648 } }, { expectedMode: null },
  { expectedMode: "live" }, { query: null }, { now: () => NaN }]) await reject(pending, create({ ...config, ...cfg }), true);
for (const patch of [{ eventId: "bad" }, { eventId: "evt_x');drop" }, { eventType: "checkout.session.async_payment_succeeded" },
  { livemode: true }, { createdAt: new Date(NaN) }, { createdAt: new Date(now + 300001) }, { createdAt: new Date(0) }]) {
  await reject({ ...pending, receipt: { ...receipt, ...patch } }, store, true);
}
for (const patch of [{ productCode: "car_buy_pro" }, { checkoutSessionId: "cs_live_store" }, { paymentIntentId: "pi_x;select" },
  { customerId: null }, { chargeId: "" }, { chargeId: "ch_store" }, { referenceId: "cs_test_other" }, { currentStatus: "unknown" },
  { action: "grant" }, { action: "review" }, { reason: "checkout_paid" }]) await reject({ ...pending, command: { ...command, ...patch } }, store, true);
for (const patch of [{ action: "grant" }, { currentStatus: "succeeded" }, { reason: "dispute_opened" }]) {
  await reject({ ...failure, command: { ...failure.command, ...patch } }, store, true);
}
for (const patch of [{ action: "grant" }, { currentStatus: "lost" }, { reason: "dispute_won_or_funds_reinstated" },
  { chargeId: null }, { referenceId: "re_other" }, { currentStatus: "processing" }]) {
  await reject({ ...dispute, command: { ...dispute.command, ...patch } }, store, true);
}
for (const data of [null, [], [{}, {}], [{}]]) { rows = data; await reject(); }
for (const patch of [{ outcome: "ignored_stale" }, { outcome: "tombstoned" }, { event_id: "evt_other" }, { event_type: "other" },
  { livemode: "false" }, { product_code: "eofy_pro" }, { checkout_session_id: "cs_test_other" }, { payment_intent_id: "pi_other" },
  { charge_id: "ch_other" }, { customer_id: "cus_other" }, { reference_id: "cs_test_other" }, { alert_kind: "payment_completed" },
  { alert_durable: false }, { alert_durable: "true" }, { sale_hold_durable: false }, { gate_state: "PAUSED" },
  { gate_state: { toString: () => "OPEN" } },
  { restriction_durable: null }, { entitlement_status: "unknown" }, { entitlement_status: {} },
  { entitlement_status: "active", restriction_durable: true }, { entitlement_status: "review", restriction_durable: false }]) {
  rows = [row(pending, patch)]; await reject();
}
for (const input of [failure, dispute]) {
  for (const patch of [{ outcome: "duplicate", alert_durable: false }, { outcome: "duplicate", restriction_durable: false },
    { outcome: "duplicate", entitlement_status: "active" }, { outcome: "tombstoned" }, { entitlement_status: null }]) {
    rows = [row(input, patch)]; await reject(input);
  }
}
rows = [row(failure, { entitlement_status: "review" })]; await reject(failure);
rows = [row()]; throws = true; await reject(); throws = false;

// Real fulfillment -> real query adapter -> mock query. Signature was tested
// separately; this composition isolates parameter/row failures from HTTP/provider.
const checkout = { id: command.checkoutSessionId, object: "checkout.session", payment_intent: command.paymentIntentId, customer: command.customerId,
  status: "complete", payment_status: "unpaid", mode: "payment", livemode: false,
  metadata: { product_code: offer.productCode, billing_model: offer.billing, purchase_terms_version: offer.termsVersion },
  currency: "aud", amount_total: 1234, amount_subtotal: 1234, total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: offer.stripePriceId, product: offer.stripeProductId, type: "one_time", currency: "aud", unit_amount: 1234 } }] } };
let piStatus = "processing", grantCalls = 0, reversalCalls = 0, flows = 0;
const disputeObject = { id: "dp_store", object: "dispute", charge: "ch_store", payment_intent: command.paymentIntentId,
  livemode: false, currency: "aud", amount: 1234, status: "won" };
const fulfill = fulfillFactory({ enabled: true, approvedOffer: offer, expectedMode: "test", stripeMode: "test", deployment: "nonproduction",
  now: () => now, verifySignature: JSON.parse, checkPrerequisites: async () => true,
  provider: { retrieveCheckout: async () => checkout, retrievePaymentIntent: async () => ({ id: command.paymentIntentId, object: "payment_intent",
    customer: command.customerId, livemode: false, currency: "aud", amount: 1234, status: piStatus }),
  retrieveDispute: async () => disputeObject,
  retrieveCharge: async () => ({ id: "ch_store", object: "charge", payment_intent: command.paymentIntentId, customer: command.customerId,
    livemode: false, currency: "aud", amount: 1234, paid: true, captured: true, status: "succeeded", disputed: false, refunded: false, amount_refunded: 0 }),
  listCheckoutsForPaymentIntent: async () => ({ has_more: false, data: [{ id: checkout.id }] }) },
  store: { applyPaidEventAndEntitlement: async () => { grantCalls++; }, applyReversal: async () => { reversalCalls++; } }, exceptionStore: store });
async function flow(input, patch, expected) {
  rows = [row(input, patch)];
  const event = { id: receipt.eventId, object: "event", type: input.receipt.eventType, livemode: false,
    created: receipt.createdAt.getTime() / 1000, data: { object: input.receipt.eventType.startsWith("charge.dispute.") ? disputeObject : checkout } };
  const result = await fulfill(JSON.stringify(event), "synthetic");
  assert.equal(JSON.stringify(result), JSON.stringify(expected)); flows++;
}
await flow(pending, {}, { ok: true, handled: true, outcome: "processed" });
await flow(pending, { outcome: "duplicate" }, { ok: true, handled: true, outcome: "duplicate" });
await flow(pending, { alert_kind: "payment_completed" }, { ok: false, reason: "persistence_failed" });
await flow(pending, { sale_hold_durable: false }, { ok: false, reason: "persistence_failed" });
piStatus = "requires_payment_method";
await flow(failure, { outcome: "tombstoned", entitlement_status: null }, { ok: true, handled: true, outcome: "tombstoned" });
await flow(failure, { entitlement_status: "active" }, { ok: false, reason: "persistence_failed" });
throws = true; await flow(failure, {}, { ok: false, reason: "persistence_failed" }); throws = false;
checkout.payment_status = "paid";
await flow(dispute, {}, { ok: true, handled: true, outcome: "processed" });
await flow(dispute, { entitlement_status: "active" }, { ok: false, reason: "persistence_failed" });
await flow(dispute, { outcome: "duplicate", alert_durable: false }, { ok: false, reason: "persistence_failed" });
assert.equal(grantCalls + reversalCalls, 0);
console.log(JSON.stringify({ status: "PASS", adapterCases: assertions, mockQueries: queries.length, compositionFlows: flows,
  grantCalls, reversalCalls, sqlFunction: "proposed, NOT_IMPLEMENTED", actualDbExecuted: false }));
