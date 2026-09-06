import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [freePage, freeInspection, attribution, offerPage, commerce, decisionBoard] = await Promise.all([
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/PropertyInspectionChecklist.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/rentalApplicationProAttribution.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationProDecisionBoard.tsx", import.meta.url), "utf8"),
]);

const freeTool = freePage.indexOf("<PropertyInspectionChecklist />");
const freeProject = freePage.indexOf('<LocalProjectChecklist storageKey="house-hunt-project"');

assert.ok(freeTool >= 0 && freeProject > freeTool, "the free inspection must remain available before the follow-up project");
assert.ok(attribution.includes('"property-inspection-checklist"'), "the high-intent free route is missing from the Rental attribution allowlist");
assert.ok(offerPage.includes("normalizeRentalApplicationProEntry(from)") && offerPage.includes("<RentalApplicationProVisitTracker entry={entry}"), "the introduction page must normalize and measure only the allowlisted source");
assert.ok(freeInspection.includes('canContinueToRentalPack = readiness.ready && data.decision === "apply"'), "the Rental introduction must follow a completed free apply decision");
assert.ok(freeInspection.includes('router.push("/rental-application-pro?from=property-inspection-checklist")'), "the completed free result must still reach the Rental introduction");
assert.equal((freeInspection.match(/Rental Pack Pro 보기/g) ?? []).length, 1, "the free result must expose one conditional Rental introduction action");
assert.equal((freePage.match(/rental-application-pro\?from=property-inspection-checklist/g) ?? []).length, 0, "the static page must not expose an early Rental introduction");
assert.ok(!freePage.includes("방문 결과 저장·후보 비교·다음 행동"), "the free route must not imply multi-property storage in the single-visit checklist");

assert.ok(freeInspection.includes("무료 신청 결정을 마쳤고") && freeInspection.includes("방문 메모와 세부 체크 결과는 옮기지 않습니다"), "the conditional handoff must explain the free-first and privacy boundary");
assert.ok(!freePage.includes("유료 검증 준비 중"), "the launched Rental product must not keep the stale validation-preparation label");
assert.ok(!freePage.includes("/api/checkout/rental-application-pro") && !freeInspection.includes("/api/checkout/rental-application-pro"), "the free route must never submit directly to Rental checkout");
assert.ok(offerPage.includes("{checkoutAvailable &&") && offerPage.includes("<RentalApplicationProCheckoutForm"), "the offer must keep checkout behind readiness");
assert.ok(commerce.includes('process.env.VERCEL_ENV !== "production"') && commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "Rental checkout must remain fail-closed behind the product switch");

const decisionBoardPosition = offerPage.indexOf("<RentalApplicationProDecisionBoard checkoutAvailable={checkoutAvailable} />");
const comparisonPosition = offerPage.indexOf('id="rental-free-pro-comparison"');
assert.ok(decisionBoardPosition >= 0 && comparisonPosition > decisionBoardPosition, "the saved situation board must lead into the full free-to-Pro comparison");
for (const contract of [
  'const DECISION_STORAGE_KEY = "hoju-compass-rental-pro-decision-v1"',
  'const FREE_PROJECT_STORAGE_KEY = "house-hunt-project"',
  "window.localStorage.getItem(FREE_PROJECT_STORAGE_KEY)",
  "window.localStorage.setItem(DECISION_STORAGE_KEY",
  "normaliseDecision",
  "FREE_PROJECT_ITEM_IDS.has(id)",
  "MAX_PROPERTIES = 6",
  "무료로 이어갈지,",
  "Pro 포트폴리오를 비교할 가치가 높아요.",
  "무료 프로젝트로 먼저 진행해도 충분해요.",
  'href="#rental-free-pro-comparison"',
  'href="#rental-pro-checkout"',
]) assert.ok(decisionBoard.includes(contract), `the saved Rental purchase-decision bridge is missing: ${contract}`);
assert.ok(decisionBoard.includes("min-h-12") && decisionBoard.includes("grid-cols-3"), "the decision controls need mobile-first 48px targets and a compact grid");
assert.ok(decisionBoard.includes("checkoutAvailable ?") && decisionBoard.includes("판매 준비 중 · 판단은 저장됨"), "the purchase action must remain readiness-aware without a disabled checkout dead end");
assert.doesNotMatch(decisionBoard, /fetch\(|FormData|sendBeacon|type="file"|agentEmail|exactAddress|tfn|bankAccount/i, "the public decision board must remain local and avoid sensitive rental fields");

console.log("Rental high-intent acquisition path contract passed.");
