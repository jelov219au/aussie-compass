import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseLocalOperatorEnvFile, upsertLocalOperatorEnvLine } from "../src/lib/localOperatorEnv.ts";
import { isVercelProjectId, vercelProjectIdMaxLength } from "../src/lib/vercelProjectId.ts";

const [contract, client, builder, checker, checkerPage, checkerVisitTracker, articleStep, homeSection, finder, proHub, offerPage, proofLink, report, reportPage, privacyDoc, performanceDoc, visitTracker, checkoutForm, activationForm, successPage, restorePage, localConnection, connectionRoute, envExample, accountingExporter, accountingAccess] = await Promise.all([
  readFile(new URL("../src/lib/resumeFunnelAnalyticsContract.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeFunnelAnalytics.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeBuilder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-job-ad-checker/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeJobAdVisitTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/resources/ArticleNextStep.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/HomePremiumToolExplorer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeProProofLink.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro-performance/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/resume-pro-performance.md", import.meta.url), "utf8"),
  readFile(new URL("../src/components/analytics/ResumeProVisitTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/restore/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/localOperatorConnection.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/resume-pro-performance/connection/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../.env.example", import.meta.url), "utf8"),
  readFile(new URL("./export-stripe-accounting.mjs", import.meta.url), "utf8"),
  readFile(new URL("./stripe-accounting-access.mjs", import.meta.url), "utf8"),
]);

