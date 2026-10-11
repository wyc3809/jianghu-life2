// 第22項：先喺5175開dev server，再用固定情境捕捉兩款可操作樣板。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/ui-investor-review');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};
let baseRect;
async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[]});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
for(const v of ['original','a','b']){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
 await page.goto(`http://127.0.0.1:5175/?still=1${v==='original'?'':`&ui-preview=${v}`}`,{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);
 await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);
 const rect=await page.locator('.ink-home-scene').boundingBox();
 if(v==='original')baseRect=rect;
 else report.checks.push({name:`${v.toUpperCase()}演武台位置尺寸保持原版`,passed:['x','y','width','height'].every(k=>Math.abs(rect[k]-baseRect[k])<.6),original:baseRect,actual:rect});
 await page.screenshot({path:`${out}/${v}-390.png`});
 report.samples.push({variant:v,width:390,file:`${v}-390.png`});
 if(v!=='original'){
  for(const width of [320,420]){await page.setViewportSize({width,height:844});await page.screenshot({path:`${out}/${v}-${width}.png`});report.checks.push({name:`${v.toUpperCase()} ${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=window.innerWidth)});}
  await page.setViewportSize({width:390,height:844});
  // 實際收成及按壓態，同時錄製樣板動態。
  const moneyBefore=await store(page,s=>s.getState().state.character.money);
  const harvest=page.getByRole('button',{name:/收成銀兩/});await harvest.scrollIntoViewIfNeeded();
  const target=await harvest.boundingBox();
  for(let frame=0;frame<16;frame++){
    if(frame===3){await page.mouse.move(target.x+target.width/2,target.y+target.height/2);await page.mouse.down();}
    if(frame===7)await page.mouse.up();
    await page.screenshot({path:`${out}/frames/${v}-${String(frame).padStart(2,'0')}.png`});await page.waitForTimeout(90);
  }
  report.checks.push({name:`${v.toUpperCase()}實際收成增加銀兩並扣待收成`,passed:await store(page,s=>Math.floor(s.getState().state.character.flags.idle_silver)<1)&&await store(page,s=>s.getState().state.character.money)>=moneyBefore+128});
  await page.screenshot({path:`${out}/${v}-claimed.png`});
  await page.getByRole('navigation',{name:'功能入口'}).getByRole('button',{name:'秘笈閣',exact:true}).click();
  report.checks.push({name:`${v.toUpperCase()}秘笈閣入口仍正常`,passed:await store(page,s=>s.getState().state.tab==='jianghu')});
  await store(page,s=>s.getState().setTab('home'));
  await page.getByRole('button',{name:'開啟設定',exact:true}).click();
  report.checks.push({name:`${v.toUpperCase()}設定入口仍正常`,passed:await page.getByRole('button',{name:'關閉設定',exact:true}).isVisible()});
  await page.getByRole('button',{name:'關閉設定',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  const quick=page.getByRole('navigation',{name:'功能入口'}).getByRole('button',{name:'武學',exact:true});await quick.scrollIntoViewIfNeeded();const qr=await quick.boundingBox();await page.mouse.move(qr.x+qr.width/2,qr.y+qr.height/2);await page.mouse.down();report.checks.push({name:`${v.toUpperCase()}減少動態不縮放按壓圖示`,passed:await page.evaluate(()=>getComputedStyle(document.querySelector('.ink-quick-btn.is-pressed .ink-review-icon')).transform==='none')});await page.mouse.up();
 }
 await context.close();
}
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
