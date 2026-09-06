import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");
function evaluate(source, resolve) {
  const loaded = { exports: {} };
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(output, { module: loaded, exports: loaded.exports, require: resolve });
  return loaded.exports;
}

const life = evaluate(read("src/lib/lifeReminders.ts"), () => assert.fail("unexpected import"));
const checklist = evaluate(read("src/lib/departureChecklist.ts"), (name) => name === "@/lib/lifeReminders" ? life : assert.fail(name));
const action = evaluate(read("src/lib/departureNextAction.ts"), (name) => name === "@/lib/lifeReminders" ? life : assert.fail(name));
const page = read("src/app/leaving-australia-guide/page.tsx");
const component = read("src/components/tools/DepartureNextAction.tsx");
const project = read("src/components/tools/DepartureProjectChecklist.tsx");
const data = read("src/data/departureNextActions.ts");
const checker = read("src/components/tools/DaspReadinessCheck.tsx");
const actionSource = read("src/lib/departureNextAction.ts");
const checklistSource = read("src/lib/departureChecklist.ts");
const all = [page, component, project, data, checker, actionSource, checklistSource].join("\n");

const items = Array.from({ length: 20 }, (_, index) => ({ id: `task-${index}`, label: `Task ${index}`, detail: "" }));
const migrated = checklist.departureChecklistCodec(items).parse(JSON.stringify({ checked: ["task-1", "task-7"], targetDate: "2026-09-30" }));
assert.equal(migrated.statuses["task-1"], "review_needed");
assert.equal(migrated.statuses["task-7"], "review_needed");
assert.equal(migrated.statuses["task-2"], "pending");
assert.equal(migrated.targetDate, "2026-09-30");
assert(checklist.departureChecklistCodec(items).parse(JSON.stringify(migrated)));
assert.equal(checklist.departureChecklistCodec(items).parse('{"checked":["missing"],"targetDate":""}'), null);

const valid = {
  ...action.emptyDepartureNextAction,
  stage: "already_departed",
  task: "final_pay",
  applicability: { ...action.emptyDepartureNextAction.applicability, final_pay: "applicable" },
  status: "awaiting_confirmation",
  recheckDate: "2026-09-14",
  evidence: "receipt_saved",
};
assert(action.departureActionValid(valid));
assert(!action.departureActionValid({ ...valid, status: "not_applicable" }));
assert(!action.departureActionValid({ ...valid, applicability: { ...valid.applicability, final_pay: "not_applicable" } }));
assert(!action.departureActionValid({ ...valid, task: "bond", applicability: { ...valid.applicability, bond: "applicable" }, jurisdiction: "" }));
assert(action.departureActionValid({ ...valid, task: "bond", applicability: { ...valid.applicability, bond: "applicable" }, jurisdiction: "NSW" }));
assert.equal(action.parseDepartureNextAction(JSON.stringify({ ...valid, extra: true })), null);

for (const value of [
  "before_8_plus_weeks", "before_4_to_8_weeks", "before_1_to_4_weeks", "before_7_days", "already_departed",
  "pending", "applicable", "not_applicable", "requested_or_submitted", "awaiting_confirmation",
  "received_or_final_bill_reconciled", "blocked_or_disputed", "location_chosen", "copy_saved", "receipt_saved",
]) assert(all.includes(value), `departure contract value missing: ${value}`);

for (const route of [
  "fairwork.gov.au/ending-employment/final-pay", "nsw.gov.au/housing-and-construction",
  "energymadeeasy.gov.au", "acma.gov.au/switch-your-phone-or-internet-provider",
  "my.gov.au/en/about/help", "moneysmart.gov.au/banking", "auspost.com.au/personal/receiving",
  "ato.gov.au/individuals-and-families/your-tax-return",
  "departing-australia-superannuation-payment-dasp",
]) assert(data.includes(route), `official task route missing: ${route}`);

assert(page.indexOf("<DepartureNextAction") < page.indexOf("<DepartureProjectChecklist"), "free outcome must precede the 20-item project");
assert(!page.includes("leaving-pro-cta"), "static Pro handoff must not precede the free outcome");
assert(component.indexOf("officialOpened && valid") < component.indexOf('href="/leaving-australia-pro"'), "Pro must appear only after an official action");
assert(page.includes("표를 좌우로 밀어"));
assert.doesNotMatch(all, /applicant\.tr\.super\.ato\.gov\.au|\?pid=1/, "failed DASP direct service must be absent");
assert.doesNotMatch(`${component}\n${project}`, /@vercel\/analytics|\btrack\s*\(|sendBeacon|XMLHttpRequest|\bfetch\s*\(/, "raw state and dates must not be sent to analytics");

console.log("LEAVING_FREE_DEPARTURE_NEXT_ACTION=PASS legacy-review=2 task-routes=8 broken-dasp=0");
