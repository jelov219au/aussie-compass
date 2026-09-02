import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as archives from "../src/lib/eofyProArchive.ts";
import * as handoff from "../src/lib/eofyProHandoff.ts";
import * as storageHelpers from "../src/lib/eofyProDeviceStorage.ts";
import * as downloads from "../src/lib/eofyProDownload.ts";

const { readEofyDraft, writeEofyDraft, eofyProStorageKey: key } = storageHelpers;
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = await readFile(new URL("../src/components/tools/EofyProWorkspace.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const draft = { taxYear: "2025–26", incomeStatuses: { employment: "ready" }, expenses: [], questions: ["Synthetic existing question"] };
const raw = JSON.stringify(draft);
const candidate = archives.createEofyArchive({ ...draft, taxYear: "2024–25", questions: ["Synthetic restored question"] }, "2026-08-31T00:00:00.000Z");

for (const original of ["", "{broken", "null", "[]", "true", JSON.stringify({ ...draft, expenses: null }), JSON.stringify({ ...draft, questions: [42] }), JSON.stringify({ ...draft, incomeStatuses: { employment: "invalid" } })]) {
  const result = readEofyDraft(() => ({ getItem: () => original, setItem: () => assert.fail("Load must not write") }));
  assert.equal(result.kind, "blocked");
  assert.equal(result.original, original);
}
assert.equal(readEofyDraft(() => ({ getItem: () => null })).kind, "empty");
assert.deepEqual(readEofyDraft(() => { throw new Error("denied"); }), { kind: "blocked", original: null });
assert.deepEqual(readEofyDraft(() => ({ getItem() { throw new Error("denied read"); } })), { kind: "blocked", original: null });
const unfinished = {
  ...draft, retainedField: "do not drop this", questions: Array(21).fill("q".repeat(501)),
  expenses: Array.from({ length: 501 }, (_, index) => ({ id: String(index), category: "Synthetic", description: "", date: "", amount: "-1", workUse: "101", evidence: "missing", reimbursed: false, note: "", retainedNote: "keep" })),
};
assert.deepEqual(readEofyDraft(() => ({ getItem: () => JSON.stringify(unfinished) })).draft, unfinished, "Local unfinished edits must not be normalized, capped or discarded by export validation");
for (const expense of [{ ...unfinished.expenses[0], date: {} }, { ...unfinished.expenses[0], evidence: ["missing"] }]) {
  assert.equal(readEofyDraft(() => ({ getItem: () => JSON.stringify({ ...draft, expenses: [expense] }) })).kind, "blocked");
}
assert.equal(readEofyDraft(() => ({ getItem: () => JSON.stringify({ ...draft, expenses: [unfinished.expenses[0], unfinished.expenses[0]] }) })).kind, "blocked");
assert.equal(writeEofyDraft(() => { throw new Error("denied"); }, draft), false);
const cyclic = { ...draft }; cyclic.questions = [cyclic];
assert.equal(writeEofyDraft(() => assert.fail("Serialize before accessing storage"), cyclic), false);

// Execute the real component with deterministic hooks/timers. This is a lifecycle regression,
// not a DOM/mobile/browser acceptance test or a reimplementation of its storage decisions.
function mount(original = raw, initialFault = "none") {
  const values = new Map([["another-product", "unchanged"]]);
  if (original !== null) values.set(key, original);
  const state = { fault: initialFault, attempts: 0, writes: 0, reads: 0, confirms: 0, answer: false, downloads: [], updatesAfterUnmount: 0, downloadFault: "none", requests: 0, revoked: [] };
  const hooks = [], timers = new Map();
  let cursor = 0, sequence = 0, dirty = true, effects = [], tree, mounted = true;
  const equal = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      hooks[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [hooks[index].value, value => {
        if (!mounted) state.updatesAfterUnmount++;
        const next = typeof value === "function" ? value(hooks[index].value) : value;
        if (!Object.is(hooks[index].value, next)) { hooks[index].value = next; dirty = true; }
      }];
    },
    useRef(value) { const index = cursor++; hooks[index] ??= { current: value }; return hooks[index]; },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!equal(hooks[index]?.deps, deps)) hooks[index] = { value: factory(), deps };
      return hooks[index].value;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!equal(hooks[index]?.deps, deps)) effects.push(() => {
        hooks[index]?.cleanup?.();
        hooks[index] = { deps, effect, cleanup: effect() };
      });
    },
  };
  const fakeStorage = {
    getItem(name) { state.reads++; if (state.fault === "read") throw new Error("read denied"); return values.get(name) ?? null; },
    setItem(name, value) {
      state.attempts++;
      assert.equal(name, key);
      if (state.fault === "quota") throw new Error("quota");
      values.set(name, value); state.writes++;
    },
  };
  const browserWindow = {
    get localStorage() { if (state.fault === "denied") throw new Error("storage denied"); return fakeStorage; },
    setTimeout(callback) { timers.set(++sequence, callback); return sequence; },
    clearTimeout(id) { timers.delete(id); },
    confirm() { state.confirms++; return state.answer; },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports, require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "@/lib/eofyProArchive") return archives;
      if (name === "@/lib/eofyProHandoff") return handoff;
      if (name === "@/lib/eofyProDeviceStorage") return storageHelpers;
      if (name === "@/lib/eofyProDownload") return downloads;
      throw new Error(`Unexpected component dependency ${name}`);
    },
    window: browserWindow, Blob, URL: {
      createObjectURL(blob) { if (state.downloadFault === "url") throw new Error("URL unavailable"); state.downloads.push({ blob }); return `blob:synthetic-${state.downloads.length}`; },
      revokeObjectURL(url) { state.revoked.push(url); if (state.downloadFault === "revoke") throw new Error("cleanup unavailable"); },
    },
    document: { createElement() { if (state.downloadFault === "anchor") throw new Error("anchor unavailable"); return { click() { if (state.downloadFault === "click") throw new Error("download blocked"); state.downloads.at(-1).filename = this.download; state.requests++; } }; } },
    crypto: { randomUUID: () => `synthetic-${++sequence}` },
  });
  function settle() {
    let renders = 0;
    while (dirty) {
      assert(++renders < 30, "Component must settle");
      dirty = false; cursor = 0; effects = [];
      tree = exports.EofyProWorkspace();
      for (const effect of effects) effect();
    }
  }
  const text = node => node == null || typeof node === "boolean" ? "" : typeof node !== "object" ? String(node) : Array.isArray(node) ? node.map(text).join("") : text(node.props?.children);
  function find(predicate, node = tree) {
    if (node == null || typeof node !== "object") return null;
    if (!Array.isArray(node) && predicate(node)) return node;
    for (const child of Array.isArray(node) ? node : [node.props?.children]) { const found = find(predicate, child ?? null); if (found) return found; }
    return null;
  }
  const button = label => { const node = find(node => node.type === "button" && text(node) === label); assert(node, `Button exists: ${label}`); return node; };
  settle();
  return {
    state, values, timers, find, text, button,
    status: () => text(find(node => node.props?.role === "status")),
    year: () => find(node => node.type === "select").props.value,
    yearOptions: () => find(node => node.type === "select").props.children.map(option => option.props.value ?? text(option)),
    click(label) { button(label).props.onClick(); settle(); },
    clickAria(label) { const node = find(node => node.type === "button" && node.props['aria-label'] === label); assert(node); node.props.onClick(); settle(); },
    question: () => find(node => node.type === "input" && node.props.onKeyDown).props.value,
    inputQuestion(value) { find(node => node.type === "input" && node.props.onKeyDown).props.onChange({ target: { value } }); settle(); },
    expenseField(index, label) {
      const article = find(node => node.type === "article" && node.props['aria-label'] === `공제 후보 ${index + 1}`);
      assert(article, "Expense record is labelled");
      const fieldLabel = find(node => node.type === "label" && text(node).startsWith(label), article);
      assert(fieldLabel, `Expense field: ${label}`);
      return find(node => ["input", "textarea", "select"].includes(node.type), fieldLabel);
    },
    editExpense(index, label, value) { this.expenseField(index, label).props.onChange({ target: { value } }); settle(); },
    enterQuestion(nativeEvent = {}) { find(node => node.type === "input" && node.props.onKeyDown).props.onKeyDown({ key: "Enter", nativeEvent, preventDefault() {} }); settle(); },
    editYear(year) { find(node => node.type === "select").props.onChange({ target: { value: year } }); settle(); },
    tick() { for (const [id, callback] of [...timers]) { timers.delete(id); callback(); } settle(); },
    strictReplay() { const active = hooks.filter(hook => hook?.effect); for (const hook of active) hook.cleanup?.(); for (const hook of active) hook.cleanup = hook.effect(); settle(); },
    unmount() { for (const hook of hooks) hook?.cleanup?.(); mounted = false; },
    startReview(file) {
      const input = find(node => node.type === "input" && node.props.type === "file");
      const completion = input.props.onChange({ currentTarget: { value: "synthetic.json", files: file ? [file] : [] } });
      settle();
      return completion.then(() => { if (mounted) settle(); });
    },
    async review(archive) {
      const input = find(node => node.type === "input" && node.props.type === "file");
      const serialized = JSON.stringify(archive);
      await input.props.onChange({ currentTarget: { value: "synthetic.json", files: [{ size: new Blob([serialized]).size, text: async () => serialized }] } }); settle();
    },
  };
}

