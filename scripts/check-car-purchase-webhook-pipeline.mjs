import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), Stripe = require("stripe"), modules = new Map();
for (const name of ["carPurchaseProCheckoutContract", "carPurchaseProWebhookFulfillment", "carPurchaseProWebhookStore",
  "carPurchaseProExceptionStore", "carPurchaseProOperatorAlerts", "carPurchaseProAlertOutbox", "carPurchaseProWebhookPipeline"]) {
  const compiledModule = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiledModule, exports: compiledModule.exports, Buffer, Date, require: name => {
    if (name === "server-only") return {};
    if (name === "node:crypto") return require(name);
    if (modules.has(name)) return modules.get(name);
    throw Error("Unexpected import " + name);
  } });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseWebhookPipeline: create } = modules.get("./carPurchaseProWebhookPipeline");
const now = Date.parse("2026-09-04T00:00:00Z"), secret = "whsec_synthetic_pipeline_only";
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_pipeline", stripeProductId: "prod_pipeline", termsVersion: "2026-09-03" };
const checkout = { id: "cs_test_pipeline", object: "checkout.session", payment_intent: "pi_pipeline", customer: "cus_pipeline",
  status: "complete", payment_status: "unpaid", mode: "payment", livemode: false,
  metadata: { product_code: offer.productCode, billing_model: offer.billing, purchase_terms_version: offer.termsVersion },
  currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: offer.stripePriceId, product: offer.stripeProductId, type: "one_time", currency: "aud", unit_amount: 1234 } }] } };
const pi = { id: "pi_pipeline", object: "payment_intent", customer: "cus_pipeline", livemode: false,
  currency: "aud", amount: 1234, amount_received: 1234, latest_charge: "ch_pipeline", status: "processing" };
const charge = { id: "ch_pipeline", object: "charge", payment_intent: pi.id, customer: pi.customer, livemode: false,
  currency: "aud", amount: 1234, paid: true, captured: true, status: "succeeded", disputed: false, refunded: false, amount_refunded: 0 };
const dispute = { id: "dp_pipeline", object: "dispute", charge: charge.id, payment_intent: pi.id,
  livemode: false, currency: "aud", amount: 1234, status: "needs_response" };
