// Isolated remote browser review. No checkout submission or entitlement fixture.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const dir = process.env.EOFY_UI_DIR;
if (!dir || !process.env.CHROME_PATH) throw Error('Remote browser review configuration missing');
const require = createRequire(pathToFileURL(dir + '/package.json'));
const { chromium } = require('playwright-core');
const base = 'http://127.0.0.1:3108';
const routes = [
  '/', '/tools', '/resources', '/pro',
  '/resources/australia-paid-training-opening-closing-work-time',
  '/resources/australia-job-ending-final-pay-dismissal-guide',
  '/resume-pro', '/rental-application-pro', '/pay-evidence-pro', '/eofy-pro', '/leaving-australia-pro',
  '/search', '/my-compass', '/property-inspection-checklist', '/used-car-comparison', '/tax-prep-tracker',
];
const slug = route => route === '/' ? 'home' : route.split('/').at(-1);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const results = [], failures = [], baseline = [];
const write = () => fs.writeFileSync(dir + '/site-design-review.json', JSON.stringify({ baseline, results, failures }, null, 2));
let page;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  // Analytics scripts are optional; prevent audit visits from inflating production traffic.
  await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route => route.fulfill({ status: 200, body: '' }));
  await context.route('**/api/checkout/**', route => route.abort('blockedbyclient'));
  page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Before evidence comes from the existing deployed main, with the same fonts/viewport.
  for (const route of ['/', '/tools', '/resources', '/pro', routes[4], '/resume-pro']) {
    await page.goto('https://hojucompass.com' + route, { waitUntil: 'networkidle' });
    await page.screenshot({ path: dir + '/before-' + slug(route) + '-1440.png' });
    baseline.push({ route, width: 1440, height: await page.evaluate(() => document.documentElement.scrollHeight) });
    if (route === '/') {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.screenshot({ path: dir + '/before-home-320.png' });
      baseline.push({ route, width: 320, height: await page.evaluate(() => document.documentElement.scrollHeight) });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const record = { route, width };
      try {
        errors.length = 0;
        await page.goto(base + route, { waitUntil: 'networkidle' });
        await page.locator('main').waitFor();
        assert.equal(await page.locator('main h1').count(), 1, 'one page heading');
        if (width === 320 && route === '/') {
          const menu = page.getByRole('button', { name: '메뉴 열기', exact: true });
          await menu.focus(); await page.keyboard.press('Enter');
          assert(await page.getByRole('navigation', { name: '모바일 메뉴', exact: true }).isVisible());
          await page.keyboard.press('Escape');
          assert(await menu.evaluate(node => document.activeElement === node));
          assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        }
        if (route === '/') {
          const choices = page.getByRole('group', { name: 'Pro 도구 선택', exact: true }).getByRole('button');
          assert.equal(await choices.count(), 6);
          for (const button of await choices.all()) {
            const name = await button.locator('strong').textContent();
            await button.focus(); await page.keyboard.press('Enter');
            assert.equal(await button.getAttribute('aria-pressed'), 'true');
            assert.equal(await page.locator('#home-premium-product-panel h3').textContent(), name);
            assert.equal(await page.locator('[aria-label="Pro 도구 선택"] > button[aria-pressed="true"]').count(), 1);
          }
          await choices.first().click();
          await page.locator('#pro').scrollIntoViewIfNeeded();
          await page.screenshot({ path: dir + '/after-home-pro-' + width + '.png' });
          assert.equal(await page.locator('[aria-label="바로 시작하는 여섯 상황"] a').count(), 6);
        }
        if (route === '/tools') {
          const field = page.getByRole('searchbox', { name: '도구 검색', exact: true });
          await field.fill('중고차');
          assert(await page.locator('[aria-label="도구 목록"] a[href="/used-car-comparison"]').isVisible());
          await field.fill('zzzz-no-matching-tool');
          assert(await page.getByRole('heading', { name: '검색 결과가 없어요', exact: true }).isVisible());
          await page.getByRole('button', { name: '전체 조건 초기화', exact: true }).click();
          await page.getByRole('button', { name: '취업·급여', exact: true }).click();
          assert.equal(await page.getByRole('button', { name: '취업·급여', exact: true }).getAttribute('aria-pressed'), 'true');
          await page.getByRole('button', { name: '전체', exact: true }).click();
        }
        if (route === '/resources') {
          const field = page.getByRole('searchbox', { name: '자료 검색', exact: true });
          await field.fill('급여'); assert(await page.locator('[aria-label="실용 자료 목록"] a').count() > 0);
          await field.fill('zzzz-no-matching-article');
          assert(await page.getByText('아직 맞는 자료를 찾지 못했어요.', { exact: true }).isVisible());
          await page.getByRole('button', { name: '모든 필터 초기화', exact: true }).click();
          const region = page.getByRole('group', { name: '자료 지역 필터', exact: true }).getByRole('button').nth(1);
          await region.click(); assert.equal(await region.getAttribute('aria-pressed'), 'true');
          await page.getByRole('button', { name: '필터 초기화', exact: true }).click();
        }
        if (route.startsWith('/resources/')) {
          const first = page.getByRole('navigation', { name: '이 글의 목차', exact: true }).getByRole('link').first();
          await first.click(); assert.equal(new URL(page.url()).hash, '#section-1');
          assert(await page.locator('#article-sources').count());
          assert(await page.locator('#article-body > section').count() > 1);
        }
        const forms = page.locator('form[action^="/api/checkout/"]');
        for (const form of await forms.all()) assert(await form.getByRole('button').isDisabled(), 'checkout must start disabled');
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const axe = await page.evaluate(async () => axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
        record.axe = axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }));
        record.layout = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
        record.runtime = [...errors]; record.checkoutForms = await forms.count();
        assert.deepEqual(record.axe, [], 'public-template accessibility');
        assert(record.layout.documentWidth <= width, 'horizontal overflow');
        assert.deepEqual(errors, [], 'runtime errors');
        await page.evaluate(() => scrollTo(0, 0));
        if (width !== 768) await page.screenshot({ path: dir + '/after-' + slug(route) + '-' + width + '.png' });
        if (width === 1440 && route === '/') await page.screenshot({ path: dir + '/after-home-full-1440.png', fullPage: true });
        record.passed = true;
      } catch (error) {
        record.error = error.message;
        failures.push({ route, width, error: error.message });
        await page.screenshot({ path: dir + '/failure-' + slug(route) + '-' + width + '.png' }).catch(() => {});
      }
      results.push(record); write(); console.log(JSON.stringify(record));
    }
  }
  // Verify the existing queryless hand-off end-to-end, with a non-personal test phrase.
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('searchbox', { name: '호주 생활 정보 검색', exact: true }).fill('중고차');
  await page.locator('form').getByRole('button', { name: '검색', exact: true }).click();
  await page.waitForURL(base + '/search');
  await page.waitForFunction(() => document.querySelector('#site-search')?.value === '중고차');
  assert.equal(await page.locator('#site-search').inputValue(), '중고차');
  assert.equal(new URL(page.url()).search, '');
  results.push({ interaction: 'queryless search hand-off', passed: true });
  write(); assert.deepEqual(failures, []);
} finally { await browser.close(); }
