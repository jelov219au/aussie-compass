import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";

import { isRentalWorkspaceBackup } from "../src/lib/rentalWorkspaceBackup.ts";
import { writeRentalWorkspace } from "../src/lib/rentalApplicationProDeviceStorage.ts";

const workspace = (await readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const publicPage = await readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8");
const printStyles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const jurisdictions = await readFile(new URL("../src/data/rentalJurisdictions.ts", import.meta.url), "utf8");

const contracts = [
  [workspace.includes('version: 3'), "versioned local workspace"],
  [workspace.includes('parsed.version === 2') && workspace.includes('coverNote'), "legacy v1 and v2 migration"],
  [workspace.includes('MAX_APPLICATIONS = 20'), "bounded multi-property tracker"],
  [workspace.includes('Reusable profile') && workspace.includes('privacyChecks'), "reusable profile and privacy checklist"],
  [workspace.includes('Reusable evidence') && workspace.includes('checkedOn') && workspace.includes('applyReusableEvidence'), "dated reusable evidence library"],
  [workspace.includes('followUps:') && workspace.includes('addFollowUp') && workspace.includes('FOLLOW-UP LOG'), "property-isolated follow-up history"],
  [workspace.includes('const copy = createApplication(id, `집 후보') && workspace.includes('이전 집의 주소·문구·제출 상태·연락 기록은 안전을 위해 복사하지 않았습니다'), "safe property-condition duplication"],
  [workspace.includes('application:') && workspace.includes('inspection:') && workspace.includes('followUp:'), "three message templates"],
  [workspace.includes('application-pack.txt') && workspace.includes('private-package.json') && workspace.includes('application/json;charset=utf-8'), "per-property package and whole-workspace exports"],
  [workspace.includes('restoreBackup') && workspace.includes('백업 복원') && workspace.includes('isRentalWorkspaceBackup(candidate, MAX_APPLICATIONS)'), "validated whole-workspace restore"],
  [workspace.includes('file.size > 1_000_000'), "bounded local backup restore"],
  [workspace.includes('nextActionStatus') && workspace.includes('일 지남') && workspace.includes('다음 행동 ·'), "relative due-action warnings"],
  [workspace.includes('activeJurisdiction') && jurisdictions.includes('["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]'), "eight-jurisdiction official guidance"],
  [workspace.includes('min-h-11 min-w-11') && !workspace.includes('min-h-10'), "mobile-sized action controls"],
  [workspace.includes('id="rental-application-print"') && printStyles.includes('#rental-application-print'), "print-to-PDF output"],
  [printStyles.includes('body:has(#rental-application-print)') && printStyles.includes('position: static'), "isolated print layout without retained hidden pages"],
  [publicPage.includes('결제 미오픈') && publicPage.includes('최대 20개 집 후보'), "honest pre-sale public copy"],
];

const failed = contracts.filter(([passed]) => !passed);
if (failed.length) {
  for (const [, name] of failed) console.error(`FAIL: ${name}`);
  process.exit(1);
}

for (const [, name] of contracts) console.log(`PASS: ${name}`);

const validBackup = {
  version: 3,
  profile: { householdSize: "1", employmentSummary: "", rentalSummary: "", petSummary: "No pets", strengths: "" },
  evidenceLibrary: { identity: { status: "ready", checkedOn: "2026-08-29" } },
  activeId: "candidate-1",
  applications: [{
    id: "candidate-1", propertyLabel: "Carlton candidate", suburb: "Carlton", jurisdiction: "VIC", weeklyRent: "620", agentName: "", moveDate: "", leaseTerm: "12 months", stage: "preparing", applicationDate: "", nextActionDate: "", notes: "",
    statuses: { identity: "ready" }, privacyChecks: { "no-tfn": true }, messages: { application: "Draft", inspection: "", followUp: "" }, followUps: [], inspectionReceipt: null,
  }],
};
assert.equal(isRentalWorkspaceBackup(validBackup), true, "an exported Rental workspace shape must restore");
assert.equal(isRentalWorkspaceBackup({ version: 3, applications: [{}] }), false, "an unrelated version-shaped JSON file must not replace the workspace");
assert.equal(isRentalWorkspaceBackup({ version: 3, applications: [{ id: "unrelated" }] }), false, "an id alone must not impersonate a current Rental backup");
assert.equal(isRentalWorkspaceBackup({ ...validBackup, version: 2 }), true, "a structurally valid v2 backup must remain restorable");
assert.equal(isRentalWorkspaceBackup({ ...validBackup, applications: [{ ...validBackup.applications[0], propertyLabel: 620 }] }), false, "wrong application field types must be rejected");
assert.equal(isRentalWorkspaceBackup({ ...validBackup, applications: Array.from({ length: 21 }, (_, index) => ({ ...validBackup.applications[0], id: `candidate-${index}` })) }), false, "oversized backups must not be silently truncated");
console.log("PASS: malformed backup rejection");

const contact = { id: "contact-1", date: "2026-08-31", channel: "email", direction: "sent", summary: "Receipt requested" };
const fiftyContacts = Array.from({ length: 50 }, (_, index) => ({ ...contact, id: `contact-${index + 1}` }));
for (const version of [2, 3]) {
  const candidate = { ...validBackup.applications[0], followUps: fiftyContacts };
  const backup = { ...validBackup, version, applications: [candidate] };
  const original = JSON.stringify(backup);
  assert.equal(isRentalWorkspaceBackup(backup), true, `v${version} must preserve all 50 supported contact records`);
  assert.equal(JSON.stringify(backup), original, "validation must not change the backup records");

  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [candidate, { ...candidate }] }), false,
    `v${version} must reject duplicate candidate IDs before edits could affect multiple candidates`);
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [{ ...candidate, followUps: [contact, { ...contact, summary: "Separate reply" }] }] }), false,
    `v${version} must reject duplicate contact IDs within one candidate before deletion could remove both`);
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [{ ...candidate, followUps: [...fiftyContacts, { ...contact, id: "contact-51" }] }] }), false,
    `v${version} must reject a backup whose contact history would be silently truncated`);
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [candidate, { ...candidate, id: "candidate-2" }] }), true,
    "different candidates may reuse contact IDs and labels because their records are scoped separately");
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: Array.from({ length: 20 }, (_, index) => ({ ...candidate, id: `candidate-${index + 1}` })) }), true,
    "the full supported workspace of 20 candidates with 50 contacts each must remain restorable");
  assert.equal(JSON.stringify(backup), original, "rejected alternatives must leave source records unchanged");
}
assert.equal(isRentalWorkspaceBackup({ version: 2, applications: [{ id: "legacy-without-contacts" }] }), true,
  "legacy backups with no contact-history field must remain valid");
