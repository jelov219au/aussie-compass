import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspace = await readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8");

for (const contract of [
  "첫 회사별 지원서 하나를 저장해보세요.",
  "다음 공고를 시작해도 이번 준비를 다시 열어 비교할 수 있어요.",
  'id: "save-application", label: "회사별 지원서 저장", done: currentApplicationSaved',
  'id="resume-pro-save-application"',
  '"resume-pro-save-application"',
  "현재 지원서 저장됨",
  "변경사항 있음",
]) assert.ok(workspace.includes(contract), `the first saved-application success contract is missing: ${contract}`);

assert.match(workspace, /const activeApplication = useMemo\([\s\S]*applications\.find\([\s\S]*activeApplicationId/);
assert.match(workspace, /currentApplicationSaved = Boolean\(activeApplication && JSON\.stringify\(activeApplication\.draft\) === JSON\.stringify\(draft\)\)/);
assert.ok(
  workspace.indexOf('id: "cover-letter"') < workspace.indexOf('id: "save-application"'),
  "a generated cover letter must be saved as a company application before first-session completion",
);
assert.ok(
  workspace.indexOf('id: "save-application"') < workspace.indexOf("quickStartCompleted"),
  "the saved application must count toward the existing quick-start completion gate",
);
assert.doesNotMatch(workspace, /track\("Resume Pro First Application|sendBeacon/, "the saved-application step must not add a duplicate analytics event");

console.log("Resume Pro first saved-application success contract passed.");
