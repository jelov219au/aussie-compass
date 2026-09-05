import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4323";
const outputDirectory = "outputs/night-20260905/home-navigation-analytics-web57";
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 320, height: 900 }, acceptDownloads: true });
await context.addInitScript(() => {
  Object.defineProperty(window, "__homeAnalytics", { value: [], configurable: true, writable: true });
  Object.defineProperty(window, "va", {
    configurable: true,
    writable: true,
    value: (...args) => window.__homeAnalytics.push(args),
  });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } });
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

const openHome = async () => {
  const response = await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.evaluate(() => { window.__homeAnalytics.length = 0; });
};
const captured = () => page.evaluate(() => window.__homeAnalytics.filter(([kind]) => kind === "event").map(([, payload]) => payload));
const expectSingle = async (name, data) => {
  const matches = (await captured()).filter((event) => event.name === name && Object.entries(data).every(([key, value]) => event.data?.[key] === value));
  assert.equal(matches.length, 1, `${name} ${JSON.stringify(data)} must be emitted exactly once`);
  assert.deepEqual(Object.keys(matches[0].data).sort(), Object.keys(data).sort(), `${name} must contain only approved properties`);
};

await openHome();
const positions = await page.locator("main > section").evaluateAll((sections) => Object.fromEntries(sections.map((section) => [section.id || section.getAttribute("aria-labelledby") || "anonymous", section.getBoundingClientRect().top + scrollY])));
assert.ok(positions.tools < positions["route-finder"] && positions["route-finder"] < positions.pro && positions.pro < positions["home-trust-heading"]);
assert.equal(await page.locator('#pro [data-home-featured-product="none"]').count(), 1);
assert.equal(await page.locator('#pro a[href^="/pro#"]').count(), 6);
assert.ok((await page.locator("#pro").textContent())?.includes("지금 이용 가능한 Pro 없음"));
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);

await page.locator('#tools a[href="/tools"]').click();
await page.waitForURL(`${baseUrl}/tools`);
await expectSingle("Home Navigation", { section: "essential_tools", destination: "tools" });

await openHome();
await page.locator('#route-finder a[href="/tools"]').click();
await page.waitForURL(`${baseUrl}/tools`);
await expectSingle("Home Navigation", { section: "route_finder", destination: "tools" });

await openHome();
await page.evaluate(() => {
  window.va = (kind, payload) => {
    if (kind === "event") throw new Error("forced analytics failure");
    window.__homeAnalytics.push([kind, payload]);
  };
});
await page.locator('section[aria-labelledby="home-trust-heading"] a[href="/editorial-policy"]').first().click();
await page.waitForURL(`${baseUrl}/editorial-policy`);

await openHome();
await page.getByRole("button", { name: "3단계 계획으로 저장" }).click();
await expectSingle("Route Plan Action", { action: "save_plan", stage: "prepare", concern: "admin" });

await page.evaluate(() => { window.__homeAnalytics.length = 0; });
await page.getByRole("button", { name: "완료 표시" }).first().click();
await expectSingle("Route Plan Action", { action: "mark_step_complete", stage: "prepare", concern: "admin" });

await page.evaluate(() => { window.__homeAnalytics.length = 0; });
await page.getByRole("button", { name: "저장한 계획 보기" }).click();
await expectSingle("Route Plan Action", { action: "view_saved_plan", stage: "prepare", concern: "admin" });

await page.evaluate(() => { window.__homeAnalytics.length = 0; });
await page.getByRole("button", { name: "현재 선택의 추천 보기" }).click();
await expectSingle("Route Plan Action", { action: "view_current_recommendations", stage: "prepare", concern: "admin" });

await page.evaluate(() => { window.__homeAnalytics.length = 0; });
await page.getByRole("button", { name: "추천 경로 공유" }).click();
await expectSingle("Route Plan Action", { action: "share_recommendations", stage: "prepare", concern: "admin" });

await page.evaluate(() => { window.__homeAnalytics.length = 0; });
await page.getByRole("button", { name: "7일 뒤 점검 알림" }).click();
await expectSingle("Route Plan Action", { action: "download_reminder", stage: "prepare", concern: "admin" });

await page.evaluate(() => { window.__homeAnalytics.length = 0; });
await page.locator('#route-finder a[href="/my-compass"]').click();
await page.waitForURL(`${baseUrl}/my-compass`);
await expectSingle("Home Navigation", { section: "route_finder", destination: "my_compass" });

await openHome();
await page.locator('#pro a[href="/pro#resume-pro"]').click();
await page.waitForURL(`${baseUrl}/pro#resume-pro`);
await expectSingle("Pro Interest", { product: "resume-pro", entry: "home_catalog" });

await openHome();
await page.locator('#pro a[href="/underpayment-guide"]').click();
await page.waitForURL(`${baseUrl}/underpayment-guide`);
await expectSingle("Home Navigation", { section: "premium_closed_free", destination: "underpayment-guide" });

await openHome();
await page.getByRole("link", { name: "준비 중인 Pro 상태 비교" }).click();
await page.waitForURL(`${baseUrl}/pro`);
await expectSingle("Pro Interest", { product: "catalog", entry: "home_closed" });

await openHome();
await page.locator('section[aria-labelledby="home-trust-heading"] a[href="/privacy"]').click();
await page.waitForURL(`${baseUrl}/privacy`);
await expectSingle("Home Navigation", { section: "trust", destination: "privacy" });
assert.deepEqual(pageErrors, []);

const evidence = {
  baseUrl,
  viewport: 320,
  sectionPositions: positions,
  allClosed: { featured: "none", catalogLinks: 6, priceClaim: false },
  verifiedEvents: [
    "essential_tools/tools", "route_finder/tools", "save_plan", "mark_step_complete", "view_saved_plan", "view_current_recommendations", "share_recommendations", "download_reminder", "route_finder/my_compass", "home_catalog/resume-pro", "premium_closed_free/underpayment-guide", "home_closed/catalog", "trust/privacy",
  ],
  analyticsFailureNavigation: "/editorial-policy",
  horizontalOverflow: false,
  pageErrors,
};
fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(evidence));
