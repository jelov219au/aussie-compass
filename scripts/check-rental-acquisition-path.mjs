import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [freePage, attribution, offerPage, commerce, decisionBoard] = await Promise.all([
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/rentalApplicationProAttribution.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalApplicationProDecisionBoard.tsx", import.meta.url), "utf8"),
]);

const freeTool = freePage.indexOf("<PropertyInspectionChecklist />");
const freeProject = freePage.indexOf('<LocalProjectChecklist storageKey="house-hunt-project"');
const rentalInterest = freePage.indexOf('href="/rental-application-pro?from=property-inspection-checklist"');

assert.ok(freeTool >= 0 && freeProject > freeTool && rentalInterest > freeProject, "the free inspection and follow-up project must remain available before the Rental Pack introduction");
assert.ok(attribution.includes('"property-inspection-checklist"'), "the high-intent free route is missing from the Rental attribution allowlist");
assert.ok(offerPage.includes("normalizeRentalApplicationProEntry(from)") && offerPage.includes("<RentalApplicationProVisitTracker entry={entry}"), "the introduction page must normalize and measure only the allowlisted source");
assert.ok(freePage.includes("기능 차이와 준비 방식 보기"), "the free route needs an introduction-first Rental Pack action");
for (const value of [
  "방문 결과 저장·생활권 비교·다음 행동",
  "증빙 준비 비교·개인정보 점검·신청 묶음",
  "필요한 증빙 8종을 준비 전·확인 필요·완료로 비교",
  "영문 소개문과 남은 확인 항목을 TXT 준비 묶음으로 저장",
]) assert.ok(freePage.includes(value), `the free-to-Pro difference is missing: ${value}`);
assert.ok(!freePage.includes("방문 결과 저장·후보 비교·다음 행동"), "the free route must not imply multi-property storage in the single-visit checklist");

assert.ok(freePage.includes("이 무료 페이지에서는 결제를 시작하지 않습니다") && freePage.includes("판매 준비가 끝나기 전에는 제품 페이지에서도 결제가 열리지 않아요"), "the public interest path must stay introduction-only without hardcoding a temporary switch state");
assert.ok(!freePage.includes("/api/checkout/rental-application-pro"), "the free route must never submit directly to Rental checkout");
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
