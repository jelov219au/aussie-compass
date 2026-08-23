import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSiteSearchIntent, rankSiteSearchItems } from "../src/lib/siteSearch.ts";
import { SEARCH_TRANSFER_MAX_LENGTH, sanitizeTransferredSearch } from "../src/lib/searchTransfer.ts";

const fixtures = [
  { href: "/resume-pro", type: "도구", title: "Resume Pro — 공고별 이력서·커버레터", description: "회사별 지원 자료", keywords: ["resume", "STAR", "STAR examples", "selection criteria", "cover letter"] },
  { href: "/salary-calculator", type: "도구", title: "급여 계산기", description: "급여 계산", keywords: ["급여"] },
  { href: "/resources/english-resume-achievement-examples", type: "자료", title: "호주 이력서 성과 문장", description: "근거를 확인하는 STAR 글", keywords: ["이력서", "resume", "CV", "STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"] },
  { href: "/resources/australia-resume-template-submission-checklist", type: "자료", title: "호주 이력서 양식", description: "무료 PDF 작성과 제출 전 체크리스트", keywords: ["이력서", "이력서 양식", "resume", "resume template", "CV", "호주 취업 이력서"] },
  { href: "/resume-job-ad-checker", type: "도구", title: "이력서·Job Ad 공고 맞춤 점검기", description: "공고 표현과 실제 경력 근거를 로컬에서 비교", keywords: ["이력서", "공고 맞춤", "ATS", "ATS 이력서", "job ad", "job ad checker"] },
  { href: "/resources/australia-cover-letter-job-ad-checklist", type: "자료", title: "호주 커버레터 작성법", description: "공고별 제출 전 점검", keywords: ["커버레터", "cover letter", "호주 커버레터"] },
  { href: "/resume-builder", type: "도구", title: "무료 영문 이력서 빌더", description: "브라우저 저장과 PDF", keywords: ["이력서", "resume", "CV", "STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"] },
];

const discoveryOrder = [
  "/resume-builder",
  "/resources/australia-resume-template-submission-checklist",
  "/resume-job-ad-checker",
  "/resources/english-resume-achievement-examples",
  "/resume-pro",
];

for (const query of ["이력서", "이력서 양식", "resume", "resume template", "CV", "STAR 예시", "STAR examples", "selection criteria", "호주 취업 이력서"]) {
  assert.equal(getSiteSearchIntent(query), "resume", `${query} must use the allowlisted resume intent`);
  assert.deepEqual(rankSiteSearchItems(fixtures, query).slice(0, 5).map((item) => item.href), discoveryOrder, `${query} must lead with free Builder, template checklist, local checker, evidence article, then Pro`);
}

for (const query of ["ATS", "ATS 이력서", "공고 맞춤", "Job Ad", "Job Ad Checker"]) {
  assert.equal(getSiteSearchIntent(query), "resume", `${query} must use the allowlisted resume intent`);
  assert.deepEqual(
    rankSiteSearchItems(fixtures, query).slice(0, 5).map((item) => item.href),
    ["/resume-job-ad-checker", "/resume-builder", "/resources/australia-resume-template-submission-checklist", "/resources/english-resume-achievement-examples", "/resume-pro"],
    `${query} must lead with the local checker and keep the paid product last`,
  );
}

for (const query of ["cover letter", "커버레터"]) {
  assert.equal(getSiteSearchIntent(query), "resume", `${query} must use the allowlisted resume intent`);
  assert.deepEqual(
    rankSiteSearchItems(fixtures, query).slice(0, 4).map((item) => item.href),
    ["/resume-builder", "/resources/australia-cover-letter-job-ad-checklist", "/resume-pro", "/resources/english-resume-achievement-examples"],
    `${query} must lead from the free Builder to the official checklist before the paid product`,
  );
}

assert.equal(getSiteSearchIntent("Resume Pro"), "resume-pro-direct");
assert.equal(rankSiteSearchItems(fixtures, "Resume Pro")[0]?.href, "/resume-pro", "an explicit product-name search must lead with Resume Pro");
assert.equal(getSiteSearchIntent("급여 이력"), "default", "partial words must not enter the resume allowlist");
assert.equal(rankSiteSearchItems(fixtures, "급여 이력").length, 0, "unrelated compound searches must keep the ordinary filter behavior");

