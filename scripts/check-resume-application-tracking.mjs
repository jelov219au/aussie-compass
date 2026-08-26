import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normaliseResumeProApplicationDeadline,
  normaliseResumeProApplicationStatus,
  resumeProApplicationStatusLabels,
} from "../src/lib/resumeProApplicationTracking.ts";

assert.equal(normaliseResumeProApplicationDeadline("2026-08-31"), "2026-08-31");
for (const invalid of [null, "", "31-08-2026", "2026-02-30", "2026-13-01", "2026-8-1"]) {
  assert.equal(normaliseResumeProApplicationDeadline(invalid), "", `invalid deadline must fail closed: ${String(invalid)}`);
}
for (const status of ["preparing", "ready", "submitted", "follow_up"]) {
  assert.equal(normaliseResumeProApplicationStatus(status), status);
  assert.ok(resumeProApplicationStatusLabels[status]);
}
assert.equal(normaliseResumeProApplicationStatus("accepted"), "preparing");
assert.equal(normaliseResumeProApplicationStatus(null), "preparing");

const [workspace, packageConfig] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
]);
for (const contract of [
  'applicationDeadline: ""',
  'applicationStatus: "preparing"',
  "normaliseResumeProApplicationDeadline(stored.applicationDeadline)",
  "normaliseResumeProApplicationStatus(stored.applicationStatus)",
  'setField("applicationDeadline"',
  'setField("applicationStatus"',
  "resumeProApplicationStatusLabels[application.draft.applicationStatus]",
  "Application deadline:",
  "Application status:",
]) assert.ok(workspace.includes(contract), `application tracking contract is missing: ${contract}`);

assert.ok(workspace.indexOf("지원 마감일") < workspace.indexOf("채용 공고<textarea"), "mobile reading order must put deadline and status before the job ad");
assert.match(workspace, /type="date" className=\{inputClass\}/);
assert.match(workspace, /지원 상태<select className=\{inputClass\}/);
assert.doesNotMatch(workspace, /fetch\([^)]*applicationDeadline|track\([^)]*application(Status|Deadline)|sendBeacon[^\n]*application(Status|Deadline)|URLSearchParams[^\n]*application(Status|Deadline)/, "application tracking values must stay out of network, analytics and URLs");

assert.equal(
  packageConfig.scripts["test:resume-application-tracking"],
  "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-resume-application-tracking.mjs",
  "the application tracking contract must remain directly runnable",
);
assert.match(
  packageConfig.scripts["quality:gate"],
  /(?:^| && )npm run test:resume-application-tracking(?: && |$)/,
  "quality:gate must include application tracking regression coverage",
);

console.log("Resume Pro application deadline and status contract passed.");
