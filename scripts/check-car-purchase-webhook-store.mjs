import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "carPurchaseProWebhookFulfillment", "carPurchaseProWebhookStore"]) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
    { exports: compiledModule.exports, module: compiledModule, Buffer, Date, require: name => {
      if (name === "server-only") return {};
      if (modules.has(name)) return modules.get(name);
      throw new Error("Unexpected import: " + name);
    } });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseWebhookStore: createStore } = modules.get("./carPurchaseProWebhookStore");
const { createCarPurchaseWebhookFulfillment: createFulfillment } = modules.get("./carPurchaseProWebhookFulfillment");
const now = Date.parse("2026-09-04T00:00:00Z");
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_store", stripeProductId: "prod_store", termsVersion: "2026-09-03" };
const identity = { productCode: "car_purchase_pro", checkoutSessionId: "cs_test_store", paymentIntentId: "pi_store", chargeId: "ch_store", customerId: "cus_store" };
const paid = { receipt: { eventId: "evt_store", eventType: "checkout.session.completed", livemode: false, createdAt: new Date(now - 60000) },
  command: { ...identity, action: "grant", currency: "aud", amountTotal: 1234, reason: "checkout_paid" } };
const reversal = { receipt: { ...paid.receipt, eventType: "charge.refunded" },
  command: { ...identity, action: "revoke", reason: "charge_fully_refunded" } };
const row = { outcome: "processed", id: "101", product_code: identity.productCode, status: "revoked",
  event_id: "evt_store", event_type: "charge.refunded", livemode: false, alert_kind: "refund_event",
  alert_durable: true, sale_hold_durable: true, restriction_durable: true, gate_state: "LOCKED",
  stripe_checkout_session_id: identity.checkoutSessionId, stripe_payment_intent_id: identity.paymentIntentId,
  stripe_charge_id: identity.chargeId, stripe_customer_id: identity.customerId };
const empty = { ...row, outcome: "duplicate", id: null, status: null };
let rows = [{ outcome: "processed" }], queryFailure = false;
const calls = [];
const query = async (sql, values) => { calls.push({ sql, values: [...values] }); if (queryFailure) throw new Error("private query detail"); return rows; };
const store = createStore({ query, approvedOffer: offer, expectedMode: "test", now: () => now });
assert.equal((await store.applyPaidEventAndEntitlement(paid)).outcome, "processed");
assert.equal(calls[0].sql, "select public.apply_first_sale_paid_event($1::text,$2::text,$3::boolean,$4::timestamptz,$5::text,$6::text,$7::integer,$8::text,$9::text,$10::text,$11::text,$12::text) as outcome");
assert.deepEqual(calls[0].values, ["evt_store", "checkout.session.completed", "false", paid.receipt.createdAt.toISOString(),
  "car_purchase_pro", "aud", "1234", "cs_test_store", "pi_store", "ch_store", "cus_store", "checkout_paid"]);
rows = [row]; await store.applyReversal(reversal);
assert.equal(calls[1].sql, "select * from public.apply_car_purchase_reversal_event_v1($1::text,$2::text,$3::boolean,$4::timestamptz,$5::text,$6::text,$7::text,$8::text,$9::text,$10::text,$11::text)");
assert.deepEqual(calls[1].values, ["evt_store", "charge.refunded", "false", paid.receipt.createdAt.toISOString(),
  "revoke", "car_purchase_pro", "cs_test_store", "pi_store", "ch_store", "cus_store", "charge_fully_refunded"]);
