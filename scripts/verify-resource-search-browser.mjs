import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const playwrightPath = "C:/Users/jelov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const outputDirectory = "outputs/night-20260905/resource-search-web51";
fs.mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
await page.addInitScript(() => {
  localStorage.setItem("aussie-compass-read-articles-v1", JSON.stringify([{
    href: "/resources/australia-rental-moving-out-bond-refund-guide",
    title: "호주 렌트 퇴거, Final inspection부터 Bond 반환까지",
    completedAt: "2026-09-05T00:00:00.000Z",
  }]));
});
await page.goto(`${baseUrl}/resources`, { waitUntil: "networkidle" });

const input = page.locator("#resource-search");
const resultLinks = page.locator('section[aria-labelledby="resource-directory-heading"] ol[aria-label="실용 자료 목록"] > li > a');
const resultCount = page.locator('section[aria-labelledby="resource-directory-heading"] [aria-live="polite"]');
const cases = [
  ["급여가 적게 들어왔어요", "/resources/first-payslip-checklist-australia"],
  ["보증금을 못 받았어요", "/resources/australia-rental-moving-out-bond-refund-guide"],
  ["중고차 검사 뒤 수리 약속", "/resources/used-car-inspection-report-next-steps"],
  ["비자 신체검사 예약이 늦어요", "/visa-preparation-guide"],
  ["호주 떠나기 전에 해야 할 일", "/leaving-australia-guide"],
];
const browserCases = [];
for (const [query, expectedHref] of cases) {
  await input.fill(query);
  await page.waitForTimeout(80);
  const href = await resultLinks.first().getAttribute("href");
  assert.equal(href, expectedHref, `unexpected first browser result for ${query}`);
  browserCases.push({ query, firstHref: href, countText: (await resultCount.textContent())?.trim() });
}

await input.fill("");
await page.getByRole("button", { name: "집·차", exact: true }).click();
await page.getByRole("button", { name: "NSW · 시드니", exact: false }).click();
await input.focus();
await page.keyboard.type("DASP");
await page.waitForTimeout(80);
assert.equal(await resultLinks.count(), 0);
const zeroStateText = await page.locator('section[aria-labelledby="resource-directory-heading"]').textContent();
for (const label of ["적용 중: 주제 집·차", "지역 NSW · 시드니", "검색 “DASP”", "검색만 지우기", "지역만 전체", "모든 필터 초기화"]) {
  assert.ok(zeroStateText?.includes(label), `zero state missing ${label}`);
}

await page.getByRole("button", { name: "검색만 지우기", exact: true }).click();
assert.equal(await input.inputValue(), "");
assert.ok((await resultLinks.count()) > 0, "clearing only search should preserve usable filtered results");
assert.equal(await page.getByRole("button", { name: "집·차", exact: true }).getAttribute("aria-pressed"), "true");
assert.equal(await page.getByRole("button", { name: "NSW · 시드니", exact: false }).getAttribute("aria-pressed"), "true");

await input.fill("DASP");
await page.getByRole("button", { name: "지역만 전체", exact: true }).click();
assert.equal(await input.inputValue(), "DASP");
assert.equal(await page.getByRole("button", { name: "집·차", exact: true }).getAttribute("aria-pressed"), "true");
assert.equal(await page.getByRole("button", { name: /^전체 37$/ }).getAttribute("aria-pressed"), "true");
assert.equal(await resultLinks.count(), 0, "topic filter should still exclude the DASP guide");
await page.getByRole("button", { name: "모든 필터 초기화", exact: true }).click();
assert.equal(await input.inputValue(), "");
assert.equal(await resultLinks.count(), 37);

await input.fill("Bond");
await page.waitForTimeout(80);
assert.ok((await resultLinks.first().textContent())?.includes("✓ 읽어본 글"), "read badge must survive search ranking");

const featuredSection = page.locator("#new-life-tips-heading").locator("xpath=ancestor::section");
const featuredLinks = featuredSection.locator("ol > li > a");
assert.equal(await featuredLinks.count(), 4);
const featured = await featuredLinks.evaluateAll((links) => links.map((link) => ({
  href: link.getAttribute("href"),
  text: link.textContent?.replace(/\s+/g, " ").trim(),
})));
for (const item of featured) {
  assert.ok(item.href?.startsWith("/resources/"));
  assert.match(item.text ?? "", /(수정|발행) \d{4}-\d{2}-\d{2}/);
}
assert.ok((await featuredSection.textContent())?.includes("최근 확인·수정한 자료"));
assert.ok((await featuredSection.textContent())?.includes("다음 행동을 정하는 데 도움이 되는 정보"));

await input.fill("중고차 검사 뒤 수리 약속");
await page.waitForTimeout(80);
await page.screenshot({ path: `${outputDirectory}/resources-320.png`, fullPage: true });
const evidence = {
  baseUrl,
  viewport: { width: 320, height: 900 },
  naturalLanguageCases: browserCases,
  zeroState: { labelsVerified: true, partialResetVerified: true },
  readBadgePreserved: true,
  featured,
  keyboardInputVerified: true,
  ariaLiveText: (await resultCount.textContent())?.trim(),
  pageErrors,
};
fs.writeFileSync(`${outputDirectory}/browser-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
assert.deepEqual(pageErrors, []);
await browser.close();
console.log(JSON.stringify(evidence));
