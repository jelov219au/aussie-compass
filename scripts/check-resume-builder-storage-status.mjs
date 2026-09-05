import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createResumeBuilderStorageStatusController,
  persistResumeBuilderDraft,
} from "../src/lib/resumeBuilderStorage.ts";

const builder = readFileSync(resolve("src/components/tools/ResumeBuilder.tsx"), "utf8");
const storageHelper = readFileSync(resolve("src/lib/resumeBuilderStorage.ts"), "utf8");

function assertStorageStatusContract(source) {
  assert.match(source, /useState<ResumeBuilderStorageStatus>\("idle"\)/);
  assert.match(source, /persistResumeBuilderDraft\([\s\S]*\(\) => window\.localStorage,[\s\S]*STORAGE_KEY,[\s\S]*JSON\.stringify\(draft\),[\s\S]*controller/);
  assert.match(source, /createResumeBuilderStorageStatusController\(\{/);
  assert.match(source, /controller\.dispose\(\)/);

  assert.match(source, /window\.setTimeout\(\(\) => \{\s*autosaveRef\.current = null;\s*persistResume\(resume\);\s*\}, 500\)/s);
  assert.match(source, /!dirtyRef\.current \|\| !storageAllowedRef\.current/, "autosave must require an edit and a safe initial read");
  assert.match(source, /onClick=\{\(\) => persistResume\(resume\)\}[\s\S]*다시 저장 확인/);

  const failureStart = source.indexOf('data-resume-storage-status="failed"');
  const failureEnd = source.indexOf("</section>}", failureStart);
  assert.ok(failureStart >= 0 && failureEnd > failureStart, "the persistent storage failure panel is missing");
  const failureUi = source.slice(failureStart, failureEnd);
  assert.ok(source.includes("기기에 저장되지 않음 — PDF·작성본 백업 권장"));
  assert.ok(failureUi.includes("현재 탭에서는 유지되지만 닫거나 새로고침하면 사라질 수 있어요."));
  assert.match(failureUi, /saveAsPdf\("builder_actions"\)/);
  assert.match(failureUi, /onClick=\{exportDraft\}/);
  assert.doesNotMatch(failureUi, /\/data-transfer|track\(|fetch\(|sendBeacon|XMLHttpRequest|console\.|window\.location|URLSearchParams/, "the failure panel may offer only local PDF, Builder JSON backup and retry actions");

  assert.match(source, /new Blob\(\[JSON\.stringify\(resume, null, 2\)\]/, "Builder JSON backup must use the current React draft");
  assert.match(source, /window\.print\(\)/, "PDF export must remain available from the current preview");
}

assertStorageStatusContract(builder);
assert.match(storageHelper, /catch\s*\{\s*result = "failed";\s*\}/, "storage failures must never regress to an empty catch");
assert.doesNotMatch(storageHelper, /track\(|fetch\(|sendBeacon|XMLHttpRequest|console\.|window\.location|URLSearchParams/, "the storage helper must not send drafts, failures or errors anywhere");

function createHarness() {
  const statusChanges = [];
  const scheduled = [];
  const cancelled = [];
  const controller = createResumeBuilderStorageStatusController({
    onStatusChange: (status) => statusChanges.push(status),
    schedule: (callback, delayMs) => {
      const handle = { callback, delayMs };
      scheduled.push(handle);
      return handle;
    },
    cancel: (handle) => cancelled.push(handle),
  });
  return { controller, statusChanges, scheduled, cancelled };
}

function throwingStorage(errorName) {
  return {
    setItem() {
      throw new DOMException(`${errorName} fixture`, errorName);
    },
  };
}

for (const errorName of ["QuotaExceededError", "SecurityError"]) {
  const harness = createHarness();
  const resumeFixture = { summary: "private fixture", experiences: [{ details: "kept in memory" }] };
  const resumeBefore = structuredClone(resumeFixture);
  const result = persistResumeBuilderDraft(() => throwingStorage(errorName), "fixture-key", JSON.stringify(resumeFixture), harness.controller);
  assert.equal(result, "failed");
  assert.deepEqual(resumeFixture, resumeBefore, `${errorName} must not mutate the in-memory resume object`);
  assert.deepEqual(harness.statusChanges, ["failed"], `${errorName} must make the visible status fail exactly once`);
  assert.equal(harness.controller.getSnapshot().status, "failed");
  persistResumeBuilderDraft(() => throwingStorage(errorName), "fixture-key", "updated private fixture", harness.controller);
  assert.deepEqual(harness.statusChanges, ["failed"], `${errorName} repeat attempts must not repeat the same aria-live transition`);
}

const race = createHarness();
const writes = [];
const workingStorage = { setItem: (key, value) => writes.push([key, value]) };
assert.equal(persistResumeBuilderDraft(() => workingStorage, "fixture-key", "current draft", race.controller), "saved");
assert.deepEqual(race.statusChanges, ["saved"]);
assert.deepEqual(writes, [["fixture-key", "current draft"]], "the draft write must happen before the saved state is emitted");
const staleSuccessTimer = race.scheduled[0];
assert.equal(staleSuccessTimer.delayMs, 1600);
assert.equal(persistResumeBuilderDraft(() => throwingStorage("QuotaExceededError"), "fixture-key", "newer draft", race.controller), "failed");
assert.deepEqual(race.statusChanges, ["saved", "failed"]);
assert.equal(race.cancelled[0], staleSuccessTimer, "a newer failure must cancel the pending success timer");
staleSuccessTimer.callback();
assert.equal(race.controller.getSnapshot().status, "failed", "a stale success callback must never erase the latest failure");
assert.deepEqual(race.statusChanges, ["saved", "failed"]);

assert.equal(persistResumeBuilderDraft(() => workingStorage, "fixture-key", "recovered draft", race.controller), "saved");
assert.deepEqual(race.statusChanges, ["saved", "failed", "saved"], "a successful retry must recover the visible state");
const recoveryTimer = race.scheduled.at(-1);
recoveryTimer.callback();
assert.equal(race.controller.getSnapshot().status, "idle");
assert.deepEqual(race.statusChanges, ["saved", "failed", "saved", "idle"]);

for (const mutation of [
  builder.replace("기기에 저장되지 않음 — PDF·작성본 백업 권장", "자동 저장"),
  builder.replace('data-resume-storage-status="failed"', 'data-resume-storage-status="failed" onClick={() => track("Storage Failure", { draft: resume.summary })}'),
]) assert.throws(() => assertStorageStatusContract(mutation), "each UI storage-status defense mutation must fail the contract");

console.log("Resume Builder storage failure and recovery contract passed.");
