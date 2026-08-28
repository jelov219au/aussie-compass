import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, successPage, purchaseSteps, workspace, exampleKit] = await Promise.all([
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/success/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProPostPurchaseSteps.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/downloads/resume-pro-example-application-kit.txt", import.meta.url), "utf8"),
]);

const sectionStart = offerPage.indexOf('<section className="border-t border-navy/20');
const sectionEnd = offerPage.indexOf("</section>", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "the offer needs one concrete first-paid-outcome preview before checkout");

const outcome = offerPage.slice(sectionStart, sectionEnd);
for (const copy of [
  'aria-labelledby="first-paid-outcome-heading"',
  'aria-label="Resume Pro 결제 후 첫 회사별 지원서 저장 순서"',
  "결제 확인 뒤, 첫 회사별 지원서 하나를 저장합니다.",
  "이용권 연결하고 작업공간 열기",
  "저장된 경력 + 실제 공고",
  "커버레터 확인 후 회사별 저장",
  "‘현재 지원서 저장’을 눌러 첫 결과물을 남겨요.",
  "완료 기준은 회사별 지원서 1개가 현재 브라우저에 저장된 상태예요.",
  "이용권 복구 코드는 작업 데이터 백업이 아닙니다.",
]) assert.ok(outcome.includes(copy), `the first-paid-outcome preview is missing: ${copy}`);

const openStep = outcome.indexOf("01 · 열기");
const connectStep = outcome.indexOf("02 · 연결");
const saveStep = outcome.indexOf("03 · 남기기");
assert.ok(openStep >= 0 && openStep < connectStep && connectStep < saveStep, "the pre-purchase preview must match the executable mobile and DOM order");

assert.ok(successPage.includes("결제가 확인됐습니다. 이제 작업공간을 여세요."), "the offer must lead to the verified success outcome");
assert.ok(purchaseSteps.includes("이 기기에 이용권 연결") && purchaseSteps.includes("작업공간에서 첫 지원서 저장"), "the preview must match the post-purchase handoff");
assert.ok(offerPage.includes('href="/downloads/resume-pro-example-application-kit.txt"') && offerPage.includes("가상 예시 지원서 패키지 TXT 보기·저장"), "the pre-purchase preview must expose the fictional application-kit download");
for (const section of [
  "SUBMISSION CHECK",
  "RESUME SNAPSHOT",
  "REUSABLE STAR EXPERIENCE",
  "COVER LETTER",
  "INTERVIEW PREPARATION",
]) {
  assert.ok(workspace.includes(`"${section}"`), `the live application-kit export is missing: ${section}`);
  assert.ok(exampleKit.includes(section), `the fictional application-kit sample is missing: ${section}`);
}
assert.ok(exampleKit.includes("FICTIONAL EXAMPLE — DO NOT SUBMIT") && exampleKit.includes("does not verify your claims or guarantee an interview or job"), "the public sample must remain clearly fictional and non-guaranteed");
assert.doesNotMatch(exampleKit, /@|\+?\d[\d\s()-]{7,}|https?:\/\//, "the public sample must not contain an email, phone number or external URL");
for (const workspaceContract of [
  'label: "무료 이력서 연결"',
  'label: "회사와 직무 입력"',
  'label: "채용 공고 붙여넣기"',
  'label: "첫 커버레터 초안 만들기"',
  'label: "회사별 지원서 저장"',
  'id="resume-pro-save-application"',
]) assert.ok(workspace.includes(workspaceContract), `the promised first outcome is not executable in the workspace: ${workspaceContract}`);

assert.doesNotMatch(outcome, /취업 보장|면접 보장|합격 보장|클라우드 동기화|track\(|sendBeacon|fetch\(/, "the outcome preview must not add guarantees, cloud claims or analytics");

console.log("Resume Pro first paid outcome preview contract passed.");
