import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [freePage, attribution, offerPage, commerce] = await Promise.all([
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/rentalApplicationProAttribution.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
]);

const freeTool = freePage.indexOf("<PropertyInspectionChecklist />");
const freeProject = freePage.indexOf('<LocalProjectChecklist storageKey="house-hunt-project"');
const rentalInterest = freePage.indexOf('href="/rental-application-pro?from=property-inspection-checklist"');

assert.ok(freeTool >= 0 && freeProject > freeTool && rentalInterest > freeProject, "the free inspection and follow-up project must remain available before the Rental Pack introduction");
assert.ok(attribution.includes('"property-inspection-checklist"'), "the high-intent free route is missing from the Rental attribution allowlist");
assert.ok(offerPage.includes("normalizeRentalApplicationProEntry(from)") && offerPage.includes("<RentalApplicationProVisitTracker entry={entry}"), "the introduction page must normalize and measure only the allowlisted source");
assert.ok(freePage.includes("기능 차이와 준비 방식 보기"), "the free route needs an introduction-first Rental Pack action");
for (const value of [
  "방문 결과 저장·후보 비교·다음 행동",
  "증빙 준비 비교·개인정보 점검·신청 묶음",
  "필요한 증빙 8종을 준비 전·확인 필요·완료로 비교",
  "영문 소개문과 남은 확인 항목을 TXT 준비 묶음으로 저장",
]) assert.ok(freePage.includes(value), `the free-to-Pro difference is missing: ${value}`);

assert.ok(freePage.includes("이 무료 페이지에서는 결제를 시작하지 않습니다") && freePage.includes("판매 준비가 끝나기 전에는 제품 페이지에서도 결제가 열리지 않아요"), "the public interest path must stay introduction-only without hardcoding a temporary switch state");
assert.ok(!freePage.includes("/api/checkout/rental-application-pro"), "the free route must never submit directly to Rental checkout");
assert.ok(offerPage.includes("{checkoutAvailable &&") && offerPage.includes("<RentalApplicationProCheckoutForm"), "the offer must keep checkout behind readiness");
assert.ok(commerce.includes('process.env.VERCEL_ENV !== "production"') && commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "Rental checkout must remain fail-closed behind the product switch");

console.log("Rental high-intent acquisition path contract passed.");
