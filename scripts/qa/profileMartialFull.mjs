/** 單一桌面Chromium實際RAF；新武學圖片RGBA係尺寸估算，唔當裝置GPU峰值。 */
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';import fs from 'node:fs';
const report={platform:'Linux桌面無頭Chromium，390×844 DPR2；非iPhone實機',samples:[],limits:'RGBA只估當前新武學image解碼尺寸；唔包括瀏覽器、場景、字體或GPU複本，唔係峰值記憶體。'};const out='production/qa/evidence/redesign/martial-identities-full';
for(const scenario of ['art_bow_star','pr_blood_lotus','five-rare-two-support']){
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();await p.addInitScript(()=>performance.setResourceTimingBufferSize(5000));const start=Date.now();
 await p.route('https://**',r=>r.abort());
 if(scenario!=='five-rare-two-support'){
  await p.goto(`http://127.0.0.1:5188/?martial-preview=1&clean=1&art=${scenario}&source=spar`,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__martialQa,null,{polling:100});
 }else{
  await p.goto('http://127.0.0.1:5188/',{waitUntil:'networkidle'});await p.evaluate(async()=>{
   const {createNewLife}=await import('/core/life/gameState.ts');const app=await(await fetch('/src/App.tsx')).text();const url=app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];const {useLifeStore}=await import(url);
   const s=createNewLife({seed:42,name:'黃問天',skipCoach:true});s.phase='playing';s.pending=null;s.tab='home';const c=s.character;c.age=19;c.flags.newbie_done=true;c.flags.spar_stage=12;c.maxHealth=1800;c.health=1800;c.maxQi=4000;c.qi=4000;c.equipment.weapon='old-sword';
   c.skills=['pr_blood_lotus','pr_crimson_moon','pr_nine_chain','pr_heaven_spear','pr_soul_lock','pr_thunder_heart','pr_tide_step'];c.equippedArts=c.skills.slice(0,5);c.supportArts={internal:'pr_thunder_heart',qinggong:'pr_tide_step'};c.mainArts={external:c.skills[0],internal:'pr_thunder_heart',qinggong:'pr_tide_step'};c.skillRanks=Object.fromEntries(c.skills.map(id=>[id,2]));c.volumes=Object.fromEntries(c.equippedArts.map(id=>[id,[1,2,3,4,5,6,7]]));useLifeStore.setState({state:s,lastResult:null,combatReplay:null});
  });await p.waitForFunction(()=>window.__sparStage&&window.__sparStage.martialAssets.size===7,null,{polling:100,timeout:60000});
 }
 await p.bringToFront();const readyMs=Date.now()-start;
 const sample=await p.evaluate(async scenario=>{
  const stage=scenario==='five-rare-two-support'?window.__sparStage:window.__martialBattleStage;const times=[];let previous=0;await new Promise(resolve=>{const tick=t=>{if(previous)times.push(t-previous);previous=t;if(times.length<180)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  const sorted=[...times].sort((a,b)=>a-b);const imgs=new Set();for(const a of stage.martialAssets.values()){imgs.add(a.atlas);for(const v of Object.values(a.variants??{}))if(v)imgs.add(v);for(const v of Object.values(a.effects??{}))if(v)imgs.add(v);for(const v of Object.values(a.identityEffects??{}))if(v)imgs.add(v);}
  return {frames:times.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),over33ms:times.filter(t=>t>33.4).length,activeArts:[...stage.martialAssets.keys()],newImageRgbaEstimate:[...imgs].reduce((n,im)=>n+im.naturalWidth*im.naturalHeight*4,0),jsHeap:performance.memory?.usedJSHeapSize??null,resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/ink/art/martial/')).map(r=>({name:r.name.split('/').at(-1),bytes:r.transferSize}))};
 },scenario);report.samples.push({scenario,readyMs,...sample});await b.close();fs.writeFileSync(out+'/performance.json',JSON.stringify(report,null,2)+'\n');console.log(scenario,'p95',sample.p95,'RGBA',sample.newImageRgbaEstimate);
}
