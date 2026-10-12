// 第22項：固定情境驗證演武台上方收益欄、任務欄同收成。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/release-ea065');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};

async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
await page.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);
await page.screenshot({path:`${out}/after-390.png`});




for(const width of [320,390,420]) {
 await page.setViewportSize({width,height:844});await page.waitForTimeout(250);await page.screenshot({path:`${out}/home-${width}.png`});
 report.checks.push({name:`${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=innerWidth)});
}
await page.setViewportSize({width:390,height:844});
report.checks.push({name:'主頁不顯示威望排名並顯示戰力階級',passed:await page.locator('.ink-meta').textContent().then(t=>t.includes('戰力')&&!t.includes('威望')&&!t.includes('未列名'))});
report.checks.push({name:'人物入口使用圖像並保留操作名稱',passed:await page.locator('.ink-hud-avatar img').count()===1&&await page.locator('.ink-hud-avatar-glyph').count()===0});
report.checks.push({name:'銀兩玉石疲勞與設定字體相同',passed:await page.evaluate(()=>new Set(['.ink-wallet-value','.ink-jade-chip','.ink-fatigue-label','.ink-icon-btn--wide','.ink-ap-meter-value'].map(q=>getComputedStyle(document.querySelector(q)).fontFamily)).size===1)});
report.checks.push({name:'演武當前血量及上限與實際角色一致',passed:await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);const c=s.getState().state.character;return window.__sparDuel.hero.maxHp===c.maxHealth&&window.__sparDuel.heroHp===c.health;})});
for(let i=0;i<12;i++){await page.screenshot({path:`${out}/frames/spar-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(250);}
await page.locator('.ink-hud-avatar').click();await page.locator('.ink-attrs').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/person-390.png`});
report.checks.push({name:'排名已移入人物列表',passed:await page.locator('.ink-bitlife-row').filter({hasText:'江湖排名'}).count()===1});
await page.locator('.ink-bitlife-row').filter({hasText:'戰力'}).click();await page.screenshot({path:`${out}/combat-390.png`});
report.checks.push({name:'戰力詳細頁可用',passed:await page.getByRole('list',{name:'演武氣血拆解'}).count()===1});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
