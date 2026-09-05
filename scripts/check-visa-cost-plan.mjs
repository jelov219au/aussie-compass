import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as plan from "../src/lib/visaCostPlan.ts";

const require = createRequire(import.meta.url), ts = require("typescript");
const source = readFileSync(new URL("../src/components/tools/VisaCostPlanner.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const nodeText = node => node == null || typeof node === "boolean" ? "" : typeof node !== "object" ? String(node)
  : Array.isArray(node) ? node.map(nodeText).join("") : nodeText(node.props?.children);

// Execute real component effects and input handlers. Browser rendering is checked separately.
function fixture(saved = null, failRead = false) {
  let raw = saved, writes = 0, cursor = 0, tree, failWrite = false;
  const hooks = [], effects = [];
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in hooks)) hooks[i] = initial;
      return [hooks[i], next => { hooks[i] = typeof next === "function" ? next(hooks[i]) : next; }];
    },
    useEffect(fn, deps) {
      const i = cursor++, previous = hooks[i];
      if (!previous || deps.some((value, index) => !Object.is(value, previous[index]))) effects.push(fn);
      hooks[i] = deps;
    },
  };
  const result = { exports: {} };
  runInNewContext(compiled, {
    module: result, exports: result.exports,
    localStorage: {
      getItem: () => { if (failRead) throw Error("Denied"); return raw; },
      setItem: (key, value) => {
        assert.equal(key, "aussie-compass-visa-cost-plan-v1");
        if (failWrite) throw Error("Quota");
        raw = value; writes++;
      },
    },
    require: name => name === "react" ? react : name === "react/jsx-runtime" ? require(name)
      : name === "@/lib/visaCostPlan" ? plan : assert.fail(`Unexpected import: ${name}`),
  });
  function render() {
    for (let n = 0; n < 6; n++) {
      cursor = 0; tree = result.exports.VisaCostPlanner();
      if (!effects.length) return;
      effects.splice(0).forEach(fn => fn());
    }
    assert.fail("Effects failed to settle");
  }
  const inputs = () => {
    const found = [];
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(visit);
      if (node.type === "input") found.push(node);
      visit(node.props?.children);
    }
    visit(tree); return found;
  };
  render();
  return {
    edit(index, value) { inputs()[index].props.onChange({ target: { value } }); render(); },
    text: () => nodeText(tree), inputs, stored: () => raw, writes: () => writes,
    failWrites(value) { failWrite = value; },
  };
}

let checks = 0;
const blank = fixture();
assert.match(blank.text(), /아직 입력한 비용이 없어요/); assert.doesNotMatch(blank.text(), /A\$0\.00/);
assert.equal(blank.writes(), 0); checks++;
blank.edit(0, "0"); assert.match(blank.text(), /입력한 비용 소계A\$0\.00/); assert.match(blank.text(), /금액 입력 1\/8/); checks++;
blank.edit(1, "12.35"); blank.edit(2, "0.10"); assert.match(blank.text(), /A\$12\.45/); checks++;
for (const invalid of ["-20", "Infinity", "1e300", "wrong", "1.234", "9007199254740992"]) {
  blank.edit(3, invalid);
  assert.equal(blank.inputs()[3].props["aria-invalid"], true);
  assert.match(blank.text(), /A\$12\.45/); checks++;
}
const validRaw = JSON.stringify({ application: "315.55", medical: "0", oldField: "keep" });
const normal = fixture(validRaw); assert.equal(normal.stored(), validRaw); assert.equal(normal.writes(), 0);
normal.edit(2, "5"); assert.equal(JSON.parse(normal.stored()).oldField, "keep"); assert.match(normal.text(), /A\$320\.55/); checks++;
for (const damaged of ["null", "[]", "42", '"text"', "{bad", '{"application":20}']) {
  const f = fixture(damaged); assert.match(f.text(), /자동 저장을 중지/);
  f.edit(0, "25.10"); assert.equal(f.stored(), damaged); assert.equal(f.writes(), 0); assert.match(f.text(), /A\$25\.10/); checks++;
}
const unavailable = fixture(validRaw, true); unavailable.edit(0, "4"); assert.equal(unavailable.writes(), 0); checks++;
const quota = fixture(validRaw); quota.failWrites(true); quota.edit(0, "10");
assert.equal(quota.stored(), validRaw); assert.match(quota.text(), /저장하지 못했습니다/);
quota.failWrites(false); quota.edit(0, "11"); assert.equal(JSON.parse(quota.stored()).application, "11"); checks++;
const all = fixture(JSON.stringify(Object.fromEntries(plan.visaCostFields.map(({ id }) => [id, "0"]))));
assert.match(all.text(), /입력한 비용 합계A\$0\.00/); assert.match(all.text(), /금액 입력 8\/8/); checks++;
console.log(JSON.stringify({ status: "PASS", checks, scope: "Actual VisaCostPlanner effects/handlers and amount validation; no browser or remote storage" }));
