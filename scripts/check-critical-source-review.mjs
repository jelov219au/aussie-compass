import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { collectSources } from "./audit-content-source-links.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const baseline = JSON.parse(await read("../docs/audits/content-source-links-2026-08-31.json"));
const ledger = JSON.parse(await read("../docs/audits/critical-source-review-2026-08-31.json"));
const unresolved = baseline.results.filter(({ status }) => ["restricted", "network-error"].includes(status));
const criticalHosts = new Set(["immi.homeaffairs.gov.au", "www.homeaffairs.gov.au", "www.ato.gov.au", "softwaredevelopers.ato.gov.au", "www.fairwork.gov.au"]);
const expected = unresolved.filter(({ url }) => criticalHosts.has(new URL(url).hostname));
assert.equal(expected.length, 73);
assert.equal(ledger.reviews.length, expected.length);
assert.equal(new Set(ledger.reviews.map(({ url }) => url)).size, expected.length);
assert.deepEqual(ledger.reviews.map(({ id }) => id), Array.from({ length: 73 }, (_, index) => index + 1));

const inventory = await collectSources();
for (const entry of ledger.reviews) {
  const original = expected.find(({ url }) => url === entry.url);
  assert.ok(original, `review must be from the declared baseline: ${entry.url}`);
  assert.equal(entry.baseline, original.status);
  assert.ok(["retained", "replaced"].includes(entry.action));
  assert.ok(["official-web-read", "official-browser", "official-pdf-text"].includes(entry.method));
  assert.equal(entry.verificationScope, "destination-and-noted-content-only");
  assert.ok(entry.title.length > 5 && !/Internal Error|404 - Page not found/.test(entry.title));
  assert.ok(entry.note.length > 40, "keep a bounded evidence note, not a blanket pass");
  const active = inventory.links.find(({ url }) => url === entry.destination);
  assert.ok(active, `verified destination must stay connected: ${entry.destination}`);
  for (const { file } of entry.references) {
    assert.ok(active.references.some((reference) => reference.file === file), `source lost in ${file}`);
  }
  if (entry.action === "replaced") {
    assert.notEqual(entry.url, entry.destination);
    assert.ok(!inventory.links.some(({ url }) => url === entry.url), `retired source returned: ${entry.url}`);
  } else {
    assert.equal(entry.url, entry.destination);
  }
}
assert.equal(ledger.reviews.filter(({ action }) => action === "replaced").length, 5);
assert.equal(ledger.reviews.filter(({ reason }) => reason === "confirmed-not-found").length, 3);
assert.equal(ledger.reviews.filter(({ reason }) => reason === "public-guidance-upgrade").length, 2);
assert.equal(unresolved.length - ledger.reviews.length, ledger.counts.remainingBaselineRestrictedOrNetwork);
assert.equal(ledger.counts.remainingBaselineRestrictedOrNetwork, 87);

const superPage = await read("../src/app/super-guide/page.tsx");
for (const phrase of ["7영업일", "20영업일", "첫 해당 납부", "기한이 겹치는 후속 급여", "정규 급여일 밖", "전역에 적용되는 공휴일", "2026년 6월 30일까지", "송금할 것을 권장", "payment-deadlines-for-payday-super"]) {
  assert.ok(superPage.includes(phrase), `Payday timing safeguard missing: ${phrase}`);
}
assert.ok(!superPage.includes("급여일마다 Super를 계산해 납부해야"));
const taxPage = await read("../src/app/tax-return-guide/page.tsx");
assert.ok(taxPage.includes("고용주별 자료 상태가 표시되는 것은 아니므로"));
const articles = await read("../src/data/articles.ts");
for (const phrase of ["2024–25 회계연도 전체", "2025년 1–6월", "전체 국가 첫 417 승인율 99.8%", "대기 중 신청을 포함한 전체 접수 건수가 아닙니다", "표 2.14", "표 3.01", "visa-statistics/visit"]) {
  assert.ok(articles.includes(phrase), `WHM period/population safeguard missing: ${phrase}`);
}
assert.ok(!articles.includes("현재 공개된 가장 최근 상세 WHM 보고서"));
assert.doesNotMatch(superPage + taxPage, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/);

console.log("CRITICAL_SOURCE_REVIEW=PASS reviewed=73 retained=68 replaced=5 confirmed-not-found=3 remaining=87 no-network=true");
