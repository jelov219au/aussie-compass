import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { randomUUID } from "node:crypto";
const require = createRequire(import.meta.url), ts = require("typescript");
function load(file, resolve, globals = {}) {
  const moduleRecord = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: moduleRecord, exports: moduleRecord.exports, require: resolve, ...globals });
  return moduleRecord.exports;
}
const plans = load("src/lib/personalPlans.ts", name => assert.fail(name));
const budgetKey = "aussie-compass-living-budget-v1", savingsKey = "aussie-compass-savings-goal-v1";
const budget = { income: 1600, incomeFrequency: "fortnightly", expenses: [
  { id: "rent", name: "Rent", amount: 350, frequency: "weekly" }, { id: "food", name: "Food", amount: 100, frequency: "weekly" },
  { id: "transport", name: "Transport", amount: 40, frequency: "weekly" }, { id: "phone", name: "Phone", amount: 60, frequency: "monthly" }, { id: "annual", name: "Annual", amount: 600, frequency: "yearly" },
] };
const savings = { goalName: "Fixture", target: 600, starting: 0, contribution: 50, frequency: "weekly", annualRate: 0, targetMonths: 12, mode: "timeline", checkIns: [] };
let checks = 0;
const test = (label, fn) => { fn(); checks++; console.log(`PASS ${label}`); };
test("blank, malformed and negative amounts remain distinct from explicit zero", () => {
  for (const value of ["", " ", "-1", -1, Infinity, NaN, null, [], {}, "Infinity", "1e309", "1,000", "0x10", 1e12 + 1]) assert.equal(plans.amount(value), null);
  for (const value of [0, "0", "0.00"]) assert.equal(plans.amount(value), 0);
  assert.equal(plans.amount(" 50.25 "), 50.25);
});
test("fortnightly income and unrounded annual/monthly expense example", () => {
  const r = plans.budgetResult(budget); assert.equal(r.weeklyIncome, 800);
  assert.equal(r.weeklyExpenses.toFixed(2), "515.38"); assert.equal(r.weeklyBalance.toFixed(2), "284.62");
  assert.equal(plans.toWeekly(600, "yearly"), 600 / 52); assert.equal(plans.toWeekly(60, "monthly"), 60 * 12 / 52); assert.equal(plans.toWeekly(130, "quarterly"), 10);
});
test("partial budget exposes valid subtotal and withholds final balance", () => {
  const r = plans.budgetResult({ ...budget, income: "", expenses: [{ ...budget.expenses[0], amount: "" }, budget.expenses[1]] });
  assert.equal(r.weeklyExpenses, 100); assert.equal(r.weeklyBalance, null); assert.equal(r.rows[0].weekly, null);
  assert.equal(plans.serializeBudget({ ...budget, income: "" }), null);
  const zero = plans.budgetResult({ income: "0", incomeFrequency: "weekly", expenses: [{ ...budget.expenses[0], amount: "0" }] });
  assert.equal(zero.complete, true); assert.equal(zero.weeklyBalance, 0);
});
test("numeric budget v1 round trip keeps schema", () => {
  assert.equal(JSON.stringify(plans.parseBudget(JSON.stringify(budget))), JSON.stringify(budget));
  const normalized = JSON.parse(plans.serializeBudget({ ...budget, income: "1600" })); assert.equal(typeof normalized.income, "number");
});
for (const [label, changed] of Object.entries({ negative: { income: -1 }, missing: { income: undefined }, frequency: { incomeFrequency: ["weekly"] }, expenseFrequency: { expenses: [{ ...budget.expenses[0], frequency: "daily" }] }, duplicate: { expenses: [budget.expenses[0], budget.expenses[0]] }, oversized: { expenses: Array.from({ length: 51 }, (_, i) => ({ ...budget.expenses[0], id: String(i) })) }, amountObject: { expenses: [{ ...budget.expenses[0], amount: {} }] } })) test(`reject budget ${label}`, () => assert.equal(plans.parseBudget(JSON.stringify({ ...budget, ...changed })), null));
test("zero interest 600 goal takes exactly twelve period-end payments", () => {
  const r = plans.savingsResult(savings); assert.equal(r.state, "reached"); assert.equal(r.count, 12); assert.equal(r.final, 600);
});
test("required payment rounds up and displayed cents reach the target", () => {
  for (const frequency of ["weekly", "fortnightly", "monthly"]) for (const annualRate of [0, 4.5, 20]) {
    const r = plans.savingsResult({ ...savings, mode: "required", target: 1000, frequency, annualRate });
    assert.equal(r.state, "reached"); assert(r.final >= 1000);
    assert(plans.projectBalance(0, Number(r.payment.toFixed(2)), annualRate / 100 / plans.periods[frequency], r.count) >= 1000);
  }
  assert.equal(plans.savingsResult({ ...savings, mode: "required", target: 1000, frequency: "monthly" }).payment, 83.34);
});
test("already reached preserves actual starting balance", () => {
  const r = plans.savingsResult({ ...savings, starting: 1000 }); assert.equal(r.count, 0); assert.equal(r.final, 1000);
});
test("no growth and beyond 100-year horizon are different", () => {
  assert.equal(plans.savingsResult({ ...savings, contribution: 0 }).state, "no-growth");
  assert.equal(plans.savingsResult({ ...savings, contribution: 0, annualRate: 4.5 }).state, "no-growth");
  assert.equal(plans.savingsResult({ ...savings, target: 1e12, contribution: 0.01 }).state, "beyond-horizon");
});
test("savings blank, target zero, negative and nonfinite block calculation", () => {
  for (const [field, value] of [["target", ""], ["starting", ""], ["contribution", ""], ["annualRate", ""], ["starting", -1], ["target", 0], ["annualRate", Infinity], ["annualRate", 20.1]]) assert.equal(plans.savingsResult({ ...savings, [field]: value }).state, "incomplete");
});
test("required periods validate integer 1..600 and inactive field cannot overwrite saved record", () => {
  for (const targetMonths of [0, 601, 1.5, "", Infinity]) assert.equal(plans.savingsResult({ ...savings, mode: "required", targetMonths }).state, "incomplete");
  assert.equal(plans.serializeSavings({ ...savings, targetMonths: "" }), null);
});
test("valid old 4.5-percent numeric savings record survives reload", () => {
  const legacy = { ...savings, annualRate: 4.5, checkIns: [{ id: "saving-123", amount: 50, date: "2026-09-04T00:00:00.000Z" }] };
  assert.equal(JSON.stringify(plans.parseSavings(JSON.stringify(legacy))), JSON.stringify(legacy));
});
const checkIn = { id: "s1", amount: 50, date: "2026-09-04T00:00:00.000Z" };
for (const [label, changed] of Object.entries({ missing: { starting: undefined }, mode: { mode: ["timeline"] }, frequency: { frequency: ["weekly"] }, rate: { annualRate: 21 }, period: { targetMonths: 1.5 }, negative: { starting: -1 }, invalidDate: { checkIns: [{ ...checkIn, date: "yesterday" }] }, rolloverDate: { checkIns: [{ ...checkIn, date: "2026-02-30T00:00:00.000Z" }] }, duplicate: { checkIns: [checkIn, checkIn] }, zeroCheckIn: { checkIns: [{ ...checkIn, amount: 0 }] }, stringAmount: { checkIns: [{ ...checkIn, amount: "50" }] }, oversized: { checkIns: Array.from({ length: 101 }, (_, i) => ({ ...checkIn, id: String(i) })) } })) test(`reject savings ${label}`, () => assert.equal(plans.parseSavings(JSON.stringify({ ...savings, ...changed })), null));

