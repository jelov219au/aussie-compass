import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url), ts = require("typescript"), cache = new Map(), timers = new Set();
let fileOpens = 0, fileCloses = 0, reportReads = 0, catalogQueries = 0;
const observedFs = { ...fs, open: async (...args) => {
  const handle = await fs.open(...args); fileOpens++;
  return { stat: handle.stat.bind(handle), createReadStream: handle.createReadStream.bind(handle),
    close: async () => { try { await handle.close(); } finally { fileCloses++; } } };
} };
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const compiledModule = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
  { module: compiledModule, exports: compiledModule.exports, Buffer, URL, AbortController,
    setTimeout: (fn, ms) => { assert.equal(ms, 10000); const timer = { fn }; timers.add(timer); return timer; },
    clearTimeout: timer => timers.delete(timer), require: id => {
      if (id === "server-only") return {};
      if (id === "node:fs/promises") return observedFs;
      if (["node:crypto", "node:fs", "node:path"].includes(id)) return require(id);
      if (id.startsWith("./")) return load(id.slice(2));
      throw Error("Unexpected import");
    } });
  cache.set(name, compiledModule.exports); return compiledModule.exports;
}
const { createCarFileReportRegistry: fileReader } = load("carPurchaseProFileReportRegistry");
const { createCarReadinessEnvelope: envelope } = load("carPurchaseProReadinessEnvelope");
const { createCarPrivilegeCatalogCollector: collect, carPrivilegeCatalogSql: sql } = load("carPurchaseProReadinessPrivilegeCatalog");
const { carReadinessFunctionNames: names, carReadinessConstraintTables: tables, carReadinessCheckIds: ids } = load("carPurchaseProReadinessEvidence");
const copy = value => JSON.parse(JSON.stringify(value)), hash = bytes => createHash("sha256").update(bytes).digest("hex");
const time = Date.parse("2026-09-04T00:00:00Z"), sha = "a".repeat(64), candidate = "a".repeat(40);
const signing = generateKeyPairSync("ed25519"), wrongSigning = generateKeyPairSync("ed25519");
const publicKey = signing.publicKey.export({ type: "spki", format: "pem" });
// This whole environment, offer, approval, catalog and executed label are
// synthetic protocol fixtures. Only local file I/O and crypto are real.
const environment = { databaseIdentity: "synthetic-provider-project-branch-db", runtimeRole: "test_app", ownerRole: "test_owner",
  mode: "test", deployment: "nonproduction", origin: "https://example.invalid" };
const offer = { productCode: "car_purchase_pro", currency: "aud", billing: "one_time", priceCents: 1234,
  stripePriceId: "price_Synthetic", stripeProductId: "prod_Synthetic", termsVersion: "2026-09-04" };
const triggerTables = ["payment_webhook_events", "entitlement_event_tombstones", "first_sale_gate_events", "car_purchase_exception_receipts"];
const raw = { database_name: "test_db", inspection_role: "test_inspector", server_version: 180006, read_only: "on", isolation: "repeatable read",
  search_path: "pg_catalog, pg_temp", replication_role: "origin",
  functions: names.map(name => ({ name, signature: `public.${name}(text)`, kind: "f", definition_sha256: sha, owner: "test_owner",
    security_definer: true, settings: ["search_path=public, pg_temp"], runtime_execute: false, grants: [] })),
  constraints: tables.map(table => ({ table, name: "synthetic_constraint", definition_sha256: sha, validated: true, enforced: true,
    internal_count: 0, internal_healthy: true, index_healthy: true })),
  triggers: triggerTables.map(table => ({ table, name: "synthetic_trigger", definition_sha256: sha, enabled: "O", function_signature: `public.${names[0]}(text)` })),
  tables: tables.map(name => ({ name, ordinary: true, internal_healthy: true })),
  privileges: { roles: [{ name: "test_app", superuser: false, create_role: false, create_db: false, replication: false, bypass_rls: false,
    inherit: true, login: true, settings_sha256: sha }], memberships: [], schemas: [{ name: "public", usage: true, create: false, grant: false }],
    tables: tables.map(name => ({ name, select: true, write: false, grant: false, rls: false, force_rls: false, policies_sha256: sha })),
    columns: tables.map(table => ({ table, name: "id", select: true, write: false, grant: false, supported: true, definition_sha256: sha })), sequences: [],
    guards: { database_create: false, database_temp: true, replication_parameter: false, unreviewed_definer: false,
      function_grant: false, outside_schema_create: false, outside_writes: false } } };
