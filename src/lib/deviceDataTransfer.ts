export const deviceBackupMaxBytes = 2 * 1024 * 1024;
export const deviceBackupManifestVersion = 1;
export const officialDeviceBackupOrigins = new Set(["https://hojucompass.com", "https://www.hojucompass.com", "https://aussie-compass.vercel.app"]);

export type DeviceTransferRecord = {
  toolId: string;
  key: string;
  label: string;
  group: string;
  href: string;
  sensitive: boolean;
  schemaId: string;
  schemaVersion: number;
  parserId: string;
  parse: (raw: string) => boolean;
};

export type DeviceBackupEntry = {
  toolId: string;
  storageKey: string;
  label: string;
  schemaId: string;
  schemaVersion: number;
  parserId: string;
  bytes: number;
  sha256: string;
  value: string;
};

export type DeviceBackupDocument = {
  format: "hoju-compass-device-backup";
  version: 2;
  manifestVersion: 1;
  exportedAt: string;
  sourceOrigin: string;
  entries: DeviceBackupEntry[];
};

type LegacyDeviceBackupDocument = {
  format: "hoju-compass-device-backup";
  version: 1;
  exportedAt: string;
  sourceOrigin: string;
  entries: Record<string, string>;
};

export type DeviceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type DeviceImportMode = "preserve" | "overwrite";
type StoredValue = { key: string; label: string; value: string | null };

export type ValidatedDeviceEntry = {
  record: DeviceTransferRecord;
  value: string;
  bytes: number;
  checksum: string;
};

export type ValidatedDeviceBackup = {
  validated: true;
  sourceOrigin: string;
  exportedAt: string;
  outerVersion: 1 | 2;
  migration: "none" | "legacy_outer_v1";
  entries: ValidatedDeviceEntry[];
};

export type DeviceBackupIssue = {
  toolId: string;
  label: string;
  reason: "unknown_tool" | "metadata_mismatch" | "checksum_mismatch" | "invalid_inner_schema" | "entry_oversize";
};

export type DeviceBackupValidation =
  | { kind: "ready"; backup: ValidatedDeviceBackup }
  | { kind: "invalid_entries"; backup: ValidatedDeviceBackup; issues: DeviceBackupIssue[] }
  | { kind: "wrong_product" | "unsupported_version" | "invalid_origin" | "corrupt_or_tampered" | "oversize" | "unreadable" };

export type DeviceImportPlan = {
  mode: DeviceImportMode;
  operations: Array<{ key: string; label: string; href: string; value: string }>;
  snapshot: StoredValue[];
  importedLabels: string[];
  replacedLabels: string[];
  preservedLabels: string[];
  sourceOrigin: string;
  outerVersion: 1 | 2;
  migration: ValidatedDeviceBackup["migration"];
  replaceBackupToken: string;
};

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validIsoDate(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return false;
  try { return new Date(value).toISOString() === value; }
  catch { return false; }
}

