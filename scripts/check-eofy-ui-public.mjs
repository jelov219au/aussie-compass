// Browser review uses only the public fictional fixture and an isolated context.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const qaDirectory = process.env.EOFY_UI_DIR;
if (!qaDirectory || !process.env.CHROME_PATH) throw new Error('EOFY_UI_DIR and CHROME_PATH are required');
const require = createRequire(pathToFileURL(qaDirectory + '/package.json'));
const { chromium } = require('playwright-core');
const base = process.env.BASE_URL || 'http://127.0.0.1:3108', live = base.startsWith('https:'), fixture = JSON.parse(fs.readFileSync(qaDirectory + '/eofy-fixture.json', 'utf8'));
const normalise = value => value.replace(/\r\n/g, '\n');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH }), results = []; let activePage;
  try {
    for (const width of [320, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true });
      await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route => route.fulfill({ status: 200, body: '' }));
      const page = await context.newPage(), errors = []; let posts = 0;
      page.on('pageerror', error => errors.push(error.message)); page.on('request', request => { if (request.method() === 'POST') posts++; });
      activePage = page; await page.goto(base + '/eofy-pro');
      const panel = page.locator('#eofy-output-preview'); await panel.waitFor();
      const storedBefore = await page.evaluate(() => JSON.stringify(localStorage));
      const summary = panel.locator('summary'); await summary.focus(); await page.keyboard.press('Enter');
      const pre = panel.getByLabel('가상 EOFY 전달본 전체 TXT', { exact: true });
      assert.equal(normalise(await pre.textContent()), normalise(fixture.summary));
      await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '가상 EOFY 전달본 전체 TXT');
      await page.keyboard.press('PageDown'); await page.waitForFunction(() => document.querySelector('[aria-label="가상 EOFY 전달본 전체 TXT"]').scrollTop > 0);
      const download = async name => { const [file] = await Promise.all([page.waitForEvent('download'), panel.getByRole('link', { name, exact: true }).click()]); return fs.readFileSync(await file.path(), 'utf8'); };
      assert.equal(normalise(await download('가상 전달 요약 TXT 보기·저장')), normalise(fixture.summary));
      assert.deepEqual(JSON.parse(await download('같은 가상 기록의 JSON 백업 보기·저장')), fixture.archive);
      assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), storedBefore);
      const form = page.locator('form[action="/api/checkout/eofy-pro"]');
      if (await form.count()) {
        assert(await form.evaluate(node => Boolean(document.querySelector('#eofy-output-preview').compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)));
        assert(await form.getByRole('button').isDisabled()); await form.getByRole('checkbox').check(); assert(await form.getByRole('button').isEnabled()); await form.getByRole('checkbox').uncheck();
      }
      const comparison = page.locator('summary').filter({ hasText: '기능·무료 도구와의 비교 자세히 보기' });
      await comparison.focus(); await page.keyboard.press('Enter'); assert(await page.getByRole('table').isVisible());
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const axe = await page.evaluate(async () => axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
      assert.deepEqual(axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), []);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(await panel.locator('a,summary').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().height < 44).map(node => node.textContent)), []);
      await comparison.click(); await summary.click(); await panel.scrollIntoViewIfNeeded();
      await page.screenshot({ path: qaDirectory + `/eofy-${live ? 'live' : 'local'}-${width}.png` });
      assert.equal(posts, 0); assert.deepEqual(errors, []);
      results.push({ width, actualTXT: true, actualJSON: true, keyboard: true, comparison: true, storageWrites: 0, POST: 0, axe: 0, overflow: false, runtime: errors, checkoutPresent: !!await form.count() });
      console.log(results.at(-1)); await context.close();
    }
    fs.writeFileSync(qaDirectory + `/eofy-public-${live ? 'live' : 'local'}.json`, JSON.stringify(results, null, 2));
  } catch (error) { fs.writeFileSync(qaDirectory + '/eofy-public-partial.json', JSON.stringify({ completed: results, error: error.message }, null, 2)); if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: qaDirectory + '/eofy-public-failure.png' }).catch(() => {}); throw error; } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