// Execute the real component handlers and storage effects with a deterministic
// hook/timer harness. Real browser hydration and layout are checked separately.
function mount(kind, raw = null, failures = {}) {
  const slots = [], timers = new Map(), records = new Map(), calls = [];
  const key = kind === "budget" ? budgetKey : savingsKey;
  if (raw !== null) records.set(key, raw);
  let cursor = 0, dirty = false, queued = [], tree, timerId = 0;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], value => { const next = typeof value === "function" ? value(slots[i]) : value; if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; } }]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, j) => !Object.is(value, old.deps[j]))) { slots[i] = { deps, cleanup: old?.cleanup }; queued.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
    useMemo(fn) { return fn(); },
  };
  const storage = {
    getItem(key) { if (failures.read) throw Error("denied"); return records.get(key) ?? null; },
    setItem(key, value) { calls.push("write"); if (failures.write) throw Error("quota"); records.set(key, value); },
    removeItem(key) { calls.push("remove"); if (failures.remove) throw Error("denied"); records.delete(key); },
  };
  const window = { setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); }, confirm: () => true };
  const globals = { localStorage: storage, window, crypto: { randomUUID } };
  const hook = load("src/lib/useLocalPlan.ts", name => { assert.equal(name, "react"); return hooks; }, globals);
  const mod = load(`src/components/tools/${kind === "budget" ? "CostOfLivingCalculator" : "SavingsGoalCalculator"}.tsx`, name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "@/lib/personalPlans") return plans;
    if (name === "@/lib/useLocalPlan") return hook;
    assert.fail(name);
  }, globals);
  const Component = Object.values(mod)[0];
  function render() { let loops = 0; do { assert(++loops < 30, "render loop"); dirty = false; cursor = 0; tree = Component(); const effects = queued; queued = []; effects.forEach(fn => fn()); } while (dirty); }
  const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object" && node.props ? [node, ...visit(node.props.children)] : [];
  const text = node => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" && node.props ? text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
  const find = (type, label) => visit(tree).find(node => node.type === type && text(node).startsWith(label));
  render();
  return {
    calls, records, key, failures, text: () => text(tree), value(label) { return visit(find("label", label)).find(node => node.type === "input" || node.type === "select").props.value; },
    field(label, value) { const input = visit(find("label", label)).find(node => node.type === "input" || node.type === "select"); assert(input, label); input.props.onChange({ target: { value } }); render(); },
    click(label) { const button = find("button", label); assert(button, label); button.props.onClick(); render(); },
    flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); render(); },
  };
}
for (const [kind, fixture, field] of [["budget", budget, "금액 (AUD)"], ["savings", savings, "목표 금액"]]) {
  test(`${kind}: untouched initial example never autosaves`, () => { const app = mount(kind); app.flush(); assert.equal(app.records.size, 0); assert.equal(app.calls.length, 0); if (kind === "savings") assert.equal(app.value("가정 연이율"), 0); });
  test(`${kind}: valid load, incomplete edit preservation and valid numeric save`, () => {
    const raw = JSON.stringify(fixture), app = mount(kind, raw); app.flush(); assert.equal(app.calls.length, 0);
    app.field(field, ""); app.flush(); assert.equal(app.records.get(app.key), raw); assert(app.text().includes("저장 보류"));
    app.field(field, "2000"); app.flush(); assert(app.text().includes("저장됨"));
    const parsed = JSON.parse(app.records.get(app.key)); assert.equal(parsed[kind === "budget" ? "income" : "target"], 2000);
    const reloaded = mount(kind, app.records.get(app.key)); assert.equal(reloaded.value(field), 2000);
  });
  test(`${kind}: malformed storage stays byte-identical even after edits`, () => { for (const raw of ["{broken", JSON.stringify({ ...fixture, unexpected: true })]) { const app = mount(kind, raw); app.field(field, "2000"); app.flush(); assert.equal(app.records.get(app.key), raw); assert.equal(app.calls.length, 0); assert(app.text().includes("자동 저장 중지")); } });
  test(`${kind}: read denial blocks autosave`, () => { const app = mount(kind, JSON.stringify(fixture), { read: true }); app.field(field, "2000"); app.flush(); assert.equal(app.calls.length, 0); assert(app.text().includes("자동 저장 중지")); });
  test(`${kind}: quota failure is visible and prior data survives`, () => { const raw = JSON.stringify(fixture), app = mount(kind, raw, { write: true }); app.field(field, "2000"); app.flush(); assert.equal(app.records.get(app.key), raw); assert(app.text().includes("저장 실패")); assert(!app.text().includes("저장됨")); });
  test(`${kind}: explicit reset removes only this plan and no example write follows`, () => { const app = mount(kind, JSON.stringify(fixture)); app.records.set("unrelated", "keep"); app.click(kind === "budget" ? "기본 예시로 초기화" : "저장본 지우고 예시로 초기화"); app.flush(); assert(!app.records.has(app.key)); assert.equal(app.records.get("unrelated"), "keep"); assert.equal(app.calls.join(","), "remove"); });
  test(`${kind}: denied reset preserves data and reports failure`, () => { const raw = JSON.stringify(fixture), app = mount(kind, raw, { remove: true }); app.click(kind === "budget" ? "기본 예시로 초기화" : "저장본 지우고 예시로 초기화"); app.flush(); assert.equal(app.records.get(app.key), raw); assert(app.text().includes("초기화 실패")); });
}
test("new empty expense withholds final budget while keeping previous save", () => { const raw = JSON.stringify(budget), app = mount("budget", raw); app.click("+ 지출 항목 추가"); app.flush(); assert(app.text().includes("입력한 항목 소계")); assert.equal(app.records.get(app.key), raw); });
test("savings old stored rate is retained in actual component", () => { assert.equal(mount("savings", JSON.stringify({ ...savings, annualRate: 4.5 })).value("가정 연이율"), 4.5); });
test("check-in rejects blank, zero, negative, malformed and invalid current balance", () => {
  const app = mount("savings", JSON.stringify(savings));
  for (const value of ["", "0", "-1", "Infinity", "abc"]) { app.field("이번에 저축한 금액", value); app.click("저축 완료 기록"); assert.equal(app.value("현재 모은 금액"), 0); }
  app.field("현재 모은 금액", ""); app.field("이번에 저축한 금액", "50"); app.click("저축 완료 기록"); assert.equal(app.value("현재 모은 금액"), ""); assert(app.text().includes("현재 모은 금액을 먼저 확인"));
});
test("check-ins add once, preserve recent 100 and withdrawal edits balance independently", () => {
  const old = Array.from({ length: 100 }, (_, i) => ({ ...checkIn, id: String(i) }));
  const app = mount("savings", JSON.stringify({ ...savings, starting: 100, checkIns: old }));
  app.field("이번에 저축한 금액", "50"); app.click("저축 완료 기록"); app.flush();
  const saved = JSON.parse(app.records.get(app.key)); assert.equal(saved.starting, 150); assert.equal(saved.checkIns.length, 100); assert.equal(saved.checkIns[0].amount, 50); assert.equal(saved.checkIns.at(-1).id, "98");
  app.click("저축 완료 기록"); assert.equal(app.value("현재 모은 금액"), 150);
  app.field("현재 모은 금액", "80"); app.flush(); const withdrawn = JSON.parse(app.records.get(app.key)); assert.equal(withdrawn.starting, 80); assert.equal(withdrawn.checkIns.length, 100); assert(app.text().includes("보관 중인 최대 100건 합계"));
});
console.log(`Personal plan regressions: ${checks} PASS`);
