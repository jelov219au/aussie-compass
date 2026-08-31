import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { collectSources } from "./audit-content-source-links.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const json = async (name) => JSON.parse(await read("../docs/audits/" + name));
const baseline = await json("content-source-links-2026-08-31.json");
const previous = await json("critical-source-review-2026-08-31.json");
const health = await json("health-safety-source-review-2026-08-31.json");
const ledger = await json("tenancy-source-review-2026-08-31.json");
const done = new Set([...previous.reviews, ...health.reviews].map(({ url }) => url));
const restricted = baseline.results.filter(({ status }) => ["restricted", "network-error"].includes(status));
const expected = restricted.filter(({ url }) => !done.has(url) && /rental|tenan|bond|renting|repair|sacat/.test(url));
assert.equal(expected.length, 15);
assert.equal(ledger.checkedAt, "2026-08-31");
assert.deepEqual(new Set(ledger.reviews.map(({ url }) => url)), new Set(expected.map(({ url }) => url)));
assert.deepEqual(ledger.reviews.map(({ id }) => id), Array.from({ length: 15 }, (_, i) => i + 1));
const inventory = await collectSources();
for (const entry of ledger.reviews) {
  const original = expected.find(({ url }) => url === entry.url);
  assert.equal(entry.baseline, original.status);
  assert.deepEqual(entry.references, original.references);
  assert.equal(entry.action, "retained", "do not relabel bot restrictions as broken links");
  assert.equal(entry.destination, entry.url);
  assert.equal(entry.method, "official-web-read");
  assert.equal(entry.verificationScope, "destination-and-noted-content-only");
  assert.ok(entry.title.length >= 5 && entry.note.length > 60);
  assert.ok(!done.has(entry.url), "do not double-count previous reviews");
  const active = inventory.links.find(({ url }) => url === entry.destination);
  assert.ok(active, "missing retained destination: " + entry.destination);
  for (const { file } of original.references) {
    assert.ok(active.references.some((reference) => reference.file === file), "lost source in " + file);
  }
}
assert.deepEqual(ledger.counts, {
  reviewed: 15, retained: 15, replaced: 0,
  previousCriticalReviewed: previous.reviews.length,
  previousHealthSafetyReviewed: health.reviews.length,
  cumulativeReviewed: 110, remainingBaselineRestrictedOrNetwork: 50,
});
assert.equal(done.size + ledger.reviews.length, 110);
assert.equal(restricted.length - done.size - ledger.reviews.length, 50);
assert.equal(ledger.supportingSources.filter(({ connected }) => connected).length, 4);
for (const { url, connected } of ledger.supportingSources) {
  if (connected) assert.ok(inventory.links.some((entry) => entry.url === url), "supporting guide must be connected: " + url);
}

const articles = await read("../src/data/articles.ts");
const repairs = await read("../src/components/tools/RentalRepairJurisdictionPicker.tsx");
const bonds = await read("../src/components/tools/RentalBondJurisdictionPicker.tsx");
for (const phrase of ["보고서를 받은 뒤부터", "TAS의 24시간", "기한 만료 전 신청도 가능", "RT04a/RT04b", "청구를 접수한 날부터 10일", "분쟁 통지를 받은 뒤 10 working days", "세입자의 NTCAT 신청기한이 아닙니다"]) {
  assert.ok(articles.includes(phrase), "missing article safeguard: " + phrase);
}
for (const phrase of ["기한 만료 전에도 신청", "위험한 상태로", "RT04a/RT04b", "보내는 사람·받는 사람", "인쇄용 PDF"]) {
  assert.ok(repairs.includes(phrase), "missing repair safeguard: " + phrase);
}
assert.ok(!repairs.includes("정해진 시간이 지난 뒤"), "do not reinstate unconditional waiting");
for (const phrase of ["청구를 접수한 날부터 10일", "분쟁 통지를 받은 뒤 10 working days", "Managing party 14일", "세입자의 NTCAT 신청기한", "Statutory declaration"]) {
  assert.ok(bonds.includes(phrase), "missing bond deadline/role: " + phrase);
}
for (const picker of [repairs, bonds]) {
  assert.ok(picker.includes("selected.checkpoints.map"));
  assert.ok(picker.includes('"additionalHref" in selected'));
  assert.ok(picker.includes('aria-live="polite"') && picker.includes("<label"));
  assert.ok(picker.includes("2026-08-31"));
  assert.doesNotMatch(picker, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
  assert.doesNotMatch(picker, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/);
}
console.log("TENANCY_SOURCE_REVIEW=PASS reviewed=15 retained=15 cumulative=110 remaining=50 no-network=true");
