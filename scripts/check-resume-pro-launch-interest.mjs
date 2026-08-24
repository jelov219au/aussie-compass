import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [link, page, performance, performancePage, privacyPage, analyticsDoc, performanceDoc, launchChecklist, productionAudit] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeProLaunchInterestLink.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProPerformance.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro-performance/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/privacy-safe-analytics.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/resume-pro-performance.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/live-payment-launch-checklist.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/production-first-sale-readiness-audit-2026-08-24.md", import.meta.url), "utf8"),
]);

assert.ok(link.startsWith('"use client";'), "launch-interest analytics must stay in a small client boundary");
assert.ok(link.includes('track("Resume Pro Launch Interest", { entry, method })'), "launch-interest action must send only its allowlisted entry and method");
assert.equal((link.match(/track\("Resume Pro Launch Interest"/g) ?? []).length, 1, "launch-interest event must have one fixed emission helper");
assert.ok(link.includes('trackLaunchInterest(entry, "mailto")'), "mail-app launch must identify the mailto method");
assert.ok(link.includes('trackLaunchInterest(entry, "copy")'), "successful request copy must identify the copy method");
assert.doesNotMatch(link, /track\([^\n]+\b(email|subject|body|href|url|job|deadline)\b/i, "analytics must not receive email or mail contents");
assert.ok(link.includes("mailto:${email}"), "launch interest must open the visitor's email app instead of submitting personal data to the site");
assert.ok(link.includes("navigator.clipboard.writeText(copyText)"), "webmail users must have a fixed request-copy fallback");
assert.ok(link.includes("받는 사람: ${email}"), "the copy fallback must include the public support address");
assert.ok(link.includes('type="button"') && link.includes('aria-live="polite"'), "copy feedback must be keyboard-safe and announced");
for (const stateText of ["요청문과 이메일 주소를 복사했어요", "자동 복사 실패", "메일 앱이 없으면 요청문 복사"]) {
  assert.ok(link.includes(stateText), `copy fallback is missing its visible state: ${stateText}`);
}
for (const manualBoundary of [
  'copyState === "failed"',
  "const manualCopyHeadingId = useId()",
  'role="status"',
  "aria-labelledby={manualCopyHeadingId}",
  "id={manualCopyHeadingId}",
  "value={copyText}",
  "readOnly",
  "onFocus={(event) => event.currentTarget.select()}",
  'aria-label="Resume Pro 판매 시작 1회 안내 요청문"',
  "Hoju Compass 서버로 전송되지 않습니다",
]) assert.ok(link.includes(manualBoundary), `manual clipboard-failure recovery is missing: ${manualBoundary}`);
assert.ok(link.includes("sm:col-span-2"), "the manual request text must remain readable across both offer-button columns");
for (const text of [
  "지원하려는 직무:",
  "지원 마감일(YYYY-MM-DD, 모르면 미정):",
  "공개 채용 공고 링크(있다면, 개인 초대·추적 링크 제외):",
  "무료 이력서 경력 초안: 있음 / 아직 없음",
  "자동 마케팅 구독 신청이 아닙니다.",
  "이력서 원문",
]) assert.ok(link.includes(text), `launch email is missing its fixed qualification/privacy text: ${text}`);
assert.doesNotMatch(link, /fetch\(|<form|localStorage|sessionStorage/, "launch interest must not create a new personal-data collection surface");

assert.ok(page.includes("getPublicSellerDetails()"), "Resume Pro must use the validated public support email");
assert.ok(page.includes("!existingBuyerIssue && !canOfferCheckout && seller.email"), "launch interest must appear only for non-buyers while checkout is closed");
assert.ok(page.includes("판매 시작 시 한 번만 답하며 자동 마케팅 구독 명단에 추가하지 않습니다"), "the product page must explain the one-time reply boundary");
assert.ok(page.includes("지원 직무, 마감일, 공개 채용 공고 링크와 무료 경력 초안 여부만 적고"), "the product page must explain the fixed first-customer fit fields");
assert.ok(page.includes("이력서 원문이나 민감정보는 보내지 마세요"), "the product page must prevent unnecessary resume or sensitive-data sharing");
assert.ok(
  page.includes("이력서·공고 원문과 표현은 넘어오지 않습니다")
    && page.includes("서버·URL·분석 이벤트·안내 요청문에는 포함되지 않습니다")
    && page.includes("경력 원문은 현재 브라우저에 남고 URL·분석 이벤트·안내 요청문에 포함되지 않습니다"),
  "high-intent continuity must state that local resume and Job Ad text is excluded from analytics and launch email drafts",
);
assert.equal((page.match(/<ResumeProLaunchInterestCopyButton/g) ?? []).length, 2, "both closed-checkout notice surfaces must offer a webmail copy fallback");
assert.equal(
  (page.match(/<ResumeProLaunchInterestCopyButton[^>]+border border-navy\/30 bg-white[^>]+text-navy/g) ?? []).length,
  2,
  "both webmail fallbacks must keep visible navy text and borders on their light backgrounds",
);
assert.doesNotMatch(
  page,
  /<ResumeProLaunchInterestCopyButton[^>]+border-white[^>]+text-white/,
  "a closed-checkout fallback must not render white text and a white border on the light product page",
);

assert.ok(performance.includes('eventName: "Resume Pro Launch Interest"'), "the operator report must query the launch-interest event");
assert.ok(performance.includes("launchInterests: aggregateMap(launchInterests)"), "launch-interest counts must remain grouped by allowlisted entry");
assert.ok(performancePage.includes("방문→메일 준비"), "the operator report must show the visit-to-email-preparation rate");
assert.ok(performancePage.includes("실제 발송 아님"), "the operator report must not treat a draft/copy action as a sent email");
assert.ok(performancePage.includes("실제 메일 수신함 요청과 대조한 뒤"), "the report must require mailbox evidence before launch outreach");

assert.ok(privacyPage.includes("Resume Pro 판매 시작 1회 안내"), "privacy page must explain the launch-interest email purpose");
assert.ok(privacyPage.includes("자동 마케팅 구독 명단에 추가하거나 반복 홍보에 사용하지 않습니다"), "privacy copy must prohibit automatic or repeated marketing");
assert.ok(analyticsDoc.includes("`Resume Pro Launch Interest` | `entry`, `method`"), "analytics documentation must pin the event to two fixed properties");
assert.ok(performanceDoc.includes("Resume Pro Launch Interest"), "operator documentation must include the launch-interest funnel step");
assert.ok(performanceDoc.includes("never sends the visitor's email address to analytics"), "performance documentation must state the email analytics boundary");
assert.ok(performanceDoc.includes("does not prove the message"), "performance documentation must distinguish preparation from sending");

for (const eventName of ["Resume Builder Started", "Resume Pro CTA Clicked", "Resume Pro Viewed", "Resume Pro Launch Interest", "Checkout Started"]) {
  assert.ok(launchChecklist.includes(`\`${eventName}\``), `live launch checklist is missing the current funnel event: ${eventName}`);
}
for (const safeInvitationRule of [
  "customer-initiated request, not a mailing",
  "target-environment strict payment audit",
  "never email a raw Stripe Checkout URL",
  "stop invitations and run the 15-minute, 24-hour and first-payout",
]) assert.ok(launchChecklist.includes(safeInvitationRule), `first-customer invitation control is missing: ${safeInvitationRule}`);

for (const namedEvidence of [
  "old_9_arg_paid_event_removed",
  "charge_aware_12_arg_paid_event_present",
  "session_7_arg_activation_present",
  "nonce_6_arg_restore_consume_present",
  "runtime_has_no_protected_table_privileges",
  "public_cannot_execute_protected_functions",
  "runtime_cannot_approve_next_sale",
  "all_privilege_checks_pass",
]) assert.ok(productionAudit.includes(`\`${namedEvidence}\` | PASS`), `production audit is missing named PASS evidence: ${namedEvidence}`);
const namedPassRows = [...productionAudit.matchAll(/^\| `([a-z][a-z0-9_]+)` \| PASS \|$/gm)].map((match) => match[1]);
assert.equal(namedPassRows.length, 54, "production audit must preserve every named Neon boolean instead of a summary count");
assert.equal(new Set(namedPassRows).size, 54, "production audit contains a duplicate named Neon result");
assert.ok(productionAudit.includes("NO-GO for the first customer payment"), "point-in-time audit must not overstate launch readiness");
assert.ok(productionAudit.includes("business-profile support email is absent"), "point-in-time audit must preserve the discovered Stripe blocker");
assert.ok(productionAudit.includes("zero Resume Pro"), "point-in-time audit must record the zero-open-Checkout evidence");

console.log("Resume Pro pre-launch interest contract passed.");
