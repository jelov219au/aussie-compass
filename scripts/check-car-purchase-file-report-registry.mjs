import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url), ts = require("typescript"), cache = new Map();
let opens = 0, closes = 0, onStream = null;
const observedFs = { ...fs, open: async (...args) => {
  const handle = await fs.open(...args); opens++;
  return { stat: handle.stat.bind(handle), close: async () => { try { await handle.close(); } finally { closes++; } },
    createReadStream: options => { const stream = handle.createReadStream(options); onStream?.(args[0], stream); return stream; } };
} };
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const compiledModule = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiledModule, exports: compiledModule.exports, Buffer, URL, require: id => {
    if (id === "server-only") return {};
    if (id === "node:fs/promises") return observedFs;
    if (["node:crypto", "node:fs", "node:path"].includes(id)) return require(id);
    if (id.startsWith("./")) return load(id.slice(2));
    throw Error("Unexpected import");
  } });
  cache.set(name, compiledModule.exports); return compiledModule.exports;
}
const { createCarFileReportRegistry: create } = load("carPurchaseProFileReportRegistry");
const { carReadinessCheckIds: ids } = load("carPurchaseProReadinessEvidence");
const root = await fs.mkdtemp(join(tmpdir(), "car-report-registry-synthetic-"));
await fs.mkdir(join(root, "reports")); await fs.mkdir(join(root, "artifacts"));
const digest = bytes => createHash("sha256").update(bytes).digest("hex"), copy = value => JSON.parse(JSON.stringify(value));
const at = 1_800_000_000_000, signer = generateKeyPairSync("ed25519");
const artifact = Buffer.from(JSON.stringify({ synthetic: true, executed: false, note: "Local adapter fixture, never real approval." }));
const artifactHash = digest(artifact), artifactPath = join(root, "artifacts", artifactHash + ".json");
const wires = Object.fromEntries(ids.map(id => {
  const reportJson = JSON.stringify({ id, issuerKeyId: "fixture_signer", artifactSha256: artifactHash, synthetic: true });
  return [id, { reportJson, issuerKeyId: "fixture_signer", signature: sign(null, Buffer.from("car-readiness-report-v1\n" + reportJson), signer.privateKey).toString("base64") }];
}));
const index = { version: "car-report-registry-v1", approvedAt: at - 1000, expiresAt: at + 10000,
  reports: ids.map(id => ({ id, reportSha256: digest(wires[id].reportJson), artifactSha256: artifactHash })) };
