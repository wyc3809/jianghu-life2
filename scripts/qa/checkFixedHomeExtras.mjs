// 真實主頁：固定頂欄／任務／導航，工具列收放後仍然完整顯示。
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out = 'production/qa/evidence/redesign/fixed-home-viewport';
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], layouts: [], errors: [] };
function check(pass, name) {
  report.checks.push({ name, pass: Boolean(pass) });
  fs.writeFileSync(`${out}/extras-qa.json`, JSON.stringify(report, null, 2));
  if (!pass) throw Error(name);
}
async function seed(page) {
  await page.goto('http://127.0.0.1:5177/', { waitUntil: 'networkidle' });
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
  await page.locator('.scroll-shell--home').waitFor();
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

for (const [name,type] of [['chromium',chromium],['webkit',webkit]]) {
 const browser=await type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try {
 const page=await browser.newPage({viewport:{width:320,height:568},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>report.errors.push(e.message));
 await seed(page);
 await page.evaluate(()=>{window.__sparDuel.foeHp=1e9;});
 for (const mode of ['offer','active','coach-flash','combined']) {
 await page.evaluate(mode=>{
  const life=window.qaLifeStore,ancestry=window.qaAncestryStore;
  const s=structuredClone(life.getState().state);s.character.flags.coach_done=mode==='offer'||mode==='active';s.character.flags.coach_flipped=false;
  life.setState({state:s,flashLines:mode==='coach-flash'||mode==='combined'?['山門前有俠客過招。','你回想今日心得，修為有所增長。']:[]});
  const meta=structuredClone(ancestry.getState().meta);
  meta.encounter=mode==='coach-flash'?undefined:{nextAt:Date.now()+86400000,seq:0,done:0,expired:0,offer:mode!=='active'?{tpl:'enc_blood_monk',at:Date.now()}:undefined,active:mode==='active'?{tpl:'enc_blood_monk',route:'feed',progress:1,carried:0,base:{lifeKey:'42:1:黃青雲',value:0},startAt:Date.now(),deadline:Date.now()+86400000}:undefined};
  ancestry.setState({meta});
 },mode);
 await page.waitForTimeout(100);
 if(mode==='coach-flash'||mode==='combined')check(await page.locator('.ink-coach').isVisible(),name+'-'+mode+'-coach-visible');
 const l=await layout(page);report.layouts.push({tag:name+'-'+mode,...l});
 console.log(name,mode,JSON.stringify(l));
 check(!l.outerOverflow&&l.scene.height>=90&&l.quick.bottom+4<=l.task.top&&l.canvas.bottom<=l.scene.bottom&&l.extras.every(r=>r.bottom+4<=l.task.top&&r.height>=24),name+'-'+mode+'-fits');
 await page.screenshot({path:`${out}/${name}-${mode}.png`});
 }
 await page.evaluate(()=>{
 const store=window.qaLifeStore,s=structuredClone(store.getState().state);
 s.pending={eventId:'ord_market',year:s.year,month:s.month,kind:'ordinary'};
 store.setState({state:s,flashLines:[]});
 });
 await page.locator('.ink-event--focus').waitFor();
 const choice=await page.locator('.ink-choice-list--dock').boundingBox();
 check(choice.y>=0&&choice.y+choice.height<=568,name+'-event-choices-visible');
 await page.screenshot({path:`${out}/${name}-event.png`});
 check(await page.evaluate(()=>document.querySelector('.scroll-shell').scrollTop===0&&getComputedStyle(document.querySelector('.scroll-shell')).overflowY==='hidden'),name+'-event-fixed-shell');
 } finally {await browser.close();}
}
check(!report.errors.length,'no-extras-errors');
console.log('Passed',report.checks.length);