function validOfficialOrigin(value: unknown) {
  return typeof value === "string" && officialDeviceBackupOrigins.has(value);
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function checksumInput(record: DeviceTransferRecord, value: string) {
  return JSON.stringify({
    toolId: record.toolId,
    storageKey: record.key,
    label: record.label,
    schemaId: record.schemaId,
    schemaVersion: record.schemaVersion,
    parserId: record.parserId,
    value,
  });
}

async function validatedEntry(record: DeviceTransferRecord, value: string): Promise<ValidatedDeviceEntry> {
  return { record, value, bytes: byteLength(value), checksum: await sha256(checksumInput(record, value)) };
}

export async function validateDeviceBackupText(text: string, records: DeviceTransferRecord[]): Promise<DeviceBackupValidation> {
  if (typeof text !== "string") return { kind: "unreadable" };
  if (byteLength(text) > deviceBackupMaxBytes) return { kind: "oversize" };
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { return { kind: "corrupt_or_tampered" }; }
  if (!object(parsed) || parsed.format !== "hoju-compass-device-backup") return { kind: "wrong_product" };
  if (parsed.version !== 1 && parsed.version !== 2) return { kind: "unsupported_version" };
  if (!validIsoDate(parsed.exportedAt)) return { kind: "corrupt_or_tampered" };
  if (!validOfficialOrigin(parsed.sourceOrigin)) return { kind: "invalid_origin" };

  const byKey = new Map(records.map((record) => [record.key, record]));
  const byTool = new Map(records.map((record) => [record.toolId, record]));
  const validEntries: ValidatedDeviceEntry[] = [];
  const issues: DeviceBackupIssue[] = [];

  if (parsed.version === 1) {
    const legacy = parsed as unknown as LegacyDeviceBackupDocument;
    if (!object(legacy.entries)) return { kind: "corrupt_or_tampered" };
    for (const [key, value] of Object.entries(legacy.entries)) {
      const record = byKey.get(key);
      if (!record || typeof value !== "string") {
        issues.push({ toolId: record?.toolId ?? "unknown", label: record?.label ?? "알 수 없는 도구", reason: "unknown_tool" });
        continue;
      }
      const bytes = byteLength(value);
      if (bytes > deviceBackupMaxBytes) {
        issues.push({ toolId: record.toolId, label: record.label, reason: "entry_oversize" });
        continue;
      }
      if (!record.parse(value)) {
        issues.push({ toolId: record.toolId, label: record.label, reason: "invalid_inner_schema" });
        continue;
      }
      validEntries.push(await validatedEntry(record, value));
    }
    const backup: ValidatedDeviceBackup = { validated: true, sourceOrigin: legacy.sourceOrigin, exportedAt: legacy.exportedAt, outerVersion: 1, migration: "legacy_outer_v1", entries: validEntries };
    return issues.length ? { kind: "invalid_entries", backup, issues } : { kind: "ready", backup };
  }

  const current = parsed as unknown as DeviceBackupDocument;
  if (current.manifestVersion !== deviceBackupManifestVersion || !Array.isArray(current.entries)) return { kind: "unsupported_version" };
  const seenTools = new Set<string>();
  const seenKeys = new Set<string>();
  for (const entry of current.entries) {
    if (!object(entry) || typeof entry.toolId !== "string" || typeof entry.storageKey !== "string" || typeof entry.value !== "string"
      || seenTools.has(entry.toolId) || seenKeys.has(entry.storageKey)) return { kind: "corrupt_or_tampered" };
    seenTools.add(entry.toolId); seenKeys.add(entry.storageKey);
    const record = byTool.get(entry.toolId);
    if (!record) {
      issues.push({ toolId: "unknown", label: "알 수 없는 도구", reason: "unknown_tool" });
      continue;
    }
    const metadataMatches = entry.storageKey === record.key && entry.label === record.label && entry.schemaId === record.schemaId
      && entry.schemaVersion === record.schemaVersion && entry.parserId === record.parserId && Number.isInteger(entry.bytes) && entry.bytes >= 0
      && typeof entry.sha256 === "string" && /^[a-f0-9]{64}$/.test(entry.sha256);
    if (!metadataMatches) {
      issues.push({ toolId: record.toolId, label: record.label, reason: "metadata_mismatch" });
      continue;
    }
    const bytes = byteLength(entry.value);
    if (bytes !== entry.bytes || bytes > deviceBackupMaxBytes) {
      issues.push({ toolId: record.toolId, label: record.label, reason: "entry_oversize" });
      continue;
    }
    const expected = await sha256(checksumInput(record, entry.value));
    if (expected !== entry.sha256) {
      issues.push({ toolId: record.toolId, label: record.label, reason: "checksum_mismatch" });
      continue;
    }
    if (!record.parse(entry.value)) {
      issues.push({ toolId: record.toolId, label: record.label, reason: "invalid_inner_schema" });
      continue;
    }
    validEntries.push({ record, value: entry.value, bytes, checksum: expected });
  }
  const backup: ValidatedDeviceBackup = { validated: true, sourceOrigin: current.sourceOrigin, exportedAt: current.exportedAt, outerVersion: 2, migration: "none", entries: validEntries };
  return issues.length ? { kind: "invalid_entries", backup, issues } : { kind: "ready", backup };
}

export async function createDeviceBackup(storage: DeviceStorage, selectedRecords: DeviceTransferRecord[], sourceOrigin: string, exportedAt = new Date().toISOString()) {
  if (!validOfficialOrigin(sourceOrigin)) return { kind: "invalid_origin" as const };
  const entries: DeviceBackupEntry[] = [];
  const failedLabels: string[] = [];
  const invalidLabels: string[] = [];
  for (const record of selectedRecords) {
    try {
      const value = storage.getItem(record.key);
      if (value === null) continue;
      if (!record.parse(value)) { invalidLabels.push(record.label); continue; }
      const validated = await validatedEntry(record, value);
      entries.push({ toolId: record.toolId, storageKey: record.key, label: record.label, schemaId: record.schemaId, schemaVersion: record.schemaVersion, parserId: record.parserId, bytes: validated.bytes, sha256: validated.checksum, value });
    } catch {
      failedLabels.push(record.label);
    }
  }
  if (failedLabels.length) return { kind: "read_error" as const, failedLabels };
  if (invalidLabels.length) return { kind: "invalid_record" as const, invalidLabels };
  if (!entries.length) return { kind: "empty" as const };
  const document: DeviceBackupDocument = { format: "hoju-compass-device-backup", version: 2, manifestVersion: 1, exportedAt, sourceOrigin, entries };
  let json: string;
  try { json = JSON.stringify(document, null, 2); }
  catch { return { kind: "serialise_error" as const }; }
  const bytes = byteLength(json);
  if (bytes > deviceBackupMaxBytes) return { kind: "too_large" as const, bytes };
  return { kind: "ready" as const, document, json, bytes, count: entries.length };
}

export function prepareDeviceImport(storage: DeviceStorage, backup: ValidatedDeviceBackup, mode: DeviceImportMode) {
  if (backup.validated !== true) return { kind: "invalid_backup" as const };
  const snapshot: StoredValue[] = [];
  const failedLabels: string[] = [];
  for (const entry of backup.entries) {
    try { snapshot.push({ key: entry.record.key, label: entry.record.label, value: storage.getItem(entry.record.key) }); }
    catch { failedLabels.push(entry.record.label); }
  }
  if (failedLabels.length) return { kind: "read_error" as const, failedLabels };

  const operations: DeviceImportPlan["operations"] = [];
  const importedLabels: string[] = [];
  const replacedLabels: string[] = [];
  const preservedLabels: string[] = [];
  for (const current of snapshot) {
    const entry = backup.entries.find((item) => item.record.key === current.key)!;
    if (mode === "preserve" && current.value !== null) {
      preservedLabels.push(current.label);
      continue;
    }
    operations.push({ key: current.key, label: current.label, href: entry.record.href, value: entry.value });
    (current.value === null ? importedLabels : replacedLabels).push(current.label);
  }
  const replaceBackupToken = replacedLabels.length ? operations.filter((item) => replacedLabels.includes(item.label)).map((item) => item.key).sort().join("|") : "";
  const plan: DeviceImportPlan = { mode, operations, snapshot, importedLabels, replacedLabels, preservedLabels, sourceOrigin: backup.sourceOrigin, outerVersion: backup.outerVersion, migration: backup.migration, replaceBackupToken };
  return { kind: "ready" as const, plan };
}

export type ReplaceApplyGuard = { currentBackupToken: string; plaintextReviewed: boolean; replaceConfirmed: boolean };

export function applyDeviceImport(storage: DeviceStorage, plan: DeviceImportPlan, guard?: ReplaceApplyGuard) {
  if (plan.mode === "overwrite" && plan.replacedLabels.length && (!guard || guard.currentBackupToken !== plan.replaceBackupToken || !guard.plaintextReviewed || !guard.replaceConfirmed)) return { kind: "blocked_replace_backup" as const };
  const attempted: string[] = [];
  try {
    for (const operation of plan.operations) {
      attempted.push(operation.key);
      storage.setItem(operation.key, operation.value);
      if (storage.getItem(operation.key) !== operation.value) throw new Error("write-readback");
    }
    return { kind: "success" as const, imported: plan.operations.length, preserved: plan.preservedLabels.length, hrefs: [...new Set(plan.operations.map((item) => item.href))] };
  } catch {
    const originalByKey = new Map(plan.snapshot.map((item) => [item.key, item]));
    const rollbackLabels: string[] = [];
    for (const key of [...attempted].reverse()) {
      const original = originalByKey.get(key);
      if (!original) continue;
      try {
        if (original.value === null) storage.removeItem(key);
        else storage.setItem(key, original.value);
        if (storage.getItem(key) !== original.value) throw new Error("rollback-readback");
      } catch {
        rollbackLabels.push(original.label);
      }
    }
    return rollbackLabels.length ? { kind: "rollback_failed" as const, rollbackLabels } : { kind: "rolled_back" as const };
  }
}

export function clearDeviceRecord(storage: DeviceStorage, record: Pick<DeviceTransferRecord, "key" | "label">) {
  let before: string | null;
  try { before = storage.getItem(record.key); }
  catch { return { kind: "read_error" as const, label: record.label }; }
  if (before === null) return { kind: "missing" as const, label: record.label };
  try {
    storage.removeItem(record.key);
    if (storage.getItem(record.key) !== null) return { kind: "delete_failed" as const, label: record.label };
    return { kind: "removed" as const, label: record.label };
  } catch {
    return { kind: "delete_failed" as const, label: record.label };
  }
}
