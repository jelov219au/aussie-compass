import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
function load(file, resolve) { const record = { exports: {} }; runInNewContext(ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: record, exports: record.exports, require: resolve }); return record.exports; }
const data = load("src/data/englishPhrases.ts", name => assert.fail(name));
let checks = 0;
function test(label, fn) { fn(); checks++; console.log(`PASS ${label}`); }
test("all phrase IDs stay unique and the 25 previous IDs remain available", () => { assert.equal(new Set(data.phrases.map(p => p.id)).size, 30); const ids = ["slowly","different-way","write-down","understood","next-step","bank-id","bank-fees","bank-id-check","bank-details","bank-transaction","rent-inclusions","rent-bond","rent-agreement","rent-condition","rent-notice","work-rate","work-payslip","work-hours","work-difference","work-payroll","health-interpreter","health-form","health-worse","health-medicine","health-avoid"]; assert.equal(ids.length, 25); ids.forEach(id => assert(data.phrases.some(p => p.id === id))); });
test("global searches find fee, bond, payslip and all three new phone questions", () => { for (const [query, id] of [["수수료", "bank-fees"], ["bond", "rent-bond"], ["payslip", "work-payslip"], ["mobile number", "phone-number"], ["recharge", "phone-renewal"], ["current number", "phone-port"]]) assert(data.findPhrases("all", query, []).some(p => p.id === id)); });
test("category and saved searches remain explicit subsets", () => { assert(data.findPhrases("bank", "", []).every(p => p.category === "bank")); assert.equal(data.findPhrases("saved", "payslip", ["bank-fees"]).length, 0); assert.equal(data.findPhrases("saved", "payslip", ["work-payslip"])[0].id, "work-payslip"); });
test("normal saved IDs round trip; malformed, duplicate and unknown IDs stay rejected", () => { const raw = '["bank-fees","work-payslip"]'; assert.equal(data.serializeSavedPhrases(data.parseSavedPhrases(raw)), raw); for (const raw of ['{broken', 'null', '["unknown"]', '["slowly","slowly"]', '[1]']) assert.equal(data.parseSavedPhrases(raw), null); });
let props;
const page = load("src/app/english-phrase-cards/page.tsx", name => {
  if (name === "react/jsx-runtime") return require(name);
  if (name === "next/link") return { default: ({ children, ...props }) => React.createElement("a", props, children) };
  if (name === "@/data/englishPhrases") return data;
  if (name === "@/lib/site") return { createPageMetadata: value => value };
  if (name === "@/components/tools/EnglishPhraseCards") return { EnglishPhraseCards: value => { props = value; return null; } };
  if (name === "@/components/ui/Container") return { Container: ({ children }) => React.createElement("div", null, children) };
  if (name.startsWith("@/components/")) return new Proxy({}, { get: () => () => null });
  assert.fail(name);
});
for (const [situation, phrase] of [["bank", "bank-fees"], ["home", "rent-agreement"], ["work", "work-rate"], ["health", "health-interpreter"]]) {
  const html = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ situation, phrase }) }));
  test(`deep link ${situation}/${phrase} and shared card English stay aligned`, () => { assert.equal(props.initialCategory, situation); assert.equal(props.focusPhraseId, phrase); assert(html.includes(`situation=${situation}&amp;phrase=${phrase}#phrase-${phrase}`)); assert(html.includes(data.phrases.find(p => p.id === phrase).english)); });
}
console.log(`English phrase regressions: ${checks} PASS`);
