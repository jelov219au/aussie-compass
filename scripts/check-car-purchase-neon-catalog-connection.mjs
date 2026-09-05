import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url), ts = require("typescript"), neon = require("@neondatabase/serverless");
const timers = new Set(), clients = [], plans = [], cache = new Map();
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const tick = () => new Promise(setImmediate);
async function until(predicate) { for (let i = 0; i < 50 && !predicate(); i++) await tick(); assert(predicate(), "Expected progress"); }
let driverMode = "mock", checks = 0;
class MockClient extends EventEmitter {
  constructor(config) {
    super(); this.plan = plans.shift() ?? {}; if (this.plan.constructError) throw Error("PRIVATE DSN");
    this.config = config; this.neonConfig = {}; this.calls = []; this.ends = 0; clients.push(this);
  }
  connect() { if (this.plan.connectError) return Promise.reject(Error("PRIVATE connect")); return this.plan.connect?.promise ?? Promise.resolve(); }
  query(sql, values) {
    this.calls.push({ sql, values });
    if (this.plan.queryError) return Promise.reject(Error("PRIVATE query"));
    if (this.plan.query) return this.plan.query.promise;
    return Promise.resolve({ rows: sql.startsWith("WITH") ? [{ synthetic: true }] : [] });
  }
  end() {
    this.ends++;
    if (this.plan.endErrorEvent) this.emit("error", Error("PRIVATE end event"));
    if (this.plan.endError) return Promise.reject(Error("PRIVATE end"));
    if (this.plan.end) return this.plan.end.promise;
    this.emit("end"); return Promise.resolve();
  }
}
// Real installed Client is selected later; only its documented WebSocket
// constructor is replaced. No socket, local server or remote DB is used.
class SelectedClient {
  constructor(config) {
    if (driverMode === "mock") return new MockClient(config);
    const client = new neon.Client(config);
    client.neonConfig.webSocketConstructor = WireSocket;
    client.neonConfig.pipelineConnect = false;
    client.neonConfig.coalesceWrites = false;
    clients.push(client); return client;
  }
}
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const compiled = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiled, exports: compiled.exports, Buffer, URL, AbortController,
    setTimeout: (fn, ms) => { assert([5000, 10000].includes(ms)); const timer = { fn, ms }; timers.add(timer); return timer; },
    clearTimeout: timer => timers.delete(timer), require: id => {
      if (id === "server-only") return {};
      if (id === "@neondatabase/serverless") return { Client: SelectedClient };
      if (id === "node:crypto") return require(id);
      if (id.startsWith("./")) return load(id.slice(2));
      throw Error("Unexpected dependency");
    } });
  cache.set(name, compiled.exports); return compiled.exports;
}
const { createCarNeonCatalogOpener: opener, createCarNeonCatalogQuery: queryFactory } = load("carPurchaseProNeonCatalogConnection");
const { carPrivilegeCatalogSql: sql } = load("carPurchaseProReadinessPrivilegeCatalog");
const connectionString = "postgresql://fixture_user:fixture_password@fixture.invalid/fixture_db?sslmode=require";
const deps = () => ({ connectionString, binding: { databaseName: "fixture_db", inspectionRole: "fixture_user", synthetic: true } });
const request = () => ({ sql, values: ["test_role", ["test_function"], ["test_table"]], challenge: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  options: { readOnly: true, isolation: "repeatable read", searchPath: "pg_catalog, pg_temp", statementTimeoutMs: 5000, lockTimeoutMs: 1000 } });
async function unavailable(promise, message = "Catalog connection unavailable.") { await assert.rejects(promise, { message }); checks++; }
const normal = queryFactory({ ...deps(), now: () => 100000 });
const result = await normal(request()), client = clients.at(-1);
assert.equal(result.observedAt, 100000); assert.equal(client.calls.length, 7); assert.equal(client.calls[0].sql, "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
assert.equal(client.calls[5].sql, sql); assert.equal(client.calls[6].sql, "ROLLBACK"); assert.equal(client.ends, 1); checks++;
assert.equal(client.config.connectionTimeoutMillis, 5000); assert.equal(client.config.query_timeout, 5000);
assert.equal(client.config.options, "-c default_transaction_read_only=on"); assert.equal(client.neonConfig.useSecureWebSocket, true); checks++;
await normal(request()); assert.notEqual(clients.at(-1), client); assert.equal(clients.at(-1).ends, 1); checks++;
const beforeInvalid = clients.length;
for (const change of [{ connectionString: null }, { connectionString: "" }, { connectionString: connectionString + "&options=unsafe" },
  { connectionString: connectionString.replace("require", "disable") }, { connectionString: connectionString.replace("fixture_password", "") },
  { binding: null }, { binding: { databaseName: "other", inspectionRole: "fixture_user" } }]) {
  await unavailable(opener({ ...deps(), ...change })(new AbortController().signal));
}
const preAborted = new AbortController(); preAborted.abort(); await unavailable(opener(deps())(preAborted.signal));
assert.equal(clients.length, beforeInvalid); checks++;
const mutable = deps(), openSnapshot = opener(mutable); mutable.connectionString = "changed"; mutable.binding.databaseName = "changed";
const snapshotLease = await openSnapshot(new AbortController().signal); assert.equal(snapshotLease.binding.databaseName, "fixture_db"); await snapshotLease.close(); checks++;
plans.push({ constructError: true }); await unavailable(opener(deps())(new AbortController().signal));
plans.push({ connectError: true }); await unavailable(opener(deps())(new AbortController().signal)); await tick(); assert.equal(clients.at(-1).ends, 1); checks++;
// Acquisition deadline: initiate shutdown, then close again after late connect.
const lateConnect = deferred(); plans.push({ connect: lateConnect });
const lateOpen = opener(deps())(new AbortController().signal); await tick();
[...timers].find(t => t.ms === 5000).fn(); await unavailable(lateOpen); const lateClient = clients.at(-1);
assert.equal(lateClient.ends, 1); lateConnect.resolve(); await until(() => lateClient.ends === 2); assert.equal(lateClient.calls.length, 0); checks++;
// One failed query permanently quarantines the lease.
plans.push({ queryError: true }); const failedSignal = new AbortController().signal, failed = await opener(deps())(failedSignal);
await unavailable(failed.execute("SELECT 1", [], failedSignal)); await unavailable(failed.execute("SELECT 2", [], failedSignal));
await failed.close(); assert.equal(clients.at(-1).calls.length, 1); assert.equal(clients.at(-1).ends, 1); checks++;
// Abort pending query; later rows cannot escape and no further SQL is accepted.
const delayed = deferred(); plans.push({ query: delayed }); const abort = new AbortController(), lateLease = await opener(deps())(abort.signal);
const lateResult = lateLease.execute("SELECT 1", [], abort.signal); abort.abort(); await unavailable(lateResult);
delayed.resolve({ rows: [{ private: "late" }] }); await tick(); await unavailable(lateLease.execute("SELECT 2", [], abort.signal));
await lateLease.close(); assert.equal(clients.at(-1).calls.length, 1); checks++;
// Idle errors and unsolicited disconnects also make the lease unusable.
for (const event of ["error", "end"]) {
  const signal = new AbortController().signal, lease = await opener(deps())(signal); clients.at(-1).emit(event, Error("PRIVATE idle"));
  await unavailable(lease.execute("SELECT 1", [], signal)); await unavailable(lease.close()); assert.equal(clients.at(-1).calls.length, 0); checks++;
}
const concurrentQuery = deferred(); plans.push({ query: concurrentQuery });
const concurrentSignal = new AbortController().signal, exclusive = await opener(deps())(concurrentSignal);
const first = exclusive.execute("SELECT 1", [], concurrentSignal), second = exclusive.execute("SELECT 2", [], concurrentSignal);
await unavailable(second); await unavailable(first); concurrentQuery.resolve({ rows: [] }); await exclusive.close(); checks++;
plans.push({ endError: true }); await unavailable(queryFactory(deps())(request()), "Catalog transaction unavailable.");
plans.push({ endErrorEvent: true }); await unavailable(normal(request()), "Catalog transaction unavailable."); assert.equal(clients.at(-1).ends, 1); checks++;
const pendingEnd = deferred(); plans.push({ end: pendingEnd });
const stalled = normal(request()); await until(() => clients.at(-1).ends === 1);
[...timers].find(t => t.ms === 10000).fn(); await unavailable(stalled, "Catalog transaction unavailable.");
pendingEnd.resolve(); await tick(); assert.equal(clients.at(-1).ends, 1); checks++;
assert.equal(timers.size, 0);

// Tiny PostgreSQL protocol peer over an in-memory public WebSocket interface.
// It synthesizes authentication/query frames; it never interprets SQL or proves
// PostgreSQL semantics. It exercises the installed driver's real public methods.
const sockets = [], wirePlans = [];
const i16 = n => { const b = Buffer.alloc(2); b.writeInt16BE(n); return b; };
const i32 = n => { const b = Buffer.alloc(4); b.writeInt32BE(n); return b; };
const cstr = s => Buffer.from(s + "\0");
const frame = (type, payload = Buffer.alloc(0)) => Buffer.concat([Buffer.from(type), i32(payload.length + 4), payload]);
const ready = () => frame("Z", Buffer.from("I"));
const fields = () => frame("T", Buffer.concat([i16(1), cstr("fixture"), i32(0), i16(0), i32(114), i16(-1), i32(-1), i16(0)]));
const jsonRow = () => { const bytes = Buffer.from('{"synthetic":true}'); return frame("D", Buffer.concat([i16(1), i32(bytes.length), bytes])); };
class WireSocket {
  constructor(url) {
    this.url = url; this.readyState = 0; this.listeners = new Map(); this.buffer = Buffer.alloc(0); this.startup = false;
    this.sql = []; this.bound = []; this.closeCalls = 0; this.plan = wirePlans.shift() ?? {}; sockets.push(this);
    queueMicrotask(() => { this.readyState = 1; this.emit("open", {}); });
  }
  addEventListener(type, listener) { const list = this.listeners.get(type) ?? []; list.push(listener); this.listeners.set(type, list); }
  emit(type, event) { for (const listener of this.listeners.get(type) ?? []) listener.call(this, event); }
  response(...buffers) { queueMicrotask(() => this.emit("message", { data: Buffer.concat(buffers) })); }
  close() { this.closeCalls++; this.terminationRequested = true; if (!this.plan.holdClose) this.finishClose(); }
  finishClose() { this.readyState = 3; queueMicrotask(() => this.emit("close", {})); }
  send(data) {
    this.buffer = Buffer.concat([this.buffer, Buffer.from(data)]);
    if (!this.startup) {
      if (this.buffer.length < 4 || this.buffer.length < this.buffer.readInt32BE(0)) return;
      const length = this.buffer.readInt32BE(0); this.startupParameters = this.buffer.subarray(8, length).toString();
      this.buffer = this.buffer.subarray(length); this.startup = true;
      this.response(frame("R", i32(0)), frame("K", Buffer.concat([i32(1), i32(2)])), ready());
    }
    while (this.buffer.length >= 5) {
      const size = this.buffer.readInt32BE(1) + 1; if (this.buffer.length < size) break;
      const type = String.fromCharCode(this.buffer[0]), payload = this.buffer.subarray(5, size);
      this.buffer = this.buffer.subarray(size);
      if (type === "Q") {
        const query = payload.toString().slice(0, -1); this.sql.push(query);
        this.response(frame("C", cstr(query.startsWith("BEGIN") ? "BEGIN" : query === "ROLLBACK" ? "ROLLBACK" : "SET")), ready());
      } else if (type === "P") { this.sql.push(payload.subarray(1, payload.indexOf(0, 1)).toString()); this.response(frame("1")); }
      else if (type === "B") { this.bound.push(Buffer.from(payload)); this.response(frame("2")); }
      else if (type === "D") this.response(fields());
      else if (type === "E") {
        if (this.plan.selectError) this.response(frame("E", Buffer.from("SERROR\0CXX000\0MPRIVATE synthetic SQL error\0\0")));
        else if (!this.plan.stallSelect) this.response(jsonRow(), frame("C", cstr("SELECT 1")));
      }
      else if (type === "S") { if (!this.plan.stallSelect) this.response(ready()); }
      else if (type === "X") { this.terminationRequested = true; if (!this.plan.holdClose) this.finishClose(); }
    }
  }
}
driverMode = "installed";
const installedResult = await normal(request()), socket = sockets.at(-1);
assert.equal(installedResult.rows[0].fixture.synthetic, true); assert.equal(socket.sql.length, 7); assert.equal(socket.sql[5], sql);
assert.equal(socket.bound.length, 1); assert(socket.startupParameters.includes("default_transaction_read_only=on"));
assert.equal(socket.readyState, 3); assert(socket.url.startsWith("wss:")); checks++;
const decodeBind = bytes => {
  let offset = bytes.indexOf(0) + 1; offset = bytes.indexOf(0, offset) + 1;
  const formats = bytes.readInt16BE(offset); offset += 2 + formats * 2;
  const count = bytes.readInt16BE(offset); offset += 2; const values = [];
  for (let i = 0; i < count; i++) { const length = bytes.readInt32BE(offset); offset += 4; values.push(bytes.subarray(offset, offset + length).toString()); offset += length; }
  return values;
};
assert.deepEqual(decodeBind(socket.bound[0]), ["test_role", '{"test_function"}', '{"test_table"}']); checks++;
wirePlans.push({ selectError: true });
await unavailable(normal(request()), "Catalog transaction unavailable.");
assert.equal(sockets.at(-1).sql.length, 6); assert.equal(sockets.at(-1).readyState, 3); checks++;
wirePlans.push({ stallSelect: true, holdClose: true });
const realStall = normal(request()); await until(() => sockets.length === 3 && sockets.at(-1).sql.length === 6); const stalledSocket = sockets.at(-1);
[...timers].find(t => t.ms === 10000).fn(); await unavailable(realStall, "Catalog transaction unavailable.");
assert.equal(stalledSocket.sql.length, 6); assert(stalledSocket.closeCalls >= 1); checks++;
stalledSocket.finishClose(); await tick(); await tick(); assert.equal(timers.size, 0); checks++;
wirePlans.push({ holdClose: true });
let closeConfirmed = false;
const slowClose = normal(request()).then(value => { closeConfirmed = true; return value; });
await until(() => sockets.length === 4 && sockets.at(-1).sql.length === 7 && sockets.at(-1).terminationRequested);
const closingSocket = sockets.at(-1); assert.equal(closeConfirmed, false); checks++;
[...timers].find(t => t.ms === 10000).fn(); await unavailable(slowClose, "Catalog transaction unavailable.");
closingSocket.finishClose(); await tick(); await tick(); assert.equal(closeConfirmed, false); assert.equal(timers.size, 0); checks++;
console.log(JSON.stringify({ status: "PASS", checks, installedDriver: require("../node_modules/@neondatabase/serverless/package.json").version,
  installedDriverConnections: sockets.length, publicWebSocketStub: true, realNetworkCalls: 0, realSqlCalls: 0,
  productionConnected: false, serverCancellationVerified: false, timing: "deterministic adapter/orchestrator deadlines" }));
