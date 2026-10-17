// 真正UI驗證本地繁中字體、載入失敗後備同數字字款；手機尺寸模擬。
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out = 'production/qa/evidence/redesign/wuxia-typography';
const manifest = JSON.parse(fs.readFileSync('design/art/wuxia-typography/font-manifest.json', 'utf8'));
const report = { checks: [], errors: [], fontRequests: [] };
const check = (pass, name) => { report.checks.push({ name, pass: !!pass }); fs.writeFileSync(`${out}/font-loading-qa.json`, JSON.stringify(report, null, 2)); if (!pass) throw Error(name); };
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
 for (const blocked of [false, true]) {
  const browser = await type.launch(name === 'chromium' ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
  try {
   const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
   if (blocked) await context.route('**/*wuxia-titles*.woff2*', route => route.abort('failed'));
   const page = await context.newPage();
   page.on('pageerror', error => report.errors.push(error.message));
   const urls = [];
   page.on('request', request => { if (request.url().includes('.woff2')) urls.push(request.url()); });
   await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
   await page.evaluate(async () => {
    const app = await (await fetch('/src/App.tsx')).text(), main = await (await fetch('/src/main.tsx')).text();
    const { useLifeStore: s } = await import(app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1]);
    const { useAncestryStore: a } = await import(main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1]);
    const { createNewLife } = await import('/core/life/gameState.ts');
    const { emptyAncestry } = await import('/core/life/ancestry.ts');
    const state = createNewLife({ seed: 42, name: '黃青雲', skipCoach: true });
    state.phase = 'playing'; state.pending = null; state.tab = 'jianghu'; state.character.flags.newbie_done = true; state.character.flags.coach_done = true;
    const meta = emptyAncestry(); meta.jade = { free: 6000, paidTest: 6000 };
    a.setState({ meta, lastPull: null, jadeToast: 0, milestoneToast: [], encounterOpen: false });
    s.setState({ state, lastResult: null, combatReplay: null, flashLines: [], sealText: null });
   });
   await page.getByRole('group', { name: '抽卡流派' }).waitFor();
   await page.evaluate(() => document.fonts.ready);
   const tag = `${name}-${blocked ? 'blocked' : 'loaded'}`;
   const fontState = await page.evaluate(() => [...document.fonts].find(f => f.family.includes('Jianghu Wuxia Titles'))?.status);
   check(fontState === (blocked ? 'error' : 'loaded'), tag + ' actual-font-state');
   const titleUrls = urls.filter(url => url.includes('wuxia-titles'));
   report.fontRequests.push({ tag, titleUrls, otherFontUrls: urls.filter(url => !titleUrls.includes(url)), fontState });
   check(titleUrls.length > 0 && titleUrls.every(url => new URL(url).origin === 'http://127.0.0.1:5177'), tag + ' new-title-font-only-from-game-origin');
   await page.locator('.ink-school-pool-preview summary').click();
   check(await page.locator('.ink-school-pool strong').evaluateAll((els, characters) => els.every(el => [...el.textContent].every(ch => characters.includes(ch))), manifest.characters), tag + ' rendered-title-characters-covered');
   check(await page.locator('.ink-wallet-value').first().evaluate(el => { const s = getComputedStyle(el); return !s.fontFamily.includes('Jianghu Wuxia Titles') && s.webkitTextStrokeWidth === '0px' && s.textShadow === 'none'; }), tag + ' wallet-keeps-clear-numbers-without-outline');
   check(await page.locator('.ink-school-focus').first().evaluate(el => !getComputedStyle(el).fontFamily.includes('Jianghu Wuxia Titles')), tag + ' focus-keeps-ui-font');
   for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    check(await page.locator('.ink-school-tabs').evaluate(el => el.scrollWidth <= el.clientWidth && [...el.querySelectorAll('button')].every(b => b.scrollWidth <= b.clientWidth && b.clientHeight >= 44)), tag + ` ${width}-full-names-fit`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), tag + ` ${width}-no-horizontal-overflow`);
   }
   await page.setViewportSize({ width: 390, height: 844 });
   await page.locator('.ink-school-tabs').scrollIntoViewIfNeeded();
   await page.waitForTimeout(1000);
   await page.screenshot({ path: `${out}/${tag}-font.png` });
  } finally { await browser.close(); }
 }
}
check(!report.errors.length, 'no-page-errors');
console.log('Passed', report.checks.length);
