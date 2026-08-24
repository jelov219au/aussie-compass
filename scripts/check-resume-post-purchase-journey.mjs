import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, successPage, activationForm, purchaseSteps, workspacePage, workspaceGuide, accessTools] = await Promise.all([
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProPostPurchaseSteps.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/workspace/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProWorkspaceEntryGuide.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProAccessTools.tsx", import.meta.url), "utf8"),
]);

assert.ok(offerPage.includes('getActiveResumeProEntitlement()'), "the offer page must recognise an active device entitlement before offering checkout");
assert.ok(offerPage.includes('const canOfferCheckout = checkoutAvailable && !requiresBuyerRecovery && !hasActiveEntitlement;'), "an active buyer must never satisfy the checkout guard");
assert.ok(offerPage.includes('이 기기의 Resume Pro 이용권을 확인했습니다. 다시 결제하지 말고'), "an active buyer needs explicit repurchase prevention before the offer");
assert.ok(offerPage.includes('결제는 이미 완료됐습니다. 작업공간에서 저장한 회사별 지원서를 다시 열거나 새 지원서를 시작하세요.'), "an active buyer must not be asked to evaluate the purchase again");
assert.ok((offerPage.match(/href="\/resume-pro\/workspace#resume-pro-workspace"/g) ?? []).length >= 2, "active-buyer CTAs must return to the fixed first-task workspace destination");
assert.ok(offerPage.indexOf("hasActiveEntitlement ? (") < offerPage.indexOf("<ResumeProCheckoutJumpLink"), "workspace continuation must take precedence over checkout");
assert.ok(offerPage.includes('{canOfferCheckout && <div id="resume-pro-checkout"'), "the checkout form must remain behind the active-entitlement-aware guard");
assert.ok(offerPage.includes('checkoutFailure && !hasActiveEntitlement'), "stale Checkout errors must not replace an active buyer's safe continuation");
assert.match(offerPage, /hasActiveEntitlement \? \([\s\S]*추가 결제 없이 계속 이용[\s\S]*\) : \([\s\S]*A\$19\.90/, "the active-buyer price card must become a paid-access continuation state");
assert.match(offerPage, /\{!hasActiveEntitlement && \(\s*<ResumeProProofLink[\s\S]*결제 전에 내 공고로 차이 확인하기/, "the in-hero pre-purchase proof CTA must be hidden from active buyers");
assert.match(offerPage, /\{!hasActiveEntitlement && \(\s*<>\s*<section[^>]+buyer-fit-heading[\s\S]*무료 빌더 열기[\s\S]*<\/section>\s*<\/>\s*\)\}/, "price-fit, launch-interest and pre-purchase comparison sections must share one active-buyer guard");
assert.doesNotMatch(offerPage, /href=\{[^}]*resume-pro\/workspace|redirect\([^)]*resume-pro\/workspace/, "active-buyer recovery must not accept or construct an arbitrary workspace URL");

assert.ok(successPage.includes("결제가 확인됐습니다. 이제 작업공간을 여세요."), "the paid success state needs one clear outcome");
assert.ok(successPage.includes("paymentConfirmed={paid}"), "the progress guide must receive the verified server-side payment state");
assert.ok(successPage.indexOf("같은 제품을 다시 결제할 필요는 없습니다.") < successPage.indexOf("<ResumeProActivationForm"), "repurchase prevention must appear before activation controls");
assert.ok(successPage.includes("getActiveResumeProEntitlement()"), "the success page must recognise an already connected device before re-verifying Checkout");
assert.ok(successPage.includes("if (!hasActiveEntitlement && sessionId)"), "an active buyer must not repeat Checkout verification");
assert.match(successPage, /hasActiveEntitlement \? \([\s\S]*바로 작업공간에서 계속하세요\.[\s\S]*href="\/resume-pro\/workspace#resume-pro-workspace"[\s\S]*\) : \(\s*<ResumeProActivationForm/, "an active buyer must bypass activation for the fixed protected workspace destination");
assert.ok(successPage.includes("결제나 이용권 연결을 다시 진행하지 마세요."), "the revisiting buyer needs explicit duplicate-action prevention");
assert.doesNotMatch(successPage, /href=\{[^}]*resume-pro\/workspace|redirect\([^)]*resume-pro\/workspace/, "the active success path must not accept or construct an arbitrary destination");

for (const step of ["결제 결과 확인", "이 기기에 이용권 연결", "작업공간에서 지원서 준비"]) {
  assert.ok(purchaseSteps.includes(step), `the post-purchase journey is missing: ${step}`);
}
assert.ok(purchaseSteps.includes('!paymentConfirmed && (notice === "pending" || notice === "unavailable")'), "unverified payment states must keep access connection as the next step, not a second current step");
assert.ok(activationForm.includes("이용권 연결하고 작업공간 열기"), "the ready state needs an action-and-outcome CTA");
assert.ok(activationForm.includes('notice === "used" || notice === "released"'), "restore must be limited to replay or released-device states");
assert.ok(activationForm.includes("복구 코드는 작업공간에 들어간 뒤 만들 수 있어요."), "new customers must know restore is a later workspace action");
assert.ok(activationForm.includes("열리지 않을 때 확인 순서"), "activation failure needs a safe support path");
assert.ok(activationForm.includes("코드가 없다면 고객지원 확인 순서를 이용하세요."), "restore must not strand customers without a code");

assert.ok(workspacePage.includes("<ResumeProWorkspaceEntryGuide accessProtected={accessProtected} />"), "the activated workspace needs a visible handoff guide");
assert.ok(workspacePage.indexOf("<ResumeProWorkspaceEntryGuide") < workspacePage.indexOf("<ResumeProWorkspace />"), "the handoff guide must appear before the full workspace");
assert.ok(workspaceGuide.includes('href="#resume-pro-workspace"') && workspaceGuide.includes('href="#resume-pro-access"'), "workspace guidance must link to the first task and later recovery-code action");
assert.ok(accessTools.includes('id="resume-pro-access"'), "the recovery-code guidance needs a stable destination");

for (const source of [successPage, activationForm, purchaseSteps, workspaceGuide]) {
  assert.doesNotMatch(source, /\btrack\(|ResumeProVisitTracker|sendBeacon|XMLHttpRequest/, "post-purchase guidance must not add analytics or data transport");
}
assert.doesNotMatch(purchaseSteps, /session_id|activation_nonce|restore_code|email|card|payment_intent/i, "the progress guide must not render payment identifiers or customer PII");

console.log("Resume Pro post-purchase journey contract passed.");
