import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
function load(file, resolve = name => assert.fail(name), globals = {}) {
  const mod = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: mod, exports: mod.exports, require: resolve, ...globals });
  return mod.exports;
}
const data = load("src/data/playground.ts"), lib = load("src/lib/playground.ts", () => data);
let count = 0;
function test(label, fn) { fn(); count++; console.log(`PASS ${label}`); }
const day = "2026-09-11", question = data.dailyQuizzes[lib.dailyQuizIndex(day)];
const record = { version: 1, day, questionId: question.id, choice: 0 }, raw = JSON.stringify(record);
test("Sydney midnight changes the daily question, including daylight saving", () => {
  for (const [instant, expected] of [["2026-09-11T13:59:59Z", "2026-09-11"], ["2026-09-11T14:00:00Z", "2026-09-12"], ["2026-10-04T12:59:59Z", "2026-10-04"], ["2026-10-04T13:00:00Z", "2026-10-05"]]) assert.equal(lib.sydneyDay(new Date(instant)), expected);
  const indices = Array.from({ length: 14 }, (_, i) => lib.dailyQuizIndex(`2026-09-${String(i + 1).padStart(2, "0")}`));
  assert.equal(new Set(indices).size, 14);
  assert.equal(lib.dailyQuizIndex("2026-09-01"), lib.dailyQuizIndex("2026-09-15"));
});
const corrupt = ["", "null", "[]", "{}", "{broken", "x".repeat(1025), ...[{ day: "2026-02-30" }, { day: "2026-9-11" }, { choice: -1 }, { choice: 3 }, { choice: 0.5 }, { choice: "0" }, { questionId: "unknown" }, { version: 2 }, { extra: true }].map(value => JSON.stringify({ ...record, ...value }))];
test("saved answers validate date, question, version, fields and choice", () => {
  assert.equal(JSON.stringify(lib.parseDailyAnswer(raw)), raw);
  for (const value of corrupt) assert.equal(lib.parseDailyAnswer(value), null, value);
});
test("all 1,024 complete choices resolve to a most-selected character with latest-choice ties", () => {
  for (let n = 0; n < 1024; n++) {
    const answers = Array.from({ length: 5 }, (_, i) => (n >> (i * 2)) & 3);
    const choices = answers.map((answer, i) => data.characterQuestions[i].options[answer].character);
    const scores = new Map(); choices.forEach(id => scores.set(id, (scores.get(id) ?? 0) + 1));
    const max = Math.max(...scores.values());
    assert.equal(lib.characterResult(answers), choices.findLast(id => scores.get(id) === max));
  }
  for (const id of Object.keys(data.characters)) assert.equal(lib.characterResult(data.characterQuestions.map(q => q.options.findIndex(o => o.character === id))), id);
  for (const answers of [[], [0], new Array(5), [0, 0, 0, 0, -1], [0, 0, 0, 0, 4], [0, 0, 0, 0, 0.5], [0, 0, 0, 0, "0"]]) assert.equal(lib.characterResult(answers), null);
});
test("sharing includes the visible character and a generic test URL", () => {
  for (const [id, character] of Object.entries(data.characters)) {
    const text = lib.characterShareText(id);
    assert(text.includes(character.name));
    assert.equal(text.match(/https:\/\/\S+/)[0], "https://hojucompass.com/play#character-test");
  }
});

