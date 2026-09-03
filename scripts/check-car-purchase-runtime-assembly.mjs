import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url), ts = require("typescript"), modules = new Map();
const boundaryErrors = [];
let realProviderCalls = 0;
for (const name of ["carPurchaseProCheckoutContract", "carPurchaseProTokens", "carPurchaseProRequestBody",
  "firstSaleGate", "carPurchaseProCheckoutCreation", "carPurchaseProCheckoutGate", "carPurchaseProCheckoutHttp",
  "carPurchaseProAccessStore", "carPurchaseProAccessLifecycle", "carPurchaseProPurchase", "carPurchaseProAccessHttp",
  "carPurchaseProWorkspaceAccess", "carPurchaseProRuntimeAssembly"]) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
    { exports: compiledModule.exports, module: compiledModule, Buffer, Date, Request, Response, URL, URLSearchParams,
      TextDecoder, Uint8Array, require: dependency => {
        if (dependency === "server-only") return {};
        if (dependency === "node:crypto") return crypto;
        if (dependency === "./stripe") return { getStripeSecretMode: () => "test", getStripe: () => {
          realProviderCalls++; throw new Error("Real Stripe client is forbidden.");
        } };
        if (modules.has(dependency)) return modules.get(dependency);
        const error = new Error("Unexpected assembly import: " + dependency);
        boundaryErrors.push(error); throw error;
      } });
  modules.set("./" + name, compiledModule.exports);
}
const { createCarPurchaseRuntimeAssembly: createRuntime } = modules.get("./carPurchaseProRuntimeAssembly");
const tokens = modules.get("./carPurchaseProTokens");
const origin = "https://assembly.example", productCode = "car_purchase_pro";
const cookieName = "__Host-hoju_car_purchase_pro_access";
const now = Date.parse("2026-09-04T00:00:00Z"), secret = "synthetic-assembly-signing-key-".repeat(3);
// Synthetic amount/IDs only; this is not an approved offer or a launch setting.
const offer = { productCode, currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_assembly", stripeProductId: "prod_assembly", termsVersion: "2026-09-03" };
const checkoutId = "cs_test_assembly", customerId = "cus_assembly";
const row = { id: "101", product_code: productCode, status: "active",
  stripe_checkout_session_id: checkoutId, stripe_customer_id: customerId };
const receipt = {
  id: checkoutId, customer: customerId, status: "complete", payment_status: "paid", mode: "payment", livemode: false,
  metadata: { product_code: productCode, billing_model: "one_time", purchase_terms_version: offer.termsVersion },
  currency: "aud", amount_total: 1234, amount_subtotal: 1234,
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: 1234, amount_subtotal: 1234,
    price: { id: offer.stripePriceId, product: offer.stripeProductId, type: "one_time", currency: "aud", unit_amount: 1234 } }] },
};
const goodReadiness = { offer: { ...offer }, mode: "test", accessFunctions: true, runtimePrivileges: true,
  webhook: true, checkoutGate: true, managedPayments: true, customerJourney: true };
