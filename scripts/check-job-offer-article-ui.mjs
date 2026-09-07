// Remote public-article acceptance: preserve prior warnings and recovery routes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const dir = process.env.EOFY_UI_DIR;
if (!dir || !process.env.CHROME_PATH) throw Error('Remote browser review configuration missing');
const require = createRequire(pathToFileURL(dir + '/package.json'));
const { chromium } = require('playwright-core');
const route = '/resources/australia-job-scam-red-flags';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const results = [], failures = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route => route.fulfill({ status: 200, body: '' }));
  await context.route('**/api/checkout/**', route => route.abort('blockedbyclient'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const warnings = () => page.locator('#article-body > section').filter({ has: page.getByRole('heading', { name: '가짜 채용 제안에서 자주 보이는 신호', exact: true }) }).locator('li');
  const sources = () => page.locator('section:has(> h2#article-sources) a[href^="https://"]');
  assert.equal((await page.goto('https://hojucompass.com' + route, { waitUntil: 'networkidle' })).status(), 200);
  const baseline = { warnings: await warnings().allTextContents(), sources: await sources().evaluateAll(nodes => nodes.map(node => node.href)) };
  assert.equal(baseline.warnings.length, 8);
  assert(baseline.sources.length >= 5);
  for (const width of [320, 768, 1440]) {
    const record = { route, width };
    try {
      errors.length = 0;
      await page.setViewportSize({ width, height: 900 });
      assert.equal((await page.goto('http://127.0.0.1:3108' + route, { waitUntil: 'networkidle' })).status(), 200);
      assert.equal(await page.locator('main h1').count(), 1);
      record.title = await page.title();
      record.h1 = await page.locator('main h1').innerText();
      assert.equal(record.h1, '호주 구직 제안이 진짜인지 확인하는 방법');
      // Capture the fresh entry before testing animated contents navigation.
      await page.waitForFunction(() => scrollY === 0);
      await page.screenshot({ path: `${dir}/job-offer-heading-${width}.png` });
      assert(record.title.includes('송금·신분증 전 점검'));
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://hojucompass.com' + route);
      const articleSchema = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).find(data => data['@type'] === 'Article'));
      assert.equal(articleSchema.datePublished, '2026-08-16');
      assert.equal(articleSchema.dateModified, '2026-09-08');
      assert.deepEqual(await warnings().allTextContents(), baseline.warnings);
      record.sources = await sources().evaluateAll(nodes => nodes.map(node => node.href));
      for (const source of baseline.sources) assert(record.sources.includes(source), 'existing source preserved');
      assert(record.sources.includes('https://www.cyber.gov.au/report-and-recover/report'));
      assert(record.sources.includes('https://www.idcare.org/'));
      const body = await page.locator('#article-body').innerText();
      assert(!/비공개|Instagram|통합용 메타데이터|개발 인계|##|\*\*/.test(body));
      for (const text of ['의심스러운 원래 메시지에는 답장하지 마세요', 'OTP·인증 코드', 'CVV', '기록 정리보다 은행', '신고가 돈의 반환이나 특정 결과를 보장하지는 않습니다']) assert(body.includes(text));
      for (const name of ['확신이 없을 때는 독립적으로 찾은 공식 연락처에 확인하세요', '이미 보냈다면 추가 피해를 막는 조치부터 하세요']) {
        const link = page.getByRole('navigation', { name: '이 글의 목차', exact: true }).getByRole('link', { name: new RegExp(name) });
        await link.click();
        assert.equal(new URL(page.url()).hash, await link.getAttribute('href'));
      }
      const help = page.locator('main a[href="/help-directory"]');
      assert.equal(await help.count(), 1);
      assert((await help.boundingBox()).height >= 44);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      record.axe = await page.evaluate(async () => (await axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
      assert.deepEqual(record.axe, []);
      assert((await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
      assert.deepEqual(errors, []);
      await page.getByRole('heading', { name: '이미 보냈다면 추가 피해를 막는 조치부터 하세요', exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${dir}/job-offer-recovery-${width}.png` });
      await help.click(); await page.waitForURL('**/help-directory');
      assert(await page.locator('main h1').isVisible());
      record.passed = true;
    } catch (error) {
      record.error = error.message; failures.push({ width, error: error.message });
      await page.screenshot({ path: `${dir}/failure-job-offer-${width}.png` }).catch(() => {});
    }
    results.push(record);
    fs.writeFileSync(dir + '/job-offer-review.json', JSON.stringify({ baseline, results, failures }, null, 2));
    console.log(JSON.stringify(record));
  }
  assert.deepEqual(failures, []);
} finally { await browser.close(); }
