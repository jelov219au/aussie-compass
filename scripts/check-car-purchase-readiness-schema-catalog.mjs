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
  { module: compiledModule, exports: compiledModule.exports, require: id => {
    if (id === "server-only") return {}; if (id.startsWith("./")) return load(id.slice(2));
    if (id === "node:crypto") return require(id); throw Error("Unexpected import");
  } });
  cache.set(name, compiledModule.exports); return compiledModule.exports;
}
const { createCarSchemaCatalogCollector: create, carSchemaCatalogSql: sql } = load("carPurchaseProReadinessSchemaCatalog");
const copy = v => JSON.parse(JSON.stringify(v));
const fn = { name: "synthetic_guard", signature: "public.synthetic_guard()", kind: "f", definition_sha256: "a".repeat(64),
  owner: "test_owner", security_definer: true, settings: ["search_path=public, pg_temp"], runtime_execute: false,
  grants: [{ grantor: "test_owner", grantee: "test_owner", privilege: "EXECUTE", grantable: false }] };
const constraint = { table: "synthetic_holds", name: "synthetic_pk", definition_sha256: "b".repeat(64),
  validated: true, enforced: true, internal_count: 4, internal_healthy: true, index_healthy: true };
const trigger = { table: "synthetic_holds", name: "synthetic_receipt_guard", definition_sha256: "c".repeat(64),
  enabled: "O", function_signature: fn.signature };
const snapshot = { database_name: "test_db", inspection_role: "test_inspector", server_version: 180006,
  read_only: "on", isolation: "repeatable read", search_path: "pg_catalog, pg_temp", replication_role: "origin",
  functions: [fn], constraints: [constraint, { ...constraint, name: "synthetic_check", internal_count: 0 }],
  triggers: [trigger, { ...trigger, name: "synthetic_other_guard", enabled: "A" }],
  tables: [{ name: "synthetic_holds", ordinary: true, internal_healthy: true }] };
const plan = { databaseName: "test_db", inspectionRole: "test_inspector", runtimeRole: "test_app",
  expectedSignatures: [{ name: fn.name, signature: fn.signature }],
  expectedConstraints: snapshot.constraints.map(({ table, name }) => ({ table, name })),
  expectedTriggers: snapshot.triggers.map(({ table, name }) => ({ table, name })) };