console.log("PASS: backup record identity, loss prevention and v2/v3 compatibility");

// Exercise the actual event handler without starting a browser or a development server.
const contactHandlerStart = workspace.indexOf("  const addFollowUp = () => {");
const contactHandlerEnd = workspace.indexOf("  const removeFollowUp =", contactHandlerStart);
assert.ok(contactHandlerStart >= 0 && contactHandlerEnd > contactHandlerStart);
const contactHandler = stripTypeScriptTypes(workspace.slice(contactHandlerStart, contactHandlerEnd));
function addContact(history, draft = { date: "2026-08-31", channel: "email", direction: "sent", summary: "  New contact  " }) {
  const active = { ...validBackup.applications[0], stage: "submitted", followUps: history };
  const before = JSON.stringify({ active, draft });
  const changes = [], drafts = [], messages = [];
  let idsCreated = 0;
  runInNewContext(`${contactHandler}\naddFollowUp();`, {
    active, followUpDraft: draft,
    createId: () => { idsCreated += 1; return "new-contact"; },
    updateActive: (value) => changes.push(value),
    setFollowUpDraft: (value) => drafts.push(value),
    setMessage: (value) => messages.push(value),
  }, { timeout: 1000 });
  assert.equal(JSON.stringify({ active, draft }), before, "contact insertion must not mutate existing records or the pending draft");
  return { changes, drafts, messages, idsCreated };
}