for (const eventName of ["Resume Builder Started", "Resume Job Ad Viewed", "Resume Job Ad Sample Viewed", "Resume Job Ad Checked", "Resume Pro CTA Clicked"]) {
  assert.ok(contract.includes(eventName), `missing fixed funnel event: ${eventName}`);
  const reportEvent = eventName === "Resume Builder Started"
    ? "resumeFunnelEvents.builderStarted"
    : eventName === "Resume Job Ad Viewed"
      ? "resumeFunnelEvents.jobAdViewed"
    : eventName === "Resume Job Ad Sample Viewed"
      ? "resumeFunnelEvents.jobAdSampleViewed"
      : eventName === "Resume Job Ad Checked"
        ? "resumeFunnelEvents.jobAdChecked"
        : "resumeFunnelEvents.proCtaClicked";
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
  [proHub, '/resume-pro?from=pro-catalog-card'],
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

for (const source of [builder, checker, articleStep, homeSection, finder, proHub]) {
  assert.ok(source.includes("ResumeProCtaLink"), "a primary Resume Pro CTA is missing the fixed analytics link");
}

assert.ok(finder.includes('freeHref: "/resume-job-ad-checker"') && finder.includes("결제 전에 내 공고로 무료 점검하기"), "the Pro finder must offer the free proof step to job seekers");
assert.ok(finder.includes('<ResumeProProofLink entry="pro-finder"'), "the Pro finder free proof must retain its fixed acquisition entry");
assert.ok(finder.includes('href="/resume-builder"') && finder.includes("이력서 초안이 없다면 무료 Builder부터"), "the Pro finder must preserve a free start for visitors without a resume draft");
const catalogProducts = await readFile(new URL("../src/lib/proCatalogProducts.ts", import.meta.url), "utf8");
assert.ok(proHub.includes('getProCatalogProducts') && /name: "Resume Pro"[^\n]+freeHref: "\/resume-job-ad-checker"/.test(catalogProducts), "the rendered Resume Pro catalog data must link to the free proof tool");
assert.ok(proHub.includes('<ResumeProProofLink entry="pro-catalog-card"'), "the Resume Pro catalog free proof must retain its fixed acquisition entry");
assert.ok(homeSection.includes('<ResumeProProofLink entry="home-premium"'), "the home Resume Pro card must expose the free proof step with its fixed entry");
assert.ok(homeSection.includes("결제 전에 내 공고로 무료 확인") && homeSection.includes("이력서·공고 원문을 서버로 전송하지 않아요"), "the home proof step must state its free, local-only privacy boundary");
assert.ok(finder.includes("Resume Pro 가격은 A$19.90 1회 결제이며") && finder.includes("결제·이용 복구 안전 확인 중이라 판매하지 않아요"), "closed Resume Pro copy must distinguish its fixed price from its temporary sales hold");

assert.ok(reportPage.includes("report.builderStarts") && reportPage.includes("report.jobAdViews") && reportPage.includes("report.jobAdChecks") && reportPage.includes("report.proCtaClicks"), "operator report must show all anonymous pre-offer aggregate steps");
assert.ok(report.includes('web-analytics/visits/count') && report.includes("data?.visitors") && report.includes("data?.pageviews"), "operator report must query aggregate Vercel visitors and pageviews");
assert.ok(report.includes('requestPath: "/pro"') && report.includes('requestPath: "/resume-pro"'), "operator report must compare Pro catalog and Resume Pro detail reach");
assert.ok(report.includes("and environment eq 'production'"), "custom-event reporting must exclude Preview traffic");
assert.ok(report.includes('const filters = ["environment eq \'production\'"]') && report.includes('filters.join(" and ")'), "visit denominators and path reach must exclude Preview traffic too");
assert.ok(reportPage.includes('<option value="1">오늘 (UTC 기준)</option>') && reportPage.includes("표시된 UTC 날짜 범위") && reportPage.includes("report.siteVisitors") && reportPage.includes("report.sitePageviews"), "operator report must support an explicitly UTC daily traffic check");
assert.ok(report.includes("const DAY_IN_MS = 24 * 60 * 60 * 1000") && report.includes("currentSince = currentUntil - DAY_IN_MS") && report.includes("previousSince = currentSince - DAY_IN_MS"), "daily traffic comparison must use two adjacent, equal 24-hour UTC windows");
assert.ok(report.includes("days === 1 ? loadVercelTrafficComparison(untilDate)") && report.includes("fetchVercelVisits({ token, projectId, teamId, ...windows.previous"), "the daily view must load its previous aggregate window through the same Production-only visit query");
assert.ok(reportPage.includes("최근 24시간과 직전 24시간") && reportPage.includes("직전 24시간") && reportPage.includes("trafficChange(current, previous)"), "the mobile operator view must show current and previous 24-hour aggregates together");
for (const boundary of [
  "최근 구간",
  "직전 구간",
  "utcMoment(report.trafficComparison.current.since)",
  "utcMoment(report.trafficComparison.previous.until)",
  "같은 사람을 이어 붙인 여정이 아니라 같은 시간대의 경로별 익명 합계",
  "새로고침한 시각이 최근 구간의 새 UTC 종료점",
  'href="/resume-pro-performance?days=1"',
  "24시간 합계 새로고침",
  "Pro 상품 목록 도달 (/pro)",
  "Resume Pro 상세 도달 (/resume-pro)",
]) assert.ok(reportPage.includes(boundary), `the mobile 24-hour comparison is missing its UTC or denominator boundary: ${boundary}`);
assert.ok(report.includes('status: "not_configured"') && report.includes('status: "error"') && report.includes('status: "collected"'), "Vercel aggregates must distinguish collected, not-configured and error states");
for (const textState of [
  'if (status === "collected") return "수집됨"',
  'if (status === "error") return "오류"',
  'return "미수집"',
  'current === 0 ? "수집됨 · 활동 0 · "',
]) assert.ok(reportPage.includes(textState), `the comparison must expose a non-colour text state: ${textState}`);
assert.ok(reportPage.includes("<time dateTime={report.trafficComparison.current.since}") && reportPage.includes("<time dateTime={report.trafficComparison.previous.until}"), "UTC comparison bounds must use semantic time elements");
assert.ok(reportPage.includes('className="inline-flex min-h-11') && reportPage.includes("24시간 합계 새로고침"), "the mobile refresh action needs an accessible minimum target size");
assert.ok(reportPage.includes('current === 0 ? "수집됨 · 활동 0 · "') && reportPage.includes('"숫자로 판단하지 마세요"'), "the daily view must distinguish a collected zero from missing or failed collection");
for (const field of ["resumeTemplateVisitors", "resumeTemplateProViews", "resumeTemplateCheckoutStarts"]) {
  assert.ok(report.includes(`${field}: number`) && reportPage.includes(field), `the rolling resume-template funnel is missing ${field}`);
}
assert.ok(report.includes('requestPath: "/resources/australia-resume-template-submission-checklist"') && report.includes('entry: "article-resume-template"'), "the rolling source funnel must use one fixed public path and allowlisted entry");
assert.equal((report.match(/requestPath: resumeTemplateSource\.requestPath/g) ?? []).length, 2, "the resume-template visit denominator must be queried once for each adjacent 24-hour window");
assert.equal((report.match(/eventName: "Resume Pro Viewed", extraFilter: `eventData\/entry eq '\$\{resumeTemplateSource\.entry\}'`/g) ?? []).length, 2, "the existing Pro view event must be filtered to the fixed source in both windows");
assert.equal((report.match(/eventName: "Checkout Started", extraFilter: `eventData\/product eq 'resume_pro' and eventData\/entry eq '\$\{resumeTemplateSource\.entry\}'`/g) ?? []).length, 2, "the existing Checkout event must be filtered to the fixed product and source in both windows");
assert.ok(reportPage.includes("무료 이력서 양식 글 · 24시간 퍼널") && reportPage.includes("조회 → Checkout 시작"), "the operator view must name the source funnel and its conversion ratio");
assert.ok(reportPage.includes("rate(report.trafficComparison.current.resumeTemplateCheckoutStarts, report.trafficComparison.current.resumeTemplateProViews)") && reportPage.includes("rate(report.trafficComparison.previous.resumeTemplateCheckoutStarts, report.trafficComparison.previous.resumeTemplateProViews)"), "the current and previous source conversion rates must use Pro views as their denominator");
assert.ok(reportPage.includes("currentProViews < 10 || previousProViews < 10") && reportPage.includes("HOLD · 최근·직전 24시간 중 Resume Pro 조회가 10회 미만인 구간"), "source conversion comparison must stay on HOLD when either 24-hour window has fewer than ten Pro views");
assert.ok(reportPage.includes("report.trafficComparison.current.resumeTemplateProViews, report.trafficComparison.previous.resumeTemplateProViews"), "the daily source decision must evaluate both displayed 24-hour denominators");
assert.ok(reportPage.includes("이름·이력서 내용·검색어나 URL 쿼리는 사용하지 않습니다"), "the source pulse must repeat its no-PII and no-query boundary");
assert.ok(reportPage.includes("ratio(report.sitePageviews, report.siteVisitors)"), "pageviews per visitor must be a numeric ratio rather than a percentage");
assert.ok(reportPage.includes("rate(report.proCatalogVisitors, report.siteVisitors)") && reportPage.includes("rate(report.resumeProVisitors, report.siteVisitors)"), "operator report must show visitor-to-Pro reach rates");
assert.ok(performanceDoc.includes("not a person-level joined journey") && performanceDoc.includes("Do not add them together"), "operator guidance must prevent person-level or additive reach claims");
assert.ok(reportPage.includes("rate(report.jobAdSampleViews, report.jobAdViews)") && reportPage.includes("rate(report.jobAdChecks, report.jobAdViews)"), "the checker report must distinguish reach from sample and real-input activation");
assert.ok(checkerPage.includes("ResumeJobAdVisitTracker"), "the Job Ad checker page must mount its anonymous visit tracker");
assert.ok(checkerVisitTracker.includes("trackResumeJobAdViewed()") && checkerVisitTracker.includes("useEffect"), "the Job Ad checker visit must emit from a small client boundary");
assert.ok(report.includes('expand: ["data.payment_intent.latest_charge"]'), "operator report must retrieve refund evidence for paid Checkouts");
assert.ok(report.includes("classifyResumeProPerformancePayment") && reportPage.includes("totals.fullRefunds") && reportPage.includes("totals.retainedPayments") && reportPage.includes("totals.netRevenueCents"), "operator report must separate paid, fully refunded, retained-candidate and net values");
assert.ok(reportPage.includes("실제 신규 고객인지 자동 판정하지 않아요") && performanceDoc.includes("genuine customer"), "operator guidance must not treat a retained live payment as a proven customer");
assert.ok(report.includes('getLocalOperatorConnectionValue("STRIPE_PERFORMANCE_KEY")'), "the performance report must use its dedicated restricted key");
assert.ok(!report.includes('getLocalOperatorConnectionValue("STRIPE_ACCOUNTING_KEY")'), "the performance report must not reuse the Balance Transactions key");
assert.ok(localConnection.includes('"STRIPE_PERFORMANCE_KEY"') && localConnection.includes("stripePerformanceKey"), "local operator storage must support the dedicated performance key");
assert.ok(connectionRoute.includes('form.get("stripe_performance_key")') && !connectionRoute.includes('form.get("stripe_accounting_key")'), "the local connection route must save the performance key under its own role");
assert.ok(reportPage.includes('name="vercel_project_id"') && reportPage.includes('pattern="prj_[A-Za-z0-9]+"'), "the local performance form must collect the required Vercel Project ID");
assert.ok(connectionRoute.includes('form.get("vercel_project_id")') && connectionRoute.includes("invalidVercelProjectId"), "the local connection route must validate the Vercel Project ID");
assert.ok(localConnection.includes("vercelProjectId?: string") && localConnection.includes('upsertLocalOperatorEnvLine(contents, "VERCEL_PROJECT_ID", input.vercelProjectId)'), "local operator storage must persist the Vercel Project ID required by the report");
assert.equal(isVercelProjectId("prj_AbC123"), true, "a canonical Vercel Project ID must pass");
for (const invalidProjectId of [
  "aussie-compass",
  "prj_bad-value",
  "prj_valid123\n",
  `prj_${"a".repeat(vercelProjectIdMaxLength)}`,
]) assert.equal(isVercelProjectId(invalidProjectId), false, `unsafe Vercel Project ID passed: ${JSON.stringify(invalidProjectId)}`);
const projectIdEnv = upsertLocalOperatorEnvLine("VERCEL_TEAM_ID=team_fixture\n", "VERCEL_PROJECT_ID", "prj_AbC123");
assert.equal(parseLocalOperatorEnvFile(projectIdEnv).get("VERCEL_PROJECT_ID"), "prj_AbC123", "Vercel Project ID must survive the local env serialization round trip");
assert.ok(envExample.includes("STRIPE_ACCOUNTING_KEY=") && envExample.includes("STRIPE_PERFORMANCE_KEY="), "the environment example must keep accounting and performance roles separate");
assert.ok(accountingAccess.includes("STRIPE_ACCOUNTING_KEY") && !`${accountingExporter}\n${accountingAccess}`.includes("STRIPE_PERFORMANCE_KEY"), "the Balance Transaction exporter must keep its accounting-only key");
assert.ok(performanceDoc.includes("intentionally use different") && performanceDoc.includes("neither role receives the other's permissions"), "operator guidance must explain the least-privilege key boundary");
assert.ok(reportPage.indexOf("row.paidCheckouts > 0") < reportPage.indexOf("row.visits < 10"), "payment and refund evidence must outrank low-sample copy advice");
assert.ok(privacyDoc.includes("Names, STAR text, company names, search terms, full URLs and URL queries are never read or sent."), "privacy boundary must name prohibited resume and URL values");

assert.equal((contract.match(/^\s+\w+:\s+"Resume /gm) ?? []).length, 5, "the fixed resume funnel contract must keep exactly five shared event names");
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
assert.ok(performanceDoc.includes("Resume Pro Free Proof Opened") && performanceDoc.includes("Resume Pro 방문 → 무료 확인 시작"), "performance guidance is missing the free proof step");
for (const postPurchaseSource of [activationForm, successPage, restorePage]) {
  assert.doesNotMatch(postPurchaseSource, /\btrack\(|ResumeProVisitTracker/, "post-purchase issue pages must not emit a resume funnel event");
}

console.log("Privacy-safe resume funnel analytics contract passed.");
