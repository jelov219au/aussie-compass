import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
const compiledModule = { exports: {} };
const source = readFileSync(new URL("../src/lib/carPurchaseProRecoveryClient.ts", import.meta.url), "utf8");
runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { exports: compiledModule.exports, module: compiledModule.exports, URLSearchParams, Date });
const { createCarPurchaseRecoveryClient: create, carPurchaseRecoveryStorageKey: key } = compiledModule.exports;
const restoreCode = "R".repeat(43), issuedCode = "I".repeat(43), now = Date.parse("2026-09-04T00:00:00Z");
let checks = 0;
function fixture(options = {}) {
  const records = options.records ?? new Map(), states = [], requests = [], destinations = [];
  let time = options.time ?? now, nonceCount = 0;
  if ("stored" in options) records.set(key, options.stored);
  let send = options.send ?? (async operation => operation === "restore"
    ? { status: 200, json: async () => ({ code: "restore_ready", destination: "/car-purchase-pro/workspace" }) }
    : operation === "restore-code"
      ? { status: 200, json: async () => ({ code: issuedCode, expiresAt: new Date(now + 30 * 86400000).toISOString() }) }
      : { status: 200, json: async () => ({ released: true, destination: "/car-purchase-pro?access=released" }) });
  const controller = create({ enabled: options.enabled ?? true,
    storage: {
      getItem: name => { if (options.storageError) throw new Error("private storage"); return records.get(name) ?? null; },
      setItem: (name, value) => { if (options.writeError) throw new Error("private storage"); if (!options.noopWrite) records.set(name, value); },
      removeItem: name => { if (options.removeError) throw new Error("private storage"); records.delete(name); },
    },
    fingerprint: async code => {
      if (options.fingerprintError) throw new Error("private digest");
      return options.badFingerprint ?? createHash("sha256").update("car-purchase-pro-restore-client-v1:" + code).digest("hex");
    },
    createNonce: () => { nonceCount++; return options.badNonce ?? ("n".repeat(63) + String(nonceCount)); },
    now: () => time,
    send: async (operation, body) => { requests.push([operation, body.toString()]); return send(operation, body); },
    navigate: destination => { if (options.navigateError) throw new Error("private navigation"); destinations.push(destination); },
    onState: state => {
      for (const secret of [restoreCode, "n".repeat(63), "private"]) assert.equal(JSON.stringify(state).includes(secret), false);
      states.push(state);
    },
  });
  return { controller, records, states, requests, destinations, setSend: value => { send = value; }, setTime: value => { time = value; },
    state(phase, canRestore, canManage) { checks++; const state = states.at(-1); assert.equal(state.phase, phase); assert.equal(state.canRestore, canRestore); assert.equal(state.canManage, canManage); },
    nonceCount: () => nonceCount };
}
const closed = fixture({ enabled: false }); closed.state("closed", false, false);
await closed.controller.restore(restoreCode); await closed.controller.issueCode(); await closed.controller.release(true);
assert.equal(closed.requests.length, 0); assert.equal(closed.records.size, 0);
const invalid = fixture();
for (const code of ["", "short", "R".repeat(42), "R".repeat(44), "R".repeat(42) + "!"]) {
  await invalid.controller.restore(code); invalid.state("notice", true, true);
}
assert.equal(invalid.requests.length, 0); assert.equal(invalid.records.size, 0);

