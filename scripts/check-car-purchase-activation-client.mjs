import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
function load(name, resolve) {
  const compiledModule = { exports: {} };
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
    { exports: compiledModule.exports, module: compiledModule, Date, URL, URLSearchParams, Buffer,
      Request, Response, Uint8Array, TextDecoder, process: { env: { NODE_ENV: "production" } }, require: resolve });
  return compiledModule.exports;
}
const api = load("carPurchaseProActivationClient", name => { throw new Error("Client must have no server dependency: " + name); });
const { createCarPurchaseActivationClient: create, carPurchaseActivationStorageKey: key,
  carPurchaseActivationLifetimeMs: lifetime, validCarPurchaseSessionId } = api;
const sessionId = "cs_test_client", nonce = "n".repeat(64), now = Date.parse("2026-09-04T00:00:00Z");
const readyReply = () => ({ status: 200, json: async () => ({ code: "activate_ready", destination: "/car-purchase-pro/workspace" }) });
let cases = 0;
function fixture(options = {}) {
  const records = options.records ?? new Map();
  if ("stored" in options) records.set(key, options.stored);
  const states = [], bodies = [], destinations = [];
  let reads = 0, randoms = 0, clears = 0, writes = 0, time = options.time ?? now;
  let reply = options.send ?? (async () => readyReply());
  const client = create({
    storage: {
      getItem: name => { reads++; if (options.readFailure) throw new Error("private storage"); return records.get(name) ?? null; },
      setItem: (name, value) => { writes++; if (options.writeFailure) throw new Error("private storage"); if (!options.noopWrite) records.set(name, value); },
      removeItem: name => { if (options.removeFailure) throw new Error("private storage"); records.delete(name); },
    },
    createNonce: () => { randoms++; return options.nonce ?? nonce; },
    now: () => time,
    clearUrlReference: () => { clears++; if (options.clearFailure) throw new Error("private history"); },
    send: async body => { bodies.push(body.toString()); return reply(body); },
    navigate: destination => { if (options.navigateFailure) throw new Error("private navigation"); destinations.push(destination); },
    onState: state => {
      for (const secret of [sessionId, nonce, "private"]) assert.equal(JSON.stringify(state).includes(secret), false);
      states.push(state);
    },
  });
  return { client, records, states, bodies, destinations,
    prepare(initial = sessionId, invalid = false, enabled = true) { client.prepare(initial, invalid, enabled); return this; },
    state(phase, canSubmit = false) { cases++; assert.equal(states.at(-1).phase, phase); assert.equal(states.at(-1).canSubmit, canSubmit); },
    setReply(next) { reply = next; }, setTime(next) { time = next; }, counts: () => ({ reads, randoms, clears, writes }),
  };
}
for (const value of [undefined, null, [sessionId], "cs_test_a&price=1", "other", "cs_live_", "cs_test_" + "x".repeat(241)]) assert.equal(validCarPurchaseSessionId(value), false);
assert.equal(validCarPurchaseSessionId(sessionId), true);
const first = fixture().prepare(); first.state("ready", true);
assert.equal(first.bodies.length, 0, "Preparing the page must never activate automatically");
assert.deepEqual(first.counts(), { reads: 2, randoms: 1, clears: 1, writes: 1 });
first.client.prepare(sessionId, false, true);
assert.equal(first.counts().randoms, 1);
const saved = first.records.get(key);
assert.equal(JSON.parse(saved).sessionId, sessionId); assert.equal(JSON.parse(saved).nonce, nonce);
first.setReply(async () => { throw new Error("private network timeout"); });
await first.client.submit(); first.state("retry", true);
first.setReply(async () => ({ status: 503, json: async () => ({ code: "access_unavailable" }) }));
await first.client.submit(); first.state("retry", true);
assert.equal(first.bodies[0], first.bodies[1]); assert.equal(first.records.get(key), saved);
const reload = fixture({ records: first.records }); reload.client.prepare(undefined, false, true); reload.state("ready", true);
assert.equal(reload.counts().randoms, 0);
await reload.client.submit(); reload.state("success");
assert.equal(reload.bodies[0], first.bodies[0]); assert.deepEqual(reload.destinations, ["/car-purchase-pro/workspace"]);
assert.equal(reload.records.has(key), false);
assert.equal(new URLSearchParams(reload.bodies[0]).get("activation_nonce"), nonce);

