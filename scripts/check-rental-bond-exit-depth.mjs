import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, articlePage, picker, inspectionPage, depthContract] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalBondJurisdictionPicker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("./check-content-depth-foundation.mjs", import.meta.url), "utf8"),
]);

const start = articles.indexOf('slug: "australia-rental-moving-out-bond-refund-guide"');
const end = articles.indexOf('slug: "australia-sharehouse-photo-vs-reality-checklist"', start);
assert.ok(start >= 0 && end > start, "rental bond exit article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "Fixed term 종료, Periodic 종료와 Break lease를 같은 절차로 보지 마세요",
  "Final inspection은 참석 요청과 비교자료를 함께 준비하세요",
  "열쇠 반환이 Tenancy handover를 닫는 증거가 되게 하세요",
  "퇴거·Bond 문의에 복사해 보낼 핵심 문장",
  "상대가 움직이기만 기다리지 말고 세입자 청구 가능 여부를 확인하세요",
  "공제 제안은 금액만 보지 말고 근거와 계산을 분리하세요",
  "공식 통지를 받으면 응답기한부터 달력에 넣으세요",
  "Bond 분쟁과 별도 보상 청구를 같은 것으로 가정하지 마세요",
]) {
  assert.ok(article.includes(phrase), `rental bond guide is missing: ${phrase}`);
}

for (const question of [
  "Please confirm that you received my notice to end the tenancy",
  "Could we arrange the final inspection at a time when I can attend?",
  "Please itemise each proposed bond deduction",
  "Please confirm the official bond claim reference and the deadline for my response.",
]) {
  assert.ok(article.includes(question) && article.includes("—"), `copy-ready bond question needs its Korean meaning: ${question}`);
}

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 20, "rental bond guide needs the complete notice-to-refund workflow");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 16, "rental bond guide needs verified official exit and bond sources");
assert.ok(articlePage.includes("<RentalBondJurisdictionPicker />"), "rental bond article must render the jurisdiction picker");

for (const jurisdiction of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(picker.includes(`id: "${jurisdiction}"`), `rental bond picker is missing ${jurisdiction}`);
}
assert.ok(picker.includes("jurisdictions.find"), "picker must show only the selected jurisdiction");
assert.doesNotMatch(picker, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/, "picker must not transmit or persist the rental selection");
assert.ok(inspectionPage.includes('id="rental-bond-guide"'), "inspection page must expose the moving-out handoff");
assert.ok(inspectionPage.includes('href="/resources/australia-rental-moving-out-bond-refund-guide"'), "inspection page must reach the detailed bond guide");
assert.ok(depthContract.includes("articleBlocks.length, 33"), "content-depth baseline must include the new audited guide");

const inspectionBondStart = inspectionPage.indexOf('id="rental-bond-guide"');
const inspectionBondEnd = inspectionPage.indexOf("</section>", inspectionBondStart);
const inspectionBondBlock = inspectionPage.slice(inspectionBondStart, inspectionBondEnd);
for (const source of [article, articlePage, picker, inspectionBondBlock]) {
  assert.doesNotMatch(source, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "rental bond depth changes must remain outside payment flows");
}

console.log("RENTAL_BOND_EXIT_DEPTH=PASS jurisdictions=8 sections>=20 sources>=16");
