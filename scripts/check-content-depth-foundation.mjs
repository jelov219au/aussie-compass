import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articlesSource, articlePage, minimumWage, minimumWageCalculator, casualLoading, movingChecklist, jurisdictionPicker] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/minimum-wage-guide/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/MinimumWageCalculator.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/casual-loading-guide/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/moving-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/MovingJurisdictionPicker.tsx", import.meta.url), "utf8"),
]);

const articleBlocks = articlesSource.split(/\n\s*\{\s*\n\s*slug: "/).slice(1);
assert.equal(articleBlocks.length, 32, "the resource library article count changed; audit the content-depth baseline");

let totalSections = 0;
let totalSources = 0;
for (const block of articleBlocks) {
  const slug = block.slice(0, block.indexOf('"'));
  const sectionCount = (block.match(/\{ heading:/g) ?? []).length;
  const sourceCount = (block.match(/\{ label:/g) ?? []).length;
  assert.ok(sectionCount >= 6, `${slug} needs at least six substantive sections`);
  assert.ok(sourceCount >= 3, `${slug} needs at least three official source entry points`);
  totalSections += sectionCount;
  totalSources += sourceCount;
}

assert.ok(articlePage.includes("article.sections.map"), "resource pages must render every audited section");
assert.ok(articlePage.includes("article.sources.map"), "resource pages must render every audited source");

for (const phrase of ["National Minimum Wage가 모두의 실제 시급은 아니에요", "이 계산기를 그대로 쓰지 않는 경우", "실제 급여 검산", "2026 Annual Wage Review", "Pay and Conditions Tool"]) {
  assert.ok(minimumWage.includes(phrase), `the minimum-wage guide is missing: ${phrase}`);
}
assert.ok(minimumWageCalculator.includes("PERMANENT_38_HOUR_WEEKLY_RATE = 1004.9"), "the 38-hour result must use Fair Work's official weekly rate rather than multiplying a rounded hourly rate");
assert.ok(minimumWageCalculator.includes("단순 곱셈과 소액 차이"), "the calculator must explain the official rate's rounding difference");
for (const phrase of ["계산 순서", "Loading 밖의 권리", "Employee choice pathway", "Becoming a permanent employee", "Payslip 검산"]) {
  assert.ok(casualLoading.includes(phrase), `the casual-loading guide is missing: ${phrase}`);
}
for (const phrase of ["기존 집 종료일", "Condition report 비교", "서비스 이전", "MovingJurisdictionPicker", "기관마다 바뀌는 정보와 시점"]) {
  assert.ok(movingChecklist.includes(phrase), `the moving guide is missing: ${phrase}`);
}
for (const jurisdiction of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(jurisdictionPicker.includes(`id: "${jurisdiction}"`), `the moving jurisdiction picker is missing ${jurisdiction}`);
}
assert.ok(jurisdictionPicker.includes("jurisdictions.find"), "the moving picker must show the selected jurisdiction only");
assert.doesNotMatch(jurisdictionPicker, /fetch\(|sendBeacon|XMLHttpRequest|localStorage/, "the jurisdiction picker must not transmit or persist the selection");
for (const source of [minimumWage, casualLoading, movingChecklist, jurisdictionPicker]) {
  assert.doesNotMatch(source, /checkout|stripe|paymentReadiness|createCheckout/i, "content-depth changes must remain outside checkout and payment-integration flows");
}

console.log(`CONTENT_DEPTH_FOUNDATION=PASS articles=${articleBlocks.length} sections=${totalSections} sources=${totalSources}`);
