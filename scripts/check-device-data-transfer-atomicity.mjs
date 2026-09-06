import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyDeviceImport,
  createDeviceBackup,
  deviceBackupMaxBytes,
  prepareDeviceImport,
  officialDeviceBackupOrigins,
  validateDeviceBackupText,
} from "../src/lib/deviceDataTransfer.ts";

class MemoryStorage {
  constructor(entries = [], hooks = {}) { this.map = new Map(entries); this.hooks = hooks; this.setCalls = 0; }
  getItem(key) { if (this.hooks.get?.(key)) throw new Error("read blocked"); return this.map.get(key) ?? null; }
  setItem(key, value) { this.setCalls += 1; if (this.hooks.set?.(key, value, this.setCalls)) throw new Error("write blocked"); if (!this.hooks.drop?.(key, value, this.setCalls)) this.map.set(key, value); }
  removeItem(key) { if (this.hooks.remove?.(key)) throw new Error("remove blocked"); this.map.delete(key); }
}

const record = (toolId, key, label, root) => ({ toolId, key, label, group: "test", href: `/${toolId}`, sensitive: false, schemaId: `hoju-compass/${toolId}`, schemaVersion: 1, parserId: `${toolId}-v1`, parse: (raw) => { try { const value = JSON.parse(raw); return root === "array" ? Array.isArray(value) : Boolean(value) && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.checked) && typeof value.targetDate === "string"; } catch { return false; } } });
const records = [record("visa-preparation-project", "visa-preparation-project", "비자 신청 준비", "object"), record("bookmarks", "aussie-compass-bookmarks-v1", "저장한 페이지", "array")];
const manifestSource = await readFile(new URL("../src/data/deviceTransferManifest.ts", import.meta.url), "utf8");
const manifestEntries = [...manifestSource.matchAll(/^\s*record\("([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({ toolId: match[1], key: match[2] }));
assert.equal(manifestEntries.length, 34, "the transferable registry must keep the audited 34-tool scope");
assert.equal(new Set(manifestEntries.map((item) => item.toolId)).size, 34, "tool IDs must be unique");
assert.equal(new Set(manifestEntries.map((item) => item.key)).size, 34, "storage keys must be unique");
assert.match(manifestSource, /schemaId: `hoju-compass\/\$\{toolId\}`[\s\S]*schemaVersion[\s\S]*parserId[\s\S]*parse/);
assert.deepEqual([...officialDeviceBackupOrigins].sort(), ["https://aussie-compass.vercel.app", "https://hojucompass.com", "https://www.hojucompass.com"].sort());
assert.doesNotMatch(manifestEntries.map((item) => item.key).join("\n"), /activation|recovery|access|nonce|entitlement|push/i);

const visa = records.find((item) => item.toolId === "visa-preparation-project");
const bookmarks = records.find((item) => item.toolId === "bookmarks");
assert.ok(visa && bookmarks);
const oldVisa = JSON.stringify({ checked: ["finder"], targetDate: "2026-09-30" });
const newVisa = JSON.stringify({ checked: ["finder", "documents"], targetDate: "2026-10-01" });
const bookmarkRaw = "[]";
const now = "2026-09-07T04:40:00.000Z";

const exported = await createDeviceBackup(new MemoryStorage([[visa.key, newVisa], [bookmarks.key, bookmarkRaw]]), [visa, bookmarks], "https://hojucompass.com", now);
assert.equal(exported.kind, "ready");
assert.equal(exported.document.version, 2);
assert.equal(exported.document.entries.length, 2);
assert.ok(exported.document.entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256) && entry.bytes === new TextEncoder().encode(entry.value).byteLength));
assert.equal((await validateDeviceBackupText(exported.json, records)).kind, "ready", "valid v2 export must pass every dry-run parser and checksum");

for (const sourceOrigin of ["http://hojucompass.com", "https://example.com", "https://hojucompass.com/path"]) {
  const wrongOrigin = { ...exported.document, sourceOrigin };
  assert.equal((await validateDeviceBackupText(JSON.stringify(wrongOrigin), records)).kind, "invalid_origin");
}
assert.equal((await validateDeviceBackupText(JSON.stringify({ ...exported.document, format: "other-product" }), records)).kind, "wrong_product");
assert.equal((await validateDeviceBackupText(JSON.stringify({ ...exported.document, version: 99 }), records)).kind, "unsupported_version");
assert.equal((await validateDeviceBackupText("{broken", records)).kind, "corrupt_or_tampered");
assert.equal((await validateDeviceBackupText("x".repeat(deviceBackupMaxBytes + 1), records)).kind, "oversize");

const tampered = structuredClone(exported.document);
tampered.entries[0].value = oldVisa;
const tamperedResult = await validateDeviceBackupText(JSON.stringify(tampered), records);
assert.equal(tamperedResult.kind, "invalid_entries");
assert.equal(tamperedResult.issues[0].reason, "entry_oversize", "byte metadata changes are detected before checksum");
assert.equal(tamperedResult.backup.entries.length, 1, "a failed entry stays excluded until a new preview");

const invalidInnerExport = structuredClone(exported.document);
invalidInnerExport.entries[0].value = "{}";
invalidInnerExport.entries[0].bytes = 2;
invalidInnerExport.entries[0].sha256 = exported.document.entries[0].sha256;
assert.equal((await validateDeviceBackupText(JSON.stringify(invalidInnerExport), records)).kind, "invalid_entries");

const duplicate = structuredClone(exported.document);
duplicate.entries.push(structuredClone(duplicate.entries[0]));
assert.equal((await validateDeviceBackupText(JSON.stringify(duplicate), records)).kind, "corrupt_or_tampered", "duplicate tool IDs and keys fail closed");

const legacy = { format: "hoju-compass-device-backup", version: 1, exportedAt: now, sourceOrigin: "https://aussie-compass.vercel.app", entries: { [visa.key]: oldVisa } };
const legacyResult = await validateDeviceBackupText(JSON.stringify(legacy), records);
assert.equal(legacyResult.kind, "ready");
assert.equal(legacyResult.backup.migration, "legacy_outer_v1");
assert.equal(legacyResult.backup.entries[0].value, oldVisa, "legacy value remains byte-identical after dry-run migration");

const invalidLegacyStorage = new MemoryStorage();
const invalidLegacy = { ...legacy, entries: { [visa.key]: "{}" } };
const invalidLegacyResult = await validateDeviceBackupText(JSON.stringify(invalidLegacy), records);
assert.equal(invalidLegacyResult.kind, "invalid_entries");
assert.equal(invalidLegacyStorage.setCalls, 0, "an invalid selected tool produces default no-write");

const validated = await validateDeviceBackupText(exported.json, records);
assert.equal(validated.kind, "ready");
const preserveStorage = new MemoryStorage([[visa.key, oldVisa]]);
const preserve = prepareDeviceImport(preserveStorage, validated.backup, "preserve");
assert.equal(preserve.kind, "ready");
assert.deepEqual(preserve.plan.preservedLabels, [visa.label]);
assert.deepEqual(preserve.plan.importedLabels, [bookmarks.label]);
assert.equal(preserveStorage.getItem(visa.key), oldVisa, "preview never changes current storage");
assert.equal(applyDeviceImport(preserveStorage, preserve.plan).kind, "success");
assert.equal(preserveStorage.getItem(visa.key), oldVisa, "preserve is a whole-tool skip, not a field merge");

const replaceStorage = new MemoryStorage([[visa.key, oldVisa]]);
const replace = prepareDeviceImport(replaceStorage, validated.backup, "overwrite");
assert.equal(replace.kind, "ready");
assert.equal(applyDeviceImport(replaceStorage, replace.plan).kind, "blocked_replace_backup");
assert.equal(replaceStorage.setCalls, 0, "replace without a matching current-backup token must write nothing");
assert.equal(applyDeviceImport(replaceStorage, replace.plan, { currentBackupToken: replace.plan.replaceBackupToken, plaintextReviewed: true, replaceConfirmed: true }).kind, "success");
assert.equal(replaceStorage.getItem(visa.key), newVisa);

const rollbackStorage = new MemoryStorage([[visa.key, oldVisa]], { set: (_key, _value, call) => call === 2 });
const rollbackPlan = prepareDeviceImport(rollbackStorage, validated.backup, "overwrite");
assert.equal(rollbackPlan.kind, "ready");
assert.equal(applyDeviceImport(rollbackStorage, rollbackPlan.plan, { currentBackupToken: rollbackPlan.plan.replaceBackupToken, plaintextReviewed: true, replaceConfirmed: true }).kind, "rolled_back");
assert.equal(rollbackStorage.getItem(visa.key), oldVisa, "failed multi-write import restores the prior exact value");

const blockedRead = await createDeviceBackup(new MemoryStorage([[visa.key, oldVisa]], { get: () => true }), [visa], "https://hojucompass.com", now);
assert.equal(blockedRead.kind, "read_error");
assert.equal((await createDeviceBackup(new MemoryStorage([[visa.key, "{}"]]), [visa], "https://hojucompass.com", now)).kind, "invalid_record");

const component = await readFile(new URL("../src/components/tools/DeviceDataTransfer.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/app/data-transfer/page.tsx", import.meta.url), "utf8");
for (const field of ["selected_tool_scope", "sensitivity_reviewed", "backup_export_result", "import_preview_result", "conflict_decision", "recovery_fallback", "next_action"]) assert.match(component, new RegExp(`${field}:`));
assert.match(component, /useState<string\[\]>\(\[\]\)/, "first load must select zero tools");
assert.doesNotMatch(component, /setSelected\(saved\)/, "refresh must not auto-select every discovered record");
assert.match(component, /setSelected\(\(current\) => current\.filter\(\(key\) => saved\.includes\(key\)\)\)/, "refresh may only retain an explicit selection");
assert.match(component, /download_requested_unverified/);
assert.doesNotMatch(component, /파일로 저장했습니다|저장을 완료했습니다/);
assert.match(component, /전체 유지[\s\S]*field merge가 아닙니다/);
assert.match(component, /문제 항목 제외하고 새 미리보기/);
assert.match(component, /교체 대상 현재 백업 다운로드 요청/);
assert.match(component, /추가 가져오기·삭제를 멈추고/);
assert.ok(page.indexOf("<DeviceDataTransfer") > page.indexOf("<h1") && !page.includes("transfer-order-heading"), "the memory-only next action component must follow the H1 directly");
assert.doesNotMatch(component, /@vercel\/analytics|sendBeacon|XMLHttpRequest|\bfetch\s*\(/, "raw backup decisions must remain local and analytics-free");

console.log("DATA_TRANSFER_PHASE1=PASS manifest=34 origin=official dry-run=all replace-guard=PASS rollback=PASS");
