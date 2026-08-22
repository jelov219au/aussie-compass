import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSiteSearchIntent, rankSiteSearchItems } from "../src/lib/siteSearch.ts";

const fixtures = [
  { href: "/resume-pro", type: "도구", title: "Resume Pro — 공고별 이력서·커버레터", description: "회사별 지원 자료", keywords: ["resume", "STAR", "STAR examples", "selection criteria", "cover letter"] },
  { href: "/salary-calculator", type: "도구", title: "급여 계산기", description: "급여 계산", keywords: ["급여"] },
  { href: "/resources/english-resume-achievement-examples", type: "자료", title: "호주 이력서 성과 문장", description: "근거를 확인하는 STAR 글", keywords: ["이력서", "resume", "CV", "STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"] },
  { href: "/resume-builder", type: "도구", title: "무료 영문 이력서 빌더", description: "브라우저 저장과 PDF", keywords: ["이력서", "resume", "CV", "STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"] },
];

const discoveryOrder = [
  "/resume-builder",
  "/resources/english-resume-achievement-examples",
  "/resume-pro",
];

for (const query of ["이력서", "resume", "CV", "STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"]) {
  assert.equal(getSiteSearchIntent(query), "resume", `${query} must use the allowlisted resume intent`);
  assert.deepEqual(rankSiteSearchItems(fixtures, query).slice(0, 3).map((item) => item.href), discoveryOrder, `${query} must lead with free Builder, evidence article, then Pro`);
}

assert.equal(getSiteSearchIntent("Resume Pro"), "resume-pro-direct");
assert.equal(rankSiteSearchItems(fixtures, "Resume Pro")[0]?.href, "/resume-pro", "an explicit product-name search must lead with Resume Pro");
assert.equal(getSiteSearchIntent("급여 이력"), "default", "partial words must not enter the resume allowlist");
assert.equal(rankSiteSearchItems(fixtures, "급여 이력").length, 0, "unrelated compound searches must keep the ordinary filter behavior");

const searchComponent = readFileSync(resolve("src/components/search/SiteSearch.tsx"), "utf8");
const searchPage = readFileSync(resolve("src/app/search/page.tsx"), "utf8");
for (const query of ["STAR 예시", "STAR examples", "selection criteria", "cover letter", "호주 취업 이력서"]) {
  assert.ok(searchPage.includes(`"${query}"`), `the live search index is missing ${query}`);
}
assert.match(searchComponent, /rankSiteSearchItems\(items, query\)/);
assert.match(searchComponent, /이력서 준비 추천 순서/);
assert.doesNotMatch(searchComponent, /\btrack\(|analytics|sendBeacon|fetch\(|XMLHttpRequest|window\.location/, "search terms must stay inside the page and must not be sent to analytics, URLs or external requests");

console.log("High-intent resume search ranking contract passed.");