const indexBytes = Buffer.from(JSON.stringify(index)), indexPath = join(root, "index.json");
const reportPath = join(root, "reports", ids[0] + ".json");
await fs.writeFile(artifactPath, artifact);
await fs.writeFile(indexPath, indexBytes);
for (const id of ids) await fs.writeFile(join(root, "reports", id + ".json"), JSON.stringify(wires[id]));
const config = { directory: root, approvedIndexSha256: digest(indexBytes), now: () => at };
const call = (reader = create(config), id = ids[0], signal = new AbortController().signal) => reader(id, signal);
let checks = 0;
async function rejects(reader, id, signal) {
  await assert.rejects(() => call(reader, id, signal), { message: "Report registry unavailable." });
  assert.equal(opens, closes); checks++;
}
// Real filesystem reads, ephemeral Node signature, no real approval/DB/network.
for (const id of ids) {
  const result = await call(create(config), id);
  assert.deepEqual(copy(result), wires[id]);
  assert(verify(null, Buffer.from("car-readiness-report-v1\n" + result.reportJson), signer.publicKey, Buffer.from(result.signature, "base64")));
  assert.equal(opens, closes); checks++;
}
const snapshotConfig = { ...config }, reader = create(snapshotConfig);
snapshotConfig.directory = "changed"; snapshotConfig.approvedIndexSha256 = "changed";
assert.deepEqual(copy(await call(reader)), wires[ids[0]]); checks++;
for (const change of [{ directory: null }, { directory: "relative/path" }, { approvedIndexSha256: null }, { approvedIndexSha256: "a".repeat(64) }]) await rejects(create({ ...config, ...change }));
await rejects(reader, "../index"); await rejects(reader, "unknown");
const cancelled = new AbortController(); cancelled.abort(); const beforeCancelled = opens;
await rejects(reader, ids[0], cancelled.signal); assert.equal(opens, beforeCancelled); checks++;
await rejects(create({ ...config, now: () => NaN }));
await rejects(create({ ...config, now: () => index.approvedAt - 1 }));
await rejects(create({ ...config, now: () => index.expiresAt }));
for (const mutate of [v => v.extra = true, v => v.version = "other", v => v.reports.pop(),
  v => v.reports[0] = v.reports[1], v => v.reports[0].id = "unknown", v => v.reports[0].reportSha256 = "invalid",
  v => v.reports[0].extra = true, v => v.expiresAt = v.approvedAt]) {
  const changed = copy(index); mutate(changed); const bytes = Buffer.from(JSON.stringify(changed));
  await fs.writeFile(indexPath, bytes); await rejects(create({ ...config, approvedIndexSha256: digest(bytes) }));
}
for (const bytes of [Buffer.from([0xff]), Buffer.from("{"), Buffer.alloc(16_385, 32)]) {
  await fs.writeFile(indexPath, bytes); await rejects(create({ ...config, approvedIndexSha256: digest(bytes) }));
}
await fs.writeFile(indexPath, indexBytes);
for (const mutate of [w => w.extra = true, w => w.reportJson += " ", w => w.reportJson = "x".repeat(65_537),
  w => w.issuerKeyId = {}, w => w.issuerKeyId = "other", w => w.signature = "not-base64", w => delete w.signature]) {
  const changed = copy(wires[ids[0]]); mutate(changed);
  await fs.writeFile(reportPath, JSON.stringify(changed)); await rejects(reader);
}
await fs.writeFile(reportPath, Buffer.alloc(131_073, 32)); await rejects(reader);
await fs.writeFile(reportPath, JSON.stringify(wires[ids[0]]));
await fs.writeFile(artifactPath, "tampered artifact"); await rejects(reader);
await fs.writeFile(artifactPath, Buffer.alloc(2_097_153, 32)); await rejects(reader);
await fs.writeFile(artifactPath, artifact);
// A successful read must not be cached after the index is withdrawn/changed.
await fs.writeFile(indexPath, Buffer.concat([indexBytes, Buffer.from(" ")])); await rejects(reader);
await fs.writeFile(indexPath, indexBytes);
// Mutation during actual artifact streaming is caught by the final index read.
onStream = (path, stream) => { if (path === artifactPath) stream.once("data", () => writeFileSync(indexPath, "withdrawn")); };
await rejects(reader); onStream = null; await fs.writeFile(indexPath, indexBytes);
// Abort an actual file stream and prove the adapter closes all opened handles.
const midRead = new AbortController();
onStream = (path, stream) => { if (path === artifactPath) stream.once("data", () => midRead.abort()); };
await rejects(reader, ids[0], midRead.signal); onStream = null;
// Expiry during filesystem I/O is rechecked before returning a descriptor.
let now = at;
onStream = (path, stream) => { if (path === artifactPath) stream.once("data", () => { now = index.expiresAt; }); };
await rejects(create({ ...config, now: () => now })); onStream = null;
// Distinct concurrent readers share no AbortController or handle.
const healthy = new AbortController(), rejected = new AbortController(); rejected.abort();
const outcomes = await Promise.allSettled([call(reader, ids[0], rejected.signal), call(reader, ids[1], healthy.signal)]);
assert.equal(outcomes[0].status, "rejected"); assert.equal(outcomes[1].status, "fulfilled");
assert.equal(healthy.signal.aborted, false); assert.equal(opens, closes); checks++;
const rootAlias = root + "-junction";
await fs.symlink(root, rootAlias, process.platform === "win32" ? "junction" : "dir");
await rejects(create({ ...config, directory: rootAlias }));
assert.equal(opens, closes);
console.log(JSON.stringify({ status: "PASS", checks, realFileOpens: opens, realFileCloses: closes,
  actualStreamAbort: true, fixtureDirectory: root, fixtureRetained: true, deletedFiles: 0,
  realApprovals: 0, realSqlCalls: 0, productionConnected: false, fullEnvelopeIntegration: "NOT_RUN" }));
