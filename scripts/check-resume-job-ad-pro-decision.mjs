import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checker = await readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8");

const decisionStart = checker.indexOf('<section className="mt-7 border border-navy/20');
const decisionEnd = checker.indexOf("</section>", decisionStart);
assert.ok(decisionStart >= 0 && decisionEnd > decisionStart, "the completed comparison needs one explicit free-versus-saved decision section");

const decision = checker.slice(decisionStart, decisionEnd);

for (const contract of [
  'aria-labelledby="job-ad-next-step-heading"',
  'aria-describedby="job-ad-next-step-description"',
  'aria-label="무료 점검과 Resume Pro 저장 가치 비교"',
  "무료 점검의 이력서·공고 원문과 세부 비교 결과는 저장되지 않고",
  "현재 탭에는 문구 확인·근거 확인 개수만 최대 30분 남아요.",
  "근거 메모 TXT 저장",
  "원문 없이 표현 후보와 근거 질문을 저장해 다음 지원에서 파일로 다시 열어요.",
  "경력 + 실제 공고 저장",
  "다시 열어 나란히 비교",
  "확인한 근거와 체크리스트를 재사용해요.",
]) {
  assert.ok(decision.includes(contract), `the pre-purchase decision is missing: ${contract}`);
}

const proCta = decision.indexOf('href="/resume-pro?from=job-ad-checker"');
const freeCta = decision.indexOf('href="/resume-builder"');
assert.ok(proCta >= 0 && freeCta > proCta, "the high-intent saved-application action must precede the free fallback in mobile and DOM order");
assert.ok(decision.includes("회사별 지원서 저장 방식 비교하기"), "the paid action must name the persistent job before checkout");
assert.ok(decision.includes("현재 탭의 요약 개수만 이어져요"), "the paid action must not imply that raw inputs or detailed results transfer");
assert.ok(decision.includes("이번 이력서만 무료로 수정하기"), "the free one-off path must remain available as the secondary action");

const focusRings = decision.match(/focus-visible:ring-2/g) ?? [];
assert.equal(focusRings.length, 2, "both decision links need an explicit keyboard focus indicator");
const tapTargets = decision.match(/min-h-12/g) ?? [];
assert.equal(tapTargets.length, 2, "both mobile decision actions need a 48px minimum target");

assert.doesNotMatch(decision, /원문과 결과는 이 화면을 떠나면 남지 않아요/, "the decision must not hide the 30-minute count-only handoff");
assert.doesNotMatch(decision, /track\(|sendBeacon|fetch\(|resumeText|jobAdText/, "the decision section must not create duplicate analytics or expose pasted inputs");

assert.match(checker, /function downloadEvidenceMemo\(\)[\s\S]*buildEvidenceMemo\(\)[\s\S]*new Blob\(\[memo\], \{ type: "text\/plain;charset=utf-8" \}\)[\s\S]*resume-job-ad-evidence-memo\.txt/, "the free result needs a real user-controlled TXT save action");
assert.match(checker, /다음 지원에서 파일을 다시 열어 재사용할 수 있어요/, "the save result must name its concrete reuse boundary");
const resultActionsStart = checker.indexOf('<div className="mt-6 flex flex-wrap gap-3">');
const resultActionsEnd = checker.indexOf("</div>", resultActionsStart);
const resultActions = checker.slice(resultActionsStart, resultActionsEnd);
assert.ok(resultActions.indexOf("근거 메모 TXT 저장") < resultActions.indexOf("근거 메모 복사") && resultActions.indexOf("근거 메모 복사") < resultActions.indexOf("점검기 링크 공유"), "save, copy and share must follow the useful mobile and keyboard order");
assert.equal((resultActions.match(/focus-visible:ring-2/g) ?? []).length, 3, "all free-result actions need explicit keyboard focus indicators");
assert.doesNotMatch(checker.slice(checker.indexOf("function downloadEvidenceMemo"), checker.indexOf("async function copyEvidenceMemo")), /track\(|resumeText|jobAdText|sessionStorage|localStorage/, "TXT saving must stay local and exclude pasted raw inputs and analytics");

console.log("Resume Job Ad Checker pre-purchase decision contract passed.");
