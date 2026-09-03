import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as tokens from "../src/lib/carPurchaseProTokens.ts";
const require = createRequire(import.meta.url);
const ts = require("typescript");
async function load(path, resolve, extra = {}) {
  const compiledModule = { exports: {} };
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { exports: compiledModule.exports, module: compiledModule, Response, Request, URL,
    URLSearchParams, TextDecoder, Uint8Array, Date, require: resolve, ...extra });
  return compiledModule.exports;
}
const requestBody = await load("../src/lib/carPurchaseProRequestBody.ts", name => { throw new Error(name); });
const http = await load("../src/lib/carPurchaseProAccessHttp.ts", name => {
  if (name === "./carPurchaseProTokens") return tokens;
  if (name === "./carPurchaseProRequestBody") return requestBody;
  throw new Error("Unexpected import: " + name);
});
const workspaceAccess = await load("../src/lib/carPurchaseProWorkspaceAccess.ts", name => { throw new Error(name); });
const origin = "https://hojucompass.com";
const cookieName = "__Host-hoju_car_purchase_pro_access";
const accessToken = tokens.encodeCarPurchaseProAccessToken({ id: "101", productCode: "car_purchase_pro", status: "active" }, "s".repeat(43), "synthetic-http-key-".repeat(3));
const calls = [];
let releaseOk = true, throwActivation = false;
const service = {
  async activate(...args) { calls.push(["activate", ...args]); if (throwActivation) throw new Error("internal detail"); return { ok: true, accessToken }; },
  async restore(...args) { calls.push(["restore", ...args]); return { ok: true, accessToken }; },
  async issueRestoreCode(token) { calls.push(["restore-code", token]); return token ? { ok: true, code: "r".repeat(43), expiresAt: new Date("2026-10-03T00:00:00Z") } : { ok: false, reason: "denied" }; },
  async release(token) { calls.push(["release", token]); return releaseOk ? { ok: true, clearCookie: true } : { ok: false, reason: "unavailable" }; },
};
const handle = http.createCarPurchaseAccessHttp({ service, enabled: true, expectedOrigin: origin, environment: "production" });
function request(body = "", headers = {}, method = "POST") {
  return new Request(origin + "/api/car-purchase-pro/access/activate", { method,
    headers: { origin, "content-type": "application/x-www-form-urlencoded", ...headers }, ...(method === "POST" ? { body } : {}) });
}
const form = new URLSearchParams({ session_id: "cs_test_synthetic", activation_nonce: "n".repeat(40) }).toString();
async function expectStatus(operation, req, status) {
  const response = await handle(operation, req);
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "no-store");
  if (status !== 200) assert.equal(response.headers.has("set-cookie"), false);
  return response;
}
await expectStatus("activate", request(form, { origin: "https://other.example", "x-hoju-compass-mutation": "device-purge" }), 403);
await expectStatus("activate", request(form, { origin: "null" }), 403);
await expectStatus("activate", new Request(origin + "/api/car-purchase-pro/access/activate", { method: "POST", body: form }), 403);
await expectStatus("activate", request(form, { "sec-fetch-site": "cross-site" }), 403);
await expectStatus("activate", request("", {}, "GET"), 405);
await expectStatus("activate", request("{}", { "content-type": "application/json" }), 415);
await expectStatus("activate", request(form, { "content-length": "9999" }), 413);
await expectStatus("activate", request(form, { "content-length": "NaN" }), 400);
await expectStatus("activate", request(form + "&session_id=cs_test_other"), 400);
await expectStatus("activate", request(form + "&product_code=eofy_pro"), 400);
await expectStatus("activate", request("session_id=cs_test_synthetic"), 400);
await expectStatus("release", request("", { cookie: cookieName + "=one; " + cookieName + "=two" }), 400);
let cancelled = false;
const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(2049)); }, cancel() { cancelled = true; } });
await expectStatus("activate", new Request(origin + "/api/car-purchase-pro/access/activate", { method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded" }, body: stream, duplex: "half" }), 413);
assert.equal(cancelled, true);
assert.equal(calls.length, 0, "rejected requests never call the lifecycle");

const activated = await expectStatus("activate", request(form), 200);
const activationBody = await activated.text();
assert.equal(activationBody.includes(accessToken), false);
assert.equal(JSON.parse(activationBody).destination, "/car-purchase-pro/workspace");
const setCookie = activated.headers.get("set-cookie");
for (const part of [cookieName + "=", "HttpOnly", "Secure", "SameSite=Strict", "Path=/", "Max-Age=2592000"]) assert.ok(setCookie.includes(part));
assert.equal(setCookie.includes("Domain="), false);
const restored = await expectStatus("restore", request(new URLSearchParams({ restore_code: "r".repeat(43), restore_nonce: "n".repeat(40) }).toString()), 200);
assert.ok(restored.headers.has("set-cookie"));
await expectStatus("restore-code", request(), 401);
const issued = await expectStatus("restore-code", request("", { cookie: cookieName + "=" + accessToken }), 200);
assert.equal((await issued.json()).code, "r".repeat(43));
releaseOk = false;
await expectStatus("release", request("", { cookie: cookieName + "=" + accessToken }), 503);
releaseOk = true;
const released = await expectStatus("release", request("", { cookie: cookieName + "=" + accessToken }), 200);
assert.ok(released.headers.get("set-cookie").includes("Max-Age=0"));
throwActivation = true;
const failure = await expectStatus("activate", request(form), 503);
assert.equal((await failure.text()).includes("internal detail"), false);

const runtime = await load("../src/lib/carPurchaseProRuntime.ts", name => {
  if (name === "server-only") return {};
  if (name === "next/headers") return { cookies: async () => { throw new Error("Closed runtime must not read cookies."); } };
  if (name === "./site") return { siteUrl: origin };
  if (name === "./carPurchaseProAccessHttp") return http;
  if (name === "./carPurchaseProWorkspaceAccess") return workspaceAccess;
  throw new Error("Unexpected import: " + name);
}, { process: { env: { NODE_ENV: "production", PAYMENTS_ENABLED: "true", CAR_PURCHASE_PRO_ENABLED: "true" } } });
assert.equal(await runtime.hasCarPurchaseWorkspaceAccess(), false, "mounted workspace runtime remains closed even with environment flags");
for (const [path, operation] of [["access/activate", "activate"], ["access/release", "release"], ["restore", "restore"], ["restore-code", "restore-code"]]) {
  const route = await load(`../src/app/api/car-purchase-pro/${path}/route.ts`, name => {
    assert.equal(name, "@/lib/carPurchaseProRuntime");
    return { handleCarPurchaseAccess: (actual, req) => { assert.equal(actual, operation); return runtime.handleCarPurchaseAccess(actual, req); } };
  });
  const response = await route.POST(request(form));
  assert.equal(response.status, 503, "mounted runtime remains closed even with environment flags");
  assert.equal(response.headers.has("set-cookie"), false);
}
console.log("PASS car access HTTP: origin/body/field/cookie guards, bounded stream cancellation, secure delivery, restore/release failures, four closed route exports. No network/DB/Stripe/browser.");
