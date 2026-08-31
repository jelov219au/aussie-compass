import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";

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

const contact = { id: "contact-1", date: "2026-08-31", channel: "email", direction: "sent", summary: "Receipt requested" };
const fiftyContacts = Array.from({ length: 50 }, (_, index) => ({ ...contact, id: `contact-${index + 1}` }));
for (const version of [2, 3]) {
  const candidate = { ...validBackup.applications[0], followUps: fiftyContacts };
  const backup = { ...validBackup, version, applications: [candidate] };
  const original = JSON.stringify(backup);
  assert.equal(isRentalWorkspaceBackup(backup), true, `v${version} must preserve all 50 supported contact records`);
  assert.equal(JSON.stringify(backup), original, "validation must not change the backup records");

  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [candidate, { ...candidate }] }), false,
    `v${version} must reject duplicate candidate IDs before edits could affect multiple candidates`);
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [{ ...candidate, followUps: [contact, { ...contact, summary: "Separate reply" }] }] }), false,
    `v${version} must reject duplicate contact IDs within one candidate before deletion could remove both`);
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [{ ...candidate, followUps: [...fiftyContacts, { ...contact, id: "contact-51" }] }] }), false,
    `v${version} must reject a backup whose contact history would be silently truncated`);
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: [candidate, { ...candidate, id: "candidate-2" }] }), true,
    "different candidates may reuse contact IDs and labels because their records are scoped separately");
  assert.equal(isRentalWorkspaceBackup({ ...backup, applications: Array.from({ length: 20 }, (_, index) => ({ ...candidate, id: `candidate-${index + 1}` })) }), true,
    "the full supported workspace of 20 candidates with 50 contacts each must remain restorable");
  assert.equal(JSON.stringify(backup), original, "rejected alternatives must leave source records unchanged");
}
assert.equal(isRentalWorkspaceBackup({ version: 2, applications: [{ id: "legacy-without-contacts" }] }), true,
  "legacy backups with no contact-history field must remain valid");
console.log("PASS: backup record identity, loss prevention and v2/v3 compatibility");

// Exercise the actual event handler without starting a browser or a development server.
const contactHandlerStart = workspace.indexOf("  const addFollowUp = () => {");
const contactHandlerEnd = workspace.indexOf("  const removeFollowUp =", contactHandlerStart);
assert.ok(contactHandlerStart >= 0 && contactHandlerEnd > contactHandlerStart);
const contactHandler = stripTypeScriptTypes(workspace.slice(contactHandlerStart, contactHandlerEnd));
function addContact(history, draft = { date: "2026-08-31", channel: "email", direction: "sent", summary: "  New contact  " }) {
  const active = { ...validBackup.applications[0], stage: "submitted", followUps: history };
  const before = JSON.stringify({ active, draft });
  const changes = [], drafts = [], messages = [];
  let idsCreated = 0;
  runInNewContext(`${contactHandler}\naddFollowUp();`, {
    active, followUpDraft: draft,
    createId: () => { idsCreated += 1; return "new-contact"; },
    updateActive: (value) => changes.push(value),
    setFollowUpDraft: (value) => drafts.push(value),
    setMessage: (value) => messages.push(value),
  }, { timeout: 1000 });
  assert.equal(JSON.stringify({ active, draft }), before, "contact insertion must not mutate existing records or the pending draft");
  return { changes, drafts, messages, idsCreated };
}

const belowLimit = addContact(fiftyContacts.slice(0, 49));
assert.equal(belowLimit.changes.length, 1);
assert.equal(belowLimit.changes[0].followUps.length, 50);
assert.ok(fiftyContacts.slice(0, 49).every((entry, index) => belowLimit.changes[0].followUps[index] === entry), "adding the 50th contact must retain the oldest record and order");
assert.equal(belowLimit.changes[0].followUps[49].summary, "New contact");
assert.equal(belowLimit.changes[0].stage, "follow_up");
assert.equal(belowLimit.drafts.length, 1);
assert.equal(belowLimit.idsCreated, 1);
for (const history of [fiftyContacts, [...fiftyContacts, { ...contact, id: "already-over-capacity" }]]) {
  const full = addContact(history);
  assert.equal(full.changes.length, 0, "at capacity the handler must not discard the oldest contact or change candidate state");
  assert.equal(full.drafts.length, 0, "blocked insertion must keep the user's unfinished input");
  assert.equal(full.idsCreated, 0);
  assert.match(full.messages[0], /50.*백업/);
}
const afterExplicitRemoval = addContact(fiftyContacts.slice(1));
assert.equal(afterExplicitRemoval.changes[0].followUps.length, 50);
assert.equal(afterExplicitRemoval.changes[0].followUps[0].id, "contact-2");
const incompleteContact = addContact([], { date: "", channel: "email", direction: "sent", summary: "" });
assert.equal(incompleteContact.changes.length, 0);
assert.equal(incompleteContact.drafts.length, 0);
console.log("PASS: contact capacity, oldest-record preservation and pending-input retention");