const config = { databaseName: "test_db", inspectionRole: "test_inspector", expectedColumns: tables.map(table => ({ table, name: "id" })), expectedSequences: [] };
const observation = await collect({ ...config, runtimeRole: "test_app", expectedSignatures: raw.functions.map(({ name, signature }) => ({ name, signature })),
  expectedConstraints: raw.constraints.map(({ table, name }) => ({ table, name })), expectedTriggers: raw.triggers.map(({ table, name }) => ({ table, name })),
  query: async () => [copy(raw)] })();
assert.equal(observation.ok, true);
const root = await fs.mkdtemp(join(tmpdir(), "car-file-envelope-synthetic-"));
const artifact = Buffer.from(JSON.stringify({ synthetic: true, executed: false, note: "Never use this fixture as real approval evidence." }));
const artifactHash = hash(artifact);
let fixtureCount = 0, checks = 0;
async function fixture({ changeReport = () => {}, wrongKey = false } = {}) {
  const directory = join(root, String(++fixtureCount));
  await fs.mkdir(join(directory, "reports"), { recursive: true }); await fs.mkdir(join(directory, "artifacts"));
  await fs.writeFile(join(directory, "artifacts", artifactHash + ".json"), artifact);
  const wires = {};
  for (const id of ids) {
    const report = { version: "car-readiness-report-v1", id, issuerKeyId: "fixture_signer", candidateCommit: candidate, environment: copy(environment), offer: copy(offer),
      issuedAt: time - 2000, expiresAt: time + 90000, result: "PASS", evidenceClass: "executed", artifactSha256: artifactHash };
    if (id === ids[0]) changeReport(report);
    const reportJson = JSON.stringify(report);
    wires[id] = { reportJson, issuerKeyId: report.issuerKeyId,
      signature: sign(null, Buffer.from("car-readiness-report-v1\n" + reportJson), wrongKey ? wrongSigning.privateKey : signing.privateKey).toString("base64") };
    await fs.writeFile(join(directory, "reports", id + ".json"), JSON.stringify(wires[id]));
  }
  const index = { version: "car-report-registry-v1", approvedAt: time - 1000, expiresAt: time + 120000,
    reports: ids.map(id => ({ id, reportSha256: hash(wires[id].reportJson), artifactSha256: artifactHash })) };
  const indexBytes = JSON.stringify(index); await fs.writeFile(join(directory, "index.json"), indexBytes);
  const manifest = { version: "car-readiness-evidence-v1", approvalId: "CAR-PURCHASE-LAUNCH", candidateCommit: candidate,
    approvedAt: time - 1000, expiresAt: time + 120000, environment, offer,
    inventory: { functions: observation.functions, constraints: observation.constraints, triggers: observation.triggers,
      runtimePrivileges: observation.runtimePrivileges, checks: ids.map(id => ({ id, passed: true, evidenceSha256: hash(wires[id].reportJson) })) } };
  const f = { directory, wires, reads: 0, queries: 0, clock: time, latestSignal: null };
  const reader = fileReader({ directory, approvedIndexSha256: hash(indexBytes), now: () => f.clock });
  f.deps = { approvedManifestJson: JSON.stringify(manifest), catalogConfig: config, trustedReportKeys: { fixture_signer: publicKey }, now: () => f.clock,
    readReport: async (id, signal) => { f.reads++; reportReads++; f.latestSignal = signal; return reader(id, signal); },
    query: async request => { f.queries++; catalogQueries++; assert.equal(request.sql, sql);
      return { binding: { version: "car-deployment-binding-v1", candidateCommit: candidate, environment, offer,
        databaseName: "test_db", inspectionRole: "test_inspector" }, rows: [copy(raw)], challenge: request.challenge, observedAt: f.clock }; } };
  f.run = () => envelope(f.deps)(); return f;
}
function checked(result, expected) {
  assert.equal(result.ok, expected); assert.equal(timers.size, 0); assert.equal(fileOpens, fileCloses);
  if (expected) { assert.equal(result.salesAuthorized, false); assert.equal(Object.hasOwn(result, "accessFunctions"), false); }
  else { assert.equal(result.reason, "evidence_unavailable"); }
  checks++;
}
const valid = await fixture(); checked(await valid.run(), true);
assert.equal(valid.reads, 11); assert.equal(valid.queries, 1); checks++;
for (const options of [{ wrongKey: true }, { changeReport: r => r.environment.databaseIdentity = "other-db" },
  { changeReport: r => r.offer.stripePriceId = "price_Other" }, { changeReport: r => r.expiresAt = time },
  { changeReport: r => r.evidenceClass = "mock" }]) {
  const f = await fixture(options); checked(await f.run(), false); assert.equal(f.queries, 0); checks++;
}
const tampered = await fixture();
await fs.writeFile(join(tampered.directory, "artifacts", artifactHash + ".json"), "tampered");
checked(await tampered.run(), false); assert.equal(tampered.queries, 0); checks++;
const withdrawn = await fixture(), reusableEnvelope = envelope(withdrawn.deps);
checked(await reusableEnvelope(), true);
await fs.writeFile(join(withdrawn.directory, "index.json"), "withdrawn");
checked(await reusableEnvelope(), false); assert.equal(withdrawn.queries, 1); checks++;
const duringReads = await fixture(), originalRead = duringReads.deps.readReport;
duringReads.deps.readReport = async (id, signal) => {
  const report = await originalRead(id, signal);
  if (id === ids[4]) await fs.writeFile(join(duringReads.directory, "index.json"), "withdrawn");
  return report;
};
checked(await duringReads.run(), false); assert.equal(duringReads.queries, 0); assert.equal(duringReads.reads, 6); checks++;
const drift = await fixture(), originalQuery = drift.deps.query;
drift.deps.query = async request => { const result = await originalQuery(request); result.rows[0].read_only = "off"; return result; };
checked(await drift.run(), false); assert.equal(drift.queries, 1); checks++;
// Expiry at catalog completion is rejected even though all file reads succeeded.
const expired = await fixture({ changeReport: r => r.expiresAt = time + 500 }), expiryQuery = expired.deps.query;
expired.deps.query = async request => { expired.clock = time + 1000; return expiryQuery(request); };
checked(await expired.run(), false); checks++;
// The actual file reader receives the envelope deadline's cancellation signal.
const timed = await fixture(), timedRead = timed.deps.readReport;
let pendingFileRead;
timed.deps.readReport = async (id, signal) => {
  pendingFileRead = timedRead(id, signal);
  if (id === ids[2]) [...timers][0].fn();
  return pendingFileRead;
};
const timedResult = await timed.run();
await pendingFileRead.catch(() => {}); await new Promise(setImmediate);
checked(timedResult, false); assert(timed.latestSignal.aborted); assert.equal(timed.queries, 0); assert.equal(timed.reads, 3); checks++;
console.log(JSON.stringify({ status: "PASS", checks, fixtures: fixtureCount, completeSignedReportSets: fixtureCount,
  reportReads, mockCatalogQueries: catalogQueries, fixtureBootstrapQueries: 1, realFileOpens: fileOpens, realFileCloses: fileCloses,
  fixtureDirectory: root, fixtureRetained: true, deletedFiles: 0, realApprovals: 0, realSqlCalls: 0, productionConnected: false,
  testedBoundary: "real filesystem reader + Node Ed25519 + actual envelope/catalog validation with synthetic metadata" }));
