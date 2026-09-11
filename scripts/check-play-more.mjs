import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";
const require = createRequire(import.meta.url), ts = require("typescript"), load = localTypeScriptLoader();
const data = load("src/data/playMore.ts"), lib = load("src/lib/playMore.ts");
let count = 0;
function test(label, fn) { fn(); count++; console.log(`PASS ${label}`); }
test("all six puzzles preserve unique tile IDs, repeated letters and reviewed meanings", () => {
  assert.equal(data.wordPuzzles.length, 6);
  for (const puzzle of data.wordPuzzles) {
    const tiles = lib.puzzleTiles(puzzle.word);
    assert.equal(new Set(tiles.map(tile => tile.id)).size, puzzle.word.length);
    assert.equal([...tiles].sort((a, b) => a.id - b.id).map(tile => tile.letter).join(""), puzzle.word);
    assert.notEqual(tiles.map(tile => tile.letter).join(""), puzzle.word);
    assert.equal(JSON.stringify(tiles), JSON.stringify(lib.puzzleTiles(puzzle.word)));
    assert(puzzle.meaning); assert(puzzle.source.startsWith("https://www.abc.net.au/education/"));
    assert.equal(lib.puzzleAnswer(puzzle.word, [...puzzle.word].map((_, i) => i)), "correct");
    assert.equal(lib.puzzleAnswer(puzzle.word, tiles.map(tile => tile.id)), "incorrect");
    assert.equal(lib.puzzleAnswer(puzzle.word, []), "incomplete");
    assert.equal(lib.puzzleAnswer(puzzle.word, Array(puzzle.word.length).fill(0)), "incorrect");
    assert.equal(lib.puzzleAnswer(puzzle.word, new Array(puzzle.word.length)), "incorrect");
  }
  assert.equal(lib.puzzleAnswer("MOZZIE", [0,1,3,2,4,5]), "correct", "identical Z tiles may swap places");
});
test("all 256 balance results copy actual choices and a generic link", () => {
  assert.equal(data.balanceRounds.length, 8);
  for (let mask = 0; mask < 256; mask++) {
    const answers = Array.from({ length: 8 }, (_, i) => (mask >> i) & 1);
    const text = lib.balanceShareText(answers);
    answers.forEach((answer, i) => assert(text.includes(`${i + 1}. ${data.balanceRounds[i].choices[answer].emoji} ${data.balanceRounds[i].choices[answer].title}`)));
    assert.equal(text.match(/https:\/\/\S+/)[0], "https://hojucompass.com/play#balance-game");
  }
  for (const answers of [[], new Array(8), [0,0,0,0,0,0,0,2], [0,0,0,0,0,0,0,"1"]]) assert.equal(lib.balanceShareText(answers), null);
});