const belowLimit = addContact(fiftyContacts.slice(0, 49));
assert.equal(belowLimit.changes.length, 1);
assert.equal(belowLimit.changes[0].followUps.length, 50);
assert.ok(fiftyContacts.slice(0, 49).every((entry, index) => belowLimit.changes[0].followUps[index] === entry), "adding the 50th contact must retain the oldest record and order");
assert.equal(belowLimit.changes[0].followUps[49].summary, "New contact");
assert.equal(belowLimit.changes[0].stage, "follow_up");
assert.equal(belowLimit.drafts.length, 1);
assert.equal(belowLimit.idsCreated, 1);
for (const history of [fiftyContacts, [...fiftyContacts, { ...contact, id: "already-over-capacity" }]]) {
  const full = addContact(history);
  assert.equal(full.changes.length, 0, "at capacity the handler must not discard the oldest contact or change candidate state");
  assert.equal(full.drafts.length, 0, "blocked insertion must keep the user's unfinished input");
  assert.equal(full.idsCreated, 0);
  assert.match(full.messages[0], /50.*백업/);
}
const afterExplicitRemoval = addContact(fiftyContacts.slice(1));
assert.equal(afterExplicitRemoval.changes[0].followUps.length, 50);
assert.equal(afterExplicitRemoval.changes[0].followUps[0].id, "contact-2");
const incompleteContact = addContact([], { date: "", channel: "email", direction: "sent", summary: "" });
assert.equal(incompleteContact.changes.length, 0);
assert.equal(incompleteContact.drafts.length, 0);
console.log("PASS: contact capacity, oldest-record preservation and pending-input retention");

const loadEffectStart = workspace.indexOf("  useEffect(() => {");
const loadEffectEnd = workspace.indexOf("\n\n  const active =", loadEffectStart);
assert.ok(loadEffectStart >= 0 && loadEffectEnd > loadEffectStart);
const loadAndSaveEffects = stripTypeScriptTypes(workspace.slice(loadEffectStart, loadEffectEnd));
function simulateStorageEffects(mode) {
  const effects = [], timers = [], writes = [], statuses = [];
  const storageKey = "hoju-compass-rental-application-pro-v1";
  const original = mode === "handoff-quota" ? JSON.stringify(validBackup) : mode === "empty" ? "" : "{unreadable-rental-draft";
  const values = new Map([[storageKey, original]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (mode === "quota" || mode === "handoff-quota") throw new Error("synthetic storage quota");
      writes.push([key, value]); values.set(key, value);
    },
  };
  const window = {
    get localStorage() { if (mode === "denied") throw new Error("synthetic access denial"); return storage; },
    setTimeout: (callback) => { timers.push(callback); return timers.length; },
    clearTimeout: () => {},
  };
  const context = {
    window, STORAGE_KEY: storageKey, FIRST_SUCCESS_KEY: "rental-first-success",
    didInitialiseRef: { current: false }, initialWorkspace: validBackup, workspace: validBackup,
    loaded: ["quota", "save-ok"].includes(mode), storageBlocked: false, originalWorkspace: null,
    writeRentalWorkspace,
    MAX_APPLICATIONS: 20, createId: () => "handoff-candidate",
    readRentalReadyNowHandoff: () => ({ propertyLabel: "Handoff", reviewedCount: 2, concernCount: 1 }),
    createRentalReadyNowImportReceipt: () => ({ mode: "rent", reviewedCount: 2, concernCount: 1 }),
    rentalReadyNowReceiptMatches: () => false,
    createApplication: (id, propertyLabel) => ({ ...validBackup.applications[0], id, propertyLabel }),
    clearRentalReadyNowHandoff: () => { context.handoffsCleared += 1; }, handoffsCleared: 0,
    useEffect: (callback) => effects.push(callback), parseWorkspace: JSON.parse,
    setWorkspace: (value) => { context.workspace = value; },
    setLoaded: (value) => { context.loaded = value; },
    setStorageBlocked: (value) => { context.storageBlocked = value; },
    setOriginalWorkspace: (value) => { context.originalWorkspace = value; },
    setSaveStatus: (value) => statuses.push(value), setMessage: () => {},
  };
  runInNewContext(loadAndSaveEffects, context, { timeout: 1000 });
  if (!["quota", "save-ok"].includes(mode)) effects[0]();
  effects[1]();
  timers.forEach((callback) => callback());
  return { context, values, writes, statuses, storageKey, original };
}
for (const mode of ["malformed", "empty", "denied"]) {
  const failedLoad = simulateStorageEffects(mode);
  assert.equal(failedLoad.writes.length, 0, "failed startup reads must not schedule an empty-workspace overwrite");
  assert.equal(failedLoad.context.storageBlocked, true);
  assert.equal(failedLoad.values.get(failedLoad.storageKey), failedLoad.original);
  assert.ok(failedLoad.statuses.includes("blocked"));
  if (mode === "malformed") assert.equal(failedLoad.context.originalWorkspace, failedLoad.original, "the exact unreadable original must remain available for a local download");
}
const failedSave = simulateStorageEffects("quota");
assert.equal(failedSave.writes.length, 0);
assert.equal(failedSave.statuses.at(-1), "failed", "automatic storage failures must be visible rather than swallowed");
console.log("PASS: failed-load original preservation and visible autosave failure");
const savedAutomatically = simulateStorageEffects("save-ok");
assert.equal(savedAutomatically.writes.length, 1);
assert.equal(savedAutomatically.statuses.at(-1), "saved");
const failedHandoff = simulateStorageEffects("handoff-quota");
assert.equal(failedHandoff.writes.length, 0);
assert.equal(failedHandoff.context.handoffsCleared, 0);
assert.equal(failedHandoff.context.storageBlocked, true);
assert.deepEqual(failedHandoff.context.workspace, validBackup, "failed handoff persistence must retain the loaded draft in memory");
assert.equal(failedHandoff.values.get(failedHandoff.storageKey), failedHandoff.original);

