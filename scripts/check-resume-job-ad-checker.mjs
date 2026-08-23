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

const [component, page, contract, analytics, attribution, report, toolsPage, searchPage, sitemap, journey, builder, privacyDoc, planner, performance, campaignBuilder] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/page.tsx", import.meta.url), "utf8"),
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
]);

for (const source of [page, toolsPage, searchPage, sitemap, journey, builder]) {
  assert.ok(source.includes("/resume-job-ad-checker"), "a public discovery surface is missing the checker");
}
for (const text of ["서버로 보내거나 브라우저에 저장하지 않습니다", "채용 가능성이나 ‘ATS 점수’를 만들어내지 않습니다", "빠진 표현을 그대로 추가하지 마세요"]) {
  assert.ok(`${page}\n${component}`.includes(text), `the checker is missing its safety boundary: ${text}`);
}
assert.doesNotMatch(component, /localStorage|sessionStorage|sendBeacon|XMLHttpRequest|\bfetch\(/, "resume and Job Ad text must stay in component memory");
assert.match(component, /MAX_LENGTH = 12_000/, "both local inputs need a hard size limit");
assert.match(component, /trackResumeJobAdChecked\(\)/, "a completed comparison needs a fixed aggregate event");
assert.doesNotMatch(component, /track\([^)]*(resumeText|jobAdText)|properties=.*(resumeText|jobAdText)/s, "analytics must never include pasted text");
assert.match(component, /navigator\.clipboard\.writeText\(memo\)/, "the result needs an explicit local evidence-memo copy action");
assert.match(component, /공고 원문이나 이력서 원문 없이/, "the copy result must explain that raw input was excluded");
assert.match(component, /window\.location\.origin.*\/resume-job-ad-checker/, "sharing must build a canonical query-free checker URL");
assert.match(component, /track\("Page Shared", \{ content: "resume_job_ad_checker", method \}\)/, "sharing needs a fixed privacy-safe event");
assert.match(component, /trackCheckerShare\("native"\)/, "native sharing needs the fixed privacy-safe helper");
assert.match(component, /trackCheckerShare\("clipboard"\)/, "clipboard sharing needs the fixed privacy-safe helper");
assert.match(component, /function trackCheckerShare[\s\S]*try[\s\S]*track\("Page Shared"[\s\S]*catch/, "analytics failures must not interrupt sharing");
const shareFunction = component.slice(component.indexOf("async function shareChecker"), component.indexOf("return (", component.indexOf("async function shareChecker")));
assert.doesNotMatch(shareFunction, /resumeText|jobAdText/, "sharing must never include pasted resume or Job Ad text");

for (const value of ["Resume Job Ad Checked", "resume_job_ad_checker_form", "resume_job_ad_checker_result", "resume_job_ad_checker", "/resume-pro?from=job-ad-checker"]) {
  assert.ok(contract.includes(value), `the fixed funnel contract is missing ${value}`);
}
assert.ok(analytics.includes("resumeFunnelEvents.jobAdChecked") && analytics.includes("resumeFunnelSurfaces.jobAdCheckerForm"), "the helper must emit only fixed checker values");
assert.ok(attribution.includes('"job-ad-checker"'), "checkout attribution must allow the checker entry");
assert.ok(report.includes('eventName: resumeFunnelEvents.jobAdChecked') && report.includes('"job-ad-checker"'), "the local operator report must aggregate checker use and attribution");
assert.ok(privacyDoc.includes("Resume Job Ad Checked"), "privacy documentation must disclose the aggregate event");
assert.ok(privacyDoc.includes("resume_job_ad_checker") && privacyDoc.includes("never include pasted text"), "privacy documentation must describe the fixed checker share boundary");

for (const source of [planner, performance, campaignBuilder]) {
  assert.ok(source.includes("/resume-job-ad-checker"), "a marketing workflow surface is missing the checker destination");
  assert.ok(source.includes("resume-job-ad-evidence-check"), "a marketing workflow surface is missing the fixed checker campaign");
}
assert.match(planner, /const resumeJobAdPublishingPack = \[/, "the ready-to-publish checker campaign pack is missing");
for (const channel of ["naver", "instagram", "youtube"]) assert.ok(planner.includes(`channel: "${channel}"`), `the checker campaign is missing ${channel}`);
assert.match(planner, /onClick=\{loadResumeJobAdCampaign\}/, "the checker campaign action is not connected");

console.log("Local-only resume and Job Ad evidence checker contract passed.");