let readiness = goodReadiness, readinessFailure = false, cookieFailure = false, queryFailure = false;
let cookieValues = [], lookupOverride;
let readinessReads = 0, cookieReads = 0, responseChecks = 0;
const events = [], queries = [], providerCalls = [], activeHashes = new Set();
function boundary(fn) {
  try { fn(); } catch (error) { boundaryErrors.push(error); throw error; }
}
const provider = {
  async retrievePrice(id) {
    providerCalls.push("price"); events.push("price");
    boundary(() => assert.equal(id, offer.stripePriceId));
    return { id, active: true, type: "one_time", currency: "aud", unit_amount: 1234, tax_behavior: "inclusive",
      livemode: false, product: { id: offer.stripeProductId, active: true, livemode: false,
        metadata: { product_code: productCode, billing_model: "one_time" } } };
  },
  async createSession(params) {
    providerCalls.push("create"); events.push("create");
    return { id: checkoutId, url: "https://checkout.stripe.com/c/pay/" + checkoutId, livemode: false,
      mode: "payment", status: "open", payment_status: "unpaid", currency: "aud", amount_total: 1234,
      amount_subtotal: 1234, expires_at: params.expires_at, metadata: params.metadata };
  },
  async retrieveSession(id, options) {
    providerCalls.push("receipt"); events.push("receipt");
    boundary(() => { assert.equal(id, checkoutId); assert.equal(JSON.stringify(options), '{"expand":["line_items"]}'); });
    return receipt;
  },
};
const configuration = {
  enabled: true, salesEnabled: true, approvedOffer: { ...offer }, expectedMode: "test", stripeMode: "test",
  deployment: "nonproduction", environment: "production", expectedOrigin: origin, secret, provider, now: () => now,
  readCookies: async () => {
    cookieReads++;
    if (cookieFailure) throw new Error("private cookie detail");
    return { getAll(name) { boundary(() => assert.equal(name, cookieName)); return cookieValues; } };
  },
  readReadiness: async (snapshot, mode) => {
    readinessReads++; events.push("readiness");
    boundary(() => { assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), offer); assert.ok(Object.isFrozen(snapshot)); assert.equal(mode, "test"); });
    if (readinessFailure) throw new Error("private readiness detail");
    return readiness;
  },
  query: async (sql, values) => {
    const operation = /public\.([a-z_]+)\(/.exec(sql)?.[1];
    queries.push({ sql, values: [...values] }); events.push(operation);
    boundary(() => { assert.ok(operation); assert.ok(values.every(value => typeof value === "string")); });
    if (queryFailure) throw new Error("private database detail");
    switch (operation) {
      case "claim_first_sale_reservation": return [{ outcome: "claimed", generation: "1", stripe_checkout_session_id: null }];
      case "attach_first_sale_checkout": return [{ attached: true }];
      case "consume_checkout_activation": activeHashes.add(values[4]); return [{ ...row, activation_outcome: "consumed" }];
      case "consume_entitlement_restore_token": activeHashes.add(values[3]); return [{ ...row, restore_outcome: "consumed" }];
      case "find_active_purchase_entitlement_by_access_session":
        return lookupOverride ?? (activeHashes.has(values[2]) ? [row] : []);
      case "create_entitlement_restore_token": return [{ created: true }];
      case "release_purchase_access_session": activeHashes.delete(values[2]); return [{ released: true }];
      default: {
        const error = new Error("Unexpected query: " + operation); boundaryErrors.push(error); throw error;
      }
    }
  },
};
function request(fields = {}, cookie = "", foreign = false) {
  return new Request(origin + "/api/car-purchase-pro/checkout", { method: "POST", headers: {
    origin: foreign ? "https://other.example" : origin, "content-type": "application/x-www-form-urlencoded",
    ...(cookie ? { cookie } : {}),
  }, body: new URLSearchParams(fields) });
}
const terms = { terms_accepted: "yes", terms_version: offer.termsVersion };
const activation = { session_id: checkoutId, activation_nonce: "a".repeat(40) };
async function check(response, status, expectedCode) {
  responseChecks++;
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  if (status !== 200) assert.equal(response.headers.has("set-cookie"), false);
  const body = await response.json();
  if (expectedCode) assert.equal(body.code, expectedCode);
  for (const value of [secret, "private database detail", "private readiness detail", "private cookie detail"]) {
    assert.equal(JSON.stringify(body).includes(value), false);
  }
  assert.equal(boundaryErrors.length, 0, boundaryErrors[0]?.stack);
  assert.equal(realProviderCalls, 0);
  return body;
}
function acceptCookie(response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header.includes("HttpOnly") && header.includes("Secure"));
  const cookie = header.split(";", 1)[0];
  const token = cookie.slice(cookieName.length + 1);
  assert.ok(tokens.decodeCarPurchaseProAccessToken(token, secret, now));
  cookieValues = [{ name: cookieName, value: token }];
  return cookie;
}

// Invalid/static configuration must perform no readiness, cookie, provider or query I/O.
const invalidConfigurations = [
  { enabled: false }, { enabled: "true" }, { approvedOffer: null }, { approvedOffer: { ...offer, priceCents: 2147483648 } },
  { secret: "short" }, { secret: null }, { expectedMode: null }, { stripeMode: "live" }, { stripeMode: "missing" },
  { deployment: "production" }, { deployment: "unknown" }, { environment: "unknown" },
  { deployment: "production", expectedMode: "live", stripeMode: "live", environment: "development" },
  { expectedOrigin: "http://assembly.example" }, { expectedOrigin: origin + "/path" },
  { query: null }, { provider: null }, { provider: { ...provider, retrieveSession: null } }, { readReadiness: null }, { readCookies: null },
];
for (const patch of invalidConfigurations) {
  const runtime = createRuntime({ ...configuration, ...patch });
  await check(await runtime.handleCheckout(request(terms)), 503);
  await check(await runtime.handleAccess("activate", request(activation)), 503);
  assert.equal(await runtime.hasWorkspaceAccess(), false);
}
assert.equal(readinessReads + cookieReads + queries.length + providerCalls.length, 0);

const runtime = createRuntime(configuration);
// Later caller changes cannot replace the offer frozen inside this assembly.
configuration.approvedOffer.priceCents = 9999;
await check(await runtime.handleCheckout(request(terms, "", true)), 403);
assert.equal(readinessReads, 0);
await check(await runtime.handleCheckout(request(terms)), 200);
assert.deepEqual(events, ["readiness", "price", "claim_first_sale_reservation", "create", "attach_first_sale_checkout"]);

const activated = await runtime.handleAccess("activate", request(activation));
let cookie = acceptCookie(activated);
await check(activated, 200, "activate_ready");
assert.equal(await runtime.hasWorkspaceAccess(), true);
let before = providerCalls.length;
await check(await runtime.handleCheckout(request(terms, cookie)), 409, "checkout_already_purchased");
assert.equal(providerCalls.length, before, "existing access blocks even price retrieval");
const issued = await check(await runtime.handleAccess("restore-code", request({}, cookie)), 200);
assert.match(issued.code, /^[A-Za-z0-9_-]{43}$/);
const restored = await runtime.handleAccess("restore", request({ restore_code: issued.code, restore_nonce: "r".repeat(40) }));
cookie = acceptCookie(restored);
await check(restored, 200, "restore_ready");
assert.equal(await runtime.hasWorkspaceAccess(), true);

