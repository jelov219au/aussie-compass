import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [link, page, performance, performancePage, privacyPage, analyticsDoc, performanceDoc] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeProLaunchInterestLink.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro-performance/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/resume-pro-performance.md", import.meta.url), "utf8"),
]);

assert.ok(link.startsWith('"use client";'), "launch-interest analytics must stay in a small client boundary");
assert.ok(link.includes('track("Resume Pro Launch Interest", { entry })'), "launch-interest click must send only its allowlisted entry");
assert.equal((link.match(/track\("Resume Pro Launch Interest"/g) ?? []).length, 1, "launch-interest event must have one fixed emission point");
assert.doesNotMatch(link, /track\([^\n]+\b(email|subject|body|href|url|job|deadline)\b/i, "analytics must not receive email or mail contents");
assert.ok(link.includes("mailto:${email}"), "launch interest must open the visitor's email app instead of submitting personal data to the site");
for (const text of [
  "지원하려는 직무:",
  "지원 마감일(알고 있다면):",
  "무료 이력서 경력 초안: 있음 / 아직 없음",
  "자동 마케팅 구독 신청이 아닙니다.",
  "이력서 원문",
]) assert.ok(link.includes(text), `launch email is missing its fixed qualification/privacy text: ${text}`);
assert.doesNotMatch(link, /fetch\(|<form|localStorage|sessionStorage/, "launch interest must not create a new personal-data collection surface");

assert.ok(page.includes("getPublicSellerDetails()"), "Resume Pro must use the validated public support email");
assert.ok(page.includes("!existingBuyerIssue && !canOfferCheckout && seller.email"), "launch interest must appear only for non-buyers while checkout is closed");
assert.ok(page.includes("판매 시작 시 한 번만 답하며 자동 마케팅 구독 명단에 추가하지 않습니다"), "the product page must explain the one-time reply boundary");
assert.ok(page.includes("이력서 원문이나 민감정보는 보내지 마세요"), "the product page must prevent unnecessary resume or sensitive-data sharing");

assert.ok(performance.includes('eventName: "Resume Pro Launch Interest"'), "the operator report must query the launch-interest event");
assert.ok(performance.includes("launchInterests: aggregateMap(launchInterests)"), "launch-interest counts must remain grouped by allowlisted entry");
assert.ok(performancePage.includes("방문→안내"), "the operator report must show the visit-to-interest rate");
assert.ok(performancePage.includes("준비 게이트가 끝나면 이 경로부터 제한적으로 알리세요"), "the report must turn qualified interest into a safe launch action");

assert.ok(privacyPage.includes("Resume Pro 판매 시작 1회 안내"), "privacy page must explain the launch-interest email purpose");
assert.ok(privacyPage.includes("자동 마케팅 구독 명단에 추가하거나 반복 홍보에 사용하지 않습니다"), "privacy copy must prohibit automatic or repeated marketing");
assert.ok(analyticsDoc.includes("`Resume Pro Launch Interest` | `entry`"), "analytics documentation must pin the event to one fixed property");
assert.ok(performanceDoc.includes("Resume Pro Launch Interest"), "operator documentation must include the launch-interest funnel step");
assert.ok(performanceDoc.includes("never sends the visitor's email address to analytics"), "performance documentation must state the email analytics boundary");

console.log("Resume Pro pre-launch interest contract passed.");
