import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const outputDirectory = "outputs/night-20260905/header-search-web53";
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

const routes = [
  "/",
  "/tools",
  "/resources",
  "/pro",
  "/resources/first-payslip-checklist-australia",
  "/salary-calculator",
];
const routeEvidence = [];

for (const route of routes) {
  await page.setViewportSize({ width: 320, height: 900 });
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200, `${route} must return HTTP 200`);
  const header = page.locator("header");
  const brand = header.locator('a[href="/"]').first();
  const search = header.getByRole("link", { name: "통합 검색", exact: true });
  const menuButton = header.locator('button[aria-controls="mobile-menu"]');
  assert.equal(await menuButton.getAttribute("aria-label"), "메뉴 열기");
  assert.equal(await search.count(), 1, `${route} must expose exactly one visible named header search`);
  const [brandBox, searchBox, menuBox] = await Promise.all([brand.boundingBox(), search.boundingBox(), menuButton.boundingBox()]);
  for (const [name, box] of [["brand", brandBox], ["search", searchBox], ["menu", menuBox]]) {
    assert.ok(box && box.width >= 44 && box.height >= 44, `${route} ${name} must meet 44px touch target`);
    assert.ok(box.x >= 0 && box.x + box.width <= 320.5, `${route} ${name} must remain inside viewport`);
  }
  assert.ok(brandBox.x + brandBox.width <= searchBox.x, `${route} brand and search overlap`);
  assert.ok(searchBox.x + searchBox.width <= menuBox.x, `${route} search and menu overlap`);
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(layout.scrollWidth, layout.width, `${route} must not overflow horizontally`);

  await brand.focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "통합 검색", `${route} search must follow brand in mobile tab order`);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-controls")), "mobile-menu", `${route} menu must follow search in mobile tab order`);

  await menuButton.click();
  assert.equal(await menuButton.getAttribute("aria-expanded"), "true");
  assert.equal(await menuButton.getAttribute("aria-controls"), "mobile-menu");
  const mobileMenu = header.locator("#mobile-menu");
  assert.equal(await mobileMenu.getByRole("link", { name: "통합 검색", exact: true }).count(), 0, "mobile menu must not duplicate search");
  assert.equal(await mobileMenu.evaluate((node) => getComputedStyle(node).overflowY), "auto");
  await page.keyboard.press("Escape");
  assert.equal(await header.locator("#mobile-menu").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-controls")), "mobile-menu", "Escape must restore menu button focus");

  routeEvidence.push({ route, status: response?.status(), brand: brandBox, search: searchBox, menu: menuBox, layout });
}

await page.goto(`${baseUrl}/resources/first-payslip-checklist-australia`, { waitUntil: "networkidle" });
await page.evaluate(() => scrollTo(0, 520));
const beforeSearchScroll = await page.evaluate(() => scrollY);
await page.locator("header").getByRole("link", { name: "통합 검색", exact: true }).click();
await page.waitForURL(`${baseUrl}/search`);
assert.equal(new URL(page.url()).pathname, "/search");
assert.equal(new URL(page.url()).search, "", "header search must not expose query data");
await page.goBack({ waitUntil: "networkidle" });
assert.equal(new URL(page.url()).pathname, "/resources/first-payslip-checklist-australia");
await page.waitForTimeout(100);
const restoredScroll = await page.evaluate(() => scrollY);
assert.ok(beforeSearchScroll > 0 && restoredScroll > 0, "browser back must restore the originating article position");

await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
const homeHeader = page.locator("header");
await homeHeader.locator('button[aria-controls="mobile-menu"]').click();
await homeHeader.locator('#mobile-menu a[href="/tools"]').click();
await page.waitForURL(`${baseUrl}/tools`);
assert.equal(await page.locator("header #mobile-menu").count(), 0, "menu link navigation must close the menu");
assert.equal(await page.locator("header button[aria-controls=mobile-menu]").getAttribute("aria-expanded"), "false");

const boundaryEvidence = [];
for (const width of [320, 375, 419, 420, 768]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const header = page.locator("header");
  const search = header.getByRole("link", { name: "통합 검색", exact: true });
  assert.equal(await search.count(), 1, `${width}px must expose one visible screen-reader search name`);
  const visibleText = width >= 768
    ? (await search.textContent())?.trim() === "검색"
    : await search.locator("span", { hasText: "검색" }).isVisible().catch(() => false);
  const visibleIcon = await search.locator("svg").isVisible().catch(() => false);
  if (width < 420) {
    assert.equal(visibleText, false, `${width}px must use the compact icon`);
    assert.equal(visibleIcon, true, `${width}px must show the compact icon`);
  } else {
    assert.equal(visibleText, true, `${width}px must show the search text`);
    if (width < 768) assert.equal(visibleIcon, false, `${width}px mobile pill must hide the compact icon`);
  }
  const boxes = await header.locator('a[href="/"], a[aria-label="통합 검색"], button[aria-controls="mobile-menu"]').evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden";
  }).map((node) => {
    const rect = node.getBoundingClientRect();
    return { name: node.getAttribute("aria-label") ?? node.textContent?.trim(), left: rect.left, right: rect.right, width: rect.width, height: rect.height };
  }));
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(layout.scrollWidth, width);
  boundaryEvidence.push({ width, visibleText, visibleIcon, boxes, layout });
  if (width === 320 || width === 420) await page.screenshot({ path: `${outputDirectory}/home-${width}.png`, fullPage: false });
}

assert.deepEqual(pageErrors, []);
const evidence = {
  baseUrl,
  routes: routeEvidence,
  searchRoundTrip: { beforeSearchScroll, restoredScroll, queryless: true },
  menuLinkCloseVerified: true,
  boundaries: boundaryEvidence,
  pageErrors,
};
fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify({ routeCount: routeEvidence.length, boundaries: boundaryEvidence.map(({ width, visibleText, visibleIcon }) => ({ width, visibleText, visibleIcon })), searchRoundTrip: evidence.searchRoundTrip, pageErrors }));
