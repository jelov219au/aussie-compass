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
const lib = load("src/lib/vehicleComparisonStorage.ts");
const costs = load("src/lib/vehicleComparisonCosts.ts", () => lib);
const fixture = [{ ...lib.makeVehicle(0), name: "Fixture", price: "12000", fuel: "125.50", ppsr: true }, lib.makeVehicle(1)];
const raw = JSON.stringify(fixture);
let checks = 0;
function test(label, fn) { fn(); checks++; console.log(`PASS ${label}`); }
test("legacy strings, blanks and flags round trip without schema changes", () => {
  assert.equal(JSON.stringify(lib.parseVehicles(raw)), raw);
  assert.equal(lib.serializeVehicles(fixture), raw);
});
const corrupt = ["", "null", "{}", "[null,null]", "[]", "{broken", JSON.stringify([fixture[0]]), JSON.stringify([...fixture, ...fixture]), JSON.stringify([fixture[0], fixture[0]])];
for (const change of [{ id: "" }, { name: null }, { name: "x".repeat(61) }, { price: 12 }, { price: "-1" }, { price: "Infinity" }, { price: "1e309" }, { price: "0x10" }, { price: " " }, { price: "1000000000001" }, { fuel: undefined }, { vin: "false" }, { extra: "keep this" }]) corrupt.push(JSON.stringify([fixture[0], { ...fixture[1], ...change }]));
test("malformed roots, missing fields, invalid costs, duplicate IDs and unknown fields fail intact", () => { for (const value of corrupt) assert.equal(lib.parseVehicles(value), null, value); });

