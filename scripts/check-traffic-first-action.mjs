import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = process.cwd();

// Exercise actual component handlers without a server, browser or analytics network.
function harness({ qa = false, blocked = false, loaded = true, taxStorage = "ready", plan } = {}) {
  const events = [], states = [], refs = [], cache = new Map();
  let stateIndex = 0, refIndex = 0, checked = plan, nextId = 0;
  const storage = { getItem: () => { if (blocked) throw Error("storage blocked"); return qa ? "1" : null; } };
  const react = {
    ...require("react"),
    useEffect: () => {},
    useMemo: compute => compute(),
    useState: initial => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;

      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useRef: initial => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
  };
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} }; cache.set(file, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const scopedRequire = name => {
      if (name === "react") return react;
      if (name === "@vercel/analytics") return { track: (name, data) => events.push({ name, data }) };
      if (name === "@vercel/analytics/next") return { Analytics: () => null };
      if (name === "@/lib/useLocalPlan") return { useLocalPlan: (_key, initial) => ({ data: checked ??= initial, storage: loaded ? taxStorage : "loading", reset: () => { checked = initial; }, update: next => { checked = typeof next === "function" ? next(checked) : next; } }) };
      if (name === "./TaxStorageNotice") return { TaxStorageNotice: () => null };
      if (name.startsWith("@/") || name.startsWith(".")) {
        const target = name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : path.resolve(path.dirname(file), name);
        return load([target, `${target}.ts`, `${target}.tsx`].find(p => fs.existsSync(p) && fs.statSync(p).isFile()));
      }
      return require(name);
    };
    vm.runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, require: scopedRequire, sessionStorage: storage, crypto: { randomUUID: () => `test-record-${++nextId}` }, window: { confirm: () => true, location: { origin: "https://hojucompass.com" } }, console, URL, Intl, Date, setTimeout, clearTimeout }, { filename: file });
    return loadedModule.exports;
  }
  const render = component => { stateIndex = 0; refIndex = 0; return component(); };
  return { load, render, events };
}

function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, predicate));
  if (!node || typeof node !== "object" || !node.props) return [];
  return [...(predicate(node) ? [node] : []), ...elements(node.props.children, predicate)];
}
const input = (tree, type) => elements(tree, n => n.type === "input" && n.props.type === type)[0];
const button = (tree, text) => elements(tree, n => n.type === "button" && n.props.children === text)[0];
const plain = value => JSON.parse(JSON.stringify(value));
const fresh = () => harness();
const core = fresh().load("src/lib/taxGuideNextAction.ts");
const presentation = fresh().load("src/lib/taxGuidePresentation.ts");
const classifier = fresh().load("src/lib/homeSearchTopic.ts").classifyHomeSearch;

const scenarios = ["standard", "individualDate", "individualUnreadable", "overdue", "atoNotice", "atoUnavailable", "agentUnverified", "agentVerified", "agentLateContact", "priorOverdue", "priorFixedPending", "agentAppearsRegistered", "agentUnregistered", "agentAmbiguous", "basOnly", "tpbUnavailable"];
let cases = 0;
for (const lodgingPath of ["unknown", "selfLodge", "registeredAgent"]) {
  for (const scenario of scenarios) {
    for (const today of ["2026-09-11", "2026-11-03"]) {
      const result = core.buildTaxGuideNextAction({ incomeYear: "2025-26", lodgingPath, scenario, today, individualDueDate: today });
      const original = JSON.stringify(result), labels = presentation.presentTaxGuideNextAction(result);
      assert.equal(JSON.stringify(result), original, "presentation must not mutate the decision");
      for (const value of Object.values(labels)) {
        assert.doesNotMatch(value, /[a-z]+_[a-z]+|CHECK NOW|STOP |general only| TODAY| AEST/);
        assert.ok(value.length > 0);
      }
      assert.notEqual(labels.due_state, "공식 안내 확인이 필요합니다", "every current state needs an explicit label");
      assert.notEqual(labels.next_action, "공식 안내 확인하기", "every current action needs an explicit label");
      const date = result.due_or_recheck.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      if (date) assert.ok(labels.due_or_recheck.includes(date), "display must preserve the decision date");
      cases++;
    }
  }
}
const unknown = core.buildTaxGuideNextAction({ incomeYear: "unknown", lodgingPath: "unknown", scenario: "standard", today: "2026-09-11" });
assert.equal(presentation.presentTaxGuideNextAction(unknown).income_year, "확인 필요");
const taxRender = fresh(), taxView = taxRender.load("src/components/tools/TaxGuideNextAction.tsx").TaxGuideNextAction;
const taxTree = taxRender.render(taxView);
const dt = elements(taxTree, n => n.type === "dt").map(n => n.props.children);
assert.deepEqual(dt, Object.values(presentation.taxGuideFieldLabels));
assert.equal(elements(taxTree, n => n.type === "a")[0].props.href, core.ATO_NEED_ROUTE);

