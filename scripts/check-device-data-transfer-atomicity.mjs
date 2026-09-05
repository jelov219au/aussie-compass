import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { carPurchaseStorageKey } from "../src/lib/carPurchasePro.ts";
import {
  applyDeviceImport,
  clearDeviceRecord,
  createDeviceBackup,
  deviceBackupMaxBytes,
  isDeviceBackupDocument,
  prepareDeviceImport,
} from "../src/lib/deviceDataTransfer.ts";

class MemoryStorage {
  constructor(entries = [], hooks = {}) { this.map = new Map(entries); this.hooks = hooks; this.setCalls = 0; }
  getItem(key) { if (this.hooks.get?.(key)) throw new Error("read blocked"); return this.map.get(key) ?? null; }
  setItem(key, value) { this.setCalls += 1; if (this.hooks.set?.(key, value, this.setCalls)) throw new Error("write blocked"); if (!this.hooks.drop?.(key, value, this.setCalls)) this.map.set(key, value); }
  removeItem(key) { if (this.hooks.remove?.(key)) throw new Error("remove blocked"); this.map.delete(key); }
}

const records = [
  { key: "record-a", label: "기록 A" },
  { key: "record-b", label: "기록 B" },
  { key: carPurchaseStorageKey, label: "중고차 구매 점검 패키지" },
];
const allowed = new Set(records.map(({ key }) => key));
const now = "2026-09-05T04:40:00.000Z";

const exactCarRaw = '{"cars":[{"id":"car-1","note":"검사 🚙  원문  공백"}],"unknownFutureField":{"keep":true}}';
const exportStorage = new MemoryStorage([[carPurchaseStorageKey, exactCarRaw], ["record-a", "A"]]);
const exported = createDeviceBackup(exportStorage, records, "https://hojucompass.com", now);
assert.equal(exported.kind, "ready");
assert.equal(exported.document.entries[carPurchaseStorageKey], exactCarRaw, "Car reusable draft must round-trip as exact wrapper bytes");
assert.equal(exported.bytes, new TextEncoder().encode(exported.json).byteLength, "backup size must use UTF-8 bytes, including emoji");
assert.equal(isDeviceBackupDocument(JSON.parse(exported.json), allowed), true);
for (const invalid of [
  { ...exported.document, exportedAt: "not-a-date" },
  { ...exported.document, sourceOrigin: "javascript:alert(1)" },
  { ...exported.document, sourceOrigin: "https://hojucompass.com/path" },
  { ...exported.document, entries: { "activation-key": "secret" } },
]) assert.equal(isDeviceBackupDocument(invalid, allowed), false, "invalid metadata or disallowed keys must fail closed");

const blockedRead = createDeviceBackup(new MemoryStorage([["record-a", "A"], ["record-b", "B"]], { get: (key) => key === "record-b" }), records.slice(0, 2), "https://hojucompass.com", now);
assert.deepEqual(blockedRead, { kind: "read_error", failedLabels: ["기록 B"] }, "one read failure must prevent a partial normal backup");

let low = 0;
let high = deviceBackupMaxBytes;
while (low + 1 < high) {
  const middle = Math.floor((low + high) / 2);
  const candidate = createDeviceBackup(new MemoryStorage([["record-a", "x".repeat(middle)]]), records.slice(0, 1), "https://hojucompass.com", now);
  if (candidate.kind === "ready") low = middle;
  else high = middle;
}
assert.equal(createDeviceBackup(new MemoryStorage([["record-a", "x".repeat(low)]]), records.slice(0, 1), "https://hojucompass.com", now).kind, "ready", "largest in-limit UTF-8 backup should be restorable");
assert.equal(createDeviceBackup(new MemoryStorage([["record-a", "x".repeat(high)]]), records.slice(0, 1), "https://hojucompass.com", now).kind, "too_large", "first over-limit backup should be refused without truncation");

const incoming = exported.document;
const preserveStorage = new MemoryStorage([["record-a", "CURRENT"]]);
const preserve = prepareDeviceImport(preserveStorage, incoming, "preserve", records);
assert.equal(preserve.kind, "ready");
assert.deepEqual(preserve.plan.preservedLabels, ["기록 A"]);
assert.deepEqual(preserve.plan.importedLabels, ["중고차 구매 점검 패키지"]);
assert.equal(preserveStorage.getItem("record-a"), "CURRENT", "preview must not mutate an existing byte");
assert.equal(preserveStorage.getItem(carPurchaseStorageKey), null, "preview must not apply a missing byte");
assert.deepEqual(applyDeviceImport(preserveStorage, preserve.plan), { kind: "success", imported: 1, preserved: 1 });
assert.equal(preserveStorage.getItem(carPurchaseStorageKey), exactCarRaw);

