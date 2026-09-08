// Scoped remote review of the new public article and its existing checklist CTA.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const dir = process.env.EOFY_UI_DIR;
if (!dir || !process.env.CHROME_PATH) throw Error('Remote browser review configuration missing');
const require = createRequire(pathToFileURL(dir + '/package.json'));
const { chromium } = require('playwright-core');
const route = '/resources/nsw-share-room-comparison-four-checks';
const base = 'http://127.0.0.1:3108';
const results = [], failures = [], discovery = [];
const write = () => fs.writeFileSync(dir + '/share-room-review.json', JSON.stringify({ results, failures, discovery }, null, 2));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, request => request.fulfill({ status: 200, body: '' }));
  await context.route('**/api/checkout/**', request => request.abort('blockedbyclient'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 768, 1440]) {
    const record = { width, route };
    try {
      errors.length = 0;
      await page.setViewportSize({ width, height: 900 });
      assert.equal((await page.goto(base + route, { waitUntil: 'networkidle' })).status(), 200);
      // Development chrome is not part of the public page or its screenshots.
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      assert.equal(await page.locator('main h1').count(), 1);
      record.h1 = await page.locator('main h1').innerText();
      record.title = await page.title();
      assert(record.h1.includes('NSW 쉐어 방 두 개'));
      assert(record.title.includes(record.h1));
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://hojucompass.com' + route);
      const articleSchema = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).find(data => data['@type'] === 'Article'));
      assert.equal(articleSchema.datePublished, '2026-09-09');
      record.headings = await page.locator('#article-body h2').allInnerTexts();
      assert.equal(record.headings.length, 5);
      assert(['관계:', '비용:', '상태:', '미확인:'].every(label => record.headings.some(heading => heading.startsWith(label))));
      record.sources = await page.locator('section:has(> h2#article-sources) a[href^="https://"]').evaluateAll(links => links.map(link => link.href));
      assert.equal(record.sources.length, 2);
      assert(record.sources.every(url => new URL(url).hostname === 'www.nsw.gov.au'));
      assert.equal(await page.locator('main iframe, main a[href*="youtube.com/watch"], main a[href*="youtu.be/"]').count(), 0, 'no unpublished video link');
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      record.axe = await page.evaluate(async () => (await axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
      record.documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert(record.documentWidth <= width);
      assert.deepEqual(record.axe, []);
      await page.screenshot({ path: `${dir}/share-room-entry-${width}.png` });
      await page.locator('#article-body > section').nth(3).screenshot({ path: `${dir}/share-room-condition-${width}.png` });
      const checklist = page.getByRole('link', { name: '집 보러가기 체크리스트 열기', exact: true }).first();
      assert.equal(await checklist.getAttribute('href'), '/property-inspection-checklist');
      assert((await checklist.boundingBox()).height >= 44);
      await checklist.focus(); await page.keyboard.press('Enter');
      await page.waitForURL('**/property-inspection-checklist');
      assert(await page.locator('main h1').isVisible());
      record.checklistUrl = new URL(page.url()).pathname;
      record.runtime = [...errors];
      assert.deepEqual(record.runtime, []);
      record.passed = true;
    } catch (error) {
      record.error = error.message; failures.push({ width, error: error.message });
      await page.screenshot({ path: `${dir}/share-room-failure-${width}.png` }).catch(() => {});
    }
    results.push(record); write(); console.log(JSON.stringify(record));
  }
  for (const path of ['/', '/resources', '/sitemap.xml']) {
    const response = await context.request.get(base + path);
    assert.equal(response.status(), 200);
    assert((await response.text()).includes(route), 'new article discoverable from ' + path);
    discovery.push({ path, passed: true }); write();
  }
  assert.deepEqual(failures, []);
} finally { await browser.close(); }
