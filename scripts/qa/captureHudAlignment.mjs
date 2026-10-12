// 第22項：固定情境驗證設定對齊、移除墨及三種數值條。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/hud-alignment');
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
 await page.setViewportSize({width,height:844});await page.waitForTimeout(200);
 await page.screenshot({path:`${out}/home-${width}.png`});
 const labels=await page.locator('.ink-hud-wallet .ink-wallet-name').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().x));
 report.checks.push({name:`${width}px銀兩玉石設定文字對齊`,passed:labels.length===3&&Math.max(...labels)-Math.min(...labels)<.6,labels});
 report.checks.push({name:`${width}px三組標籤條及數字對齊`,passed:await page.locator('.ink-hud-meters').evaluate(e=>{const rows=Array.from(e.querySelectorAll('.ink-meter'));return rows.length===3&&['.ink-vitals-label','.ink-meter-bar','.ink-hud-meter-value'].every(q=>{const ys=rows.map(r=>r.querySelector(q).getBoundingClientRect().y);return Math.max(...ys)-Math.min(...ys)<.6;});})});
 report.checks.push({name:`${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=innerWidth)});
}
await page.setViewportSize({width:390,height:844});
report.checks.push({name:'已移除墨按鈕',passed:await page.getByRole('button',{name:'墨',exact:true}).count()===0});
for(const [ap,label] of [[50,'half'],[0,'full']]) {
 await page.evaluate(async ap=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);const n=structuredClone(s.getState().state);n.character.actionPoints=ap;s.getState().importState(n);},ap);
 await page.waitForTimeout(180);await page.screenshot({path:`${out}/fatigue-${label}-390.png`});
 const meter=page.getByRole('meter',{name:'疲勞度',exact:true});
 report.checks.push({name:`疲勞${label}進度條與數字一致`,passed:await meter.evaluate(e=>Math.abs(parseFloat(e.querySelector('.ink-brush-bar').style.getPropertyValue('--pct'))-Number(e.getAttribute('aria-valuenow')))<.01)});
}
await page.getByRole('button',{name:'開啟設定',exact:true}).click();report.checks.push({name:'設定入口保留',passed:await page.getByRole('button',{name:'關閉設定',exact:true}).isVisible()});await page.getByRole('button',{name:'關閉設定',exact:true}).click();
await page.locator('.ink-jade-chip').click();report.checks.push({name:'玉石入口保留',passed:await page.locator('.ink-gacha').count()===1});
report.checks.push({name:'江湖頁仍然顯示疲勞條',passed:await page.getByRole('meter',{name:'疲勞度',exact:true}).isVisible()});
await store(page,s=>s.getState().setTab('home'));await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);
for(let i=0;i<12;i++){await page.screenshot({path:`${out}/frames/hud-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(120);}
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
