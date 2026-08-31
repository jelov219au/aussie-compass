import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { collectSources } from "./audit-content-source-links.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const json = async (name) => JSON.parse(await read("../docs/audits/" + name));
const baseline = await json("content-source-links-2026-08-31.json");
const earlier = await Promise.all(["critical", "health-safety", "tenancy"].map((name) => json(name + "-source-review-2026-08-31.json")));
const done = new Set(earlier.flatMap(({ reviews }) => reviews.map(({ url }) => url)));
const ledger = await json("hardship-utility-source-review-2026-08-31.json");
const restricted = baseline.results.filter(({ status }) => ["restricted", "network-error"].includes(status));
const expected = restricted.filter(({ url }) => !done.has(url) && /acma.gov|aer.gov|afca.org|austrac.gov|dewr.gov|dss.gov|energy.gov|energy.vic|ombudsman.nt|ombudsman.tas|powerwater|crisis-payment|employment-separation/.test(url));
assert.equal(expected.length, 26);
assert.equal(ledger.checkedAt, "2026-08-31");
assert.deepEqual(new Set(ledger.reviews.map(({ url }) => url)), new Set(expected.map(({ url }) => url)));
assert.deepEqual(ledger.reviews.map(({ id }) => id), Array.from({ length: 26 }, (_, i) => i + 1));
const inventory = await collectSources();
for (const entry of ledger.reviews) {
  const original = expected.find(({ url }) => url === entry.url);
  assert.equal(entry.baseline, original.status);
  assert.deepEqual(entry.references, original.references);
  assert.equal(entry.action, "retained");
  assert.equal(entry.destination, entry.url);
  assert.equal(entry.method, entry.url.includes("afca.org.au") ? "official-browser" : "official-web-read");
  assert.equal(entry.verificationScope, "destination-and-noted-content-only");
  assert.ok(entry.title.length > 5 && entry.note.length > 60);
  assert.ok(!done.has(entry.url));
  const active = inventory.links.find(({ url }) => url === entry.url);
  assert.ok(active, "missing retained source: " + entry.url);
  for (const { file } of original.references) assert.ok(active.references.some((reference) => reference.file === file), "lost source in " + file);
}
assert.deepEqual(ledger.counts, { reviewed: 26, retained: 26, replaced: 0, previousReviewed: 110, cumulativeReviewed: 136, remainingBaselineRestrictedOrNetwork: 24 });
assert.equal(done.size + ledger.reviews.length, 136);
assert.equal(restricted.length - done.size - ledger.reviews.length, 24);
assert.equal(ledger.supportingSources.filter(({ connected }) => connected).length, 4);
for (const { url, connected } of ledger.supportingSources) {
  if (connected) assert.ok(inventory.links.some((entry) => entry.url === url), "missing supporting source: " + url);
}
const articles = await read("../src/data/articles.ts");
const picker = await read("../src/components/tools/EnergySupportJurisdictionPicker.tsx");
const routes = await read("../src/components/resources/FinancialHardshipRoutes.tsx");
const page = await read("../src/app/resources/[slug]/page.tsx");
for (const phrase of ["시민권·거주자 요건이 없어요", "다른 Crisis Payment 유형에 같은 시작일", "7일 이내 연락", "14일 이내 Claim", "5 Business days", "2 Business days", "서면 거절서를 받을 때까지", "더 늦은 날부터 12개월", "미납 Superannuation을 보장하지", "기존 고객도 지속적인 신원 확인"]) {
  assert.ok(articles.includes(phrase), "missing safety detail: " + phrase);
}
for (const phrase of ["ACT·NSW·QLD·SA·TAS", "지원 신청 아님", "Power and Water·Jacana Energy", "2년 이내", "12개월 이내", "2026-08-31"]) assert.ok(picker.includes(phrase));
assert.ok(picker.includes('aria-live="polite"') && picker.includes("<label"));
assert.ok(routes.includes("sm:grid-cols-2") && routes.includes("aria-labelledby"));
assert.ok(routes.includes('actionClass("primary")') && routes.includes("인터넷 연결이 필요"));
assert.ok(page.includes("<FinancialHardshipRoutes />") && page.includes("<EnergySupportJurisdictionPicker />"));
assert.ok(page.includes('id="energy-help"') && routes.includes("australia-energy-plan-moving-home-guide#energy-help"));
for (const source of [picker, routes]) {
  assert.doesNotMatch(source, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
  assert.doesNotMatch(source, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/);
}
assert.ok(!routes.includes('"use client"'), "static navigation needs no client state");
console.log("HARDSHIP_UTILITY_SOURCE_REVIEW=PASS reviewed=26 retained=26 cumulative=136 remaining=24 no-network=true");
