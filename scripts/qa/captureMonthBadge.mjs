// 第22項：固定情境驗證演武台上方收益欄、任務欄同收成。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/month-badge');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};
const baseRect=JSON.parse(fs.readFileSync(`${out}/baseline.json`,'utf8'));
async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
await page.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);
const rect=await page.locator('.ink-home-scene').boundingBox();report.checks.push({name:'演武台位置尺寸保持改前',passed:['x','y','width','height'].every(k=>Math.abs(rect[k]-baseRect[k])<.6),original:baseRect,actual:rect});
await page.screenshot({path:`${out}/after-390.png`});



for(const width of [320,390,420]) {
 await page.setViewportSize({width,height:844});await page.waitForTimeout(150);
 const button=await page.locator('.ink-nav-center').boundingBox();const task=await page.locator('.ink-task-bar').boundingBox();
 report.checks.push({name:`${width}px任務欄同過月按鈕不重疊`,passed:task.y+task.height<button.y});
 report.checks.push({name:`${width}px過月觸控至少44px`,passed:button.width>=44&&button.height>=44});
 report.checks.push({name:`${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=window.innerWidth)});
 await page.screenshot({path:`${out}/home-${width}.png`});
}
await page.setViewportSize({width:390,height:844});
await store(page,s=>{const n=structuredClone(s.getState().state);n.character.cultivation.xp=300;s.getState().importState(n);});await page.waitForTimeout(150);await page.screenshot({path:`${out}/half-390.png`});
report.checks.push({name:'修為進度保留50%',passed:await page.locator('.ink-month-progress').evaluate(e=>Math.abs(parseFloat(e.style.getPropertyValue('--pct'))-50)<.1)});
const before=await store(page,s=>s.getState().state.year*12+s.getState().state.month);const button=page.locator('.ink-nav-center');const box=await button.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
for(let i=0;i<12;i++){if(i===3)await page.mouse.down();if(i===6)await page.mouse.up();await page.screenshot({path:`${out}/frames/month-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(120);}
report.checks.push({name:'實際按鈕正常推進一個月',passed:await store(page,s=>s.getState().state.year*12+s.getState().state.month)===before+1});
await modules(page);await page.waitForTimeout(100);
await store(page,s=>{const n=structuredClone(s.getState().state);n.character.actionPoints=0;s.getState().importState(n);});await page.waitForTimeout(150);await page.screenshot({path:`${out}/exhausted-390.png`});report.checks.push({name:'過勞時保留停用及氣力不繼提示',passed:await button.isDisabled()&&(await page.locator('.ink-nav-center-tier').textContent()).includes('氣力不繼')});
await store(page,s=>{const n=structuredClone(s.getState().state);n.character.cultivation.xp=600;s.getState().importState(n);});await page.waitForTimeout(150);await page.screenshot({path:`${out}/breakthrough-390.png`});
report.checks.push({name:'滿修為轉成朱砂突破牌章',passed:await button.locator('.ink-badge-label').textContent()==='突破'&&await button.isEnabled()&&await button.locator('.ink-badge-base').getAttribute('src').then(x=>new URL(x,'http://localhost').pathname.endsWith('/red.webp'))});
await button.click();await page.waitForTimeout(200);report.checks.push({name:'突破牌章執行原有突破行為',passed:await store(page,s=>Boolean(s.getState().breakthroughResult))});
await modules(page);await page.waitForTimeout(150);await page.emulateMedia({reducedMotion:'reduce'});const pos=await button.boundingBox();await page.mouse.move(pos.x+pos.width/2,pos.y+pos.height/2);await page.mouse.down();report.checks.push({name:'減少動態時過月按鈕不縮放',passed:await button.evaluate(e=>getComputedStyle(e).transform==='none')});await page.mouse.move(1,1);await page.mouse.up();
report.checks.push({name:'牌章圖片全部載入',passed:await page.locator('.ink-month-badge img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