const overwriteStorage = new MemoryStorage([["record-a", "OLD-A"], ["record-b", "OLD-B"]]);
const overwriteDoc = { ...incoming, entries: { "record-a": "NEW-A", "record-b": "NEW-B", [carPurchaseStorageKey]: exactCarRaw } };
const overwrite = prepareDeviceImport(overwriteStorage, overwriteDoc, "overwrite", records);
assert.equal(overwrite.kind, "ready");
assert.deepEqual([...overwriteStorage.map.entries()], [["record-a", "OLD-A"], ["record-b", "OLD-B"]], "overwrite preview cancellation must leave every byte unchanged");

const thirdWriteFails = new MemoryStorage([["record-a", "OLD-A"], ["record-b", "OLD-B"]], { set: (_key, _value, call) => call === 3 });
const thirdPlan = prepareDeviceImport(thirdWriteFails, overwriteDoc, "overwrite", records);
assert.equal(thirdPlan.kind, "ready");
assert.deepEqual(applyDeviceImport(thirdWriteFails, thirdPlan.plan), { kind: "rolled_back" });
assert.deepEqual([...thirdWriteFails.map.entries()], [["record-a", "OLD-A"], ["record-b", "OLD-B"]], "third-write failure must restore all original bytes");

const rollbackFails = new MemoryStorage([["record-a", "OLD-A"], ["record-b", "OLD-B"]], { set: (key, _value, call) => call === 3 || (key === "record-b" && call > 3) });
const rollbackPlan = prepareDeviceImport(rollbackFails, overwriteDoc, "overwrite", records);
assert.equal(rollbackPlan.kind, "ready");
assert.deepEqual(applyDeviceImport(rollbackFails, rollbackPlan.plan), { kind: "rollback_failed", rollbackLabels: ["기록 B"] }, "rollback failure must expose labels only");

const readbackMismatch = new MemoryStorage([["record-a", "OLD-A"], ["record-b", "OLD-B"]], { drop: (key, value) => key === "record-b" && value === "NEW-B" });
const mismatchPlan = prepareDeviceImport(readbackMismatch, overwriteDoc, "overwrite", records);
assert.equal(mismatchPlan.kind, "ready");
assert.deepEqual(applyDeviceImport(readbackMismatch, mismatchPlan.plan), { kind: "rolled_back" }, "write read-back mismatch must roll back");
assert.deepEqual([...readbackMismatch.map.entries()], [["record-a", "OLD-A"], ["record-b", "OLD-B"]]);

const readBlockedImport = prepareDeviceImport(new MemoryStorage([["record-b", "OLD"]], { get: (key) => key === "record-b" }), overwriteDoc, "preserve", records);
assert.deepEqual(readBlockedImport, { kind: "read_error", failedLabels: ["기록 B"] });

const otherKeys = [["aussie-compass-vehicle-comparison-v1", "FREE"], ["car-activation", "ACCESS"], ["car-recovery", "RECOVERY"], ["record-a", "OTHER"]];
const carDeleteStorage = new MemoryStorage([[carPurchaseStorageKey, exactCarRaw], ...otherKeys]);
assert.deepEqual(clearDeviceRecord(carDeleteStorage, records[2]), { kind: "removed", label: "중고차 구매 점검 패키지" });
assert.deepEqual([...carDeleteStorage.map.entries()], otherKeys, "Car purge must leave free comparison, access/recovery and other records byte-identical");
assert.deepEqual(clearDeviceRecord(carDeleteStorage, records[2]), { kind: "missing", label: "중고차 구매 점검 패키지" });
assert.equal(clearDeviceRecord(new MemoryStorage([[carPurchaseStorageKey, exactCarRaw]], { get: () => true }), records[2]).kind, "read_error");
assert.equal(clearDeviceRecord(new MemoryStorage([[carPurchaseStorageKey, exactCarRaw]], { remove: () => true }), records[2]).kind, "delete_failed");

const component = await readFile(new URL("../src/components/tools/DeviceDataTransfer.tsx", import.meta.url), "utf8");
const recordList = component.slice(component.indexOf("const storedRecords"), component.indexOf("const allowedKeys"));
assert.ok(recordList.includes("carPurchaseStorageKey") && recordList.includes("중고차 구매 점검 패키지"));
assert.doesNotMatch(recordList, /activation|recovery|access|nonce|entitlement/, "access and recovery keys must stay outside the device backup allowlist");
assert.match(component, /const selectedMode = mode/);
assert.match(component, /generation !== importGenerationRef\.current/);
assert.match(component, /applyDeviceImport[\s\S]*window\.dispatchEvent\(new Event\("storage"\)\)/);
assert.match(component, /백업 다운로드를 요청했습니다/);
assert.doesNotMatch(component, /백업 파일로 저장했습니다/);
assert.match(component, /전체 백업 JSON/);

console.log("WEB45 device backup atomicity, byte limit and Car draft contract passed.");
