import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4325";
const articlePath = "/resources/used-car-inspection-report-next-steps";
const freeToolHref = "/used-car-comparison#vehicle-comparison-heading";
const outputDirectory = "outputs/night-20260905/used-car-inspection-article-web59";
fs.mkdirSync(outputDirectory, { recursive: true });

const response = await fetch(`${baseUrl}${articlePath}`);
assert.equal(response.status, 200);
const html = await response.text();
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const quickSummaryMarkup = html.match(/<section[^>]+aria-labelledby="quick-summary-heading"[\s\S]*?<\/section>/)?.[0] ?? "";
const sourcesMarkup = html.match(/<section[^>]+aria-labelledby="article-sources"[\s\S]*?<\/section>/)?.[0] ?? "";
const headerMarkup = [...html.matchAll(/<header[^>]*>[\s\S]*?<\/header>/g)]
  .map((match) => match[0])
  .find((markup) => markup.includes("무료 후보·비용 비교표 열기")) ?? "";
const endStepMarkup = html.match(/<aside[^>]+aria-labelledby="car-article-next-step"[\s\S]*?<\/aside>/)?.[0] ?? "";
const ssr = {
  status: response.status,
  titleCount: count(html, /<title>/g),
  h1Count: count(html, /<h1(?:\s|>)/g),
  quickSummaryCount: count(quickSummaryMarkup, /<li(?:\s|>)/g),
  sectionCount: count(html, /<section id="section-\d+"/g),
  sourceCount: count(sourcesMarkup, /<li(?:\s|>)/g),
  headerFreeCtaCount: count(headerMarkup, /href="\/used-car-comparison#vehicle-comparison-heading"/g),
  endFreeCtaCount: count(endStepMarkup, /href="\/used-car-comparison#vehicle-comparison-heading"/g),
  carPriceCount: count(html, /A\$\s*\d+(?:\.\d{2})?/g),
  carPurchaseCtaCount: count(html, /href="\/car-purchase-pro\/(?:checkout|workspace|restore|success)[^"]*"/g),
};
assert.deepEqual(ssr, {
  status: 200,
  titleCount: 1,
  h1Count: 1,
  quickSummaryCount: 3,
  sectionCount: 6,
  sourceCount: 3,
  headerFreeCtaCount: 1,
  endFreeCtaCount: 1,
  carPriceCount: 0,
  carPurchaseCtaCount: 0,
});

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(`${baseUrl}${articlePath}`, { waitUntil: "networkidle" });
  const headerCta = page.locator("header").getByRole("link", { name: "무료 후보·비용 비교표 열기", exact: true });
  const shareAction = page.locator("header").getByRole("button", { name: "이 페이지 공유하기", exact: true });
  assert.equal(await headerCta.count(), 1);
  assert.equal(await shareAction.count(), 1);
  const [ctaBox, shareBox] = await Promise.all([headerCta.boundingBox(), shareAction.boundingBox()]);
  assert(ctaBox && shareBox);
  const overlap = !(ctaBox.x + ctaBox.width <= shareBox.x || shareBox.x + shareBox.width <= ctaBox.x || ctaBox.y + ctaBox.height <= shareBox.y || shareBox.y + shareBox.height <= ctaBox.y);
  assert.equal(overlap, false, "header CTA and share action must not overlap");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.equal(overflow, 0);
  await page.screenshot({ path: `${outputDirectory}/article-320.png`, fullPage: true });

  await headerCta.click();
  await page.waitForURL(`${baseUrl}/used-car-comparison#vehicle-comparison-heading`);
  await page.locator("#vehicle-comparison-heading").waitFor();
  assert.equal(await page.getByRole("link", { name: "검사 후 다음 행동 가이드", exact: false }).getAttribute("href"), articlePath);
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForURL(`${baseUrl}${articlePath}`);
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);

  await page.goto(`${baseUrl}/car-purchase-pro`, { waitUntil: "networkidle" });
  assert.equal(await page.getByRole("link", { name: "검사 보고서를 받은 뒤 할 일 읽기", exact: false }).getAttribute("href"), articlePath);

  const evidence = {
    baseUrl,
    viewport: { width: 320, height: 900 },
    ssr,
    mobile: {
      overflow,
      headerCtaHref: freeToolHref,
      shareActionPreserved: true,
      actionsOverlap: overlap,
      destinationHeading: "vehicle-comparison-heading",
      backNavigation: articlePath,
    },
    discoveryLinks: {
      usedCarComparison: articlePath,
      carPurchasePro: articlePath,
    },
    pageErrors,
  };
  assert.deepEqual(pageErrors, []);
  fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence));
} finally {
  await browser.close();
}
