// 第22項：固定情境驗證右上貨幣無描邊及玉石入口。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/wallet-no-outline');
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
 await page.setViewportSize({width,height:844});await page.waitForTimeout(150);await page.screenshot({path:`${out}/home-${width}.png`});
 report.checks.push({name:`${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=innerWidth)});
}
await page.setViewportSize({width:390,height:844});
for(const selector of ['.ink-money-chip','.ink-jade-chip']) {
 report.checks.push({name:`${selector}無可見外框或底色`,passed:await page.locator(selector).evaluate(e=>{const s=getComputedStyle(e);return s.borderTopColor==='rgba(0, 0, 0, 0)'&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.boxShadow==='none';})});
 report.checks.push({name:`${selector}文字無描邊或陰影`,passed:await page.locator(selector).evaluate(e=>{const nodes=[e,...e.querySelectorAll('.ink-wallet-name,.ink-wallet-value')];return nodes.every(x=>{const s=getComputedStyle(x);return s.webkitTextStrokeWidth==='0px'&&s.textShadow==='none';});})});
}
report.checks.push({name:'銀兩玉石餘額保留',passed:await page.locator('.ink-wallet-value').textContent()==='103'&&(await page.locator('.ink-jade-chip').textContent()).includes('600')});
const jade=page.locator('.ink-jade-chip');const box=await jade.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
for(let i=0;i<10;i++){if(i===3)await page.mouse.down();if(i===6)await page.mouse.up();await page.screenshot({path:`${out}/frames/wallet-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(100);}
report.checks.push({name:'玉石入口仍然開秘笈閣',passed:await page.locator('.ink-gacha').count()===1});
report.checks.push({name:'貨幣圖示圖片載入成功',passed:await page.locator('.ink-hud-wallet .ink-badge img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
