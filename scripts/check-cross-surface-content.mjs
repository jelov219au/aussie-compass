import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  agents,
  policy,
  manifest,
  layout,
  serviceWorker,
  homePage,
  toolsSection,
  toolsPage,
  returnVisitSection,
  railRegistry,
  deviceTransfer,
  packageSource,
] = await Promise.all([
  read("AGENTS.md"),
  read("docs/dual-surface-compatibility.md"),
  read("src/app/manifest.ts"),
  read("src/app/layout.tsx"),
  read("public/sw.js"),
  read("src/app/page.tsx"),
  read("src/components/sections/ToolsSection.tsx"),
  read("src/app/tools/page.tsx"),
  read("src/components/sections/ReturnVisitSection.tsx"),
  read("src/lib/railWorkAlerts.ts"),
  read("src/components/tools/DeviceDataTransfer.tsx"),
  read("package.json"),
]);

const packageJson = JSON.parse(packageSource);

assert.match(manifest, /id: "\/"[\s\S]*start_url: "\/"[\s\S]*scope: "\/"[\s\S]*display: "standalone"/, "the installed PWA must share the website root and route scope");
assert.match(layout, /<ServiceWorkerRegistration \/>/, "the root layout must keep one service worker registration for both surfaces");
assert.match(serviceWorker, /const OFFLINE_URL = "\/offline"/, "the current offline boundary must remain explicit");
assert.match(serviceWorker, /fetch\(event\.request\)\.catch\(\(\) => caches\.match\(OFFLINE_URL\)\)/, "navigation must remain network-first with the explicit fallback");
assert.doesNotMatch(serviceWorker, /rail-work-alerts|nsw-planning-snapshot/, "transport data must not be silently cached as current");

assert.match(agents, /Web and installable-app parity/, "future agents must receive the shared-surface rule");
assert.match(agents, /`호환`, `주의사항과 함께 호환`, `차단됨`/, "future work must report a compatibility result before implementation");
for (const boundary of ["데스크톱 웹", "모바일 웹", "설치형 PWA", "오프라인", "저장값", "플랫폼 API"]) {
  assert.ok(policy.includes(boundary), `the compatibility contract must cover ${boundary}`);
}
assert.match(policy, /공용 라우트·컴포넌트·출처 registry/, "the contract must require one canonical implementation");
assert.match(policy, /사용되지 않는 컴포넌트 문자열은 완료 근거가 아니다/, "a dead component must not count as homepage delivery");

assert.match(homePage, /<ToolsSection \/>/, "the homepage must expose the public tools directory");
assert.match(homePage, /<ReturnVisitSection \/>/, "the homepage must expose resumable local work");
assert.match(toolsSection, /href="\/tools"/, "web and installed PWA must share the same tools-directory entry");
assert.match(toolsPage, /href: "\/rail-work-alerts"/, "the tools directory must expose the canonical rail route");
const compassRecords = await read("src/lib/compassRecords.ts");
assert.match(returnVisitSection, /readCompassRecords/, "home must use the shared validated summary");
assert.match(compassRecords, /item\(RAIL_WORK_ALERT_STORAGE_KEY[\s\S]*parseWatchAreas/, "saved rail areas must remain resumable through their original validator");
assert.doesNotMatch(`${toolsSection}\n${toolsPage}\n${returnVisitSection}`, /display-mode|standalone\)\.matches/, "the feature must not be hidden from either surface");
assert.match(railRegistry, /RAIL_WORK_ALERT_ROUTE = "\/rail-work-alerts"/, "the canonical transport route must remain explicit");
assert.match(deviceTransfer, /RAIL_WORK_ALERT_STORAGE_KEY/, "browser and installed-PWA storage must have an explicit manual transfer path");
assert.match(deviceTransfer, /resumeProStarStoriesStorageKey[\s\S]*Resume Pro STAR 경험 보관함[\s\S]*sensitive: true/, "Resume Pro STAR stories used by application-kit exports must transfer with company snapshots across web and installed-PWA storage");
await access(new URL("../src/app/rail-work-alerts/page.tsx", import.meta.url));

assert.equal(packageJson.scripts["test:cross-surface-content"], "node scripts/check-cross-surface-content.mjs", "package scripts must expose the cross-surface contract");
assert.match(packageJson.scripts["quality:gate"], /npm run test:cross-surface-content/, "the full quality gate must enforce the cross-surface contract");

console.log("Website and installed-PWA content contract passed.");
