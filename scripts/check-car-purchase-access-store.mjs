import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
const compiledModule = { exports: {} };
const source = await readFile(new URL("../src/lib/carPurchaseProAccessStore.ts", import.meta.url), "utf8");
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports: compiledModule.exports, module: compiledModule, Date, require: name => { assert.equal(name, "server-only"); return {}; } });
const { createCarPurchaseAccessStore: create } = compiledModule.exports;
const now = Date.parse("2026-09-03T00:00:00Z");
const expiresAt = new Date(now + 60000);
const productCode = "car_purchase_pro", checkoutSessionId = "cs_test_synthetic", customerId = "cus_synthetic";
const accessSession = { accessSessionHash: "a".repeat(64), accessSessionRefLast8: "aBcD_123", expiresAt };
const activation = { productCode, checkoutSessionId, customerId, nonceHash: "b".repeat(64), accessSession };
const restore = { productCode, tokenHash: "c".repeat(64), nonceHash: "d".repeat(64), accessSession };
const lookup = { entitlementId: "101", productCode, accessSessionHash: accessSession.accessSessionHash };
const active = { id: "101", product_code: productCode, status: "active", stripe_checkout_session_id: checkoutSessionId, stripe_customer_id: customerId };
let result = [], calls = [];
const store = create(async (sql, values) => { calls.push({ sql, values: [...values] }); return result; }, () => now);
result = [{ ...active, activation_outcome: "consumed" }];
assert.equal((await store.consumeCheckoutActivation(activation)).entitlement.id, "101");
assert.deepEqual(calls.at(-1).values, [checkoutSessionId, productCode, customerId, activation.nonceHash, accessSession.accessSessionHash, accessSession.accessSessionRefLast8, expiresAt.toISOString()]);
assert.ok(calls.at(-1).sql.startsWith("select * from public.consume_checkout_activation("));
assert.equal(calls.at(-1).sql.includes(checkoutSessionId), false, "values are bound, never inserted into SQL text");
result = [{ ...active, restore_outcome: "idempotent" }];
assert.equal((await store.consumeRestoreTokenHash(restore)).entitlement.productCode, productCode);
assert.deepEqual(calls.at(-1).values, [restore.tokenHash, productCode, restore.nonceHash, accessSession.accessSessionHash, accessSession.accessSessionRefLast8, expiresAt.toISOString()]);
assert.ok(calls.at(-1).sql.includes("public.consume_entitlement_restore_token("));
for (const method of ["consumeCheckoutActivation", "consumeRestoreTokenHash"]) {
  const input = method === "consumeCheckoutActivation" ? activation : restore;
  const field = method === "consumeCheckoutActivation" ? "activation_outcome" : "restore_outcome";
  for (const outcome of ["used", "released", "revoked", "review", "missing"]) {
    result = [{ id: null, [field]: outcome }];
    assert.equal((await store[method](input)).outcome, outcome);
    result = [{ ...active, [field]: outcome }];
    await assert.rejects(store[method](input), /Denied/);
  }
  for (const bad of [[], null, [{}], [{ ...active, [field]: "unexpected" }], [{ ...active, [field]: "consumed", product_code: "car_buy_pro" }], [{ ...active, [field]: "consumed", status: "review" }]]) {
    result = bad;
    await assert.rejects(store[method](input));
  }
}
for (const patch of [{ stripe_checkout_session_id: "cs_test_other" }, { stripe_customer_id: "cus_other" }]) {
  result = [{ ...active, ...patch, activation_outcome: "consumed" }];
  await assert.rejects(store.consumeCheckoutActivation(activation), /identity/);
}
result = [active];
assert.equal((await store.findActiveByAccessSession(lookup)).id, "101");
assert.deepEqual(calls.at(-1).values, ["101", productCode, accessSession.accessSessionHash]);
assert.ok(calls.at(-1).sql.includes("public.find_active_purchase_entitlement_by_access_session($1::bigint"));
result = [];
assert.equal(await store.findActiveByAccessSession(lookup), null);
for (const bad of [[active, active], [{ ...active, id: "102" }], [{ ...active, id: Number.MAX_SAFE_INTEGER + 1 }], [{ ...active, product_code: "eofy_pro" }], [{ ...active, status: "revoked" }]]) {
  result = bad; await assert.rejects(store.findActiveByAccessSession(lookup));
}
result = [{ ...active, id: 101n }];
assert.equal((await store.findActiveByAccessSession(lookup)).id, "101");
for (const released of [true, false]) {
  result = [{ released }]; assert.equal(await store.releaseAccessSession(lookup), released);
}
assert.ok(calls.at(-1).sql.includes("public.release_purchase_access_session("));
result = [{ released: "true" }]; await assert.rejects(store.releaseAccessSession(lookup));
const issue = { entitlementId: "101", productCode, tokenHash: restore.tokenHash, expiresAt };
result = [{ created: true }]; await store.createRestoreTokenHash(issue);
assert.deepEqual(calls.at(-1).values, ["101", productCode, restore.tokenHash, expiresAt.toISOString()]);
assert.ok(calls.at(-1).sql.includes("public.create_entitlement_restore_token("));
for (const created of [false, null, "true"]) { result = [{ created }]; await assert.rejects(store.createRestoreTokenHash(issue)); }

const before = calls.length;
assert.equal((await store.consumeCheckoutActivation({ ...activation, checkoutSessionId: "cs_test_x'; DROP TABLE x;--" })).outcome, "missing");
assert.equal((await store.consumeRestoreTokenHash({ ...restore, tokenHash: "raw-restore-code" })).outcome, "missing");
assert.equal((await store.consumeCheckoutActivation({ ...activation, accessSession: { ...accessSession, expiresAt: new Date(now) } })).outcome, "missing");
for (const badId of ["0", "-1", "01", "9223372036854775808", "1;select 1"]) assert.equal(await store.findActiveByAccessSession({ ...lookup, entitlementId: badId }), null);
assert.equal(await store.releaseAccessSession({ ...lookup, productCode: "car_buy_pro" }), false);
await assert.rejects(store.createRestoreTokenHash({ ...issue, expiresAt: new Date(NaN) }));
assert.equal(calls.length, before, "invalid values rejected before query execution");
const offline = create(async () => { throw new Error("synthetic unavailable database"); }, () => now);
await assert.rejects(offline.releaseAccessSession(lookup));
console.log("PASS car access store: five parameterized function bindings, strict rows/outcomes, product/customer/ID isolation and invalid-input rejection. Mock query port only; SQL not run.");