const parserSource = stripTypeScriptTypes(workspace.slice(workspace.indexOf("type DocumentStatus ="), workspace.indexOf("export function RentalApplicationWorkspace")));
function parseStoredDraft(input) {
  return JSON.parse(runInNewContext(`${parserSource}\nJSON.stringify(parseWorkspace(input));`, {
    input, isRentalWorkspaceBackup,
    rentalApplicationProWorkspaceStorageKey: "workspace", rentalApplicationProFirstSuccessStorageKey: "first",
    rentalJurisdictionCodes: ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"],
  }, { timeout: 1000 }));
}
for (const invalid of [null, [], {}, { version: 99, propertyLabel: "future draft" }, { version: 3, applications: [{ id: "wrong-type", propertyLabel: 123 }] }, { version: 2, packs: Array.from({ length: 21 }, (_, index) => ({ id: `old-${index}` })) }, { version: 2, packs: [{ id: "duplicate" }, { id: "duplicate" }] }]) {
  assert.throws(() => parseStoredDraft(JSON.stringify(invalid)), "unrecognized or lossy stored formats must not become an empty saved workspace");
}
for (const version of [2, 3]) assert.equal(parseStoredDraft(JSON.stringify({ ...validBackup, version })).applications[0].propertyLabel, "Carlton candidate");
const olderLocalV3 = structuredClone(validBackup);
delete olderLocalV3.applications[0].inspectionReceipt;
assert.equal(parseStoredDraft(JSON.stringify(olderLocalV3)).applications[0].inspectionReceipt, null, "older local drafts may default fields added later without being mistaken for malformed imports");
assert.equal(parseStoredDraft(JSON.stringify({ propertyLabel: "Legacy flat", coverNote: "Keep this note" })).applications[0].messages.application, "Keep this note");
assert.equal(parseStoredDraft(JSON.stringify({ version: 2, activeId: "old", packs: [{ id: "old", propertyLabel: "Legacy pack" }] })).applications[0].propertyLabel, "Legacy pack");