for (const original of ["{broken", "", "null", JSON.stringify({ ...draft, expenses: null })]) {
  const app = mount(original);
  app.strictReplay(); app.editYear("2023–24"); app.tick();
  assert.match(app.status(), /원본 보호/);
  assert.equal(app.state.writes, 0);
  assert.equal(app.state.reads, 1, "Strict-mode replay must not re-read or overwrite the original");
  assert.equal(app.values.get(key), original);
  app.click("저장 원본 내려받기");
  assert.equal(await app.state.downloads.at(-1).blob.text(), original);
  assert.equal(app.state.downloads.at(-1).filename, "hoju-compass-eofy-storage-original.txt");
  app.click("현재 화면으로 저장 재개");
  assert.equal(app.state.writes, 0, "Cancel must retain protection");
  app.state.answer = true; app.state.fault = "quota";
  app.click("현재 화면으로 저장 재개"); app.tick();
  assert.match(app.status(), /원본 보호/);
  assert.equal(app.values.get(key), original);
  app.state.fault = "none"; app.click("현재 화면으로 저장 재개"); app.tick();
  assert.match(app.status(), /저장했습니다/);
  assert.equal(JSON.parse(app.values.get(key)).taxYear, "2023–24");
  assert.equal(app.values.get("another-product"), "unchanged");
}
for (const fault of ["denied", "read"]) {
  const app = mount(raw, fault); app.tick();
  assert.match(app.status(), /원본 보호/);
  assert.equal(app.button("저장 원본 내려받기").props.disabled, true);
  assert.equal(app.state.attempts, 0);
  assert.equal(app.values.get(key), raw);
}
const loaded = mount(raw); loaded.strictReplay(); loaded.tick();
assert.equal(loaded.year(), draft.taxYear);
assert.equal(loaded.state.writes, 0, "A readable saved draft need not be rewritten on mount");
loaded.state.fault = "quota"; loaded.editYear("2023–24");
assert.match(loaded.status(), /저장하는 중/);
loaded.tick(); assert.match(loaded.status(), /저장 실패/);
assert.equal(loaded.values.get(key), raw);
loaded.click("현재 화면 JSON 백업");
assert.equal(JSON.parse(await loaded.state.downloads.at(-1).blob.text()).draft.taxYear, "2023–24");
loaded.state.fault = "none"; loaded.click("저장 다시 시도");
assert.equal(loaded.state.confirms, 0, "Ordinary failed save does not require destructive recovery confirmation");
assert.equal(mount(loaded.values.get(key)).year(), "2023–24", "Successfully retried edits survive remount");

