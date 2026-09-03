import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as tokens from "../src/lib/carPurchaseProTokens.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const compiledModule = { exports: {} };
const source = await readFile(new URL("../src/lib/carPurchaseProAccessLifecycle.ts", import.meta.url), "utf8");
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports: compiledModule.exports, module: compiledModule, Date, require: name => name === "./carPurchaseProTokens" ? tokens : require(name) });
const { createCarPurchaseAccessLifecycle: create } = compiledModule.exports;
const secret = "synthetic-lifecycle-secret-".repeat(2);
let now = Date.parse("2026-09-03T00:00:00Z");
const nonceA = "a".repeat(40), nonceB = "b".repeat(40);
const firstId = "cs_test_syntheticA", secondId = "cs_test_syntheticB";
const customerId = "cus_synthetic";
const grants = new Map([firstId, secondId].map((id, index) => [id,
  { id: String(index + 101), productCode: "car_purchase_pro", status: "active", checkoutSessionId: id, customerId }]));
const activations = new Map(), sessions = new Map(), restoreCodes = new Map();
let storeCalls = 0, verifyCalls = 0;
const bind = (grant, accessSession) => {
  assert.deepEqual(Object.keys(accessSession).sort(), ["accessSessionHash", "accessSessionRefLast8", "expiresAt"]);
  assert.match(accessSession.accessSessionHash, /^[a-f0-9]{64}$/);
  sessions.set(accessSession.accessSessionHash, { ...accessSession, grant, revoked: false });
};
const store = {
  async consumeCheckoutActivation(input) {
    storeCalls++;
    assert.equal(input.productCode, "car_purchase_pro");
    assert.match(input.nonceHash, /^[a-f0-9]{64}$/);
    const grant = grants.get(input.checkoutSessionId);
    if (!grant || grant.customerId !== input.customerId) return { outcome: "missing" };
    if (grant.status !== "active") return { outcome: grant.status };
    const previous = activations.get(input.checkoutSessionId);
    if (previous) {
      if (sessions.get(previous.hash).revoked) return { outcome: "released" };
      return previous.nonce === input.nonceHash ? { outcome: "idempotent", entitlement: grant } : { outcome: "used" };
    }
    activations.set(input.checkoutSessionId, { nonce: input.nonceHash, hash: input.accessSession.accessSessionHash });
    bind(grant, input.accessSession);
    return { outcome: "consumed", entitlement: grant };
  },
  async findActiveByAccessSession(input) {
    storeCalls++;
    const session = sessions.get(input.accessSessionHash);
    return session && !session.revoked && session.expiresAt.getTime() > now
      && session.grant.status === "active" && session.grant.id === input.entitlementId
      && session.grant.productCode === input.productCode ? session.grant : null;
  },
  async releaseAccessSession(input) {
    storeCalls++;
    const session = sessions.get(input.accessSessionHash);
    if (!session || session.grant.id !== input.entitlementId || session.grant.productCode !== input.productCode) return false;
    session.revoked = true;
    return true;
  },
  async createRestoreTokenHash(input) {
    storeCalls++;
    assert.deepEqual(Object.keys(input).sort(), ["entitlementId", "expiresAt", "productCode", "tokenHash"]);
    const grant = [...grants.values()].find(value => value.id === input.entitlementId && value.productCode === input.productCode);
    if (!grant || grant.status !== "active") throw new Error("rejected");
    restoreCodes.set(input.tokenHash, { grant, expiresAt: input.expiresAt });
  },
  async consumeRestoreTokenHash(input) {
    storeCalls++;
    const code = restoreCodes.get(input.tokenHash);
    if (!code || code.expiresAt.getTime() <= now || code.grant.productCode !== input.productCode) return { outcome: "missing" };
    if (code.grant.status !== "active") return { outcome: code.grant.status };
    if (code.nonce) {
      if (sessions.get(code.hash).revoked) return { outcome: "released" };
      return code.nonce === input.nonceHash ? { outcome: "idempotent", entitlement: code.grant } : { outcome: "used" };
    }
    code.nonce = input.nonceHash; code.hash = input.accessSession.accessSessionHash;
    bind(code.grant, input.accessSession);
    return { outcome: "consumed", entitlement: code.grant };
  },
};
const deps = { store, secret, now: () => now, getVerifiedCheckout: async id => {
  verifyCalls++; return grants.has(id) ? { id, customerId } : null;
} };
const service = create(deps);
const before = [storeCalls, verifyCalls];
assert.equal((await service.activate(firstId, "bad")).reason, "invalid");
assert.equal((await create({ ...deps, secret: null }).activate(firstId, nonceA)).reason, "unavailable");
assert.deepEqual([storeCalls, verifyCalls], before);
assert.equal((await create({ ...deps, getVerifiedCheckout: async () => null }).activate(firstId, nonceA)).reason, "denied");
assert.equal(storeCalls, 0, "unverified checkout never reaches the store");

