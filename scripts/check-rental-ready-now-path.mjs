import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, freePage, freeProject, commerce] = await Promise.all([
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/LocalProjectChecklist.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
]);

const closedStart = offerPage.indexOf(") : (", offerPage.indexOf("{checkoutAvailable ? ("));
const closedEnd = offerPage.indexOf(")}", closedStart);
assert.ok(closedStart >= 0 && closedEnd > closedStart, "the unavailable Rental state needs a dedicated ready-now branch");
const closedBranch = offerPage.slice(closedStart, closedEnd);

for (const contract of [
  'href="/property-inspection-checklist#house-hunt-project"',
  "무료로 다음 행동 저장하기",
  'href="/property-inspection-checklist"',
  "방문 체크리스트 사용",
]) assert.ok(closedBranch.includes(contract), `the unavailable Rental action path is missing: ${contract}`);

const projectAction = closedBranch.indexOf('href="/property-inspection-checklist#house-hunt-project"');
const inspectionAction = closedBranch.indexOf('href="/property-inspection-checklist"');
assert.ok(projectAction >= 0 && projectAction < inspectionAction, "the working saved project must precede the generic checklist in mobile and DOM order");
assert.equal((closedBranch.match(/min-h-12/g) ?? []).length, 2, "both ready-now Rental actions need 48px mobile targets");
assert.doesNotMatch(closedBranch, /유료 검증 준비 중|disabled|checkout|결제 시작/, "the closed state must not present a disabled or paid dead end as an action");

assert.ok(freePage.includes('id="house-hunt-project"') && freePage.includes('className="mt-10 scroll-mt-24"'), "the direct free-project link needs a stable, offset destination");
assert.ok(freePage.indexOf('id="house-hunt-project"') < freePage.indexOf('<LocalProjectChecklist storageKey="house-hunt-project"'), "the destination must wrap the working project checklist");
for (const capability of [
  "localStorage.getItem(storageKey)",
  "localStorage.setItem(storageKey",
  "checked, targetDate",
  "캘린더 리마인더 받기",
]) assert.ok(freeProject.includes(capability), `the promoted free project is missing its working capability: ${capability}`);

assert.ok(offerPage.includes("Rental Pack 결제는 아직 열리지 않았어요."), "the free-first state must remain explicit that payment is unavailable");
assert.ok(offerPage.includes("지원·계약·입주 체크 상태와 목표일을 현재 브라우저에 저장"), "the landing must name the immediate free result accurately");
assert.ok(!offerPage.includes("후보 비교부터 지원·계약·입주까지 체크 상태와 목표일을 현재 브라우저에 저장"), "the landing must not overstate candidate storage or comparison");
assert.ok(offerPage.includes("A$14.90"), "the displayed Rental price must remain unchanged");
assert.ok(offerPage.includes("paymentReadiness.ready || testCheckoutAvailable"), "the Rental checkout readiness switch must remain unchanged");
assert.ok(commerce.includes("RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED"), "the Rental checkout kill switch must remain fail-closed");

console.log("Rental Pack ready-now free project path contract passed.");
