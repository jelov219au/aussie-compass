import assert from "node:assert/strict";
import fs from "node:fs";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";

const load = localTypeScriptLoader();
const {
  articles,
  articleContentTypeLabels,
  articleRegionLabels,
  articleTopicCategories,
  getArticleContentType,
  getArticleRegion,
} = load("src/data/articles.ts");
const { getResourceRecoveryOptions, searchResources } = load("src/lib/resourceSearch.ts");

const keyOf = (result) => result.kind === "article" ? result.article.slug : result.href;
const search = (query, topic = "all", region = "all") => searchResources(articles, { topic, region, query });

const naturalLanguageCases = new Map([
  ["급여가 적게 들어왔어요", "first-payslip-checklist-australia"],
  ["보증금을 못 받았어요", "australia-rental-moving-out-bond-refund-guide"],
  ["중고차 검사 뒤 수리 약속", "used-car-inspection-report-next-steps"],
  ["비자 신체검사 예약이 늦어요", "/visa-preparation-guide"],
  ["호주 떠나기 전에 해야 할 일", "/leaving-australia-guide"],
]);

for (const [query, expected] of naturalLanguageCases) {
  const results = search(query);
  assert.ok(results.length > 0, `expected a result for ${query}`);
  assert.equal(keyOf(results[0]), expected, `unexpected first result for ${query}`);
}

const exactCases = new Map([
  ["Payslip", "first-payslip-checklist-australia"],
  ["TFN", "tfn-application-after-arrival-australia"],
  ["Bond", "australia-rental-moving-out-bond-refund-guide"],
  ["DASP", "/leaving-australia-guide"],
  ["PPSR", "used-car-ppsr-purchase-day-checklist"],
]);

for (const [query, expected] of exactCases) {
  assert.equal(keyOf(search(query)[0]), expected, `unexpected exact result for ${query}`);
}

for (const query of ["가", "호주", "정보", "해주세요"]) {
  assert.equal(search(query).length, 0, `${query} must not expose the full index`);
}

const baseArticle = {
  slug: "scope-base",
  title: "기본 제목",
  socialTitle: "Base",
  description: "기본 설명",
  category: "생활 영어",
  readingTime: "1분",
  publishedAt: "2026-09-01",
  quickSummary: ["기본 요약"],
  toolHref: "/tools",
  toolLabel: "도구",
  sections: [{ heading: "기본 소제목", paragraphs: ["기본 문단"], bullets: ["기본 항목"] }],
};
const scopeArticles = [
  { ...baseArticle, slug: "scope-title", title: "titlemarker" },
  { ...baseArticle, slug: "scope-description", description: "descriptionmarker" },
  { ...baseArticle, slug: "scope-category", category: "categorymarker" },
  { ...baseArticle, slug: "scope-summary", quickSummary: ["summarymarker"] },
  { ...baseArticle, slug: "scope-heading", sections: [{ heading: "headingmarker" }] },
  { ...baseArticle, slug: "scope-paragraph", sections: [{ heading: "기본", paragraphs: ["paragraphmarker"] }] },
  { ...baseArticle, slug: "scope-bullet", sections: [{ heading: "기본", bullets: ["bulletmarker"] }] },
];
for (const marker of ["title", "description", "category", "summary", "heading", "paragraph", "bullet"]) {
  const result = searchResources(scopeArticles, { topic: "all", region: "all", query: `${marker}marker` });
  assert.equal(keyOf(result[0]), `scope-${marker}`, `${marker} must remain searchable`);
}

assert.equal(keyOf(search("Bond", "home", "australia")[0]), "australia-rental-moving-out-bond-refund-guide");
assert.equal(search("Bond", "work", "australia").length, 0, "topic filter must stay applied");
const nswBondResults = search("Bond", "home", "nsw");
assert.ok(nswBondResults.length > 0, "expected a region-specific Bond result");
assert.ok(nswBondResults.every((result) => result.kind === "article" && getArticleRegion(result.article) === "nsw"), "region filter must stay applied");
assert.ok(!nswBondResults.some((result) => keyOf(result) === "australia-rental-moving-out-bond-refund-guide"), "national result must remain excluded by NSW filter");

const recoveryShape = (state) => JSON.stringify(getResourceRecoveryOptions(state));
assert.equal(recoveryShape({ topic: "home", region: "nsw", query: "Bond" }), JSON.stringify({ clearSearch: true, clearRegion: true, resetAll: true }));
assert.equal(recoveryShape({ topic: "all", region: "all", query: "Bond" }), JSON.stringify({ clearSearch: true, clearRegion: false, resetAll: true }));
assert.equal(recoveryShape({ topic: "all", region: "nsw", query: "" }), JSON.stringify({ clearSearch: false, clearRegion: true, resetAll: true }));

assert.equal(articles.length, 37, "unexpected article count");
assert.equal(new Set(articles.map((article) => article.slug)).size, articles.length, "article slugs must be unique");
const validCategories = new Set(Object.values(articleTopicCategories).flat());
const validRegions = new Set(Object.keys(articleRegionLabels));
const validContentTypes = new Set(Object.keys(articleContentTypeLabels));
const releaseDate = "2026-09-05";
for (const article of articles) {
  assert.ok(validCategories.has(article.category), `${article.slug} must use a known topic category`);
  assert.ok(validRegions.has(getArticleRegion(article)), `${article.slug} must use a known region`);
  assert.ok(validContentTypes.has(getArticleContentType(article)), `${article.slug} must use a known content type`);
  for (const [name, value] of [["publishedAt", article.publishedAt], ["updatedAt", article.updatedAt]]) {
    if (!value) continue;
    assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${article.slug} ${name} must be ISO date-only`);
    assert.equal(new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10), value, `${article.slug} ${name} must be valid`);
    assert.ok(value <= releaseDate, `${article.slug} ${name} must not be later than the release review date`);
  }
}

const resourcesPage = fs.readFileSync("src/app/resources/page.tsx", "utf8");
assert.match(resourcesPage, /최근 확인·수정한 자료/);
assert.match(resourcesPage, /다음 행동을 정하는 데 도움이 되는 정보/);
assert.doesNotMatch(resourcesPage, /이번 주 생활 팁|오늘 바로 써볼 수 있는 정보/);
assert.match(resourcesPage, /article\.updatedAt \? `수정 \$\{article\.updatedAt\}` : `발행 \$\{article\.publishedAt\}`/);
assert.match(resourcesPage, /const featuredArticles = sortedArticles\.slice\(0, 4\)/);

const directorySource = fs.readFileSync("src/components/resources/ResourcesDirectory.tsx", "utf8");
for (const label of ["검색만 지우기", "지역만 전체", "모든 필터 초기화", "적용 중:", "aria-live=\"polite\""]) {
  assert.ok(directorySource.includes(label), `missing resource recovery marker: ${label}`);
}
assert.match(directorySource, /hasRead \? "✓ 읽어본 글"/);

const homeArticles = fs.readFileSync("src/components/sections/ArticlesSection.tsx", "utf8");
assert.match(homeArticles, /Date\.parse\(right\.publishedAt\) - Date\.parse\(left\.publishedAt\)/);
assert.match(homeArticles, /새로 정리한 생활 정보/);

console.log("resource search and recency contract passed");
