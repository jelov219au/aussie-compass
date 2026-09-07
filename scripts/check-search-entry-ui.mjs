// Bounded remote review of five search-entry routes; no user data or checkout.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const dir = process.env.EOFY_UI_DIR;
if (!dir || !process.env.CHROME_PATH) throw Error('Remote browser review configuration missing');
const require = createRequire(pathToFileURL(dir + '/package.json'));
const { chromium } = require('playwright-core');
const routes = process.env.TAX_SUMMARY_REVIEW === 'true' ? ['/tax-prep-tracker'] : [
  '/resources/australia-job-ending-final-pay-dismissal-guide',
  '/resources/unpaid-trial-shift-australia-guide',
  '/used-car-comparison', '/tax-prep-tracker', '/property-inspection-checklist',
];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const baseline = {}, results = [], failures = [];
const write = () => fs.writeFileSync(dir + '/search-entry-review.json', JSON.stringify({ baseline, results, failures }, null, 2));
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route => route.fulfill({ status: 200, body: '' }));
  await context.route('**/api/checkout/**', route => route.abort('blockedbyclient'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const metadata = () => page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
  }));
  for (const route of routes) {
    assert.equal((await page.goto('https://hojucompass.com' + route, { waitUntil: 'networkidle' })).status(), 200);
    baseline[route] = { metadata: await metadata(), h1: await page.locator('main h1').innerText() };
  }
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const record = { route, width };
      try {
        errors.length = 0;
        assert.equal((await page.goto('http://127.0.0.1:3108' + route, { waitUntil: 'networkidle' })).status(), 200);
        assert.equal(await page.locator('main h1').count(), 1);
        record.metadata = await metadata();
        assert.deepEqual(record.metadata, baseline[route].metadata, 'existing search metadata and canonical preserved');
        assert.equal(record.metadata.canonical, 'https://hojucompass.com' + route);
        record.h1 = await page.locator('main h1').innerText();
        if (route === '/used-car-comparison') {
          assert(record.h1.includes('호주 중고차'));
          const navigation = page.getByRole('navigation', { name: '중고차 구매 단계 바로가기', exact: true });
          assert.equal(await navigation.getByRole('link').count(), 3);
          record.shortcuts = [];
          for (const link of await navigation.getByRole('link').all()) {
            const href = await link.getAttribute('href');
            assert(href.startsWith('#'));
            const target = page.locator(href);
            assert.equal(await target.count(), 1);
            assert((await link.boundingBox()).height >= 44);
            await link.focus(); await page.keyboard.press('Enter');
            await page.waitForFunction(hash => location.hash === hash, href);
            await page.waitForFunction(hash => {
              const box = document.querySelector(hash)?.getBoundingClientRect();
              return box && box.top >= 72 && box.top < innerHeight;
            }, href);
            record.shortcuts.push(href);
          }
        } else if (route === '/tax-prep-tracker') {
          assert(record.h1.includes('택스 리턴 준비 장부'));
          assert(await page.locator('main a[href="/tax-return-guide"]').isVisible());
          assert(await page.locator('#tax-prep-tracker-heading').count());
        } else {
          assert.equal(record.h1, baseline[route].h1);
        }
        if (route === routes[1]) {
          const related = page.locator('main a[href="/resources/australia-paid-training-opening-closing-work-time"]');
          assert.equal(await related.count(), 1);
          assert.equal(await page.locator('main a[href="/underpayment-guide"]').count(), 1);
          assert.equal((await context.request.get('http://127.0.0.1:3108/resources/australia-paid-training-opening-closing-work-time')).status(), 200);
        }
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        record.axe = await page.evaluate(async () => (await axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
        record.documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert(record.documentWidth <= width, 'no horizontal overflow');
        assert.deepEqual(record.axe, []);
        assert.deepEqual(errors, []);
        if (process.env.TAX_SUMMARY_REVIEW === 'true') await page.locator('[aria-describedby="tax-record-summary-note"]').screenshot({ path: `${dir}/tax-summary-cards-${width}.png` });
        if (width !== 768) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
          await page.screenshot({ path: `${dir}/entry-${route.split('/').at(-1)}-${width}.png` });
        }
        record.passed = true;
      } catch (error) {
        record.error = error.message;
        failures.push({ route, width, error: error.message });
        await page.screenshot({ path: `${dir}/failure-entry-${route.split('/').at(-1)}-${width}.png` }).catch(() => {});
      }
      results.push(record); write(); console.log(JSON.stringify(record));
    }
  }
  assert.deepEqual(failures, []);
} finally { await browser.close(); }
