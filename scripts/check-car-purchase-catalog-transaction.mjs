import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), cache = new Map(), timers = new Set();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const compiled = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiled, exports: compiled.exports, Buffer, AbortController,
    setTimeout: (fn, ms) => { assert.equal(ms, 10000); const timer = { fn }; timers.add(timer); return timer; },
    clearTimeout: timer => timers.delete(timer),
    require: id => { if (id === "server-only") return {}; if (id.startsWith("./")) return load(id.slice(2));
      if (id === "node:crypto") return require(id); throw Error("Unexpected import"); } });
  cache.set(name, compiled.exports); return compiled.exports;
}
const { createCarCatalogTransaction: create } = load("carPurchaseProCatalogTransaction");
const { carPrivilegeCatalogSql: sql } = load("carPurchaseProReadinessPrivilegeCatalog");
const copy = v => JSON.parse(JSON.stringify(v)), never = () => new Promise(() => {});
const input = () => ({ sql, values: ["test_role", ["test_function"], ["test_table"]],
  options: { readOnly: true, isolation: "repeatable read", searchPath: "pg_catalog, pg_temp", statementTimeoutMs: 5000, lockTimeoutMs: 1000 },
  challenge: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
const sequence = ["BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY", "SET LOCAL statement_timeout = '5000ms'",
  "SET LOCAL lock_timeout = '1000ms'", "SET LOCAL idle_in_transaction_session_timeout = '5000ms'",
  "SET LOCAL search_path = pg_catalog, pg_temp", sql, "ROLLBACK"];
let checks = 0, opened = 0, executed = 0, destroyed = 0;
function fixture() {
  const f = { calls: [], closes: 0, opens: 0, signals: [], rows: [{ synthetic: true }], binding: { synthetic: "independent registry" },
    failure: -1, stall: -1, late: -1, closeFailure: false, quarantines: 0, now: 100000 };
  f.connection = { binding: f.binding, execute: async (query, values, signal) => {
    const index = f.calls.length; f.calls.push({ query, values }); f.signals.push(signal); executed++;
    if (index === f.failure) throw Error("SECRET driver detail");
    if (index === f.late) return new Promise(resolve => { f.resume = resolve; [...timers].at(-1).fn(); });
    if (index === f.stall) { [...timers].at(-1).fn(); return never(); }
    return query === sql ? f.rows : undefined;
  }, quarantine: () => { f.quarantines++; destroyed++; },
  close: async () => { assert.equal(f.quarantines, 1); f.closes++; if (f.closeFailure) throw Error("SECRET cleanup detail"); } };
  f.open = async signal => { f.opens++; opened++; f.signal = signal; return f.connection; };
  f.run = request => create({ open: f.open, now: () => f.now })(request ?? input());
  return f;
}
async function rejects(run) { await assert.rejects(run, { message: "Catalog transaction unavailable." }); checks++; assert.equal(timers.size, 0); }
const normal = fixture(), output = await normal.run();
assert.deepEqual(normal.calls.map(c => c.query), sequence); checks++;
assert.deepEqual(copy(normal.calls[5].values), input().values); checks++;
assert(normal.calls.filter(c => c.query !== sql).every(c => c.values.length === 0)); checks++;
assert.equal(normal.closes, 1); assert.equal(normal.opens, 1); assert.equal(timers.size, 0); checks++;
assert(normal.signals.every(s => s === normal.signal && !s.aborted)); checks++;
normal.rows[0].synthetic = false; normal.binding.synthetic = "changed";
assert.deepEqual(copy(output), { binding: { synthetic: "independent registry" }, rows: [{ synthetic: true }], challenge: input().challenge, observedAt: 100000 }); checks++;

for (const mutate of [r => r.sql += "; DELETE FROM public.test_table", r => r.extra = true, r => r.challenge = "not-uuid",
  r => r.values = [], r => r.values[0] = "role; sql", r => r.values[1] = [], r => r.values[1] = ["a", "a"],
  r => r.values[1] = Array.from({ length: 257 }, (_, i) => `f_${i}`), r => r.values[2] = ["bad.table"],
  r => r.values[2] = Array.from({ length: 65 }, (_, i) => `t_${i}`), r => r.options.readOnly = false,
  r => r.options.isolation = "read committed", r => r.options.searchPath = "public", r => r.options.statementTimeoutMs = 0,
  r => r.options.lockTimeoutMs = 9999, r => r.options.extra = true]) {
  const f = fixture(), request = input(); mutate(request); await rejects(() => f.run(request)); assert.equal(f.opens, 0);
}
await rejects(() => create({ open: null })(input()));
await rejects(() => create({ open: async () => { throw Error("SECRET connection detail"); } })(input()));
for (let index = 0; index < sequence.length; index++) {
  const f = fixture(); f.failure = index; await rejects(() => f.run());
  assert.equal(f.closes, 1); checks++;
  const expected = sequence.slice(0, index + 1);
  if (index > 0 && index < sequence.length - 1) expected.push("ROLLBACK");
  assert.deepEqual(f.calls.map(c => c.query), expected); checks++;
}
for (let index = 0; index < sequence.length; index++) {
  const f = fixture(); f.stall = index; await rejects(() => f.run());
  assert.equal(f.closes, 1); assert(f.signal.aborted); checks++;
  assert.deepEqual(f.calls.map(c => c.query), sequence.slice(0, index + 1)); checks++;
}
const cleanup = fixture(); cleanup.closeFailure = true; await rejects(() => cleanup.run());
for (const configure of [f => f.now = NaN, f => f.now = -1, f => f.rows = [{ oversized: "x".repeat(2_000_001) }],
  f => f.connection.binding = { oversized: "x".repeat(8193) }, f => f.connection.binding = undefined,
  f => f.rows = { toJSON: () => { throw Error("SECRET serialization"); } }]) {
  const f = fixture(); configure(f); await rejects(() => f.run()); assert.equal(f.closes, 1); checks++;
}
// Acquisition can finish after the caller timed out: dispose that lease without SQL.
const late = fixture(); let resolveOpen;
late.open = signal => { late.signal = signal; return new Promise(resolve => { resolveOpen = resolve; }); };
const lateResult = late.run(); [...timers][0].fn(); await rejects(() => lateResult);
resolveOpen(late.connection); await new Promise(resolve => setImmediate(resolve));
assert.equal(late.closes, 1); assert.equal(late.calls.length, 0); assert(late.signal.aborted); checks++;

const lateRows = fixture(); lateRows.late = 5; await rejects(() => lateRows.run());
lateRows.resume(lateRows.rows); await new Promise(resolve => setImmediate(resolve));
assert.equal(lateRows.closes, 1); assert.deepEqual(lateRows.calls.map(c => c.query), sequence.slice(0, 6)); checks++;

// Mutation during connection acquisition cannot change the approved bound values.
const mutable = fixture(), request = input(); let resume;
mutable.open = () => new Promise(resolve => { resume = resolve; });
const pending = mutable.run(request); request.values[0] = "other"; request.values[1].push("other"); request.challenge = "changed";
resume(mutable.connection); const snapshotResult = await pending;
assert.deepEqual(copy(mutable.calls[5].values), input().values); assert.equal(snapshotResult.challenge, input().challenge); checks++;

// One stalled lease never cancels or disposes another request's connection.
const first = fixture(), second = fixture(); let releaseFirst;
first.open = signal => { first.signal = signal; return new Promise(resolve => { releaseFirst = resolve; }); };
const one = first.run(), firstTimer = [...timers][0], two = second.run();
await two; firstTimer.fn(); await rejects(() => one); releaseFirst(first.connection);
await new Promise(resolve => setImmediate(resolve));
assert.equal(first.closes, 1); assert.equal(second.closes, 1); assert(!second.signal.aborted); checks++;
// Driver shutdown acknowledgement is now asynchronous: rows cannot escape early.
const closing = fixture(); let finishClose, completed = false;
closing.connection.close = () => { closing.closes++; return new Promise(resolve => { finishClose = resolve; }); };
const closingResult = closing.run().then(result => { completed = true; return result; });
await new Promise(setImmediate);
assert.equal(completed, false); assert.equal(closing.quarantines, 1); assert.equal(closing.closes, 1); checks++;
finishClose(); await closingResult; assert.equal(completed, true); checks++;
// An unconfirmed close consumes the remaining deadline, then fails closed.
const stuckClose = fixture(); let lateClose;
stuckClose.connection.close = () => { stuckClose.closes++; return new Promise(resolve => { lateClose = resolve; }); };
const stuckResult = stuckClose.run(); await new Promise(setImmediate);
[...timers][0].fn(); await rejects(() => stuckResult);
assert.equal(stuckClose.quarantines, 1); assert.equal(stuckClose.closes, 1); checks++;
lateClose(); await new Promise(setImmediate); assert.equal(stuckClose.closes, 1); checks++;
// Even a broken quarantine hook must not skip the close attempt.
const badQuarantine = fixture();
badQuarantine.connection.quarantine = () => { badQuarantine.quarantines++; throw Error("SECRET quarantine detail"); };
await rejects(() => badQuarantine.run()); assert.equal(badQuarantine.closes, 1); checks++;
assert.equal(timers.size, 0);
console.log(JSON.stringify({ status: "PASS", checks, mockOpens: opened, mockStatements: executed, mockQuarantines: destroyed,
  timing: "deterministic simulated deadline; no real waits", realSqlCalls: 0, productionConnected: false }));
