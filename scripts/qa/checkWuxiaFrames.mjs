// 真正UI檢查生成框素材、選中／鍵盤操作、圖片失敗後備及珍本層級。
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out = 'production/qa/evidence/redesign/wuxia-art-frames';
const report = { checks: [], errors: [], assets: [] };
const check = (pass, name) => { report.checks.push({ name, pass: !!pass }); fs.writeFileSync(`${out}/frames-qa.json`, JSON.stringify(report, null, 2)); if (!pass) throw Error(name); };
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) for (const blocked of [false, true]) {
 const browser = await type.launch(name === 'chromium' ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
 try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  if (blocked) await context.route('**/ink/art/wuxia-frames/*.webp', route => route.abort('failed'));
  const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
   const app = await (await fetch('/src/App.tsx')).text(), main = await (await fetch('/src/main.tsx')).text();
   const { useLifeStore: s } = await import(app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1]);
   const { useAncestryStore: a } = await import(main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1]);
   const { createNewLife } = await import('/core/life/gameState.ts'); const { emptyAncestry } = await import('/core/life/ancestry.ts');
   const { activeSchoolGachaPool } = await import('/core/life/schoolGachaPools.ts');
   const state = createNewLife({ seed: 42, name: '黃青雲', skipCoach: true }); state.phase = 'playing'; state.pending = null; state.tab = 'jianghu'; state.character.flags.newbie_done = true; state.character.flags.coach_done = true;
   const meta = emptyAncestry(); meta.jade = { free: 6000, paidTest: 6000 };
   a.setState({ meta, lastPull: null, jadeToast: 0, milestoneToast: [], encounterOpen: false }); s.setState({ state, lastResult: null, combatReplay: null, flashLines: [], sealText: null });
   window.qaAncestryStore = a; window.qaPool = activeSchoolGachaPool;
  });
  const group = page.getByRole('group', { name: '抽卡流派' }); await group.waitFor(); await page.evaluate(() => document.fonts.ready);
  const tag = `${name}-${blocked ? 'blocked' : 'loaded'}`;
  const decoded = await page.evaluate(async () => Promise.all(['neutral', 'selected', 'panel', 'rare'].map(name => new Promise(resolve => {
   const image = new Image(); image.onload = () => resolve({ name, loaded: true, width: image.naturalWidth, height: image.naturalHeight }); image.onerror = () => resolve({ name, loaded: false }); image.src = `/ink/art/wuxia-frames/frame-${name}.webp`;
  })))); report.assets.push({ tag, decoded });
  check(decoded.every(image => blocked ? !image.loaded : image.loaded && image.width === 512 && image.height === 512), tag + ' four-WebP-assets-decode-or-fail-as-requested');
  const first = group.getByRole('button', { name: '選修羅血戰道流派', exact: true }); await first.scrollIntoViewIfNeeded();
  check(await first.evaluate(el => { const s = getComputedStyle(el, '::before'); return s.pointerEvents === 'none' && s.borderImageSlice === '128' && s.borderImageSource.includes('frame-selected.webp'); }), tag + ' selected-raster-nine-slice-and-no-pointer-interception');
  check(await first.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), tag + ' actual-button-hit-target-not-covered');
  check(await first.evaluate(el => { const s = getComputedStyle(el, '::before'); return s.backgroundBlendMode.includes('soft-light') && s.backgroundColor !== 'transparent'; }), tag + ' light-paper-fill-not-opaque-gray-grain');
  await first.focus(); await page.keyboard.press('Tab');
  check(await page.evaluate(() => { const e = document.activeElement; return e?.getAttribute('aria-label') === '選長河疊浪流派' && getComputedStyle(e).outlineWidth === '2px' && getComputedStyle(e).outlineStyle !== 'none'; }), tag + ' keyboard-focus-visible');
  await page.keyboard.press('Enter');
  const selected = group.getByRole('button', { name: '選長河疊浪流派', exact: true });
  check(await selected.getAttribute('aria-pressed') === 'true' && await selected.evaluate(el => getComputedStyle(el, '::before').borderImageSource.includes('frame-selected.webp')), tag + ' keyboard-select-updates-real-pool-and-art-state');
  check(await page.evaluate(() => window.qaPool(window.qaAncestryStore.getState().meta, 'jianghu').school === 'lianhuan'), tag + ' selected-school-is-real-saved-choice');
  check(await selected.evaluate(el => { const other = el.parentElement.querySelector('button[aria-pressed="false"]'); return getComputedStyle(el, '::before').backgroundColor !== getComputedStyle(other, '::before').backgroundColor; }), tag + ' selection-stays-visible-with-images-blocked');
  await group.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  if (!blocked) await group.screenshot({ path: `${out}/${name}-keyboard-focus.png` });
  await selected.evaluate(el => el.blur());
  await group.screenshot({ path: `${out}/${name}-${blocked ? 'blocked' : 'school-tabs'}.png` });
  await page.getByRole('tab', { name: /珍本奇功/ }).click(); await page.locator('.ink-school-pool-preview summary').click();
  const rare = page.locator('.ink-school-pool-preview li.is-premium');
  check(await rare.count() === await page.evaluate(() => window.qaPool(window.qaAncestryStore.getState().meta, 'zhenben').premium.length), tag + ' rare-card-styling-matches-real-premium-list');
  check(await rare.evaluateAll(els => els.length > 0 && els.every(el => getComputedStyle(el, '::before').borderImageSource.includes('frame-rare.webp'))), tag + ' rare-manual-uses-gold-raster-frame');
  for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.ink-school-tabs button')].every(el => el.scrollWidth <= el.clientWidth && el.clientHeight >= 44)), tag + ` ${width}-labels-and-touch-target-fit`); }
 } finally { await browser.close(); }
}
check(!report.errors.length, 'no-page-errors'); console.log('Passed', report.checks.length);
