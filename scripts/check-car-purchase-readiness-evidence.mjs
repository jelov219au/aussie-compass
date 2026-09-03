import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const compiledModule = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiledModule, exports: compiledModule.exports, URL,
    require: id => id === "server-only" ? {} : id.startsWith("./") ? load(id.slice(2)) : require(id) });
  cache.set(name, compiledModule.exports); return compiledModule.exports;
}
const { createCarPurchaseReadinessEvidence: create, carReadinessFunctionNames: names,
  carReadinessConstraintTables: tables, carReadinessCheckIds: ids } = load("carPurchaseProReadinessEvidence");
const time = Date.parse("2026-09-04T00:00:00Z"), sha = "a".repeat(64), changedSha = "b".repeat(64);
const clone = value => JSON.parse(JSON.stringify(value));
// All hashes, object identities, offer and approval below are SYNTHETIC.
const approved = {
  version: "car-readiness-evidence-v1", approvalId: "CAR-PURCHASE-LAUNCH", candidateCommit: "a".repeat(40),
  approvedAt: time - 1000, expiresAt: time + 120_000,
  environment: { databaseIdentity: "synthetic-isolated-database", runtimeRole: "test_app", ownerRole: "test_owner",
    mode: "test", deployment: "nonproduction", origin: "https://example.invalid" },
  offer: { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
    stripePriceId: "price_Synthetic", stripeProductId: "prod_Synthetic", termsVersion: "2026-09-04" },
  inventory: {
    functions: names.map(name => ({ name, signature: `public.${name}(text)`, definitionSha256: sha,
      owner: "test_owner", securityDefiner: true, settings: ["search_path=public, pg_temp"],
      executeAclSha256: sha, runtimeExecute: false, publicExecute: false })),
    constraints: tables.map(table => ({ table, name: "synthetic_constraint", definitionSha256: sha, validated: true })),
    triggers: ["payment_webhook_events", "entitlement_event_tombstones", "first_sale_gate_events", "car_purchase_exception_receipts"]
      .map(table => ({ table, name: "synthetic_trigger", definitionSha256: sha, enabled: "O" })),
    runtimePrivileges: { role: "test_app", superuser: false, bypassRls: false, tableWrites: false,
      roleAttributesSha256: sha, membershipsSha256: sha, schemaPrivilegesSha256: sha, tablePrivilegesSha256: sha },
    checks: ids.map(id => ({ id, passed: true, evidenceSha256: sha })),
  },
};
let checks = 0, calls = 0;
const envelope = (request, model = approved) => ({ version: model.version, challenge: request.challenge,
  candidateCommit: model.candidateCommit, observedAt: time, readOnly: true, environment: clone(model.environment),
  offer: clone(model.offer), inventory: clone(model.inventory) });
const wrap = value => [{ evidence_json: JSON.stringify(value) }];
async function check({ mutate = () => {}, changeManifest = () => {}, expected = false, queryResult,
  clock, noQuery = false, manifestJson, model = clone(approved) } = {}) {
  changeManifest(model); const before = calls;
  const reader = create({ approvedManifestJson: manifestJson === undefined ? JSON.stringify(model) : manifestJson,
    now: clock ?? (() => time), query: async request => { calls++;
      assert.equal(Object.isFrozen(request), true); assert.deepEqual(Object.keys(request).sort(), ["candidateCommit", "challenge", "version"]);
      const evidence = envelope(request, model); mutate(evidence); return queryResult ? queryResult(evidence) : wrap(evidence);
    } });
  const result = await reader(); assert.equal(result.ok, expected);
  if (result.ok) { assert.equal(result.salesAuthorized, false); assert.equal(result.candidateCommit, model.candidateCommit);
    assert.equal(Object.hasOwn(result, "accessFunctions"), false); }
  if (noQuery) assert.equal(calls, before); checks++; return result;
}
await check({ expected: true });
// Required roots are a floor: reviewed dependency functions must also be pinned.
await check({ expected: true, changeManifest: m => m.inventory.functions.push({ ...m.inventory.functions[0],
  name: "synthetic_receipt_guard", signature: "public.synthetic_receipt_guard()" }) });
// Row order is immaterial; the approved set and every descriptor are exact.
await check({ expected: true, mutate: e => { for (const key of ["functions", "constraints", "triggers", "checks"]) e.inventory[key].reverse(); } });
for (const section of ["functions", "constraints", "triggers", "checks"]) {
  await check({ mutate: e => e.inventory[section].pop() });
  await check({ mutate: e => e.inventory[section].push(clone(e.inventory[section][0])) });
  await check({ mutate: e => e.inventory[section][0].extra = true });
  await check({ changeManifest: m => m.inventory[section] = [], noQuery: true });
  await check({ changeManifest: m => m.inventory[section].push(clone(m.inventory[section][0])), noQuery: true });
}
for (const key of Object.keys(approved)) await check({ changeManifest: m => { delete m[key]; }, noQuery: true });
for (const key of Object.keys(envelope({ challenge: "placeholder" }))) await check({ mutate: e => { delete e[key]; } });
for (const value of [null, {}, "", "{}", "null", "{broken", "x".repeat(262145)]) await check({ manifestJson: value, noQuery: true });
for (const value of [null, {}, [], [{ evidence_json: "{}" }], [{ evidence_json: "null" }], [{ evidence_json: "{" }]]) {
  await check({ queryResult: () => value });
}
await check({ queryResult: e => [...wrap(e), ...wrap(e)] });
await check({ queryResult: e => [{ ...wrap(e)[0], extra: true }] });
await check({ queryResult: e => [{ evidence_json: e }] });
await check({ queryResult: () => { throw Error("private connection details"); } });
await check({ mutate: e => e.extra = true });
await check({ changeManifest: m => m.extra = true, noQuery: true });
await check({ mutate: e => e.readOnly = "true" });
await check({ mutate: e => e.challenge = "previous-request" });
await check({ mutate: e => e.observedAt = time - 1 });
await check({ mutate: e => e.observedAt = time + 1 });
await check({ mutate: e => e.candidateCommit = "b".repeat(40) });
await check({ changeManifest: m => m.candidateCommit = "UNKNOWN", noQuery: true });
await check({ changeManifest: m => m.approvalId = "self-approved", noQuery: true });
await check({ changeManifest: m => m.approvedAt = time + 1, noQuery: true });
await check({ changeManifest: m => m.expiresAt = time, noQuery: true });
await check({ changeManifest: m => m.expiresAt = m.approvedAt, noQuery: true });
await check({ clock: () => Number.NaN, noQuery: true });
for (const end of [time - 1, time + 60_001, time + 120_000, Number.NaN]) {
  let n = 0; await check({ clock: () => n++ ? end : time });
}
for (const [key, value] of Object.entries({ databaseIdentity: "other-db", runtimeRole: "other_role", ownerRole: "other_owner",
  mode: "live", deployment: "production", origin: "https://other.invalid" })) await check({ mutate: e => e.environment[key] = value });
