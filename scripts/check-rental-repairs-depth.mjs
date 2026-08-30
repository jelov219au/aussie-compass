import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, articlePage, picker, inspectionPage, depthContract] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalRepairJurisdictionPicker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("./check-content-depth-foundation.mjs", import.meta.url), "utf8"),
]);

const start = articles.indexOf('slug: "australia-rental-repairs-maintenance-guide"');
const end = articles.indexOf('slug: "australia-rental-moving-out-bond-refund-guide"', start);
assert.ok(start >= 0 && end > start, "rental repair article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "위험한 고장은 사진보다 사람의 안전이 먼저예요",
  "수리 요청에 복사해 보낼 핵심 문장",
  "업체 방문 전에는 사람·시간·작업 범위를 확인하세요",
  "내가 직접 수리업체를 부를 수 있는 조건은 주마다 달라요",
  "수리비를 임대료에서 임의로 빼거나 임대료를 멈추지 마세요",
  "공식 Notice나 Form은 제출 방식까지 맞춰야 해요",
  "분쟁기관에는 원하는 결과와 증거 묶음을 함께 내세요",
  "수리가 끝나면 ‘업체가 왔다’가 아니라 결과를 닫으세요",
]) {
  assert.ok(article.includes(phrase), `rental repair guide is missing: ${phrase}`);
}

for (const question of [
  "I am reporting a repair needed at [room/location].",
  "Please confirm the repair reference number, who will attend and the expected time.",
  "Please give me the required notice and a reasonable time window before anyone enters",
]) {
  assert.ok(article.includes(question) && article.includes("—"), `copy-ready repair question needs its Korean meaning: ${question}`);
}

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 18, "rental repair guide needs the complete report-to-resolution workflow");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 16, "rental repair guide needs verified official rules and escalation sources");
assert.ok(articlePage.includes("<RentalRepairJurisdictionPicker />"), "rental repair article must render the jurisdiction picker");

for (const jurisdiction of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(picker.includes(`id: "${jurisdiction}"`), `rental repair picker is missing ${jurisdiction}`);
}
assert.ok(picker.includes("jurisdictions.find"), "picker must show only the selected jurisdiction");
assert.doesNotMatch(picker, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/, "picker must not transmit or persist the rental selection");
assert.ok(inspectionPage.includes('id="rental-repairs-guide"'), "inspection page must expose the repair handoff");
assert.ok(inspectionPage.includes('href="/resources/australia-rental-repairs-maintenance-guide"'), "inspection page must reach the detailed repair guide");
assert.ok(depthContract.includes("articleBlocks.length, 35"), "content-depth baseline must include the new audited guide");

const inspectionRepairStart = inspectionPage.indexOf('id="rental-repairs-guide"');
const inspectionRepairEnd = inspectionPage.indexOf("</section>", inspectionRepairStart);
const inspectionRepairBlock = inspectionPage.slice(inspectionRepairStart, inspectionRepairEnd);
for (const source of [article, articlePage, picker, inspectionRepairBlock]) {
  assert.doesNotMatch(source, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "rental repair depth changes must remain outside payment flows");
}

console.log("RENTAL_REPAIRS_DEPTH=PASS jurisdictions=8 sections>=18 sources>=16");
