import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

// Real application modules and route exports, with an injected test runtime.
// Only the provider and query ports are scripted. This does not execute SQL,
// prove DB concurrency, or connect/enable the closed production runtime.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const modules = new Map();
const boundaryErrors = [];
let realClientRequests = 0;
function load(path, resolve) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  runInNewContext(code, {
    exports: compiledModule.exports, module: compiledModule,
    Buffer, Date, Request, Response, URL, URLSearchParams, TextDecoder, Uint8Array,
    process: { env: { VERCEL_ENV: "production" } },
    require: resolve,
  }, { filename: path });
  return compiledModule.exports;
}
function resolve(name) {
  if (name === "server-only") return {};
  if (name === "node:crypto") return crypto;
  if (name === "./stripe") return {
    getStripeSecretMode: () => "live",
    getStripe: () => {
      realClientRequests++;
      throw new Error("Real provider client is forbidden in this harness.");
    },
  };
  if (modules.has(name)) return modules.get(name);
  const error = new Error("Unexpected integration import: " + name);
  boundaryErrors.push(error);
  throw error;
}
for (const name of ["carPurchaseProTokens", "carPurchaseProCheckoutContract", "carPurchaseProAccessLifecycle",
  "carPurchaseProAccessStore", "carPurchaseProPurchase", "carPurchaseProAccessHttp"]) {
  modules.set("./" + name, load("../src/lib/" + name + ".ts", resolve));
}
const tokens = modules.get("./carPurchaseProTokens");
const { createCarPurchaseCheckoutVerifier, getVerifiedCarPurchaseProCheckout } = modules.get("./carPurchaseProPurchase");
const { createCarPurchaseAccessStore } = modules.get("./carPurchaseProAccessStore");
const { createCarPurchaseAccessLifecycle } = modules.get("./carPurchaseProAccessLifecycle");
const { createCarPurchaseAccessHttp } = modules.get("./carPurchaseProAccessHttp");
const origin = "https://integration.example";
const cookieName = "__Host-hoju_car_purchase_pro_access";
const productCode = "car_purchase_pro";
const secret = "synthetic-integration-signing-key-".repeat(3);
const checkoutId = "cs_test_integration";
const customerId = "cus_integration";
const activationNonce = "a".repeat(40);
const restoreNonce = "r".repeat(40);
let now = Date.parse("2026-09-04T00:00:00Z");
const nowFn = () => now;
// Synthetic fixture only: not an approved price, Stripe object, or sale decision.
const offer = { productCode, currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_integration", stripeProductId: "prod_integration", termsVersion: "2026-09-03" };
const paidSession = {
  id: checkoutId, customer: customerId, status: "complete", payment_status: "paid", mode: "payment", livemode: false,
  metadata: { product_code: productCode, billing_model: "one_time", purchase_terms_version: offer.termsVersion },
  currency: "aud", amount_total: offer.priceCents, amount_subtotal: offer.priceCents,
  total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: 0 },
  line_items: { has_more: false, data: [{ quantity: 1, currency: "aud", amount_total: offer.priceCents,
    amount_subtotal: offer.priceCents, price: { id: offer.stripePriceId, product: offer.stripeProductId,
      type: "one_time", currency: "aud", unit_amount: offer.priceCents } }] },
};
const activeRow = { id: "101", product_code: productCode, status: "active",
  stripe_checkout_session_id: checkoutId, stripe_customer_id: customerId };