const empty = mount(null); empty.strictReplay(); empty.tick();
assert.equal(empty.state.writes, 1, "Missing key may save a new draft");
empty.editYear("2022–23"); empty.editYear("2021–22"); empty.tick();
assert.equal(empty.state.writes, 2, "Debounce must discard the superseded edit");
assert.equal(JSON.parse(empty.values.get(key)).taxYear, "2021–22");
empty.editYear("2020–21"); empty.unmount(); empty.tick();
assert.equal(JSON.parse(empty.values.get(key)).taxYear, "2021–22", "Unmount cancels pending writes");

const restore = mount(raw); restore.editYear("2023–24");
assert.equal(restore.timers.size, 1);
await restore.review(candidate); restore.click("검토한 백업으로 교체"); restore.tick();
assert.equal(JSON.parse(restore.values.get(key)).taxYear, candidate.draft.taxYear, "Old autosave must not overwrite restored data");
assert.equal(restore.year(), candidate.draft.taxYear);
assert.equal(restore.state.writes, 1);
const failedImport = mount(raw);
await failedImport.review(candidate); failedImport.state.fault = "quota";
failedImport.click("검토한 백업으로 교체");
assert.equal(failedImport.values.get(key), raw);
assert.equal(failedImport.year(), draft.taxYear);
assert.match(failedImport.status(), /저장했습니다/, "A failed import does not falsely mark the unchanged, already saved screen as unsaved");
assert.match(failedImport.text(failedImport.find(node => node.props?.['aria-labelledby'] === 'eofy-archive-heading')), /저장하지 못했습니다/);
const protectedRestore = mount("{broken");
await protectedRestore.review(candidate); protectedRestore.state.fault = "quota";
protectedRestore.click("검토한 백업으로 교체"); protectedRestore.tick();
assert.match(protectedRestore.status(), /원본 보호/);
assert.equal(protectedRestore.values.get(key), "{broken");
protectedRestore.state.fault = "none"; protectedRestore.click("검토한 백업으로 교체"); protectedRestore.tick();
assert.equal(protectedRestore.year(), candidate.draft.taxYear);
assert.match(protectedRestore.status(), /저장했습니다/);
const fullQuestions = Array.from({ length: archives.eofyQuestionLimit }, (_, index) => `Existing question ${index + 1}`);
for (const questions of [fullQuestions, [...fullQuestions, "Legacy extra question"]]) {
  const original = JSON.stringify({ ...draft, questions });
  const app = mount(original);
  app.inputQuestion("Keep this pending question");
  assert.equal(app.button("질문 추가").props.disabled, true);
  app.enterQuestion(); app.tick();
  assert.equal(app.question(), "Keep this pending question", "Full and over-limit drafts must keep pending input");
  assert.equal(app.values.get(key), original, "Do not truncate existing questions when refusing an addition");
}
const questionApp = mount(JSON.stringify({ ...draft, questions: fullQuestions }));
questionApp.inputQuestion("Pending new question");
questionApp.clickAria("질문 20 삭제");
assert.equal(questionApp.question(), "Pending new question");
assert.equal(questionApp.button("질문 추가").props.disabled, false);
questionApp.click("질문 추가"); questionApp.tick();
const updatedQuestions = JSON.parse(questionApp.values.get(key)).questions;
assert.equal(updatedQuestions.length, 20);
assert.equal(updatedQuestions[0], fullQuestions[0]);
assert.equal(updatedQuestions.at(-1), "Pending new question");
assert.equal(questionApp.question(), "");
assert.equal(archives.parseEofyArchive(archives.createEofyArchive(JSON.parse(questionApp.values.get(key)))).draft.questions.length, 20);

