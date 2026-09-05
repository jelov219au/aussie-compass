import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as car from "../src/lib/carPurchasePro.ts";

// Execute the real TSX handlers with a small hook/storage/file harness.
// This does not exercise React DOM, browser downloads, or a mobile/PWA device.
const require = createRequire(import.meta.url), ts = require("typescript");
const source = readFileSync(new URL("../src/components/tools/CarPurchaseProWorkspace.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const text = node => node == null || typeof node === "boolean" ? "" : typeof node !== "object" ? String(node)
  : Array.isArray(node) ? node.map(text).join("") : text(node.props?.children);
function fixture(draft = { candidates: [{ ...car.emptyCarCandidate("current"), alias: "Current", reason: "Keep" }], snapshots: [] }) {
  const hooks = [], effects = [], downloads = [], listeners = new Map();
  let cursor = 0, tree, local = car.serializeCarDraft(draft), writes = 0;
  const storage = { getItem: () => local, setItem: (key, value) => { assert.equal(key, car.carPurchaseStorageKey); local = value; writes++; } };
  const react = {
    useState: initial => { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === "function" ? initial() : initial;
      return [hooks[i], next => { hooks[i] = typeof next === "function" ? next(hooks[i]) : next; }]; },
    useRef: initial => { const i = cursor++; if (!(i in hooks)) hooks[i] = { current: initial }; return hooks[i]; },
    useEffect: (fn, deps) => { const i = cursor++, previous = hooks[i];
      if (!previous || deps.some((value, index) => value !== previous[index])) effects.push(fn);
      hooks[i] = deps; },
    useId: () => "field-id",
  };
  const result = { exports: {} };
  runInNewContext(compiled, { module: result, exports: result.exports, Blob, Error, TextEncoder,
    crypto: { randomUUID: () => "new-snapshot" },
    window: { localStorage: storage, setTimeout: () => 1,
      addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    URL: { createObjectURL: blob => { downloads.push(blob); return "blob:test"; }, revokeObjectURL: () => {} },
    document: { body: { appendChild: () => {} }, createElement: () => ({ click() {}, remove() {} }) },
    require: name => name === "react" ? react : name === "react/jsx-runtime" ? require(name)
      : name === "@/lib/carPurchasePro" ? car : assert.fail(`Unexpected import: ${name}`),
  });
  const render = () => { cursor = 0; tree = result.exports.CarPurchaseProWorkspace(); };
  const nodes = () => {
    const found = [];
    const visit = node => { if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(visit);
      if (typeof node.type === "function") return visit(node.type(node.props));
      found.push(node); visit(node.props?.children); };
    visit(tree); return found;
  };
  const find = predicate => nodes().find(predicate);
  const button = label => find(node => node.type === "button" && text(node) === label);
  const click = label => { const node = button(label); assert(node, `Missing button: ${label}`); assert(!node.props.disabled); node.props.onClick(); render(); };
  const paste = raw => {
    find(node => node.props?.id === "car-backup-paste").props.onChange({ target: { value: raw } }); render();
    click("복원 미리보기 확인");
  };
  const file = async value => {
    const input = find(node => node.props?.id === "car-backup-file"); assert(!input.props.disabled);
    let reading;
    const selectedFile = value && { size: value.size, text: () => { reading = value.text(); return reading; } };
    input.props.onChange({ target: { files: selectedFile ? [selectedFile] : [], value: "selected" } }); render();
    if (reading) await reading.catch(() => {});
    await Promise.resolve(); await Promise.resolve(); render();
  };
  render(); effects.splice(0).forEach(fn => fn()); render();
  return { click, paste, file, button, find, render, downloads, nodes,
    notice: () => text(find(node => node.props?.role === "status")),
    stored: () => local, writes: () => writes,
    backup: () => { click("백업 JSON 내보내기"); return find(node => node.props?.id === "car-backup-output").props.value; },
  };
}
const backupA = car.serializeCarDraft(car.sampleCarDraft());
let checks = 0;
const openConfirmation = f => { f.paste(backupA); f.click("이 백업을 화면에 적용"); assert(f.button("변경 적용")); };
for (const action of ["bad-paste", "cancel", "oversize", "read-error", "bad-file", "new-valid-file"]) {
  const f = fixture(), before = f.stored(); openConfirmation(f);
  if (action === "bad-paste") f.paste("{broken");
  if (action === "cancel") f.click("취소");
  if (action === "oversize") await f.file({ size: car.carArchiveMaxBytes + 1, text: () => assert.fail("Oversize file read") });
  if (action === "read-error") await f.file({ size: 1, text: async () => { throw Error("Unreadable"); } });
  if (action === "bad-file") await f.file({ size: 7, text: async () => "{broken" });
  if (action === "new-valid-file") await f.file({ size: before.length, text: async () => before });
  assert.equal(f.button("변경 적용"), undefined, `${action}: obsolete import confirmation must close`);
  assert.equal(f.backup(), before, `${action}: current draft preserved`);
  assert.equal(f.stored(), before); assert.equal(f.writes(), 0); checks++;
}
const slow = fixture(); openConfirmation(slow);
let finishRead;
const reading = slow.file({ size: backupA.length, text: () => new Promise(resolve => { finishRead = resolve; }) });
assert.equal(slow.button("변경 적용"), undefined, "Old confirmation closes before the new file finishes reading");
finishRead(backupA); await reading;
assert.equal(slow.button("변경 적용"), undefined, "New preview requires a new explicit confirmation"); checks++;
const sampleConfirmation = fixture(); sampleConfirmation.click("가상 사례 2개 보기"); sampleConfirmation.paste("{broken");
assert(sampleConfirmation.button("변경 적용"), "Import failure must not dismiss unrelated sample confirmation"); checks++;

// The real snapshot/download/import/confirm/save handlers must preserve a full note.
const candidate = { ...car.emptyCarCandidate("full"), alias: "차".repeat(80),
  inspectionNote: "검".repeat(1000), reason: "이".repeat(1000), handoverNote: "인".repeat(1000) };
candidate.issues = Array.from({ length: 20 }, (_, index) => {
  const issue = car.emptyCarIssue(`issue-${index}`);
  for (const key of ["title", "source", "reply", "question", "evidence", "recheckNote"]) issue[key] = "가".repeat(1000);
  return issue;
});
const full = fixture({ candidates: [candidate], snapshots: [] });
full.click("현재 결정과 입력값 보관 (0/5)");
const exported = full.backup(), archived = car.parseCarArchive(exported);
assert.equal(archived.snapshots.length, 1); assert(archived.snapshots[0].text.length > 80000);
assert.equal(await full.downloads.at(-1).text(), exported);
const restored = fixture(), beforeRestore = restored.stored();
await restored.file(new Blob([exported], { type: "application/json" }));
assert.equal(restored.stored(), beforeRestore); assert.equal(restored.writes(), 0);
restored.click("이 백업을 화면에 적용"); restored.click("변경 적용");
assert.equal(restored.backup(), exported); assert.equal(restored.writes(), 0);
restored.click("이 기기에 저장"); assert.equal(restored.stored(), exported); assert.equal(restored.writes(), 1);
restored.click("전체 거래노트 TXT 내보내기");
assert.equal(await restored.downloads.at(-1).text(), car.carDraftText(archived)); checks++;
const fields = restored.nodes().filter(node => ["input", "textarea"].includes(node.type) && node.props.value === candidate.reason);
assert(fields.some(node => node.props.maxLength === 1000));
fields[0].props.onChange({ target: { value: "Later decision" } }); restored.render();
const edited = car.parseCarArchive(restored.backup());
assert.equal(edited.candidates[0].reason, "Later decision");
assert.equal(edited.snapshots[0].text, archived.snapshots[0].text);
assert.equal(restored.stored(), exported); checks++;
console.log(JSON.stringify({ status: "PASS", checks, scope: "real workspace TSX event handlers with hook/storage/file harness",
  archiveBytes: new TextEncoder().encode(exported).byteLength, browserAndPwa: "NOT_RUN", networkCalls: 0 }));