const queries = [], providers = [], events = [], pending = [];
let providerResult = paidSession;
let providerFailure = false;
function recordAssertions(fn) {
  // Application error handling must not swallow a failed test assertion.
  try { fn(); } catch (error) { boundaryErrors.push(error); throw error; }
}
const verify = createCarPurchaseCheckoutVerifier({ approvedOffer: offer, expectedMode: "test", stripeMode: "test",
  retrieveSession: async (id, options) => {
    providers.push(id);
    events.push("provider");
    recordAssertions(() => {
      assert.equal(id, checkoutId);
      assert.equal(JSON.stringify(options), '{"expand":["line_items"]}');
    });
    if (providerFailure) throw new Error("synthetic private provider detail");
    return providerResult;
  },
});
const store = createCarPurchaseAccessStore(async (sql, values) => {
  const operation = /public\.([a-z_]+)\(/.exec(sql)?.[1];
  const entry = { operation, sql, values: [...values] };
  queries.push(entry);
  events.push(operation);
  const step = pending.shift();
  recordAssertions(() => {
    assert.ok(step, "Unexpected query call: " + operation);
    assert.equal(operation, step.operation);
    assert.ok(values.every(value => typeof value === "string"));
    assert.equal(sql.includes(checkoutId), false, "SQL values must be bound");
    step.check?.(entry.values);
  });
  if (step.fail) throw new Error("synthetic private database detail");
  return step.rows;
}, nowFn);
function expectQuery(operation, rows, check, fail = false) { pending.push({ operation, rows, check, fail }); }
function healthy() {
  assert.equal(pending.length, 0, "Every expected query must run");
  assert.equal(boundaryErrors.length, 0, boundaryErrors[0]?.stack);
  assert.equal(realClientRequests, 0);
}
const service = createCarPurchaseAccessLifecycle({ store, secret, getVerifiedCheckout: verify, now: nowFn });
function handler(serviceValue) {
  return createCarPurchaseAccessHttp({ service: serviceValue, enabled: true, expectedOrigin: origin, environment: "production" });
}
const handle = handler(service);
const routes = {};
const paths = { activate: "access/activate", restore: "restore", "restore-code": "restore-code", release: "access/release" };
for (const [operation, path] of Object.entries(paths)) {
  routes[operation] = load(`../src/app/api/car-purchase-pro/${path}/route.ts`, name => {
    assert.equal(name, "@/lib/carPurchaseProRuntime");
    return { handleCarPurchaseAccess: (actual, request) => {
      recordAssertions(() => assert.equal(actual, operation));
      return handle(actual, request);
    } };
  }).POST;
}
function request(operation, fields = {}, cookie, headers = {}) {
  return new Request(`${origin}/api/car-purchase-pro/${paths[operation]}`, {
    method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded",
      ...(cookie ? { cookie } : {}), ...headers }, body: new URLSearchParams(fields),
  });
}
const activation = { session_id: checkoutId, activation_nonce: activationNonce };
async function checkResponse(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.has("location"), false);
  if (status !== 200) assert.equal(response.headers.has("set-cookie"), false);
  const body = await response.json();
  const text = JSON.stringify(body);
  for (const privateValue of [secret, activationNonce, restoreNonce, "private database detail", "private provider detail"]) {
    assert.equal(text.includes(privateValue), false);
  }
  healthy();
  return { response, body };
}
async function send(operation, fields, cookie, status = 200, headers) {
  return checkResponse(await routes[operation](request(operation, fields, cookie, headers)), status);
}
function accessCookie(result) {
  const header = result.response.headers.get("set-cookie");
  assert.ok(header);
  for (const flag of ["Path=/", "HttpOnly", "Secure", "SameSite=Strict", "Max-Age=2592000"]) assert.ok(header.includes(flag));
  assert.equal(header.includes("Domain="), false);
  const cookie = header.split(";", 1)[0];
  assert.ok(cookie.startsWith(cookieName + "="));
  const token = cookie.slice(cookieName.length + 1);
  assert.equal(JSON.stringify(result.body).includes(token), false);
  assert.equal(result.body.destination, "/car-purchase-pro/workspace");
  const payload = tokens.decodeCarPurchaseProAccessToken(token, secret, now);
  assert.ok(payload, "Response cookie must contain an authentic, current token");
  assert.equal(payload.entitlementId, activeRow.id);
  assert.equal(payload.productCode, productCode);
  return { cookie, token, payload, hash: tokens.hashCarPurchaseProAccessSessionId(payload.accessSessionId) };
}

