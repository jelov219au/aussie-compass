import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [homeSearch, siteSearch, planner, performance, campaignBuilder, articleStep, attribution, report] = await Promise.all([
  readFile(new URL("../src/components/sections/HomeSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/search/SiteSearch.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ContentPublishingPlanner.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ContentPerformanceTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/CampaignLinkBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/resources/ArticleNextStep.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProAttribution.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
]);

const path = "/resources/australia-cover-letter-job-ad-checklist";
const campaign = "cover-letter-job-ad-checklist";

assert.ok(homeSearch.includes('{ label: "커버레터", topic: "jobs" }'), "home discovery must expose the cover-letter topic");
for (const term of ["커버레터", "cover letter", "selection criteria"]) {
  assert.ok(homeSearch.includes(`"${term}"`), `home topic classification is missing ${term}`);
}
assert.ok(siteSearch.includes('"영문 이력서", "커버레터"'), "site-search suggestions must expose cover-letter discovery");

for (const source of [planner, performance, campaignBuilder]) {
  assert.ok(source.includes(path), "a marketing workflow surface is missing the cover-letter destination");
  assert.ok(source.includes(campaign), "a marketing workflow surface is missing the fixed cover-letter campaign");
}

assert.match(planner, /const coverLetterPublishingPack = \[/, "the ready-to-publish campaign pack is missing");
for (const channel of ["instagram", "naver", "youtube"]) {
  assert.ok(planner.includes(`channel: "${channel}"`), `the cover-letter pack is missing ${channel}`);
}
assert.match(planner, /onClick=\{loadCoverLetterCampaign\}/, "the publishing-pack action is not connected");
assert.ok(planner.includes("커버레터 3일 발행팩을 추가했습니다"), "the operator needs a clear campaign-load confirmation");

assert.ok(articleStep.includes("/resume-pro?from=article-cover-letter-checklist"), "the article must preserve its fixed Pro next step");
assert.ok(attribution.includes("article-cover-letter-checklist"), "the checkout attribution allowlist is missing the article source");
assert.ok(report.includes("커버레터 제출 점검 글"), "the operator report must split cover-letter conversions");

console.log("Cover-letter discovery, publishing, measurement, and conversion loop passed.");
