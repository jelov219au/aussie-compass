import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4320";
const outputDirectory = "outputs/night-20260905/home-order-phrases-web54";
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
const viewportEvidence = [];

for (const width of [320, 1280]) {
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  const sections = {
    hero: page.locator("main > section").first(),
    tools: page.locator("#tools"),
    route: page.locator("#route-finder"),
    returning: page.locator('section[aria-label="저장한 작업 이어가기"]'),
    install: page.locator('section[aria-label="홈 화면에 추가 안내"]'),
  };
  const positions = {};
  for (const [name, locator] of Object.entries(sections)) {
    positions[name] = await locator.evaluate((node) => node.getBoundingClientRect().top + scrollY);
  }
  assert.ok(positions.hero < positions.tools && positions.tools < positions.route && positions.route < positions.returning && positions.returning < positions.install, `${width}px home sections are out of order: ${JSON.stringify(positions)}`);

  const headings = await page.locator("main h1, main h2, main h3").evaluateAll((nodes) => nodes.map((node) => ({ level: Number(node.tagName.slice(1)), text: node.textContent?.trim() })));
  assert.equal(headings[0]?.level, 1);
  for (let index = 1; index < headings.length; index += 1) assert.ok(headings[index].level <= headings[index - 1].level + 1, `heading jump near ${headings[index].text}`);

  const heroToolsLink = sections.hero.locator('a[href="/tools"]').last();
  await heroToolsLink.focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.closest("section")?.id), "tools", "tab order after Hero must enter ToolsSection");
  const lastToolsLink = sections.tools.locator("a").last();
  await lastToolsLink.focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.closest("section")?.id), "route-finder", "tab order after ToolsSection must enter route finder");

  const installLink = sections.install.locator('a[href="/install"]');
  const installBox = await installLink.boundingBox();
  assert.ok(installBox && installBox.width >= 44 && installBox.height >= 44);
  const installResponse = await page.request.get(`${baseUrl}/install`);
  assert.equal(installResponse.status(), 200);
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.equal(layout.scrollWidth, layout.width);
  viewportEvidence.push({ width, positions, headingCount: headings.length, installBox, installStatus: installResponse.status(), layout });
  await page.screenshot({ path: `${outputDirectory}/home-${width}.png`, fullPage: true });
}

await page.setViewportSize({ width: 320, height: 900 });
await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
const phraseCta = page.locator('#tools a[href="/english-phrase-cards"]');
assert.ok((await phraseCta.textContent())?.includes("상황별 30개 문장 보기"));
await phraseCta.click();
await page.waitForURL(`${baseUrl}/english-phrase-cards`);
assert.ok((await page.locator("main").textContent())?.includes("전체 30개 문장"));
await page.getByRole("button", { name: "전체 문장", exact: true }).click();
assert.equal((await page.locator("#phrase-card-heading").locator("xpath=ancestor::section").locator("ol > li").count()), 30);
assert.ok((await page.locator("#phrase-card-heading").locator("xpath=ancestor::section").textContent())?.includes("30 phrases"));

await page.goto(`${baseUrl}/tools`, { waitUntil: "networkidle" });
const toolsPhraseCard = page.locator('main a[href="/english-phrase-cards"]').first();
assert.ok((await toolsPhraseCard.textContent())?.includes("상황별 30개 문장"));
assert.deepEqual(pageErrors, []);

const evidence = {
  baseUrl,
  sourcePhraseCount: 30,
  viewportEvidence,
  homePhraseCta: "상황별 30개 문장 보기",
  phrasePageOverall: "전체 30개 문장",
  renderedAllPhraseCards: 30,
  toolsFeature: "상황별 30개 문장",
  pageErrors,
};
fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify({ viewports: viewportEvidence.map(({ width, positions }) => ({ width, positions })), phraseCount: 30, pageErrors }));