const searchComponent = readFileSync(resolve("src/components/search/SiteSearch.tsx"), "utf8");
const searchPage = readFileSync(resolve("src/app/search/page.tsx"), "utf8");
const homeSearch = readFileSync(resolve("src/components/sections/HomeSearch.tsx"), "utf8");
const searchTransfer = readFileSync(resolve("src/lib/searchTransfer.ts"), "utf8");
const jsonLd = readFileSync(resolve("src/components/seo/JsonLd.tsx"), "utf8");
const site = readFileSync(resolve("src/lib/site.ts"), "utf8");
const layout = readFileSync(resolve("src/app/layout.tsx"), "utf8");
const sitemap = readFileSync(resolve("src/app/sitemap.ts"), "utf8");
const growthRoadmap = readFileSync(resolve("docs/growth-and-revenue-roadmap.md"), "utf8");
for (const query of ["STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"]) {
  assert.ok(searchPage.includes(`"${query}"`), `the live search index is missing ${query}`);
}
assert.match(searchComponent, /rankSiteSearchItems\(items, query\)/);
assert.match(searchComponent, /이력서 준비 추천 순서/);
assert.ok(searchPage.includes('article.slug === "australia-cover-letter-job-ad-checklist"'), "the live search index must add dedicated cover-letter terms");
assert.ok(searchPage.includes('article.slug === "australia-resume-template-submission-checklist"'), "the live search index must add dedicated resume-template terms");
assert.doesNotMatch(searchComponent, /\btrack\(|analytics|sendBeacon|fetch\(|XMLHttpRequest|window\.location/, "search terms must stay inside the page and must not be sent to analytics, URLs or external requests");

assert.match(searchTransfer, /SEARCH_TRANSFER_STORAGE_KEY\s*=\s*"hojucompass:search-transfer:v1"/);
assert.match(searchTransfer, /SEARCH_TRANSFER_MAX_LENGTH\s*=\s*120/);
assert.equal(SEARCH_TRANSFER_MAX_LENGTH, 120);
assert.equal(sanitizeTransferredSearch(`  ${"x".repeat(140)}  `).length, 120, "transferred search terms must be trimmed and capped at 120 characters");
assert.match(homeSearch, /sessionStorage\.setItem\(SEARCH_TRANSFER_STORAGE_KEY, transferredQuery\)/);
assert.match(homeSearch, /router\.push\("\/search"\)/);
assert.match(homeSearch, /track\("Home Search", \{ topic, entry \}\)/, "analytics may contain only allowlisted topic and entry fields");
assert.equal(homeSearch.match(/\btrack\(/g)?.length, 1, "home search must expose only one fixed analytics call");
assert.match(homeSearch, /openSearch\(query, classifySearch\(query\), "free_text"\)/);
assert.match(homeSearch, /openSearch\(label, topic, "popular"\)/);
assert.ok(homeSearch.indexOf('router.push("/search")') > homeSearch.indexOf("sessionStorage.setItem"), "queryless navigation must still occur after the storage attempt");
assert.doesNotMatch(homeSearch, /action=["']\/search|method=["']get|name=["']q|\/search\?q=|href=\{?`?\/search\?|URLSearchParams|window\.location/, "home search must not put raw terms in a form GET, link, URL or navigation request");
assert.match(searchComponent, /sessionStorage\.getItem\(SEARCH_TRANSFER_STORAGE_KEY\)/);
assert.match(searchComponent, /sessionStorage\.removeItem\(SEARCH_TRANSFER_STORAGE_KEY\)/);
assert.ok(searchComponent.indexOf("sessionStorage.removeItem(SEARCH_TRANSFER_STORAGE_KEY)") < searchComponent.indexOf("setQuery(sanitizeTransferredSearch(transferredQuery))"), "the transferred term must be removed before it is applied to search state");
assert.doesNotMatch(searchPage, /searchParams|initialQuery/, "the search server component must not read or serialize raw query parameters");
assert.doesNotMatch(jsonLd, /search\?q=|search_term_string|SearchAction/, "structured data must not advertise a raw-query URL that the private client boundary does not support");
for (const discoverySignal of ["호주 영문 이력서·Job Ad 무료 점검", "급여·세금·Super 계산기", "한국어 정착 가이드"]) {
  assert.ok(site.includes(discoverySignal), `the shared site description is missing the first-sale discovery signal: ${discoverySignal}`);
}
assert.ok(site.includes('["호주 컴퍼스", "호주컴퍼스"]'), "the brand needs fixed Korean alternate names for search and AI disambiguation");
assert.ok(layout.includes("호주 취업·급여·정착 실용 도구 | Hoju Compass") && layout.includes("description = siteDescription"), "the homepage metadata must describe the high-intent utility and reuse the shared summary");
assert.equal((jsonLd.match(/alternateName: siteAlternateNames/g) ?? []).length, 2, "the WebSite and Organization entities must share the same Korean brand aliases");
assert.equal((jsonLd.match(/description: siteDescription/g) ?? []).length, 1, "the WebSite entity must reuse the customer-facing discovery summary");
assert.ok(sitemap.includes('"": "2026-08-24"'), "the significantly updated homepage needs an evidence-based sitemap lastmod");
for (const verificationName of ["GOOGLE_SITE_VERIFICATION", "BING_SITE_VERIFICATION", "NAVER_SITE_VERIFICATION"]) {
  assert.ok(growthRoadmap.includes(verificationName), `the current search-discovery HOLD is missing: ${verificationName}`);
}
assert.ok(growthRoadmap.includes("no Hoju Compass listing") && growthRoadmap.includes("no search-console submission was made"), "the roadmap must preserve the observed unindexed and no-mutation boundary");

console.log("High-intent resume search ranking contract passed.");