for (const term of ["중고차", "중고 차 구매", "차량 검사", "자동차 구매", "used-car checklist", "used cars", "buying a car", "car inspection", "PPSR", "Carsales"]) assert.equal(classifier(term), "used_car", term);
for (const [term, expected] of [["career", "jobs"], ["house inspection", "housing"], ["tax return", "tax"], ["car tax deductions", "tax"], ["급여", "pay"], ["visa", "visa"], ["", "other"]]) assert.equal(classifier(term), expected, term);

for (const type of ["pageview", "event"]) {
  const excluded = harness({ qa: true }).load("src/components/analytics/PrivacyFriendlyAnalytics.tsx");
  assert.equal(excluded.removeQueryAndFragment({ type, url: "https://hojucompass.com/tax-return-guide?private=value#notes" }), null);
  for (const blocked of [false, true]) {
    const normal = harness({ blocked }).load("src/components/analytics/PrivacyFriendlyAnalytics.tsx");
    assert.equal(normal.removeQueryAndFragment({ type, url: "https://hojucompass.com/tax-return-guide?private=value#notes" }).url, "https://hojucompass.com/tax-return-guide");
  }
}

for (const qa of [false, true]) {
  const h = harness({ qa }), Component = h.load("src/components/tools/TaxReturnChecklist.tsx").TaxReturnChecklist;
  let tree = h.render(Component);
  assert.equal(h.events.length, 0, "mount/restored state is not a user action");
  for (let i = 0; i < 10; i++) { input(tree, "checkbox").props.onChange(); tree = h.render(Component); }
  assert.equal(h.events.length, qa ? 0 : 1);
  if (!qa) assert.deepEqual(plain(h.events[0]), { name: "Tool Started", data: { schema_version: "1", tool: "tax_return_guide", entry: "unknown" } });
}
const loading = harness({ taxStorage: "loading" });
input(loading.render(loading.load("src/components/tools/TaxReturnChecklist.tsx").TaxReturnChecklist), "checkbox").props.onChange();
assert.equal(loading.events.length, 0);