// Pausing new sales must preserve active access, code issuance and release.
const paused = createRuntime({ ...configuration, approvedOffer: offer, salesEnabled: false });
await check(await paused.handleCheckout(request(terms)), 503);
assert.equal(await paused.hasWorkspaceAccess(), true);
await check(await paused.handleAccess("restore-code", request({}, cookie)), 200);

// Any unknown active-access state must stop checkout before provider/claim.
for (const fault of ["query", "cookie", "wrong_id", "wrong_product", "revoked", "duplicate", "invalid", "invalid_id", "expired"]) {
  const savedCookies = cookieValues;
  if (fault === "query") queryFailure = true;
  if (fault === "cookie") cookieFailure = true;
  if (fault === "wrong_id") lookupOverride = [{ ...row, id: "102" }];
  if (fault === "wrong_product") lookupOverride = [{ ...row, product_code: "eofy_pro" }];
  if (fault === "revoked") lookupOverride = [{ ...row, status: "revoked" }];
  if (fault === "duplicate") cookieValues = [...cookieValues, ...cookieValues];
  if (fault === "invalid") cookieValues = [{ name: cookieName, value: "invalid" }];
  if (fault === "invalid_id") cookieValues = [{ name: cookieName, value: tokens.encodeCarPurchaseProAccessToken(
    { id: "0", productCode, status: "active" }, "e".repeat(43), secret, now) }];
  if (fault === "expired") cookieValues = [{ name: cookieName, value: tokens.encodeCarPurchaseProAccessToken(
    { id: "101", productCode, status: "active" }, "e".repeat(43), secret, now - 31 * 86400000) }];
  before = providerCalls.length;
  const claimsBefore = queries.filter(entry => entry.sql.includes("claim_first_sale_reservation")).length;
  await check(await runtime.handleCheckout(request(terms, cookie)), 503, "checkout_unavailable");
  assert.equal(providerCalls.length, before);
  assert.equal(queries.filter(entry => entry.sql.includes("claim_first_sale_reservation")).length, claimsBefore);
  assert.equal(await runtime.hasWorkspaceAccess(), false);
  queryFailure = false; cookieFailure = false; lookupOverride = undefined; cookieValues = savedCookies;
}

// A readiness result is fresh per operation and must match the exact offer/mode.
for (const bad of [null, true, { ...goodReadiness, mode: "live" },
  ...Object.keys(offer).map(field => ({ ...goodReadiness, offer: { ...offer, [field]: "wrong" } })),
  ...["accessFunctions", "runtimePrivileges", "webhook"].flatMap(field => [false, "true", undefined].map(value => ({ ...goodReadiness, [field]: value })))]) {
  readiness = bad;
  before = queries.length + providerCalls.length;
  await check(await runtime.handleCheckout(request(terms, cookie)), 503);
  for (const [operation, fields] of [["activate", activation], ["restore", { restore_code: issued.code, restore_nonce: "r".repeat(40) }],
    ["restore-code", {}], ["release", {}]]) await check(await runtime.handleAccess(operation, request(fields, cookie)), 503);
  assert.equal(await runtime.hasWorkspaceAccess(), false);
  assert.equal(queries.length + providerCalls.length, before);
}
for (const field of ["checkoutGate", "managedPayments", "customerJourney"]) {
  readiness = { ...goodReadiness, [field]: false };
  before = providerCalls.length;
  await check(await runtime.handleCheckout(request(terms, cookie)), 503);
  assert.equal(await runtime.hasWorkspaceAccess(), true, "sales-only readiness does not revoke access");
  assert.equal(providerCalls.length, before);
}
readiness = goodReadiness; readinessFailure = true;
await check(await runtime.handleCheckout(request(terms, cookie)), 503);
await check(await runtime.handleAccess("release", request({}, cookie)), 503);
assert.equal(await runtime.hasWorkspaceAccess(), false);
readinessFailure = false;
const released = await paused.handleAccess("release", request({}, cookie));
assert.ok(released.headers.get("set-cookie").includes("Max-Age=0"));
await check(released, 200);
assert.equal(await runtime.hasWorkspaceAccess(), false);

// No active DB session is a known false, unlike malformed data or query failure.
await check(await runtime.handleCheckout(request(terms, cookie)), 200);
for (const entry of queries) {
  for (const raw of [secret, issued.code, cookie.slice(cookieName.length + 1)]) {
    assert.equal(entry.values.includes(raw), false); assert.equal(entry.sql.includes(raw), false);
  }
}
assert.equal(boundaryErrors.length, 0, boundaryErrors[0]?.stack);
assert.equal(realProviderCalls, 0);
console.log(`PASS car runtime assembly: ${responseChecks} HTTP checks, ${invalidConfigurations.length} closed configurations, real factory/services/HTTP/workspace with mock readiness/query/provider. Unknown access prevents checkout; sales pause preserves recovery. Production runtime/SQL/Stripe/network/browser/build untouched.`);
