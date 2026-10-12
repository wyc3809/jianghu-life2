// 第22項：固定情境驗證設定對齊、移除墨及三種數值條。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/mobile-overlap');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};

async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
await page.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);

await store(page,s=>{const n=structuredClone(s.getState().state);n.character.name='林雲龍';n.year=21;n.character.age=19;n.character.money=1222;n.character.location='千燈鎮';n.character.sectId='qa';n.sects.qa={id:'qa',name:'長名字測試門派青城劍宗'};n.character.martial=99;n.character.health=693;n.character.maxHealth=693;n.character.qi=175;n.character.maxQi=687;n.character.flags.titles='title_number_one,title_master';s.getState().importState(n);});
for(const width of [320,390,420]) for(const height of [690,844]) {
 await page.setViewportSize({width,height});await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);await page.waitForTimeout(250);
 await page.screenshot({path:`${out}/home-${width}-${height}.png`});
 report.checks.push({name:`${width}x${height}人物資料完整`,passed:await page.locator('.ink-meta').evaluate(e=>e.scrollWidth<=e.clientWidth&&getComputedStyle(e).whiteSpace==='normal')});
 report.checks.push({name:`${width}x${height}任務與快捷不重疊`,passed:await page.evaluate(()=>{const t=document.querySelector('.ink-task-bar').getBoundingClientRect();const q=document.querySelector('.ink-quick').getBoundingClientRect();const stage=document.querySelector('.ink-home-scene').getBoundingClientRect();return t.top>=stage.bottom&&q.top>=t.bottom;})});
 await page.locator('.ink-quick').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(150);
 report.checks.push({name:`${width}x${height}五個入口可點`,passed:await page.locator('.ink-quick-btn').evaluateAll(nodes=>nodes.length===5&&nodes.every(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit&&e.contains(hit);}))});
 await page.screenshot({path:`${out}/quick-${width}-${height}.png`});
 report.checks.push({name:`${width}x${height}無横向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=innerWidth)});
}
await page.setViewportSize({width:390,height:690});await page.locator('.ink-task-bar').evaluate(e=>e.scrollIntoView({block:'center'}));await page.locator('.ink-task-details summary').click();
report.checks.push({name:'任務詳情可展開',passed:await page.locator('.ink-task-details').evaluate(e=>e.open)});await page.screenshot({path:`${out}/task-open.png`});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