const first = await service.activate(firstId, nonceA);
assert.equal(first.ok, true);
assert.equal((await service.activate(firstId, nonceA)).accessToken, first.accessToken, "lost-cookie retry");
assert.equal((await service.activate(firstId, nonceB)).reason, "denied", "other browser activation rejected");
const second = await service.activate(secondId, nonceA);
assert.equal(second.ok, true);
assert.notEqual(tokens.decodeCarPurchaseProAccessToken(first.accessToken, secret, now).accessSessionId,
  tokens.decodeCarPurchaseProAccessToken(second.accessToken, secret, now).accessSessionId, "same nonce across purchases remains isolated");
assert.equal((await service.getActive(first.accessToken)).id, "101");
assert.equal(await service.getActive(first.accessToken + ".tampered"), null);

const restore = await service.issueRestoreCode(first.accessToken);
assert.equal(restore.ok, true);
assert.equal(restoreCodes.has(restore.code), false, "raw restore code is never a DB key");
assert.equal(restoreCodes.has(tokens.hashCarPurchaseProRestoreCode(restore.code)), true);
const restored = await service.restore(restore.code, nonceB);
assert.equal(restored.ok, true);
assert.equal((await service.restore(restore.code, nonceB)).accessToken, restored.accessToken);
assert.equal((await service.restore(restore.code, nonceA)).reason, "denied");
assert.equal((await service.release(restored.accessToken)).clearCookie, true);
assert.equal(await service.getActive(restored.accessToken), null);
assert.equal((await service.restore(restore.code, nonceB)).reason, "denied", "released restore cannot recreate access");
assert.equal((await service.release(first.accessToken)).ok, true);
assert.equal((await service.activate(firstId, nonceA)).reason, "denied", "released activation cannot recreate access");
assert.equal((await service.issueRestoreCode(first.accessToken)).reason, "denied");

const expiring = await service.issueRestoreCode(second.accessToken);
restoreCodes.get(tokens.hashCarPurchaseProRestoreCode(expiring.code)).expiresAt = new Date(now);
assert.equal((await service.restore(expiring.code, nonceA)).reason, "denied");
for (const status of ["revoked", "review"]) {
  grants.get(secondId).status = status;
  assert.equal(await service.getActive(second.accessToken), null);
  assert.equal((await service.issueRestoreCode(second.accessToken)).reason, "denied");
}
grants.get(secondId).status = "active";
for (const patch of [{ productCode: "car_buy_pro" }, { status: "revoked" }, { id: "999" }]) {
  const hostileStore = { ...store, findActiveByAccessSession: async () => ({ ...grants.get(secondId), ...patch }) };
  assert.equal(await create({ ...deps, store: hostileStore }).getActive(second.accessToken), null);
}
for (const patch of [{ productCode: "eofy_pro" }, { customerId: "cus_other" }, { checkoutSessionId: firstId }]) {
  const hostileStore = { ...store, consumeCheckoutActivation: async () => ({ outcome: "consumed", entitlement: { ...grants.get(secondId), ...patch } }) };
  assert.equal((await create({ ...deps, store: hostileStore }).activate(secondId, nonceA)).reason, "denied");
}
const failingStore = { ...store, releaseAccessSession: async () => { throw new Error("synthetic internal error"); } };
const failedRelease = await create({ ...deps, store: failingStore }).release(second.accessToken);
assert.equal(failedRelease.reason, "unavailable");
assert.equal("clearCookie" in failedRelease, false, "failed server revocation keeps the cookie for retry");
now += (tokens.carPurchaseProAccessLifetimeSeconds + 1) * 1000;
assert.equal(await service.getActive(second.accessToken), null);
assert.equal((await service.release(undefined)).clearCookie, true);
console.log("PASS car access lifecycle with mock store: activation/retry, purchase isolation, restore/reuse, release, revocation, expiry and safe failures. No DB/Stripe/routes exercised.");
