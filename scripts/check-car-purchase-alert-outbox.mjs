import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url), ts = require("typescript");
function load(file) {
  const compiledModule = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../src/lib/" + file, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiledModule, exports: compiledModule.exports, Date, require: name => {
    if (name === "server-only") return {};
    if (name === "node:crypto") return require(name);
    throw Error("Unexpected import " + name);
  } });
  return compiledModule.exports;
}
const { createCarPurchaseAlertOutbox: create } = load("carPurchaseProAlertOutbox.ts");
const { deliverCarPurchaseOperatorAlert: deliver } = load("carPurchaseProOperatorAlerts.ts");
const token = "b".repeat(43), digest = createHash("sha256").update(token).digest("hex");
const eventId = "evt_outboxFixture123", kind = "fulfillment_attention";
const base = { claim_outcome: "claimed", event_id: eventId, livemode: false, alert_kind: kind,
  event_type: "checkout.session.completed", event_ref_last8: eventId.slice(-8), product_code: "car_purchase_pro",
  checkout_ref_last8: "ckout123", payment_intent_ref_last8: "yment123", charge_ref_last8: null, attempts: 1 };
const input = { receipt: { eventId, eventType: base.event_type, livemode: false, createdAt: new Date("2026-09-04T00:00:00Z") },
  command: { productCode: "car_purchase_pro", checkoutSessionId: "cs_test_fullCheckout123", paymentIntentId: "pi_fullPayment123",
    customerId: "cus_fullCustomer123", chargeId: null, action: "pending", reason: "checkout_payment_pending",
    referenceId: "cs_test_fullCheckout123", currentStatus: "processing" } };
let rows = [base], calls = [], checks = 0;
const query = async (statement, values) => { calls.push({ statement, values }); return rows; };
const box = create({ query, expectedMode: "test", newClaimToken: () => token });
async function claim() { return box.claim(eventId, kind); }
async function rejects(fn) { await assert.rejects(fn); checks++; }
let result = await claim();
assert.equal(result.intent.claimToken, token);
assert.equal(JSON.stringify(calls.at(-1).values), JSON.stringify([eventId, kind, "car_purchase_pro", "false", digest]));
assert.ok(calls.at(-1).statement.includes("claim_car_purchase_operator_alert_v1($1::text"));
assert.equal(calls.at(-1).statement.includes(eventId), false); checks++;
for (const outcome of ["sent", "busy"]) { rows = [{ ...base, claim_outcome: outcome }]; assert.equal((await claim()).outcome, outcome); checks++; }
rows = [{ ...base, claim_outcome: "missing", event_type: null, checkout_ref_last8: null,
  payment_intent_ref_last8: null, charge_ref_last8: null, attempts: 0 }];
assert.equal((await claim()).outcome, "missing"); checks++;
for (const malformed of [null, {}, [], [base, base], [null]]) { rows = malformed; await rejects(claim); }
for (const patch of [{ event_id: "evt_other" }, { livemode: true }, { livemode: "false" }, { product_code: "eofy_pro" },
  { alert_kind: "refund_event" }, { event_ref_last8: "wrong" }, { event_type: "checkout.session.async_payment_succeeded" },
  { checkout_ref_last8: null }, { payment_intent_ref_last8: "longerThan8" }, { charge_ref_last8: "charge12" },
  { attempts: "1" }, { attempts: 0 }, { attempts: 1001 }, { attempts: 1.5 }, { extra: true },
  { claim_outcome: "unknown" }, { claim_outcome: { toString: () => "claimed" } }]) {
  rows = [{ ...base, ...patch }]; await rejects(claim);
}
for (const outcome of ["sent", "busy", "missing"]) { rows = [{ ...base, claim_outcome: outcome, product_code: "eofy_pro" }]; await rejects(claim); }
rows = [{ ...base, claim_outcome: "missing" }]; await rejects(claim);
for (const [alertKind, eventType] of [["refund_event", "refund.updated"], ["dispute_event", "charge.dispute.funds_withdrawn"]]) {
  rows = [{ ...base, alert_kind: alertKind, event_type: eventType, charge_ref_last8: "charge12" }];
  assert.equal((await box.claim(eventId, alertKind)).intent.chargeRefLast8, "charge12"); checks++;
  rows = [{ ...rows[0], charge_ref_last8: null }]; await rejects(() => box.claim(eventId, alertKind));
}
const beforeInvalid = calls.length;
for (const [id, alertKind] of [["bad", kind], [eventId, "payment_completed"], [eventId, "unknown"]]) await rejects(() => box.claim(id, alertKind));
for (const config of [{ expectedMode: null }, { query: null }, { newClaimToken: () => "short" }]) {
  await rejects(() => create({ query, expectedMode: "test", newClaimToken: () => token, ...config }).claim(eventId, kind));
}
await rejects(() => box.markSent(eventId, kind, "short"));
await rejects(() => box.release("bad", kind, token));
assert.equal(calls.length, beforeInvalid);
for (const [method, column, functionName] of [["markSent", "marked", "mark_car_purchase_operator_alert_sent_v1"],
  ["release", "released", "release_car_purchase_operator_alert_claim_v1"]]) {
  for (const value of [true, false]) { rows = [{ [column]: value }]; assert.equal(await box[method](eventId, kind, token), value); checks++; }
  assert.ok(calls.at(-1).statement.includes(functionName));
  assert.equal(calls.at(-1).values[4], digest);
  for (const bad of [[], [{ [column]: "true" }], [{ [column]: true, extra: 1 }], [{ [column]: true }, { [column]: true }]]) {
    rows = bad; await rejects(() => box[method](eventId, kind, token));
  }
}
await rejects(() => create({ query: async () => { throw Error("mock database failure"); }, expectedMode: "test" }).claim(eventId, kind));
let sent = 0, released = 0, marked = 0, senderFailure = false;
const composed = create({ expectedMode: "test", newClaimToken: () => token, query: async (statement, values) => {
  assert.equal(values[4], digest);
  if (statement.includes("claim_car_purchase_operator_alert_v1")) return [base];
  if (statement.includes("mark_car_purchase_operator_alert_sent_v1")) { marked++; return [{ marked: true }]; }
  released++; return [{ released: true }];
} });
const sender = async message => { sent++; assert.equal(JSON.stringify(message).includes(token), false);
  if (senderFailure) throw Error("mock sender failure"); return { outcome: "sent" }; };
assert.equal((await deliver(input, composed, sender)).outcome, "sent"); checks++;
senderFailure = true; await rejects(() => deliver(input, composed, sender)); senderFailure = false;
assert.equal((await deliver(input, composed, sender)).outcome, "sent"); checks++;
assert.equal(sent, 3); assert.equal(marked, 2); assert.equal(released, 1);
const wrongPurchase = { ...input, command: { ...input.command, paymentIntentId: "pi_other123" } };
await rejects(() => deliver(wrongPurchase, composed, sender)); assert.equal(sent, 3);
console.log(JSON.stringify({ status: "PASS", checks, mockQueries: calls.length, composedDeliveries: 3,
  releasePaths: released, actualSqlExecuted: false, actualMessagesSent: 0 }));
