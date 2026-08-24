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
  "경력 + 실제 공고 저장",
  "다시 열어 나란히 비교",
  "확인한 근거와 체크리스트를 재사용해요.",
]) {
  assert.ok(decision.includes(contract), `the pre-purchase decision is missing: ${contract}`);
}

const proCta = decision.indexOf('href="/resume-pro?from=job-ad-checker"');
const freeCta = decision.indexOf('href="/resume-builder"');
assert.ok(proCta >= 0 && freeCta > proCta, "the high-intent saved-application action must precede the free fallback in mobile and DOM order");
assert.ok(decision.includes("회사별 저장·재열기 흐름 보기"), "the paid action must name the persistent job before checkout");
assert.ok(decision.includes("이번 이력서만 무료로 수정하기"), "the free one-off path must remain available as the secondary action");

const focusRings = decision.match(/focus-visible:ring-2/g) ?? [];
assert.equal(focusRings.length, 2, "both decision links need an explicit keyboard focus indicator");
const tapTargets = decision.match(/min-h-12/g) ?? [];
assert.equal(tapTargets.length, 2, "both mobile decision actions need a 48px minimum target");

assert.doesNotMatch(decision, /원문과 결과는 이 화면을 떠나면 남지 않아요/, "the decision must not hide the 30-minute count-only handoff");
assert.doesNotMatch(decision, /track\(|sendBeacon|fetch\(|resumeText|jobAdText/, "the decision section must not create duplicate analytics or expose pasted inputs");

console.log("Resume Job Ad Checker pre-purchase decision contract passed.");
