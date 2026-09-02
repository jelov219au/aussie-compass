import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

import { createEofyArchive, parseEofyArchive } from "../src/lib/eofyProArchive.ts";
import { assessEofyHandoff } from "../src/lib/eofyProHandoff.ts";
import { writeEofyDraft } from "../src/lib/eofyProDeviceStorage.ts";

const component = await readFile(new URL("../src/components/tools/EofyProWorkspace.tsx", import.meta.url), "utf8");
const archiveSource = await readFile(new URL("../src/lib/eofyProArchive.ts", import.meta.url), "utf8");
const productPage = await readFile(new URL("../src/app/eofy-pro/page.tsx", import.meta.url), "utf8");
const packageSource = await readFile(new URL("../package.json", import.meta.url), "utf8");

const draft = {
  taxYear: "2025–26",
  incomeStatuses: { employment: "ready", interest: "review" },
  expenses: [{
    id: "expense-1",
    category: "재택근무",
    description: "업무용 인터넷 사용 기록",
    date: "2026-05-31",
    amount: "120.50",
    workUse: "40",
    evidence: "calculation",
    reimbursed: false,
    note: "월별 업무 사용 기록과 대조",
  }],
  questions: ["고정 요율과 실제 비용 방식 중 어떤 기록을 확인해야 하나요?"],
};

const archive = createEofyArchive(draft, "2026-08-30T05:00:00.000Z");
for (const date of ["2026-02-30", "2026-02-29", "1900-02-29", "2100-02-29", "2026-04-31", "2026-00-01", "2026-13-01", "2026-01-00", "2026-01-32", "0000-01-01", "2026-2-01", "2026-02-01\n", "2026-02-01T00:00:00Z"]) {
  const invalidDraft = { ...draft, expenses: [{ ...draft.expenses[0], date }] };
  assert.equal(parseEofyArchive({ ...archive, draft: invalidDraft }), null, `Non-calendar date ${JSON.stringify(date)} must not enter a reviewed archive`);
  assert.throws(() => createEofyArchive(invalidDraft), /not safe to archive/);
  assert.deepEqual(assessEofyHandoff(invalidDraft).incompleteDetails, ["expense-1"]);
  assert.equal(invalidDraft.expenses[0].date, date, "Validation must not normalize the date");
}
for (const date of ["2024-02-29", "2000-02-29", "2400-02-29", "0004-02-29", "0001-01-01", "0099-12-31", "1900-02-28", "2026-04-30", "2026-01-31", "2026-12-31", "9999-12-31"]) {
  const validDraft = { ...draft, expenses: [{ ...draft.expenses[0], date }] };
  assert.equal(parseEofyArchive(createEofyArchive(validDraft)).draft.expenses[0].date, date);
  assert.deepEqual(assessEofyHandoff(validDraft).incompleteDetails, []);
}
const undatedDraft = { ...draft, expenses: [{ ...draft.expenses[0], date: "" }] };
assert.equal(parseEofyArchive(createEofyArchive(undatedDraft)).draft.expenses[0].date, "", "An unfinished blank date remains portable");
assert.deepEqual(assessEofyHandoff(undatedDraft).incompleteDetails, ["expense-1"], "Blank dates still need handoff review");
assert.equal(archive.format, "hoju-compass-eofy-pro-archive");
assert.equal(archive.version, 1);
assert.deepEqual(archive.privacy, { receiptFilesIncluded: false, credentialsIncluded: false });
assert.deepEqual(parseEofyArchive(archive)?.draft, draft);

const serialized = JSON.stringify(archive);
for (const prohibited of ["receiptFile", "receiptImage", "bankAccount", "myGovPassword", "tfn"]) {
  assert.equal(serialized.includes(`"${prohibited}":`), false, `Archive must not contain ${prohibited}`);
}

