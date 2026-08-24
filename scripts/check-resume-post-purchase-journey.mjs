import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [successPage, activationForm, purchaseSteps, workspacePage, workspaceGuide, accessTools] = await Promise.all([
  readFile(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProActivationForm.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProPostPurchaseSteps.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/workspace/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProWorkspaceEntryGuide.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProAccessTools.tsx", import.meta.url), "utf8"),
]);

assert.ok(successPage.includes("결제가 확인됐습니다. 이제 작업공간을 여세요."), "the paid success state needs one clear outcome");
assert.ok(successPage.includes("paymentConfirmed={paid}"), "the progress guide must receive the verified server-side payment state");
assert.ok(successPage.indexOf("같은 제품을 다시 결제할 필요는 없습니다.") < successPage.indexOf("<ResumeProActivationForm"), "repurchase prevention must appear before activation controls");

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
