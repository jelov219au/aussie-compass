import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getSearchSafetyState, getSiteSearchMatchRule, rankSiteSearchItems, suggestSiteSearchCorrection } from "../src/lib/siteSearch.ts";
import { parseSafeSearchUrl, setPendingSearch, takePendingSearch } from "../src/lib/searchTransfer.ts";

const [component, searchPage, homeSearch, transfer, config] = await Promise.all([
  readFile(new URL("../src/components/search/SiteSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/search/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/HomeSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/searchTransfer.ts", import.meta.url), "utf8"),
  readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
]);

const exactFields = ["query_class", "safety_state", "match_rule", "result_state", "primary_route", "route_kind", "official_status", "boundary", "next_action"];
const outcomeType = component.match(/type SearchNextActionOutcome = \{([\s\S]*?)\n\};/)?.[1] ?? "";
assert.deepEqual([...outcomeType.matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]), exactFields);

for (const query of ["불이 났어요", "집에 불났어요", "I need emergency help now"]) assert.equal(getSearchSafetyState(query), "emergency_000", query);
for (const query of ["죽고 싶어요", "I want to kill myself", "I am suicidal"]) assert.equal(getSearchSafetyState(query), "crisis_help", query);
assert.equal(getSearchSafetyState("emergncy help"), "uncertain_safety");
assert.equal(getSearchSafetyState("급여가 적게 들어왔어요"), "not_safety");
for (const value of ["tel:000", "tel:131114", "/help-directory", "검색 결과보다 지금의 안전을 먼저 확인하세요"]) assert.ok(component.includes(value));

assert.equal(suggestSiteSearchCorrection("긊여가 적게 들어왔어요"), "급여가 적게 들어왔어요");
assert.equal(suggestSiteSearchCorrection("이력써 작성"), "이력서 작성");
assert.equal(suggestSiteSearchCorrection("급여가 적게 들어왔어요"), null);

const fixtures = [
  { href: "/underpayment-guide", type: "가이드", title: "급여가 적게 들어왔다면", description: "미지급 급여 확인", keywords: ["급여", "차이", "underpayment"] },
  { href: "/pay-evidence-pro", type: "도구", title: "Pay Evidence Pro", description: "반복 기록", keywords: ["급여", "증빙"] },
  { href: "/property-inspection-checklist", type: "도구", title: "무료 집 방문 체크", description: "렌트와 보증금", keywords: ["렌트", "bond"] },
];
assert.equal(rankSiteSearchItems(fixtures, "급여 차이")[0]?.href, "/underpayment-guide");
assert.equal(getSiteSearchMatchRule(fixtures, "급여 차이"), "scenario");
assert.equal(getSiteSearchMatchRule(fixtures, "급여 증빙"), "all_terms");
assert.equal(getSiteSearchMatchRule(fixtures, "급여 렌트"), "any_term_fallback");
assert.ok(rankSiteSearchItems(fixtures, "급여 렌트").length >= 2);
assert.equal(getSiteSearchMatchRule(fixtures, "긊여가 적게 들어왔어요"), "typo_suggestion");

assert.deepEqual(parseSafeSearchUrl("https://hojucompass.com/search?q=Bond", "https://hojucompass.com"), { query: "Bond", malformed: false });
for (const [value, origin] of [
  ["https://foreign.example/search?q=Bond", "https://hojucompass.com"],
  ["javascript:alert(1)", "https://hojucompass.com"],
  ["not a url", "https://hojucompass.com"],
  ["https://hojucompass.com/search?q=one&q=two", "https://hojucompass.com"],
  ["https://hojucompass.com/search?q=Bond#private", "https://hojucompass.com"],
  [`https://hojucompass.com/search?q=${"x".repeat(121)}`, "https://hojucompass.com"],
]) assert.equal(parseSafeSearchUrl(value, origin).malformed, true, value);

setPendingSearch("  비자 신체검사  ");
assert.equal(takePendingSearch(), "비자 신체검사");
assert.equal(takePendingSearch(), "");
assert.doesNotMatch(`${transfer}\n${homeSearch}\n${component}`, /sessionStorage|localStorage|document\.cookie|indexedDB|sendBeacon|navigator\.clipboard/);
assert.doesNotMatch(component, /\btrack\(|@vercel\/analytics|fetch\(|XMLHttpRequest|mailto:/);
assert.match(homeSearch, /track\("Home Search", \{ topic, entry: "free_text" \}\)/);
assert.doesNotMatch(homeSearch, /track\([^\n]*(?:query|transferredQuery)/);
assert.match(component, /window\.history\.replaceState\(window\.history\.state, "", "\/search"\)/);
assert.match(config, /\{ key: "Referrer-Policy", value: "strict-origin" \}/);
assert.doesNotMatch(searchPage, /searchParams|initialQuery/);
for (const value of ["data-search-result-contract", "free_tool", "free_guide", "official_directory", "explicit_paid_intent", "무료로 확인하기", "모든 단어와 맞는 결과가 없어 일부 핵심 단어 결과"]) assert.ok(component.includes(value), value);
assert.ok(component.match(/min-h-11/g)?.length >= 8, "recommendation and recovery targets must be at least 44px");

console.log("Search safe-first action, privacy and recovery contract passed.");