const refund = { id: "re_pipeline", object: "refund", charge: charge.id, payment_intent: pi.id };
let currentCheckout, currentPi, currentCharge, currentDispute, readiness, alertReady, outcome, claimOutcome, throwAt, badMarker, badIntent, marked;
let checks = 0, queries = 0, sends = 0, releases = 0, trace = [], messages = [], blockEvent = null, resume, entered;
const persisted = new Map(), tokens = new Map();
function reset() {
  currentCheckout = structuredClone(checkout); currentPi = structuredClone(pi); currentCharge = structuredClone(charge);
  currentDispute = structuredClone(dispute); readiness = true; alertReady = true; outcome = "processed"; claimOutcome = "claimed";
  throwAt = null; badMarker = false; badIntent = false; marked = true; trace = [];
}
reset();
async function query(sql, a) {
  queries++;
  if (sql.includes("apply_first_sale_paid_event")) { trace.push("paid"); return [{ outcome }]; }
  if (sql.includes("apply_car_purchase_exception_event_v1") || sql.includes("apply_car_purchase_reversal_event_v1")) {
    trace.push("persist"); if (throwAt === "persist") throw Error("private database");
    const exception = sql.includes("exception_event");
    const event = { event_id: a[0], event_type: a[1], livemode: a[2] === "true", product_code: exception ? a[4] : a[5],
      checkout: exception ? a[5] : a[6], pi: exception ? a[6] : a[7], charge: exception ? a[7] : a[8], customer: exception ? a[8] : a[9] };
    const action = exception ? a[9] : a[4], kind = exception ? a[1].startsWith("charge.dispute.") ? "dispute_event" : "fulfillment_attention" : "refund_event";
    persisted.set(a[0], { ...event, kind });
    const common = { outcome, event_id: event.event_id, event_type: event.event_type, livemode: event.livemode,
      product_code: event.product_code, alert_kind: kind, alert_durable: !badMarker, sale_hold_durable: true,
      restriction_durable: action !== "pending", gate_state: "LOCKED" };
    const row = exception ? { ...common, checkout_session_id: event.checkout, payment_intent_id: event.pi, charge_id: event.charge,
      customer_id: event.customer, reference_id: a[11], entitlement_status: action === "pending" ? null : action === "revoke" ? "revoked" : "review" }
      : { ...common, id: "1", status: action === "revoke" ? "revoked" : "review", stripe_checkout_session_id: event.checkout,
        stripe_payment_intent_id: event.pi, stripe_charge_id: event.charge, stripe_customer_id: event.customer };
    if (a[0] === blockEvent) { entered(); await new Promise(resolve => { resume = resolve; }); }
    return [row];
  }
  if (sql.includes("claim_car_purchase_operator_alert_v1")) {
    trace.push("claim"); if (throwAt === "claim") throw Error("private claim");
    const e = persisted.get(a[0]); assert.ok(e, "Claim must follow persistence"); assert.match(a[4], /^[a-f0-9]{64}$/); tokens.set(a[0], a[4]);
    return [{ claim_outcome: claimOutcome, event_id: e.event_id, event_type: claimOutcome === "missing" ? null : e.event_type,
      livemode: e.livemode, product_code: e.product_code, alert_kind: e.kind, event_ref_last8: e.event_id.slice(-8),
      checkout_ref_last8: claimOutcome === "missing" ? null : e.checkout.slice(-8),
      payment_intent_ref_last8: claimOutcome === "missing" ? null : badIntent ? "badref" : e.pi.slice(-8),
      charge_ref_last8: claimOutcome === "missing" ? null : e.charge?.slice(-8) ?? null, attempts: claimOutcome === "missing" ? 0 : 1 }];
  }
  assert.equal(a[4], tokens.get(a[0]), "Completion must carry the current request token hash");
  if (sql.includes("mark_car_purchase_operator_alert_sent_v1")) { trace.push("mark"); return [{ marked }]; }
  if (sql.includes("release_car_purchase_operator_alert_claim_v1")) { trace.push("release"); releases++; return [{ released: true }]; }
  throw Error("Unexpected SQL");
}
const deps = { enabled: true, approvedOffer: offer, expectedMode: "test", stripeMode: "test", deployment: "nonproduction", now: () => now, query,
  verifySignature: (body, signature) => { trace.push("verify"); return Stripe.webhooks.constructEvent(body, signature, secret, 300, undefined, now); },
  checkPrerequisites: async () => { trace.push("ready"); return readiness; },
  checkAlertPrerequisites: async () => { trace.push("alertReady"); if (throwAt === "readiness") throw Error("private readiness"); return alertReady; },
  provider: { retrieveCheckout: async () => currentCheckout, retrievePaymentIntent: async () => currentPi,
    retrieveCharge: async () => currentCharge, retrieveDispute: async () => currentDispute,
    listCheckoutsForPaymentIntent: async () => ({ has_more: false, data: [{ id: checkout.id }] }) },
  sender: async message => { trace.push("send"); sends++; messages.push(message); assert.ok(Object.isFrozen(message));
    for (const sensitive of [secret, pi.id, pi.customer, checkout.id, "private"]) assert.equal(JSON.stringify(message).includes(sensitive), false);
    if (throwAt === "send") throw Error("private sender"); return { outcome: "sent" }; },
};
const handler = create(deps);
function event(type = "checkout.session.completed", object = currentCheckout, id = "evt_pipeline") {
  return { id, object: "event", type, created: now / 1000 - 60, livemode: false, data: { object } };
}
function invoke(value, target = handler, invalidSignature = false) {
  const body = JSON.stringify(value), signature = Stripe.webhooks.generateTestHeaderString({ payload: body,
    secret: invalidSignature ? "wrong" : secret, timestamp: now / 1000 });
  return target(body, signature);
}
async function expect(value, expected, target = handler, invalidSignature = false) {
  const result = await invoke(value, target, invalidSignature); assert.equal(JSON.stringify(result), JSON.stringify(expected));
  assert.equal(JSON.stringify(result).includes("private"), false); checks++;
}
const success = (alert = "sent", state = "processed") => ({ ok: true, handled: true, outcome: state, alert });
const failed = reason => ({ ok: false, reason }), alertFailed = reason => ({ ...failed(reason), persisted: true });
await expect(event(), success()); assert.deepEqual(trace, ["verify", "ready", "alertReady", "persist", "claim", "send", "mark"]);
reset(); currentPi.status = "requires_payment_method"; await expect(event("checkout.session.async_payment_failed"), success());
reset(); currentCheckout.payment_status = "paid"; currentCharge.disputed = true;
await expect(event("charge.dispute.created", currentDispute), success());
currentDispute.status = "won"; await expect(event("charge.dispute.funds_reinstated", currentDispute), success());
assert.ok(messages.at(-1).text.includes("자동 복원하지 마세요"));
reset(); currentCheckout.payment_status = "paid"; currentCharge.amount_refunded = 100;
await expect(event("refund.updated", refund), success());
reset(); currentCheckout.payment_status = "paid"; currentPi.status = "succeeded";
const beforePaid = sends; await expect(event(), success("not_requested")); assert.equal(sends, beforePaid); assert.ok(trace.includes("paid"));
for (const value of ["sent", "busy", "missing"]) { reset(); claimOutcome = value; const before = sends;
  await expect(event(), value === "sent" ? success("already_sent") : alertFailed(value === "busy" ? "alert_busy" : "alert_delivery_failed")); assert.equal(sends, before); }
