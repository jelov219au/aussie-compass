import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normaliseResumeProApplicationStore,
  persistResumeProApplicationStore,
  readResumeProApplicationStore,
} from "../src/lib/resumeProApplicationStorage.ts";

const workspace = await readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8");

for (const contract of [
  "첫 회사별 지원서 하나를 저장하고 다시 열어보세요.",
  "브라우저 저장본을 다시 열어야 첫 작업이 완료돼요.",
  'id: "save-application", label: "회사별 지원서 저장", done: currentApplicationReopened',
  'id="resume-pro-save-application"',
  'id="resume-pro-reopen-application"',
  '"resume-pro-save-application"',
  '"resume-pro-reopen-application"',
  "현재 지원서 저장됨",
  "저장본 다시 열어 확인",
  "다시 열기 확인됨",
  "변경사항 있음",
  "저장할 때 연결된 무료 이력서와 Job Ad 근거를 함께 보관하며",
]) assert.ok(workspace.includes(contract), `the first saved-application success contract is missing: ${contract}`);

assert.match(workspace, /const activeApplication = useMemo\([\s\S]*applications\.find\([\s\S]*activeApplicationId/);
assert.match(workspace, /currentApplicationSaved = Boolean\(activeApplication\?\.updatedAt && JSON\.stringify\(activeApplication\.draft\) === JSON\.stringify\(draft\)\)/, "an invalid save timestamp must not display as saved");
assert.ok(
  workspace.indexOf('id: "cover-letter"') < workspace.indexOf('id: "save-application"'),
  "a generated cover letter must be saved as a company application before first-session completion",
);
assert.match(workspace, /currentApplicationReopened = currentApplicationSaved && reopenedApplicationId === activeApplicationId/, "quick start must require reopening the current persisted application");
assert.match(workspace, /const reopenApplication = \(applicationId: string\) => \{[\s\S]*readResumeProApplicationStore\([\s\S]*\.find\(\(item\) => item\.id === applicationId\)[\s\S]*setReopenedApplicationId\(application\.id\)/, "reopen confirmation must come from the browser store, not only in-memory state");
assert.match(workspace, /currentApplicationSaved && activeApplicationId[\s\S]*\? "resume-pro-reopen-application"[\s\S]*: "resume-pro-save-application"/, "the quick-start action must move directly from save to reopen confirmation");
assert.match(workspace, /const savedDraft: ProDraft = \{ \.\.\.draft, resumeSnapshot: normaliseSavedResume\(savedResume\) \}/, "saving a company application must snapshot the currently connected resume");
assert.match(workspace, /const saved: SavedApplication = \{ id, company, role, updatedAt: new Date\(\)\.toISOString\(\), draft: savedDraft \}/, "the persisted application must use the immutable resume snapshot draft");
assert.match(workspace, /setSavedResume\(nextDraft\.resumeSnapshot \?\? readSavedResume\(\)\)/, "reopening an application must restore its saved resume snapshot while legacy records remain compatible");
assert.match(workspace, /setField\("resumeSnapshot", next\)/, "loading the latest Builder resume must be an explicit draft change");
assert.ok(
  workspace.indexOf('id: "save-application"') < workspace.indexOf("quickStartCompleted"),
  "the saved application must count toward the existing quick-start completion gate",
);
assert.doesNotMatch(workspace, /track\("Resume Pro First Application|sendBeacon/, "the saved-application step must not add a duplicate analytics event");

const draft = (value) => ({
  company: typeof value?.company === "string" ? value.company : "",
  role: typeof value?.role === "string" ? value.role : "",
});
const identify = (value) => value;
const valid = { id: "application-1", company: "Compass Cafe", role: "Barista", updatedAt: "2026-08-24T00:00:00.000Z", draft: { company: "Compass Cafe", role: "Barista" } };
const recovered = normaliseResumeProApplicationStore({
  activeId: "application-1",
  items: [valid, { ...valid, company: "Duplicate" }, { ...valid, id: "application-2", updatedAt: "not-a-date" }],
}, draft, identify, Date.parse("2026-08-24T01:00:00.000Z"));
assert.equal(recovered.status, "recovered");
assert.equal(recovered.store.items.length, 2, "duplicate application IDs must collapse to one record");
assert.equal(recovered.store.items[0].company, "Compass Cafe", "the first newest duplicate must win deterministically");
assert.equal(recovered.store.items[1].updatedAt, "", "an invalid updatedAt must not render as a valid save time");
assert.equal(recovered.store.activeId, "application-1");

const legacy = normaliseResumeProApplicationStore([valid], draft, identify, Date.parse("2026-08-24T01:00:00.000Z"));
assert.equal(legacy.status, "recovered", "a legacy top-level array must be migrated without losing its application");
assert.equal(legacy.store.items.length, 1);

const malformed = readResumeProApplicationStore({ getItem: () => "{broken" }, "applications", draft, identify);
assert.deepEqual(malformed.store, { activeId: null, items: [] }, "malformed JSON must fail closed without throwing");
assert.equal(malformed.status, "recovered");

let persisted = "";
const workingStorage = { getItem: () => persisted, setItem: (_key, value) => { persisted = value; } };
assert.equal(persistResumeProApplicationStore(workingStorage, "applications", { activeId: valid.id, items: [valid] }), true);
assert.equal(JSON.parse(persisted).items[0].id, valid.id);
const reopened = readResumeProApplicationStore(workingStorage, "applications", draft, identify);
assert.equal(reopened.status, "ok");
assert.equal(reopened.store.activeId, valid.id);
assert.equal(reopened.store.items[0].company, valid.company, "a verified write must be reopenable from browser storage");

const originalBuilderResume = { name: "Minji Kim", title: "Barista", summary: "Customer service", experiences: [{ role: "Barista", details: "Served customers" }] };
const importedEvidence = [{ term: "customer service", status: "verified", evidence: "Cafe experience" }];
const applicationWithSnapshot = {
  ...valid,
  draft: { ...valid.draft, resumeSnapshot: originalBuilderResume, jobAdEvidence: importedEvidence },
};
let snapshotStore = "";
const snapshotStorage = { getItem: () => snapshotStore, setItem: (_key, value) => { snapshotStore = value; } };
assert.equal(persistResumeProApplicationStore(snapshotStorage, "applications", { activeId: valid.id, items: [applicationWithSnapshot] }), true);
const laterBuilderResume = { ...originalBuilderResume, summary: "Changed after this application was saved" };
const reopenedSnapshot = readResumeProApplicationStore(snapshotStorage, "applications", (value) => value, identify);
assert.notDeepEqual(reopenedSnapshot.store.items[0].draft.resumeSnapshot, laterBuilderResume, "later Builder edits must not mutate a saved company resume snapshot");
assert.deepEqual(reopenedSnapshot.store.items[0].draft.resumeSnapshot, originalBuilderResume, "the saved resume snapshot must survive close and reopen");
assert.deepEqual(reopenedSnapshot.store.items[0].draft.jobAdEvidence, importedEvidence, "Job Ad evidence must remain paired with the saved resume snapshot");
assert.equal(persistResumeProApplicationStore({ getItem: () => null, setItem: () => { throw new Error("quota"); } }, "applications", { activeId: valid.id, items: [valid] }), false, "a failed write must never report saved");
assert.equal(persistResumeProApplicationStore({ getItem: () => "mismatch", setItem: () => {} }, "applications", { activeId: valid.id, items: [valid] }), false, "a write that cannot be read back must never report saved");

assert.ok(workspace.includes("persistResumeProApplicationStore"), "the workspace must verify application persistence");
assert.match(workspace, /if \(!persistResumeProApplicationStore\(window\.localStorage,[\s\S]*return;[\s\S]*setApplications\(nextApplications\);[\s\S]*setMessage\(`\$\{company\} 지원서를 저장했습니다\.[^`]*`\)/, "saved copy must follow verified persistence");
for (const guardedField of ["company", "role", "hiringManager", "jobAd", "coverLetter", "starStoryId"]) {
  assert.ok(workspace.includes(`stringValue(\"${guardedField}\")`), `corrupt ${guardedField} values must not enter the application draft`);
}
assert.ok(workspace.includes('stored.tone === "clear"') && workspace.includes('stored.layout === "editorial"') && workspace.includes('stored.accent === "eucalyptus"'), "stored enum fields must be allowlisted");
assert.match(workspace, /resumeSnapshot: stored\.resumeSnapshot === undefined \? fallback\.resumeSnapshot : normaliseSavedResume\(stored\.resumeSnapshot\)/, "legacy drafts must remain compatible while stored snapshots are allowlist-normalised");

console.log("Resume Pro first saved-application success contract passed.");
