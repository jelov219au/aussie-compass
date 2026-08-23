import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [contract, client, builder, checker, articleStep, homeSection, finder, offerPage, proofLink, report, reportPage, privacyDoc, visitTracker, checkoutForm, activationForm, successPage, restorePage] = await Promise.all([
  readFile(new URL("../src/lib/resumeFunnelAnalyticsContract.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeFunnelAnalytics.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/resources/ArticleNextStep.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/PremiumToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeProProofLink.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro-performance/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeProVisitTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/restore/page.tsx", import.meta.url), "utf8"),
]);

for (const eventName of ["Resume Builder Started", "Resume Job Ad Checked", "Resume Pro CTA Clicked"]) {
  assert.ok(contract.includes(eventName), `missing fixed funnel event: ${eventName}`);
  const reportEvent = eventName === "Resume Builder Started" ? "resumeFunnelEvents.builderStarted" : eventName === "Resume Job Ad Checked" ? "resumeFunnelEvents.jobAdChecked" : "resumeFunnelEvents.proCtaClicked";
  assert.ok(report.includes(reportEvent), `report does not aggregate ${eventName}`);
  assert.ok(privacyDoc.includes(eventName), `privacy documentation is missing ${eventName}`);
}

for (const value of [
  "resume_builder_form",
  "resume_builder_completion",
  "resume_job_ad_checker_form",
  "resume_job_ad_checker_result",
  "article_next_step",
  "home_resume_pro",
  "pro_finder",
  "resume_builder",
  "resume_job_ad_checker",
  "resume_template_guide",
  "resume_achievement_guide",
  "job_search_guide",
  "cover_letter_guide",
]) assert.ok(contract.includes(value), `missing fixed analytics value: ${value}`);

assert.ok(articleStep.includes('/resume-pro?from=article-cover-letter-checklist'), "cover-letter guidance is missing its fixed acquisition entry");
assert.ok(contract.includes('/resume-pro?from=article-cover-letter-checklist'), "CTA href contract is missing the cover-letter acquisition entry");
assert.ok(articleStep.includes('/resume-pro?from=article-resume-template'), "resume-template guidance is missing its fixed acquisition entry");
assert.ok(contract.includes('/resume-pro?from=article-resume-template'), "CTA href contract is missing the resume-template acquisition entry");
assert.ok(checker.includes('/resume-pro?from=job-ad-checker'), "job-ad checker is missing its fixed acquisition entry");
assert.ok(contract.includes('/resume-pro?from=job-ad-checker'), "CTA href contract is missing the job-ad-checker acquisition entry");

for (const [source, href] of [
  [homeSection, '/resume-pro?from=home-premium'],
  [finder, '/resume-pro?from=pro-finder'],
]) {
  assert.ok(source.includes(`href="${href}"`), `major Resume Pro CTA is missing its fixed acquisition entry: ${href}`);
  assert.ok(contract.includes(href), `CTA href contract is missing its fixed acquisition entry: ${href}`);
}

assert.match(client, /new Set<string>\(\)/, "funnel events need an in-session duplicate guard");
assert.match(client, /if \(emittedEvents\.has\(eventKey\)\) return/, "duplicate events must return before tracking");
assert.match(client, /try\s*\{[\s\S]*track\(eventName, \{ surface, context \}\);[\s\S]*\}\s*catch/, "analytics failures must not interrupt product actions");
assert.doesNotMatch(client, /window\.location|URLSearchParams|searchParams|localStorage|sessionStorage/, "funnel analytics must not read URLs, queries or local input stores");
assert.doesNotMatch(client, /\b(name|company|query|search|star|url)\s*:/i, "funnel event payloads may not expose user input or URL fields");

assert.ok(builder.includes("onClickCapture={trackBuilderInteraction}") && builder.includes("onInputCapture={trackBuilderInteraction}"), "Builder start must be tied to a real interaction");
assert.ok(builder.includes('closest("input, textarea, select, button")'), "Builder start must ignore passive page views and links");
assert.ok(builder.includes("trackResumeBuilderStarted()"), "Builder start helper is not connected");

for (const source of [builder, checker, articleStep, homeSection, finder]) {
  assert.ok(source.includes("ResumeProCtaLink"), "a primary Resume Pro CTA is missing the fixed analytics link");
}

assert.ok(reportPage.includes("report.builderStarts") && reportPage.includes("report.jobAdChecks") && reportPage.includes("report.proCtaClicks"), "operator report must show all anonymous pre-offer aggregate steps");
assert.ok(privacyDoc.includes("Names, STAR text, company names, search terms, full URLs and URL queries are never read or sent."), "privacy boundary must name prohibited resume and URL values");

assert.equal((contract.match(/^\s+\w+:\s+"Resume /gm) ?? []).length, 3, "the fixed resume funnel contract must keep exactly three shared event names");
for (const [source, eventNames] of [
  [builder, ["Resume Builder Completed", "Resume Export Started"]],
  [visitTracker, ["Resume Pro Viewed"]],
  [checkoutForm, ["Checkout Started"]],
]) {
  const literalEvents = [...source.matchAll(/track\("([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(literalEvents, eventNames, "the existing six-event resume boundary changed unexpectedly");
}

assert.ok(offerPage.includes("ResumeProProofLink") && offerPage.includes("내 공고로 무료 점검하기"), "the offer sample must lead to the free proof step");
assert.ok(proofLink.includes('href="/resume-job-ad-checker"'), "the free proof link must use the local-only Job Ad checker");
assert.ok(proofLink.includes('track("Resume Pro Free Proof Opened", { entry })'), "the free proof step needs a fixed acquisition event");
assert.ok(proofLink.includes("new Set<ResumeProEntry>()"), "the free proof event needs an in-session duplicate guard");
assert.doesNotMatch(proofLink, /window\.location|URLSearchParams|searchParams|localStorage|sessionStorage/, "the free proof event must not read URLs, queries or local input stores");
assert.ok(report.includes('eventName: "Resume Pro Free Proof Opened"') && report.includes("proofStarts: aggregateMap(proofStarts)"), "the operator report must aggregate free proof starts by fixed entry");
assert.ok(reportPage.includes("totals.proofStarts") && reportPage.includes("row.proofStarts"), "the operator report must show free proof totals and source rows");
assert.ok(privacyDoc.includes("Resume Pro Free Proof Opened"), "privacy documentation is missing the free proof event");
for (const postPurchaseSource of [activationForm, successPage, restorePage]) {
  assert.doesNotMatch(postPurchaseSource, /\btrack\(|ResumeProVisitTracker/, "post-purchase issue pages must not emit a resume funnel event");
}

console.log("Privacy-safe resume funnel analytics contract passed.");