const handoffDraft = {
  ...draft,
  incomeStatuses: { employment: "ready", interest: "ready", government: "ready", gig: "review", complex: "ready" },
  expenses: [
    draft.expenses[0],
    { ...draft.expenses[0], id: "missing", evidence: "missing", reimbursed: true, workUse: "100" },
    { ...draft.expenses[0], id: "reimbursed", reimbursed: true, workUse: "100" },
    { ...draft.expenses[0], id: "private-gap", evidence: "receipt", workUse: "50", note: "" },
    { ...draft.expenses[0], id: "incomplete", description: "", amount: "", workUse: "100" },
  ],
};
const handoffReview = assessEofyHandoff(handoffDraft);
assert.deepEqual(handoffReview.incomeNotReady, ["gig"]);
assert.deepEqual(handoffReview.missingEvidence, ["missing"]);
assert.deepEqual(handoffReview.reimbursed, ["missing", "reimbursed"]);
assert.deepEqual(handoffReview.privateUseGaps, ["private-gap"]);
assert.deepEqual(handoffReview.incompleteDetails, ["incomplete"]);
assert.equal(handoffReview.flaggedExpenseCount, 4);
assert.equal(handoffReview.totalFlags, 6);

const mutate = (change) => {
  const candidate = structuredClone(archive);
  change(candidate);
  return candidate;
};

for (const invalid of [
  mutate((value) => { value.version = 2; }),
  mutate((value) => { value.privacy.receiptFilesIncluded = true; }),
  mutate((value) => { value.draft.taxYear = "2025-26"; }),
  mutate((value) => { value.draft.incomeStatuses.unknown = "ready"; }),
  mutate((value) => { value.draft.incomeStatuses.employment = "done"; }),
  mutate((value) => { value.draft.expenses[0].date = "31/05/2026"; }),
  mutate((value) => { value.draft.expenses[0].amount = "10000000"; }),
  mutate((value) => { value.draft.expenses[0].workUse = "101"; }),
  mutate((value) => { value.draft.expenses.push(structuredClone(value.draft.expenses[0])); }),
]) assert.equal(parseEofyArchive(invalid), null, "Unsafe or malformed EOFY archive must fail closed");

for (const [field, value] of [
  ["id", ""], ["id", "i".repeat(101)], ["category", ""], ["category", "c".repeat(101)],
  ["description", "d".repeat(301)], ["description", 42], ["date", null],
  ["amount", "1.234"], ["amount", "-1"], ["workUse", "100.001"],
  ["evidence", "unknown"], ["reimbursed", "false"], ["note", "n".repeat(1001)], ["note", {}],
]) {
  assert.equal(parseEofyArchive(mutate(valueToChange => { valueToChange.draft.expenses[0][field] = value; })), null, `Expense field ${field} keeps its archive boundary`);
}
assert(parseEofyArchive(mutate(value => {
  Object.assign(value.draft.expenses[0], { description: "d".repeat(300), note: "n".repeat(1000), amount: "9999999.99", workUse: "100.00" });
})), "Exact text and decimal boundaries stay valid");

for (const contract of [
  "createEofyArchive(draft)",
  "parseEofyArchive(JSON.parse(await file.text()))",
  "file.size > eofyArchiveMaxBytes",
  "setPendingArchive(archive)",
  "아직 현재 작업은 바뀌지 않았습니다",
  "검토한 백업으로 교체",
  "if (!handoffReviewed)",
  "reviewedDraftSignature === draftSignature",
  "증빙 확인 필요",
  "환급받은 항목",
  "개인 사용분 계산 공백",
  "ACCOUNTANT HANDOFF READINESS REVIEW",
  "These are preparation flags, not findings about deductibility or tax treatment.",
]) assert.ok(component.includes(contract), `EOFY archive UI contract is missing: ${contract}`);

for (const privacyContract of ["receiptFilesIncluded: false", "credentialsIncluded: false"]) {
  assert.ok(archiveSource.includes(privacyContract), `EOFY archive privacy contract is missing: ${privacyContract}`);
}

assert.ok(productPage.includes("회계연도별 백업 패키지"), "EOFY product page must promise the year archive outcome");
assert.ok(packageSource.includes('"test:eofy-pro-archive"'), "EOFY archive contract must be runnable from package scripts");

// Exercise the actual restore callback with fault-injected browser storage, without a server or customer data.
const restoreCallback = component.match(/const restoreArchive = \(\) => \{[\s\S]*?\n  \};/)?.[0];
assert.ok(restoreCallback, "EOFY restore callback must be available for the storage regression");
const key = "hoju-compass-eofy-pro-v1";
const previousDraft = { ...draft, questions: ["Existing synthetic question"] };
const previousBytes = JSON.stringify(previousDraft);

