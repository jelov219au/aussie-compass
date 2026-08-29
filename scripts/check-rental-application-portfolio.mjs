import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, workspacePage, workspace, deviceStorage] = await Promise.all([
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rental-application-pro/workspace/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/rentalApplicationProDeviceStorage.ts", import.meta.url), "utf8"),
]);

for (const value of [
  "최대 20개 집 후보",
  "Application tracker",
  "Reusable evidence",
  "Messages & export",
  "집별 PDF·TXT·비공개 JSON과 전체 백업",
]) assert.ok(offerPage.includes(value), `the Rental offer is missing its expanded multi-property value: ${value}`);

assert.ok(workspacePage.includes("집마다 준비와 후속 행동을 따로 관리하세요."), "the workspace handoff must name the job customers bought");
assert.ok(workspacePage.includes("최대 20개 집 후보"), "the workspace introduction must match the implemented candidate limit");
assert.ok(workspacePage.includes("<RentalApplicationWorkspace />"), "the protected workspace must retain the local workspace");

for (const contract of [
  "const STORAGE_KEY = rentalApplicationProWorkspaceStorageKey",
  "const FIRST_SUCCESS_KEY = rentalApplicationProFirstSuccessStorageKey",
  "const MAX_APPLICATIONS = 20",
  "version: 3",
  "parsed.packs.slice(0, MAX_APPLICATIONS)",
  "applications: [createApplication",
  "evidenceLibrary",
  "privacyChecks",
  "followUps",
  "inspectionReceipt",
  "rentalReadyNowReceiptMatches",
  "duplicateApplication",
  "restoreBackup",
  "isRentalWorkspaceBackup(candidate, MAX_APPLICATIONS)",
  "file.size > 1_000_000",
  "window.confirm",
  "saveFirstCandidate",
  'window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved")',
  'id="rental-first-candidate-label"',
  'id="rental-document-readiness"',
  "downloadBackup",
  "downloadPropertyPackage",
  'id="rental-application-print"',
]) assert.ok(workspace.includes(contract), `the local Rental workspace contract is missing: ${contract}`);

for (const storageContract of [
  'rentalApplicationProWorkspaceStorageKey = "hoju-compass-rental-application-pro-v1"',
  'rentalApplicationProFirstSuccessStorageKey = "hoju-compass-rental-application-pro-first-success-v1"',
]) assert.ok(deviceStorage.includes(storageContract), `the canonical Rental device-storage contract is missing: ${storageContract}`);

const duplicateStart = workspace.indexOf("const duplicateApplication");
const duplicateEnd = workspace.indexOf("const deleteApplication", duplicateStart);
const duplicateBlock = workspace.slice(duplicateStart, duplicateEnd);
for (const reusableCondition of ["jurisdiction", "weeklyRent", "moveDate", "leaseTerm"]) {
  assert.ok(duplicateBlock.includes(`copy.${reusableCondition} = active.${reusableCondition}`), `safe property condition is missing: ${reusableCondition}`);
}
for (const propertySpecificField of ["propertyLabel", "suburb", "agentName", "messages", "statuses", "privacyChecks", "followUps", "applicationDate", "nextActionDate", "notes"]) {
  assert.ok(!duplicateBlock.includes(`copy.${propertySpecificField} = active.${propertySpecificField}`), `property-specific state must reset when duplicating: ${propertySpecificField}`);
}

const legacyMigration = workspace.slice(workspace.indexOf("if (parsed.version === 2 && Array.isArray(parsed.packs)"), workspace.indexOf("const migrated = createApplication"));
for (const preservedField of ["propertyLabel", "moveDate", "leaseTerm", "followUpDate", "statuses", "coverNote", "inspectionSummary"]) {
  assert.ok(legacyMigration.includes(preservedField), `the version-2 workspace migration drops: ${preservedField}`);
}
assert.ok(legacyMigration.includes("contactStatus ===") && legacyMigration.includes("evidenceLibrary: createEvidenceLibrary"), "legacy stage and reusable evidence must migrate deliberately");

const firstSaveStart = workspace.indexOf("const saveFirstCandidate");
const firstSaveEnd = workspace.indexOf("const addApplication", firstSaveStart);
const firstSave = workspace.slice(firstSaveStart, firstSaveEnd);
assert.ok(firstSave.indexOf("window.localStorage.setItem(STORAGE_KEY") < firstSave.indexOf('window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved")'), "the workspace must persist before marking first-candidate success");
assert.ok(firstSave.indexOf('window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved")') < firstSave.indexOf("setFirstCandidateSaved(true)"), "the success UI must follow both local writes");

assert.doesNotMatch(workspace, /\b(?:agentEmail|agentPhone|exactAddress|tfn|bankAccount|identityNumber)\s*:/i, "the workspace must not add sensitive identity, finance or agent-contact fields");
assert.doesNotMatch(workspace, /fetch\(|FormData/, "the local Rental workspace must not send drafts or documents over the network");
assert.ok(offerPage.includes("A$14.90"), "the Rental price display changed unexpectedly");
assert.ok(offerPage.includes("paymentReadiness.ready || testCheckoutAvailable"), "the Rental checkout switch changed unexpectedly");

console.log("Rental Application Pack expanded workspace and migration contract passed.");
