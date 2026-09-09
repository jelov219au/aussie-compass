import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const dir = process.env.EOFY_UI_DIR;
if (!dir || !process.env.CHROME_PATH) throw Error('Remote browser configuration missing');
const require = createRequire(pathToFileURL(dir + '/package.json'));
const { chromium } = require('playwright-core');
const base = 'http://127.0.0.1:3108';
const results = [], failures = [];
const write = () => fs.writeFileSync(dir + '/home-conversion-review.json', JSON.stringify({ results, failures }, null, 2));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const context = await browser.newContext();
// Record calls locally. No synthetic analytics, checkout or personal inputs reach services.
await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route => route.fulfill({ status: 200, body: '' }));
await context.route('**/api/checkout/**', route => route.abort());
await context.addInitScript(() => {
  window.reviewEvents = [];
  window.va = (command, payload) => {
    if (command === 'beforeSend') window.reviewBeforeSend = payload;
    if (command === 'event') window.reviewEvents.push(payload);
  };
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const go = async (path) => {
  assert.equal((await page.goto(base + path, { waitUntil: 'networkidle' })).status(), 200);
  await page.addStyleTag({ content: 'nextjs-portal { display:none !important; }' });
};
const audit = async () => {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
  assert.deepEqual(violations, []);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
};
try {
  for (const width of [320, 768, 1440]) {
    const record = { width };
    try {
      errors.length = 0;
      await page.setViewportSize({ width, height: 900 });
      await go('/');
      await page.waitForFunction(() => window.reviewEvents.some(e => e.name === 'Home Visit'));
      assert.equal(await page.locator('#route-finder > div > details').getAttribute('open'), null);
      assert.equal(await page.locator('#home-tasks a').filter({ hasText: '중고차 구매 전 확인' }).getAttribute('href'), '/used-car-comparison');
      record.proTop = await page.locator('#pro').evaluate(e => Math.round(e.getBoundingClientRect().top + scrollY));
      assert(record.proTop < 2800, 'default recommendation must no longer push Pro far down the page');
      await audit();
      await page.screenshot({ path: `${dir}/home-conversion-entry-${width}.png` });
      const buttons = page.locator('[data-home-product]');
      assert.equal(await buttons.count(), 6);
      for (let i = 0; i < 6; i++) {
        const button = buttons.nth(i), product = await button.getAttribute('data-home-product');
        await button.focus(); await page.keyboard.press('Enter');
        assert.equal(await button.getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('[data-home-product][aria-pressed="true"]').count(), 1);
        assert((await button.boundingBox()).height >= 44);
        assert((await page.locator('#home-premium-product-panel h3').innerText()).length > 0);
        assert(await page.locator('#home-premium-product-panel a').count() >= 2);
        record[product] = await page.locator('#home-premium-product-panel h3').innerText();
      }
      await buttons.first().click();
      await page.locator('#premium-tools-heading').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => window.reviewEvents.some(e => e.name === 'Home Section Viewed' && e.data.section === 'pro'));
      await page.locator('#pro').screenshot({ path: `${dir}/home-conversion-pro-${width}.png` });
      await audit();
      const events = await page.evaluate(() => window.reviewEvents.filter(e => e.data?.version === 'home-conversion-20260909'));
      assert.equal(events.filter(e => e.name === 'Home Visit').length, 1, 'Strict Mode must not duplicate visits');
      assert.equal(events.filter(e => e.name === 'Home Product Selected').length, 6, 'repeat selection is deduplicated');
      assert(events.every(e => Object.keys(e.data).every(k => ['version','section','product','destination','action'].includes(k))));
      record.events = events;

      const disclosure = page.locator('#route-finder summary').first();
      await disclosure.focus(); await page.keyboard.press('Enter');
      assert(await page.getByRole('radio', { name: '호주에서 생활 중 일·돈·생활 관리' }).isVisible());
      await disclosure.click();
      assert.equal(await page.locator('#route-finder details').first().getAttribute('open'), null);

      await page.getByText('찾는 일이 없나요? 직접 검색하기', { exact: true }).click();
      await page.getByRole('searchbox', { name: '호주 생활 정보 검색' }).fill('중고차');
      await page.getByRole('button', { name: '검색', exact: true }).click();
      await page.waitForURL('**/search');
      await page.getByRole('searchbox').waitFor();
      assert.equal(await page.getByRole('searchbox').inputValue(), '중고차');
      assert.equal(new URL(page.url()).search, '', 'search text must stay out of URLs');
      assert.equal(await page.locator('#search-next-action-heading').innerText(), '호주 중고차 구매처·체크리스트');
      assert.doesNotMatch(await page.locator('main').innerText(), /search_next_action|all_terms|free_tool|hoju_tool|explicit_paid_intent|9개 판정|규칙: 안전 표현/);
      await audit();
      await page.screenshot({ path: `${dir}/home-conversion-search-${width}.png` });
      const recommendation = page.locator('[aria-labelledby="search-next-action-heading"] a').first();
      assert.equal(await recommendation.getAttribute('href'), '/used-car-comparison');
      assert((await recommendation.boundingBox()).height >= 44);
      record.passed = true;
    } catch (error) {
      record.error = error.message; failures.push(record);
      await page.screenshot({ path: `${dir}/home-conversion-failure-${width}.png` }).catch(() => {});
    }
    results.push(record); write(); console.log(JSON.stringify(record));
  }

  // Safe search branches retain official help, zero-result recovery and explicit paid intent.
  await go('/search');
  for (const query of ['불이 났어요', '죽고 싶어요', 'zzzzzzzz', 'Resume Pro']) {
    await page.getByRole('searchbox').fill(query);
    if (query === '불이 났어요' || query === '죽고 싶어요') {
      assert(await page.locator('a[href="tel:000"]').isVisible());
      if (query === '죽고 싶어요') assert(await page.locator('a[href="tel:131114"]').isVisible());
      assert.equal(await page.locator('main a[href="/resume-pro"]').count(), 0);
    } else if (query === 'zzzzzzzz') {
      assert(await page.getByRole('button', { name: '전체 목록 보기', exact: true }).isVisible());
    } else {
      assert.equal(await page.locator('[aria-labelledby="search-next-action-heading"] a').first().getAttribute('href'), '/resume-pro');
    }
    await audit();
  }

  await go('/?stage=live&concern=money#route-finder');
  await page.waitForFunction(() => document.querySelector('#route-finder details')?.open);
  assert(await page.getByRole('radio', { name: '호주에서 생활 중 일·돈·생활 관리' }).isChecked());
  // Corrupt local records must stay intact and their recovery UI must stay reachable.
  await page.evaluate(() => localStorage.setItem('hoju-compass-personal-plan-v1', 'fixture-invalid-preserve'));
  await go('/');
  await page.waitForFunction(() => document.querySelector('#route-finder details')?.open);
  assert.equal(await page.evaluate(() => localStorage.getItem('hoju-compass-personal-plan-v1')), 'fixture-invalid-preserve');
  assert(await page.getByLabel('기존 계획 원문 백업').isVisible());
  await page.evaluate(() => localStorage.removeItem('hoju-compass-personal-plan-v1'));
  await go('/');
  await page.getByRole('link', { name: '완성된 지원서 예시 보기 →', exact: false }).click();
  await page.waitForURL('**/resume-pro?from=home-premium#result-preview-heading');
  assert(await page.locator('#result-preview-heading').isVisible());
  const firstActions = await page.evaluate(() => window.reviewEvents.filter(e => e.name === 'Home First Action'));
  assert.equal(firstActions.length, 1);
  assert.equal(firstActions[0].data.action, 'sample');
  assert.equal((await context.request.get(base + '/downloads/resume-pro-example-editorial.pdf')).status(), 200);

  await page.evaluate(() => sessionStorage.setItem('hoju-compass-internal-review', '1'));
  await go('/');
  assert.equal((await page.evaluate(() => window.reviewEvents.filter(e => e.data?.version === 'home-conversion-20260909'))).length, 0);
  await page.waitForFunction(() => typeof window.reviewBeforeSend === 'function');
  assert.equal(await page.evaluate(() => window.reviewBeforeSend({ type: 'pageview', url: location.href })), null);
  await page.evaluate(() => sessionStorage.removeItem('hoju-compass-internal-review'));
  assert.equal(await page.evaluate(() => window.reviewBeforeSend({ type: 'pageview', url: location.origin + '/search?q=private#private' }).url), base + '/search');
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  results.push({ regressions: 'safety, zero results, explicit Pro, shared plan, corrupt-record preservation, output preview, event privacy and QA exclusion', passed: true });
  write();
} catch (error) {
  failures.push({ error: error.message }); write(); throw error;
} finally { await browser.close(); }