const inputApp = mount(JSON.stringify({ ...draft, questions: [] }));
inputApp.inputQuestion("가".repeat(archives.eofyQuestionMaxLength + 1));
assert.equal(inputApp.button("질문 추가").props.disabled, true);
inputApp.enterQuestion(); inputApp.tick();
assert.equal(inputApp.question().length, 501, "Over-length input must not be silently truncated or cleared");
assert.deepEqual(JSON.parse(inputApp.values.get(key)).questions, []);
inputApp.inputQuestion("가".repeat(archives.eofyQuestionMaxLength));
inputApp.enterQuestion({ isComposing: true });
assert.equal(inputApp.question().length, 500, "IME confirmation must not prematurely submit a question");
inputApp.enterQuestion({ isComposing: false, keyCode: 229 });
assert.equal(inputApp.question().length, 500, "Legacy composition key must not prematurely submit");
inputApp.enterQuestion({ isComposing: false, keyCode: 13 }); inputApp.tick();
assert.equal(inputApp.question(), "");
assert.equal(JSON.parse(inputApp.values.get(key)).questions[0].length, 500);
assert.ok(archives.createEofyArchive(JSON.parse(inputApp.values.get(key))), "Maximum permitted question must still be archiveable");
inputApp.inputQuestion("   "); inputApp.enterQuestion(); inputApp.tick();
assert.equal(JSON.parse(inputApp.values.get(key)).questions.length, 1);
function deferredFile() {
  const deferred = Promise.withResolvers();
  return { ...deferred, file: { size: 100, text: () => deferred.promise } };
}
const latestArchive = archives.createEofyArchive({ ...draft, taxYear: "2023–24" }, "2026-08-31T01:00:00.000Z");
const archiveText = app => app.text(app.find(node => node.props?.['aria-labelledby'] === 'eofy-archive-heading'));
for (const outcome of ["valid", "invalid", "rejected"]) {
  const app = mount(raw), older = deferredFile();
  const completion = app.startReview(older.file);
  await app.review(latestArchive);
  if (outcome === "rejected") older.reject(new Error("older read failed"));
  else older.resolve(outcome === "valid" ? JSON.stringify(candidate) : "{broken");
  await completion;
  assert.doesNotMatch(archiveText(app), /파일을 읽을 수 없습니다/);
  assert.equal(app.state.writes, 0, "Reviewing files must never write the current draft");
  app.click("검토한 백업으로 교체");
  assert.equal(app.year(), latestArchive.draft.taxYear, "A slower old selection must not replace the most recently reviewed archive");
}
for (const replacement of [undefined, { size: 512 * 1024 + 1, text: () => assert.fail("Oversize file must not be read") }]) {
  const app = mount(raw), older = deferredFile();
  const completion = app.startReview(older.file);
  await app.startReview(replacement);
  older.resolve(JSON.stringify(candidate)); await completion;
  assert.equal(app.find(node => node.type === "button" && app.text(node) === "검토한 백업으로 교체"), null);
  assert.equal(app.values.get(key), raw);
  if (replacement) assert.match(archiveText(app), /너무 큽니다/);
}
const cancelled = mount(raw), pendingFile = deferredFile();
const cancelledCompletion = cancelled.startReview(pendingFile.file);
cancelled.click("파일 읽기 취소");
pendingFile.resolve(JSON.stringify(candidate)); await cancelledCompletion;
assert.equal(cancelled.find(node => node.type === "button" && cancelled.text(node) === "검토한 백업으로 교체"), null);
assert.equal(cancelled.values.get(key), raw);
const stillReading = mount(raw), earlierFile = deferredFile(), newerFile = deferredFile();
const earlierCompletion = stillReading.startReview(earlierFile.file);
const newerCompletion = stillReading.startReview(newerFile.file);
earlierFile.resolve(JSON.stringify(candidate)); await earlierCompletion;
assert(stillReading.button("파일 읽기 취소"), "Finishing an older read must not clear the newer loading state");
assert.equal(stillReading.find(node => node.type === "button" && stillReading.text(node) === "검토한 백업으로 교체"), null);
newerFile.reject(new Error("latest read failed")); await newerCompletion;
assert.match(archiveText(stillReading), /파일을 읽을 수 없습니다/);
assert.equal(stillReading.values.get(key), raw);
const reviewedThenCancelled = mount(raw);
await reviewedThenCancelled.review(candidate);
reviewedThenCancelled.click("취소");
assert.equal(reviewedThenCancelled.find(node => node.type === "button" && reviewedThenCancelled.text(node) === "검토한 백업으로 교체"), null);
assert.equal(reviewedThenCancelled.values.get(key), raw);
await reviewedThenCancelled.review(latestArchive);
reviewedThenCancelled.click("검토한 백업으로 교체");
assert.equal(reviewedThenCancelled.year(), latestArchive.draft.taxYear, "Cancelling must not permanently block later review/restore");
const departed = mount(raw), unfinishedFile = deferredFile();
const departedCompletion = departed.startReview(unfinishedFile.file);
departed.unmount(); unfinishedFile.resolve(JSON.stringify(candidate)); await departedCompletion;
assert.equal(departed.state.updatesAfterUnmount, 0, "Late file reads must not update an unmounted workspace");

