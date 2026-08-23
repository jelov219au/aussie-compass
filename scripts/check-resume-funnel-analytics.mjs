import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [contract, client, builder, articleStep, homeSection, finder, report, reportPage, privacyDoc, visitTracker, checkoutForm, activationForm, successPage, restorePage] = await Promise.all([
  readFile(new URL("../src/lib/resumeFunnelAnalyticsContract.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeFunnelAnalytics.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/resources/ArticleNextStep.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/PremiumToolsSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro-performance/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeProVisitTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/restore/page.tsx", import.meta.url), "utf8"),
]);

for (const eventName of ["Resume Builder Started", "Resume Pro CTA Clicked"]) {
  assert.ok(contract.includes(eventName), `missing fixed funnel event: ${eventName}`);
  assert.ok(report.includes(eventName === "Resume Builder Started" ? "resumeFunnelEvents.builderStarted" : "resumeFunnelEvents.proCtaClicked"), `report does not aggregate ${eventName}`);
  assert.ok(privacyDoc.includes(eventName), `privacy documentation is missing ${eventName}`);
}

for (const value of [
  "resume_builder_form",
  "resume_builder_completion",
  "article_next_step",
  "home_resume_pro",
  "pro_finder",
  "resume_builder",
  "resume_achievement_guide",
  "job_search_guide",
]) assert.ok(contract.includes(value), `missing fixed analytics value: ${value}`);

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

for (const source of [builder, articleStep, homeSection, finder]) {
  assert.ok(source.includes("ResumeProCtaLink"), "a primary Resume Pro CTA is missing the fixed analytics link");
}

assert.ok(reportPage.includes("report.builderStarts") && reportPage.includes("report.proCtaClicks"), "operator report must show both new aggregate steps");
assert.ok(privacyDoc.includes("Names, STAR text, company names, search terms, full URLs and URL queries are never read or sent."), "privacy boundary must name prohibited resume and URL values");

assert.equal((contract.match(/^\s+\w+:\s+"Resume /gm) ?? []).length, 2, "the fixed resume funnel contract must keep exactly two shared event names");
for (const [source, eventNames] of [
  [builder, ["Resume Builder Completed", "Resume Export Started"]],
  [visitTracker, ["Resume Pro Viewed"]],
  [checkoutForm, ["Checkout Started"]],
]) {
  const literalEvents = [...source.matchAll(/track\("([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(literalEvents, eventNames, "the existing six-event resume boundary changed unexpectedly");
}
for (const postPurchaseSource of [activationForm, successPage, restorePage]) {
  assert.doesNotMatch(postPurchaseSource, /\btrack\(|ResumeProVisitTracker/, "post-purchase issue pages must not emit a resume funnel event");
}

console.log("Privacy-safe resume funnel analytics contract passed.");
