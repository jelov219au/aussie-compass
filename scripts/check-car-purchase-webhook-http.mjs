import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), Stripe = require("stripe"), compiledModule = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(new URL("../src/lib/carPurchaseProWebhookHttp.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
{ module: compiledModule, exports: compiledModule.exports, Response, Headers, TextDecoder, Uint8Array,
  require: name => { if (name === "server-only") return {}; throw Error("Unexpected import " + name); } });
const { createCarPurchaseWebhookHttp: create } = compiledModule.exports;
const raw = ' { "message": "중고차 🚗", "order": [2, 1] }\n';
const now = Date.parse("2026-09-04T00:00:00Z"), secret = "whsec_synthetic_http_only";
const signature = Stripe.webhooks.generateTestHeaderString({ payload: raw, secret, timestamp: now / 1000 });
let checks = 0, calls = [], delegated = [], verify = false, throws = false;
let result = { ok: true, handled: true, outcome: "processed", alert: "sent" };
const handle = async (payload, sig) => { calls.push([payload, sig]);
  if (verify) Stripe.webhooks.signature.verifyHeader(payload, sig, secret, 300, undefined, now);
  if (throws) throw Error("private provider or sender failure"); return result; };
const post = create({ handle });
function request(body = raw, headers = {}, options = {}) {
  return new Request("https://example.invalid/api/stripe/webhook", { method: "POST", body,
    headers: { "content-type": "application/json; charset=utf-8", "stripe-signature": signature, ...headers }, duplex: "half", ...options });
}
async function expect(req, status, target = post, beforeHandler = false) {
  const before = calls.length, res = await target(req); assert.equal(res.status, status);
  assert.equal(res.headers.get("cache-control"), "no-store");
  if (status === 503) assert.equal(res.headers.get("retry-after"), "60");
  assert.equal((await res.text()).includes("private"), false);
  if (beforeHandler) assert.equal(calls.length, before); checks++; return res;
}
verify = true; await expect(request(), 200); assert.equal(calls.at(-1)[0], raw); assert.equal(calls.at(-1)[1], signature); verify = false;
// Byte-exact decoding across split multibyte sequences, whitespace, and BOM.
for (const payload of [raw, "\uFEFF{}\n"]) {
  const bytes = new TextEncoder().encode(payload);
  const stream = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  await expect(request(stream, { "content-length": String(bytes.length) }), 200); assert.equal(calls.at(-1)[0], payload);
}
for (const [outcome, alert] of [["duplicate", "already_sent"], ["tombstoned", "sent"], ["processed", "not_requested"], ["ignored_stale", "not_requested"]]) {
  result = { ok: true, handled: true, outcome, alert }; await expect(request(), 200);
}
for (const reason of ["invalid_signature", "invalid_event", "wrong_environment", "contract_mismatch"]) {
  result = { ok: false, reason }; await expect(request(), 400);
}
for (const value of [{ ok: false, reason: "unavailable" }, { ok: false, reason: "persistence_failed" },
  { ok: false, reason: "alert_busy", persisted: true }, { ok: false, reason: "alert_delivery_failed", persisted: true },
  null, {}, { ok: true, handled: true }, { ok: true, handled: true, outcome: "ignored_stale", alert: "sent" },
  { ok: true, handled: true, outcome: "processed", alert: "sent", extra: true },
  { ok: true, handled: true, outcome: "processed", alert: "busy" }, { ok: "true", handled: true }]) {
  result = value; await expect(request(), 503);
}
throws = true; await expect(request(), 503); throws = false;
await expect(request(), 503, create({ handle: null }), true);
const method = await expect(request(undefined, {}, { method: "GET", body: undefined }), 405, post, true); assert.equal(method.headers.get("allow"), "POST");
for (const headers of [{ "stripe-signature": "" }, { "stripe-signature": "x".repeat(4097) }]) await expect(request(raw, headers), 400, post, true);
for (const headers of [{ "content-type": "text/plain" }, { "content-encoding": "gzip" }]) await expect(request(raw, headers), 415, post, true);
for (const length of ["bad", "-1", "1.5", "9007199254740992", "1", "0"]) await expect(request(raw, { "content-length": length }), 400, post, true);
await expect(request(raw, { "content-length": "1048577" }), 413, post, true);
await expect(request("x".repeat(1048577)), 413, post, true);
result = { ok: true, handled: true, outcome: "processed", alert: "sent" };
await expect(request("x".repeat(1048576)), 200); assert.equal(calls.at(-1)[0].length, 1048576);
await expect(request(Uint8Array.of(0xff, 0xfe)), 400, post, true);
await expect(request(""), 400, post, true);
await expect(request(null), 400, post, true);
const used = request(); await used.text(); await expect(used, 400, post, true);
const locked = request(), reader = locked.body.getReader(); await expect(locked, 400, post, true); reader.releaseLock();
await expect(request(new ReadableStream({ start(controller) { controller.error(Error("private body")); } })), 400, post, true);
const delegate = create({ handle, continueOtherProducts: async (payload, sig) => {
  delegated.push([payload, sig]); return Response.json({ existingProduct: true }, { status: 202, headers: { "X-Existing": "kept" } });
} });
result = { ok: true, handled: false }; await expect(request(), 503); // Never ACK absent fallback.
const other = await expect(request(), 202, delegate); assert.equal(other.headers.get("x-existing"), "kept");
assert.deepEqual(delegated[0], [raw, signature]);
result = { ok: false, reason: "invalid_signature" }; await expect(request(), 400, delegate); assert.equal(delegated.length, 1);
result = { ok: true, handled: false }; await expect(request(), 503, create({ handle, continueOtherProducts: async () => { throw Error("private fallback"); } }));
await expect(request(), 503, create({ handle, continueOtherProducts: async () => ({ status: 200 }) }));
console.log(JSON.stringify({ status: "PASS", httpChecks: checks, handlerCalls: calls.length, delegateCalls: delegated.length,
  rawBodySignatureVerified: true, actualNetworkCalls: 0, actualMessagesSent: 0, mountedRoute: false }));
