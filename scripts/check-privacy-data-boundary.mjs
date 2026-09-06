import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { sanitizeAnalyticsEvent } from "../src/lib/privacyAnalytics.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [page, card, analytics, surveyForm, surveyRoute, surveyEmail, paymentAlerts] = await Promise.all([
  read("src/app/privacy/page.tsx"),
  read("src/components/privacy/PrivacyDataBoundaryCard.tsx"),
  read("src/components/analytics/PrivacyFriendlyAnalytics.tsx"),
  read("src/components/tools/JobMoveSurveyForm.tsx"),
  read("src/app/api/job-move-survey/route.ts"),
  read("src/lib/researchSurveyEmail.ts"),
  read("src/lib/paymentAlerts.ts"),
]);

const expectedFields = [
  "selected_activity",
  "data_location",
  "data_categories",
  "not_collected_boundary",
  "retention_delete_route",
  "third_party_route",
  "decision",
  "next_action",
];
const outcomeType = card.match(/type PrivacyBoundaryOutcome = \{([\s\S]*?)\};/)?.[1] ?? "";
const actualFields = [...outcomeType.matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]);
assert.deepEqual(actualFields, expectedFields, "the boundary result must expose exactly the eight approved top-level fields");

for (const activity of [
  "browse",
  "use_local_tool",
  "export_import_file",
  "submit_survey",
  "send_email",
  "start_checkout",
  "use_paid_access",
  "open_external_service",
]) assert.ok(card.includes(`| "${activity}"`) || card.includes(`${activity}: {`), `missing activity: ${activity}`);

for (const decision of ["continue", "limit", "delete", "contact"]) {
  assert.ok(card.includes(`id: "${decision}"`), `missing explicit decision: ${decision}`);
}
assert.ok(card.includes('useState<PrivacyActivity | "">("")'));
assert.ok(card.includes("useState<PrivacyDecision | null>(null)"));
assert.ok(card.includes("if (!activity || !decision) return null"));
assert.match(card, /아래 선택은 이 화면 메모리에만 있고 URL·브라우저 저장소·파일·메일·분석으로 보내지 않습니다/);
assert.doesNotMatch(card, /\btrack\s*\(|\bfetch\s*\(|(?:localStorage|sessionStorage)\.|document\.cookie/);

const headingIndex = page.indexOf("<h1");
const cardIndex = page.indexOf("<PrivacyDataBoundaryCard", headingIndex);
const detailsIndex = page.indexOf('id="privacy-details"');
assert.ok(headingIndex >= 0 && cardIndex > headingIndex && cardIndex < detailsIndex, "the memory-only card must immediately lead the detailed privacy policy");
for (const policyMarker of ["privacy-v2026-09-07", "시행", "최근 검토", "2026년 9월 7일"]) assert.ok(page.includes(policyMarker));

for (const surveyFact of ["{answers, website, startedAt}", "4초 이상 24시간 이하", "빈 honeypot", "무작위 응답 ID", "서버 수신 시각", "12개월 안에 삭제"]) {
  assert.ok(page.includes(surveyFact), `survey disclosure is missing: ${surveyFact}`);
}
assert.ok(surveyForm.includes("선택 답변과 설문을 연 시각(startedAt)"));
assert.ok(surveyRoute.includes("startedAt") && surveyRoute.includes("website"));
assert.ok(surveyEmail.includes("randomUUID") && !surveyEmail.includes("startedAt"));

for (const alertFact of ["제품, 금액, 상태 또는 실패 사유", "마지막 8자만", "Zoho Mail", "12개월 안에 삭제", "5년 이상"]) {
  assert.ok(page.includes(alertFact), `payment-alert disclosure is missing: ${alertFact}`);
}
assert.ok(paymentAlerts.includes("smtppro.zoho.com.au"));

for (const analyticsFact of ["event timestamp", "URL", "referrer", "대략적 위치", "운영체제·브라우저·기기 종류", "집계 대시보드", "24시간 뒤", "검색어 원문", "결제 금액", "선택한 활동과 결정도 추적하지 않습니다"]) {
  assert.ok(page.includes(analyticsFact), `analytics disclosure is missing: ${analyticsFact}`);
}
assert.ok(analytics.includes("sanitizeAnalyticsEvent(event, window.location.origin)"));

const valid = sanitizeAnalyticsEvent({ url: "https://hojucompass.com/privacy?email=secret@example.com#private", type: "pageview" }, "https://hojucompass.com");
assert.deepEqual(valid, { url: "https://hojucompass.com/privacy", type: "pageview" });
assert.deepEqual(sanitizeAnalyticsEvent({ url: "/tools?search=passport#result", type: "pageview" }, "https://hojucompass.com"), { url: "https://hojucompass.com/tools", type: "pageview" });
for (const [event, origin] of [
  [{ url: "http://[invalid", type: "pageview" }, "https://hojucompass.com"],
  [{ url: "https://example.com/?secret=1", type: "pageview" }, "https://hojucompass.com"],
  [{ url: "javascript:alert(1)", type: "pageview" }, "https://hojucompass.com"],
  [{ url: `/${"a".repeat(2_049)}`, type: "pageview" }, "https://hojucompass.com"],
  [{ url: "/privacy", type: "pageview" }, "not a valid origin"],
]) assert.equal(sanitizeAnalyticsEvent(event, origin), null, `unsafe analytics URL must fail closed: ${event.url}`);

const throwingEvent = Object.defineProperty({}, "url", { get() { throw new Error("no url access"); } });
assert.equal(sanitizeAnalyticsEvent(throwingEvent, "https://hojucompass.com"), null);
assert.ok(!JSON.stringify(valid).includes("secret@example.com"));

for (const providerRoute of ["vercel.com/docs/analytics/privacy-policy", "vercel.com/legal/dpa", "zoho.com/mail/gdpr", "stripe.com/au/privacy", "stripe.com/au/legal/dta", "policies.google.com/privacy", "oaic.gov.au/privacy/privacy-complaints"]) {
  assert.ok(page.includes(providerRoute), `missing official provider or complaint route: ${providerRoute}`);
}
assert.ok(page.includes("getPublicSellerDetails()") && page.includes("privacyEmailHref(seller.email)"));
assert.ok(!page.includes("support@hojucompass.com") && !card.includes("support@hojucompass.com"));

console.log("Privacy data boundary, disclosures, and fail-closed analytics checks passed.");
