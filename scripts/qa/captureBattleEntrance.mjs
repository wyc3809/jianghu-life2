import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/battle-ink-entrance';
fs.mkdirSync(out+'/frames',{recursive:true});
const previous=process.env.QA_BROWSER && fs.existsSync(out+'/browser-qa.json') ? JSON.parse(fs.readFileSync(out+'/browser-qa.json','utf8')) : null;
const report={checks:previous ? previous.checks.filter(c=>c.name.startsWith('chromium-')) : [],errors:[],failedAssets:[],timing:{chromium:'controlled-clock',webkit:'normal-playback'}};
function check(pass,name){report.checks.push({name,pass:!!pass});fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));if(!pass)throw Error(name)}
async function boot(page,kind){
 const time=new Date('2026-10-14T12:00:00Z');await page.clock.install({time});await page.clock.pauseAt(time);
 await page.goto(`http://127.0.0.1:5177/?battle-preview=unified&kind=${kind}`,{waitUntil:'networkidle'});
 for(let i=0;i<160;i++){if(await page.locator('.ink-battle-entrance[data-phase="revealing"]').count())return;await page.clock.runFor(16);await page.waitForTimeout(20)}
 throw Error('揭幕未啟動');
}
async function hp(page){return page.locator('.ink-unified-hp').evaluateAll(rows=>rows.map(el=>el.getAttribute('aria-label')))}
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 if(process.env.QA_BROWSER&&process.env.QA_BROWSER!==name)continue;
 const launch=()=>type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 let browser=await launch();
 for(const width of [320,390,420])for(const height of [690,844])for(const kind of ['spar','event','event-boss']){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2});const page=await ctx.newPage();const tag=`${name}-${kind}-${width}x${height}`;
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedAssets.push(r.url())});
  if(name==='chromium')await boot(page,kind);else{await page.goto(`http://127.0.0.1:5177/?battle-preview=unified&kind=${kind}`,{waitUntil:'domcontentloaded'});await page.locator('.ink-battle-entrance').waitFor({state:'attached'});}
  const first=await page.evaluate(()=>{
    const mask=document.querySelector('.ink-battle-entrance');const r=mask?.getBoundingClientRect();
    return {hp:[...document.querySelectorAll('.ink-unified-hp')].map(el=>el.getAttribute('aria-label')),
      blocked:[...document.querySelectorAll('.ink-unified-controls button')].every(el=>el.disabled),
      busy:document.querySelector('.ink-unified-battle')?.getAttribute('aria-busy')==='true',
      active:document.querySelectorAll('.ink-unified-volumes .is-active').length,
      covers:!!r&&r.left===0&&r.top===0&&Math.abs(r.width-innerWidth)<.1&&Math.abs(r.height-innerHeight)<.1};
  });
  const initial=first.hp;
  check(first.blocked&&first.busy,tag+' blocks-controls-during-reveal');
  if(name==='chromium')await page.clock.runFor(160);
  check(name==='chromium' ? JSON.stringify(await hp(page))===JSON.stringify(initial)&&await page.locator('.ink-unified-volumes .is-active').count()===0 : first.active===0&&first.busy,tag+' no-strike-under-veil');
  check(first.covers,tag+' covers-full-viewport');
  if(name==='chromium')await page.clock.runFor(750);
  await page.locator('.ink-battle-entrance').waitFor({ state: 'detached' });
  check(await page.locator('.ink-battle-entrance').count()===0&&await page.locator('.ink-unified-battle').getAttribute('aria-busy')==='false'&&await page.getByRole('button',{name:'跳過 ›',exact:true}).isEnabled(),tag+' reveal-completes-and-unlocks');
  if(width===390&&height===844){if(name==='chromium')await page.clock.runFor(2200);else await page.locator('.ink-unified-volumes .is-active').first().waitFor({timeout:15000});check(JSON.stringify(await hp(page))!==JSON.stringify(initial),tag+' first-strike-after-reveal');await page.screenshot({path:`${out}/${name}-${kind}.png`});}
  await page.getByRole('button',{name:'跳過 ›',exact:true}).click();check(await page.getByRole('button',{name:'重播呢場'}).isVisible(),tag+' skip-still-finishes');
  await ctx.close();
  if(kind==='event-boss'&&height===844&&width!==420){await browser.close();browser=await launch();}
 }
 for(const mode of ['reduced','missing-mask']){
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:mode==='reduced'?'reduce':'no-preference'});const page=await ctx.newPage();let requested=0;
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('ink-bloom.webp'))requested++});
  if(mode==='missing-mask')await page.route('**/ink-bloom.webp',r=>r.abort());
  if(name==='chromium')await boot(page,'spar');else{await page.goto('http://127.0.0.1:5177/?battle-preview=unified&kind=spar',{waitUntil:'domcontentloaded'});await page.locator('.ink-unified-battle').waitFor({state:'attached'});}
  const initial=await hp(page);if(name==='chromium')await page.clock.runFor(80);check(JSON.stringify(await hp(page))===JSON.stringify(initial),`${name}-${mode}-no-hidden-strike`);
  if(name==='chromium')await page.clock.runFor(140);else await page.locator('.ink-battle-entrance').waitFor({state:'detached'});check(await page.locator('.ink-battle-entrance').count()===0,`${name}-${mode}-quick-fade-finishes`);
  if(mode==='reduced')check(requested===0,`${name}-reduced-does-not-load-ink-mask`);
  await ctx.close();
 }
 await browser.close();
}
check(report.errors.length===0,'no-page-errors');check(report.failedAssets.length===0,'all-normal-assets-load');
// 真瀏覽器逐格擷取；控制時間只為固定轉場截圖，唔係概念動畫。
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const kind of ['spar','event']){
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const page=await ctx.newPage();await boot(page,kind);
 const folder=`${out}/frames/${kind}`;fs.mkdirSync(folder,{recursive:true});
 for(let i=0;i<=40;i++){if(i)await page.clock.runFor(40);await page.screenshot({path:`${folder}/${String(i).padStart(3,'0')}.png`});}
 await ctx.close();
}
await browser.close();console.log('passed',report.checks.length);
