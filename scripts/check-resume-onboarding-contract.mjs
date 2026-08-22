import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspace = await readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8");

for (const contract of [
  "첫 10분 빠른 시작",
  "quickStartSteps",
  "resume-pro-company",
  "resume-pro-job-ad",
  "resume-pro-cover-letter-action",
  "면접 준비로 이동",
]) {
  assert.ok(workspace.includes(contract), `Resume Pro first-session contract is missing: ${contract}`);
}

assert.ok(
  workspace.indexOf("첫 10분 빠른 시작") < workspace.indexOf("Application brief"),
  "The first-session guide must appear before the full application workspace",
);
assert.ok(
  workspace.includes('router.push("/resume-builder")'),
  "Customers without a saved resume need a direct path to the free builder",
);

console.log("Resume Pro first-session onboarding contract passed.");