const expense = { id: "expense-0", category: "업무용 장비·도구", description: "Synthetic expense", date: "2026-06-01", amount: "10", workUse: "100", evidence: "receipt", reimbursed: false, note: "" };
const expenseDraft = count => ({ ...draft, expenses: Array.from({ length: count }, (_, index) => ({ ...expense, id: `expense-${index}` })) });
for (const count of [500, 501]) {
  const original = JSON.stringify(expenseDraft(count)), app = mount(original);
  assert.equal(app.button("+ 공제 후보 추가").props.disabled, true, "Full/legacy over-limit records disable new expense additions");
  app.click("+ 공제 후보 추가"); app.tick();
  assert.equal(app.values.get(key), original, "Even direct handler invocation must preserve all existing records at the limit");
  if (count > 500) {
    app.click("현재 연도 JSON 백업");
    assert.equal(app.state.downloads.length, 0);
    assert.match(archiveText(app), /공제 후보/);
  }
}
const expenseLimit = mount(JSON.stringify(expenseDraft(499)));
expenseLimit.click("+ 공제 후보 추가"); expenseLimit.tick();
assert.equal(JSON.parse(expenseLimit.values.get(key)).expenses.length, 500);
assert.equal(expenseLimit.button("+ 공제 후보 추가").props.disabled, true);
expenseLimit.clickAria("지출 항목 1 삭제");
expenseLimit.click("+ 공제 후보 추가"); expenseLimit.tick();
const afterDelete = JSON.parse(expenseLimit.values.get(key)).expenses;
assert.equal(afterDelete.length, 500);
assert.equal(afterDelete[0].id, "expense-1", "Only the selected record is removed");
assert.equal(new Set(afterDelete.map(item => item.id)).size, 500);
const expenseInput = mount(JSON.stringify(expenseDraft(1)));
for (const [field, label, max] of [["description", "항목 설명", 300], ["note", "업무 관련성·계산 메모", 1000]]) {
  const value = "한".repeat(max + 1);
  expenseInput.editExpense(0, label, value); expenseInput.tick();
  assert.equal(expenseInput.expenseField(0, label).props.value, value, "Do not silently truncate pasted text");
  assert.equal(JSON.parse(expenseInput.values.get(key)).expenses[0][field], value);
  assert.equal(expenseInput.expenseField(0, label).props['aria-invalid'], true);
  const before = expenseInput.state.downloads.length;
  expenseInput.click("현재 연도 JSON 백업");
  assert.equal(expenseInput.state.downloads.length, before, "Over-limit input cannot produce a misleading backup");
  assert.match(archiveText(expenseInput), /공제 후보/);
  expenseInput.editExpense(0, label, "한".repeat(max)); expenseInput.tick();
  assert.equal(expenseInput.expenseField(0, label).props['aria-invalid'], false);
}
expenseInput.click("현재 연도 JSON 백업");
const fixedBackup = JSON.parse(await expenseInput.state.downloads.at(-1).blob.text());
assert(archives.parseEofyArchive(fixedBackup));
for (const [field, value] of [["amount", "10000000"], ["amount", "1.234"], ["workUse", "101"]]) {
  assert(archives.getEofyExpenseArchiveIssues({ ...expense, [field]: value }).includes(field));
}
assert.deepEqual(archives.getEofyExpenseArchiveIssues({ ...expense, amount: "9999999.99", workUse: "100.00" }), []);
const compact500 = mount(JSON.stringify(expenseDraft(500)));
compact500.click("현재 연도 JSON 백업");
const fullBackup = compact500.state.downloads.at(-1).blob;
assert(fullBackup.size <= archives.eofyArchiveMaxBytes);
await compact500.review(JSON.parse(await fullBackup.text()));
compact500.click("검토한 백업으로 교체");
assert.equal(JSON.parse(compact500.values.get(key)).expenses.length, 500);
const oversizedDraft = expenseDraft(500);
oversizedDraft.expenses = oversizedDraft.expenses.map(item => ({ ...item, note: "한".repeat(1000) }));
assert(archives.createEofyArchive(oversizedDraft), "Every field is valid even though the serialized file exceeds the import budget");
const oversized = mount(JSON.stringify(oversizedDraft));
oversized.click("현재 연도 JSON 백업");
assert.equal(oversized.state.downloads.length, 0, "Do not export a UTF-8 file too large to restore");
assert.match(archiveText(oversized), /512KB/);
assert.equal(oversized.values.get(key), JSON.stringify(oversizedDraft), "Byte-limit failure must retain all records");