// Run the actual component and useLocalPlan effects, including timer cleanup.
function mount(saved = null, failures = {}) {
  const slots = [], timers = new Map(), records = new Map(), calls = [];
  const key = lib.vehicleComparisonKey;
  if (saved !== null) records.set(key, saved);
  let cursor = 0, dirty = false, queued = [], tree, nextTimer = 0;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], value => { const next = typeof value === "function" ? value(slots[i]) : value; if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; } }]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) { slots[i] = { deps, cleanup: old?.cleanup }; queued.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  const storage = {
    getItem(k) { if (failures.read) throw Error("denied"); return records.get(k) ?? null; },
    setItem(k, value) { calls.push("write"); if (failures.write) throw Error("quota"); records.set(k, value); },
    removeItem(k) { calls.push("remove"); if (failures.remove) throw Error("denied"); records.delete(k); },
  };
  const globals = { localStorage: storage, window: { setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); }, confirm: () => !failures.cancel } };
  const hook = load("src/lib/useLocalPlan.ts", () => hooks, globals);
  const { VehicleComparison } = load("src/components/tools/VehicleComparison.tsx", name => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "@/lib/vehicleComparisonStorage") return lib;
    if (name === "@/lib/vehicleComparisonCosts") return costs;
    if (name === "@/lib/useLocalPlan") return hook;
    if (name === "@/components/analytics/useToolStarted") return { useToolStarted: () => () => {} };
    if (name === "./TaxStorageNotice") return { TaxStorageNotice: props => require("react").createElement("p", {}, props.saveState) };
    assert.fail(name);
  }, globals);
  const visit = n => Array.isArray(n) ? n.flatMap(visit) : n && typeof n === "object" && n.props ? [n, ...visit(n.props.children)] : [];
  const text = n => Array.isArray(n) ? n.map(text).join("") : n && typeof n === "object" && n.props ? typeof n.type === "function" ? text(n.type(n.props)) : text(n.props.children) : n == null || typeof n === "boolean" ? "" : String(n);
  function render() { let count = 0; do { assert(++count < 30, "render loop"); dirty = false; cursor = 0; tree = VehicleComparison(); const effects = queued; queued = []; effects.forEach(fn => fn()); } while (dirty); }
  const field = label => visit(visit(tree).find(n => n.type === "label" && text(n).startsWith(label))).find(n => n.type === "input");
  render();
  return { records, calls, key, failures, text: () => text(tree), value: label => field(label).props.value,
    field(label, value) { field(label).props.onChange({ target: { value } }); render(); },
    click(label) { const button = visit(tree).find(n => n.type === "button" && text(n) === label); assert(button, label); button.props.onClick(); render(); },
    flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); render(); },
  };
}
test("fresh and restored views never write until an edit", () => { for (const saved of [null, raw]) { const app = mount(saved); app.flush(); assert.equal(app.calls.length, 0); assert.equal(app.records.get(app.key) ?? null, saved); } });
test("valid edit survives reload, including empty costs and zero", () => { const app = mount(raw); app.field("구매가", "0"); app.flush(); assert(app.text().includes("저장됨")); const reloaded = mount(app.records.get(app.key)); assert.equal(reloaded.value("구매가"), "0"); assert.equal(reloaded.value("차량 구분명"), "Fixture"); });
test("damaged saves stay byte-identical after mounting and editing", () => { for (const saved of corrupt) { const app = mount(saved); app.field("차량 구분명", "Draft"); app.flush(); assert.equal(app.records.get(app.key), saved); assert.equal(app.calls.length, 0); assert(app.text().includes("자동 저장 중지")); } });
test("read denial preserves save and blocks all implicit writes", () => { const app = mount(raw, { read: true }); app.field("구매가", "250"); app.flush(); assert.equal(app.records.get(app.key), raw); assert.equal(app.calls.length, 0); });
test("quota failure shows failure, keeps visible draft and previous save", () => { const app = mount(raw, { write: true }); app.field("구매가", "250"); app.flush(); assert.equal(app.records.get(app.key), raw); assert.equal(app.value("구매가"), "250"); assert(app.text().includes("저장 실패")); });
test("invalid edits cancel pending writes and corrections save", () => { const app = mount(raw); app.field("구매가", "250"); app.field("구매가", "-1"); app.flush(); assert.equal(app.records.get(app.key), raw); assert(app.text().includes("저장 보류")); app.field("구매가", "275"); app.flush(); assert.equal(JSON.parse(app.records.get(app.key))[0].price, "275"); });
test("reset cancellation preserves pending edits; confirmed reset cancels them", () => { const app = mount(raw, { cancel: true }); app.field("구매가", "250"); app.click("비교표 초기화"); assert.equal(app.value("구매가"), "250"); assert.equal(app.calls.length, 0); app.failures.cancel = false; app.click("비교표 초기화"); app.flush(); assert.equal(app.records.has(app.key), false); assert.equal(app.value("구매가"), ""); });
test("failed reset preserves both on-screen draft and previous save", () => { const app = mount(raw, { remove: true }); app.click("비교표 초기화"); assert.equal(app.records.get(app.key), raw); assert.equal(app.value("구매가"), "12000"); assert(app.text().includes("초기화 실패")); });
test("explicit reset unblocks damaged storage and next edit persists", () => { const app = mount("null"); app.click("비교표 초기화"); app.field("차량 구분명", "Recovered"); app.flush(); assert.equal(JSON.parse(app.records.get(app.key))[0].name, "Recovered"); });
test("candidate deletion requires confirmation and retains at least two", () => { const app = mount(raw, { cancel: true }); app.click("차량 추가"); app.flush(); app.click("삭제"); app.flush(); assert.equal(JSON.parse(app.records.get(app.key)).length, 3); app.failures.cancel = false; app.click("삭제"); app.flush(); assert.equal(JSON.parse(app.records.get(app.key)).length, 2); });
test("blank costs are incomplete, not a zero-dollar estimate", () => {
  const result = costs.vehicleCostSummary(lib.makeVehicle(0));
  assert.equal(result.provided, 0); assert.equal(result.complete, false);
  assert.equal(result.firstYear, null); assert.equal(result.upfront, null);
  const app = mount(); assert(app.text().includes("비용 0/7 입력")); assert(!app.text().includes("첫 1년 예상 합계")); assert(!app.text().includes("$0.00"));
});
test("one entered price is a subtotal and missing costs stay explicit", () => {
  const result = costs.vehicleCostSummary({ ...lib.makeVehicle(0), price: "12000" });
  assert.equal(result.firstYear, 12000); assert.equal(result.provided, 1); assert.equal(result.complete, false);
  const app = mount(); app.field("구매가", "12000"); assert(app.text().includes("입력한 1년 비용 소계$12,000.00")); assert(app.text().includes("비용 1/7 입력"));
});
test("seven explicit zeroes count as a complete zero-dollar input", () => {
  const vehicle = { ...lib.makeVehicle(0), ...Object.fromEntries(lib.vehicleCosts.map(field => [field, "0"])) };
  const result = costs.vehicleCostSummary(vehicle); assert.equal(result.complete, true); assert.equal(result.firstYear, 0);
  const app = mount(JSON.stringify([vehicle, lib.makeVehicle(1)])); assert(app.text().includes("첫 1년 예상 합계$0.00"));
});
test("first year includes upfront and annual amounts plus twelve monthly fuel costs", () => {
  const vehicle = { ...lib.makeVehicle(0), price: "12000", transfer: "400", inspection: "250", insurance: "1200", rego: "800", servicing: "600", fuel: "125.50" };
  const result = costs.vehicleCostSummary(vehicle); assert.equal(result.upfront, 12650); assert.equal(result.firstYear, 16756); assert.equal(result.complete, true);
});
test("invalid numeric drafts suppress totals until corrected", () => {
  for (const value of ["-1", "NaN", "Infinity", "1000000000001"]) { const result = costs.vehicleCostSummary({ ...fixture[0], price: value }); assert.equal(result.firstYear, null); assert.equal(result.invalid[0], "price"); }
  const app = mount(raw); app.field("구매가", "-1"); assert(app.text().includes("잘못된 금액")); assert(!app.text().includes("$1,506.00")); app.field("구매가", "12000"); assert(app.text().includes("$13,506.00"));
});
test("currency display is fixed to cents without floating-point tails", () => { assert.equal(costs.formatVehicleCost(0.1 + 0.2), "$0.30"); assert.equal(costs.formatVehicleCost(null), "—"); });
console.log(`Vehicle comparison storage and costs: ${checks} PASS`);
