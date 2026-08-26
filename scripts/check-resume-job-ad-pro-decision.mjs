import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [checker, offerPage] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
]);

const decisionStart = checker.indexOf('<section className="mt-7 border border-navy/20');
const decisionEnd = checker.indexOf("</section>", decisionStart);
assert.ok(decisionStart >= 0 && decisionEnd > decisionStart, "the completed comparison needs one explicit free-versus-saved decision section");

const decision = checker.slice(decisionStart, decisionEnd);

for (const contract of [
  'aria-labelledby="job-ad-next-step-heading"',
  'aria-describedby="job-ad-next-step-description"',
  'aria-label="무료 점검과 Resume Pro 저장 가치 비교"',
  "현재 결과로 결정하기",
  "이번 이력서만 고칠지, 이 회사 지원서를 저장할지 선택하세요.",
  "현재 결과는 문구 확인 {result.matchedCount}개 · 실제 근거 확인 {result.missingCount}개입니다.",
  "이 개수는 합격 점수가 아니에요.",
  "이번 한 번만 고치면 무료 TXT와 Builder로 끝내고",
  "같은 근거를 회사별 지원서로 다시 열어 비교해야 하면 Pro 저장 결과를 확인하세요.",
  "무료 점검의 이력서·공고 원문은 저장되지 않고",
  "표현 후보와 확인 상태만 현재 탭에 최대 30분 남아요.",
  "근거 메모 TXT 저장",
  "원문 없이 표현 후보와 근거 질문을 저장해 다음 지원에서 파일로 다시 열어요.",
  "경력 + 실제 공고 저장",
  "다시 열어 나란히 비교",
  "회사별 버전의 마감일·지원 상태를 저장하고, 확인한 근거와 체크리스트를 다시 열어요.",
  "결제 후 같은 공고를 다시 찾지 않도록 준비하세요.",
  "원문은 저장·자동 전달되지 않습니다.",
  "현재 Job Ad만 클립보드에 복사되며",
  "Pro 작업공간에서 사용자가 직접 붙여 넣습니다.",
  "Job Ad 원문 복사",
]) {
  assert.ok(decision.includes(contract), `the pre-purchase decision is missing: ${contract}`);
}

const proCta = decision.indexOf('href="/resume-pro?from=job-ad-checker"');
const freeCta = decision.indexOf('href="/resume-builder"');
assert.ok(proCta >= 0 && freeCta > proCta, "the high-intent saved-application action must precede the free fallback in mobile and DOM order");
assert.ok(decision.includes("회사별 지원서 저장 방식 비교하기"), "the paid action must name the persistent job before checkout");
assert.ok(decision.includes("표현 후보와 확인 상태가 이어져요"), "the paid action must name the reusable evidence without implying raw-input transfer");
assert.ok(decision.includes("이번 이력서만 무료로 수정하기"), "the free one-off path must remain available as the secondary action");

const focusRings = decision.match(/focus-visible:ring-2/g) ?? [];
assert.equal(focusRings.length, 3, "the copy action and both decision links need an explicit keyboard focus indicator");
const tapTargets = decision.match(/min-h-12/g) ?? [];
assert.equal(tapTargets.length, 3, "the copy action and both mobile decision links need a 48px minimum target");

assert.doesNotMatch(decision, /원문과 결과는 이 화면을 떠나면 남지 않아요/, "the decision must not hide the 30-minute evidence-only handoff");
assert.doesNotMatch(decision, /track\(|sendBeacon|fetch\(|resumeText|jobAdText/, "the decision section must not create duplicate analytics or expose pasted inputs");

assert.match(checker, /function downloadEvidenceMemo\(\)[\s\S]*buildEvidenceMemo\(\)[\s\S]*new Blob\(\[memo\], \{ type: "text\/plain;charset=utf-8" \}\)[\s\S]*resume-job-ad-evidence-memo\.txt/, "the free result needs a real user-controlled TXT save action");
assert.match(checker, /다음 지원에서 파일을 다시 열어 재사용할 수 있어요/, "the save result must name its concrete reuse boundary");
const resultActionsStart = checker.indexOf('<div className="mt-6 flex flex-wrap gap-3">');
const resultActionsEnd = checker.indexOf("</div>", resultActionsStart);
const resultActions = checker.slice(resultActionsStart, resultActionsEnd);
assert.ok(resultActions.indexOf("근거 메모 TXT 저장") < resultActions.indexOf("근거 메모 복사") && resultActions.indexOf("근거 메모 복사") < resultActions.indexOf("점검기 링크 공유"), "save, copy and share must follow the useful mobile and keyboard order");
assert.equal((resultActions.match(/focus-visible:ring-2/g) ?? []).length, 3, "all free-result actions need explicit keyboard focus indicators");
assert.doesNotMatch(checker.slice(checker.indexOf("function downloadEvidenceMemo"), checker.indexOf("async function copyEvidenceMemo")), /track\(|resumeText|jobAdText|sessionStorage|localStorage/, "TXT saving must stay local and exclude pasted raw inputs and analytics");
const jobAdCopy = checker.slice(checker.indexOf("async function copyJobAdForPro"), checker.indexOf("async function shareChecker"));
assert.match(jobAdCopy, /navigator\.clipboard\.writeText\(jobAd\)/, "the explicit prep action must copy the current Job Ad locally");
assert.doesNotMatch(jobAdCopy, /sessionStorage|localStorage|fetch\(|sendBeacon|track\(/, "the Job Ad copy action must not persist, transmit or analyse raw text");
assert.match(decision, /aria-live="polite"/, "copy success or failure needs an accessible announcement next to the action");

for (const handoffCopy of [
  "이번 이력서만 고칠지, 이 회사 지원서를 저장해 다시 열지 결정하세요.",
  "무료로는 원문 없는 근거 메모를 내려받고 Builder에서 이번 이력서를 고칠 수 있어요.",
  "회사별 이력서·커버레터·STAR 면접 메모·체크리스트로 저장해 다시 열고 비교하는 단계입니다.",
]) assert.ok(offerPage.includes(handoffCopy), `the offer handoff is missing the same result-based decision: ${handoffCopy}`);

console.log("Resume Job Ad Checker pre-purchase decision contract passed.");