// Execute the actual daily component's handlers and effects with controlled storage/date.
function mount(saved = null, failures = {}) {
  const slots = [], timers = new Map(), listeners = new Map(), records = new Map([["unrelated", "keep"]]), writes = [];
  if (saved !== null) records.set(lib.dailyQuizKey, saved);
  let cursor = 0, dirty = false, queued = [], tree, today = day;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { const next = typeof value === "function" ? value(slots[i]) : value; if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; } }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) { slots[i] = { deps, cleanup: old?.cleanup }; queued.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  const storage = {
    getItem(key) { if (failures.read) throw Error("denied"); return records.get(key) ?? null; },
    setItem(key, value) { writes.push(key); if (failures.write) throw Error("quota"); records.set(key, value); },
    removeItem(key) { if (failures.remove) throw Error("denied"); records.delete(key); },
  };
  const globals = { localStorage: storage, window: { setInterval(fn) { timers.set(1, fn); return 1; }, clearInterval(id) { timers.delete(id); }, requestAnimationFrame(fn) { fn(); } }, document: { visibilityState: "visible", addEventListener(key, fn) { listeners.set(key, fn); }, removeEventListener(key) { listeners.delete(key); } } };
  const { DailyQuiz } = load("src/components/play/DailyQuiz.tsx", name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "@/data/playground") return data;
    if (name === "@/lib/playground") return { ...lib, sydneyDay: () => today };
    if (name.endsWith(".module.css")) return { default: {} };
    assert.fail(name);
  }, globals);
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object" && node.props ? [node, ...visit(node.props.children)] : [];
  const text = node => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" && node.props ? text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
  function render() { let loops = 0; do { assert(++loops < 20); dirty = false; cursor = 0; tree = DailyQuiz(); const effects = queued; queued = []; effects.forEach(fn => fn()); } while (dirty); }
  function click(label) { const button = visit(tree).find(n => n.type === "button" && text(n).includes(label)); assert(button, label); assert(!button.props.disabled); button.props.onClick(); render(); }
  render();
  return { records, writes, text: () => text(tree), click, failures,
    answer() { const button = visit(tree).find(n => n.type === "button" && !n.props.disabled); button.props.onClick(); render(); },
    advance(next, refresh = false) { today = next; if (refresh) { listeners.get("visibilitychange")(); render(); } },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); assert.equal(timers.size, 0); assert.equal(listeners.size, 0); },
  };
}
test("fresh and restored mount never writes; first answer survives reload", () => {
  const app = mount(); assert.equal(app.writes.length, 0); app.answer(); assert.equal(app.writes.length, 1);
  const reloaded = mount(app.records.get(lib.dailyQuizKey)); assert(reloaded.text().includes("불러왔어요")); assert.equal(reloaded.writes.length, 0);
  reloaded.unmount(); app.unmount();
});
test("bonus answers never overwrite today's saved answer", () => {
  const app = mount(raw); app.click("한 문제 더"); app.answer(); assert.equal(app.records.get(lib.dailyQuizKey), raw); assert.equal(app.writes.length, 0);
  app.click("첫 연습 문제로"); assert(app.text().includes(question.word));
});
test("the complete bonus round visits all fourteen questions once and then stops", () => {
  const app = mount(); app.answer();
  const saved = app.records.get(lib.dailyQuizKey);
  for (let offset = 1; offset < 14; offset++) {
    app.click("한 문제 더");
    assert(app.text().includes(data.dailyQuizzes[(lib.dailyQuizIndex(day) + offset) % 14].word));
    app.answer();
  }
  assert(app.text().includes("14문제를 모두 봤어요"));
  assert(!app.text().includes("한 문제 더"));
  assert.equal(app.records.get(lib.dailyQuizKey), saved);
  assert.equal(app.writes.length, 1);
});
test("damaged and unreadable storage stays intact while the quiz remains playable", () => {
  for (const saved of corrupt) { const app = mount(saved); app.answer(); assert(app.text().includes("뜻 확인")); assert.equal(app.records.get(lib.dailyQuizKey), saved); assert.equal(app.writes.length, 0); }
  const app = mount(raw, { read: true }); app.answer(); assert.equal(app.writes.length, 0); assert.equal(app.records.get(lib.dailyQuizKey), raw);
});
test("quota failure still reveals feedback and reports the unsaved answer", () => {
  const app = mount(null, { write: true }); app.answer(); assert(app.text().includes("저장하지 못했어요")); assert(app.text().includes("뜻 확인")); assert(!app.records.has(lib.dailyQuizKey));
});
test("explicit reset touches only the quiz key and recovers corrupt storage", () => {
  const app = mount("broken"); app.click("퀴즈 기록 지우기"); assert.equal(app.records.get("unrelated"), "keep"); assert(!app.records.has(lib.dailyQuizKey)); app.answer(); assert.equal(app.writes.length, 1);
  const denied = mount(raw, { remove: true }); denied.click("퀴즈 기록 지우기"); assert.equal(denied.records.get(lib.dailyQuizKey), raw); assert(denied.text().includes("지우지 못했어요"));
});
test("midnight answer refreshes before saving; visibility refreshes the day", () => {
  const app = mount(); app.advance("2026-09-12"); app.answer(); assert.equal(app.writes.length, 0); app.answer(); assert.equal(JSON.parse(app.records.get(lib.dailyQuizKey)).day, "2026-09-12");
  app.advance("2026-09-13", true); assert(app.text().includes("09월 13일")); app.unmount();
});
console.log(`Playground: ${count} PASS`);
