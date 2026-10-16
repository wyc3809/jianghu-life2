// 真實主頁：固定頂欄／任務／導航，工具列收放後仍然完整顯示。
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out = 'production/qa/evidence/redesign/fixed-home-viewport';
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], layouts: [], errors: [] };
function check(pass, name) {
  report.checks.push({ name, pass: Boolean(pass) });
  fs.writeFileSync(`${out}/browser-qa.json`, JSON.stringify(report, null, 2));
  if (!pass) throw Error(name);
}
async function seed(page, port = '5177') {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const app = await (await fetch('/src/App.tsx')).text();
    const path = app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];
    const { useLifeStore } = await import(path);
    const main = await (await fetch('/src/main.tsx')).text();
    const ancestryPath = main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1];
    const { useAncestryStore } = await import(ancestryPath);
    const { createNewLife } = await import('/core/life/gameState.ts');
    const s = createNewLife({ seed: 42, name: '黃青雲', skipCoach: true });
    s.phase = 'playing'; s.pending = null; s.tab = 'home';
    const c = s.character;
    c.flags.newbie_done = true; c.flags.coach_done = true; c.flags.spar_stage = 2;
    c.flags.idle_silver = 312; c.money = 122; c.maxHealth = 366; c.health = 351;
    c.maxQi = 238; c.qi = 238; c.cultivation.tier = 1; c.cultivation.xp = 383;
    useLifeStore.setState({ state: s, lastResult: null, combatReplay: null, flashLines: [], sealText: null });
    const meta = structuredClone(useAncestryStore.getState().meta);
    meta.jade = { free: 40, paidTest: 0 }; meta.encounter = undefined;
    useAncestryStore.setState({ meta, jadeToast: 0, milestoneToast: [] });
    window.qaLifeStore = useLifeStore; window.qaAncestryStore = useAncestryStore;
  });
  await page.locator('.ink-home-scene').waitFor();
  await page.waitForFunction(() => window.__sparStage && document.querySelector('.ink-home-scene canvas')?.height > 0);
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.qaAncestryStore.getState().clearJadeToast(); window.qaAncestryStore.getState().clearMilestoneToast(); });
}
async function layout(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const e = document.querySelector(selector), r = e?.getBoundingClientRect();
      return r && { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
    };
    const shell = document.querySelector('.scroll-shell');
    const canvas = document.querySelector('.ink-home-scene canvas');
    return {
      width: innerWidth, height: innerHeight, shell: rect('.scroll-shell'), hud: rect('.ink-hud'),
      harvest: rect('.ink-home-goals .ink-idle-row'), scene: rect('.ink-home-scene'),
      canvas: { ...rect('.ink-home-scene canvas'), backing: canvas.height, dpr: devicePixelRatio },
      extras: [...document.querySelectorAll('.ink-home-focus:not(.ink-task-dock) > .ink-enc-strip,.ink-home-focus:not(.ink-task-dock) > div:last-child:not(:empty)')].map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:e.getBoundingClientRect().height})),
      quick: rect('.ink-quick'), task: rect('.ink-task-bar'), nav: rect('.ink-bottom-dock'),
      outerOverflow: document.documentElement.scrollWidth > innerWidth || shell.scrollHeight > shell.clientHeight + 1,
      overflow: getComputedStyle(shell).overflowY,
      controlsHit: [...document.querySelectorAll('.ink-quick button,.ink-bottom-dock button,.ink-task-details summary')].every(e => {
        const r = e.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return r.top >= 0 && r.bottom <= innerHeight + 1 && hit && (e === hit || e.contains(hit));
      }),
    };
  });
}
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
  for (const [width, height] of [[320,568],[375,600],[390,690],[390,844],[420,740],[420,896]]) {
    const browser = await type.launch(name === 'chromium' ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
    try {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(`${name}: ${e.message}`));
      await seed(page);
      const tag = `${name}-${width}x${height}`;
      if (name === 'chromium' && width === 390 && height === 690) {
        const before = await context.newPage();
        await seed(before, '5178');
        await before.screenshot({ path: `${out}/before.png` });
        await before.close();
      }
      const l = await layout(page); report.layouts.push({ tag, ...l });
      console.log(tag, 'scene', l.scene.height, 'task', l.task.top, 'nav', l.nav.top);
      check(!l.outerOverflow && l.overflow === 'hidden', `${tag} no-outer-scroll`);
      check(l.harvest.bottom < l.scene.top && l.scene.bottom <= l.quick.top && l.quick.bottom + 4 <= l.task.top && l.task.bottom + 4 <= l.nav.top, `${tag} all-main-sections-separated`);
      check(l.scene.height >= 90 && l.canvas.height > 0 && l.canvas.top >= l.scene.top && l.canvas.bottom <= l.scene.bottom && Math.abs(l.canvas.backing - l.canvas.height * Math.min(2.5, l.canvas.dpr)) <= 1, `${tag} complete-canvas-resized-not-clipped`);
      check(l.controlsHit, `${tag} all-shortcuts-and-navigation-clickable`);
      await page.screenshot({ path: `${out}/${tag}.png` });
      await page.evaluate(() => { window.qaCanvas = document.querySelector('.ink-home-scene canvas'); window.qaDuel = window.__sparDuel; });
      if (name === 'chromium') { await page.mouse.move(width / 2, l.scene.top + 30); await page.mouse.wheel(0, 500); }
      else await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(100);
      check(await page.evaluate(() => scrollY === 0 && document.querySelector('.scroll-shell').scrollTop === 0), `${tag} main-page-does-not-move`);
      await page.locator('.ink-task-details summary').click();
      const detail = await page.locator('.ink-task-popover').boundingBox();
      check(detail.y >= 0 && detail.y + detail.height <= l.task.top + 1, `${tag} task-details-open-above`);
      await page.locator('.ink-task-details summary').click();
      await page.setViewportSize({ width, height: height >= 740 ? height - 150 : height + 150 });
      await page.waitForTimeout(200);
      const resized = await layout(page);
      check(!resized.outerOverflow && resized.quick.bottom + 4 <= resized.task.top && resized.scene.height >= 90, `${tag} toolbar-resize-refits`);
      check(await page.evaluate(() => window.qaCanvas === document.querySelector('.ink-home-scene canvas') && window.qaDuel === window.__sparDuel), `${tag} resize-keeps-live-engine`);
      await page.setViewportSize({ width, height });
      // 其他分頁只捲內容，頂欄及底部導航唔移位，末項仍然可讀。
      for (const tab of ['人物', '江湖', '修煉']) {
        await page.getByRole('navigation', { name: '分卷' }).getByRole('button', { name: tab, exact: true }).click();
        await page.waitForTimeout(80);
        const stable = await page.evaluate(() => {
          const shell = document.querySelector('.scroll-shell'), body = document.querySelector('.ink-play-body');
          const top = document.querySelector('.ink-hud').getBoundingClientRect().top;
          body.scrollTop = body.scrollHeight;
          return shell.scrollTop === 0 && Math.abs(top - document.querySelector('.ink-hud').getBoundingClientRect().top) < .1 && body.getBoundingClientRect().bottom <= document.querySelector('.ink-bottom-dock').getBoundingClientRect().top;
        });
        check(stable, `${tag} ${tab}-fixed-shell-readable-content`);
      }
      await page.getByRole('button', { name: '鎮居', exact: true }).click();
      check((await layout(page)).controlsHit, `${tag} return-home-refits`);
      await context.close();
    } finally { await browser.close(); }
  }
}
check(report.errors.length === 0, 'no-page-errors');
console.log('Passed', report.checks.length);
