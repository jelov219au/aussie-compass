import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";
const require = createRequire(import.meta.url), ts = require("typescript"), load = localTypeScriptLoader();
const lib = load("src/lib/dailyPlay.ts"), old = load("src/data/playground.ts"), more = load("src/lib/playMore.ts");
function compile(path, imports, globals = {}, suffix = "") {
  const mod = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8") + suffix, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { module: mod, exports: mod.exports, Date, URL, Request, Response, AbortController, console, ...globals, require: name => {
      if (name === "server-only") return {}; if (name in imports) return imports[name]; throw Error("Unexpected import " + name);
    } });
  return mod.exports;
}
const { dailyPlaySets: catalog } = compile("src/data/dailyPlay.ts", {});
// Keep the initial seven days as stable lifecycle fixtures; later editorial
// additions are validated across the full catalogue without rewriting tests.
const sets = catalog.filter(set => set.date >= "2026-09-11" && set.date <= "2026-09-17");
const copy = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function test(name, fn) { fn(); checks++; console.log("PASS " + name); }
const existing = old.dailyQuizzes.map(item => `slang:${item.id}`);
test("seven distinct reviewed days, 21 IDs/topics, no reused legacy words", () => {
  assert.equal(sets.length, 7); lib.validateDailyPlayCatalog(catalog, existing);
  assert.equal(new Set(sets.flatMap(set => [set.quiz.id, set.puzzle.id, set.choice.id])).size, 21);
  for (const mutate of [s => s[1].date = s[0].date, s => s[1].quiz.id = s[0].quiz.id,
    s => s[1].quiz.topicKey = s[0].quiz.topicKey, s => s[0].date = "2026-02-30",
    s => s[0].quiz.answer = 99, s => s[0].quiz.source.checkedAt = "", s => s[0].choice.creative = false,
    s => { s[0].puzzle.word = "ARVO"; s[0].puzzle.topicKey = "slang:arvo"; }]) {
    const invalid = copy(sets); mutate(invalid); assert.throws(() => lib.validateDailyPlayCatalog(invalid, existing));
  }
});
test("server date gates every day, drafts, future queries, gaps and exhausted stock", () => {
  assert.equal(lib.publishedDailyPlay(sets, new Date("2026-09-10T13:59:59Z")).set, null);
  for (let i = 0; i < 7; i++) {
    const now = new Date(`2026-09-${String(11 + i).padStart(2, "0")}T03:00:00Z`);
    const result = lib.publishedDailyPlay(sets, now);
    assert.equal(result.set.id, sets[i].id); assert.equal(result.dates.length, i + 1);
    for (let future = i + 1; future < 7; future++) {
      const denied = lib.publishedDailyPlay(sets, now, sets[future].date);
      assert.equal(denied.set, null); assert(!JSON.stringify(denied).includes(sets[future].quiz.id));
    }
    assert.equal(lib.publishedDailyPlay(sets, now, sets[0].date).set.id, sets[0].id);
  }
  const draft = copy(sets); draft[1].quiz.review = "draft";
  assert.equal(lib.publishedDailyPlay(draft, new Date("2026-09-12T03:00Z")).set, null);
  assert.equal(lib.publishedDailyPlay(sets, new Date("2026-09-18T03:00Z")).set, null);
});
test("Sydney midnight timer handles 23/25 hour DST days and exact midnight", () => {
  for (const [at, hours] of [["2026-10-03T14:00Z", 23], ["2027-04-03T13:00Z", 25], ["2026-09-10T14:00Z", 24]]) {
    assert.equal(lib.millisecondsToSydneyMidnight(new Date(at)), hours * 3600000);
  }
  assert.equal(lib.playSydneyDay(new Date("2026-09-11T13:59:59.999Z")), "2026-09-11");
  assert.equal(lib.playSydneyDay(new Date("2026-09-11T14:00:00Z")), "2026-09-12");
  assert.equal(lib.millisecondsToSydneyMidnight(new Date("2026-09-11T13:59:59.999Z")), 1);
});
test("saved answers require exact date and all question IDs; reject impossible states", () => {
  const good = { ...lib.emptyDailyPlayAnswers(sets[0]), quiz: 0, tiles: [0,1,3,2,4,5], finish: "solo", choice: 1 };
  assert(lib.parseDailyPlayAnswers(JSON.stringify(good), sets[0]));
  for (const patch of [{ version: 1 }, { date: sets[1].date }, { ids: ["wrong"] }, { quiz: "0" }, { quiz: -1 },
    { choice: 2 }, { tiles: [0,0] }, { tiles: [99] }, { tiles: [0] }, { hint: true }, { finish: "hint" }]) {
    assert.equal(lib.parseDailyPlayAnswers(JSON.stringify({ ...good, ...patch }), sets[0]), null);
  }
  for (const raw of ["broken", "null", "{}", "x".repeat(4097)]) assert.equal(lib.parseDailyPlayAnswers(raw, sets[0]), null);
});
let now = "2026-09-11T03:00:00Z";
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
const route = compile("src/app/api/play/daily/route.ts", { "@/data/dailyPlay": { dailyPlaySets: sets }, "@/data/playground": old, "@/lib/dailyPlay": lib }, { Date: Clock });
for (const query of ["?date=2026-02-30", "?date=2026-09-11&date=2026-09-12"]) assert.equal(route.GET(new Request("https://test/api/play/daily" + query)).status, 400);
const future = route.GET(new Request("https://test/api/play/daily?date=2026-09-17"));
assert.equal((await future.json()).set, null); assert.match(future.headers.get("cache-control"), /no-store/);
now = "2026-09-11T14:00:00Z"; assert.equal((await route.GET(new Request("https://test/api/play/daily")).json()).set.date, "2026-09-12");
checks++; console.log("PASS actual API uses its clock, rejects invalid dates and never caches future content");