// Admission failure must stop at the earliest boundary in the assembled stack.
await send("activate", activation, undefined, 403, { origin: "https://foreign.example" });
await send("activate", { ...activation, customer_id: "cus_browserSupplied" }, undefined, 400);
await send("activate", { ...activation, activation_nonce: "short" }, undefined, 400);
const closedService = createCarPurchaseAccessLifecycle({ store, secret, getVerifiedCheckout: getVerifiedCarPurchaseProCheckout, now: nowFn });
await checkResponse(await handler(closedService)("activate", request("activate", { ...activation, session_id: "cs_live_integration" })), 409);
assert.equal(providers.length, 0);
assert.equal(queries.length, 0);
for (const patch of [{ payment_status: "unpaid" }, { amount_total: 1 }, { customer: "bad" },
  { metadata: { ...paidSession.metadata, product_code: "eofy_pro" } }]) {
  providerResult = { ...paidSession, ...patch };
  await send("activate", activation, undefined, 409);
}
providerFailure = true;
await send("activate", activation, undefined, 409);
providerFailure = false;
providerResult = paidSession;
assert.equal(queries.length, 0, "Rejected server receipts must not reach the store");

// A paid Stripe receipt does not override a DB denial or malformed entitlement.
expectQuery("consume_checkout_activation", [{ id: null, activation_outcome: "revoked" }]);
await send("activate", activation, undefined, 409);
for (const patch of [{ product_code: "eofy_pro" }, { stripe_customer_id: "cus_other" }]) {
  expectQuery("consume_checkout_activation", [{ ...activeRow, activation_outcome: "consumed", ...patch }]);
  await send("activate", activation, undefined, 503);
}
expectQuery("consume_checkout_activation", undefined, undefined, true);
await send("activate", activation, undefined, 503);

const successfulFlowStart = events.length;
let activationValues;
expectQuery("consume_checkout_activation", [{ ...activeRow, activation_outcome: "consumed" }], values => { activationValues = values; });
const activated = accessCookie(await send("activate", activation));
assert.deepEqual(events.slice(successfulFlowStart), ["provider", "consume_checkout_activation"]);
assert.deepEqual(activationValues, [checkoutId, productCode, customerId,
  createHash("sha256").update("car-purchase-pro-activation-nonce-v1:" + activationNonce).digest("hex"),
  activated.hash, activated.payload.accessSessionId.slice(-8), new Date(activated.payload.exp * 1000).toISOString()]);
expectQuery("find_active_purchase_entitlement_by_access_session", [activeRow], values => {
  assert.deepEqual(values, [activeRow.id, productCode, activated.hash]);
});
assert.equal((await service.getActive(activated.token)).id, activeRow.id);
healthy();

now += 1000;
expectQuery("consume_checkout_activation", [{ ...activeRow, activation_outcome: "idempotent" }]);
const retried = accessCookie(await send("activate", activation));
assert.equal(retried.hash, activated.hash, "Retry must reference the same stored session");
expectQuery("consume_checkout_activation", [{ id: null, activation_outcome: "used" }]);
await send("activate", { ...activation, activation_nonce: "b".repeat(40) }, undefined, 409);

// Follow the returned cookie into the real lookup, then store only a code hash.
let issuedValues;
expectQuery("find_active_purchase_entitlement_by_access_session", [activeRow], values => {
  assert.deepEqual(values, [activeRow.id, productCode, activated.hash]);
});
expectQuery("create_entitlement_restore_token", [{ created: true }], values => { issuedValues = values; });
const issued = await send("restore-code", {}, activated.cookie);
assert.equal(issued.response.headers.has("set-cookie"), false);
assert.match(issued.body.code, /^[A-Za-z0-9_-]{43}$/);
assert.deepEqual(issuedValues, [activeRow.id, productCode,
  tokens.hashCarPurchaseProRestoreCode(issued.body.code), issued.body.expiresAt]);