function mount(name) {
  const slots = [];
  let cursor = 0, dirty = false, queue = [], tree;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { const next = typeof value === "function" ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, j) => !Object.is(value, old[j]))) { slots[i] = deps; queue.push(fn); } },
  };
  const mod = { exports: {} };
  const file = `src/components/play/${name}.tsx`;
  runInNewContext(ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: mod, exports: mod.exports, window: { requestAnimationFrame: fn => fn() },
    require(id) {
      if (id === "react") return hooks;
      if (id === "react/jsx-runtime") return require(id);
      if (id === "@/data/playMore") return data;
      if (id === "@/lib/playMore") return lib;
      if (id === "./BalancedLetters") return { BalancedLetters: "div" };
      if (id.endsWith(".module.css")) return { default: {} };
      assert.fail(id);
    },
  });
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node?.props ? [node, ...visit(node.props.children)] : [];
  const text = node => Array.isArray(node) ? node.map(text).join("") : node?.props ? text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
  function render() { let loops = 0; do { assert(++loops < 20); dirty = false; cursor = 0; tree = mod.exports[name](); const effects = queue; queue = []; effects.forEach(fn => fn()); } while (dirty); }
  const button = label => visit(tree).find(node => node.type === "button" && (node.props["aria-label"] ?? text(node)).includes(label));
  render();
  return {
    text: () => text(tree), disabled: label => !!button(label)?.props.disabled,
    click(label) { const node = button(label); assert(node, label); assert(!node.props.disabled, label); node.props.onClick(); render(); },
    pick(index) { visit(tree).filter(node => node.type === "input")[index].props.onChange(); render(); },
    checked(index) { return visit(tree).filter(node => node.type === "input")[index].props.checked; },
  };
}
test("puzzle allows correction, removes a chosen tile and handles repeated-letter tiles", () => {
  const app = mount("WordPuzzle"); assert(app.disabled("맞춰보기"));
  const puzzle = data.wordPuzzles[0];
  for (const tile of lib.puzzleTiles(puzzle.word)) app.click(`타일 ${tile.id + 1}`);
  app.click("맞춰보기"); assert(app.text().includes("아직 다른 단어"));
  app.click("1번째 글자"); assert(app.disabled("맞춰보기"));
  app.click("글자 비우기");
  [...puzzle.word].forEach((_, index) => app.click(`타일 ${index + 1}`));
  app.click("맞춰보기"); assert(app.text().includes("맞았어요"));
});
test("six-word album separates independent, hinted and revealed words; restart clears progress", () => {
  const app = mount("WordPuzzle");
  data.wordPuzzles.forEach((puzzle, index) => {
    if (index === 0) {
      [...puzzle.word].forEach((_, i) => app.click(`타일 ${i + 1}`)); app.click("맞춰보기");
    } else if (index === 1) {
      app.click("첫 글자 힌트"); [...puzzle.word].forEach((_, i) => app.click(`타일 ${i + 1}`)); app.click("맞춰보기");
    } else app.click("정답 보고 배우기");
    app.click(index === 5 ? "나의 단어 모음집" : "다음 단어");
  });
  const text = app.text();
  assert.equal((text.match(/스스로 완성/g) ?? []).length, 1);
  assert.equal((text.match(/힌트와 함께 완성/g) ?? []).length, 1);
  assert.equal((text.match(/정답 살펴봄/g) ?? []).length, 4);
  app.click("다시 도전"); assert(app.text().includes("단어 1 / 6")); assert(app.disabled("맞춰보기"));
});
test("balance answers survive back/edit, cannot be skipped, and reset completely", () => {
  const app = mount("BalanceGame"); assert(app.disabled("다음 고민"));
  app.pick(0); app.click("다음 고민"); assert(app.disabled("다음 고민"));
  app.click("이전"); assert(app.checked(0)); app.pick(1);
  for (let i = 0; i < 8; i++) {
    if (i) app.pick(i % 2);
    app.click(i === 7 ? "내 선택 모아보기" : "다음 고민");
  }
  assert(app.text().includes(data.balanceRounds[0].choices[1].title));
  app.click("선택 수정하기"); assert(app.checked(1)); app.pick(0); app.click("내 선택 모아보기");
  assert(app.text().includes(data.balanceRounds[7].choices[0].title));
  app.click("처음부터"); assert(app.disabled("다음 고민")); assert(!app.checked(0)); assert(!app.checked(1));
});
// A direct game link must align after the earlier daily answer expands, once only.
async function checkInitialLink({ ready = false, cancel = false, unmount = false, hash = "#word-puzzle" } = {}) {
  let effect, observerCallback, disconnected = false, frame;
  const events = new Map(), scrolls = [], quiz = { dataset: { quizReady: String(ready) } };
  const mod = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync("src/components/play/PlayLinks.tsx", "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module: mod, exports: mod.exports,
    require(id) { if (id === "react") return { useEffect: fn => { effect = fn; } }; if (id === "react/jsx-runtime") return require(id); return { default: {} }; },
    MutationObserver: class { constructor(fn) { observerCallback = fn; } observe() {} disconnect() { disconnected = true; } },
    document: { fonts: { ready: Promise.resolve() }, getElementById(id) { return id === "daily-quiz" ? quiz : { scrollIntoView: () => scrolls.push(id) }; } },
    window: { location: { hash }, requestAnimationFrame(fn) { frame = fn; return 1; }, cancelAnimationFrame() { frame = null; }, addEventListener(key, fn) { events.set(key, fn); }, removeEventListener(key) { events.delete(key); } },
  });
  mod.exports.PlayLinks(); const cleanup = effect();
  assert.equal(scrolls.length, 0);
  if (cancel) events.get("pointerdown")?.();
  if (unmount) cleanup?.();
  if (observerCallback) { quiz.dataset.quizReady = "true"; observerCallback(); }
  await Promise.resolve(); frame?.();
  cleanup?.();
  assert.equal(events.size, 0, "listeners cleaned up");
  if (observerCallback) assert(disconnected, "observer cleaned up");
  return scrolls;
}
assert.deepEqual(await checkInitialLink(), ["word-puzzle"]);
assert.deepEqual(await checkInitialLink({ ready: true }), ["word-puzzle"]);
assert.deepEqual(await checkInitialLink({ cancel: true }), []);
assert.deepEqual(await checkInitialLink({ unmount: true }), []);
assert.deepEqual(await checkInitialLink({ hash: "#unknown" }), []);
count++; console.log("PASS initial links wait for restored quiz layout and respect user interaction/unmount");
console.log(`More playground games: ${count} PASS`);