const closed = fixture().prepare(sessionId, false, false); closed.state("closed");
await closed.client.submit(); assert.equal(closed.bodies.length, 0); assert.equal(closed.counts().reads, 0);
const missing = fixture(); missing.client.prepare(undefined, false, true); missing.state("missing");
for (const f of [fixture({ stored: saved }).prepare(undefined, true), fixture().prepare("invalid"),
  fixture({ stored: "{bad" }).prepare(), fixture({ stored: JSON.stringify({ v: 1, sessionId, nonce: "short", createdAt: now }) }).prepare(),
  fixture({ stored: saved, time: now + lifetime + 1 }).prepare(), fixture({ stored: saved, time: now - 1 }).prepare(),
  fixture({ readFailure: true }).prepare(), fixture({ writeFailure: true }).prepare(), fixture({ noopWrite: true }).prepare(),
  fixture({ clearFailure: true }).prepare(), fixture({ nonce: "bad" }).prepare(), fixture({ time: NaN }).prepare()]) {
  f.state("blocked"); await f.client.submit(); assert.equal(f.bodies.length, 0);
}
const expiry = fixture().prepare(); expiry.setTime(now + lifetime + 1); await expiry.client.submit(); expiry.state("blocked"); assert.equal(expiry.bodies.length, 0);
for (const [status, body] of [[409, { code: "activate_denied" }], [400, { code: "activate_invalid" }], [403, { code: "request_rejected" }]]) {
  const f = fixture({ send: async () => ({ status, json: async () => body }) }).prepare();
  await f.client.submit(); f.state("blocked"); await f.client.submit(); assert.equal(f.bodies.length, 1); assert.ok(f.records.has(key));
}
for (const send of [async () => ({ status: 200, json: async () => ({ code: "activate_ready", destination: "https://foreign.example" }) }),
  async () => ({ status: 200, json: async () => ({ code: "ready", destination: "/car-purchase-pro/workspace" }) }),
  async () => ({ status: 200, json: async () => null }), async () => ({ status: 500, json: async () => ({}) }),
  async () => ({ status: 200, json: async () => { throw new Error("private malformed body"); } })]) {
  const f = fixture({ send }).prepare(); await f.client.submit(); f.state("retry", true); assert.equal(f.destinations.length, 0); assert.ok(f.records.has(key));
}
const navigationFailure = fixture({ navigateFailure: true }).prepare();
await navigationFailure.client.submit(); navigationFailure.state("retry", true); assert.ok(navigationFailure.records.has(key));
const cleanupFailure = fixture({ removeFailure: true }).prepare();
await cleanupFailure.client.submit(); cleanupFailure.state("success"); assert.ok(cleanupFailure.records.has(key));
let settle;
const double = fixture({ send: () => new Promise(resolve => { settle = resolve; }) }).prepare();
const submission = double.client.submit(); await double.client.submit();
double.state("working"); assert.equal(double.bodies.length, 1);
settle(readyReply()); await submission; double.state("success");
let settleDisposed;
const unmounted = fixture({ send: () => new Promise(resolve => { settleDisposed = resolve; }) }).prepare();
const awaiting = unmounted.client.submit(), stateCount = unmounted.states.length;
unmounted.client.dispose(); settleDisposed(readyReply()); await awaiting;
assert.equal(unmounted.destinations.length, 0); assert.equal(unmounted.states.length, stateCount); assert.ok(unmounted.records.has(key));

// Exercise the new client against the actual closed access runtime, in memory.
const modules = new Map();
const origin = "https://integration.example";
for (const name of ["carPurchaseProRequestBody", "carPurchaseProTokens", "carPurchaseProAccessHttp", "carPurchaseProRuntime"]) {
  modules.set("./" + name, load(name, dependency => {
    if (dependency === "server-only") return {};
    if (dependency === "node:crypto") return crypto;
    if (dependency === "./site") return { siteUrl: origin };
    if (modules.has(dependency)) return modules.get(dependency);
    throw new Error("Unexpected runtime dependency: " + dependency);
  }));
}
const integrated = fixture({ send: body => modules.get("./carPurchaseProRuntime").handleCarPurchaseAccess("activate",
  new Request(origin + "/api/car-purchase-pro/access/activate", { method: "POST", body,
    headers: { origin, "content-type": "application/x-www-form-urlencoded" } })) }).prepare();
await integrated.client.submit(); integrated.state("retry", true);
assert.equal(integrated.destinations.length, 0); assert.ok(integrated.records.has(key));
console.log(`PASS car activation client: ${cases} state checks, persisted nonce reuse, no automatic request, duplicate-submit guard, retry/terminal/expiry/storage/disposal paths and real closed-runtime response. No DOM render/browser/network/Stripe/DB.`);
