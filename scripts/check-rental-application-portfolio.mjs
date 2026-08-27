import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, workspacePage, workspace, portfolio, deviceStorage] = await Promise.all([
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rental-application-pro/workspace/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationPortfolio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/rentalApplicationProDeviceStorage.ts", import.meta.url), "utf8"),
]);

for (const value of [
  "최대 6개 집의 서류 준비율과 다음 확인일",
  "최대 6개 집 후보 비교·재사용",
  "Property board",
]) assert.ok(offerPage.includes(value), `the Rental offer is missing its multi-property value: ${value}`);

assert.ok(workspacePage.includes("집마다 준비와 후속 행동을 따로 관리하세요."), "the workspace handoff must name the job customers bought");
assert.ok(workspacePage.includes("<RentalApplicationWorkspace />"), "the protected workspace must retain the portfolio workspace");

for (const contract of [
  "const STORAGE_KEY = rentalApplicationProWorkspaceStorageKey",
  "const MAX_PACKS = 6",
  "version: 2",
  "readStoredWorkspace",
  "const migrated = normalizePack(parsed, 0)",
  "parsed.packs.slice(0, MAX_PACKS)",
  "window.crypto.randomUUID()",
  "<RentalApplicationPortfolio",
  "onCreate={() => addPack(false)}",
  "onReuse={() => addPack(true)}",
  "onRemove={removeActivePack}",
  "window.confirm",
  "contactStatus",
  "followUpDate",
  "const FIRST_SUCCESS_KEY = rentalApplicationProFirstSuccessStorageKey",
  "hasMeaningfulPackData",
  "saveFirstCandidate",
  "window.localStorage.setItem(FIRST_SUCCESS_KEY, \"saved\")",
  "onSaveFirstCandidate={saveFirstCandidate}",
  'id="rental-document-readiness"',
  "첫 임차 지원 준비 패키지를 저장하고 다시 열어보세요.",
  'aria-label="Rental Pack Pro 첫 지원 준비 패키지 완료 순서"',
  'label: "집 후보 저장"',
  'label: "영문 소개문 완성"',
  'label: "저장본 다시 열기"',
  'label: "준비 패키지 TXT 내보내기"',
  "saveAndReopenActivePack",
  "setReopenedPackFingerprint(JSON.stringify(reopenedPack))",
  "setExportedPackFingerprint(currentPackFingerprint)",
  'id="rental-cover-note-action"',
  'id="rental-package-download-action"',
]) assert.ok(workspace.includes(contract), `the local rental portfolio contract is missing: ${contract}`);

for (const storageContract of [
  'rentalApplicationProWorkspaceStorageKey = "hoju-compass-rental-application-pro-v1"',
  'rentalApplicationProFirstSuccessStorageKey = "hoju-compass-rental-application-pro-first-success-v1"',
]) assert.ok(deviceStorage.includes(storageContract), `the canonical Rental device-storage contract is missing: ${storageContract}`);

const reuseStart = workspace.indexOf("const nextPack = reuseCurrent");
const reuseEnd = workspace.indexOf("setWorkspace((current)", reuseStart);
const reuseBlock = workspace.slice(reuseStart, reuseEnd);
for (const reusableField of ["householdSize", "employmentSummary", "rentalSummary", "petSummary", "strengths"]) {
  assert.ok(reuseBlock.includes(`${reusableField}: draft.${reusableField}`), `safe reusable field is missing: ${reusableField}`);
}
assert.ok(workspace.includes('const REUSABLE_DOCUMENT_IDS = new Set(["identity", "income", "employment", "rental-history"])'), "only reusable evidence states may carry to another property");
assert.ok(reuseBlock.includes("REUSABLE_DOCUMENT_IDS.has(id)"), "property-specific document states must be filtered during reuse");
for (const propertySpecificField of ["moveDate: draft.moveDate", "coverNote: draft.coverNote", "followUpDate: draft.followUpDate", "contactStatus: draft.contactStatus"]) {
  assert.ok(!reuseBlock.includes(propertySpecificField), `property-specific state must reset when reusing a pack: ${propertySpecificField}`);
}

