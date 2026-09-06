import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, outcomeComponent, supportHelper] = await Promise.all([
  readFile(new URL("../src/app/payment-help/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/payment/PaymentIssueNextAction.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/PaymentSupportHelper.tsx", import.meta.url), "utf8"),
]);

const exactFields = [
  "issue_state",
  "evidence_seen",
  "charge_status",
  "entitlement_status",
  "retry_allowed",
  "refund_or_access_effect",
  "support_route",
  "next_action",
];
const outcomeType = outcomeComponent.match(/type PaymentIssueOutcome = \{([\s\S]*?)\n\};/)?.[1] ?? "";
const declaredFields = [...outcomeType.matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]);
assert.deepEqual(declaredFields, exactFields, "payment outcome must keep the exact ordered 8-field contract");

const exactStates = [
  "before_checkout",
  "checkout_open_or_processing",
  "verified_failure_no_charge",
  "paid_pending_entitlement",
  "paid_no_access",
  "possible_duplicate",
  "receipt_invoice_question",
  "access_session_missing",
  "restore_code_lost_used_or_expired",
  "moved_device_workspace_missing",
  "refund_requested",
  "refund_full_confirmed",
  "refund_partial_or_review",
  "dispute_or_unrecognised_charge",
  "manual_review",
  "unknown",
];
const stateMap = outcomeComponent.match(/const issueStates:[\s\S]*?= \{([\s\S]*?)\n\};\n\nconst fieldLabels/)?.[1] ?? "";
const declaredStates = [...stateMap.matchAll(/^  ([a-z_]+): \{/gm)].map((match) => match[1]);
assert.deepEqual(declaredStates, exactStates, "payment outcome must cover every approved issue state once");

assert.equal((stateMap.match(/retry: "yes_once_after_runtime_verified_no_charge_no_entitlement_retryable_failure"/g) ?? []).length, 1);
assert.match(stateMap, /verified_failure_no_charge:[\s\S]*?runtime_verified_no_charge[\s\S]*?runtime_verified_none[\s\S]*?retry: "yes_once_after_runtime_verified_no_charge_no_entitlement_retryable_failure"/);
assert.equal((stateMap.match(/retry: "no"/g) ?? []).length, exactStates.length - 1);

for (const boundary of [
  "서명된 결제나 이용권 증명이 아님",
  "pending은 최종 청구 증명이 아님",
  "거래 상태와 Hoju 이용권은 별도",
  "이용권 복구와 로컬 자료 복구는 별도",
  "full_confirmed_revoke",
  "unknown_status_dependent",
  "open_or_lost_revoke · won_or_funds_reinstated_grant · otherwise_unknown",
  "requested_not_complete",
]) assert.ok(outcomeComponent.includes(boundary), `missing payment evidence/effect boundary: ${boundary}`);

for (const route of ["/terms", "/purchase-information", "/contact", "/privacy#payments-access", "/data-transfer"]) {
  assert.ok(outcomeComponent.includes(route), `missing direct support route: ${route}`);
}

assert.match(outcomeComponent, /useState<IssueState \| "">\(""\)/, "the selector must start without a claimed state");
assert.ok(outcomeComponent.includes("URL·브라우저 저장소·쿠키·파일·메일·분석으로 보내거나 저장하지 않습니다"));
assert.ok(outcomeComponent.includes("결제 참조·금액·이메일·증빙 원문은 입력받지 않습니다"));
for (const forbiddenMechanism of [
  "localStorage",
  "sessionStorage",
  "document.cookie",
  "indexedDB",
  "fetch(",
  "sendBeacon",
  "track(",
  "capture(",
  "<input",
  "<textarea",
  "navigator.clipboard",
]) assert.ok(!outcomeComponent.includes(forbiddenMechanism), `memory-only selector must not use: ${forbiddenMechanism}`);

const h1Position = page.indexOf("<h1");
const outcomePosition = page.indexOf("<PaymentIssueNextAction />");
const safetyPosition = page.indexOf('id="safety-first-heading"');
assert.ok(h1Position >= 0 && outcomePosition > h1Position && safetyPosition > outcomePosition, "the next-action selector must immediately lead the payment-help content after H1");
assert.ok(page.includes('id="support-role-boundary"'));
assert.ok(page.includes('id="product-restore-routes"'));
assert.ok(supportHelper.includes("4영업시간 이내 확인 결과 또는 다음 조치를 안내하는 것을 목표"), "access-only response expectation must remain scoped");
assert.ok(!outcomeComponent.includes("supportEmail"), "the outcome selector must not expose a hard-coded email route");

console.log("Payment-help payment-issue next-action contract passed.");