for (const qa of [false, true]) {
  const h = harness({ qa }), Component = h.load("src/components/tools/VehicleComparison.tsx").VehicleComparison;
  let tree = h.render(Component);
  assert.equal(h.events.length, 0);
  input(tree, undefined).props.onChange({ target: { value: " " } });
  tree = h.render(Component);
  input(tree, "number").props.onChange({ target: { value: "-1" } });
  tree = h.render(Component);
  assert.equal(h.events.length, 0, "blank names and invalid costs must not start the tool");
  input(tree, undefined).props.onChange({ target: { value: "PRIVATE-CAR-NAME" } });
  tree = h.render(Component);
  input(tree, "checkbox").props.onChange({ target: { checked: true } });
  button(h.render(Component), "차량 추가").props.onClick();
  button(h.render(Component), "비교표 초기화").props.onClick();
  assert.equal(h.events.length, qa ? 0 : 1);
  if (!qa) assert.deepEqual(plain(h.events[0]), { name: "Tool Started", data: { schema_version: "1", tool: "used_car_comparison", entry: "unknown" } });
}
const add = fresh(), Vehicle = add.load("src/components/tools/VehicleComparison.tsx").VehicleComparison;
button(add.render(Vehicle), "차량 추가").props.onClick();
assert.equal(add.events.length, 1, "adding a candidate is a meaningful first action");
const resetting = fresh(), ResetVehicle = resetting.load("src/components/tools/VehicleComparison.tsx").VehicleComparison;
button(resetting.render(ResetVehicle), "비교표 초기화").props.onClick();
assert.equal(resetting.events.length, 0, "reset alone does not represent starting comparison");
const waiting = harness({ loaded: false }), WaitingVehicle = waiting.load("src/components/tools/VehicleComparison.tsx").VehicleComparison;
button(waiting.render(WaitingVehicle), "차량 추가").props.onClick();
assert.equal(waiting.events.length, 0);
const storageBlocked = harness({ blocked: true });
input(storageBlocked.render(storageBlocked.load("src/components/tools/TaxReturnChecklist.tsx").TaxReturnChecklist), "checkbox").props.onChange();
assert.equal(storageBlocked.events.length, 1, "optional storage failure must not break a user action");

// A ledger start is an accepted record, never a draft, restoration or rejection.
const submit = tree => elements(tree, n => n.type === "form")[0].props.onSubmit({ preventDefault() {} });
function ledgerDraft(h, Component, { date = "2026-09-11", amount = "45.90", description = "PRIVATE RECEIPT LOCATION" } = {}) {
  let tree = h.render(Component);
  for (const [type, value] of [["date", date], ["number", amount], ["text", description]]) {
    input(tree, type).props.onChange({ target: { value } });
    tree = h.render(Component);
  }
  return tree;
}
for (const qa of [false, true]) {
  const h = harness({ qa }), Component = h.load("src/components/tools/TaxPrepTracker.tsx").TaxPrepTracker;
  submit(h.render(Component));
  submit(ledgerDraft(h, Component, { amount: "0" }));
  submit(ledgerDraft(h, Component, { date: "2026-02-30" }));
  submit(ledgerDraft(h, Component, { description: " " }));
  // Valid-looking fields that fail complete record validation must not count.
  submit(ledgerDraft(h, Component, { description: "x".repeat(121) }));
  assert.equal(h.events.length, 0, "drafts and rejected submissions must not start a ledger");
  submit(ledgerDraft(h, Component));
  submit(ledgerDraft(h, Component));
  assert.equal(h.events.length, qa ? 0 : 1);
  if (!qa) assert.deepEqual(plain(h.events[0]), { name: "Tool Started", data: { schema_version: "1", tool: "tax_prep_tracker", entry: "unknown" } });
}
for (const taxStorage of ["loading", "blocked"]) {
  const h = harness({ taxStorage, blocked: true }), Component = h.load("src/components/tools/TaxPrepTracker.tsx").TaxPrepTracker;
  submit(ledgerDraft(h, Component));
  assert.equal(h.events.length, taxStorage === "loading" ? 0 : 1, "only loading prevents accepted local edits");
}
const restoredLedger = harness({ plan: [{ id: "restored", date: "2026-09-11", kind: "expense", category: "tools", description: "PRIVATE", amount: 20, evidence: "saved", createdAt: "2026-09-11T00:00:00.000Z" }] });
restoredLedger.render(restoredLedger.load("src/components/tools/TaxPrepTracker.tsx").TaxPrepTracker);
assert.equal(restoredLedger.events.length, 0, "restoring ledger records must not emit");

console.log(`TRAFFIC_FIRST_ACTION=PASS tax_presentations=${cases} search=17 qa_pageview_and_event=true handlers=true ledger=true private_values_sent=false`);
