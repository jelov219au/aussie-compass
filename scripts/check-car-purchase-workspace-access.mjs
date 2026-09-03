import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
async function load(path, resolve) {
  const compiledModule = { exports: {} };
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(code, { exports: compiledModule.exports, module: compiledModule, Buffer, Date, require: resolve });
  return compiledModule.exports;
}

const tokens = await load("../src/lib/carPurchaseProTokens.ts", name => name === "node:crypto" ? crypto : require(name));
const lifecycle = await load("../src/lib/carPurchaseProAccessLifecycle.ts", name => {
  if (name === "node:crypto") return crypto;
  if (name === "./carPurchaseProTokens") return tokens;
  throw new Error("Unexpected import: " + name);
});
const guardModule = await load("../src/lib/carPurchaseProWorkspaceAccess.ts", name => { throw new Error(name); });

const secret = "synthetic-workspace-signing-secret-".repeat(3);
const at = Date.parse("2026-09-04T00:00:00Z");
const accessSessionId = "s".repeat(43);
const entitlement = { id: "101", productCode: "car_purchase_pro", status: "active" };
const token = tokens.encodeCarPurchaseProAccessToken(entitlement, accessSessionId, secret, at);
const expectedHash = tokens.hashCarPurchaseProAccessSessionId(accessSessionId);
let lookupCount = 0;
let lookupResult = entitlement;
let lookupFailure = false;
const service = lifecycle.createCarPurchaseAccessLifecycle({
  store: {
    async findActiveByAccessSession(input) {
      lookupCount++;
      assert.equal(JSON.stringify(input), JSON.stringify({ entitlementId: "101", productCode: "car_purchase_pro", accessSessionHash: expectedHash }));
      if (lookupFailure) throw new Error("private database detail");
      return lookupResult;
    },
  },
  secret,
  getVerifiedCheckout: async () => { throw new Error("Workspace access must not call the provider."); },
  now: () => at,
});
const cookieName = guardModule.carPurchaseProAccessCookieName("production");
assert.equal(cookieName, "__Host-hoju_car_purchase_pro_access");
assert.equal(guardModule.carPurchaseProAccessCookieName("development"), "hoju_car_purchase_pro_access");

let cookieValues = [{ name: cookieName, value: token }];
let cookieReads = 0;
const hasAccess = guardModule.createCarPurchaseWorkspaceAccess({
  service, enabled: true, environment: "production",
  readCookies: async () => ({ getAll(name) { cookieReads++; assert.equal(name, cookieName); return cookieValues; } }),
});
assert.equal(await hasAccess(), true);
assert.equal(cookieReads, 1);
assert.equal(lookupCount, 1);

const tamperedToken = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
const expiredToken = tokens.encodeCarPurchaseProAccessToken(
  entitlement, accessSessionId, secret, at - (tokens.carPurchaseProAccessLifetimeSeconds + 1) * 1000,
);
for (const values of [[], [{ name: cookieName, value: token }, { name: cookieName, value: token }],
  [{ name: cookieName, value: "x".repeat(4097) }], [{ name: cookieName, value: token + "x" }],
  [{ name: cookieName, value: tamperedToken }], [{ name: cookieName, value: expiredToken }]]) {
  cookieValues = values;
  const before = lookupCount;
  assert.equal(await hasAccess(), false);
  assert.equal(lookupCount, before, "invalid cookie boundaries never reach the lifecycle store");
}

cookieValues = [{ name: cookieName, value: token }];
for (const value of [null,
  { ...entitlement, id: "102" },
  { ...entitlement, status: "revoked" },
  { ...entitlement, productCode: "eofy_pro" }]) {
  lookupResult = value;
  assert.equal(await hasAccess(), false);
}
lookupFailure = true;
assert.equal(await hasAccess(), false, "store failures fail closed");

let forbiddenReads = 0;
const disabled = guardModule.createCarPurchaseWorkspaceAccess({
  service, enabled: false, environment: "production",
  readCookies: async () => { forbiddenReads++; throw new Error("must not read"); },
});
const missingService = guardModule.createCarPurchaseWorkspaceAccess({
  service: null, enabled: true, environment: "production",
  readCookies: async () => { forbiddenReads++; throw new Error("must not read"); },
});
assert.equal(await disabled(), false);
assert.equal(await missingService(), false);
assert.equal(forbiddenReads, 0);
const brokenCookieReader = guardModule.createCarPurchaseWorkspaceAccess({
  service, enabled: true, environment: "production",
  readCookies: async () => { throw new Error("private cookie detail"); },
});
assert.equal(await brokenCookieReader(), false);

console.log(`PASS car workspace access: HttpOnly cookie boundary, signed-token lifecycle and active-session store continuity verified with ${lookupCount} store lookups. Missing/duplicate/malformed/revoked/mismatched/error states fail closed; no network/DB/Stripe/browser.`);
