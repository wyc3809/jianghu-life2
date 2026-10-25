const { chromium } = require('playwright');
const { start } = require('./start.cjs');
const out = process.argv[2];
const builds = { before: 'http://127.0.0.1:5191/', after: 'http://127.0.0.1:5192/' };
const log = {};
async function step(tag, name, fn) { try { await fn(); } catch (e) { (log[tag] ??= []).push(`${name}: ${String(e).split('\n')[0]}`); } }
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  for (const [tag, url] of Object.entries(builds)) {
    const { c, p, errs } = await start(b, url, 'main');
    const nav = (n) => p.locator('nav button').filter({ hasText: n }).first();
    await step(tag, 'practice', async () => { await nav('修煉').click(); await p.waitForTimeout(800);
      await p.locator('.ink-practice-btn').filter({ hasText: '整裝披掛' }).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      await p.screenshot({ path: `${out}/${tag}-practice-2.png` }); });
    await step(tag, 'sect', async () => { await p.getByText('青雲劍派 · 進入門中').scrollIntoViewIfNeeded(); await p.getByText('青雲劍派 · 進入門中').click(); await p.waitForTimeout(800);
      await p.getByText('山門站隊', { exact: true }).scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
      await p.screenshot({ path: `${out}/${tag}-sect.png` }); });
    await step(tag, 'retire', async () => { await nav('人物').click(); await p.waitForTimeout(800); await p.getByText('修為', { exact: true }).first().click(); await p.waitForTimeout(800);
      await p.getByRole('button', { name: '閉關突破' }).scrollIntoViewIfNeeded(); await p.locator('.ink-play-body').evaluate((e) => { e.scrollTop = e.scrollHeight; }).catch(() => {}); await p.waitForTimeout(300);
      await p.screenshot({ path: `${out}/${tag}-retire.png` }); });
    (log[tag + '-errors'] ??= []).push(...errs); await c.close();
  }
  await b.close(); console.log(JSON.stringify(log));
})();