for (const [key, value] of Object.entries({ mode: "unknown", deployment: "production", origin: "http://example.invalid",
  runtimeRole: "test_owner", ownerRole: "", databaseIdentity: "" })) await check({ changeManifest: m => m.environment[key] = value, noQuery: true });
for (const [key, value] of Object.entries({ priceCents: 0, termsVersion: "2026-02-30", stripePriceId: "UNKNOWN", productCode: "car_buy_pro" })) {
  await check({ changeManifest: m => m.offer[key] = value, noQuery: true });
}
await check({ mutate: e => e.offer.priceCents++ });
await check({ mutate: e => e.offer.extra = "unknown" });
for (const [key, value] of Object.entries({ signature: "public.apply_entitlement_event(text,text)", definitionSha256: changedSha,
  owner: "another_owner", securityDefiner: false, executeAclSha256: changedSha, publicExecute: true,
  runtimeExecute: true, settings: ["search_path=$user,public"] })) await check({ mutate: e => e.inventory.functions[0][key] = value });
await check({ mutate: e => e.inventory.functions.push({ ...e.inventory.functions[0], signature: "public.apply_entitlement_event(text,text)" }) });
await check({ changeManifest: m => m.inventory.functions[0].publicExecute = true, noQuery: true });
await check({ changeManifest: m => m.inventory.functions[0].runtimeExecute = true, noQuery: true });
await check({ changeManifest: m => m.inventory.functions[0].definitionSha256 = "UNKNOWN", noQuery: true });
for (const settings of [[], ["search_path=$user,public"], ["search_path=pg_temp,public"],
  ["search_path=public, pg_temp", "search_path=pg_catalog,public,pg_temp"]]) {
  await check({ changeManifest: m => m.inventory.functions[0].settings = settings, noQuery: true });
}
for (const key of ["superuser", "bypassRls", "tableWrites"]) {
  await check({ mutate: e => e.inventory.runtimePrivileges[key] = true });
  await check({ changeManifest: m => m.inventory.runtimePrivileges[key] = true, noQuery: true });
}
for (const key of ["roleAttributesSha256", "membershipsSha256", "schemaPrivilegesSha256", "tablePrivilegesSha256"]) {
  await check({ mutate: e => e.inventory.runtimePrivileges[key] = changedSha });
}
await check({ mutate: e => e.inventory.constraints[0].validated = false });
await check({ mutate: e => e.inventory.constraints[0].definitionSha256 = changedSha });
await check({ mutate: e => e.inventory.triggers[0].enabled = "D" });
await check({ mutate: e => e.inventory.triggers[0].definitionSha256 = changedSha });
for (const id of ids) {
  await check({ mutate: e => e.inventory.checks.find(c => c.id === id).passed = false });
  await check({ mutate: e => e.inventory.checks.find(c => c.id === id).evidenceSha256 = changedSha });
}
// Concurrent reads must use different challenges; cross-request evidence fails.
const pending = [];
const reader = create({ approvedManifestJson: JSON.stringify(approved), now: () => time,
  query: request => new Promise(resolve => pending.push({ request, resolve })) });
const first = reader(), second = reader();
assert.notEqual(pending[0].request.challenge, pending[1].request.challenge);
pending[0].resolve(wrap(envelope(pending[1].request))); pending[1].resolve(wrap(envelope(pending[1].request)));
assert.equal((await first).ok, false); assert.equal((await second).ok, true); checks += 2;
// No cache: each read needs fresh evidence; snapshot deps before asynchronous work.
const deps = { approvedManifestJson: JSON.stringify(approved), now: () => time, query: async r => wrap(envelope(r)) };
const stable = create(deps); deps.approvedManifestJson = "{}"; deps.query = null;
assert.equal((await stable()).ok, true); checks++;
assert.equal((await create({ approvedManifestJson: JSON.stringify(approved), query: null, now: () => time })()).ok, false); checks++;
console.log(JSON.stringify({ status: "PASS", checks, mockQueryCalls: calls, interleavedQueries: 2,
  mandatoryFunctions: names.length, constraintTables: tables.length, requiredEvidenceChecks: ids.length,
  actualQueries: 0, actualMessages: 0, productionConnected: false, approvedManifestExists: false }));
