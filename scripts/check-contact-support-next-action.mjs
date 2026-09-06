import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [page, component, privacy, paymentSupport, seller] = await Promise.all([
  read("src/app/contact/page.tsx"),
  read("src/components/contact/ContactSupportNextAction.tsx"),
  read("src/app/privacy/page.tsx"),
  read("src/components/tools/PaymentSupportHelper.tsx"),
  read("src/lib/publicSeller.ts"),
]);

const expectedFields = [
  "issue_category",
  "self_help_route",
  "minimal_evidence_categories",
  "do_not_send",
  "channel",
  "response_expectation",
  "escalation_or_follow_up",
  "next_action",
];
const outcomeType = component.match(/type ContactSupportOutcome = \{([\s\S]*?)\};/)?.[1] ?? "";
const actualFields = [...outcomeType.matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]);
assert.deepEqual(actualFields, expectedFields, "contact outcome must expose exactly the eight approved top-level fields");

for (const issueCategory of [
  "general",
  "payment_access",
  "refund",
  "technical_error",
  "content_correction",
  "privacy_deletion",
  "partnership_feedback",
  "urgent_or_deadline",
]) assert.ok(component.includes(`${issueCategory}: {`), `missing issue category: ${issueCategory}`);

for (const enumValue of ["self_help", "hoju_email", "documented_transaction_support", "issuer_or_bank", "official_service"]) assert.ok(component.includes(`"${enumValue}"`), `missing channel enum: ${enumValue}`);
for (const enumValue of ["not_sent", "unknown", "access_target_4_business_hours", "proposed_initial_2_business_days", "proposed_privacy_30_calendar_days", "no_wait_use_official_service"]) assert.ok(component.includes(`"${enumValue}"`), `missing response enum: ${enumValue}`);
for (const enumValue of ["use_self_help", "prepare_email", "verify_sent", "wait", "follow_up_same_thread", "use_official_service_now"]) assert.ok(component.includes(`"${enumValue}"`), `missing next-action enum: ${enumValue}`);

assert.ok(component.includes('useState<IssueCategory | "">("")'));
assert.ok(component.includes("if (!issueCategory) return null"));
assert.match(component, /선택은 이 화면 메모리에만 있고 URL·저장소·쿠키·clipboard·파일·메일·분석으로 자동 전송되지 않습니다/);
assert.doesNotMatch(component, /\btrack\s*\(|\bfetch\s*\(|(?:localStorage|sessionStorage)\.|document\.cookie|<form|\/api\//);

const headingIndex = page.indexOf("<h1");
const cardIndex = page.indexOf("<ContactSupportNextAction", headingIndex);
const detailsIndex = page.indexOf('aria-labelledby="contact-type-heading"');
assert.ok(headingIndex >= 0 && cardIndex > headingIndex && cardIndex < detailsIndex, "the decision card must immediately lead the detailed contact templates");
assert.ok(page.includes("getPublicSellerDetails()") && page.includes("supportEmail={seller.email}"));
assert.ok(seller.includes("NEXT_PUBLIC_SUPPORT_EMAIL"));

for (const boundary of [
  "보낸 편지함 또는 보낼 편지함",
  "반송되면 주소를 추측하지 말고",
  "offline queue나 자동 제출이 없습니다",
  "일반 SLA는 UNKNOWN",
  "환불·분쟁 SLA는 UNKNOWN",
  "개인정보 요청 SLA는 UNKNOWN",
  "제휴·피드백 SLA는 UNKNOWN",
  "4영업시간 이내 확인 결과 또는 다음 조치 안내를 목표",
  "같은 thread로 한 번만 재문의",
]) assert.ok(component.includes(boundary), `support lifecycle boundary is missing: ${boundary}`);
assert.ok(paymentSupport.includes("4영업시간 이내 확인 결과 또는 다음 조치를 안내하는 것을 목표"));
assert.match(component, /접근 문제만 4영업시간/);

const redaction = "스크린샷을 첨부한다면 이름, 주소, 이메일, 전체 결제 참조와 문서 내용을 가린 뒤 보냅니다. 원본 파일은 필요하지 않습니다.";
assert.ok(component.includes(redaction));
assert.ok(page.includes(redaction));
assert.ok(privacy.includes(redaction));
for (const forbidden of ["카드번호·CVC", "TFN", "신분증/비자 원문", "복구 코드", "영수증 전체", "이력서 원문"]) {
  assert.ok(component.includes(forbidden), `denylist is missing: ${forbidden}`);
}

assert.ok(component.includes("mailto:${email}"));
assert.ok(component.includes('href="tel:000"'));
assert.ok(component.includes("infrastructure.gov.au/media-communications/phone/triple-zero"));
assert.ok(component.includes('href="/help-directory"'));
assert.ok(component.includes('href="/privacy#retention-delete"'));
assert.ok(component.includes("메일 앱이 열렸다는 화면은 발송 완료가 아닙니다"));
assert.ok(component.includes("issuer_or_bank를 즉시 이용합니다"));
assert.ok(component.includes("자료 준비 때문에 000 연락을 늦추지 않습니다"));
assert.ok(!page.includes("support@hojucompass.com") && !component.includes("support@hojucompass.com"));

console.log("Contact support next-action, mail-only, emergency, and privacy boundaries passed.");
