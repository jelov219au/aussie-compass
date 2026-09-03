import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), compiledModule = { exports: {} };
runInNewContext(ts.transpileModule(readFileSync(new URL("../src/lib/carPurchaseProReadinessFunctionCatalog.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
{ module: compiledModule, exports: compiledModule.exports, require: name => {
  if (name === "server-only") return {}; if (name === "node:crypto") return require(name); throw Error("Unexpected import");
} });
const { createCarFunctionCatalogCollector: create, hashCarFunctionExecuteAcl: aclHash,
  carFunctionCatalogSql: sql } = compiledModule.exports;
const copy = value => JSON.parse(JSON.stringify(value));
const grants = [
  { grantor: "test_owner", grantee: "test_owner", privilege: "EXECUTE", grantable: false },
  { grantor: "test_owner", grantee: "test_app", privilege: "EXECUTE", grantable: false },
];
const plan = { databaseName: "synthetic_db", inspectionRole: "test_inspector", runtimeRole: "test_app",
  expectedSignatures: [{ name: "synthetic_function", signature: "public.synthetic_function(text)" },
    { name: "synthetic_function", signature: "public.synthetic_function(text, text)" }] };
const descriptor = { name: "synthetic_function", kind: "f", signature: plan.expectedSignatures[0].signature,
  definition_sha256: "a".repeat(64), owner: "test_owner", security_definer: true,
  settings: ["search_path=public, pg_temp"], runtime_execute: true, grants };
const snapshot = { database_name: "synthetic_db", inspection_role: "test_inspector", server_version: 180006,
  read_only: "on", isolation: "repeatable read", search_path: "pg_catalog, pg_temp",
  functions: [descriptor, { ...copy(descriptor), signature: plan.expectedSignatures[1].signature }] };
let checks = 0, queryCalls = 0;
const vector = '{"version":"car-function-execute-acl-v1","grants":[["test_owner","test_app","EXECUTE",false],["test_owner","test_owner","EXECUTE",false]]}';
assert.equal(aclHash(grants), createHash("sha256").update(vector).digest("hex")); checks++;
assert.equal(aclHash(grants), aclHash([...grants].reverse())); checks++;
assert.notEqual(aclHash(grants), aclHash([{ ...grants[0], grantable: true }, grants[1]])); checks++;
assert.notEqual(aclHash(grants), aclHash([{ ...grants[0], grantee: null }, grants[1]])); checks++;
assert.notEqual(aclHash([]), aclHash(grants)); checks++;
for (const invalid of [null, {}, [grants[0], grants[0]], [grants[0], { ...grants[0], grantable: true }],
  [{ ...grants[0], privilege: "SELECT" }], [{ ...grants[0], grantable: "false" }],
  [{ ...grants[0], grantor: "unknown role" }], [{ ...grants[0], grantee: 0 }],
  [{ ...grants[0], extra: true }], Array.from({ length: 129 }, (_, i) => ({ ...grants[0], grantee: `role_${i}` }))]) {
  assert.equal(aclHash(invalid), null); checks++;
}
async function check({ mutate = () => {}, configure = () => {}, expected = false, noQuery = false, output } = {}) {
  const options = copy(plan); configure(options); const before = queryCalls;
  const collector = create({ ...options, query: async request => {
    queryCalls++;
    assert.equal(request.sql, sql); assert.deepEqual(copy(request.values), ["test_app", ["synthetic_function"]]);
    assert.deepEqual(copy(request.options), { readOnly: true, isolation: "repeatable read", searchPath: "pg_catalog, pg_temp",
      statementTimeoutMs: 5000, lockTimeoutMs: 1000 });
    for (const v of [request, request.values, request.values[1], request.options]) assert.equal(Object.isFrozen(v), true);
    const row = copy(snapshot); mutate(row); return output ? output(row) : [row];
  } });
  const result = await collector(); assert.equal(result.ok, expected);
  if (result.ok) { assert.equal(result.readiness, false); assert.equal(result.functions.length, 2);
    assert.equal(Object.hasOwn(result, "accessFunctions"), false); assert.equal(JSON.stringify(result).includes("definition_text"), false); }
  if (noQuery) assert.equal(queryCalls, before); checks++; return result;
}
const success = await check({ expected: true });
assert.equal(success.functions.find(f => f.signature === descriptor.signature).executeAclSha256, aclHash(grants)); checks++;
assert.equal(success.functions.every(f => f.publicExecute === false), true); checks++;
await check({ expected: true, mutate: r => r.functions.reverse() });
// Unsafe-but-valid observations remain observations; readiness evaluator must reject them.
const unsafe = await check({ expected: true, mutate: r => { r.functions[0].grants.push({ ...grants[0], grantee: null });
  r.functions[0].runtime_execute = false; r.functions[0].settings = []; } });
assert.equal(unsafe.functions.some(f => f.publicExecute && !f.runtimeExecute), true); checks++;
await check({ expected: true, mutate: r => r.functions[0].grants = [] });
for (const field of Object.keys(snapshot)) await check({ mutate: r => { delete r[field]; } });
for (const field of Object.keys(descriptor)) await check({ mutate: r => { delete r.functions[0][field]; } });
for (const [field, value] of Object.entries({ database_name: "other_db", inspection_role: "other_inspector",
  read_only: "off", isolation: "read committed", search_path: "public", server_version: "180006" })) await check({ mutate: r => r[field] = value });
for (const server_version of [139999, 190000, 180000.5, null]) await check({ mutate: r => r.server_version = server_version });
await check({ expected: true, mutate: r => r.server_version = 140000 });
await check({ expected: true, mutate: r => r.server_version = 189999 });
for (const [field, value] of Object.entries({ kind: "a", name: "other_function", signature: "public.synthetic_function(integer)",
  definition_sha256: "UNKNOWN", owner: "", security_definer: "true", runtime_execute: null, settings: ["x", "x"], grants: null })) {
  await check({ mutate: r => r.functions[0][field] = value });
}
await check({ mutate: r => r.functions[0].extra = true });
await check({ mutate: r => r.extra = true });
await check({ mutate: r => r.functions.pop() });
await check({ mutate: r => r.functions.push(copy(r.functions[0])) });
await check({ mutate: r => r.functions[1] = copy(r.functions[0]) });
await check({ mutate: r => r.functions = null });
await check({ mutate: r => r.functions[0].grants.push(copy(grants[0])) });
await check({ mutate: r => r.functions[0].settings = Array.from({ length: 17 }, (_, i) => `setting=${i}`) });
await check({ mutate: r => r.functions[0].settings = ["x\n"] });
for (const [key, value] of Object.entries({ databaseName: "", inspectionRole: "x; drop schema public", runtimeRole: "bad role",
  expectedSignatures: [] })) await check({ configure: c => c[key] = value, noQuery: true });
for (const signatures of [null, {}, [plan.expectedSignatures[0], plan.expectedSignatures[0]],
  [{ name: "synthetic_function", signature: "other.synthetic_function(text)" }],
  [{ ...plan.expectedSignatures[0], extra: true }],
  [{ name: "bad;sql", signature: "public.bad;sql()" }]]) await check({ configure: c => c.expectedSignatures = signatures, noQuery: true });
for (const result of [null, {}, [], [snapshot, snapshot], [null]]) await check({ output: () => result });
const failure = await check({ output: () => { throw Error("private connection credentials"); } });
assert.equal(JSON.stringify(failure).includes("private"), false); checks++;
// Snapshot the plan once, detach returned descriptors from mutable driver rows.
let release;
const mutable = copy(plan), source = copy(snapshot);
const collector = create({ ...mutable, query: () => new Promise(resolve => { release = resolve; }) });
const pending = collector(); mutable.expectedSignatures[0].signature = "changed";
release([source]); const first = await pending;
assert.equal(first.ok, true); source.functions[0].settings.push("changed");
assert.equal(first.functions.some(f => f.settings.includes("changed")), false); checks += 2;
assert.equal((await create({ ...plan, query: null })()).ok, false); checks++;
console.log(JSON.stringify({ status: "PASS", checks, mockTransactionCalls: queryCalls, actualSqlCalls: 0,
  sqlParsed: false, actualDefinitionHashesVerified: false, readiness: false, productionConnected: false }));
