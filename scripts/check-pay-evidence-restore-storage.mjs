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
    async review() { await find(node => node.type === "input" && node.props.type === "file").props.onChange({ target: { value: "synthetic.json", files: [{ size: new Blob([archiveB]).size, text: async () => archiveB }] } }); settle(); },
  };
}

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
