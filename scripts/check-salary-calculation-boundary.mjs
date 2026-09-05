import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url), ts = require("typescript");
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(source, resolve, globals = {}) {
  const record = { exports: {} };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: record, exports: record.exports, require: resolve, URL, URLSearchParams, ...globals });
  return record.exports;
}
const lib = load(read("src/lib/salaryCalculationState.ts"), name => assert.fail(name));
const fixture = { taxYear: "2026-27", taxProfile: "resident", payInputMode: "hourly", hourlyRate: "30", weeklyHours: "20", workingWeeks: "26", annualSalary: "70000", annualAmountType: "plusSuper", includeMedicareLevy: true, includeHelpRepayment: false, employmentType: "permanent" };
let checks = 0;
async function test(label, fn) { await fn(); checks++; console.log(`PASS ${label}`); }
const flatten = node => Array.isArray(node) ? node.flatMap(flatten) : node && typeof node === "object" && node.props ? [node, ...flatten(node.props.children)] : [];
const text = node => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" && node.props ? typeof node.type === "function" ? text(node.type(node.props)) : text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
function mount({ raw = null, search = "", failures = {}, minimum = false } = {}) {
  const slots = [], clipboard = [], writes = [], storage = new Map(), timers = [];
  const key = "aussie-compass-salary-calculation";
  if (raw !== null) storage.set(key, raw);
  let cursor = 0, dirty = false, queued = [], tree;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === "function" ? next(slots[i]) : next; dirty = true; }]; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((d, j) => d !== slots[i][j])) { slots[i] = deps; queued.push(fn); } },
  };
  const window = { location: { search, href: `https://example.test/salary-calculator${search}` }, setTimeout(fn) { timers.push(fn); }, localStorage: {
    getItem(k) { if (failures.read) throw Error("read denied"); return storage.get(k) ?? null; },
    setItem(k, value) { if (failures.write) throw Error("quota"); writes.push(k); storage.set(k, value); },
    removeItem(k) { storage.delete(k); },
  } };
  const capture = {};
  let source = read(`src/components/tools/${minimum ? "MinimumWageCalculator" : "SalaryCalculator"}.tsx`);
  if (!minimum) {
    const marker = '  return (\n    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.3fr]">';
    source = source.replaceAll("\r\n", "\n"); assert(source.includes(marker));
    // Capture real closures in the test VM only; production source is unchanged.
    source = source.replace(marker, `  capture.actions = { copyResults, copyShareLink, loadCalculation, saveCalculation, setCalculation }; capture.state = calculation;\n${marker}`);
  }
  const mod = load(source, name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "next/link") return { default: props => require("react").createElement("a", props) };
    if (name === "@/lib/salaryCalculationState") return lib;
    assert.fail(name);
  }, { window, capture, navigator: { clipboard: { async writeText(value) { if (failures.copy) throw Error("clipboard denied"); clipboard.push(value); } } } });
  const Component = minimum ? mod.MinimumWageCalculator : mod.SalaryCalculator;
  function render() { let n = 0; do { assert(++n < 20); cursor = 0; dirty = false; tree = Component(); const effects = queued; queued = []; effects.forEach(fn => fn()); } while (dirty); }
  render();
  return { storage, key, writes, clipboard, failures, state: () => capture.state, text: () => text(tree), nodes: () => flatten(tree),
    async action(name) { await capture.actions[name](); render(); },
    change(changes) { capture.actions.setCalculation(current => ({ ...current, ...changes })); render(); },
    input(value) { flatten(tree).find(n => n.type === "input" && n.props.type === "number").props.onChange({ target: { value } }); render(); },
    casual() { flatten(tree).find(n => n.type === "input" && n.props.value === "casual").props.onChange(); render(); },
    flush() { timers.splice(0).forEach(fn => fn()); render(); },
  };
}
await test("blocked storage still restores shared 30 x 20 x 26 and keeps storage untouched", () => {
  const app = mount({ search: "?shared=1&rate=30&hours=20&weeks=26", failures: { read: true } });
  assert.equal(app.state().weeklyHours, "20"); assert.equal(app.state().workingWeeks, "26");
  for (const expected of ["$15,600.00", "$600.00", "$1,300.00", "저장 여부를 확인하지 못했습니다", "PAYG"]) assert(app.text().includes(expected), expected);
  app.flush(); assert.equal(app.writes.length, 0);
});
await test("legacy missing tax year loads all fields atomically without rewriting raw", async () => {
  const legacy = { ...fixture, taxYear: undefined, employmentType: "casual", includeHelpRepayment: true };
  const raw = JSON.stringify(legacy), app = mount({ raw }); await app.action("loadCalculation");
  assert.deepEqual(JSON.parse(JSON.stringify(app.state())), { ...legacy, taxYear: "2026-27" });
  assert.equal(app.storage.get(app.key), raw); assert.equal(app.writes.length, 0);
});
await test("malformed whole records leave every current input and saved raw unchanged", async () => {
  for (const raw of ["", "{bad", "null", "{}", JSON.stringify({ ...fixture, taxProfile: "other" }), JSON.stringify({ ...fixture, includeMedicareLevy: "true" }), JSON.stringify({ ...fixture, weeklyHours: 20 }), JSON.stringify({ ...fixture, hourlyRate: "-1" }), JSON.stringify({ ...fixture, hourlyRate: "1e308" }), JSON.stringify({ ...fixture, workingWeeks: undefined }), JSON.stringify({ ...fixture, extra: true })]) {
    const app = mount({ raw }); app.change({ hourlyRate: "47", weeklyHours: "31" }); const before = JSON.stringify(app.state());
    await app.action("loadCalculation"); assert.equal(JSON.stringify(app.state()), before); assert.equal(app.storage.get(app.key), raw); assert.equal(app.writes.length, 0); assert(app.text().includes("그대로 유지"));
  }
});
await test("blank negative invalid and overflowing inputs block UI and actual copy/share/save handlers", async () => {
  for (const hourlyRate of ["", "-1", "NaN", "0x20", "1e308"]) {
    const app = mount(); app.change({ hourlyRate });
    assert(!app.nodes().some(n => n.type === "button" && ["결과 복사", "계산 링크 공유"].includes(text(n))));
    await app.action("copyResults"); await app.action("copyShareLink"); await app.action("saveCalculation");
    assert.equal(app.clipboard.length, 0); assert.equal(app.writes.length, 0); assert(!app.text().includes("Infinity"));
  }
});
await test("correcting invalid input restores copying sharing and explicit saving", async () => {
  const app = mount(); app.change({ hourlyRate: "" }); await app.action("copyResults"); app.change(fixture);
  await app.action("copyResults"); assert(app.clipboard[0].includes("$15,600.00")); assert(app.clipboard[0].includes("PAYG"));
  await app.action("copyShareLink"); const url = new URL(app.clipboard[1]); assert.equal(url.searchParams.get("weeks"), "26"); assert.equal(url.searchParams.get("year"), "2026-27");
  await app.action("saveCalculation"); assert.equal(app.storage.get(app.key), JSON.stringify(fixture));
});
await test("shared explicit blank stays invalid instead of silently becoming a default", () => { const app = mount({ search: "?shared=1&rate=" }); assert.equal(app.state().hourlyRate, ""); assert(!app.text().includes("예상 세후 연 소득")); });
await test("selected year changes Super basis source and clipboard consistently", async () => {
  const app = mount();
  for (const [taxYear, expected, path] of [["2025-26", "ordinary time earnings(OTE)", "quarterly-super-to-30-june-2026"], ["2026-27", "qualifying earnings(QE)", "payday-super"]]) {
    app.change({ taxYear }); assert(app.text().includes(expected)); await app.action("copyResults"); const copy = app.clipboard.at(-1); assert(copy.includes(expected)); assert(copy.includes(path)); assert(copy.includes(taxYear));
    assert(app.nodes().some(n => n.type === "a" && n.props.href.includes(path)));
    await app.action("copyShareLink"); assert.equal(new URL(app.clipboard.at(-1)).searchParams.get("year"), taxYear);
  }
});
await test("past tax year withholds current minimum wage comparison", () => { const app = mount(); app.change({ taxYear: "2025-26", hourlyRate: "20" }); assert(app.text().includes("과거 시급을 비교하지 않습니다")); assert(!app.text().includes("$26.44")); app.change({ taxYear: "2026-27" }); assert(app.text().includes("$26.44")); });
await test("70000 package preserves 62500 base plus 7500 Super and annual period labels", async () => { const app = mount(); app.change({ payInputMode: "annual", annualSalary: "70000", annualAmountType: "includesSuper" }); assert(app.text().includes("$62,500.00")); assert(app.text().includes("$7,500.00")); await app.action("copyResults"); assert(app.clipboard[0].includes("연간 ÷ 52")); assert(app.clipboard[0].includes("연간 ÷ 26")); });
await test("quota and clipboard failures report failure and preserve saved raw", async () => { const raw = JSON.stringify(fixture), app = mount({ raw, failures: { write: true, copy: true } }); app.change({ hourlyRate: "40" }); await app.action("saveCalculation"); assert.equal(app.storage.get(app.key), raw); assert(app.text().includes("저장")); await app.action("copyResults"); assert(app.text().includes("결과를 복사하지 못했습니다")); await app.action("copyShareLink"); assert(app.text().includes("공유 링크를 복사하지 못했습니다")); });
await test("minimum 38-hour permanent weekly amount remains the published 1004.90", () => { const app = mount({ minimum: true }); assert(app.text().includes("$1,004.90")); assert(!app.text().includes("$1,004.72")); assert(app.text().includes("Full pay period")); assert(app.text().includes("Award·Agreement-free")); });
await test("40 hours shows base 1057.60 and separate overtime Award guidance", () => { const app = mount({ minimum: true }); app.input("40"); assert(app.text().includes("$1,057.60")); assert(app.text().includes("초과근무 가산이 계산되지 않습니다")); assert(app.nodes().some(n => n.props.href === "/award-guide")); });
await test("casual 33.05 does not promise 52 paid weeks and invalid hours hide amounts", () => { const app = mount({ minimum: true }); app.casual(); assert(app.text().includes("$33.05")); assert(app.text().includes("52주 유급근무를 보장하지 않습니다")); app.input(""); assert.equal(app.nodes().filter(n => n.type === "dd").length, 0); });
await test("tax configuration and all tax formula functions are byte-equivalent to repository HEAD", () => {
  const baseline = execFileSync("git", ["show", "HEAD:src/components/tools/SalaryCalculator.tsx"], { encoding: "utf8" }).replaceAll("\r\n", "\n"), current = read("src/components/tools/SalaryCalculator.tsx").replaceAll("\r\n", "\n");
  for (const [start, end] of [["const TAX_YEAR_CONFIG", "type ResultCardProps"]]) assert.equal(current.slice(current.indexOf(start), current.indexOf(end)), baseline.slice(baseline.indexOf(start), baseline.indexOf(end)));
});
await test("page guidance includes selected years synthetic cashflow and correct return targets", () => {
  const salary = read("src/app/salary-calculator/page.tsx"), minimum = read("src/app/minimum-wage-guide/page.tsx");
  for (const value of ["2025–26 또는 2026–27", "$15,600", "$600", "$1,300", "PAYG", "base salary excluding super", 'href="/super-guide"', 'href="/tools"']) assert(salary.includes(value), value);
  assert(minimum.includes("급여 가이드로 돌아가기")); assert(minimum.includes('href="/guides"')); assert(minimum.includes("첫 Full pay period"));
});
console.log(`Salary and minimum wage boundaries: ${checks} PASS (component handlers and render tree; no live payroll or browser)`);
