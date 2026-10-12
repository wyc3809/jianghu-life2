// 第22項：5175固定情境驗證菱形牌章及原有按鈕操作。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/icon-badges');
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
 await page.setViewportSize({width,height:844});
 for(const tab of ['home','person','practice']) {
  await page.evaluate(async tab=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);s.getState().setTab(tab);},tab);
  await page.waitForTimeout(350);
  if(tab==='home') await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);
  else await page.locator(tab==='person'?'.ink-attrs':'.ink-practice').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/${tab}-${width}.png`});
  report.checks.push({name:`${tab} ${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=window.innerWidth)});
 }
}
await page.setViewportSize({width:390,height:844});await store(page,s=>s.getState().setTab('home'));
const quick=page.getByRole('navigation',{name:'功能入口'});
for(const label of ['秘笈閣','奇遇','論劍','武學','祖祠']) report.checks.push({name:`${label}保留可讀名稱`,passed:await quick.getByRole('button',{name:label,exact:true}).count()===1});
await quick.getByRole('button',{name:'秘笈閣',exact:true}).click();await page.locator('.ink-gacha').scrollIntoViewIfNeeded();await page.waitForTimeout(350);await page.screenshot({path:`${out}/gacha-390.png`});
for(const width of [320,420]){await page.setViewportSize({width,height:844});await page.screenshot({path:`${out}/gacha-${width}.png`});report.checks.push({name:`gacha ${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=window.innerWidth)});}await page.setViewportSize({width:390,height:844});
report.checks.push({name:'秘笈閣捷徑正常',passed:await store(page,s=>s.getState().state.tab==='jianghu')});
await store(page,s=>s.getState().setTab('home'));await page.getByRole('button',{name:'開啟設定',exact:true}).click();report.checks.push({name:'設定入口正常',passed:await page.getByRole('button',{name:'關閉設定',exact:true}).isVisible()});await page.screenshot({path:`${out}/settings-390.png`});await page.getByRole('button',{name:'關閉設定',exact:true}).click();
const moneyBefore=await store(page,s=>s.getState().state.character.money);const harvest=page.getByRole('button',{name:/收成銀兩/});await harvest.scrollIntoViewIfNeeded();await harvest.click();report.checks.push({name:'實際收成增加128銀兩',passed:await store(page,s=>s.getState().state.character.money)>=moneyBefore+128&&await store(page,s=>Math.floor(s.getState().state.character.flags.idle_silver)<1)});
await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);const target=quick.getByRole('button',{name:'武學',exact:true});const box=await target.boundingBox();
for(let i=0;i<12;i++){if(i===3){await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();}if(i===7){await page.mouse.move(1,1);await page.mouse.up();}await page.screenshot({path:`${out}/frames/badge-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(100);}
await store(page,s=>s.getState().setTab('home'));await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);await page.waitForTimeout(350);await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();report.checks.push({name:'減少動態時牌章不縮放',passed:await target.locator('.ink-badge').evaluate(e=>getComputedStyle(e).transform==='none')});await page.mouse.move(1,1);await page.mouse.up();
await store(page,s=>s.getState().setTab('home'));for(const label of ['鎮居','人物','江湖','修煉']) report.checks.push({name:`底部${label}名稱可讀`,passed:await page.getByRole('navigation',{name:'分卷'}).getByRole('button',{name:label,exact:true}).count()===1});
report.checks.push({name:'所有牌章圖片載入成功',passed:await page.locator('.ink-badge img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0))});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
if(report.errors.length || report.badRequests.length || report.checks.some(check=>!check.passed)) process.exitCode=1;
