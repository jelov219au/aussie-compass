import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import Stripe from "stripe";
const require = createRequire(import.meta.url), ts = require("typescript"), result = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(new URL("../src/lib/carPurchaseProStripeProvider.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module: result, exports: result.exports, require: name => { assert.equal(name, "server-only"); return {}; } });
const requests = [];
let status = 200, responseBody = { id: "price_fixture", object: "price", active: true }, transportError = false;
const client = new Stripe("sk_test_local_transport_fixture_only", { maxNetworkRetries: 0, telemetry: false,
  httpClient: Stripe.createFetchHttpClient(async (url, init) => {
    assert.equal(new URL(url).hostname, "api.stripe.com");
    requests.push({ url: new URL(url), method: init.method, headers: new Headers(init.headers), body: new URLSearchParams(init.body) });
    if (transportError) throw new Error("Synthetic transport failure");
    return Response.json(responseBody, { status, headers: { "request-id": "req_local_fixture" } });
  }),
});
const provider = result.exports.createCarPurchaseStripeProvider(client);
assert.equal(requests.length, 0, "Constructing the adapter must not issue requests");
assert(Object.isFrozen(provider));
let checks = 1;
assert.equal((await provider.retrievePrice("price_fixture", { expand: ["product"] })).id, "price_fixture");
assert.equal(requests.at(-1).method, "GET");
assert.equal(requests.at(-1).url.pathname, "/v1/prices/price_fixture");
assert.equal(requests.at(-1).url.searchParams.get("expand[0]"), "product"); checks++;
responseBody = { id: "cs_test_fixture", object: "checkout.session", status: "open" };
const params = { mode: "payment", line_items: [{ price: "price_fixture", quantity: 1 }],
  managed_payments: { enabled: true }, customer_creation: "always",
  integration_identifier: "hoju_compass_car_purchase_pro_abcdefgh",
  metadata: { product_code: "car_purchase_pro", billing_model: "one_time", purchase_terms_version: "2026-09-03" },
  success_url: "https://fixture.example/car-purchase-pro/success?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://fixture.example/car-purchase-pro?checkout=cancelled", expires_at: 1900000000 };
const before = JSON.stringify(params);
assert.equal((await provider.createSession(params, { idempotencyKey: "car_purchase_pro_first_sale_fixture" })).id, "cs_test_fixture");
const sent = requests.at(-1);
assert.equal(sent.method, "POST"); assert.equal(sent.url.pathname, "/v1/checkout/sessions");
assert.equal(sent.headers.get("idempotency-key"), "car_purchase_pro_first_sale_fixture");
for (const [name, value] of [["managed_payments[enabled]", "true"], ["line_items[0][price]", "price_fixture"],
  ["line_items[0][quantity]", "1"], ["metadata[product_code]", "car_purchase_pro"],
  ["metadata[purchase_terms_version]", "2026-09-03"], ["success_url", params.success_url],
  ["cancel_url", params.cancel_url], ["integration_identifier", params.integration_identifier], ["expires_at", "1900000000"]]) assert.equal(sent.body.get(name), value);
assert.equal(sent.body.has("payment_method_types[0]"), false); assert.equal(JSON.stringify(params), before); checks++;
responseBody = { id: "cs_test_fixture", line_items: { data: [], has_more: false } };
const receipt = await provider.retrieveSession("cs_test_fixture", { expand: ["line_items"] });
assert.equal(receipt.line_items.has_more, false); assert.equal(requests.at(-1).url.searchParams.get("expand[0]"), "line_items");
assert.equal(requests.at(-1).url.pathname, "/v1/checkout/sessions/cs_test_fixture"); checks++;
// Later replacement of resource methods cannot redirect the already assembled adapter.
client.prices.retrieve = () => assert.fail("Replaced method used");
await provider.retrievePrice("price_fixture", { expand: ["product"] }); checks++;
for (const [code, type] of [[400, "invalid_request_error"], [500, "api_error"]]) {
  status = code; responseBody = { error: { type, message: "Synthetic SDK error" } };
  const count = requests.length;
  await assert.rejects(provider.createSession(params, { idempotencyKey: "unchanged-fixture-key" }), error => {
    assert(error instanceof Stripe.errors.StripeError); assert.equal(error.statusCode, code);
    assert.equal(error.requestId, "req_local_fixture"); return true;
  });
  assert.equal(requests.length, count + 1, "Adapter must not add retries"); checks++;
}
transportError = true;
await assert.rejects(provider.retrieveSession("cs_test_fixture", { expand: ["line_items"] }), error => error instanceof Stripe.errors.StripeConnectionError); checks++;
console.log(JSON.stringify({ status: "PASS", checks, sdk: Stripe.PACKAGE_VERSION,
  scope: "Actual installed Stripe SDK with an injected in-memory fetch transport. Exact serialization/errors verified; network, DB, live keys and runtime wiring NOT_RUN." }));
