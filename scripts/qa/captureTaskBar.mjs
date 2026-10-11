// 第22項：固定情境驗證底部任務欄、詳情同原有任務行為。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/task-bar');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};
const baseRect={x:10,y:169.40625,width:370,height:230};
async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[]});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
await page.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);
const rect=await page.locator('.ink-home-scene').boundingBox();report.checks.push({name:'演武台位置及尺寸保持原版',passed:['x','y','width','height'].every(k=>Math.abs(rect[k]-baseRect[k])<.6),original:baseRect,actual:rect});
await page.screenshot({path:`${out}/after-390.png`});


for(const width of [320,390,420]) {
 await page.setViewportSize({width,height:844});await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);
 const task=await page.locator('.ink-task-bar').boundingBox();
 const center=await page.locator('.ink-nav-center').boundingBox();
 report.checks.push({name:`${width}px任務欄不遮住過月按鈕`,passed:task.y+task.height<center.y});
 report.checks.push({name:`${width}px任務欄高度不超過80px`,passed:task.height<=80});
 report.checks.push({name:`${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=window.innerWidth && document.querySelector('.ink-task-bar').scrollWidth<=document.querySelector('.ink-task-bar').clientWidth)});
 await page.screenshot({path:`${out}/home-${width}.png`});
 const summary=page.getByRole('button',{name:/任務詳情/});
 // 原生summary喺Chromium可用button角色查找。
 await page.locator('.ink-task-details summary').click();
 report.checks.push({name:`${width}px詳情可展開`,passed:await page.locator('.ink-task-popover').isVisible()});
 await page.screenshot({path:`${out}/details-${width}.png`});
 await page.locator('.ink-task-details summary').click();
}
await page.setViewportSize({width:390,height:844});
await store(page,s=>s.getState().setTab('person'));report.checks.push({name:'切到人物唔顯示任務欄',passed:await page.locator('.ink-task-bar').count()===0});
await store(page,s=>s.getState().setTab('home'));
const harvest=page.getByRole('button',{name:/收成銀兩/});await harvest.scrollIntoViewIfNeeded();await harvest.click();report.checks.push({name:'收成保留並增加128銀兩',passed:await store(page,s=>s.getState().state.character.money)>=231});
await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);
for(let i=0;i<12;i++){if(i===3||i===9)await page.locator('.ink-task-details summary').click();await page.screenshot({path:`${out}/frames/task-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(100);}
// 測新手換裝目標，點擊原有onAction後任務會自然改變。
await store(page,s=>{const next=structuredClone(s.getState().state);next.character.flags.newbie_active=true;next.character.flags.newbie_done=false;next.character.flags.newbie_trial_won=true;s.getState().importState(next);});
await page.waitForTimeout(350);await page.screenshot({path:`${out}/equip-390.png`});await page.locator('.ink-task-bar').getByRole('button',{name:'換上',exact:true}).click();await page.waitForTimeout(350);report.checks.push({name:'換裝任務按鈕仍然有效',passed:await store(page,s=>Object.values(s.getState().state.character.equipment).includes('iron-blade'))});await store(page,s=>s.setState({lastResult:null,sealText:null}));
// 突破時仍然可以喺任務欄執行，唔改數值。
await store(page,s=>{const next=structuredClone(s.getState().state);next.character.flags.newbie_done=true;next.character.cultivation.xp=600;s.getState().importState(next);});await page.waitForTimeout(350);await page.screenshot({path:`${out}/breakthrough-390.png`});report.checks.push({name:'修為滿時保留突破按鈕',passed:await page.locator('.ink-task-bar').getByRole('button',{name:'突破',exact:true}).isEnabled()});
report.checks.push({name:'圖片全部載入成功',passed:await page.locator('.ink-task-bar img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0))});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length || report.badRequests.length || report.checks.some(check=>!check.passed))process.exitCode=1;

