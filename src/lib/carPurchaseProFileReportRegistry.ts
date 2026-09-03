import "server-only";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { carReadinessCheckIds } from "./carPurchaseProReadinessEvidence";
import type { CarReadinessReportReader } from "./carPurchaseProReadinessEnvelope";

type Row = Record<string, unknown>;
const unavailable = () => new Error("Report registry unavailable.");
const exact = (v: unknown, keys: string[]): v is Row => !!v && typeof v === "object" && !Array.isArray(v)
  && Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
const sha = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const timestamp = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const active = (signal: AbortSignal) => { if (!signal || signal.aborted) throw unavailable(); };
function json(bytes: Buffer): unknown {
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes)) throw unavailable();
  return JSON.parse(text);
}
async function directory(path: string, signal: AbortSignal) {
  active(signal);
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink() || await realpath(path) !== path) throw unavailable();
  active(signal);
}
async function readBounded(path: string, limit: number, signal: AbortSignal): Promise<Buffer> {
  active(signal);
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink() || before.size > limit) throw unavailable();
  active(signal);
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    active(signal);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size > limit) throw unavailable();
    // The inclusive end permits one extra byte, detecting growth without an
    // unbounded readFile allocation. AbortSignal destroys this request's stream.
    const stream = handle.createReadStream({ start: 0, end: limit, highWaterMark: 65_536, signal, autoClose: false });
    const chunks: Buffer[] = [];
    let length = 0;
    try {
      for await (const chunk of stream) {
        active(signal);
        length += chunk.length;
        if (length > limit) throw unavailable();
        chunks.push(chunk);
      }
    } finally { stream.destroy(); }
    active(signal);
    return Buffer.concat(chunks, length);
  } finally { await handle.close(); }
}

// Offline/server filesystem adapter only. The absolute directory and approved
// index pin come from trusted deployment configuration, never an HTTP request.
// No index is self-approved here; no report is signed or interpreted as execution.
export function createCarFileReportRegistry(deps: {
  directory: unknown; approvedIndexSha256: unknown; now?: () => number;
}): CarReadinessReportReader {
  const root = typeof deps.directory === "string" && isAbsolute(deps.directory) ? resolve(deps.directory) : null;
  const pin = deps.approvedIndexSha256, now = deps.now ?? Date.now;
  return async (id, signal) => {
    try {
      active(signal);
      if (!root || !sha(pin) || !(carReadinessCheckIds as readonly string[]).includes(id)) throw unavailable();
      const reportDirectory = join(root, "reports"), artifactDirectory = join(root, "artifacts");
      await directory(root, signal);
      await directory(reportDirectory, signal);
      await directory(artifactDirectory, signal);
      const indexPath = join(root, "index.json"), indexBytes = await readBounded(indexPath, 16_384, signal);
      if (hash(indexBytes) !== pin) throw unavailable();
      const index = json(indexBytes);
      if (!exact(index, ["version", "approvedAt", "expiresAt", "reports"]) || index.version !== "car-report-registry-v1"
        || !timestamp(index.approvedAt) || !timestamp(index.expiresAt) || index.expiresAt <= index.approvedAt
        || !Array.isArray(index.reports) || index.reports.length !== carReadinessCheckIds.length) throw unavailable();
      const reports = index.reports;
      if (!reports.every(r => exact(r, ["id", "reportSha256", "artifactSha256"])
        && (carReadinessCheckIds as readonly unknown[]).includes(r.id) && sha(r.reportSha256) && sha(r.artifactSha256))
        || new Set(reports.map(r => r.id)).size !== carReadinessCheckIds.length) throw unavailable();
      const approvedAt = index.approvedAt, expiresAt = index.expiresAt;
      const checkTime = () => {
        const at = now();
        if (!timestamp(at) || at < approvedAt || at >= expiresAt) throw unavailable();
      };
      checkTime();
      const entry = reports.find(r => r.id === id)!;
      const wire = json(await readBounded(join(reportDirectory, id + ".json"), 131_072, signal));
      if (!exact(wire, ["reportJson", "signature", "issuerKeyId"]) || typeof wire.reportJson !== "string"
        || Buffer.byteLength(wire.reportJson, "utf8") > 65_536 || typeof wire.signature !== "string"
        || typeof wire.issuerKeyId !== "string" || !/^[a-z][a-z0-9_-]{0,62}$/.test(wire.issuerKeyId)) throw unavailable();
      const bytes = Buffer.from(wire.reportJson, "utf8");
      if (bytes.toString("utf8") !== wire.reportJson || hash(bytes) !== entry.reportSha256) throw unavailable();
      const signature = Buffer.from(wire.signature, "base64");
      if (signature.length !== 64 || signature.toString("base64") !== wire.signature) throw unavailable();
      const report = json(bytes);
      if (!report || typeof report !== "object" || Array.isArray(report)) throw unavailable();
      const descriptor = report as Row;
      if (descriptor.id !== id || descriptor.issuerKeyId !== wire.issuerKeyId || descriptor.artifactSha256 !== entry.artifactSha256) throw unavailable();
      const artifact = await readBounded(join(artifactDirectory, entry.artifactSha256 + ".json"), 2_097_152, signal);
      if (hash(artifact) !== entry.artifactSha256) throw unavailable();
      // Fresh read: a changed/withdrawn index during artifact I/O fails closed.
      if (hash(await readBounded(indexPath, 16_384, signal)) !== pin) throw unavailable();
      await directory(root, signal);
      await directory(reportDirectory, signal);
      await directory(artifactDirectory, signal);
      checkTime();
      active(signal);
      // The envelope remains responsible for trusted-key signatures, exact report
      // schema, manifest pins, identity and expiry. Artifact bytes never escape.
      return { reportJson: wire.reportJson, signature: wire.signature, issuerKeyId: wire.issuerKeyId };
    } catch { throw unavailable(); }
  };
}
