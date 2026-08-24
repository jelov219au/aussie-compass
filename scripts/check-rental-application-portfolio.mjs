import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, workspacePage, workspace, portfolio] = await Promise.all([
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rental-application-pro/workspace/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationPortfolio.tsx", import.meta.url), "utf8"),
]);

for (const value of [
  "최대 6개 집의 서류 준비율과 다음 확인일",
  "최대 6개 집 후보 비교·재사용",
  "Property board",
]) assert.ok(offerPage.includes(value), `the Rental offer is missing its multi-property value: ${value}`);

assert.ok(workspacePage.includes("집마다 준비와 후속 행동을 따로 관리하세요."), "the workspace handoff must name the job customers bought");
assert.ok(workspacePage.includes("<RentalApplicationWorkspace />"), "the protected workspace must retain the portfolio workspace");

for (const contract of [
  'const STORAGE_KEY = "hoju-compass-rental-application-pro-v1"',
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
]) assert.ok(workspace.includes(contract), `the local rental portfolio contract is missing: ${contract}`);

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
]) assert.ok(portfolio.includes(value), `the comparison board is missing: ${value}`);

for (const contactState of ["not-contacted", "drafting", "sent", "follow-up", "closed"]) {
  assert.ok(portfolio.includes(contactState), `the structured follow-up state is missing: ${contactState}`);
}

assert.doesNotMatch(workspace, /\b(?:agentName|agentEmail|agentPhone|exactAddress|tfn|bankAccount|identityNumber)\s*:/i, "the portfolio must not add sensitive identity, finance or agent-contact fields");
assert.doesNotMatch(workspace, /type="file"|FormData|fetch\(/, "the portfolio must not upload rental documents or send local drafts");
assert.doesNotMatch(portfolio, /fetch\(|track\(|sendBeacon|localStorage|sessionStorage/, "the comparison UI must remain a presentation boundary");

assert.ok(offerPage.includes("A$14.90"), "the existing Rental price display changed unexpectedly");
assert.ok(offerPage.includes("paymentReadiness.ready || testCheckoutAvailable"), "the existing checkout switch changed unexpectedly");

console.log("Rental Application Pack multi-property portfolio contract passed.");
