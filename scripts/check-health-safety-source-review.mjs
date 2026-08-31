import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { collectSources } from "./audit-content-source-links.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const baseline = JSON.parse(await read("../docs/audits/content-source-links-2026-08-31.json"));
const previous = JSON.parse(await read("../docs/audits/critical-source-review-2026-08-31.json"));
const ledger = JSON.parse(await read("../docs/audits/health-safety-source-review-2026-08-31.json"));
const restricted = baseline.results.filter(({ status }) => ["restricted", "network-error"].includes(status));
const topic = /hcscc|healthcomplaints|private-health-insurance-complaints|safetyandquality|bulk-billing|enrolling-medicare|medicare-claims|triplezero|worksafe|safework|workcover|comcare|sira.nsw.gov.au/;
const expected = restricted.filter(({ url }) => topic.test(url));
assert.equal(expected.length, 22);
assert.deepEqual(new Set(ledger.reviews.map(({ url }) => url)), new Set(expected.map(({ url }) => url)));
assert.deepEqual(ledger.reviews.map(({ id }) => id), Array.from({ length: 22 }, (_, i) => i + 1));

const inventory = await collectSources();
for (const entry of ledger.reviews) {
  const original = expected.find(({ url }) => url === entry.url);
  assert.equal(entry.baseline, original.status);
  assert.deepEqual(entry.references, original.references);
  assert.ok(["retained", "replaced"].includes(entry.action));
  assert.ok(["official-web-read", "official-browser"].includes(entry.method));
  assert.equal(entry.verificationScope, "destination-and-noted-content-only");
  assert.ok(entry.title.length >= 5 && entry.note.length > 60);
  assert.ok(!previous.reviews.some(({ url }) => url === entry.url), "do not double-count previous review");
  const active = inventory.links.find(({ url }) => url === entry.destination);
  assert.ok(active, `missing current destination: ${entry.destination}`);
  for (const { file } of original.references) {
    assert.ok(active.references.some((reference) => reference.file === file), `lost source in ${file}`);
  }
  if (entry.action === "replaced") {
    assert.notEqual(entry.url, entry.destination);
    assert.ok(!inventory.links.some(({ url }) => url === entry.url), `retired URL returned: ${entry.url}`);
  } else {
    assert.equal(entry.url, entry.destination);
  }
}
for (const reason of ["confirmed-not-found", "certificate-hostname-error", "redirect-detail-recovery"]) {
  assert.equal(ledger.reviews.filter((entry) => entry.reason === reason).length, 1);
}
assert.equal(ledger.reviews.filter(({ action }) => action === "retained").length, 19);
assert.equal(ledger.counts.reviewed, ledger.reviews.length);
assert.equal(ledger.counts.retained, 19);
assert.equal(ledger.counts.replaced, 3);
assert.equal(ledger.counts.previousCriticalReviewed, previous.reviews.length);
assert.equal(ledger.counts.cumulativeReviewed, 95);
assert.equal(restricted.length - previous.reviews.length - ledger.reviews.length, 65);
assert.equal(ledger.counts.remainingBaselineRestrictedOrNetwork, 65);
for (const { url } of ledger.supportingSources.slice(0, 2)) {
  assert.ok(inventory.links.some((entry) => entry.url === url), "new claim guidance must be connected");
}

const articles = await read("../src/data/articles.ts");
const health = await read("../src/components/tools/HealthComplaintJurisdictionPicker.tsx");
const workers = await read("../src/components/tools/WorkersCompJurisdictionPicker.tsx");
const help = await read("../src/app/help-directory/page.tsx");
for (const phrase of ["진료받은 주·준주 선택", "진료를 받은 주·준주", "Australian registered insurer", "여행보험", "임상 진료의 질"]) {
  assert.ok(health.includes(phrase), `health complaint scope missing: ${phrase}`);
}
assert.ok(!health.includes("거주 주·준주"));
for (const phrase of ["진료 후 2년", "온라인 접수 제한", "모든 청구 권리가 자동 소멸", "우편·서비스센터", "Closed", "중복 청구"]) {
  assert.ok(articles.includes(phrase), `Medicare scope/fallback missing: ${phrase}`);
}
for (const phrase of ["1300 927 928", "모두 필요", "자동 시작되는 것은 아닙니다", "Self-insured employer", "Relevant conduct", "Secondary injury", "퇴사 전에", '"additionalHref" in selected']) {
  assert.ok(workers.includes(phrase), `workers compensation safeguard missing: ${phrase}`);
}
assert.ok(help.includes('href: "tel:000"'), "000 emergency action must be preserved");
assert.doesNotMatch(health + workers, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
assert.doesNotMatch(health + workers + articles + help, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/);
console.log("HEALTH_SAFETY_SOURCE_REVIEW=PASS reviewed=22 retained=19 repaired=3 cumulative=95 remaining=65 no-network=true");
