import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";

import { isRentalWorkspaceBackup } from "../src/lib/rentalWorkspaceBackup.ts";

const workspace = await readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8");
const publicPage = await readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8");
const printStyles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");
const jurisdictions = await readFile(new URL("../src/data/rentalJurisdictions.ts", import.meta.url), "utf8");

const contracts = [
  [workspace.includes('version: 3'), "versioned local workspace"],
  [workspace.includes('parsed.version === 2') && workspace.includes('coverNote'), "legacy v1 and v2 migration"],
  [workspace.includes('MAX_APPLICATIONS = 20'), "bounded multi-property tracker"],
  [workspace.includes('Reusable profile') && workspace.includes('privacyChecks'), "reusable profile and privacy checklist"],
  [workspace.includes('Reusable evidence') && workspace.includes('checkedOn') && workspace.includes('applyReusableEvidence'), "dated reusable evidence library"],
  [workspace.includes('followUps:') && workspace.includes('addFollowUp') && workspace.includes('FOLLOW-UP LOG'), "property-isolated follow-up history"],
  [workspace.includes('const copy = createApplication(id, `집 후보') && workspace.includes('이전 집의 주소·문구·제출 상태·연락 기록은 안전을 위해 복사하지 않았습니다'), "safe property-condition duplication"],
  [workspace.includes('application:') && workspace.includes('inspection:') && workspace.includes('followUp:'), "three message templates"],
  [workspace.includes('application-pack.txt') && workspace.includes('private-package.json') && workspace.includes('application/json;charset=utf-8'), "per-property package and whole-workspace exports"],
  [workspace.includes('restoreBackup') && workspace.includes('백업 복원') && workspace.includes('isRentalWorkspaceBackup(candidate, MAX_APPLICATIONS)'), "validated whole-workspace restore"],
  [workspace.includes('file.size > 1_000_000'), "bounded local backup restore"],
  [workspace.includes('nextActionStatus') && workspace.includes('일 지남') && workspace.includes('다음 행동 ·'), "relative due-action warnings"],
  [workspace.includes('activeJurisdiction') && jurisdictions.includes('["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]'), "eight-jurisdiction official guidance"],
  [workspace.includes('min-h-11 min-w-11') && !workspace.includes('min-h-10'), "mobile-sized action controls"],
  [workspace.includes('id="rental-application-print"') && printStyles.includes('#rental-application-print'), "print-to-PDF output"],
  [printStyles.includes('body:has(#rental-application-print)') && printStyles.includes('position: static'), "isolated print layout without retained hidden pages"],
  [publicPage.includes('결제 미오픈') && publicPage.includes('최대 20개 집 후보'), "honest pre-sale public copy"],
];

const failed = contracts.filter(([passed]) => !passed);
if (failed.length) {
  for (const [, name] of failed) console.error(`FAIL: ${name}`);
  process.exit(1);
}

for (const [, name] of contracts) console.log(`PASS: ${name}`);

const validBackup = {
  version: 3,
  profile: { householdSize: "1", employmentSummary: "", rentalSummary: "", petSummary: "No pets", strengths: "" },
  evidenceLibrary: { identity: { status: "ready", checkedOn: "2026-08-29" } },
  activeId: "candidate-1",
  applications: [{
    id: "candidate-1", propertyLabel: "Carlton candidate", suburb: "Carlton", jurisdiction: "VIC", weeklyRent: "620", agentName: "", moveDate: "", leaseTerm: "12 months", stage: "preparing", applicationDate: "", nextActionDate: "", notes: "",
    statuses: { identity: "ready" }, privacyChecks: { "no-tfn": true }, messages: { application: "Draft", inspection: "", followUp: "" }, followUps: [], inspectionReceipt: null,
  }],
};
assert.equal(isRentalWorkspaceBackup(validBackup), true, "an exported Rental workspace shape must restore");
assert.equal(isRentalWorkspaceBackup({ version: 3, applications: [{}] }), false, "an unrelated version-shaped JSON file must not replace the workspace");
assert.equal(isRentalWorkspaceBackup({ version: 3, applications: [{ id: "unrelated" }] }), false, "an id alone must not impersonate a current Rental backup");
assert.equal(isRentalWorkspaceBackup({ ...validBackup, version: 2 }), true, "a structurally valid v2 backup must remain restorable");
assert.equal(isRentalWorkspaceBackup({ ...validBackup, applications: [{ ...validBackup.applications[0], propertyLabel: 620 }] }), false, "wrong application field types must be rejected");
assert.equal(isRentalWorkspaceBackup({ ...validBackup, applications: Array.from({ length: 21 }, (_, index) => ({ ...validBackup.applications[0], id: `candidate-${index}` })) }), false, "oversized backups must not be silently truncated");
console.log("PASS: malformed backup rejection");
