import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
function load(path, resolve, extra = {}) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017,
  } }).outputText, { exports: compiledModule.exports, module: compiledModule, Date, Request, Response, URL,
    URLSearchParams, TextDecoder, Uint8Array, require: resolve, ...extra }, { filename: path });
  return compiledModule.exports;
}
const requestBody = load("../src/lib/carPurchaseProRequestBody.ts", name => { throw new Error(name); });
const http = load("../src/lib/carPurchaseProCheckoutHttp.ts", name => {
  assert.equal(name, "./carPurchaseProRequestBody"); return requestBody;
});
const origin = "https://integration.example", url = origin + "/api/checkout/car-purchase-pro";
const checkoutUrl = "https://checkout.stripe.com/c/pay/cs_test_http#synthetic";
const version = "2026-09-03", form = new URLSearchParams({ terms_accepted: "yes", terms_version: version }).toString();
const calls = [];
let serviceResult = { ok: true, checkoutUrl, privateDetail: "private provider detail" }, serviceError = false;
const service = async (...args) => {
  calls.push(args);
  if (serviceError) throw new Error("private internal detail");
  return serviceResult;
};
const handle = http.createCarPurchaseCheckoutHttp({ enabled: true, service, expectedOrigin: origin });
function request(body = form, headers = {}, method = "POST", target = url) {
  return new Request(target, { method, headers: { origin, "content-type": "application/x-www-form-urlencoded", ...headers },
    ...(!["GET", "HEAD"].includes(method) ? { body } : {}) });
}
let checks = 0;
async function responseCheck(response, status, code) {
  checks++;
  assert.equal(response.status, status);
  for (const [header, value] of [["cache-control", "no-store"], ["pragma", "no-cache"],
    ["referrer-policy", "no-referrer"], ["x-content-type-options", "nosniff"]]) assert.equal(response.headers.get(header), value);
  assert.equal(response.headers.has("set-cookie"), false);
  assert.equal(response.headers.has("location"), false);
  const body = await response.json();
  if (code) assert.equal(body.code, code);
  if (status !== 200) assert.equal("checkoutUrl" in body, false);
  assert.equal(JSON.stringify(body).includes("private"), false);
  return body;
}
const send = (req, status, code) => handle(req).then(response => responseCheck(response, status, code));
const methodResponse = await handle(request(form, {}, "GET"));
assert.equal(methodResponse.headers.get("allow"), "POST");
await responseCheck(methodResponse, 405, "method_not_allowed");
await send(request(form, { origin: "https://foreign.example", "x-hoju-compass-mutation": "device-purge" }), 403, "request_rejected");
await send(new Request(url, { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded", "sec-fetch-site": "same-origin" } }), 403);
await send(request(form, { origin: "null" }), 403);
await send(request(form, { "sec-fetch-site": "CROSS-SITE" }), 403);
await send(request(form, {}, "POST", "https://foreign.example/api/checkout/car-purchase-pro"), 403);
await send(request(form, { "content-type": "application/json" }), 415);
await send(new Request(url, { method: "POST", body: new Uint8Array(), headers: { origin } }), 415);
for (const length of ["NaN", "-1", "1.5", "9007199254740992"]) await send(request(form, { "content-length": length }), 400);
await send(request(form, { "content-length": "2049" }), 413);
for (const body of ["", "terms_accepted=yes", form + "&terms_accepted=yes", form + "&terms_version=" + version,
  form + "&price=1", form + "&customer_id=cus_browser", form + "&return_url=https://foreign.example"]) await send(request(body), 400, "invalid_fields");
for (const patch of [{ terms_accepted: "no" }, { terms_accepted: "true" }, { terms_version: "2026-02-30" },
  { terms_version: "2026-9-03" }, { terms_version: "" }]) {
  await send(request(new URLSearchParams({ terms_accepted: "yes", terms_version: version, ...patch })), 400, "checkout_invalid_terms");
}
let cancelled = false;
const oversized = new ReadableStream({
  start(controller) { controller.enqueue(new Uint8Array(2049)); }, cancel() { cancelled = true; },
});
await send(new Request(url, { method: "POST", body: oversized, duplex: "half",
  headers: { origin, "content-type": "application/x-www-form-urlencoded", "content-length": "1" } }), 413);
assert.equal(cancelled, true);
await send(request(new Uint8Array([0xc3, 0x28])), 400, "invalid_request");
const failedStream = new ReadableStream({ start(controller) { controller.error(new Error("private stream detail")); } });
await send(new Request(url, { method: "POST", body: failedStream, duplex: "half",
  headers: { origin, "content-type": "application/x-www-form-urlencoded" } }), 400, "invalid_request");
const consumed = request(); await consumed.text(); await send(consumed, 400);
assert.equal(calls.length, 0, "Invalid requests never call checkout creation");

assert.deepEqual(await send(request(), 200), { checkoutUrl });
assert.deepEqual(calls[0], [version], "Only accepted terms version reaches the trusted service");
await send(request(form + "&".repeat(2048 - form.length)), 200);
const beforeOversize = calls.length;
await send(request(form + "&".repeat(2049 - form.length)), 413);
assert.equal(calls.length, beforeOversize);
for (const [reason, status] of [["invalid_terms", 400], ["already_purchased", 409], ["retry_later", 503],
  ["sales_closed", 503], ["support_required", 503], ["provider_rejected", 503], ["unavailable", 503]]) {
  serviceResult = { ok: false, reason }; await send(request(), status, "checkout_" + reason);
}
for (const invalid of [null, { ok: false, reason: "private internal detail" }, { ok: "true", checkoutUrl },
  { ok: true, checkoutUrl: "javascript:alert(1)" }, { ok: true, checkoutUrl: "https://checkout.stripe.com.evil.example/c/pay/cs_test_http" },
  { ok: true, checkoutUrl: "https://user:pass@checkout.stripe.com/c/pay/cs_test_http" },
  { ok: true, checkoutUrl: "https://checkout.stripe.com/other" }, { ok: true, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_http\nLocation: https://foreign.example" }]) {
  serviceResult = invalid; await send(request(), 503, "checkout_unavailable");
}
serviceError = true;
await send(request(), 503, "checkout_unavailable");
serviceError = false;
const callsBeforeClosed = calls.length;
for (const patch of [{ enabled: false }, { service: null }, { expectedOrigin: "http://integration.example" }, { expectedOrigin: origin + "/path" }]) {
  const closed = http.createCarPurchaseCheckoutHttp({ enabled: true, service, expectedOrigin: origin, ...patch });
  await responseCheck(await closed(request()), 503, "checkout_unavailable");
}
assert.equal(calls.length, callsBeforeClosed);

// The mounted route uses the actual closed runtime despite permissive environment flags.
const runtime = load("../src/lib/carPurchaseProCheckoutRuntime.ts", name => {
  if (name === "server-only") return {};
  if (name === "./site") return { siteUrl: origin };
  if (name === "./carPurchaseProCheckoutHttp") return http;
  throw new Error("Runtime must not import provider/DB modules: " + name);
}, { process: { env: { NODE_ENV: "production", PAYMENTS_ENABLED: "true", CAR_PURCHASE_PRO_ENABLED: "true" } } });
const route = load("../src/app/api/checkout/car-purchase-pro/route.ts", name => {
  assert.equal(name, "@/lib/carPurchaseProCheckoutRuntime"); return runtime;
});
assert.equal(route.runtime, "nodejs");
await responseCheck(await route.POST(request()), 503, "checkout_unavailable");
assert.equal(calls.length, callsBeforeClosed);
console.log(`PASS car checkout HTTP: ${checks} response checks; strict origin/terms/body, bounded stream cancellation, safe JSON and URL, business failures, default-503 route. No provider/DB/network/browser/build.`);
