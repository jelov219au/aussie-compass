import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, articlePage, picker, arrival, depthContract] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/WorkersCompJurisdictionPicker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/arrival-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("./check-content-depth-foundation.mjs", import.meta.url), "utf8"),
]);

const start = articles.indexOf('slug: "australia-workplace-injury-workers-compensation-guide"');
const end = articles.indexOf('slug: "australia-public-holiday-work-pay-guide"', start);
assert.ok(start >= 0 && end > start, "workplace injury article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "지금 위험하면 Claim보다 안전과 치료가 먼저예요",
  "Incident report와 Compensation Claim은 같은 서류가 아니에요",
  "어느 주·준주 Scheme인지 먼저 확인하세요",
  "임금·Sick leave·Weekly payments를 섞지 마세요",
  "Psychological injury는 안전·의료·Claim을 따로 챙기세요",
  "Return to Work는 원래 업무로 즉시 복귀한다는 뜻이 아니에요",
  "거절이나 종료 통지를 받으면 기한부터 찾으세요",
  "Claim·안전조치·고용문제를 세 줄로 나누세요",
]) {
  assert.ok(article.includes(phrase), `workplace injury guide is missing: ${phrase}`);
}

for (const question of [
  "I was injured at work on [date]",
  "Please provide the name and contact details of the workers compensation insurer",
  "Please confirm whether my claim form and certificate of capacity have been received",
  "Could you provide the decision, reasons, covered injury and review deadline in writing?",
]) {
  assert.ok(article.includes(question) && article.includes("—"), `copy-ready workplace question needs its Korean meaning: ${question}`);
}

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 20, "workplace injury guide needs the complete injury-to-review workflow");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 18, "workplace injury guide needs national and jurisdiction official sources");
assert.ok(articlePage.includes("<WorkersCompJurisdictionPicker />"), "workplace injury article must render the jurisdiction picker");

for (const jurisdiction of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(picker.includes(`id: "${jurisdiction}"`), `workers compensation picker is missing ${jurisdiction}`);
}
assert.ok(picker.includes("jurisdictions.find"), "workers compensation picker must show only the selected jurisdiction");
assert.doesNotMatch(picker, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/, "picker must not transmit or persist the worker selection");
assert.ok(arrival.includes('href="/resources/australia-workplace-injury-workers-compensation-guide"'), "arrival checklist must expose the workplace injury handoff");
assert.ok(depthContract.includes("articleBlocks.length, 35"), "content-depth baseline must include the audited workplace injury guide after public-holiday deduplication");

for (const source of [article, articlePage, picker, arrival]) {
  assert.doesNotMatch(source, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "workplace injury content changes must remain outside payment flows");
}

console.log("WORKPLACE_INJURY_DEPTH=PASS jurisdictions=8 sections>=20 sources>=18");
