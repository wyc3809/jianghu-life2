import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/unified-battle';
fs.mkdirSync(out+'/frames',{recursive:true});
const report={checks:[],errors:[],requests:[]};
function assert(ok,name){report.checks.push({name,pass:!!ok});fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));if(!ok)throw Error(name)}
for(const [browserName,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch(browserName==='chromium'?{executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']}: {headless:true});
 for(const width of [320,390,420])for(const height of [690,844])for(const kind of ['spar','event','event-boss']){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2});const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(browserName+':'+e.message));page.on('response',r=>{if(r.status()>=400)report.requests.push(r.url()+':'+r.status())});
  await page.goto(`http://127.0.0.1:5177/?battle-preview=unified&kind=${kind}`,{waitUntil:'networkidle'});
  await page.waitForTimeout(700);
  const layout=await page.evaluate(()=>{
    const root=document.querySelector('.ink-unified-paper'); const r=root.getBoundingClientRect();
    const header=document.querySelector('.ink-unified-header').getBoundingClientRect(),footer=document.querySelector('.ink-unified-footer').getBoundingClientRect();
    const volumes=[...document.querySelectorAll('.ink-unified-volumes li')].map(el=>el.getBoundingClientRect());
    const canvas=document.querySelector('canvas');
    const rows=[...document.querySelectorAll('.ink-unified-hp')].map(el=>({label:el.getAttribute('aria-label'),pct:Number(el.querySelector('.ink-brush-bar').style.getPropertyValue('--pct'))}));
    return {fits:header.top>=0&&footer.bottom<=innerHeight+.1&&footer.top>header.bottom&&r.width<=innerWidth&&document.documentElement.scrollWidth<=innerWidth,
     cards:volumes.length===7&&volumes.every(v=>v.left>=0&&v.right<=innerWidth+.1),canvas:canvas.width>0&&canvas.height>0,rows};
  });
  const tag=`${browserName}-${kind}-${width}x${height}`;
  assert(layout.fits&&layout.cards&&layout.canvas,tag+' visible-no-overlap');
  assert(layout.rows.every(v=>{const [a,b]=v.label.match(/(\d+)\/(\d+)$/).slice(1).map(Number);return Math.abs(v.pct-a/b*100)<.0001}),tag+' hp-ratio');
  await page.getByRole('button',{name:'加速 ×2',exact:true}).click();assert(await page.getByRole('button',{name:'加速 ×2',exact:true}).getAttribute('aria-pressed')==='true',tag+' speed-toggle');
  await page.getByRole('button',{name:'跳過 ›',exact:true}).click();await page.getByRole('button',{name:'重播呢場'}).waitFor();
  const last=await page.evaluate(async k=>{const{makeBattlePreview}=await import('/src/prototypes/battleFixtures.ts');const replay=makeBattlePreview(k);return replay.rounds.at(-1).hits.at(-1)},kind);
  assert((await page.locator('.ink-unified-hp').nth(1).getAttribute('aria-label')).includes(`${last.playerHp}/`),tag+' skip-final-hp');
  await page.getByRole('button',{name:'重播呢場'}).click();await page.getByRole('button',{name:'重播呢場'}).waitFor({state:'hidden'});
  if(width===390&&height===844){await page.waitForTimeout(1250);await page.screenshot({path:`${out}/${browserName}-${kind}.png`});}
  await ctx.close();
 }
 // 自然播放要跟戰報輪替並自行結束，唔依賴跳過。
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:5177/?battle-preview=unified&kind=event-boss',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'加速 ×2',exact:true}).click();
 const seen=new Set();for(let i=0;i<130;i++){seen.add(await page.locator('.ink-unified-art-title').innerText());if(browserName==='chromium'&&i<50)await page.screenshot({path:`${out}/frames/${String(i).padStart(3,'0')}.png`});if(await page.getByRole('button',{name:'重播呢場'}).isVisible())break;await page.waitForTimeout(250);}
 assert(seen.size>=3,browserName+' external-art-rotation');assert(await page.getByRole('button',{name:'重播呢場'}).isVisible(),browserName+' playback-natural-finish');
 await page.getByRole('button',{name:'睇演武首領'}).click();assert((await page.locator('.ink-unified-context').innerText()).includes('演武台'),browserName+' scenario-switch');await ctx.close();
 const reduced=await browser.newContext({viewport:{width:320,height:690},deviceScaleFactor:2,reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto('http://127.0.0.1:5177/?battle-preview=unified&kind=spar',{waitUntil:'networkidle'});assert(await rp.locator('.ink-unified-battle').isVisible(),browserName+' reduced-motion-visible');await rp.getByRole('button',{name:'跳過 ›',exact:true}).click();assert(await rp.getByRole('button',{name:'重播呢場'}).isVisible(),browserName+' reduced-motion-skip');await reduced.close();await browser.close();
}
assert(report.errors.length===0,'no-pageerrors');assert(report.requests.length===0,'no-failed-assets');fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));console.log('passed',report.checks.length);
