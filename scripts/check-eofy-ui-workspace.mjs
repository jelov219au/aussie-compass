// Browser review uses only the public fictional fixture and an isolated context.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const qaDirectory = process.env.EOFY_UI_DIR;
if (!qaDirectory || !process.env.CHROME_PATH) throw new Error('EOFY_UI_DIR and CHROME_PATH are required');
const require = createRequire(pathToFileURL(qaDirectory + '/package.json'));
const { chromium } = require('playwright-core');
const fixture = JSON.parse(fs.readFileSync(qaDirectory + '/eofy-fixture.json', 'utf8')), draft = fixture.draft, base = 'http://127.0.0.1:3108', key = 'hoju-compass-eofy-pro-v1';
const normalise = value => value.replace(/\r\n/g, '\n');
const withoutID = item => Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id'));
const withoutIDs = draft => ({ ...draft, documents: draft.documents?.map(withoutID), expenses: draft.expenses.map(withoutID) });
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH }), results = []; let activePage;
  try {
    for (const width of [390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true });
      await context.route(/\/_vercel\/insights\/|va\.vercel-scripts\.com/, route => route.fulfill({ status: 200, body: '' }));
      const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
      activePage = page; await page.goto(base + '/eofy-pro/workspace');
      await page.waitForFunction(() => document.querySelector('section[aria-label="브라우저 저장 상태"]')?.textContent.includes('현재 작업을 이 브라우저에 저장했습니다.'));
      const progress = page.locator('section[aria-labelledby="eofy-summary-heading"]');
      assert(!(await progress.textContent()).includes('100%'));
      const download = async name => { const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name, exact: true }).click()]); return fs.readFileSync(await file.path(), 'utf8'); };
      let downloads = 0; page.on('download', () => downloads++);
      await page.getByRole('button', { name: 'EOFY 준비 요약 저장', exact: true }).click(); assert.equal(downloads, 0);
      await page.getByRole('combobox', { name: /^회계연도/ }).selectOption(draft.taxYear);
      const income = page.getByRole('region', { name: '소득 자료 준비', exact: true });
      for (const [index, status] of Object.values(draft.incomeStatuses).entries()) await income.locator('li select').nth(index).selectOption(status);
      for (const [index, document] of draft.documents.entries()) {
        await page.getByRole('button', { name: '+ 문서 기록 추가', exact: true }).click(); const field = page.getByRole('group', { name: `문서 ${index + 1}`, exact: true });
        await field.getByRole('combobox', { name: /^소득 종류/ }).selectOption(document.sourceId); await field.getByRole('combobox', { name: /^문서 준비 상태/ }).selectOption(document.status);
        for (const [name, value] of [['고용주·문서 별칭', document.label], ['직접 확인한 날짜', document.checkedOn], ['다음 확인·회계사 질문', document.note]]) await field.getByRole('textbox', { name: new RegExp('^' + name) }).fill(value);
      }
      for (const [index, expense] of draft.expenses.entries()) {
        await page.getByRole('button', { name: '+ 공제 후보 추가', exact: true }).click(); const field = page.getByRole('article', { name: `공제 후보 ${index + 1}`, exact: true });
        await field.getByRole('combobox', { name: /^분류/ }).selectOption(expense.category); await field.getByRole('combobox', { name: /^증빙 상태/ }).selectOption(expense.evidence);
        await field.getByLabel('지출일', { exact: true }).fill(expense.date);
        await field.getByRole('textbox', { name: /^항목 설명/ }).fill(expense.description); await field.getByRole('textbox', { name: /^업무 관련성·계산 메모/ }).fill(expense.note);
        await field.getByRole('spinbutton', { name: '지출 금액 A$', exact: true }).fill(expense.amount); await field.getByRole('spinbutton', { name: '업무 사용 비율 메모 %', exact: true }).fill(expense.workUse);
        await field.getByRole('checkbox').setChecked(expense.reimbursed);
      }
      for (const question of draft.questions) { await page.getByRole('textbox', { name: '질문', exact: true }).fill(question); await page.keyboard.press('Enter'); }
      await page.getByRole('button', { name: '현재 기록 검토 확인', exact: true }).focus(); await page.keyboard.press('Enter');
      const txt = await download('EOFY 준비 요약 저장'), backup = await download('현재 연도 JSON 백업');
      assert.equal(normalise(txt), normalise(fixture.summary)); assert.deepEqual(withoutIDs(JSON.parse(backup).draft), withoutIDs(draft));
      await page.waitForFunction(() => document.querySelector('section[aria-label="브라우저 저장 상태"]')?.textContent.includes('현재 작업을 이 브라우저에 저장했습니다.'));
      await page.reload(); await page.getByRole('group', { name: '문서 2', exact: true }).waitFor();
      assert(await page.getByRole('button', { name: '현재 기록 검토 확인', exact: true }).isVisible());
      const label = page.getByRole('group', { name: '문서 1', exact: true }).getByRole('textbox', { name: /^고용주·문서 별칭/ }); await label.fill('가상 미복원 변경');
      const upload = () => page.locator('input[type=file]').setInputFiles({ name: 'fictional-eofy.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
      await upload(); const replace = page.getByRole('button', { name: '검토한 백업으로 교체', exact: true }); await replace.waitFor(); assert.equal(await label.inputValue(), '가상 미복원 변경');
      await page.getByRole('button', { name: '취소', exact: true }).click(); assert.equal(await label.inputValue(), '가상 미복원 변경');
      await upload(); await replace.click(); assert.equal(await label.inputValue(), draft.documents[0].label);
      await page.getByRole('button', { name: '현재 기록 검토 확인', exact: true }).click(); assert.equal(normalise(await download('EOFY 준비 요약 저장')), normalise(txt));
      await label.fill('가상 검토 만료 확인'); assert(await page.getByRole('button', { name: '현재 기록 검토 확인', exact: true }).isVisible());
      await label.fill(draft.documents[0].label); await page.getByRole('button', { name: /^현재 기록 검토/ }).click();
      await context.setOffline(true); assert.equal(normalise(await download('EOFY 준비 요약 저장')), normalise(txt)); await context.setOffline(false);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const axe = await page.evaluate(async () => axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
      assert.deepEqual(axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), []);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(await page.locator('main button,main select,main textarea,main input:not([type=file])').evaluateAll(nodes => nodes.filter(node => { const target = node.type === 'checkbox' ? node.closest('label') : node, rect = target.getBoundingClientRect(); return rect.width > 0 && (rect.height < 44 || rect.width < 44); }).map(node => [node.tagName, node.getAttribute('aria-label') || node.closest('label')?.textContent])), []);
      await progress.scrollIntoViewIfNeeded(); await page.screenshot({ path: qaDirectory + `/eofy-workspace-${width}.png` });
      await page.evaluate(() => localStorage.setItem('hoju-compass-leaving-pro-v1', 'fictional-sentinel'));
      await page.goto(base + '/eofy-pro?access=released'); await page.getByRole('link', { name: 'EOFY 로컬 기록 삭제', exact: true }).click();
      const deletion = page.locator('article').filter({ has: page.locator('#eofy-delete-heading') }); await deletion.getByRole('checkbox').check(); await deletion.getByRole('button', { name: 'EOFY 기록 삭제', exact: true }).click();
      assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null); assert.equal(await page.evaluate(() => localStorage.getItem('hoju-compass-leaving-pro-v1')), 'fictional-sentinel');
      assert.deepEqual(errors, []); results.push({ width, actualInput: true, TXTMatchesPublic: true, JSONMatchesPublic: true, reload: true, reviewInvalidates: true, restoreAndCancel: true, loadedOfflineExport: true, deletionIsolation: true, axe: 0, overflow: false, runtime: errors }); console.log(results.at(-1)); await context.close();
    }
    fs.writeFileSync(qaDirectory + '/eofy-workspace-local.json', JSON.stringify(results, null, 2));
  } catch (error) { fs.writeFileSync(qaDirectory + '/eofy-workspace-partial.json', JSON.stringify({ completed: results, error: error.message }, null, 2)); if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: qaDirectory + '/eofy-workspace-failure.png' }).catch(() => {}); throw error; } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
