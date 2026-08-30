import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/data/articles.ts", import.meta.url), "utf8");

function articleBlock(slug) {
  const start = source.indexOf(`slug: "${slug}"`);
  assert.ok(start >= 0, `missing article: ${slug}`);
  const next = source.indexOf("\n  {\n    slug:", start + 1);
  return source.slice(start, next < 0 ? source.length : next);
}

const privacy = articleBlock("rental-application-privacy-australia");
const scam = articleBlock("australia-rental-scam-red-flags");
const firstWeek = articleBlock("rental-condition-report-bond-first-week-australia");
const nsw = articleBlock("australia-sharehouse-photo-vs-reality-checklist");
const victoria = articleBlock("melbourne-home-transport-first-check-guide");
const queensland = articleBlock("brisbane-home-transport-flood-first-check-guide");

for (const [region, block] of [["NSW", nsw], ["Victoria", victoria], ["Queensland", queensland]]) {
  assert.match(block, /updatedAt: "2026-08-30"/, `${region} article must carry the verified update date`);
  assert.doesNotMatch(block, /checkout|stripe|payment|결제하기|구매하기/i, `${region} article must remain an editorial decision aid`);
}

for (const term of ["Co-tenant", "Sub-tenant", "Additional occupant", "서면 동의", "Principal tenant", "Rental Bonds Online"]) {
  assert.ok(nsw.includes(term), `NSW article is missing ${term}`);
}
for (const question of [
  "Will I be named as a co-tenant on the residential tenancy agreement?",
  "Has the landlord given written consent for this subletting arrangement?",
  "Who will lodge my bond, and how will I receive the official record?",
]) {
  assert.ok(nsw.includes(question) && nsw.includes("—"), `NSW copy-ready question is missing: ${question}`);
}
assert.match(nsw, /https:\/\/www\.nsw\.gov\.au\/housing-and-construction\/rules\/sharing-a-residential-rental-property/);
assert.match(nsw, /https:\/\/www\.nsw\.gov\.au\/housing-and-construction\/renting-a-place-to-live\/residential-rental-bonds\/rental-bonds-online-for-tenants/);

for (const term of ["Share house", "Rooming house", "Operator licence", "Local council", "Exclusive room right", "Shared room right", "Rooming house residents guide"]) {
  assert.ok(victoria.includes(term), `Victoria article is missing ${term}`);
}
assert.match(victoria, /Operator가 검색된다[\s\S]*이 주소가 등록됐다/, "Victoria article must keep operator and premises checks separate");
assert.match(victoria, /https:\/\/www\.consumer\.vic\.gov\.au\/housing\/renting\/starting-and-changing-rental-agreements\/different-rental-agreements\/rooming-house-agreements/);
assert.match(victoria, /https:\/\/www\.consumer\.vic\.gov\.au\/licensing-and-registration\/rooming-house-operators\/public-register/);

for (const term of ["Co-tenant", "Sub-tenant", "Rooming resident", "Form R18", "House rules", "10일", "Form R1", "서명일"]) {
  assert.ok(queensland.includes(term), `Queensland article is missing ${term}`);
}
assert.match(queensland, /2026년 9월 1일 전후로 적용 기준이 바뀌는 안내/, "Queensland article must disclose the near-term house-rules boundary");
assert.match(queensland, /https:\/\/www\.rta\.qld\.gov\.au\/rooming-accommodation/);
assert.match(queensland, /https:\/\/www\.rta\.qld\.gov\.au\/before-renting\/types-of-tenancy-agreements\/share-homes-and-co-tenancies/);
assert.match(queensland, /https:\/\/www\.rta\.qld\.gov\.au\/forms-resources\/factsheets\/house-rules-in-rooming-accommodation-fact-sheet/);

assert.match(privacy, /relatedSlugs: \["australia-rental-scam-red-flags", "australia-sharehouse-photo-vs-reality-checklist"\]/);
assert.match(scam, /relatedSlugs: \["australia-sharehouse-photo-vs-reality-checklist", "rental-condition-report-bond-first-week-australia"\]/);
assert.match(firstWeek, /relatedSlugs: \["australia-sharehouse-photo-vs-reality-checklist", "rental-application-privacy-australia"\]/);
assert.match(nsw, /relatedSlugs: \["australia-rental-scam-red-flags", "rental-condition-report-bond-first-week-australia"\]/);
assert.match(victoria, /relatedSlugs: \["australia-sharehouse-photo-vs-reality-checklist", "rental-condition-report-bond-first-week-australia"\]/);
assert.match(queensland, /relatedSlugs: \["australia-sharehouse-photo-vs-reality-checklist", "rental-condition-report-bond-first-week-australia"\]/);

console.log("Share-house contract and rights content cluster passed.");
