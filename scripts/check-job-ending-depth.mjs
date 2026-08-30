import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, guides, depthContract] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/guides/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("./check-content-depth-foundation.mjs", import.meta.url), "utf8"),
]);

const start = articles.indexOf('slug: "australia-job-ending-final-pay-dismissal-guide"');
const end = articles.indexOf('slug: "australia-workplace-injury-workers-compensation-guide"', start);
assert.ok(start >= 0 && end > start, "job ending article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "Resignation·Dismissal·Redundancy를 같은 종료로 보지 마세요",
  "Probation이라고 Notice·Final pay가 사라지지는 않아요",
  "Final pay는 한 금액이 아니라 항목표로 받아야 해요",
  "21일 기한은 Final pay 분쟁과 별도예요",
  "Job loss가 Visa에 영향을 줄 수 있으면 당일 확인하세요",
  "Workplace Injury Claim과 Employment ending도 분리하세요",
  "Employer가 Insolvent라면 FEG가 자동 보장하는 것은 아니에요",
  "21일 안에 만드는 Evidence pack",
]) {
  assert.ok(article.includes(phrase), `job ending guide is missing: ${phrase}`);
}

for (const question of [
  "Please confirm in writing whether my employment has ended",
  "Please itemise my final pay",
  "Please provide the award, agreement or NES basis",
  "Please confirm my legal employer name",
  "Could you provide my Employment Separation Certificate",
]) {
  assert.ok(article.includes(question) && article.includes("—"), `copy-ready job ending question needs its Korean meaning: ${question}`);
}

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 20, "job ending guide needs the complete final-pay and deadline workflow");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 12, "job ending guide needs verified official sources");
assert.ok(guides.includes('href: "/resources/australia-job-ending-final-pay-dismissal-guide"'), "pay guide index must expose the job ending guide");
assert.ok(depthContract.includes("articleBlocks.length, 35"), "content-depth baseline must include the audited job ending guide");
assert.doesNotMatch(article, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "job ending content changes must remain outside payment flows");

console.log("JOB_ENDING_DEPTH=PASS sections>=20 sources>=12 copy-questions=5");
