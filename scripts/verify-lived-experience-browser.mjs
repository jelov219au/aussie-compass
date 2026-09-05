import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const outputDirectory = "outputs/night-20260905/lived-experience-web52";
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
await page.goto(`${baseUrl}/resources`, { waitUntil: "networkidle" });

const section = page.locator("#lived-experience-guides");
await section.scrollIntoViewIfNeeded();
const heading = section.getByRole("heading", { level: 2 });
assert.equal((await heading.textContent())?.trim(), "처음 정착할 때 자주 막히는 네 장면");
const pageHeadings = await page.locator("main h1, main h2, main h3").evaluateAll((nodes) => nodes.map((node) => ({ level: Number(node.tagName.slice(1)), text: node.textContent?.trim() })));
assert.equal(pageHeadings[0]?.level, 1);
assert.ok(pageHeadings.some((item) => item.level === 2 && item.text === "처음 정착할 때 자주 막히는 네 장면"));
for (let index = 1; index < pageHeadings.length; index += 1) {
  assert.ok(pageHeadings[index].level <= pageHeadings[index - 1].level + 1, `heading level jumps near ${pageHeadings[index].text}`);
}

const links = section.locator("ol > li > a");
assert.equal(await links.count(), 4);
const expectedHrefs = [
  "/resources/australia-arrival-english-clarifying-phrases",
  "/resources/rental-condition-report-bond-first-week-australia",
  "/resources/australia-bank-account-opening-guide",
  "/payslip-guide",
];
const linkEvidence = [];
for (let index = 0; index < expectedHrefs.length; index += 1) {
  const link = links.nth(index);
  assert.equal(await link.getAttribute("href"), expectedHrefs[index]);
  const box = await link.boundingBox();
  assert.ok(box && box.height >= 44 && box.width >= 44, `link ${expectedHrefs[index]} must meet touch target size`);
  const response = await page.request.get(`${baseUrl}${expectedHrefs[index]}`);
  assert.equal(response.status(), 200, `${expectedHrefs[index]} must return HTTP 200`);
  linkEvidence.push({ href: expectedHrefs[index], status: response.status(), width: box.width, height: box.height });
}

await links.first().focus();
assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("href")), expectedHrefs[0]);
await page.keyboard.press("Tab");
assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("href")), expectedHrefs[1]);

const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
assert.ok(layout.scrollWidth <= layout.width, `horizontal overflow: ${JSON.stringify(layout)}`);
assert.deepEqual(pageErrors, []);
await page.screenshot({ path: `${outputDirectory}/resources-lived-guides-320.png`, fullPage: true });

const evidence = {
  baseUrl,
  viewport: { width: 320, height: 900 },
  headingOrderVerified: true,
  keyboardOrderVerified: true,
  linkEvidence,
  layout,
  pageErrors,
};
fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify(evidence));
