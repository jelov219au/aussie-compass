import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articles, homeSearch, siteSearch, searchPage, planner, performance, campaignBuilder, articleStep, attribution, contract, report] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/HomeSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/search/SiteSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/search/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ContentPublishingPlanner.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ContentPerformanceTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/CampaignLinkBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/resources/ArticleNextStep.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProAttribution.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeFunnelAnalyticsContract.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
]);

const slug = "australia-resume-template-submission-checklist";
const path = `/resources/${slug}`;
const campaign = "resume-template-free-pdf";

for (const source of [articles, searchPage, planner, performance, campaignBuilder, articleStep]) {
  assert.ok(source.includes(slug), "a public or operating surface is missing the resume-template destination");
}
for (const source of [planner, performance, campaignBuilder]) {
  assert.ok(source.includes(campaign), "a marketing workflow surface is missing the fixed resume-template campaign");
}

assert.ok(homeSearch.includes('{ label: "이력서 양식", topic: "jobs" }'), "home discovery must expose the resume-template query");
assert.ok(siteSearch.includes('"이력서 양식"'), "site-search suggestions must expose the resume-template query");
for (const term of ["이력서 양식", "호주 이력서 양식", "영문 이력서 양식", "resume template", "무료 이력서", "PDF 이력서"]) {
  assert.ok(searchPage.includes(`"${term}"`), `the live search index is missing ${term}`);
}

assert.match(planner, /const resumeTemplatePublishingPack = \[/, "the ready-to-publish resume-template campaign pack is missing");
for (const channel of ["naver", "instagram", "youtube"]) {
  assert.ok(planner.includes(`channel: "${channel}"`), `the resume-template pack is missing ${channel}`);
}
assert.match(planner, /onClick=\{loadResumeTemplateCampaign\}/, "the publishing-pack action is not connected");

for (const officialSource of [
  "https://www.workforceaustralia.gov.au/individuals/coaching/job-applications/resumes",
  "resume%20quality%20checklist.pdf",
  "resume%20tailoring%20checklist.pdf",
]) assert.ok(articles.includes(officialSource), `the article is missing official support: ${officialSource}`);
for (const principle of ["현재 브라우저에 저장", "PDF로 내보내", "실제로 가진", "면접 또는 취업 결과를 보장하지 않아요"]) {
  assert.ok(articles.includes(principle), `the free-first article is missing: ${principle}`);
}

assert.ok(articleStep.includes('/resume-pro?from=article-resume-template'), "the article CTA is missing its fixed acquisition entry");
assert.ok(articleStep.includes('proofEntry: "article-resume-template"'), "the saved resume must keep its allowlisted source into the free comparison step");
assert.ok(attribution.includes('"article-resume-template"'), "checkout attribution must allow the resume-template entry");
assert.ok(contract.includes('resume_template_guide') && contract.includes('/resume-pro?from=article-resume-template'), "analytics must use fixed resume-template values");
assert.ok(report.includes('"article-resume-template"'), "the operator report must label the resume-template entry");
for (const value of ["01 · 저장", "02 · 비교", "03 · 재사용", "저장한 이력서와 공고 무료 비교하기", "검증한 근거를 지원서 묶음으로 재사용하기"]) {
  assert.ok(articleStep.includes(value), `the resume-template next step is missing: ${value}`);
}
const freeBuilder = articleStep.indexOf("무료 이력서 작성·PDF 저장하기");
const freeProof = articleStep.indexOf("저장한 이력서와 공고 무료 비교하기");
const proReuse = articleStep.indexOf("검증한 근거를 지원서 묶음으로 재사용하기");
assert.ok(freeBuilder >= 0 && freeBuilder < freeProof && freeProof < proReuse, "the article must keep save, free comparison, and Pro reuse in that order");
assert.ok(articleStep.includes("<ResumeProProofLink entry={nextStep.proofEntry}"), "the comparison must use the existing privacy-safe proof link");
assert.ok(articleStep.includes('aria-label="저장·비교·재사용 다음 단계"'), "the three-step path needs an accurate accessible name");
assert.match(articleStep, /<ol className="mt-6 grid gap-3 lg:grid-cols-3"/, "the three steps must stay stacked at 390px and move to columns only on large screens");
assert.match(articleStep, /TrackedLink[\s\S]*min-h-32[\s\S]*ResumeProProofLink[\s\S]*min-h-32[\s\S]*ResumeProCtaLink[\s\S]*min-h-32/, "all three mobile actions need large touch targets");

assert.ok(planner.includes(path) && campaignBuilder.includes(path) && performance.includes(path));
console.log("Resume-template acquisition loop contract passed.");
