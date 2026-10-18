/** 兩瀏覽器19種持武全斷網後備；核對真正解碼嘅內嵌圖內容，唔淨係查family字串。 */
import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';
const out='production/qa/evidence/redesign/martial-identities-full';const audit=JSON.parse(fs.readFileSync('production/qa/evidence/redesign/martial-identities/catalog-audit.json','utf8'));
const families=[...new Set(audit.cards.map(c=>c.family))];const report={cases:[],errors:[],note:'Chromium／WebKit手機viewport模擬，唔係iPhone實機。'};
for(const engine of ['chromium','webkit']){
 const b=await(engine==='chromium'?chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}):webkit.launch({executablePath:webkit.executablePath()}));
 for(const family of families){
  const card=audit.cards.find(c=>c.family===family);const width=[320,390,420][families.indexOf(family)%3];const c=await b.newContext({viewport:{width,height:844},deviceScaleFactor:2,reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.route('**/ink/art/martial/**',r=>r.fulfill({status:404,body:''}));
  await p.goto(`http://127.0.0.1:5188/?martial-preview=1&clean=1&pose=1&art=${encodeURIComponent(card.id)}`,{waitUntil:'networkidle'});await p.bringToFront();await p.waitForFunction(()=>window.__martialQa,null,{polling:100,timeout:60000});
  const check=await p.evaluate(id=>{const s=window.__martialBattleStage;const a=s.martialAssets.get(id);return {guard:a?.guard,src:a?.atlas.src,decoded:a?.atlas.complete&&a?.atlas.naturalWidth>0,quiet:s.quiet,overflow:document.documentElement.scrollWidth>innerWidth,active:[...s.martialAssets.keys()]};},card.id);
  const actual=check.src?.split(',')[1];const expected=fs.readFileSync(`src/fx/art/fallback/${family}.webp`);const proper=actual&&Buffer.from(actual,'base64').equals(expected);delete check.src;
  const passed=Boolean(check.guard&&check.decoded&&check.quiet&&!check.overflow&&proper&&!errors.length);
  if(['bow','palm','halberd'].includes(family))await p.screenshot({path:`${out}/fallback-${engine}-${family}.jpg`,type:'jpeg',quality:85});
  report.cases.push({engine,family,id:card.id,width,...check,properFamilyImage:proper,passed,errors});if(!passed)report.errors.push({engine,family,check,proper,errors});fs.writeFileSync(out+'/fallback-matrix.json',JSON.stringify(report,null,2)+'\n');await c.close();console.log('後備',engine,family,passed);
 }
 await b.close();
}
if(report.errors.length)process.exitCode=1;
