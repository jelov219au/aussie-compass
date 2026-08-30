import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8");

const slugs = [
  "rental-application-privacy-australia",
  "australia-rental-scam-red-flags",
  "rental-condition-report-bond-first-week-australia",
];

for (const slug of slugs) {
  assert.ok(source.includes(`slug: "${slug}"`), `missing rental resource: ${slug}`);
}

for (const phrase of [
  "누가, 왜, 어디에",
  "합리적으로 필요한 개인정보",
  "TFN 전체 번호",
  "Who will receive or access my information?",
  "Scamwatch — Buying and selling scams",
  "신분증 제출과 돈 송금은 같은 검증을 두 번",
  "첫 24시간에는 안전·작동·증거를 따로",
  "호주 전체에 하나의 제출 기한이 있는 것은 아니에요",
  "주·준주 선택기는 8개 지역의 공식 출발점",
]) {
  assert.ok(source.includes(phrase), `rental resource cluster is missing: ${phrase}`);
}

for (const url of [
  "https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/tenancy",
  "https://www.scamwatch.gov.au/types-of-scams/buying-and-selling-scams",
  "https://www.nsw.gov.au/housing-and-construction/rules/rental-property-condition-reports",
  "https://www.rta.qld.gov.au/starting-a-tenancy/entry-condition-report",
]) {
  assert.ok(source.includes(url), `missing official source: ${url}`);
}

assert.ok(source.includes("relatedSlugs?: string[]"), "articles must support deliberate resource sequencing");
assert.ok(source.includes("explicitRelated"), "related article rendering must respect the deliberate sequence");
assert.doesNotMatch(source, /rental-application-privacy-australia[\s\S]{0,9000}(checkout|stripe)/i, "privacy guidance must not send users into a payment flow");

console.log("RENTAL_RESOURCE_CLUSTER=PASS resources=3 official_sources=4");
