/** 真正遊戲入口驗收，獨立browser context、seed42，阻擋雲端寫入。 */
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='production/qa/evidence/redesign/martial-identities';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const report={cases:[],errors:[]};
for(const kind of ['home','spar-boss','event','event-boss']){
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();
 p.on('pageerror',e=>report.errors.push({kind,error:String(e)}));
 await p.route('https://**',r=>r.abort());
 await p.goto('http://127.0.0.1:5188/',{waitUntil:'networkidle'});await p.waitForTimeout(2700);
 await p.evaluate(async kind=>{
  const{createNewLife}=await import('/core/life/gameState.ts');const{startCombat}=await import('/core/life/combat.ts');
  const app=await(await fetch('/src/App.tsx')).text();const url=app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];
  const{useLifeStore}=await import(url);window.qaLifeStore=useLifeStore;
  const s=createNewLife({seed:42,name:'黃問天',skipCoach:true});s.phase='playing';s.pending=null;s.tab='home';
  const c=s.character;c.age=19;c.flags.newbie_done=true;c.flags.spar_stage=2;c.maxHealth=1800;c.health=1800;
  c.martial=kind==='spar-boss'?100:0;
  c.equipment.weapon='old-sword';c.skills=['art_rain_sword','art_river_fist','art_stone_palm','art_wind_chase','pr_mountain_split','art_iron_body','pr_cloud_step'];
  c.equippedArts=c.skills.slice(0,5);c.supportArts={internal:'art_iron_body',qinggong:'pr_cloud_step'};
  c.mainArts={external:'art_rain_sword',internal:'art_iron_body',qinggong:'pr_cloud_step'};
  c.skillRanks=Object.fromEntries(c.skills.map(id=>[id,2]));c.volumes=Object.fromEntries(c.equippedArts.map(id=>[id,[1,2]]));
  if(kind.startsWith('event'))startCombat(s,{source:'event',title:'鏢旗告急',foeName:kind==='event-boss'?'鎮上惡霸':'黑衣刀客',foePower:kind==='event-boss'?'boss':'strong',lifeOrDeath:false});
  useLifeStore.setState({state:s,lastResult:null,combatReplay:null});
 },kind);
 if(kind==='home'||kind==='spar-boss'){
  await p.bringToFront();await p.waitForFunction(()=>window.__sparStage&&window.__sparDuel,null,{polling:100});
  if(kind==='spar-boss'){
   // 走真正過小兵流程，唔直接改foe，避免繞過產品嘅boss揭幕同步。
   await p.locator('.ink-unified-battle').waitFor({state:'attached',timeout:60000});
  }
 }else {await p.bringToFront();await p.waitForFunction(()=>window.__martialBattleStage,null,{polling:100});}
 await p.waitForTimeout(1400);
 const result=await p.evaluate(kind=>{
  const s=kind.startsWith('event')?window.__martialBattleStage:window.__sparStage;
  const state=window.qaLifeStore.getState().state;
  return {assets:[...s.martialAssets.keys()],weapon:s.weaponDef?.src,presentation:s.presentation,
   externalSlots:state.character.equippedArts.filter(Boolean).length,supports:state.character.supportArts,
   overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('canvas')?.width};
 },kind);
 if(!result.assets.includes('art_river_fist')||result.externalSlots!==5||result.overflow)throw Error('入口檢查失敗 '+kind+' '+JSON.stringify(result));
 await p.screenshot({path:`${out}/product-${kind}.png`});
 report.cases.push({kind,...result});fs.writeFileSync(`${out}/product-entry-report.json`,JSON.stringify(report,null,2));await c.close();console.log('真正入口',kind,'通過');
}
await b.close();fs.writeFileSync(`${out}/product-entry-report.json`,JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
