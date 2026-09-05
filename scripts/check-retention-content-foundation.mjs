import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [usedCar, toolsPage, routeFinder, taxTracker, taxPage, taxGuide, sitemap, searchPage, dataTransfer, dashboard, returnVisit, taxStorage] = await Promise.all([
  readFile(new URL("../src/app/used-car-comparison/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/tools/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/PersonalRouteFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/TaxPrepTracker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/tax-prep-tracker/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/tax-return-guide/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/search/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/DeviceDataTransfer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/dashboard/MyCompassDashboard.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ReturnVisitSection.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/taxPrepStorage.ts", import.meta.url), "utf8"),
]);

for (const marketplace of ["Facebook Marketplace", "Gumtree", "Carsales"]) {
  assert.ok(usedCar.includes(marketplace), `the used-car starting guide is missing ${marketplace}`);
}
for (const safetyStep of ["Messenger나 WhatsApp", "독립 검사", "PPSR·Rego 확인", "Scamwatch 거래 사기 안내"]) {
  assert.ok(usedCar.includes(safetyStep), `the used-car buying path is missing ${safetyStep}`);
}
assert.ok(usedCar.indexOf("호주 중고차는 보통 여기서 찾습니다") < usedCar.lastIndexOf("<VehicleComparison />"), "buying venues and safety guidance must precede candidate recording");
assert.ok(toolsPage.includes("중고차 구매처·체크리스트") && toolsPage.includes("중고차 찾는 법 보기"), "the tools directory must present discovery before comparison");

const arrivePriority = routeFinder.slice(routeFinder.indexOf("arrive: ["), routeFinder.indexOf("],", routeFinder.indexOf("arrive: [")));
const livePriority = routeFinder.slice(routeFinder.indexOf("live: ["), routeFinder.indexOf("],", routeFinder.indexOf("live: [")));
for (const path of ["/arrival-checklist", "/english-phrase-cards", "/property-inspection-checklist"]) assert.ok(arrivePriority.includes(path), `arrival priority is missing ${path}`);
for (const path of ["/tax-prep-tracker", "/job-application-tracker", "/cost-of-living-calculator"]) assert.ok(livePriority.includes(path), `established-life priority is missing ${path}`);
assert.notEqual(arrivePriority, livePriority, "arrival and established-life routes must not be identical");
assert.match(routeFinder, /concernRank[\s\S]*stageRank/, "recommendations must combine the selected concern with stage-specific order");
assert.ok(routeFinder.includes('sydneyMonth >= 7 && sydneyMonth <= 10') && routeFinder.includes('tool.href === "/tax-return-guide" ? -1'), "July-to-October recommendations must elevate the tax-return submission guide for relevant established users");

for (const contract of ["현재 브라우저에만 쌓이는 준비 장부", "증빙 없는 기록", "CSV 백업·검토용 저장", "TFN, 계좌번호", "지출 후보 합계"]) {
  assert.ok(taxTracker.includes(contract), `the year-round tax tracker is missing ${contract}`);
}
assert.doesNotMatch(taxTracker, /fetch\(|sendBeacon|XMLHttpRequest|FormData/, "tax records must not be transmitted from the tracker");
assert.ok(taxPage.includes("7월의 숙제를, 매달 작은 기록으로 바꾸세요") && taxPage.includes("<TaxPrepTracker />"), "the tax tracker page must lead with the year-round habit and render the working tool");
assert.ok(taxGuide.includes('href="/tax-prep-tracker"'), "the existing EOFY guide must lead into the year-round tracker");
for (const discoverySurface of [sitemap, searchPage, toolsPage]) assert.ok(discoverySurface.includes("/tax-prep-tracker"), "the new tracker must be discoverable from sitemap, search and tools");
for (const [changedRoute, lastModified] of Object.entries({
  "/tools": "2026-09-05",
  "/used-car-comparison": "2026-08-30",
  "/tax-prep-tracker": "2026-08-29",
  "/tax-return-guide": "2026-08-29",
})) assert.ok(sitemap.includes(`"${changedRoute}": "${lastModified}"`), `the significantly updated route needs its evidence-based lastmod: ${changedRoute}`);
assert.ok(taxStorage.includes("hoju-compass-tax-prep-records-v1"), "the tax tracker needs a stable storage key");
assert.ok(dataTransfer.includes("taxPrepRecordsStorageKey"), "tax records must remain in the explicit device backup");
assert.ok(dashboard.includes("readCompassRecords") && returnVisit.includes("readCompassRecords") && (await readFile(new URL("../src/lib/compassRecords.ts", import.meta.url), "utf8")).includes("taxPrepRecordsStorageKey"), "dashboard and home must reuse the validated tax-record summary");

console.log("Retention content foundation contract passed.");