for (const outcome of ["processed", "duplicate", "ignored_stale"]) {
  rows = [{ outcome }]; assert.equal((await store.applyPaidEventAndEntitlement(paid)).outcome, outcome);
}
for (const bad of [[], null, [{ outcome: "processed" }, { outcome: "processed" }], [{}], [{ outcome: "tombstoned" }],
  [{ outcome: { toString: () => "processed" } }]]) {
  rows = bad; await assert.rejects(store.applyPaidEventAndEntitlement(paid));
}
for (const value of [row, { ...row, id: 101n }, { ...row, outcome: "duplicate", gate_state: "OPEN" }, empty,
  { ...empty, outcome: "tombstoned", stripe_payment_intent_id: "pi_store", stripe_charge_id: "ch_store" }]) {
  rows = [value]; assert.equal((await store.applyReversal(reversal)).outcome, value.outcome);
}
const review = { ...reversal, command: { ...reversal.command, action: "review", reason: "charge_partially_refunded" } };
for (const status of ["review", "revoked"]) { rows = [{ ...row, status }]; await store.applyReversal(review); }
for (const bad of [[], null, [row, row], [{ ...row, id: 9007199254740992 }], [{ ...row, id: "0" }],
  [{ ...row, id: "9223372036854775808" }], [{ ...row, product_code: "eofy_pro" }],
  [{ ...row, stripe_checkout_session_id: "cs_test_other" }], [{ ...row, stripe_payment_intent_id: null }],
  [{ ...row, stripe_charge_id: "ch_other" }], [{ ...row, stripe_customer_id: "cus_other" }],
  [{ ...row, status: "active" }], [{ ...row, outcome: "unknown" }], [{ ...row, outcome: "tombstoned" }],
  [{ ...row, outcome: "duplicate", status: "active" }], [{ ...row, outcome: "ignored_stale" }],
  [{ ...row, outcome: "duplicate", status: "review" }], [{ ...row, event_id: "evt_other" }],
  [{ ...row, event_type: "refund.created" }], [{ ...row, livemode: "false" }],
  [{ ...row, alert_kind: "payment_completed" }], [{ ...row, alert_durable: false }],
  [{ ...row, sale_hold_durable: false }], [{ ...row, restriction_durable: "true" }],
  [{ ...row, gate_state: { toString: () => "OPEN" } }],
  [{ ...empty, outcome: "processed" }], [{ ...empty, product_code: null }],
  [{ ...empty, outcome: "tombstoned", stripe_payment_intent_id: "pi_other", stripe_charge_id: "ch_store" }]]) {
  rows = bad; await assert.rejects(store.applyReversal(reversal));
}
rows = [{ ...row, status: "active" }]; await assert.rejects(store.applyReversal(review));
const beforeInvalid = calls.length;
for (const patch of [{ eventId: "evt_bad';select1" }, { livemode: true }, { createdAt: new Date(NaN) },
  { createdAt: new Date(0) }, { createdAt: new Date(now + 300001) }]) {
  for (const [method, input] of [["applyPaidEventAndEntitlement", paid], ["applyReversal", reversal]]) {
    await assert.rejects(store[method]({ ...input, receipt: { ...input.receipt, ...patch } }));
  }
}
for (const patch of [{ productCode: "car_buy_pro" }, { checkoutSessionId: "cs_live_store" }, { paymentIntentId: "bad" },
  { chargeId: "bad" }, { customerId: "bad" }]) {
  for (const [method, input] of [["applyPaidEventAndEntitlement", paid], ["applyReversal", reversal]]) {
    await assert.rejects(store[method]({ ...input, command: { ...input.command, ...patch } }));
  }
}
for (const patch of [{ action: "review" }, { currency: "usd" }, { amountTotal: 1 }, { reason: "async_payment_succeeded" }]) {
  await assert.rejects(store.applyPaidEventAndEntitlement({ ...paid, command: { ...paid.command, ...patch } }));
}
for (const patch of [{ action: "grant" }, { reason: "checkout_paid" }, { action: "review", reason: "charge_fully_refunded" }]) {
  await assert.rejects(store.applyReversal({ ...reversal, command: { ...reversal.command, ...patch } }));
}
await assert.rejects(store.applyReversal({ ...reversal, receipt: { ...reversal.receipt, eventType: "checkout.session.completed" } }));
for (const patch of [{ approvedOffer: null }, { approvedOffer: { ...offer, priceCents: 2147483648 } }, { expectedMode: null }, { now: () => NaN }]) {
  const closed = createStore({ query, approvedOffer: offer, expectedMode: "test", now: () => now, ...patch });
  await assert.rejects(closed.applyPaidEventAndEntitlement(paid)); await assert.rejects(closed.applyReversal(reversal));
}
assert.equal(calls.length, beforeInvalid, "Invalid persistence inputs must not call query.");

