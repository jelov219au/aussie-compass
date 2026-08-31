import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { collectSources } from "./audit-content-source-links.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const json = async (name) => JSON.parse(await read("../docs/audits/" + name));
const baseline = await json("content-source-links-2026-08-31.json");
const earlier = await Promise.all(["critical", "health-safety", "tenancy", "hardship-utility"].map((name) => json(name + "-source-review-2026-08-31.json")));
const done = new Set(earlier.flatMap(({ reviews }) => reviews.map(({ url }) => url)));
const ledger = await json("remaining-source-review-2026-08-31.json");
const restricted = baseline.results.filter(({ status }) => ["restricted", "network-error"].includes(status));
const expected = restricted.filter(({ url }) => !done.has(url));
assert.equal(done.size, 136);
assert.equal(expected.length, 24);
assert.equal(ledger.checkedAt, "2026-08-31");
assert.equal(ledger.baseSha, "081550adcb3f63548cda5f95b7623624e53e152d");
assert.deepEqual(new Set(ledger.reviews.map(({ url }) => url)), new Set(expected.map(({ url }) => url)));
assert.deepEqual(ledger.reviews.map(({ id }) => id), Array.from({ length: 24 }, (_, i) => i + 1));
const inventory = await collectSources();
for (const entry of ledger.reviews) {
  const original = expected.find(({ url }) => url === entry.url);
  assert.equal(entry.baseline, original.status);
  assert.deepEqual(entry.references, original.references);
  assert.equal(entry.verificationScope, "destination-and-noted-content-only");
  assert.ok(entry.title.length > 5 && entry.note.length > 60);
  assert.ok(!done.has(entry.url));
  const active = inventory.links.find(({ url }) => url === entry.destination);
  assert.ok(active, "missing reviewed destination: " + entry.destination);
  for (const { file } of original.references) assert.ok(active.references.some((reference) => reference.file === file), "lost source in " + file);
  if ([10, 15, 16].includes(entry.id)) {
    assert.equal(entry.action, "replaced");
    assert.equal(entry.reason, "wrong-destination-redirect");
    assert.notEqual(entry.destination, entry.url);
    assert.ok(!inventory.links.some(({ url }) => url === entry.url), "wrong-destination link returned");
  } else {
    assert.equal(entry.action, "retained");
    assert.equal(entry.destination, entry.url);
  }
  assert.equal(entry.method, [7, 14].includes(entry.id) ? "official-browser" : [6, 8].includes(entry.id) ? "marketplace-web-read" : "official-web-read");
}
assert.deepEqual(ledger.counts, { reviewed: 24, retained: 21, replaced: 3, previousReviewed: 136, cumulativeReviewed: 160, remainingBaselineRestrictedOrNetwork: 0, unresolvedDestinations: 0 });
assert.equal(new Set([...done, ...ledger.reviews.map(({ url }) => url)]).size, restricted.length);
assert.equal(ledger.supportingSources.filter(({ connected }) => connected).length, 4);
for (const { url, connected } of ledger.supportingSources) {
  if (connected) assert.ok(inventory.links.some((entry) => entry.url === url), "missing supporting source: " + url);
}

const [driver, articles, transport, vehicle, arrival, moving] = await Promise.all([
  "../src/components/tools/DriverLicenceGuide.tsx", "../src/data/articles.ts",
  "../src/app/public-transport-guide/page.tsx", "../src/app/used-car-comparison/page.tsx",
  "../src/app/arrival-checklist/page.tsx", "../src/app/moving-checklist/page.tsx",
].map(read));
for (const phrase of ["처음부터 다시 세지", "NAATI 디지털 번역", "최고 80km/h", "혈중알코올농도 0", "앞좌석", "Temporary driving permit", "Service Tasmania", "2026-08-31"]) assert.ok(driver.includes(phrase), "missing licence detail: " + phrase);
assert.ok(driver.includes('role="region"') && driver.includes('aria-live="polite"') && driver.includes('aria-controls="licence-rule-panel"'));
assert.ok(!driver.includes('role="tabpanel"'));
assert.ok(!driver.includes('"IDP 또는 공인 영문 번역", "신원·비자·SA 주소 증빙"'));
for (const phrase of ["TAS 도난 정보는 PPSR에 제공되지", "옛 인증서 사본 확인", "로고 사용도 선택 사항", "전화 도움 A$7", "Concession 대상자는 myki", "V/Line", "비접촉 결제", "Tap on/off하지"]) assert.ok(articles.includes(phrase), "missing content detail: " + phrase);
for (const phrase of ["TAS 도난 정보", "기계 상태·소유권 보증", "하루 전"]) assert.ok(vehicle.includes(phrase));
for (const phrase of ["지도 기술 문제", "성범죄 항목을 포함하지", "Concession 대상자는 myki", "Alice Springs"]) assert.ok(transport.includes(phrase));
assert.ok(arrival.includes("출국 뒤") && arrival.includes("기존 USI와 면제 여부"));
assert.ok(moving.includes("Receipt ID") && moving.includes("중복 제출하지") && moving.includes("관계 상태를 먼저"));
assert.doesNotMatch(driver, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage/);
for (const source of [driver, transport, vehicle, arrival, moving]) assert.doesNotMatch(source, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/);
console.log("REMAINING_SOURCE_REVIEW=PASS reviewed=24 retained=21 replaced=3 cumulative=160 remaining=0 no-network=true");
