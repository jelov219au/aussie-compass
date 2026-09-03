import "server-only";
import { createHash, createPublicKey, verify, type KeyObject } from "node:crypto";
import { carReadinessCheckIds, createCarPurchaseReadinessEvidence } from "./carPurchaseProReadinessEvidence";
import { createCarPrivilegeCatalogCollector } from "./carPurchaseProReadinessPrivilegeCatalog";
import type { CarSchemaCatalogQuery } from "./carPurchaseProReadinessSchemaCatalog";

type Row = Record<string, unknown>;
const record = (v: unknown): v is Row => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: unknown, keys: readonly string[]): v is Row => record(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
const time = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const sha = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const keyId = (v: unknown): v is string => typeof v === "string" && /^[a-z][a-z0-9_-]{0,62}$/.test(v);
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const domain = Buffer.from("car-readiness-report-v1\n", "utf8");
function parse(v: unknown, max: number): unknown {
  if (typeof v !== "string" || Buffer.byteLength(v, "utf8") > max || Buffer.from(v, "utf8").toString("utf8") !== v) return null;
  try { return JSON.parse(v); } catch { return null; }
}
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  return record(a) && record(b) && Object.keys(a).length === Object.keys(b).length
    && Object.keys(a).every(k => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
}
function keys(value: unknown): Map<string, KeyObject> | null {
  if (!record(value) || Object.keys(value).length === 0 || Object.keys(value).length > 8) return null;
  const result = new Map<string, KeyObject>();
  try {
    for (const [id, pem] of Object.entries(value)) {
      if (!keyId(id) || typeof pem !== "string" || pem.length > 2048
        || !pem.startsWith("-----BEGIN PUBLIC KEY-----") || !pem.trimEnd().endsWith("-----END PUBLIC KEY-----")) return null;
      const publicKey = createPublicKey(pem);
      if (publicKey.type !== "public" || publicKey.asymmetricKeyType !== "ed25519") return null;
      result.set(id, publicKey);
    }
    return result;
  } catch { return null; }
}

// The trusted registry returns only currently approved, immutable report bytes.
// Reports are never loaded from a caller-supplied URL/path or from webhook input.
// Readers must stop their underlying I/O when aborted. The envelope also fences
// late results so an ignored signal cannot start further reads or catalog work.
export type CarReadinessReportReader = (id: string, signal: AbortSignal) => Promise<unknown>;
// The approved driver registry returns its independently verified connection and
// deployment binding plus rows from THAT SAME transaction/connection, not an echo
// of requested values. The adapter and registry are not implemented here.
export type CarBoundCatalogQuery = (request: Parameters<CarSchemaCatalogQuery>[0] & Readonly<{ challenge: string }>) => Promise<unknown>;

export function createCarReadinessEnvelope(deps: {
  approvedManifestJson: unknown;
  catalogConfig: { databaseName: unknown; inspectionRole: unknown; expectedColumns: unknown; expectedSequences: unknown };
  trustedReportKeys: unknown;
  readReport: CarReadinessReportReader | null;
  query: CarBoundCatalogQuery | null;
  now?: () => number;
}) {
  const manifestJson = deps.approvedManifestJson;
  const manifest = parse(manifestJson, 262_144);
  const publicKeys = keys(deps.trustedReportKeys), readReport = deps.readReport, query = deps.query, now = deps.now ?? Date.now;
  let config: Row | null = null;
  try { config = JSON.parse(JSON.stringify(deps.catalogConfig)); } catch { /* Closed below. */ }
  return createCarPurchaseReadinessEvidence({ approvedManifestJson: manifestJson, now,
    query: publicKeys && typeof readReport === "function" && typeof query === "function" && config
      ? async request => {
        // The outer evaluator has already validated the exact manifest schema.
        if (!record(manifest) || !record(manifest.environment) || !record(manifest.inventory)
          || !exact(config, ["databaseName", "inspectionRole", "expectedColumns", "expectedSequences"])) throw Error("Readiness unavailable.");
        const expectedBinding = { version: "car-deployment-binding-v1", candidateCommit: manifest.candidateCommit,
          environment: manifest.environment, offer: manifest.offer, databaseName: config.databaseName, inspectionRole: config.inspectionRole };
        const approvedChecks = manifest.inventory.checks as Row[];
        const reports: Row[] = [];
        const reportController = new AbortController();
        let reportExpired = false;
        const checkReportDeadline = () => { if (reportExpired) throw Error("Readiness unavailable."); };
        let reportTimer: ReturnType<typeof setTimeout>;
        const reportDeadline = new Promise<never>((_, reject) => {
          reportTimer = setTimeout(() => {
            reportExpired = true;
            reportController.abort();
            reject(Error("Readiness unavailable."));
          }, 10_000);
        });
        const readReports = async () => {
          for (const id of carReadinessCheckIds) {
            checkReportDeadline();
            const pin = approvedChecks.find(c => c.id === id);
            const result = await readReport(id, reportController.signal);
            checkReportDeadline();
            if (!pin || !exact(result, ["reportJson", "signature", "issuerKeyId"]) || !keyId(result.issuerKeyId)
              || typeof result.reportJson !== "string" || typeof result.signature !== "string" || result.signature.length !== 88) throw Error("Readiness unavailable.");
            const report = parse(result.reportJson, 65_536);
            if (!record(report)) throw Error("Readiness unavailable.");
            const bytes = Buffer.from(result.reportJson, "utf8");
            const publicKey = publicKeys.get(result.issuerKeyId), signature = Buffer.from(result.signature, "base64");
            if (!publicKey || signature.length !== 64 || signature.toString("base64") !== result.signature
              || digest(bytes) !== pin.evidenceSha256 || !verify(null, Buffer.concat([domain, bytes]), publicKey, signature)
              || !exact(report, ["version", "id", "issuerKeyId", "candidateCommit", "environment", "offer",
                "issuedAt", "expiresAt", "result", "evidenceClass", "artifactSha256"])
              || report.version !== "car-readiness-report-v1" || report.id !== id || report.issuerKeyId !== result.issuerKeyId
              || report.candidateCommit !== manifest.candidateCommit || !same(report.environment, manifest.environment)
              || !same(report.offer, manifest.offer) || report.result !== "PASS" || report.evidenceClass !== "executed"
              || !sha(report.artifactSha256) || !time(report.issuedAt) || !time(report.expiresAt)
              || report.issuedAt > (manifest.approvedAt as number) || report.expiresAt <= report.issuedAt) throw Error("Readiness unavailable.");
            const checkedAt = now();
            if (!time(checkedAt) || checkedAt < report.issuedAt || checkedAt >= report.expiresAt) throw Error("Readiness unavailable.");
            reports.push(report);
          }
        };
        try { await Promise.race([readReports(), reportDeadline]); }
        catch {
          reportExpired = true;
          reportController.abort();
          throw Error("Readiness unavailable.");
        } finally { clearTimeout(reportTimer!); }
        let capturedAt: number | null = null;
        const catalog = createCarPrivilegeCatalogCollector({ databaseName: config.databaseName, inspectionRole: config.inspectionRole,
          runtimeRole: manifest.environment.runtimeRole, expectedColumns: config.expectedColumns, expectedSequences: config.expectedSequences,
          expectedSignatures: (manifest.inventory.functions as Row[]).map(f => ({ name: f.name, signature: f.signature })),
          expectedConstraints: (manifest.inventory.constraints as Row[]).map(c => ({ table: c.table, name: c.name })),
          expectedTriggers: (manifest.inventory.triggers as Row[]).map(t => ({ table: t.table, name: t.name })),
          query: async transaction => {
            const queryStart = now();
            const incoming = await query(Object.freeze({ ...transaction, challenge: request.challenge }));
            const queryEnd = now();
            if (!exact(incoming, ["binding", "rows", "challenge", "observedAt"])) throw Error("Readiness unavailable.");
            const bound = parse(JSON.stringify(incoming), 2_097_152);
            if (!exact(bound, ["binding", "rows", "challenge", "observedAt"]) || !same(bound.binding, expectedBinding)
              || bound.challenge !== request.challenge || !time(queryStart) || !time(queryEnd) || queryEnd < queryStart
              || queryEnd - queryStart > 60_000 || !time(bound.observedAt) || bound.observedAt < queryStart
              || bound.observedAt > queryEnd) throw Error("Readiness unavailable.");
            capturedAt = bound.observedAt;
            return bound.rows;
          } });
        const observation = await catalog();
        const observedAt = now();
        if (!observation.ok || !time(capturedAt) || !time(observedAt) || observedAt < capturedAt || reports.some(r => observedAt < (r.issuedAt as number)
          || observedAt >= (r.expiresAt as number))) throw Error("Readiness unavailable.");
        return [{ evidence_json: JSON.stringify({ version: request.version, challenge: request.challenge,
          candidateCommit: manifest.candidateCommit, observedAt: capturedAt, readOnly: true, environment: manifest.environment, offer: manifest.offer,
          inventory: { functions: observation.functions, constraints: observation.constraints, triggers: observation.triggers,
            runtimePrivileges: observation.runtimePrivileges, checks: approvedChecks.map(c => ({ id: c.id, passed: true, evidenceSha256: c.evidenceSha256 })) } }) }];
      } : null,
  });
}
