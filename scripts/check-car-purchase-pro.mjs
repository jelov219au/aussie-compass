import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as car from "../src/lib/carPurchasePro.ts";

let checks = 0;
function check(name, fn) { fn(); checks++; console.log("PASS " + name); }
const clone = value => JSON.parse(JSON.stringify(value));
const sample = car.sampleCarDraft();

check("AUD cents: missing, zero, decimals, invalid and overflow", () => {
  assert.deepEqual(car.parseCarMoney(""), { kind: "missing" });
  assert.deepEqual(car.parseCarMoney("  "), { kind: "missing" });
  for (const [raw, cents] of [["0", 0], ["0.00", 0], ["10.1", 1010], [" 1200.45 ", 120045], ["9999999.99", 999999999]]) {
    assert.deepEqual(car.parseCarMoney(raw), { kind: "value", cents });
  }
  for (const raw of ["-1", "NaN", "Infinity", "1e3", "1,000", "$2", "10000000", "1.001", "1.", ".5"]) {
    assert.equal(car.parseCarMoney(raw).kind, "invalid");
  }
});
check("Unknown quote stays unknown; zero is a confirmed amount", () => {
  const b = clone(sample.candidates[1]);
  assert.equal(car.summarizeCar(b).subtotal, 850000);
  assert.equal(car.summarizeCar(b).missing, 1);
  b.issues[0].quote = "0";
  assert.equal(car.summarizeCar(b).missing, 0);
  b.issues[0].quote = "bad";
  assert.equal(car.summarizeCar(b).invalid, 1);
});
check("Agreed price replaces asking price; actual replaces estimate once", () => {
  const b = clone(sample.candidates[1]);
  b.agreedPrice = "7600"; b.issues[0].quote = "450";
  assert.equal(car.summarizeCar(b).subtotal, 865000);
  b.issues[0].actualCost = "470";
  assert.equal(car.summarizeCar(b).subtotal, 867000);
  assert.equal(car.summarizeCar(b).actualRepair, 47000);
  assert.equal(car.summarizeCar(b).estimatedRepair, 0);
  b.issues[0].actualCost = "-1";
  assert.equal(car.summarizeCar(b).invalid, 1);
  assert.equal(car.summarizeCar(b).subtotal, 820000);
  b.agreedPrice = "invalid";
  assert.equal(car.summarizeCar(b).invalid, 2);
  assert.equal(car.summarizeCar(b).subtotal, 60000);
});
check("Seller-paid and unknown payer items remain explicitly excluded", () => {
  const a = clone(sample.candidates[0]);
  a.issues[0].quote = "600";
  assert.equal(car.summarizeCar(a).subtotal, 880000);
  assert.equal(car.summarizeCar(a).sellerItems, 1);
  a.issues[0].payer = "unknown";
  assert.equal(car.summarizeCar(a).payerUnknown, 1);
  assert.equal(car.summarizeCar(a).subtotal, 880000);
});
check("Reply and promise are not completion; clearing proof reopens item", () => {
  const issue = clone(sample.candidates[0].issues[0]);
  assert.equal(car.isCarIssueResolved(issue), false);
  issue.status = "answered";
  assert.equal(car.isCarIssueResolved(issue), false);
  issue.status = "verified";
  assert.equal(car.isCarIssueResolved(issue), false);
  issue.evidence = "가상 교체 영수증";
  issue.recheckedOn = "2026-09-06";
  issue.recheckNote = "독립 정비사가 교체 타이어를 재확인";
  assert.equal(car.isCarIssueResolved(issue), true);
  issue.recheckedOn = "2026-02-30";
  assert.equal(car.isCarIssueResolved(issue), false);
  issue.recheckedOn = "2026-09-06"; issue.evidence = " ";
  assert.equal(car.isCarIssueResolved(issue), false);
  assert.equal(car.carIssueStatus(issue), "완료 근거 보완 필요");
});
check("Dated snapshot preserves the whole prior state after edits", () => {
  const saved = car.addCarSnapshot(sample, sample.candidates[0], "snapshot-1", "2026-09-03T10:00:00.000Z");
  const before = saved.snapshots[0].text;
  saved.candidates[0] = { ...saved.candidates[0], agreedPrice: "100", reason: "changed" };
  assert.equal(saved.snapshots[0].text, before);
  assert(before.includes("$8,200.00") && !before.includes("changed"));
  assert.equal(sample.snapshots.length, 0);
  assert.throws(() => car.addCarSnapshot(sample, car.emptyCarCandidate("empty"), "snapshot-2", "2026-09-03T10:00:00.000Z"));
  assert.throws(() => car.addCarSnapshot({ ...sample, snapshots: Array(5).fill(saved.snapshots[0]) }, sample.candidates[0], "snapshot-6", "2026-09-03T10:00:00.000Z"));
});
check("JSON round-trip preserves unfinished inputs and snapshots", () => {
  const draft = clone(sample);
  draft.candidates[1].issues[0].quote = "-1.234";
  const frozen = car.addCarSnapshot(draft, draft.candidates[1], "backup-snapshot", "2026-09-03T10:00:00.000Z");
  assert.deepEqual(car.parseCarArchive(car.serializeCarDraft(frozen)), frozen);
  assert(car.carDraftText(frozen).includes("입력 확인 필요 (-1.234)"));
  assert(car.carDraftText(frozen).includes("미확정"));
});
check("Unsupported, corrupt, duplicate, invalid-date and oversized archives rejected", () => {
  const raw = car.serializeCarDraft(sample);
  for (const bad of ["", "{", "null", "[]", "true"]) assert.throws(() => car.parseCarArchive(bad));
  const modify = fn => { const archive = JSON.parse(raw); fn(archive); return JSON.stringify(archive); };
  for (const change of [
    archive => { archive.version = 2; },
    archive => { archive.format = "other-pack"; },
    archive => { archive.accessToken = "unexpected"; },
    archive => { archive.draft.candidates[0].extra = "unsupported"; },
    archive => { archive.draft.candidates.push(archive.draft.candidates[0]); },
    archive => { archive.draft.candidates[0].issues.push(archive.draft.candidates[0].issues[0]); },
    archive => { archive.draft.candidates[0].issues[0].checkedOn = "2026-02-30"; },
    archive => { archive.draft.candidates[0].inspection = "safe"; },
    archive => { archive.draft.candidates[0].alias = "x".repeat(81); },
    archive => { archive.draft.candidates = []; },
    archive => { archive.draft.snapshots = [{ id: "__proto__", recordedAt: "wrong", candidateAlias: "", text: "" }]; },
  ]) assert.throws(() => car.parseCarArchive(modify(change)));
  assert.throws(() => car.parseCarArchive("가".repeat(car.carArchiveMaxBytes / 3 + 1)));
});
check("Storage does not overwrite corrupt data, changed tabs or deleted records", () => {
  const raw = car.serializeCarDraft(sample);
  for (const original of ["", "{broken", JSON.stringify({ version: 9 })]) {
    const result = car.readCarDraft(() => ({ getItem: () => original, setItem: () => assert.fail("Read must not write") }));
    assert.equal(result.kind, "blocked");
    assert.equal(result.raw, original);
  }
  assert.equal(car.readCarDraft(() => { throw Error("denied"); }).kind, "blocked");
  assert.equal(car.readCarDraft(() => ({ getItem: () => null })).kind, "empty");
  assert.deepEqual(car.readCarDraft(() => ({ getItem: () => raw })).draft, sample);
  for (const changed of [null, "changed"]) {
    assert.equal(car.saveCarDraft(() => ({ getItem: () => changed, setItem: () => assert.fail("Conflict must not write") }), sample, raw).kind, "conflict");
  }
  assert.equal(car.saveCarDraft(() => ({ getItem: () => null, setItem: () => { throw Error("quota"); } }), sample, null).kind, "failed");
  let stored = null;
  const result = car.saveCarDraft(() => ({ getItem: () => stored, setItem: (key, value) => { assert.equal(key, car.carPurchaseStorageKey); stored = value; } }), sample, null);
  assert.equal(result.kind, "saved");
  assert.deepEqual(car.parseCarArchive(stored), sample);
});
check("Questions follow pending issues without claiming all checks passed", () => {
  assert(car.carQuestions(sample.candidates[0]).includes("repair evidence"));
  const b = clone(sample.candidates[1]); b.issues[0].payer = "unknown";
  assert(car.carQuestions(b).includes("Who will cover this cost"));
  assert(car.carQuestions(car.emptyCarCandidate("blank")).includes("모두 끝났다는 뜻은 아닙니다"));
});

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const pageSource = await readFile(new URL("../src/app/car-purchase-pro/workspace/page.tsx", import.meta.url), "utf8");
const loadPage = environment => {
  const result = { exports: {} };
  runInNewContext(compile(pageSource), { exports: result.exports, module: result, process: { env: { NODE_ENV: environment } },
    require: path => path === "react/jsx-runtime" ? require(path) :
      path === "next/navigation" ? { redirect: target => { throw Error("redirect:" + target); } } :
      path === "next/link" ? { default: props => React.createElement("a", props) } :
      path === "@/lib/carPurchaseProRuntime" ? { hasCarPurchaseWorkspaceAccess: async () => false } :
      new Proxy({}, { get: () => props => React.createElement("div", null, props?.children) }),
  });
  return result.exports.default;
};
for (const environment of ["production", "test", undefined]) {
  await assert.rejects(loadPage(environment)(), /redirect:\/car-purchase-pro/);
}
assert(renderToStaticMarkup(await loadPage("development")()).includes("내 중고차 거래노트"));
checks++;
console.log("PASS Production, test and missing env cannot open an unpaid workspace");
const articleSource = await readFile(new URL("../src/data/carInspectionFollowupArticle.ts", import.meta.url), "utf8");
const articlePageSource = await readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8");
const articleModule = { exports: {} };
runInNewContext(compile(articleSource), { exports: articleModule.exports, module: articleModule });
check("Article distinguishes official facts, synthetic costs and unreleased product", () => {
  const article = articleModule.exports.carInspectionFollowupArticle;
  assert.equal(article.toolHref, "/used-car-comparison#vehicle-comparison-heading");
  assert.equal(article.sources.length, 3);
  for (const expected of [
    {
      label: "NSW Government — Vehicle inspections checklist",
      href: "https://www.nsw.gov.au/driving-boating-and-transport/buying-and-selling-vehicles/buying-a-used-vehicle/vehicle-inspections-checklist",
      summary: ["독립적인 면허 보유", "검사 안내"],
    },
    {
      label: "PPSR — Do a used car or vehicle search",
      href: "https://www.ppsr.gov.au/carcheck",
      summary: ["기계 상태", "차량 등록"],
    },
    {
      label: "NSW Government — Vehicle repairs and maintenance",
      href: "https://www.nsw.gov.au/driving-boating-and-transport/buying-and-selling-vehicles/vehicle-repairs-and-maintenance",
      summary: ["비용·기간 견적", "추가 작업 승인"],
    },
  ]) {
    const source = article.sources.find(({ href }) => href === expected.href);
    assert(source, `Missing official source: ${expected.href}`);
    assert.equal(source.label, expected.label);
    for (const phrase of expected.summary) assert(source.summary.includes(phrase), `${expected.label} summary is missing: ${phrase}`);
  }
  const text = JSON.stringify(article);
  for (const phrase of ["가상 예시", "아직 가격 확정이나 판매", "Hoju Compass가 제안", "미확정"]) assert(text.includes(phrase));
});
check("Only the inspection follow-up article gets the header free-tool action", () => {
  assert(articlePageSource.includes('article.slug === "used-car-inspection-report-next-steps"'));
  assert(articlePageSource.includes('href="/used-car-comparison#vehicle-comparison-heading"'));
  assert(articlePageSource.includes('eventName="Article Header Action"'));
  assert(articlePageSource.includes('properties={{ article: article.slug, destination: "free_tool" }}'));
  assert(articlePageSource.includes("무료 후보·비용 비교표 열기"));
});
console.log(checks + " scenario groups passed. No build, server start, external API, payment or publication.");