let storageAccesses = 0;
assert.equal(writeRentalWorkspace(() => { storageAccesses += 1; throw new Error("must not access storage"); }, validBackup, false), "blocked");
assert.equal(storageAccesses, 0);
assert.equal(writeRentalWorkspace(() => { throw new Error("access denied"); }, validBackup, true), "failed");
const helperWrites = [];
assert.equal(writeRentalWorkspace(() => ({ setItem: (...args) => helperWrites.push(args) }), validBackup, true), "saved");
assert.deepEqual(helperWrites, [["hoju-compass-rental-application-pro-v1", JSON.stringify(validBackup)]]);
assert.equal(writeRentalWorkspace(() => { throw new Error("must not access storage"); }, undefined, true), "failed");

const retryStart = workspace.indexOf("  const retryWorkspaceSave = () => {");
const retryEnd = workspace.indexOf("  const restoreBackup =", retryStart);
assert.ok(retryStart >= 0 && retryEnd > retryStart);
const retrySource = stripTypeScriptTypes(workspace.slice(retryStart, retryEnd));
function retrySave({ consent = true, quota = false, blocked = true, loaded = true } = {}) {
  const writes = [], statuses = [];
  let confirmations = 0;
  const context = {
    loaded, storageBlocked: blocked, workspace: validBackup, originalWorkspace: "raw original", writeRentalWorkspace,
    window: {
      confirm: () => { confirmations += 1; return consent; },
      localStorage: { setItem: (...args) => { if (quota) throw new Error("quota"); writes.push(args); } },
    },
    setSaveStatus: (value) => statuses.push(value),
    setStorageBlocked: (value) => { context.storageBlocked = value; },
    setOriginalWorkspace: (value) => { context.originalWorkspace = value; }, setMessage: () => {},
  };
  runInNewContext(`${retrySource}\nretryWorkspaceSave();`, context, { timeout: 1000 });
  return { writes, statuses, confirmations, context };
}
const cancelledRecovery = retrySave({ consent: false });
assert.equal(cancelledRecovery.writes.length, 0);
assert.equal(cancelledRecovery.context.storageBlocked, true);
assert.equal(cancelledRecovery.context.originalWorkspace, "raw original");
const failedRecovery = retrySave({ quota: true });
assert.equal(failedRecovery.writes.length, 0);
assert.equal(failedRecovery.context.storageBlocked, true);
assert.equal(failedRecovery.context.originalWorkspace, "raw original");
assert.equal(failedRecovery.statuses.at(-1), "failed");
const recovered = retrySave();
assert.equal(recovered.confirmations, 1);
assert.equal(recovered.writes.length, 1);
assert.equal(recovered.context.storageBlocked, false);
assert.equal(recovered.context.originalWorkspace, null);
assert.equal(retrySave({ blocked: false }).confirmations, 0, "ordinary save retry must not demand replacement consent");
assert.equal(retrySave({ loaded: false }).writes.length, 0);
console.log("PASS: legacy load compatibility, guarded writes and explicit recovery");