function draftAtByteLimit(targetBytes) {
  const boundary = expenseDraft(500);
  boundary.expenses.forEach(item => { item.note = "한"; });
  const bytes = new Blob([JSON.stringify(archives.createEofyArchive(boundary, "2026-08-31T00:00:00.000Z"), null, 2)]).size;
  let remaining = targetBytes - bytes;
  assert(remaining >= 0);
  for (const item of boundary.expenses) {
    const length = Math.min(999, remaining);
    item.note += "x".repeat(length);
    remaining -= length;
  }
  assert.equal(remaining, 0, "Boundary fixture must fit individual field limits");
  return boundary;
}
for (const extraByte of [0, 1]) {
  const app = mount(JSON.stringify(draftAtByteLimit(archives.eofyArchiveMaxBytes + extraByte)));
  app.click("현재 연도 JSON 백업");
  if (extraByte) {
    assert.equal(app.state.downloads.length, 0, "The first byte over the import limit must be refused");
    assert.match(archiveText(app), /512KB/);
  } else {
    const backup = app.state.downloads.at(-1).blob;
    assert.equal(backup.size, archives.eofyArchiveMaxBytes, "A file exactly at the limit remains downloadable");
    await app.startReview({ size: backup.size, text: () => backup.text() });
    app.click("검토한 백업으로 교체");
    assert.equal(JSON.parse(app.values.get(key)).expenses.length, 500);
  }
}

