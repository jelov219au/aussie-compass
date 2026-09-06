import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [checker, page, workspace, nextAction] = await Promise.all([
  readFile(new URL("../src/components/tools/DaspReadinessCheck.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/leaving-australia-guide/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/LeavingAustraliaProWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/DepartureNextAction.tsx", import.meta.url), "utf8"),
]);

for (const value of [
  'type="radio"',
  'value: "yes"',
  'value: "no"',
  'value: "unknown"',
  "보유한 모든 호주 임시비자가 만료되거나 취소됐나요?",
  "다른 현재 유효 임시비자도 확인하세요",
  "시민권·영주권 범주:",
  "이것은 신청 가능 확정이 아닙니다",
  "VEVO가 모든 과거 비자 기록을 보여준다고 가정하지 말고",
  "환급만을 위해 비자를 취소하지 말고",
  "이 화면의 답변 초기화",
]) assert.ok(checker.includes(value), `DASP readiness flow is missing: ${value}`);

assert.doesNotMatch(checker, /type="checkbox"/, "the readiness flow must distinguish no and unknown from unanswered");
assert.match(checker, /<fieldset[\s\S]*<legend/);
assert.match(checker, /answeredCount === 0/);
assert.match(checker, /conditions\.every\(\(\{ id \}\) => answers\[id\] === "yes"\)/);
assert.doesNotMatch(checker, /localStorage|sessionStorage|@vercel\/analytics|\btrack\(|sendBeacon|XMLHttpRequest|\bfetch\(/, "answers must remain only in React memory");

for (const value of [
  'href="#departure-prep"',
  'href="#dasp-conditions"',
  'href="#dasp-after-submit"',
  "안정적인 ATO DASP 안내에서 online, paper form, fund 또는 ATO-held Super 경로를 선택하세요",
  "Direct service가 열리지 않으면 반복 제출하지 말고",
  "펀드가 검색되지 않음",
  "TFN 제공은 선택 사항",
  "제출 내용에 오류가 있음",
  "펀드 보유분은 해당 펀드에, ATO 보유분은 ATO에 문의하세요",
  "기관이 필요한 자료를 모두 받은 뒤부터",
  "제출 버튼을 누른 뒤 28일 안에 입금된다는 보장이 아닙니다",
  "Have you received all required information for my DASP application? Is anything outstanding, and when should I follow up?",
  "실제 계좌 입금과 지급 명세를 대조한 뒤 완료로 표시하세요",
]) assert.ok(page.includes(value), `DASP guide is missing: ${value}`);

const projectSource = page.slice(page.indexOf("const departureGroups"), page.indexOf("export default function"));
const projectIds = [...projectSource.matchAll(/\{id:"([^"]+)"/g)].map((match) => match[1]);
assert.equal(projectIds.length, 20, "the existing departure project must retain exactly 20 task IDs");
assert.equal(new Set(projectIds).size, 20, "the departure project task IDs must remain unique");
for (const id of ["visa-plan", "bank", "phone", "access", "visa-ceased", "dasp", "follow-up"]) assert.ok(projectIds.includes(id), `the existing project task was lost: ${id}`);

for (const existingBoundary of ["65%", "Tax-free component", "ATO 보유 Super 확인", "정산 기록 기능·구매 조건 보기"] ) {
  assert.ok(`${page}\n${nextAction}`.includes(existingBoundary), `the existing free/paid boundary is missing: ${existingBoundary}`);
}
assert.ok(workspace.includes("DASP 제출에는 보유한 모든 임시비자가 더 이상 유효하지 않아야 합니다"), "the paid workspace must use the same all-temporary-visas wording");
assert.doesNotMatch(`${page}\n${checker}`, /신청 가능합니다|자격이 확정|승인율|예상 수령액|비자를 취소하세요/, "the guide must not declare eligibility, approval or a cancellation action");
assert.doesNotMatch(`${page}\n${checker}`, /applicant\.tr\.super\.ato\.gov\.au|\?pid=1/, "the failed direct DASP service must not remain a primary action");

console.log("WEB43 DASP readiness and post-submission contract passed.");
