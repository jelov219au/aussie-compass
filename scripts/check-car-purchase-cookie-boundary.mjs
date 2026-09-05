import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
const { NextRequest } = require("next/server");
const modules = new Map();
function load(file, resolve) {
  const result = { exports: {} };
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText, { module: result, exports: result.exports, Date, Request, Response,
    URL, URLSearchParams, TextDecoder, Uint8Array, require: resolve }, { filename: file });
  return result.exports;
}
for (const name of ["carPurchaseProRequestBody", "carPurchaseProWorkspaceAccess", "carPurchaseProCheckoutHttp"]) {
  modules.set("./" + name, load(`src/lib/${name}.ts`, name => {
    assert(modules.has(name), `Unexpected dependency ${name}`); return modules.get(name);
  }));
}
const { createCarPurchaseCheckoutHttp } = modules.get("./carPurchaseProCheckoutHttp");
const origin = "https://cookie-boundary.example", version = "2026-09-03";
const token = "a".repeat(48) + "." + "b".repeat(43); // Syntax fixture, not a signed access grant.
const form = new URLSearchParams({ terms_accepted: "yes", terms_version: version }).toString();
let calls = 0, checks = 0;
const routeFor = (environment, enabled = true) => {
  const handleCarPurchaseCheckout = createCarPurchaseCheckoutHttp({ environment, enabled, expectedOrigin: origin,
    service: async value => { calls++; assert.equal(value, version); return { ok: true, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_boundary" }; } });
  return load("src/app/api/checkout/car-purchase-pro/route.ts", name => {
    assert.equal(name, "@/lib/carPurchaseProCheckoutRuntime"); return { handleCarPurchaseCheckout };
  });
};
const request = (cookie, patch = {}) => new NextRequest(origin + "/api/checkout/car-purchase-pro", {
  method: "POST", body: form, headers: { origin, "content-type": "application/x-www-form-urlencoded", ...(cookie === null ? {} : { cookie }), ...patch },
});
for (const environment of ["production", "development"]) {
  const name = modules.get("./carPurchaseProWorkspaceAccess").carPurchaseProAccessCookieName(environment);
  const route = routeFor(environment);
  const duplicate = request(`${name}=${token}; ${name}=${token}`);
  assert.equal(duplicate.cookies.getAll(name).length, 1, "Real NextRequest collapses duplicates");
  for (const raw of [
    `${name}=${token}; ${name}=${token}`,
    `${name}=${token}; ${name}=bad`,
    `${name}=bad; ${name}=${token}`,
    `${name}=${token}; ${name}=%ZZ`,
    `${name}=%ZZ`, `${name}`, `${name}=`,
    `other=1;\t${name}=${token}`, `${name} =${token}`,
  ]) {
    const before = calls, response = await route.POST(request(raw));
    assert.equal(response.status, 503, `${environment}: ${raw}`);
    assert.equal((await response.json()).code, "checkout_support_required");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.has("set-cookie"), false);
    assert.equal(calls, before, "Ambiguous raw access cookie must not reach checkout service"); checks++;
  }
  for (const raw of [null, `${name}=${token}`, `${name}=${token.replace(".", "%2E")}`,
    `unrelated=first; unrelated=second; ${name}=${token}`, `${name}_other=first; ${name}_other=second`]) {
    const before = calls, response = await route.POST(request(raw));
    assert.equal(response.status, 200); assert.equal(calls, before + 1); checks++;
  }
  const before = calls;
  assert.equal((await route.POST(request(`${name}=${token}; ${name}=${token}`, { origin: "https://other.example" }))).status, 403);
  assert.equal(calls, before); checks++;
  const closed = await routeFor(environment, false).POST(request(`${name}=${token}; ${name}=${token}`));
  assert.equal((await closed.json()).code, "checkout_unavailable"); assert.equal(calls, before); checks++;
}
console.log(JSON.stringify({ status: "PASS", checks, scope: "Actual POST/HTTP code with real NextRequest cookie parser; checkout service is a spy. No Stripe or DB calls." }));