const impossibleDateDraft = { ...expenseDraft(1), incomeStatuses: { employment: "ready", interest: "ready", government: "ready", gig: "ready", complex: "ready" }, expenses: [{ ...expense, date: "2026-02-30" }] };
const impossibleDateRaw = JSON.stringify(impossibleDateDraft);
const legacyDate = mount(impossibleDateRaw);
legacyDate.strictReplay(); legacyDate.tick();
assert.equal(legacyDate.values.get(key), impossibleDateRaw, "Invalid legacy dates must not be normalized or discarded on load");
assert.equal(legacyDate.state.writes, 0);
assert.equal(legacyDate.expenseField(0, "지출일").props['aria-invalid'], true);
const dateSummary = () => legacyDate.text(legacyDate.find(node => node.props?.['aria-labelledby'] === "eofy-summary-heading"));
assert.doesNotMatch(dateSummary(), /100%/, "An impossible date cannot count as a completed expense");
const dateRecord = () => legacyDate.text(legacyDate.find(node => node.type === "article" && node.props['aria-label'] === "공제 후보 1"));
assert.match(dateRecord(), /기록된 지출일: 2026-02-30/, "Native date inputs may hide invalid values, so show the stored original separately");
legacyDate.editYear("2024–25"); legacyDate.tick();
assert.equal(JSON.parse(legacyDate.values.get(key)).expenses[0].date, "2026-02-30", "Other edits keep the original invalid date");
legacyDate.click("현재 연도 JSON 백업");
assert.equal(legacyDate.state.downloads.length, 0);
legacyDate.click("현재 기록 검토 확인"); legacyDate.click("EOFY 준비 요약 저장");
const legacySummary = await legacyDate.state.downloads.at(-1).blob.text();
assert.match(legacySummary, /INCOMPLETE RECORD DETAILS\r?\n- 1\./, "An acknowledged summary must flag the impossible date for follow-up");
legacyDate.editExpense(0, "지출일", "2024-02-29"); legacyDate.tick();
assert.equal(legacyDate.expenseField(0, "지출일").props['aria-invalid'], false);
assert.match(dateSummary(), /100%/, "A corrected date can complete this otherwise ready draft");
assert.doesNotMatch(dateRecord(), /기록된 지출일:/);
assert.equal(JSON.parse(legacyDate.values.get(key)).expenses[0].date, "2024-02-29");
const downloadsBeforeReview = legacyDate.state.downloads.length;
legacyDate.click("EOFY 준비 요약 저장");
assert.equal(legacyDate.state.downloads.length, downloadsBeforeReview, "Correcting a date expires the old handoff acknowledgement");
legacyDate.click("현재 연도 JSON 백업");
assert.equal(JSON.parse(await legacyDate.state.downloads.at(-1).blob.text()).draft.expenses[0].date, "2024-02-29");
const badDateImport = mount(raw);
await badDateImport.review({ ...candidate, draft: impossibleDateDraft });
assert.equal(badDateImport.values.get(key), raw);
assert.equal(badDateImport.state.writes, 0);
assert.equal(badDateImport.find(node => node.type === "button" && badDateImport.text(node) === "검토한 백업으로 교체"), null);
assert.match(archiveText(badDateImport), /파일을 읽을 수 없습니다/);

for (const taxYear of ["2018–19", "2040–41", "Legacy year text", ""]) {
  const original = JSON.stringify({ ...draft, taxYear }), app = mount(original);
  app.strictReplay(); app.tick();
  assert.equal(app.year(), taxYear);
  assert(app.yearOptions().includes(taxYear), "The controlled select must have an option for the exact stored year, including legacy text");
  assert.equal(new Set(app.yearOptions()).size, app.yearOptions().length);
  assert.equal(app.values.get(key), original);
  assert.equal(app.state.writes, 0, "Adding display options must not rewrite saved records");
}
const historicYear = mount(raw);
const historicalBackup = archives.createEofyArchive({ ...expenseDraft(1), taxYear: "2018–19" });
await historicYear.review(historicalBackup);
assert.equal(historicYear.yearOptions().includes("2018–19"), false, "Review alone must not change the active year selector");
historicYear.state.fault = "quota";
historicYear.click("검토한 백업으로 교체");
assert.equal(historicYear.year(), draft.taxYear);
assert.equal(historicYear.yearOptions().includes("2018–19"), false);
historicYear.state.fault = "none"; historicYear.click("검토한 백업으로 교체"); historicYear.tick();
assert.equal(historicYear.year(), "2018–19");
assert(historicYear.yearOptions().includes("2018–19"));
assert.deepEqual(JSON.parse(historicYear.values.get(key)), historicalBackup.draft);
historicYear.editYear("2026–27"); historicYear.tick();
assert(historicYear.yearOptions().includes("2018–19"), "Keep the restored year available when the owner changes the selection and wants to return");
historicYear.editYear("2018–19"); historicYear.tick();
assert.deepEqual(JSON.parse(historicYear.values.get(key)), historicalBackup.draft);
assert(mount(historicYear.values.get(key)).yearOptions().includes("2018–19"));
historicYear.click("현재 연도 JSON 백업");
assert.equal(JSON.parse(await historicYear.state.downloads.at(-1).blob.text()).draft.taxYear, "2018–19");

