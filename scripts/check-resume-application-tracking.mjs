import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  getResumeProApplicationPrioritySummary,
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

const application = (id, status, deadline, updatedAt = "2026-08-26T00:00:00.000Z") => ({
  id,
  company: `Company ${id}`,
  role: "Role",
  updatedAt,
  draft: { applicationStatus: status, applicationDeadline: deadline },
});
const priority = getResumeProApplicationPrioritySummary([
  application("today", "ready", "2026-08-26"),
  application("overdue", "preparing", "2026-08-25"),
  application("upcoming", "preparing", "2026-08-27"),
  application("follow-up", "follow_up", ""),
  application("submitted", "submitted", "2026-08-24"),
], "2026-08-26");
assert.deepEqual(priority.statusCounts, { preparing: 2, ready: 1, submitted: 1, follow_up: 1 });
assert.equal(priority.nearestDeadline?.application.id, "today", "the nearest actionable deadline must prefer today or the next future deadline");
assert.deepEqual(priority.priorityItems.map((item) => item.application.id), ["today", "overdue", "upcoming"], "reopen priority must use deadline proximity and put a missed deadline before an equally distant future deadline");
assert.deepEqual(priority.priorityItems.map((item) => item.reason), ["today", "overdue", "upcoming"]);

const legacyPriority = getResumeProApplicationPrioritySummary([application("legacy", undefined, undefined, "")], "2026-08-26");
assert.deepEqual(legacyPriority.statusCounts, { preparing: 1, ready: 0, submitted: 0, follow_up: 0 }, "a legacy draft without tracking fields must remain visible as preparing");
assert.equal(legacyPriority.priorityItems[0]?.reason, "no_deadline");

const [workspace, trackingSource, packageConfig] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProApplicationTracking.ts", import.meta.url), "utf8"),
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
for (const summaryContract of [
  "getResumeProApplicationPrioritySummary(applications, localCalendarDate())",
  "지금 다시 열 지원서",
  "가장 가까운 마감은",
  "다시 열기 우선순위",
  "reopenApplication(item.application.id)",
  "현재 브라우저의 저장본만 계산",
]) assert.ok(workspace.includes(summaryContract), `the executable application priority summary is missing: ${summaryContract}`);
assert.ok(workspace.indexOf("지금 다시 열 지원서") < workspace.indexOf("applications.map((application)"), "the mobile priority summary must come before the full saved list");
assert.match(workspace, /min-h-12 w-full[\s\S]*applicationPriorityReason\(item\)/, "priority reopen actions need a 48px mobile target and a text reason");
assert.doesNotMatch(trackingSource, /fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|window\.location|\btrack\(/, "priority calculation must remain pure, local and network-free");

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
