import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyseResumeJobAd } from "../src/lib/resumeJobAdMatch.ts";

const resume = "Provided customer service in a busy retail store. Processed point of sale payments and cash handling. Used Microsoft Excel for weekly stock records.";
const jobAd = "Customer service and communication skills are required. Duties include customer service, point of sale transactions, cash handling, inventory management, weekly reporting and Microsoft Excel. Attention to detail and teamwork are essential.";
const result = analyseResumeJobAd(resume, jobAd);
const byTerm = new Map(result.terms.map((item) => [item.term, item]));

for (const term of ["customer service", "point of sale", "cash handling", "microsoft excel"]) {
  assert.equal(byTerm.get(term)?.matched, true, `${term} should be found in the resume`);
}
for (const term of ["communication skills", "inventory management", "attention to detail", "teamwork", "reporting"]) {
  assert.equal(byTerm.get(term)?.matched, false, `${term} should remain an evidence question rather than an invented match`);
}
assert.equal(result.matchedCount + result.missingCount, result.terms.length);
assert.ok(result.terms.length <= 12, "the result must stay scannable");

const [component, page, visitTracker, jsonLd, contract, analytics, attribution, report, toolsPage, searchPage, sitemap, journey, builder, privacyDoc, planner, performance, campaignBuilder, homeTools, openGraphImage, twitterImage, socialImage] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeJobAdVisitTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/seo/JsonLd.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeFunnelAnalyticsContract.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeFunnelAnalytics.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProAttribution.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/tools/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/search/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/JourneySection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-builder/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ContentPublishingPlanner.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ContentPerformanceTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/CampaignLinkBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/opengraph-image.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/twitter-image.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeJobAdCheckerSocialImage.tsx", import.meta.url), "utf8"),
]);

