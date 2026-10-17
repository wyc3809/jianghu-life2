// 真實十連揭曉→人物武學→指定五格裝備；保留原有學習／收藏，唔額外收費。
import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.env.QA_EVIDENCE_DIR ?? 'production/qa/evidence/redesign/five-martial-loadout';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],seed:42};
function check(pass,name){report.checks.push({name,pass:!!pass});fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));if(!pass)throw Error(name);}
async function seed(page){
 await page.goto('http://127.0.0.1:5177/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const app=await(await fetch('/src/App.tsx')).text(),main=await(await fetch('/src/main.tsx')).text();
  const{useLifeStore:s}=await import(app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1]);
  const{useAncestryStore:a}=await import(main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1]);
  const{createNewLife}=await import('/core/life/gameState.ts');const{emptyAncestry}=await import('/core/life/ancestry.ts');
  const{FREE_POOL,pull}=await import('/core/life/gacha.ts');const{schoolGachaPools}=await import('/core/life/schoolGachaPools.ts');const{getSkillDef}=await import('/data/skills/catalog.ts');
  const meta=emptyAncestry();meta.jade={free:6000,paidTest:0};
  let preview;
  for(let i=0;i<30;i++){meta.gacha={pulls:i*10,banners:{},selection:{jianghu:schoolGachaPools('jianghu','qingling')[0].id}};preview=pull(structuredClone(meta),'jianghu',10);if(new Set(preview.map(r=>getSkillDef(r.id).kind)).size===3)break;}
  const state=createNewLife({seed:42,name:'黃青雲',skipCoach:true});state.phase='playing';state.pending=null;state.tab='jianghu';state.character.flags.newbie_done=true;state.character.flags.coach_done=true;
  const kinds=['external','internal','qinggong'];const original=kinds.map(kind=>FREE_POOL.find(id=>getSkillDef(id).kind===kind&&!preview.some(r=>r.id===id)));
  state.character.skills=original;state.character.equippedArts=[...original,null,null];state.character.skillRanks=Object.fromEntries(original.map(id=>[id,1]));
  a.setState({meta,lastPull:null,jadeToast:0,milestoneToast:[],encounterOpen:false});s.setState({state,lastResult:null,combatReplay:null,flashLines:[],sealText:null});
  window.qaLifeStore=s;window.qaAncestryStore=a;window.qaDefs=getSkillDef;window.qaOldArts=original;
 });
 await page.getByRole('button',{name:/抽十次/}).click();
 await page.evaluate(()=>{window.qaAncestryStore.getState().clearJadeToast();window.qaAncestryStore.getState().clearMilestoneToast();});
}
for(const[name,type]of[['chromium',chromium],['webkit',webkit]])for(const[width,height]of[[320,690],[390,844]]){
 const browser=await type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>report.errors.push(e.message));await seed(page);
  const tag=`${name}-${width}`;
  const baseline=await page.evaluate(()=>({jade:structuredClone(window.qaAncestryStore.getState().meta.jade),pulls:window.qaAncestryStore.getState().meta.gacha.pulls,manuals:structuredClone(window.qaAncestryStore.getState().meta.manuals)}));
  const cases=await page.evaluate(()=>['external','internal','qinggong'].map(kind=>{const r=window.qaAncestryStore.getState().lastPull.find(r=>window.qaDefs(r.id).kind===kind);return{...r,kind,name:window.qaDefs(r.id).name}}));
  check(cases.every(r=>r.id),tag+' deterministic-draw-has-three-types');
  const dialog=page.getByRole('dialog',{name:/武學令：/});
  const webgl=await page.evaluate(async()=>{const{canUseWebGL}=await import('/src/fx/highlight/index.ts');return canUseWebGL();});
  if(webgl){
   await dialog.waitFor();await dialog.getByRole('button',{name:'跳過 ›',exact:true}).click();
   await page.waitForFunction(()=>{const btn=[...document.querySelectorAll('[role="dialog"] button')].find(e=>e.textContent.trim()==='領取');return btn&&!btn.disabled;},null,{timeout:45000});
   const index=await page.evaluate(id=>window.qaAncestryStore.getState().lastPull.findIndex(r=>r.id===id),cases[0].id);
   await dialog.locator('button[data-card]').nth(index).click();
   check(await dialog.getByRole('button',{name:`馬上裝備：${cases[0].name}`,exact:true}).isEnabled(),tag+' written-action-available-in-real-reveal');
   if(width===390)await page.screenshot({path:`${out}/${name}-reveal.png`});
   await dialog.getByRole('button',{name:`馬上裝備：${cases[0].name}`,exact:true}).click();
   await dialog.waitFor({state:'detached'});
  }else await page.locator('.ink-pull-results').getByRole('button',{name:`馬上裝備：${cases[0].name}`,exact:true}).first().click();
  for(let i=0;i<cases.length;i++){
   const r=cases[i];
   if(i){await page.getByRole('navigation',{name:'分卷'}).getByRole('button',{name:'江湖',exact:true}).click();await page.locator('.ink-pull-results').getByRole('button',{name:`馬上裝備：${r.name}`,exact:true}).first().click();}
   await page.getByRole('region',{name:'武學裝備'}).waitFor();
   check(await page.evaluate(id=>{const s=window.qaLifeStore.getState().state;return s.tab==='person'&&!s.character.skills.includes(id)&&!s.character.equippedArts.includes(id)},r.id),tag+' '+r.kind+' redirect-does-not-learn-or-equip');
   check((await page.locator('.ink-loadout-selection').innerText()).includes(r.name),tag+' '+r.kind+' selected-art-carried-to-person');
   check(await page.locator('.ink-loadout-slot').count()===5,tag+' five-visible-slots');
   check(await page.locator('.ink-loadout-selection').evaluate(el=>{const r=el.getBoundingClientRect(),b=el.closest('.ink-play-body').getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom}),tag+' '+r.kind+' selected-art-visible-after-redirect');
   if(width===390&&i===0)await page.screenshot({path:`${out}/${name}-choose-slot.png`});
   const slot=i===0?3:i===1?4:1;const verb=i===2?'替換':'裝備';
   await page.getByRole('button',{name:`${verb}${r.name}至欄位${slot+1}`,exact:true}).click();
   const got=await page.evaluate(({r,slot})=>{const s=window.qaLifeStore.getState().state,a=window.qaAncestryStore.getState();return{equipped:s.character.equippedArts[slot]===r.id,learned:s.character.skills.filter(id=>id===r.id).length===1,oldKept:window.qaOldArts.every(id=>s.character.skills.includes(id)),volumes:r.vol?s.character.volumes[r.id].includes(r.vol):true,jade:a.meta.jade,pulls:a.meta.gacha.pulls,manuals:a.meta.manuals}}, {r,slot});
   check(got.equipped&&got.learned&&got.oldKept&&got.volumes,tag+' '+r.kind+' explicit-slot-equips-and-keeps-originals');
   check(JSON.stringify(got.jade)===JSON.stringify(baseline.jade)&&got.pulls===baseline.pulls&&JSON.stringify(got.manuals)===JSON.stringify(baseline.manuals),tag+' '+r.kind+' no-extra-cost-or-collection-change');
  }
  check(await page.evaluate(()=>window.qaLifeStore.getState().state.character.equippedArts.filter(Boolean).length===5),tag+' five-filled-with-mixed-types-and-schools');
  check(await page.locator('.ink-loadout-slot').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth})),tag+' slots-fit-mobile-width');
  check(await page.locator('.ink-loadout-slot button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.width>=44})),tag+' slot-touch-targets');
  if(width===390){await page.locator('.ink-loadout').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/${name}-five-equipped.png`});}
  await page.getByRole('button',{name:new RegExp('^卸下欄位4：')}).click();
  check(await page.evaluate(()=>window.qaLifeStore.getState().state.character.equippedArts[3]===null),tag+' unload-keeps-empty-slot');
  await page.waitForTimeout(500);
  check(await page.evaluate(async()=>{const{loadLifeSave}=await import('/core/life/saveIndexedDb.ts');const saved=await loadLifeSave();return JSON.stringify(saved.state.character.equippedArts)===JSON.stringify(window.qaLifeStore.getState().state.character.equippedArts)}),tag+' five-slot-state-persisted');
  check(!await page.getByText('即學即裝',{exact:true}).count(),tag+' no-colloquial-auto-equip-copy');
  await context.close();console.log('passed',tag);
 }finally{await browser.close();}
}
check(!report.errors.length,'no-page-errors');console.log('Passed',report.checks.length);