const restoreStart = workspace.indexOf("  const restoreBackup = async");
const restoreEnd = workspace.indexOf("  const downloadSummary =", restoreStart);
assert.ok(restoreStart >= 0 && restoreEnd > restoreStart);
const restoreSource = stripTypeScriptTypes(workspace.slice(restoreStart, restoreEnd));
async function restoreDraft({ consent = true, quota = false, content = JSON.stringify(validBackup), size = 1000 } = {}) {
  const writes = [], messages = [];
  let confirmations = 0, reads = 0;
  const current = { ...validBackup, activeId: "current-screen" };
  const context = {
    file: { size, text: async () => { reads += 1; return content; } },
    workspace: current, storageBlocked: true, originalWorkspace: "protected original", MAX_APPLICATIONS: 20,
    isRentalWorkspaceBackup, parseWorkspace: parseStoredDraft, writeRentalWorkspace,
    backupInputRef: { current: { value: "selected.json" } },
    window: {
      confirm: () => { confirmations += 1; return consent; },
      localStorage: { setItem: (...args) => { if (quota) throw new Error("quota"); writes.push(args); } },
    },
    setWorkspace: (value) => { context.workspace = value; },
    setStorageBlocked: (value) => { context.storageBlocked = value; },
    setOriginalWorkspace: (value) => { context.originalWorkspace = value; },
    setSaveStatus: () => {}, setMessage: (value) => messages.push(value),
  };
  await runInNewContext(`${restoreSource}\nrestoreBackup(file);`, context, { timeout: 1000 });
  return { context, current, writes, messages, confirmations, reads };
}
for (const options of [{ consent: false }, { quota: true }, { content: "{broken" }, { size: 1_000_001 }]) {
  const rejected = await restoreDraft(options);
  assert.equal(rejected.writes.length, 0);
  assert.equal(rejected.context.workspace, rejected.current, "failed or cancelled restore must leave the current screen intact");
  assert.equal(rejected.context.storageBlocked, true);
  assert.equal(rejected.context.originalWorkspace, "protected original");
  assert.equal(rejected.context.backupInputRef.current.value, "");
  if (options.size) assert.equal(rejected.reads, 0);
}
const restored = await restoreDraft();
assert.equal(restored.writes.length, 1);
assert.equal(restored.context.workspace.activeId, validBackup.activeId);
assert.equal(restored.context.storageBlocked, false);
assert.equal(restored.context.originalWorkspace, null);

const firstSaveStart = workspace.indexOf("  const saveFirstCandidate = () => {");
const firstSaveEnd = workspace.indexOf("  const addApplication =", firstSaveStart);
const firstSaveSource = stripTypeScriptTypes(workspace.slice(firstSaveStart, firstSaveEnd));
function firstCandidateSave(blocked, markerFails = false) {
  const writes = [];
  const context = {
    loaded: true, storageBlocked: blocked, active: validBackup.applications[0], workspace: validBackup,
    writeRentalWorkspace, FIRST_SUCCESS_KEY: "first-success", firstCandidateSaved: false,
    window: { localStorage: { setItem: (key, value) => { if (markerFails && key === "first-success") throw new Error("marker denied"); writes.push([key, value]); } } },
    setWorkspace: () => {}, setSaveStatus: () => {}, setFirstCandidateMessage: () => {},
    setFirstCandidateSaved: (value) => { context.firstCandidateSaved = value; },
  };
  runInNewContext(`${firstSaveSource}\nsaveFirstCandidate();`, context, { timeout: 1000 });
  return { writes, context };
}
assert.equal(firstCandidateSave(true).writes.length, 0, "first-candidate save must not bypass the original-protection lock");
const savedWithoutMarker = firstCandidateSave(false, true);
assert.equal(savedWithoutMarker.writes.length, 1);
assert.equal(savedWithoutMarker.context.firstCandidateSaved, true, "a saved draft must not be reported failed solely because its optional first-use marker could not save");
console.log("PASS: handoff preservation, transactional restore and first-save protection");

const originalDownloadStart = workspace.indexOf("  const downloadStorageOriginal = () => {");
const originalDownloadEnd = workspace.indexOf("  const retryWorkspaceSave =", originalDownloadStart);
assert.ok(originalDownloadStart >= 0 && originalDownloadEnd > originalDownloadStart);
const originalDownloadSource = stripTypeScriptTypes(workspace.slice(originalDownloadStart, originalDownloadEnd));
const originalText = "{손상된 원본\r\n\tKeep these bytes";
const downloads = [];
runInNewContext(`${originalDownloadSource}\ndownloadStorageOriginal();`, {
  originalWorkspace: originalText, saveBlob: (...args) => downloads.push(args), setMessage: () => {},
}, { timeout: 1000 });
assert.deepEqual(downloads, [[originalText, "text/plain;charset=utf-8", "hoju-compass-rental-storage-original.txt"]]);
console.log("PASS: unchanged original-data download");
