import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const articles = await readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8");
const start = articles.indexOf('slug: "australia-secondhand-marketplace-safe-buying-guide"');
const end = articles.indexOf('slug: "australia-rental-moving-out-bond-refund-guide"', start);
assert.ok(start >= 0 && end > start, "second-hand marketplace article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "배송·Courier 링크는 플랫폼 안 주문과 따로 검증하세요",
  "Business seller 중고품도 Consumer guarantee를 따로 봐야 해요",
  "Major problem과 Minor problem은 원하는 Remedy가 달라질 수 있어요",
  "Manufacturer에게만 가라는 답을 그대로 받지 마세요",
  "문제가 생기면 Seller → Complaint → 지역기관 순서로 남기세요",
]) assert.ok(article.includes(phrase), `marketplace guide is missing: ${phrase}`);

for (const question of [
  "Are you selling this item as a business or as a private individual?",
  "Please confirm the model, serial number, known faults",
  "I will only pay after inspecting and testing the item in person.",
  "The product does not match the description because",
  "Please record this as a complaint",
]) assert.ok(article.includes(question) && article.includes("—"), `marketplace question needs its Korean meaning: ${question}`);

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 13, "marketplace guide needs prevention-to-remedy depth");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 7, "marketplace guide needs verified safety and consumer remedy sources");
assert.doesNotMatch(article, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "marketplace content changes must remain outside payment flows");

console.log("MARKETPLACE_DEPTH=PASS sections>=13 sources>=7 copy-questions=5");