const retry = fixture({ send: async () => { throw new Error("private timeout"); } });
await retry.controller.restore("  " + restoreCode + "  "); retry.state("notice", true, true);
const saved = retry.records.get(key), parsed = JSON.parse(saved);
assert.equal(JSON.stringify(parsed).includes(restoreCode), false); assert.match(parsed.fingerprint, /^[a-f0-9]{64}$/);
assert.match(parsed.nonce, /^[A-Za-z0-9_-]{40,128}$/); assert.equal(retry.nonceCount(), 1);
await retry.controller.restore(restoreCode); assert.equal(retry.requests[0][1], retry.requests[1][1]); assert.equal(retry.nonceCount(), 1);
retry.setSend(async operation => ({ status: operation === "restore" ? 503 : 500, json: async () => ({ code: "private detail" }) }));
await retry.controller.restore(restoreCode); retry.state("notice", true, true); assert.equal(retry.requests[2][1], retry.requests[0][1]);
for (const options of [{ storageError: true }, { writeError: true }, { noopWrite: true }, { fingerprintError: true },
  { badFingerprint: "bad" }, { badNonce: "bad" }, { time: NaN },
  { stored: JSON.stringify({ v: 1, fingerprint: "bad", nonce: "n".repeat(64), createdAt: now }) },
  { stored: "{bad" }, { stored: JSON.stringify({ v: 1, fingerprint: parsed.fingerprint, nonce: parsed.nonce, createdAt: now }), time: now + 86400001 },
  { stored: JSON.stringify({ v: 1, fingerprint: parsed.fingerprint, nonce: parsed.nonce, createdAt: now }), time: now - 1 }]) {
  const f = fixture(options); await f.controller.restore(restoreCode); f.state("notice", true, true); assert.equal(f.requests.length, 0);
}
const different = fixture({ records: retry.records, send: async () => { throw new Error("offline"); } });
await different.controller.restore("D".repeat(43));
assert.equal(different.nonceCount(), 1); assert.notEqual(different.records.get(key), saved);
for (const [status, body, canRestore] of [[409, { code: "restore_denied" }, true], [400, { code: "restore_invalid" }, true],
  [403, { code: "request_rejected" }, true], [200, { code: "restore_ready", destination: "https://foreign.example" }, true]]) {
  const f = fixture({ send: async () => ({ status, json: async () => body }) });
  await f.controller.restore(restoreCode); f.state("notice", canRestore, true); assert.equal(f.destinations.length, 0); assert.ok(f.records.has(key));
}
const restored = fixture(); await restored.controller.restore(restoreCode); restored.state("restored", false, false);
assert.deepEqual(restored.destinations, ["/car-purchase-pro/workspace"]); assert.equal(restored.records.has(key), false);
const navFailure = fixture({ navigateError: true }); await navFailure.controller.restore(restoreCode); navFailure.state("notice", true, true); assert.ok(navFailure.records.has(key));

const issued = fixture(); await issued.controller.issueCode(); issued.state("notice", true, true);
assert.equal(issued.states.at(-1).issuedCode, issuedCode); assert.equal(issued.requests.length, 1); assert.equal(issued.records.size, 0);
await issued.controller.issueCode(); assert.equal(issued.requests.length, 1);
issued.controller.hideCode(); issued.state("notice", true, true); assert.equal(issued.states.at(-1).issuedCode, null);
for (const response of [
  { status: 401, json: async () => ({ code: issuedCode, expiresAt: new Date(now + 1000).toISOString() }) },
  { status: 200, json: async () => ({ code: "short", expiresAt: new Date(now + 1000).toISOString() }) },
  { status: 200, json: async () => ({ code: issuedCode, expiresAt: new Date(now - 1).toISOString() }) },
  { status: 200, json: async () => ({ code: issuedCode, expiresAt: "not-a-date" }) }]) {
  const f = fixture({ send: async () => response }); await f.controller.issueCode(); f.state("notice", true, true); assert.equal(f.states.at(-1).issuedCode, null);
}
const noConfirm = fixture(); await noConfirm.controller.release(false); noConfirm.state("notice", true, true); assert.equal(noConfirm.requests.length, 0);
for (const response of [{ status: 503, json: async () => ({ released: true, destination: "/car-purchase-pro?access=released" }) },
  { status: 200, json: async () => ({ released: false, destination: "/car-purchase-pro?access=released" }) },
  { status: 200, json: async () => ({ released: true, destination: "https://foreign.example" }) },
  { status: 200, json: async () => ({ released: "true", destination: "/car-purchase-pro?access=released" }) }]) {
  const f = fixture({ send: async () => response }); await f.controller.release(true); f.state("notice", true, true);
}
const released = fixture(); await released.controller.release(true); released.state("released", true, false);
await released.controller.issueCode(); await released.controller.release(true); assert.equal(released.requests.length, 1);
const removalFailure = fixture({ removeError: true }); await removalFailure.controller.restore(restoreCode); removalFailure.state("restored", false, false);
let settle, markSent;
const sent = new Promise(resolve => { markSent = resolve; });
const double = fixture({ send: () => { markSent(); return new Promise(resolve => { settle = resolve; }); } });
const first = double.controller.restore(restoreCode); await double.controller.release(true); await sent;
double.state("working", false, false); assert.equal(double.requests.length, 1);
settle({ status: 503, json: async () => ({}) }); await first; double.state("notice", true, true);
let fingerprintSettle;
const disposed = fixture({ fingerprintError: false });
disposed.controller.dispose(); await disposed.controller.restore(restoreCode); assert.equal(disposed.requests.length, 0); assert.equal(disposed.states.length, 1);
const delayed = fixture();
delayed.controller.dispose(); fingerprintSettle = delayed; await fingerprintSettle.controller.issueCode(); assert.equal(delayed.requests.length, 0);
console.log(`PASS car recovery client: ${checks} state checks; raw code not stored, restore nonce reused, issue displayed only on valid response, release completion requires exact server result, duplicate/disposal guards. No DOM render/browser/network/Stripe/DB.`);
