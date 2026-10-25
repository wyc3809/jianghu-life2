const { chromium } = require('playwright');
const { start } = require('./start.cjs');
const out = process.argv[2];
const builds = { before: 'http://127.0.0.1:5191/', after: 'http://127.0.0.1:5192/' };
const log = {};
const meta = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('jianghu_ancestry_v1')));
const life = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('jianghu_life_v1_ls')).state);
async function step(tag, name, fn) { try { await fn(); } catch (e) { (log[tag] ??= []).push(`${name}: ${String(e).split('\n')[0]}`); } }
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  for (const [tag, url] of Object.entries(builds)) {
    // 1 故人事件
    { const { c, p, errs } = await start(b, url, 'arc');
      await step(tag, 'arc-open', async () => { await p.screenshot({ path: `${out}/${tag}-arc-1.png` }); });
      await step(tag, 'arc-go', async () => { await p.getByRole('button', { name: /推門進去/ }).first().click(); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${tag}-arc-2.png` }); const s = await life(p); (log[tag+'-data'] ??= {}).arc = { combat: Boolean(s.pendingCombat), beat: s.lifeArc?.beat, monthsLeft: s.lifeArc?.monthsLeft }; });
      (log[tag+'-errors'] ??= []).push(...errs); await c.close(); }
    // 2 主存檔
    { const { c, p, errs } = await start(b, url, 'main');
      const nav = (n) => p.locator('nav button').filter({ hasText: n }).first();
      await step(tag, 'practice', async () => { await nav('修煉').click(); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${tag}-practice.png`, fullPage: true }); });
      await step(tag, 'person', async () => { await nav('人物').click(); await p.waitForTimeout(800); await p.getByText('修為', { exact: true }).first().click(); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${tag}-cultivation.png`, fullPage: true }); });
      await step(tag, 'breakthrough', async () => { await p.getByRole('button', { name: '閉關突破' }).click(); await p.waitForTimeout(3000); await p.screenshot({ path: `${out}/${tag}-break-fail.png` }); const s = await life(p); (log[tag+'-data'] ??= {}).break = { tier: s.character.cultivation.tier, xp: s.character.cultivation.xp }; });
      (log[tag+'-errors'] ??= []).push(...errs); await c.close(); }
    // 3 秘笈閣
    { const { c, p, errs } = await start(b, url, 'main');
      await step(tag, 'codex', async () => { await p.locator('nav button').filter({ hasText: '秘笈閣' }).first().click(); await p.waitForTimeout(1500);
        const plus = p.locator('.ink-codex-wallet button');
        await plus.click(); await p.waitForTimeout(300);
        if (await plus.isEnabled()) await plus.click(); await p.waitForTimeout(300);
        await p.screenshot({ path: `${out}/${tag}-jade.png` });
        (log[tag+'-data'] ??= {}).jade = (await meta(p)).jade; });
      await step(tag, 'shelf', async () => { await p.getByRole('button', { name: /^家族收藏/ }).click(); await p.waitForTimeout(800); await p.locator('.ink-pages').last().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/${tag}-shelf.png` }); });
      (log[tag+'-errors'] ??= []).push(...errs); await c.close(); }
  }
  await b.close();
  console.log(JSON.stringify(log, null, 1));
})();