for (const source of [page, toolsPage, searchPage, sitemap, journey, builder, homeTools]) {
  assert.ok(source.includes("/resume-job-ad-checker"), "a public discovery surface is missing the checker");
}
for (const route of ["/resume-builder", "/resume-job-ad-checker", "/resume-pro"]) {
  assert.ok(sitemap.includes(`\"${route}\": \"2026-08-24\"`), `${route} must publish its verified significant-update date`);
}
assert.ok(sitemap.includes("lastModified: acquisitionRouteUpdates[route]"), "the verified acquisition dates must be emitted as sitemap lastmod values");
assert.ok(homeTools.includes('section: "resume_job_ad_evidence"') && homeTools.includes('destination: "resume-job-ad-checker"'), "the home entry needs fixed privacy-safe navigation attribution");
assert.ok(page.includes("ResumeJobAdVisitTracker") && visitTracker.includes("trackResumeJobAdViewed()"), "the checker needs an anonymous reach event before activation events");
for (const value of ["지원할 Job Ad가 있다면", "입력 원문 서버 전송 없음", "실제 경험 근거부터 확인", "최대 3개", "무료 공고 맞춤 점검"]) {
  assert.ok(homeTools.includes(value), `the high-intent home entry is missing: ${value}`);
}
for (const text of ["서버로 보내거나 브라우저에 저장하지 않습니다", "채용 가능성이나 ‘ATS 점수’를 만들어내지 않습니다", "빠진 표현을 그대로 추가하지 마세요"]) {
  assert.ok(`${page}\n${component}`.includes(text), `the checker is missing its safety boundary: ${text}`);
}
assert.ok(page.includes("<WebApplicationJsonLd") && page.includes('path="/resume-job-ad-checker"'), "the checker must describe its main page purpose as a WebApplication");
for (const visibleFact of [
  'applicationCategory="BusinessApplication"',
  "이력서와 Job Ad 텍스트를 현재 브라우저에서만 비교",
  "문구 일치와 실제 경력 근거 질문을 구분",
  "가상 예시와 원문 없는 근거 메모 제공",
]) assert.ok(page.includes(visibleFact), `the checker WebApplication markup is missing its visible fact: ${visibleFact}`);
for (const schemaFact of ['"@type": "WebApplication"', 'price: 0', 'isAccessibleForFree: true', 'operatingSystem: "Any modern web browser"', 'browserRequirements: "Requires JavaScript"']) {
  assert.ok(jsonLd.includes(schemaFact), `the shared WebApplication schema is missing ${schemaFact}`);
}
assert.doesNotMatch(`${page}\n${jsonLd}`, /aggregateRating|ratingValue|review:/, "the checker must not invent reviews or ratings for structured data eligibility");
assert.doesNotMatch(component, /localStorage|sessionStorage|sendBeacon|XMLHttpRequest|\bfetch\(/, "resume and Job Ad text must stay in component memory");
assert.match(component, /MAX_LENGTH = 12_000/, "both local inputs need a hard size limit");
assert.match(component, /trackResumeJobAdChecked\(\)/, "a completed comparison needs a fixed aggregate event");
assert.match(component, /const next = analyseResumeJobAd\(sampleResume, sampleJobAd\)/, "the fictional sample must open a result in one action");
assert.match(component, /trackResumeJobAdSampleViewed\(\)/, "the fictional sample needs a separate fixed aggregate event");
assert.match(component, /가상 예시 결과 바로 보기/, "the sample action must promise the immediate result it provides");
assert.doesNotMatch(component.slice(component.indexOf("function loadSample"), component.indexOf("function clear")), /trackResumeJobAdChecked\(\)/, "fictional sample use must not inflate real local comparison completions");
assert.match(component, /job-ad-result-heading" tabIndex=\{-1\}/, "the revealed result heading must accept programmatic focus");
assert.match(component, /prefers-reduced-motion: reduce/, "result reveal must respect reduced-motion preferences");
assert.doesNotMatch(component, /track\([^)]*(resumeText|jobAdText)|properties=.*(resumeText|jobAdText)/s, "analytics must never include pasted text");
assert.match(component, /navigator\.clipboard\.writeText\(memo\)/, "the result needs an explicit local evidence-memo copy action");
assert.match(component, /공고 원문이나 이력서 원문 없이/, "the copy result must explain that raw input was excluded");
assert.match(component, /aria-labelledby="evidence-priority-heading"/, "the personalised next-step plan needs an accessible section name");
assert.match(component, /priorityTerms[\s\S]*\.slice\(0, 3\)/, "the next-step plan must stay focused on at most three terms");
for (const prompt of ["언제·어디서 한 일인가", "내가 직접 한 행동은 무엇인가", "숫자·변화·피드백으로 확인할 결과가 있는가"]) {
  assert.ok(component.includes(prompt), `the evidence plan is missing its factual prompt: ${prompt}`);
}
assert.ok(component.includes("Resume Pro가 줄이는 반복") && component.includes("공고별 이력서·커버레터·면접 메모"), "the result must explain the paid reuse value without promising an outcome");
assert.match(component, /이 근거를 공고별 지원서에 연결하기/, "the checker CTA needs to describe the next paid job clearly");
assert.match(component, /window\.location\.origin.*\/resume-job-ad-checker/, "sharing must build a canonical query-free checker URL");
assert.match(component, /track\("Page Shared", \{ content: "resume_job_ad_checker", method \}\)/, "sharing needs a fixed privacy-safe event");
assert.match(component, /trackCheckerShare\("native"\)/, "native sharing needs the fixed privacy-safe helper");
assert.match(component, /trackCheckerShare\("clipboard"\)/, "clipboard sharing needs the fixed privacy-safe helper");
assert.match(component, /function trackCheckerShare[\s\S]*try[\s\S]*track\("Page Shared"[\s\S]*catch/, "analytics failures must not interrupt sharing");
const shareFunction = component.slice(component.indexOf("async function shareChecker"), component.indexOf("return (", component.indexOf("async function shareChecker")));
assert.doesNotMatch(shareFunction, /resumeText|jobAdText/, "sharing must never include pasted resume or Job Ad text");

for (const value of ["Resume Job Ad Viewed", "Resume Job Ad Sample Viewed", "Resume Job Ad Checked", "resume_job_ad_checker_form", "resume_job_ad_checker_result", "resume_job_ad_checker", "/resume-pro?from=job-ad-checker"]) {
  assert.ok(contract.includes(value), `the fixed funnel contract is missing ${value}`);
}
assert.ok(analytics.includes("resumeFunnelEvents.jobAdSampleViewed") && analytics.includes("resumeFunnelEvents.jobAdChecked") && analytics.includes("resumeFunnelSurfaces.jobAdCheckerForm"), "the helpers must emit only fixed checker values");
assert.ok(attribution.includes('"job-ad-checker"'), "checkout attribution must allow the checker entry");
assert.ok(report.includes('eventName: resumeFunnelEvents.jobAdSampleViewed') && report.includes('eventName: resumeFunnelEvents.jobAdChecked') && report.includes('"job-ad-checker"'), "the local operator report must aggregate sample use, checker use and attribution");
assert.ok(privacyDoc.includes("Resume Job Ad Sample Viewed") && privacyDoc.includes("Resume Job Ad Checked"), "privacy documentation must disclose both aggregate events");
assert.ok(privacyDoc.includes("resume_job_ad_checker") && privacyDoc.includes("never include pasted text"), "privacy documentation must describe the fixed checker share boundary");

for (const imageRoute of [openGraphImage, twitterImage]) {
  assert.ok(imageRoute.includes("createResumeJobAdCheckerSocialImage"), "the checker needs a route-specific social image on both metadata surfaces");
  assert.ok(imageRoute.includes('contentType = "image/png"'), "the checker social image needs an explicit PNG type");
  assert.ok(imageRoute.includes("무료 이력서·Job Ad 공고 맞춤 근거 점검기"), "the checker social image needs descriptive Korean alt text");
}
assert.ok(socialImage.includes("new ImageResponse") && socialImage.includes("width: 1200, height: 630"), "the checker social image must render at the standard large-card size");
for (const boundary of ["LOCAL ONLY", "NO ATS SCORE", "FREE CHECK", "No login · No upload · No invented experience"]) {
  assert.ok(socialImage.includes(boundary), `the checker social image is missing its trust boundary: ${boundary}`);
}
assert.ok(socialImage.includes("MATCH THE WORDS.") && socialImage.includes("VERIFY THE FACTS."), "the checker social image must communicate the concrete job to be done");
assert.doesNotMatch(socialImage, /resumeText|jobAdText|searchParams|URLSearchParams|\bfetch\(/, "the static social image must never read visitor inputs, queries or external data");

for (const source of [planner, performance, campaignBuilder]) {
  assert.ok(source.includes("/resume-job-ad-checker"), "a marketing workflow surface is missing the checker destination");
  assert.ok(source.includes("resume-job-ad-evidence-check"), "a marketing workflow surface is missing the fixed checker campaign");
}
assert.match(planner, /const resumeJobAdPublishingPack = \[/, "the ready-to-publish checker campaign pack is missing");
for (const channel of ["naver", "instagram", "youtube"]) assert.ok(planner.includes(`channel: "${channel}"`), `the checker campaign is missing ${channel}`);
assert.match(planner, /onClick=\{loadResumeJobAdCampaign\}/, "the checker campaign action is not connected");

console.log("Local-only resume and Job Ad evidence checker contract passed.");
