import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as archives from "../src/lib/payEvidenceCaseArchive.ts";

// One local restore failure/retry flow, not the amount suite or browser acceptance.
const source = await readFile(new URL("../src/components/tools/PayEvidenceWorkspace.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const key = "hoju-compass-pay-evidence-pro-v1";
const caseA = { employerLabel: "Synthetic case A", employmentType: "Unsure", rateBasisType: "unsure", rateBasisCheckedOn: "", sourceNote: "", periods: [], evidence: {}, requestType: "first", requestDraft: "A question" };
const caseB = { ...caseA, employerLabel: "Synthetic case B", requestDraft: "B question" };
const archiveB = JSON.stringify(archives.createPayEvidenceCaseArchive(caseB));

function mount(original = JSON.stringify(caseA)) {
  const values = new Map([[key, original], ["other-product", "unchanged"]]);
  const hooks = [], timers = new Map(), downloads = [];
  const state = { fault: false, writes: 0 };
  let cursor = 0, sequence = 0, dirty = true, effects = [], tree;
  const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) { const i = cursor++; hooks[i] ??= { value: initial }; return [hooks[i].value, value => { const next = typeof value === "function" ? value(hooks[i].value) : value; if (!Object.is(next, hooks[i].value)) { hooks[i].value = next; dirty = true; } }]; },
    useRef(initial) { const i = cursor++; hooks[i] ??= { current: initial }; return hooks[i]; },
    useMemo(factory, deps) { const i = cursor++; if (!equal(hooks[i]?.deps, deps)) hooks[i] = { value: factory(), deps }; return hooks[i].value; },
    useEffect(effect, deps) { const i = cursor++; if (!equal(hooks[i]?.deps, deps)) effects.push(() => { hooks[i]?.cleanup?.(); hooks[i] = { deps, cleanup: effect() }; }); },
  };
  const browserWindow = {
    localStorage: { getItem: name => values.get(name) ?? null, setItem(name, value) { assert.equal(name, key); if (state.fault) throw new Error("synthetic quota"); values.set(name, value); state.writes++; } },
    setTimeout(callback) { timers.set(++sequence, callback); return sequence; }, clearTimeout(id) { timers.delete(id); },
  };
  const exports = {};
  runInNewContext(compiled, {
    exports, Blob, window: browserWindow,
    crypto: { randomUUID: () => `synthetic-${++sequence}` },
    URL: { createObjectURL(blob) { downloads.push(blob); return "blob:synthetic"; }, revokeObjectURL() {} },
    document: { createElement: () => ({ click() {} }) },
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/link") return { default: "a" };
      if (name === "@/lib/payEvidenceCaseArchive") return archives;
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  function settle() { let count = 0; while (dirty) { assert(++count < 30); dirty = false; cursor = 0; effects = []; tree = exports.PayEvidenceWorkspace(); for (const effect of effects) effect(); } }
  const text = node => node == null || typeof node === "boolean" ? "" : typeof node !== "object" ? String(node) : Array.isArray(node) ? node.map(text).join("") : text(node.props?.children);
  function find(predicate, node = tree) { if (node == null || typeof node !== "object") return null; if (!Array.isArray(node) && predicate(node)) return node; for (const child of Array.isArray(node) ? node : [node.props?.children]) { const result = find(predicate, child ?? null); if (result) return result; } return null; }
  settle();
  return {
    state, values, downloads,
    draft: () => JSON.parse(JSON.stringify(hooks[0].value)),
    text: () => text(tree),
    hasCandidate: () => Boolean(find(node => node.type === "button" && text(node) === "현재 기록을 이 백업으로 교체")),
    edit(value) { find(node => node.type === "input" && node.props.placeholder === "예: 카페 A").props.onChange({ target: { value } }); settle(); },
    click(label) { const button = find(node => node.type === "button" && text(node) === label); assert(button, `Button exists: ${label}`); button.props.onClick(); settle(); },
    tick() { for (const [id, callback] of [...timers]) { timers.delete(id); callback(); } settle(); },
    async review(file = { size: new Blob([archiveB]).size, text: async () => archiveB }) {
      const reading = find(node => node.type === "input" && node.props.type === "file").props.onChange({ target: { value: "synthetic.json", files: file ? [file] : [] } });
      settle(); await reading; settle();
    },
  };
}

if (!process.argv.includes("--read-race-only")) {
const app = mount(); app.tick();
app.edit("Synthetic case A pending edit");
await app.review(); app.state.fault = true;
app.click("현재 기록을 이 백업으로 교체"); app.tick();
assert.equal(app.values.get(key), JSON.stringify(caseA), "Failed restore preserves stored A");
assert.equal(app.draft().employerLabel, "Synthetic case A pending edit", "Failed restore preserves current screen, including unsaved edits");
assert(app.hasCandidate(), "Failed restore retains B for retry");
assert.match(app.text(), /저장하지 못|저장 실패/);
app.state.fault = false; app.click("현재 기록을 이 백업으로 교체"); app.tick();
assert.deepEqual(app.draft(), caseB); assert.deepEqual(JSON.parse(app.values.get(key)), caseB);
assert(!app.hasCandidate()); assert.deepEqual(mount(app.values.get(key)).draft(), caseB);
app.click("현재 사건 JSON 백업");
assert.deepEqual(archives.parsePayEvidenceCaseArchive(await app.downloads.at(-1).text()).archive.case, caseB);
app.click("전체 요약 TXT");
assert.match(await app.downloads.at(-1).text(), /Synthetic case B/);
assert.equal(app.values.get("other-product"), "unchanged");
app.state.fault = true; app.edit("B pending save"); app.tick();
assert.match(app.text(), /저장 실패/); assert.deepEqual(JSON.parse(app.values.get(key)), caseB);
app.state.fault = false; app.click("현재 화면 저장 다시 시도");
assert.equal(JSON.parse(app.values.get(key)).employerLabel, "B pending save");
const blocked = mount("{broken original"); blocked.edit("Unsaved local working copy"); blocked.tick();
assert.equal(blocked.values.get(key), "{broken original"); assert.match(blocked.text(), /원본 보호/);
console.log("Pay A -> B restore failure/retry, pending timer cancellation, re-open and JSON/TXT passed (synthetic hooks/storage only).");
}

// Real component handlers; control completion order to reproduce stale previews.
const archiveA = JSON.stringify(archives.createPayEvidenceCaseArchive(caseA));
const deferredFile = () => {
  let resolve, reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { file: { size: archiveA.length, text: () => promise }, resolve, reject };
};
let raceChecks = 0;
for (const replacement of ["cancel", "oversize", "invalid", "read-error", "empty"]) {
  const app = mount(), old = deferredFile(); app.edit("Current unsaved edit");
  const reading = app.review(old.file);
  if (replacement === "cancel") { await app.review(); app.click("취소하고 현재 기록 유지"); }
  if (replacement === "oversize") await app.review({ size: archives.MAX_PAY_EVIDENCE_ARCHIVE_BYTES + 1, text: () => assert.fail("Oversize read") });
  if (replacement === "invalid") await app.review({ size: 7, text: async () => "{broken" });
  if (replacement === "read-error") await app.review({ size: 1, text: async () => { throw Error("Synthetic read failure"); } });
  if (replacement === "empty") await app.review(null);
  const messageBefore = app.text();
  old.resolve(archiveA); await reading;
  assert(!app.hasCandidate(), `${replacement}: obsolete file must not recreate a preview`);
  assert.equal(app.text(), messageBefore, `${replacement}: obsolete result must not replace current notice`);
  assert.equal(app.draft().employerLabel, "Current unsaved edit");
  assert.equal(app.values.get(key), JSON.stringify(caseA)); assert.equal(app.state.writes, 0); raceChecks++;
}
const latest = mount(), older = deferredFile();
const oldRead = latest.review(older.file); await latest.review();
older.resolve(archiveA); await oldRead;
assert(latest.text().includes(caseB.employerLabel), "Latest selected backup stays in preview");
latest.click("현재 기록을 이 백업으로 교체");
assert.deepEqual(latest.draft(), caseB); assert.deepEqual(JSON.parse(latest.values.get(key)), caseB); raceChecks++;
const staleError = mount(), failed = deferredFile();
const failedRead = staleError.review(failed.file); await staleError.review();
const previewBefore = staleError.text(); failed.reject(Error("Old read failed")); await failedRead;
assert.equal(staleError.text(), previewBefore); assert(staleError.hasCandidate()); raceChecks++;
const cancelled = mount(), slow = deferredFile(); const slowRead = cancelled.review(slow.file);
cancelled.click("파일 읽기 취소"); slow.resolve(archiveB); await slowRead;
assert(!cancelled.hasCandidate()); assert.deepEqual(cancelled.draft(), caseA); assert.equal(cancelled.state.writes, 0); raceChecks++;
console.log(`PASS Pay archive read races: ${raceChecks} scenario groups; real TSX handlers, synthetic hooks/storage/files; DOM/browser/PWA NOT_RUN.`);