for (const value of [
  "집마다 따로 준비하고, 한눈에 비교하세요.",
  "준비율",
  "확인 필요",
  "빈 집 후보 추가",
  "현재 준비사항 재사용",
  "현재 후보 삭제",
  "정확한 주소나 에이전트 연락처 없이",
  "구매 후 첫 1분",
  "첫 집 후보 하나를 먼저 저장하세요.",
  "첫 후보 저장",
  "첫 후보 저장 완료",
  "무료 프로젝트의 전체 할 일과 달리",
  'href="#rental-document-readiness"',
]) assert.ok(portfolio.includes(value), `the comparison board is missing: ${value}`);

const firstSaveForm = portfolio.slice(portfolio.indexOf("<form"), portfolio.indexOf("</form>"));
assert.ok(firstSaveForm.includes("event.preventDefault()") && firstSaveForm.includes("onSaveFirstCandidate()"), "the first candidate must save locally without navigation or a network form action");
assert.ok(firstSaveForm.includes("min-h-12") && firstSaveForm.includes('maxLength={80}'), "the first-save path needs a 48px mobile action and bounded alias");
const immediateWorkspaceSave = workspace.indexOf("window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorkspace))");
const successMarkerSave = workspace.indexOf('window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved")');
const successState = workspace.indexOf("setFirstCandidateSaved(true)");
assert.ok(immediateWorkspaceSave >= 0 && immediateWorkspaceSave < successMarkerSave && successMarkerSave < successState, "the first-save success state must appear only after both local writes succeed");
const verifiedReopen = workspace.slice(workspace.indexOf("const saveAndReopenActivePack"), workspace.indexOf("const addPack"));
assert.ok(verifiedReopen.indexOf("window.localStorage.setItem(STORAGE_KEY, serialized)") < verifiedReopen.indexOf("window.localStorage.getItem(STORAGE_KEY)"), "the first outcome must persist before reading the saved candidate back");
assert.ok(verifiedReopen.includes("readStoredWorkspace") && verifiedReopen.includes("reopenedWorkspace?.packs.find"), "reopen completion must come from the normalized browser store, not only React state");
assert.ok(verifiedReopen.includes("setWorkspace(reopenedWorkspace)") && verifiedReopen.includes("setReopenedPackFingerprint"), "a verified browser read must restore the candidate before marking reopen complete");
assert.ok(workspace.indexOf('label: "저장본 다시 열기"') < workspace.indexOf('label: "준비 패키지 TXT 내보내기"'), "mobile first-outcome order must verify reopen before export");
assert.ok(portfolio.includes('id="rental-first-candidate-label"'), "the first-outcome action must focus the bounded candidate alias input");

for (const contactState of ["not-contacted", "drafting", "sent", "follow-up", "closed"]) {
  assert.ok(portfolio.includes(contactState), `the structured follow-up state is missing: ${contactState}`);
}

assert.doesNotMatch(workspace, /\b(?:agentName|agentEmail|agentPhone|exactAddress|tfn|bankAccount|identityNumber)\s*:/i, "the portfolio must not add sensitive identity, finance or agent-contact fields");
assert.doesNotMatch(workspace, /type="file"|FormData|fetch\(/, "the portfolio must not upload rental documents or send local drafts");
assert.doesNotMatch(portfolio, /fetch\(|track\(|sendBeacon|localStorage|sessionStorage/, "the comparison UI must remain a presentation boundary");
assert.doesNotMatch(firstSaveForm, /action=|method=|type="file"|FormData|fetch\(/, "the first candidate form must stay local and must not collect or transmit files");

assert.ok(offerPage.includes("A$14.90"), "the existing Rental price display changed unexpectedly");
assert.ok(offerPage.includes("paymentReadiness.ready || testCheckoutAvailable"), "the existing checkout switch changed unexpectedly");

console.log("Rental Application Pack multi-property portfolio contract passed.");