reset(); outcome = "duplicate"; await expect(event(), success("sent", "duplicate"));
for (const failure of ["persist", "claim", "send", "readiness"]) { reset(); throwAt = failure;
  await expect(event(), failure === "persist" ? failed("persistence_failed") : failure === "readiness" ? failed("unavailable") : alertFailed("alert_delivery_failed")); }
reset(); badMarker = true; await expect(event(), failed("persistence_failed")); assert.equal(trace.includes("claim"), false);
reset(); badIntent = true; await expect(event(), alertFailed("alert_delivery_failed")); assert.equal(trace.includes("send"), false);
reset(); marked = false; await expect(event(), alertFailed("alert_delivery_failed")); assert.equal(trace.at(-1), "release");
for (const flag of ["readiness", "alertReady"]) { reset(); if (flag === "readiness") readiness = false; else alertReady = false;
  await expect(event(), failed("unavailable")); assert.equal(trace.includes("persist"), false); }
for (const patch of [{ sender: null }, { query: null }, { checkAlertPrerequisites: null }, { enabled: false }]) {
  reset(); await expect(event(), failed("unavailable"), create({ ...deps, ...patch })); assert.equal(trace.length, 0); }
reset(); await expect(event(), failed("invalid_signature"), handler, true); assert.deepEqual(trace, ["verify"]);
reset(); await expect(event("invoice.created", {}), { ok: true, handled: false }); assert.deepEqual(trace, ["verify"]);
reset(); currentCheckout.metadata.product_code = "eofy_pro"; await expect(event(), { ok: true, handled: false }); assert.deepEqual(trace, ["verify"]);
reset(); currentCheckout.payment_status = "paid"; currentCheckout.metadata.product_code = "eofy_pro";
await expect(event("refund.updated", refund), { ok: true, handled: false }); assert.equal(trace.includes("persist"), false);
// Deterministic in-memory interleaving: A pauses at persistence, B completes,
// then A resumes. No parallel processes, SQL connections or network calls.
reset(); blockEvent = "evt_pipelineA"; const reached = new Promise(resolve => { entered = resolve; });
const first = invoke(event(undefined, currentCheckout, blockEvent)); await reached;
await expect(event(undefined, currentCheckout, "evt_pipelineB"), success()); resume();
assert.equal(JSON.stringify(await first), JSON.stringify(success())); checks++;
assert.ok(messages.at(-2).text.includes("ipelineB")); assert.ok(messages.at(-1).text.includes("ipelineA"));
console.log(JSON.stringify({ status: "PASS", signedFlows: checks, mockQueries: queries, mockSenderCalls: sends,
  releases, interleavedRequests: 2, actualSqlExecuted: false, realStripeApiCalls: 0, actualMessagesSent: 0 }));
