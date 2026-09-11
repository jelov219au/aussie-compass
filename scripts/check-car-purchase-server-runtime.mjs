import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url), ts = require("typescript"), Stripe = require("stripe");
const liveHost = "ep-curly-wave-a78bktnq.ap-southeast-2.aws.neon.tech", testHost = "ep-calm-glitter-a7esj9zv.ap-southeast-2.aws.neon.tech";
const origin = "https://server.example", webhookSecret = "whsec_synthetic_server_test";
const priceId = "price_1UESRxCWvUu2WkWQtBbN0WZY", productId = "prod_VEwKic8ctCSHch";
const baseEnv = { NODE_ENV: "production", VERCEL_ENV: "production", STRIPE_CAR_PURCHASE_PRO_PRICE_ID: priceId,
  STRIPE_CAR_PURCHASE_PRO_PRODUCT_ID: productId, CAR_PURCHASE_PRO_RUNTIME_ENABLED: "true",
  CAR_PURCHASE_PRO_WEBHOOK_ENABLED: "true", CAR_PURCHASE_PRO_ACCESS_TOKEN_SECRET: "synthetic-runtime-secret-".repeat(3), STRIPE_WEBHOOK_SECRET: webhookSecret };
let checks = 0;
function setup({ env = {}, host = liveHost, mode = "live", role = "hoju_app_runtime", ready = true, alerts = true, suffix = "" } = {}) {
  const environment = { ...baseEnv, ...env }, cache = new Map(), queries = [], network = [], hashes = new Set(), mistakes = [];
  let paid = false, cookieValues = [], queryReady = ready;
  const session = { id: `cs_${mode}_server`, object: "checkout.session", customer: "cus_server", payment_intent: "pi_server",
    status: "complete", payment_status: "paid", mode: "payment", livemode: mode === "live", currency: "aud", amount_total: 1490, amount_subtotal: 1490,
    metadata: { product_code: "car_purchase_pro", billing_model: "one_time", purchase_terms_version: "2026-09-06" },
    total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
    line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1490, amount_subtotal: 1490,
      price: { id: environment.STRIPE_CAR_PURCHASE_PRO_PRICE_ID, product: environment.STRIPE_CAR_PURCHASE_PRO_PRODUCT_ID, type: "one_time", currency: "aud", unit_amount: 1490 } }] } };
  const row = { id: "101", product_code: "car_purchase_pro", status: "active", stripe_checkout_session_id: session.id, stripe_customer_id: "cus_server" };
  const stripe = {
    prices: { retrieve: async () => { throw Error("Sales-off runtime must not retrieve prices"); } },
    checkout: { sessions: { retrieve: async id => { assert.equal(id, session.id); network.push("retrieve"); return session; },
      create: async () => { mistakes.push("create"); throw Error("Real checkout forbidden"); }, list: async () => ({ has_more: false, data: [session] }) } },
    paymentIntents: { retrieve: async () => ({ id: "pi_server", object: "payment_intent", customer: "cus_server", livemode: mode === "live", currency: "aud", amount: 1490, amount_received: 1490, latest_charge: "ch_server", status: "succeeded" }) },
    charges: { retrieve: async () => ({ id: "ch_server", object: "charge", payment_intent: "pi_server", customer: "cus_server", livemode: mode === "live", currency: "aud", amount: 1490, paid: true, captured: true, status: "succeeded", disputed: false, refunded: false, amount_refunded: 0 }) },
    disputes: { retrieve: async () => { throw Error("Unexpected dispute"); } },
    webhooks: Stripe.webhooks,
  };
  const query = async (sql, values) => {
    queries.push(sql);
    if (sql.includes("with runtime_functions")) return [{ access_ready: queryReady, webhook_ready: queryReady, checkout_ready: queryReady }];
    if (sql.includes("apply_first_sale_paid_event")) { const outcome = paid ? "duplicate" : "processed"; paid = true; return [{ outcome }]; }
    if (sql.includes("consume_checkout_activation")) { if (!paid) return [{ activation_outcome: "missing" }]; hashes.add(values[4]); return [{ ...row, activation_outcome: "consumed" }]; }
    if (sql.includes("consume_entitlement_restore_token")) { hashes.add(values[3]); return [{ ...row, restore_outcome: "consumed" }]; }
    if (sql.includes("find_active_purchase_entitlement_by_access_session")) return hashes.has(values[2]) ? [row] : [];
    if (sql.includes("create_entitlement_restore_token")) return [{ created: true }];
    if (sql.includes("release_purchase_access_session")) { hashes.delete(values[2]); return [{ released: true }]; }
    mistakes.push(sql); throw Error("Unexpected SQL operation");
  };
  function load(file) {
    file = path.resolve(file); if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { module: mod, exports: mod.exports, Buffer, Date, URL, URLSearchParams, Request, Response, TextDecoder, Uint8Array, AbortSignal,
      process: { env: environment }, require(name) {
        if (name === "server-only") return {};
        if (name === "node:crypto") return require(name);
        if (name === "next/headers") return { cookies: async () => ({ getAll: () => cookieValues }) };
        if (name === "@neondatabase/serverless") return { neon: () => ({ query }) };
        if (name === "./stripe") return { getStripe: () => stripe, getStripeSecretMode: () => mode };
        if (name === "./site") return { siteUrl: origin };
        if (name === "./entitlementConfig") return { getEntitlementDatabaseUrl: () => `postgresql://${role}:synthetic@${host}/neondb${suffix}` };
        if (name === "./paymentAlerts") return { paymentAlertsConfigured: () => alerts, sendPaymentOperatorMessage: async () => { mistakes.push("SMTP"); throw Error("No external messages"); } };
        const target = name.startsWith("./") ? path.resolve(path.dirname(file), name) : name.startsWith("@/") ? path.resolve("src", name.slice(2)) : null;
        if (!target) throw Error("Unexpected dependency " + name); return load(target + (path.extname(target) ? "" : ".ts"));
      } }, { filename: file });
    return mod.exports;
  }
  const runtime = load("src/lib/carPurchaseProServerRuntime.ts");
  return { runtime, load, queries, network, mistakes, environment, session, stripe, setReady(value) { queryReady = value; },
    useCookie(response) { const header = response.headers.get("set-cookie"); assert(header?.includes("HttpOnly") && header.includes("Secure")); const cookie = header.split(";", 1)[0]; cookieValues = [{ value: cookie.slice(cookie.indexOf("=") + 1) }]; return cookie; } };
}
const request = (fields = {}, cookie = "") => new Request(origin + "/api/car-purchase-pro", { method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie } : {}) }, body: new URLSearchParams(fields) });
for (const options of [
  { env: { CAR_PURCHASE_PRO_RUNTIME_ENABLED: "false", CAR_PURCHASE_PRO_WEBHOOK_ENABLED: "false" } },
  { env: { STRIPE_CAR_PURCHASE_PRO_PRICE_ID: "price_wrong" } }, { env: { STRIPE_CAR_PURCHASE_PRO_PRODUCT_ID: "prod_wrong" } },
  { env: { VERCEL_ENV: "preview" }, mode: "test" }, { host: testHost }, { role: "neondb_owner" },
  { mode: "test" }, { host: liveHost.replace(".ap-", "-pooler.ap-") }, { suffix: "?host=evil.example" },
]) {
  const { runtime, queries, network } = setup(options);
  assert.equal(await runtime.isConfiguredCarPurchaseAccessAvailable(), false);
  assert.equal((await runtime.handleConfiguredCarPurchaseCheckout(request())).status, 503);
  assert.equal((await runtime.handleConfiguredCarPurchaseAccess("activate", request())).status, 503);
  assert.equal(queries.length + network.length, 0); checks++;
}
for (const options of [{ ready: false }, { alerts: false }, { env: { CAR_PURCHASE_PRO_WEBHOOK_ENABLED: "false" } }]) {
  const { runtime } = setup(options); assert.equal(await runtime.isConfiguredCarPurchaseAccessAvailable(), false); checks++;
}
const live = setup(); const config = live.load("src/lib/carPurchaseProServerConfig.ts");
assert.equal(config.carPurchaseLiveOffer.stripePriceId, priceId); assert.equal(config.carPurchaseLiveOffer.priceCents, 1490);
assert.equal(await live.runtime.isConfiguredCarPurchaseAccessAvailable(), true);
const before = live.queries.length;
assert.equal((await live.runtime.handleConfiguredCarPurchaseCheckout(request({ terms_accepted: "yes", terms_version: "2026-09-06" }))).status, 503);
assert.equal(live.queries.length, before, "sales OFF must not reserve or query even when every access prerequisite is ready");
const payload = JSON.stringify({ id: "evt_server", object: "event", type: "checkout.session.completed", livemode: true, created: Math.floor(Date.now() / 1000), data: { object: live.session } });
const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
const webhook = live.runtime.getConfiguredCarPurchaseWebhookHandler();
assert.equal((await webhook(payload, signature)).outcome, "processed");
assert.equal((await webhook(payload, signature)).outcome, "duplicate");
const activated = await live.runtime.handleConfiguredCarPurchaseAccess("activate", request({ session_id: live.session.id, activation_nonce: "a".repeat(40) }));
assert.equal(activated.status, 200); const cookie = live.useCookie(activated);
assert.equal(await live.runtime.hasConfiguredCarPurchaseWorkspaceAccess(), true);
const code = await live.runtime.handleConfiguredCarPurchaseAccess("restore-code", request({}, cookie)); assert.equal(code.status, 200);
const released = await live.runtime.handleConfiguredCarPurchaseAccess("release", request({}, cookie)); assert.equal(released.status, 200);
assert.equal(await live.runtime.hasConfiguredCarPurchaseWorkspaceAccess(), false);
const restore = await live.runtime.handleConfiguredCarPurchaseAccess("restore", request({ restore_code: (await code.json()).code, restore_nonce: "r".repeat(40) }));
assert.equal(restore.status, 200); live.useCookie(restore); assert.equal(await live.runtime.hasConfiguredCarPurchaseWorkspaceAccess(), true);
live.setReady(false); assert.equal(await live.runtime.hasConfiguredCarPurchaseWorkspaceAccess(), false); assert.equal(await live.runtime.isConfiguredCarPurchaseAccessAvailable(), false);
assert.deepEqual(live.mistakes, []); checks++;
const sandbox = setup({ env: { VERCEL_ENV: "preview", STRIPE_CAR_PURCHASE_PRO_PRICE_ID: "price_sandbox", STRIPE_CAR_PURCHASE_PRO_PRODUCT_ID: "prod_sandbox" }, host: testHost, mode: "test" });
assert.equal(await sandbox.runtime.isConfiguredCarPurchaseAccessAvailable(), true);
assert.equal((await sandbox.runtime.handleConfiguredCarPurchaseCheckout(request())).status, 503); checks++;
const sql = live.load("src/lib/carPurchaseProServerReadiness.ts").carPurchaseServerReadinessSql;
assert.doesNotMatch(sql, /from public\.schema_migrations/i); assert.match(sql, /has_function_privilege/); assert.match(sql, /assert_car_purchase_grant_allowed_v1/);
console.log(`PASS configured Car server: ${checks} environment/flow cases; signed webhook → activation → workspace → code → release → restore; sales always OFF. Real adapters with synthetic SQL/Stripe, no network/messages/DB writes.`);
