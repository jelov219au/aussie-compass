export const deviceBackupMaxBytes = 2 * 1024 * 1024;

export type DeviceTransferRecord = {
  key: string;
  label: string;
};

export type DeviceBackupDocument = {
  format: "hoju-compass-device-backup";
  version: 1;
  exportedAt: string;
  sourceOrigin: string;
  entries: Record<string, string>;
};

export type DeviceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type DeviceImportMode = "preserve" | "overwrite";

type StoredValue = { key: string; label: string; value: string | null };

export type DeviceImportPlan = {
  mode: DeviceImportMode;
  operations: Array<{ key: string; label: string; value: string }>;
  snapshot: StoredValue[];
  importedLabels: string[];
  replacedLabels: string[];
  preservedLabels: string[];
};

function validOrigin(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  } catch {
    return false;
  }
}

function validIsoDate(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return false;
  try { return new Date(value).toISOString() === value; }
  catch { return false; }
}

export function isDeviceBackupDocument(value: unknown, allowedKeys: ReadonlySet<string>): value is DeviceBackupDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DeviceBackupDocument>;
  if (candidate.format !== "hoju-compass-device-backup" || candidate.version !== 1) return false;
  if (!validIsoDate(candidate.exportedAt) || !validOrigin(candidate.sourceOrigin)) return false;
  if (!candidate.entries || typeof candidate.entries !== "object" || Array.isArray(candidate.entries)) return false;
  return Object.entries(candidate.entries).every(([key, entry]) => allowedKeys.has(key) && typeof entry === "string");
}

export function createDeviceBackup(
  storage: DeviceStorage,
  selectedRecords: DeviceTransferRecord[],
  sourceOrigin: string,
  exportedAt = new Date().toISOString(),
) {
  const entries: Record<string, string> = {};
  const failedLabels: string[] = [];
  for (const record of selectedRecords) {
    try {
      const value = storage.getItem(record.key);
      if (value !== null) entries[record.key] = value;
    } catch {
      failedLabels.push(record.label);
    }
  }
  if (failedLabels.length) return { kind: "read_error" as const, failedLabels };
  if (!Object.keys(entries).length) return { kind: "empty" as const };

  const document: DeviceBackupDocument = {
    format: "hoju-compass-device-backup",
    version: 1,
    exportedAt,
    sourceOrigin,
    entries,
  };
  let json: string;
  try { json = JSON.stringify(document, null, 2); }
  catch { return { kind: "serialise_error" as const }; }
  const bytes = new TextEncoder().encode(json).byteLength;
  if (bytes > deviceBackupMaxBytes) return { kind: "too_large" as const, bytes };
  return { kind: "ready" as const, document, json, bytes, count: Object.keys(entries).length };
}

export function prepareDeviceImport(
  storage: DeviceStorage,
  document: DeviceBackupDocument,
  mode: DeviceImportMode,
  records: DeviceTransferRecord[],
) {
  const byKey = new Map(records.map((record) => [record.key, record]));
  const snapshot: StoredValue[] = [];
  const failedLabels: string[] = [];
  for (const key of Object.keys(document.entries)) {
    const record = byKey.get(key);
    if (!record) continue;
    try { snapshot.push({ key, label: record.label, value: storage.getItem(key) }); }
    catch { failedLabels.push(record.label); }
  }
  if (failedLabels.length) return { kind: "read_error" as const, failedLabels };

  const operations: DeviceImportPlan["operations"] = [];
  const importedLabels: string[] = [];
  const replacedLabels: string[] = [];
  const preservedLabels: string[] = [];
  for (const current of snapshot) {
    if (mode === "preserve" && current.value !== null) {
      preservedLabels.push(current.label);
      continue;
    }
    operations.push({ key: current.key, label: current.label, value: document.entries[current.key] });
    (current.value === null ? importedLabels : replacedLabels).push(current.label);
  }
  return { kind: "ready" as const, plan: { mode, operations, snapshot, importedLabels, replacedLabels, preservedLabels } satisfies DeviceImportPlan };
}

export function applyDeviceImport(storage: DeviceStorage, plan: DeviceImportPlan) {
  const attempted: string[] = [];
  try {
    for (const operation of plan.operations) {
      attempted.push(operation.key);
      storage.setItem(operation.key, operation.value);
      if (storage.getItem(operation.key) !== operation.value) throw new Error("write-readback");
    }
    return { kind: "success" as const, imported: plan.operations.length, preserved: plan.preservedLabels.length };
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
    return rollbackLabels.length
      ? { kind: "rollback_failed" as const, rollbackLabels }
      : { kind: "rolled_back" as const };
  }
}

export function clearDeviceRecord(storage: DeviceStorage, record: DeviceTransferRecord) {
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
