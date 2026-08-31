import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, calculator, depthContract] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/cost-of-living-calculator/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("./check-content-depth-foundation.mjs", import.meta.url), "utf8"),
]);

const start = articles.indexOf('slug: "australia-financial-hardship-bills-debt-guide"');
const end = articles.indexOf('slug: "australia-job-ending-final-pay-dismissal-guide"', start);
assert.ok(start >= 0 && end > start, "financial hardship article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "오늘 먹을 것·약·안전한 잠자리가 없으면 계산보다 지원이 먼저예요",
  "모든 빚을 같은 순서로 갚지 마세요",
  "연체 전이라도 Hardship team에 연락하세요",
  "Provider가 거절하면 Internal complaint와 AFCA를 구분하세요",
  "Debt collector 연락은 무시하지 말되 먼저 Debt를 확인하세요",
  "Court·Tribunal·Eviction·Repossession 문서는 즉시 별도 처리하세요",
  "가족·가정폭력이나 Financial abuse가 있다면 안전한 연락수단을 정하세요",
  "무료 Financial counsellor에게 보여줄 Pack",
]) {
  assert.ok(article.includes(phrase), `financial hardship guide is missing: ${phrase}`);
}

for (const question of [
  "I am experiencing financial hardship",
  "Based on my essential expenses",
  "Please confirm the full terms, fees, interest",
  "I dispute this debt or amount",
  "Please record this as a complaint",
]) {
  assert.ok(article.includes(question) && article.includes("—"), `copy-ready hardship question needs its Korean meaning: ${question}`);
}

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 18, "financial hardship guide needs the crisis-to-review workflow");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 11, "financial hardship guide needs verified official and publicly funded sources");
assert.ok(calculator.includes('href="/resources/australia-financial-hardship-bills-debt-guide"'), "cost calculator must expose the hardship guide when a budget is negative");
assert.ok(depthContract.includes("articleBlocks.length, 35"), "content-depth baseline must include the audited hardship guide after public-holiday deduplication");
assert.doesNotMatch(article, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "financial hardship content changes must remain outside payment flows");

console.log("FINANCIAL_HARDSHIP_DEPTH=PASS sections>=18 sources>=11 copy-questions=5");
