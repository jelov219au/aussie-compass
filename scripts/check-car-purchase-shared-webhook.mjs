import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";
const require = createRequire(import.meta.url), ts = require("typescript"), Stripe = require("stripe"), load = localTypeScriptLoader();
const entitlement = load("src/lib/entitlements.ts"), contract = load("src/lib/productEntitlementContract.ts"), resume = load("src/lib/resumeProStripeProduct.ts");
const gateModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/firstSaleGate.ts", "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
  { module: gateModule, exports: gateModule.exports, require: name => name === "server-only" ? {} : require(name) });
let carResult = { ok: true, handled: true, outcome: "processed" }, enabled = true, crash = false, carCalls = 0, sharedCalls = 0;
const secret = "whsec_synthetic_shared_route", env = { VERCEL_ENV: "preview", STRIPE_WEBHOOK_SECRET: secret };
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/app/api/stripe/webhook/route.ts", "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
  { module: mod, exports: mod.exports, Buffer, process: { env }, console: { warn() {}, info() {} }, require(name) {
    if (name === "next/server") return { NextResponse: Response };
    if (name === "@/lib/stripe") return { getStripe: () => ({ webhooks: Stripe.webhooks }) };
    if (name === "@/lib/entitlements") return { getEntitlementCommand: event => { sharedCalls++; return entitlement.getEntitlementCommand(event); } };
    if (name === "@/lib/productEntitlementContract") return contract;
    if (name === "@/lib/resumeProStripeProduct") return resume;
    if (name === "@/lib/firstSaleGate") return gateModule.exports;
    if (name === "@/lib/carPurchaseProServerRuntime") return { getConfiguredCarPurchaseWebhookHandler: () => enabled ? async () => { carCalls++; if (crash) throw Error("private failure"); return carResult; } : null };
    if (name === "@/lib/neonEntitlementStore") return { getConfiguredEntitlementStore: () => null };
    if (name === "@/lib/neonPaymentAlertOutbox") return { getConfiguredPaymentAlertOutbox: () => null };
    if (["@/lib/firstSalePaymentIntent", "@/lib/firstSaleMonitoredMode", "@/lib/neonFirstSaleGate", "@/lib/paymentAlertOutbox", "@/lib/paymentAlerts"].includes(name)) return {};
    throw Error("Unexpected dependency " + name);
  } });
let checks = 0;
async function post(type, object, expected, { badSignature = false, livemode = false } = {}) {
  const payload = JSON.stringify({ id: "evt_shared", object: "event", type, livemode, created: Math.floor(Date.now() / 1000), data: { object } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  const result = await mod.exports.POST(new Request("https://test/api/stripe/webhook", { method: "POST", body: payload,
    headers: { "content-type": "application/json", "stripe-signature": badSignature ? "bad" : signature } }));
  assert.equal(result.status, expected); assert.equal(result.headers.get("cache-control"), "no-store"); assert(!(await result.text()).includes("private")); checks++;
}
const car = { id: "cs_test_car", metadata: { product_code: "car_purchase_pro" } };
await post("checkout.session.completed", car, 200); assert.equal(carCalls, 1); assert.equal(sharedCalls, 0);
for (const reason of ["invalid_signature", "wrong_environment", "contract_mismatch", "invalid_event"]) { carResult = { ok: false, reason }; await post("checkout.session.completed", car, 400); }
for (const reason of ["unavailable", "persistence_failed", "alert_busy", "alert_delivery_failed"]) { carResult = { ok: false, reason }; await post("checkout.session.completed", car, 503); }
carResult = { ok: true, handled: false }; await post("checkout.session.completed", car, 503);
crash = true; await post("checkout.session.completed", car, 503); crash = false;
enabled = false; await post("checkout.session.completed", car, 503); assert.equal(sharedCalls, 0);
await post("checkout.session.completed", car, 400, { badSignature: true }); enabled = true;
const before = carCalls;
for (const [productCode, amount] of [["resume_pro", 990], ["rental_application_pro", 1490], ["pay_evidence_pro", 990], ["eofy_pro", 990], ["leaving_australia_pro", 1290]]) {
  const session = { id: "cs_test_other", mode: "payment", status: "complete", payment_status: "paid", currency: "aud", amount_total: amount,
    customer: "cus_other", payment_intent: "pi_other", metadata: { product_code: productCode } };
  const command = entitlement.getEntitlementCommand({ id: "evt_shared", type: "checkout.session.completed", data: { object: session } });
  assert(command && contract.matchesCheckoutProductEntitlementContract(command));
  await post("checkout.session.completed", session, 200);
}
assert.equal(carCalls, before); assert.equal(sharedCalls, 5);
await post("refund.updated", { id: "re_other", object: "refund", charge: "ch_other", payment_intent: "pi_other", status: "succeeded" }, 200);
assert.equal(carCalls, before + 1); assert.equal(sharedCalls, 6);
console.log(`PASS shared webhook: ${checks} signed route cases; Car retry/rejection isolation, five existing product contracts including Resume AUD990, unhandled reversal fallback; no network/persistence/messages.`);
