import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/battle-ink-entrance';
fs.mkdirSync(out+'/frames',{recursive:true});
async function boot(page,kind){
 const time=new Date('2026-10-14T12:00:00Z');await page.clock.install({time});await page.clock.pauseAt(time);
 await page.goto(`http://127.0.0.1:5177/?battle-preview=unified&kind=${kind}`,{waitUntil:'networkidle'});
 for(let i=0;i<160;i++){if(await page.locator('.ink-battle-entrance[data-phase="revealing"]').count())return;await page.clock.runFor(16);await page.waitForTimeout(20)}
 throw Error('揭幕未啟動');
}
async function hp(page){return page.locator('.ink-unified-hp').evaluateAll(rows=>rows.map(el=>el.getAttribute('aria-label')))}

const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});await boot(p,'spar');const before=await hp(p);await p.clock.runFor(120);
const snapshot=await p.locator('.ink-battle-entrance').evaluate(el=>{const ctx=el.getContext('2d');return {progress:Number(el.dataset.progress),alphas:[[1,1],[el.width-2,1],[1,el.height-2],[el.width-2,el.height-2]].map(([x,y])=>ctx.getImageData(x,y,1,1).data[3])}});
const after=await hp(p);const pass=snapshot.progress<.25&&snapshot.alphas.every(a=>a===255)&&JSON.stringify(before)===JSON.stringify(after);fs.writeFileSync(out+'/paper-coverage.json',JSON.stringify({...snapshot,hpUnchanged:JSON.stringify(before)===JSON.stringify(after),pass},null,2));await b.close();if(!pass)throw Error('紙底遮實檢查失敗');console.log('opaque-paper-and-gate passed');