function restoreFixture(mode = "ok", reviewed = archive) {
  const state = {
    draft: previousDraft, pending: reviewed, signature: "reviewed-old-draft",
    message: "old summary", archiveMessage: "backup reviewed", error: "",
    attempts: 0, mode, events: [],
  };
  const values = new Map([[key, previousBytes], ["other-product-draft", "untouched"]]);
  const storage = {
    setItem(name, value) {
      state.attempts++;
      if (state.mode === "quota") throw new Error("Synthetic quota exceeded");
      assert.equal(name, key, "Restore writes only the EOFY draft key");
      values.set(name, value);
      state.events.push("persisted");
    },
  };
  const browserWindow = {
    get localStorage() {
      if (state.mode === "denied") throw new Error("Synthetic storage access denied");
      return storage;
    },
  };
  const restore = () => runInNewContext(`${restoreCallback}\nrestoreArchive();`, {
    window: browserWindow, pendingArchive: state.pending, draft: state.draft, loaded: true, writeEofyDraft,
    cancelPendingSave() {}, lastSavedDraft: { current: null },
    setSaveState() {}, setStorageBlocked() {}, setOriginalStoredValue() {}, setKnownTaxYears() {},
    setDraft(value) {
      assert.equal(values.get(key), JSON.stringify(value), "Persist before replacing the visible draft");
      state.draft = value;
      state.events.push("screen replaced");
    },
    setPendingArchive(value) { state.pending = value; },
    setReviewedDraftSignature(value) { state.signature = value; },
    setMessage(value) { state.message = value; },
    setArchiveMessage(value) { state.archiveMessage = value; },
    setArchiveError(value) { state.error = value; },
  });
  return { state, values, restore };
}

for (const mode of ["quota", "denied"]) {
  const { state, values, restore } = restoreFixture(mode);
  restore();
  assert.equal(state.draft, previousDraft, `${mode}: visible draft must survive`);
  assert.equal(state.pending, archive, `${mode}: keep the reviewed backup available for retry/cancel`);
  assert.equal(values.get(key), previousBytes, `${mode}: stored original must survive`);
  assert.equal(values.get("other-product-draft"), "untouched");
  assert.equal(state.signature, "reviewed-old-draft", "Failed restore does not invalidate the unchanged draft review");
  assert.equal(state.message, "old summary");
  assert.equal(state.archiveMessage, "", "Do not show success after failed persistence");
  assert.ok(state.error.includes("저장하지 못했습니다"));
  assert.deepEqual(state.events, []);
  assert.equal(state.attempts, mode === "quota" ? 1 : 0);
  state.mode = "ok";
  restore();
  assert.equal(values.get(key), JSON.stringify(archive.draft));
  assert.equal(state.draft, archive.draft, "Same reviewed backup can be retried without re-uploading");
  assert.equal(state.pending, null);
  assert.equal(state.signature, "", "Successful restore requires a fresh accountant-handoff review");
  assert.equal(state.message, "");
  assert.equal(state.error, "");
  assert.ok(state.archiveMessage.includes("저장했습니다"));
  assert.deepEqual(state.events, ["persisted", "screen replaced"]);
  assert.equal(values.get("other-product-draft"), "untouched");
}

const noBackup = restoreFixture("ok", null);
noBackup.restore();
assert.equal(noBackup.state.attempts, 0);
assert.equal(noBackup.state.draft, previousDraft);

const cyclicDraft = { ...draft };
cyclicDraft.questions = [cyclicDraft];
const serializationFailure = restoreFixture("ok", { ...archive, draft: cyclicDraft });
serializationFailure.restore();
assert.equal(serializationFailure.state.attempts, 0, "Serialization failure must precede storage mutation");
assert.equal(serializationFailure.values.get(key), previousBytes);
assert.equal(serializationFailure.state.draft, previousDraft);
assert.notEqual(serializationFailure.state.pending, null);
assert.ok(serializationFailure.state.error.includes("저장하지 못했습니다"));

console.log("EOFY Pack Pro archive, handoff review and storage-failure/retry restore checks passed.");
