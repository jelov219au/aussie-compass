import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const search = read("src/components/sections/HomeSearch.tsx");
const routeFinder = read("src/components/sections/PersonalRouteFinder.tsx");
const trust = read("src/components/sections/HomeTrustBar.tsx");
const footer = read("src/components/layout/Footer.tsx");

const situations = [
  ["일자리 종료", "/resources/australia-job-ending-final-pay-dismissal-guide", "src/app/resources/[slug]/page.tsx"],
  ["세금", "/tax-return-guide", "src/app/tax-return-guide/page.tsx"],
  ["렌트", "/property-inspection-checklist", "src/app/property-inspection-checklist/page.tsx"],
  ["급여", "/underpayment-guide", "src/app/underpayment-guide/page.tsx"],
  ["중고차", "/used-car-comparison", "src/app/used-car-comparison/page.tsx"],
  ["출국", "/leaving-australia-guide", "src/app/leaving-australia-guide/page.tsx"],
];

for (const [label, href, page] of situations) {
  assert(search.includes(`label: "${label}"`), `missing situation label: ${label}`);
  assert(search.includes(`href: "${href}"`), `missing direct route: ${href}`);
  assert(existsSync(new URL(`../${page}`, import.meta.url)), `route source is missing: ${page}`);
}
assert.equal(search.match(/situation: "/g)?.length, 6, "Hero must expose exactly six fixed situations");
assert(read("src/data/articles.ts").includes('slug: "australia-job-ending-final-pay-dismissal-guide"'), "job-ending resource slug must exist");
assert(search.includes("먼저 무료 안내와 도구로 공식 기준·내 기록을 확인하세요. 여러 건을 반복 정리하고 저장·전달해야 할 때만 Pro를 비교하세요."));
assert(search.includes('router.push("/search")'), "free text search must remain available");
assert(search.includes('surface: "hero_situation"'), "situation analytics must use a fixed surface");
for (const removed of ["워홀 준비", "집 구하기", "이력서 양식", "커버레터"]) assert(!search.includes(`label: "${removed}"`));

assert.match(routeFinder, /onClick=\{shareRecommendations\} className="inline-flex min-h-11[^>]*>추천 경로 공유/);
assert.match(trust, /destination: item\.href\.slice\(1\)[\s\S]{0,180}min-h-11/);
assert.equal(footer.match(/inline-flex min-h-11 items-center rounded-sm text-sm font-medium/g)?.length, 2, "both Footer link templates need 44px targets");

for (const [label, href] of [
  ["Instagram", "https://www.instagram.com/hojucompass/"],
  ["YouTube", "https://www.youtube.com/channel/UChn-PJcHHVz2XPVhHUkbFkQ"],
]) {
  assert(footer.includes(`label: "${label}", href: "${href}"`), `Footer is missing ${label}`);
}
assert(footer.includes('aria-label="공식 소셜 채널"'));
assert(footer.includes('target="_blank" rel="noopener noreferrer"'));
assert(footer.includes("focus-visible:ring-2"));

console.log("HOME_SIX_SITUATION_FIRST_CLICK=PASS routes=6 boundary=1 hit_targets=44px footer_social=2");
