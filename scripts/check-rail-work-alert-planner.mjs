import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(new URL("../src/components/tools/RailWorkAlertPlanner.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/rail-work-alerts/page.tsx", import.meta.url), "utf8");
const transportPage = readFileSync(new URL("../src/app/public-transport-guide/page.tsx", import.meta.url), "utf8");
const toolsPage = readFileSync(new URL("../src/app/tools/page.tsx", import.meta.url), "utf8");
const searchPage = readFileSync(new URL("../src/app/search/page.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

assert.match(component, /aussie-compass-rail-work-watch-areas-v1/, "watch areas must use a dedicated local storage key");
assert.match(component, /filter\(isWatchArea\).*slice\(0, MAX_AREAS\).*map\(normalizeArea\)/, "stored data must be allowlisted and bounded");
assert.match(component, /정확한 집 주소 대신 동네·역 이름만 저장하세요/, "the UI must discourage exact-address storage");
assert.match(component, /실시간 작업 정보를 자동 수집하지는 않으며/, "the UI must not imply live data collection");
assert.match(component, /https:\/\/transportnsw\.info\/alerts/);
assert.match(component, /https:\/\/bigbuild\.vic\.gov\.au\/disruptions\/disruptions-map/);
assert.match(component, /https:\/\/translink\.com\.au\/service-updates/);
assert.match(component, /https:\/\/www\.google\.com\/maps\/search\/\?api=1/, "map lookup must be explicit and user initiated");
assert.match(component, /공식 공지 원문 열기/);
assert.match(component, /시작·종료 날짜 다시 확인/);
assert.match(component, /대체 버스·우회 경로 확인/);
assert.match(component, /접근성·막차 영향 확인/);
assert.doesNotMatch(component, /fetch\(|XMLHttpRequest|sendBeacon|geolocation|cookie|sessionStorage/, "P1 must remain local and network-free");
assert.match(page, /실시간 알림, 거리 계산 또는 운행 보장을 제공하지 않습니다/, "the page must fail closed on unavailable capabilities");
assert.match(transportPage, /href="\/rail-work-alerts"/, "the planner needs an entry from the existing transport journey");
assert.match(toolsPage, /href: "\/rail-work-alerts"[\s\S]*최대 5곳 로컬 저장[\s\S]*NSW·VIC·QLD 공식 링크[\s\S]*날짜·대체교통 체크/, "the tools directory must describe only implemented planner capabilities");
assert.match(searchPage, /href:"\/rail-work-alerts"[\s\S]*동네·역을 브라우저에 저장하고 지도 위치, 공식 작업 공지와 날짜·대체교통 체크리스트 반복 확인/, "site search must expose the implemented local workflow");
assert.match(sitemap, /"\/rail-work-alerts"/, "the public route must be present in the sitemap");
assert.equal(packageJson.scripts["test:rail-work-alert-planner"], "node scripts/check-rail-work-alert-planner.mjs", "package scripts must expose the contract");
assert.match(packageJson.scripts["quality:gate"], /npm run test:rail-work-alert-planner/, "the full quality gate must run the planner contract");
assert.doesNotMatch(`${toolsPage}\n${searchPage}`, /실시간 철도|자동 알림|지도 마커|주변 공사 자동/, "discovery copy must not claim unimplemented live or marker features");

console.log("Rail work alert planner contract passed.");