// Real fulfillment -> real store -> scripted query. Authentication/provider are mock ports here;
// the separate fulfillment test verifies the installed SDK's signature implementation.
const session = { id: "cs_test_store", object: "checkout.session", mode: "payment", status: "complete", payment_status: "paid", livemode: false,
  customer: "cus_store", payment_intent: "pi_store", currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  metadata: { product_code: "car_purchase_pro", billing_model: "one_time", purchase_terms_version: offer.termsVersion },
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 }, line_items: { has_more: false, data: [{ quantity: 1,
    currency: "aud", amount_total: 1234, amount_subtotal: 1234, price: { id: "price_store", product: "prod_store", type: "one_time", currency: "aud", unit_amount: 1234 } }] } };
let charge = { id: "ch_store", object: "charge", payment_intent: "pi_store", customer: "cus_store", currency: "aud", amount: 1234,
  livemode: false, status: "succeeded", paid: true, captured: true, disputed: false, refunded: false, amount_refunded: 0 };
const fulfill = createFulfillment({ enabled: true, approvedOffer: offer, expectedMode: "test", stripeMode: "test", deployment: "nonproduction",
  verifySignature: JSON.parse, checkPrerequisites: async () => true, store, now: () => now,
  provider: { retrieveCheckout: async () => session,
    retrievePaymentIntent: async () => ({ id: "pi_store", object: "payment_intent", customer: "cus_store", latest_charge: "ch_store",
      livemode: false, status: "succeeded", currency: "aud", amount: 1234, amount_received: 1234 }),
    retrieveCharge: async () => charge, listCheckoutsForPaymentIntent: async () => ({ has_more: false, data: [{ id: "cs_test_store" }] }) } });
let flows = 0;
async function dispatch(type, object) {
  flows++;
  return fulfill(JSON.stringify({ id: "evt_store", object: "event", type, livemode: false, created: now / 1000 - 60, data: { object } }), "mock-signature");
}
rows = [{ outcome: "processed" }]; assert.equal((await dispatch("checkout.session.completed", session)).outcome, "processed");
assert.ok(calls.at(-1).sql.includes("apply_first_sale_paid_event"));
charge = { ...charge, refunded: true, amount_refunded: 1234 };
for (const value of [row, { ...row, outcome: "duplicate" }, empty,
  { ...empty, outcome: "tombstoned", stripe_payment_intent_id: "pi_store", stripe_charge_id: "ch_store" }]) {
  rows = [value]; assert.equal((await dispatch("charge.refunded", charge)).outcome, value.outcome);
  assert.ok(calls.at(-1).sql.includes("apply_car_purchase_reversal_event_v1")); assert.equal(calls.at(-1).values[4], "revoke");
}
for (const patch of [{ outcome: "duplicate", status: "active" }, { outcome: "ignored_stale" }, { alert_durable: false }]) {
  rows = [{ ...row, ...patch }]; assert.equal((await dispatch("charge.refunded", charge)).reason, "persistence_failed");
}
rows = [{ ...row, product_code: "eofy_pro" }]; assert.equal((await dispatch("charge.refunded", charge)).reason, "persistence_failed");
queryFailure = true; assert.equal((await dispatch("charge.refunded", charge)).reason, "persistence_failed"); queryFailure = false;
const beforeLateGrant = calls.length;
assert.equal((await dispatch("checkout.session.completed", session)).reason, "contract_mismatch");
assert.equal(calls.length, beforeLateGrant);
charge = { ...charge, refunded: false, amount_refunded: 500 };
rows = [{ ...row, status: "review" }]; assert.equal((await dispatch("charge.refunded", charge)).outcome, "processed");
charge = { ...charge, amount_refunded: 0 };
rows = [{ ...row, event_type: "refund.failed", status: "revoked", outcome: "duplicate" }];
assert.equal((await dispatch("refund.failed", { id: "re_store", object: "refund", charge: "ch_store", payment_intent: "pi_store", status: "failed" })).outcome, "duplicate");
for (const call of calls) {
  assert.ok(call.values.every(value => typeof value === "string"));
  assert.equal(call.sql.includes("evt_store"), false); assert.equal(call.sql.includes("cs_test_store"), false);
  assert.equal(call.sql.includes("approve_next_first_sale"), false);
}
console.log(`PASS car webhook store: paid and proposed atomic reversal bindings, strict inputs/restricted rows/durable alerts, ${calls.length} mock queries and ${flows} fulfillment/store flows. No SQL/DB/network/Stripe API; DB atomicity/order unverified.`);