const restoreFields = { restore_code: issued.body.code, restore_nonce: restoreNonce };
const providerCountBeforeRestore = providers.length;
let restoreValues;
expectQuery("consume_entitlement_restore_token", [{ ...activeRow, restore_outcome: "consumed" }], values => { restoreValues = values; });
const restored = accessCookie(await send("restore", restoreFields));
assert.notEqual(restored.hash, activated.hash);
assert.deepEqual(restoreValues, [issuedValues[2], productCode, tokens.hashCarPurchaseProRestoreNonce(restoreNonce),
  restored.hash, restored.payload.accessSessionId.slice(-8), new Date(restored.payload.exp * 1000).toISOString()]);
expectQuery("consume_entitlement_restore_token", [{ ...activeRow, restore_outcome: "idempotent" }]);
assert.equal(accessCookie(await send("restore", restoreFields)).hash, restored.hash);
expectQuery("consume_entitlement_restore_token", [{ id: null, restore_outcome: "used" }]);
await send("restore", { ...restoreFields, restore_nonce: "s".repeat(40) }, undefined, 409);

// Failed issuance must not leak a code that was never persisted.
expectQuery("find_active_purchase_entitlement_by_access_session", [activeRow]);
expectQuery("create_entitlement_restore_token", [{ created: false }]);
assert.equal((await send("restore-code", {}, restored.cookie, 503)).body.code, "restore_code_unavailable");
expectQuery("find_active_purchase_entitlement_by_access_session", []);
await send("restore-code", {}, restored.cookie, 401);
const lastChar = restored.token.at(-1);
const tamperedCookie = cookieName + "=" + restored.token.slice(0, -1) + (lastChar === "A" ? "B" : "A");
const beforeTamper = queries.length;
await send("restore-code", {}, tamperedCookie, 401);
assert.equal(queries.length, beforeTamper);

// Failed server revocation keeps the browser credential; success expires it.
for (const failure of [false, true]) {
  expectQuery("release_purchase_access_session", [{ released: false }], values => {
    assert.deepEqual(values, [activeRow.id, productCode, restored.hash]);
  }, failure);
  await send("release", {}, restored.cookie, 503);
}
expectQuery("release_purchase_access_session", [{ released: true }], values => {
  assert.deepEqual(values, [activeRow.id, productCode, restored.hash]);
});
const released = await send("release", {}, restored.cookie);
assert.ok(released.response.headers.get("set-cookie").startsWith(cookieName + "=;"));
assert.ok(released.response.headers.get("set-cookie").includes("Max-Age=0"));
expectQuery("find_active_purchase_entitlement_by_access_session", []);
assert.equal(await service.getActive(restored.token), null, "A valid signature cannot override DB revocation");
healthy();
expectQuery("consume_entitlement_restore_token", [{ id: null, restore_outcome: "released" }]);
await send("restore", restoreFields, undefined, 409);
assert.equal(providers.length, providerCountBeforeRestore, "Restore/release must not retrieve checkout again");
expectQuery("consume_checkout_activation", [{ id: null, activation_outcome: "released" }]);
await send("activate", activation, undefined, 409);

now = restored.payload.exp * 1000;
const beforeExpiry = queries.length;
await send("restore-code", {}, restored.cookie, 401);
assert.equal(await service.getActive(restored.token), null);
assert.equal(queries.length, beforeExpiry, "Expired tokens fail before the query boundary");
for (const entry of queries) {
  for (const raw of [secret, activationNonce, restoreNonce, activated.token, restored.token,
    activated.payload.accessSessionId, restored.payload.accessSessionId, issued.body.code]) {
    assert.equal(entry.values.includes(raw), false, "Raw credentials must never reach the query port");
    assert.equal(entry.sql.includes(raw), false);
  }
}
healthy();
assert.equal(new Set(queries.map(entry => entry.operation)).size, 5);
console.log(`PASS car access integration: real route exports/HTTP/lifecycle/store/server verifier; ${queries.length} scripted query calls, ${providers.length} synthetic provider calls. Activation, cookie/hash continuity, restore, retries, denial and release failures verified. SQL/network/Stripe/browser/build not run; production runtime unchanged.`);