const readyIncome = { employment: "ready", interest: "ready", government: "ready", gig: "ready", complex: "ready" };
for (const patch of [{ amount: "1.234" }, { amount: "1e2" }, { workUse: "10.123" }, { description: "x".repeat(301) }, { note: "n".repeat(1001) }, { workUse: "50", evidence: "receipt", note: "" }]) {
  const incomplete = { ...expenseDraft(1), incomeStatuses: readyIncome, expenses: [{ ...expense, ...patch }] };
  const app = mount(JSON.stringify(incomplete));
  const summary = app.text(app.find(node => node.props?.['aria-labelledby'] === "eofy-summary-heading"));
  assert.doesNotMatch(summary, /100%/, "An expense flagged by shared review rules cannot be shown ready");
  assert.match(summary, /확인 필요 항목 1개/);
  assert.equal(handoff.assessEofyHandoff(incomplete).flaggedExpenseCount, 1);
  assert.equal(app.values.get(key), JSON.stringify(incomplete), "Readiness checks are non-destructive");
}
const missingIncome = mount(JSON.stringify({ ...draft, incomeStatuses: {} }));
assert.match(missingIncome.text(missingIncome.find(node => node.props?.['aria-labelledby'] === "eofy-summary-heading")), /확인 필요 항목 5개/, "Untouched income sources are not reported as having no pending checks");
const nearlyReady = expenseDraft(500);
nearlyReady.incomeStatuses = readyIncome;
nearlyReady.expenses[499].date = "2026-02-30";
const nearlyReadyApp = mount(JSON.stringify(nearlyReady));
assert.doesNotMatch(nearlyReadyApp.text(nearlyReadyApp.find(node => node.props?.['aria-labelledby'] === "eofy-summary-heading")), /100%/, "Rounding must not hide a remaining flagged record");
nearlyReadyApp.editExpense(499, "지출일", "2026-02-28");
assert.match(nearlyReadyApp.text(nearlyReadyApp.find(node => node.props?.['aria-labelledby'] === "eofy-summary-heading")), /100%/);

const rawAmounts = ["1.234", "", "1e2", "-3", "10000000", "0.10", "0.20", ".50", "0", "9999999.99"];
const amountDraft = { ...expenseDraft(rawAmounts.length), incomeStatuses: readyIncome };
amountDraft.expenses.forEach((item, index) => { item.amount = rawAmounts[index]; });
const amountApp = mount(JSON.stringify(amountDraft));
amountApp.click("현재 기록 검토 확인"); amountApp.click("EOFY 준비 요약 저장");
const amountSummary = await amountApp.state.downloads.at(-1).blob.text();
for (const rawAmount of ["1.234", "1e2", "-3", "10000000"]) assert(amountSummary.includes(`Amount recorded: Unvalidated input: ${rawAmount}`), "An invalid recorded amount must remain visible verbatim, not become zero/rounded money");
assert.match(amountSummary, /Amount recorded: Not set/);
assert.match(amountSummary, /TOTAL VALID RECORDED CANDIDATE SPEND: A\$10000000\.79/);
assert.match(amountSummary, /AMOUNT ENTRIES EXCLUDED FROM TOTAL: 5/);
assert.equal(amountApp.values.get(key), JSON.stringify(amountDraft));
assert.match(amountApp.text(amountApp.find(node => node.props?.['aria-labelledby'] === "expense-register-heading")), /합계 미포함 5개/);
for (const value of ["1\n", "1.2\n", " 1", "1 ", "\t1"]) {
  assert(archives.getEofyExpenseArchiveIssues({ ...expense, amount: value }).includes("amount"), "Whitespace must not change how decimal digits are interpreted");
}

for (const kind of ["summary", "archive", "original"]) {
  for (const fault of ["url", "anchor", "click"]) {
    const original = kind === "original" ? "{broken" : raw;
    const app = mount(original);
    if (kind === "summary") app.click("현재 기록 검토 확인");
    const label = kind === "summary" ? "EOFY 준비 요약 저장" : kind === "archive" ? "현재 연도 JSON 백업" : "저장 원본 내려받기";
    app.state.downloadFault = fault;
    assert.doesNotThrow(() => app.click(label), "A download failure must stay in the workspace's retryable UI");
    assert.equal(app.state.requests, 0);
    assert.equal(app.values.get(key), original);
    assert.equal(app.state.writes, 0);
    assert.equal(app.state.revoked.length, fault === "url" ? 0 : 1, "Release URLs even when preparing/requesting the download fails");
    const resultText = () => app.text(app.find(node => node.props?.['aria-labelledby'] === (kind === "archive" ? "eofy-archive-heading" : "eofy-summary-heading")));
    assert.match(resultText(), /다운로드를 시작하지 못했습니다/);
    app.state.downloadFault = "none"; app.click(label);
    assert.equal(app.state.requests, 1);
    assert.match(resultText(), /요청했습니다/);
    assert.doesNotMatch(resultText(), /다운로드를 시작하지 못했습니다/);
    assert.equal(app.values.get(key), original);
  }
}
const cleanupFailure = mount(raw);
cleanupFailure.click("현재 기록 검토 확인"); cleanupFailure.state.downloadFault = "revoke";
assert.doesNotThrow(() => cleanupFailure.click("EOFY 준비 요약 저장"));
assert.equal(cleanupFailure.state.requests, 1, "A cleanup exception must not misreport an already requested download as failed");
assert.match(cleanupFailure.text(cleanupFailure.find(node => node.props?.['aria-labelledby'] === "eofy-summary-heading")), /요청했습니다/);

console.log("EOFY storage, readiness, summary fidelity and download-failure regressions passed. Browser/device acceptance not run.");
