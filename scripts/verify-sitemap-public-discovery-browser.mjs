import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4321";
const outputDirectory = "outputs/night-20260905/sitemap-public-discovery-web55";
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

const sitemapResponse = await page.request.get(`${baseUrl}/sitemap.xml`);
assert.equal(sitemapResponse.status(), 200);
assert.match(sitemapResponse.headers()["content-type"] ?? "", /application\/xml|text\/xml/);
const sitemapXml = await sitemapResponse.text();
const entries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
  loc: match[1].match(/<loc>(.*?)<\/loc>/)?.[1],
  lastmod: match[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
}));
const locations = entries.map(({ loc }) => loc);
assert.equal(entries.length, 88);
assert.equal(new Set(locations).size, 88);
const carUrl = "https://hojucompass.com/car-purchase-pro";
assert.equal(locations.filter((url) => url === carUrl).length, 1);
assert.equal(entries.find(({ loc }) => loc === carUrl)?.lastmod, "2026-09-05");
const expectedSeptemberUrls = ["", "/tools", "/pro", "/privacy", "/terms", "/disclaimer", "/resources", "/car-purchase-pro"].map((route) => `https://hojucompass.com${route}`);
for (const url of expectedSeptemberUrls) assert.equal(entries.find(({ loc }) => loc === url)?.lastmod, "2026-09-05", `${url} must expose its verified date in sitemap.xml`);
assert.equal(entries.find(({ loc }) => loc === "https://hojucompass.com/used-car-comparison")?.lastmod, "2026-08-30");
assert.deepEqual(entries.filter(({ lastmod }) => lastmod === "2026-09-05").map(({ loc }) => loc), expectedSeptemberUrls, "sitemap.xml must not bulk-date unrelated routes");

const excludedFragments = [
  "/search",
  "/my-compass",
  "/car-purchase-pro/workspace",
  "/car-purchase-pro/restore",
  "/car-purchase-pro/success",
  "/car-purchase-pro/checkout",
  "/car-purchase-pro/report",
  "/api/",
];
for (const fragment of excludedFragments) assert.ok(!locations.some((url) => url?.includes(fragment)), `${fragment} leaked into sitemap.xml`);

const carResponse = await page.goto(`${baseUrl}/car-purchase-pro`, { waitUntil: "networkidle" });
assert.equal(carResponse?.status(), 200);
assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), carUrl);
assert.ok((await page.locator("h1").textContent())?.includes("확인한 기록으로 남기세요"));

const noindexEvidence = [];
for (const route of ["/search", "/car-purchase-pro/restore", "/car-purchase-pro/success", "/car-purchase-pro/workspace"]) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  const robots = (await page.locator('meta[name="robots"]').getAttribute("content")) ?? "";
  assert.match(robots.toLowerCase(), /noindex/);
  noindexEvidence.push({ route, finalUrl: page.url(), status: response?.status(), robots });
}

const robotsResponse = await page.request.get(`${baseUrl}/robots.txt`);
assert.equal(robotsResponse.status(), 200);
const robotsText = await robotsResponse.text();
assert.match(robotsText, /Disallow: \/api\//);
assert.match(robotsText, /Disallow: \/search/);
assert.match(robotsText, /Sitemap: https:\/\/hojucompass\.com\/sitemap\.xml/);
assert.deepEqual(pageErrors, []);

const evidence = {
  baseUrl,
  sitemap: { status: sitemapResponse.status(), contentType: sitemapResponse.headers()["content-type"], total: entries.length, unique: new Set(locations).size },
  car: { status: carResponse?.status(), canonical: carUrl, occurrences: locations.filter((url) => url === carUrl).length, lastmod: entries.find(({ loc }) => loc === carUrl)?.lastmod },
  lastmod: { septemberUrls: expectedSeptemberUrls, usedCarComparison: "2026-08-30", unrelatedSeptemberUrls: [] },
  excludedFragments,
  noindexEvidence,
  robots: { status: robotsResponse.status(), apiDisallow: true, searchDisallow: true },
  pageErrors,
};
fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(evidence));
