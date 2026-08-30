import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, articlePage, picker, arrival] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/HealthComplaintJurisdictionPicker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/arrival-checklist/page.tsx", import.meta.url), "utf8"),
]);

const start = articles.indexOf('slug: "australia-gp-hospital-pharmacy-guide"');
const end = articles.indexOf('slug: "australia-sim-esim-setup-guide"', start);
assert.ok(start >= 0 && end > start, "healthcare article block is missing");
const article = articles.slice(start, end);

for (const phrase of [
  "예약 종류와 시간을 먼저 맞추세요",
  "예약할 때 그대로 읽을 핵심 문장",
  "Referral을 받으면 실제 예약까지 이어가세요",
  "결과는 ‘연락이 없으면 정상’으로 닫지 마세요",
  "첫 청구서는 ‘진료비-혜택-남은 금액’으로 대조하세요",
  "진료 문제와 보험 문제는 민원 경로가 달라요",
  "Private Health Insurance Ombudsman",
]) {
  assert.ok(article.includes(phrase), `healthcare guide is missing: ${phrase}`);
}

assert.ok((article.match(/\{ heading:/g) ?? []).length >= 17, "healthcare guide needs the complete first-visit workflow");
assert.ok((article.match(/\{ label:/g) ?? []).length >= 13, "healthcare guide needs verified official source entry points");
assert.ok(articlePage.includes("<HealthComplaintJurisdictionPicker />"), "healthcare article must render the jurisdiction picker");

for (const jurisdiction of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(picker.includes(`id: "${jurisdiction}"`), `health complaint picker is missing ${jurisdiction}`);
}
assert.ok(picker.includes("jurisdictions.find"), "picker must show only the selected jurisdiction");
assert.doesNotMatch(picker, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/, "picker must not transmit or persist health-related selection");
assert.ok(arrival.includes('id: "health-first-claim"'), "arrival checklist must hand off to first-claim reconciliation");
assert.ok(arrival.includes("예약부터 결과·민원까지 확인하기"), "arrival page must expose the expanded healthcare path");

for (const source of [articles, articlePage, picker, arrival]) {
  assert.doesNotMatch(source, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "healthcare content must remain outside payment flows");
}

console.log("HEALTHCARE_FIRST_VISIT_DEPTH=PASS jurisdictions=8 sections>=17 sources>=13");