let checks = 0, calls = 0;
async function check({ mutate = () => {}, configure = () => {}, expected = false, noQuery = false, output } = {}) {
  const options = copy(plan); configure(options); const before = calls;
  const result = await create({ ...options, query: async request => {
    calls++; assert.equal(request.sql, sql); assert.deepEqual(copy(request.values), ["test_app", ["synthetic_guard"], ["synthetic_holds"]]);
    assert.equal(request.options.readOnly, true); assert.equal(request.options.isolation, "repeatable read");
    for (const item of [request, request.values, request.values[1], request.values[2], request.options]) assert.equal(Object.isFrozen(item), true);
    const row = copy(snapshot); mutate(row); return output ? output(row) : [row];
  } })();
  assert.equal(result.ok, expected);
  if (result.ok) { assert.equal(result.readiness, false); assert.equal(result.functions.length, 1);
    assert.equal(result.constraints.length, 2); assert.equal(result.triggers.length, 2); }
  assert.equal(calls - before, noQuery ? 0 : 1); checks++; return result;
}
await check({ expected: true });
await check({ expected: true, mutate: r => { r.constraints.reverse(); r.triggers.reverse(); } });
for (const key of Object.keys(snapshot)) await check({ mutate: r => { delete r[key]; } });
for (const section of ["constraints", "triggers", "tables"]) {
  await check({ mutate: r => r[section].pop() });
  await check({ mutate: r => r[section].push(copy(r[section][0])) });
  await check({ mutate: r => r[section][0].extra = true });
  await check({ mutate: r => r[section] = null });
  for (const key of Object.keys(snapshot[section][0])) await check({ mutate: r => { delete r[section][0][key]; } });
}
await check({ mutate: r => r.constraints[1] = copy(r.constraints[0]) });
await check({ mutate: r => r.triggers[1] = copy(r.triggers[0]) });
for (const key of ["validated", "enforced", "internal_healthy", "index_healthy"]) await check({ mutate: r => r.constraints[0][key] = false });
for (const value of [-1, 129, 1.5, "4", null]) await check({ mutate: r => r.constraints[0].internal_count = value });
await check({ mutate: r => r.constraints[0].definition_sha256 = "UNKNOWN" });
await check({ mutate: r => r.triggers[0].definition_sha256 = "UNKNOWN" });
await check({ mutate: r => r.constraints[0].table = "other_table" });
await check({ mutate: r => r.triggers[0].name = "unexpected_trigger" });
for (const value of ["D", "R", true]) await check({ mutate: r => r.triggers[0].enabled = value });
for (const value of ["public.unpinned_guard()", "pg_catalog.unexpected()", null]) await check({ mutate: r => r.triggers[0].function_signature = value });
for (const value of ["replica", "local", true]) await check({ mutate: r => r.replication_role = value });
await check({ mutate: r => r.tables[0].ordinary = false });
await check({ mutate: r => r.tables[0].internal_healthy = false });
await check({ mutate: r => r.tables[0].name = "unreviewed_table" });
await check({ mutate: r => r.read_only = "off" });
await check({ mutate: r => r.functions[0].definition_sha256 = "UNKNOWN" });
await check({ mutate: r => r.extra = true });
for (const key of ["expectedConstraints", "expectedTriggers", "expectedSignatures"]) {
  for (const value of [null, {}, [], [{ unexpected: true }]]) await check({ configure: p => p[key] = value, noQuery: true });
}
await check({ configure: p => p.expectedConstraints.push(copy(p.expectedConstraints[0])), noQuery: true });
await check({ configure: p => p.expectedTriggers[0].table = "x;drop", noQuery: true });
await check({ configure: p => p.expectedConstraints[0].extra = true, noQuery: true });
await check({ configure: p => p.expectedConstraints = Array.from({ length: 65 }, (_, i) => ({ table: `table_${i}`, name: "check_one" })), noQuery: true });
for (const raw of [null, {}, [], [snapshot, snapshot], [null]]) await check({ output: () => raw });
const failed = await check({ output: () => { throw Error("private SQL or connection details"); } });
assert.equal(JSON.stringify(failed).includes("private"), false); checks++;
// Delayed interleaving verifies that each function+schema pair stays together.
const pending = [];
const collector = create({ ...plan, query: () => new Promise(resolve => pending.push(resolve)) });
const first = collector(), second = collector();
const changed = copy(snapshot); changed.functions[0].definition_sha256 = "d".repeat(64); changed.constraints[0].definition_sha256 = "e".repeat(64);
pending[1]([changed]); pending[0]([snapshot]);
const one = await first, two = await second;
assert.equal(one.ok && two.ok, true);
assert.equal(one.functions[0].definitionSha256, "a".repeat(64));
assert.equal(two.functions[0].definitionSha256, "d".repeat(64));
assert.equal(one.constraints.find(c => c.name === constraint.name).definitionSha256, "b".repeat(64));
assert.equal(two.constraints.find(c => c.name === constraint.name).definitionSha256, "e".repeat(64)); checks += 2;
const mutable = copy(plan); let resolve;
const detached = create({ ...mutable, query: () => new Promise(done => { resolve = done; }) });
mutable.expectedConstraints[0].name = "changed"; mutable.expectedSignatures[0].signature = "changed";
const action = detached(); resolve([snapshot]); assert.equal((await action).ok, true); checks++;
assert.equal((await create({ ...plan, query: null })()).ok, false); checks++;
console.log(JSON.stringify({ status: "PASS", checks, mockSingleStatementCalls: calls, interleavedCalls: 2,
  realSqlCalls: 0, sqlParsed: false, actualConstraintOrTriggerHashesVerified: false, readiness: false }));