const visit = node => Array.isArray(node) ? node.flatMap(visit) : node?.props ? [node, ...visit(node.props.children)] : [];
const text = node => Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
function mount(name, { raw = null, failure = "", set = sets[0], deferred = false } = {}) {
  const slots = [], events = new Map(), timers = new Map(), records = new Map([["legacy", "untouched"]]), writes = [], pending = [];
  if (raw !== null) records.set(lib.dailyPlayStorageKey, raw);
  let cursor = 0, timerId = 0, dirty = false, queue = [], tree, today = new Date("2026-09-11T03:00:00Z"), networkFailure = false;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], value => { const next = typeof value === "function" ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || !deps || deps.some((value, j) => !Object.is(value, old.deps?.[j]))) { slots[i] = { deps, cleanup: old?.cleanup }; queue.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  const listener = { addEventListener(key, fn) { events.set(key, fn); }, removeEventListener(key) { events.delete(key); } };
  const mod = compile("src/components/play/DailyPlay.tsx", { react: hooks, "react/jsx-runtime": require("react/jsx-runtime"), "@/lib/dailyPlay": lib, "@/lib/playMore": more, "./Playground.module.css": { default: {} } }, {
    localStorage: { getItem: key => { if (failure === "read") throw Error("denied"); return records.get(key) ?? null; }, setItem: (key, value) => { if (failure === "write") throw Error("quota"); writes.push(key); records.set(key, value); }, removeItem: key => { if (failure === "remove") throw Error("denied"); records.delete(key); } },
    window: { ...listener, setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout(id) { timers.delete(id); }, requestAnimationFrame: fn => fn() },
    document: { ...listener, visibilityState: "visible" },
    fetch: async (url, options) => {
      const response = lib.publishedDailyPlay(sets, today, new URL(url, "https://test").searchParams.get("date"));
      if (deferred) return new Promise(resolve => pending.push({ resolve: () => resolve({ ok: true, json: async () => response }), options }));
      if (networkFailure) throw Error("offline");
      return { ok: true, json: async () => response };
    },
  }, "\nexport { DailySession };\n");
  function render() { let loops = 0; do { assert(++loops < 30); dirty = false; cursor = 0; tree = mod[name]({ set }); const effects = queue; queue = []; effects.forEach(fn => fn()); } while (dirty); }
  function click(label) { const node = visit(tree).find(n => n.type === "button" && (n.props["aria-label"] ?? text(n)).includes(label)); assert(node, label); assert(!node.props.disabled, label); node.props.onClick(); render(); }
  render();
  return { records, writes, pending, events, timers, click, text: () => text(tree), tree: () => tree,
    async settle() { for (let i = 0; i < 3; i++) { await new Promise(resolve => setImmediate(resolve)); render(); } },
    advance(at, event = "visibilitychange") { today = new Date(at); if (event === "timer") { const [id, timer] = [...timers].find(([, timer]) => timer.ms > 15000); timers.delete(id); timer.fn(); } else events.get(event)(); render(); },
    offline() { networkFailure = true; events.get("online")(); render(); },
    timeout() { const [id, timer] = [...timers].find(([, timer]) => timer.ms === 15000); timers.delete(id); timer.fn(); render(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); assert.equal(events.size, 0); assert.equal(timers.size, 0); },
  };
}
test("real session handles wrong/correct repeated tiles, all games, restore and reset", () => {
  const app = mount("DailySession"); assert.equal(app.writes.length, 0);
  app.click(sets[0].quiz.choices[0]);
  for (const tile of more.puzzleTiles(sets[0].puzzle.word)) app.click(`타일 ${tile.id + 1}`);
  app.click("맞춰보기"); assert(app.text().includes("아직 다른 단어"));
  for (let i = 0; i < 6; i++) app.click("1번째 글자");
  for (const id of [0,1,3,2,4,5]) app.click(`타일 ${id + 1}`);
  app.click("맞춰보기"); app.click(sets[0].choice.choices[1]); assert(app.text().includes("세 가지 모두"));
  const reload = mount("DailySession", { raw: app.records.get(lib.dailyPlayStorageKey) }); assert(reload.text().includes("불러왔어요")); assert(reload.text().includes("세 가지 모두")); assert.equal(reload.writes.length, 0);
  reload.click("다시 풀기"); assert.equal(reload.records.get("legacy"), "untouched"); assert(!reload.text().includes("세 가지 모두"));
});
test("mismatched ID and damaged records stay intact; storage failures never stop play", () => {
  for (const raw of ["broken", JSON.stringify({ ...lib.emptyDailyPlayAnswers(sets[0]), ids: ["old"] })]) {
    const app = mount("DailySession", { raw }); app.click(sets[0].quiz.choices[0]); assert(app.text().includes("정답이에요")); assert.equal(app.records.get(lib.dailyPlayStorageKey), raw); assert.equal(app.writes.length, 0);
  }
  for (const failure of ["read", "write"]) { const app = mount("DailySession", { failure }); app.click("정답 보고 배우기"); assert(app.text().includes("정답 살펴봄")); assert.equal(app.writes.length, 0); }
  const another = mount("DailySession", { raw: JSON.stringify(lib.emptyDailyPlayAnswers(sets[1])) }); another.click("첫 글자 힌트"); assert.equal(another.writes.length, 1);
});
const app = mount("DailyPlay"); await app.settle();
const firstSet = visit(app.tree()).find(n => typeof n.type === "function").props.set;
app.advance("2026-09-11T14:00:00Z", "timer"); await app.settle();
assert(app.text().includes("오늘은 2026-09-12"));
assert.equal(visit(app.tree()).find(n => typeof n.type === "function").props.set, firstSet);
app.click("오늘 세트 확인"); await app.settle(); assert.equal(visit(app.tree()).find(n => typeof n.type === "function").props.set.date, "2026-09-12");
app.click("2026-09-11"); await app.settle(); assert.equal(visit(app.tree()).find(n => typeof n.type === "function").props.set.date, "2026-09-11");
app.offline(); await app.settle(); assert(app.text().includes("확인하지 못했어요")); assert(visit(app.tree()).some(n => typeof n.type === "function")); app.unmount();
checks++; console.log("PASS actual midnight/focus flow preserves open set, switches explicitly, supports archive/offline and cleans up");
const race = mount("DailyPlay", { deferred: true }); race.pending[0].resolve(); await race.settle();
race.advance("2026-09-11T14:00:00Z"); race.advance("2026-09-12T14:00:00Z", "focus");
race.pending[2].resolve(); await race.settle(); race.pending[1].resolve(); await race.settle(); assert(race.text().includes("오늘은 2026-09-13"));
race.unmount(); checks++; console.log("PASS stale aborted response cannot overwrite newer server date");
const slow = mount("DailyPlay", { deferred: true }); slow.timeout(); assert(slow.text().includes("오래 걸리고 있어요")); assert(slow.pending[0].options.signal.aborted); slow.pending[0].resolve(); await slow.settle(); assert(!visit(slow.tree()).some(n => typeof n.type === "function")); slow.unmount();
checks++; console.log("PASS timeout offers retry and late responses cannot reopen stale content");
console.log(`Daily play: ${checks} PASS (no network or external writes)`);
