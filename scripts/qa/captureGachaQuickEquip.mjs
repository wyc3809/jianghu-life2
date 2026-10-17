// 真實抽卡與收藏／主修 store：結果原地裝備，不額外扣玉石或刪舊武學。
import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.env.QA_EVIDENCE_DIR ?? 'production/qa/evidence/redesign/gacha-quick-equip';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[]};
function check(pass,name){report.checks.push({name,pass:!!pass});fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));if(!pass)throw Error(name);}
async function seed(page,port='5177'){
 await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle'});
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
  state.character.skills=original;state.character.mainArts=Object.fromEntries(kinds.map((kind,i)=>[kind,original[i]]));state.character.skillRanks=Object.fromEntries(original.map(id=>[id,1]));
  a.setState({meta,lastPull:null,jadeToast:0,milestoneToast:[],encounterOpen:false});s.setState({state,lastResult:null,combatReplay:null,flashLines:[],sealText:null});
  window.qaLifeStore=s;window.qaAncestryStore=a;window.qaDefs=getSkillDef;window.qaOldArts=original;
 });
 await page.getByRole('button',{name:/抽十次/}).click();
 const hasFx=await page.evaluate(async()=>{const{canUseWebGL}=await import('/src/fx/highlight/index.ts');return canUseWebGL();});
 if(hasFx){
  const dialog=page.getByRole('dialog',{name:/武學令：/});
  await dialog.waitFor({timeout:20000});await dialog.getByRole('button',{name:'跳過 ›',exact:true}).click();
  const claim=dialog.getByRole('button',{name:'領取',exact:true});await claim.waitFor();
  await page.waitForFunction(()=>{const btn=[...document.querySelectorAll('[role="dialog"] button')].find(e=>e.textContent.trim()==='領取');return btn&&!btn.disabled;},null,{timeout:45000}).catch(async e=>{console.log('FX_WAIT',await page.evaluate(()=>({phase:document.querySelector('[data-phase]')?.getAttribute('data-phase'),text:document.body.innerText.slice(-700)})));await page.screenshot({path:out+'/debug-fx.png'});throw e;});
  await dialog.locator('button[data-card]').last().click();
  const r=await page.evaluate(()=>{const r=window.qaAncestryStore.getState().lastPull.at(-1);return{...r,kind:window.qaDefs(r.id).kind,name:window.qaDefs(r.id).name};});
  if(page.viewportSize().width===390)await page.screenshot({path:`${out}/${page.context().browser().browserType().name()}-reveal-before.png`});
  await dialog.getByRole('button',{name:`即學即裝：${r.name}`,exact:true}).click();
  check(await page.evaluate(r=>window.qaLifeStore.getState().state.character.mainArts[r.kind]===r.id,r),`${page.context().browser().browserType().name()}-${page.viewportSize().width} equip-inside-reveal-without-leaving`);
  check(await dialog.getByRole('button',{name:`已裝備：${r.name}`,exact:true}).isDisabled(),'reveal-equipped-status');
  const fit=await dialog.locator('.ink-pull-equip-btn').boundingBox();check(fit.x>=0&&fit.x+fit.width<=page.viewportSize().width&&fit.y+fit.height<=690,'reveal-equip-button-visible');
  if(page.viewportSize().width===390)await page.screenshot({path:`${out}/${page.context().browser().browserType().name()}-reveal-after.png`});
  await claim.click();await dialog.waitFor({state:'detached'});
 }
 await page.locator('.ink-pull-results li').first().waitFor();
 await page.waitForTimeout(900);
 await page.evaluate(()=>{window.qaAncestryStore.getState().clearJadeToast();window.qaAncestryStore.getState().clearMilestoneToast();});
}
for(const[name,type]of[['chromium',chromium],['webkit',webkit]])for(const width of [320,390]){
 const browser=await type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
 const context=await browser.newContext({viewport:{width,height:690},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(e.message));
 await seed(page);
 const tag=`${name}-${width}`;
 check(await page.locator('.ink-pull-equip-btn').count()===10,tag+' all-ten-results-have-equip');
 const before=await page.evaluate(()=>({jade:structuredClone(window.qaAncestryStore.getState().meta.jade),pulls:window.qaAncestryStore.getState().meta.gacha.pulls,manuals:structuredClone(window.qaAncestryStore.getState().meta.manuals)}));
 const cases=await page.evaluate(()=>['external','internal','qinggong'].map(kind=>{const r=window.qaAncestryStore.getState().lastPull.find(r=>window.qaDefs(r.id).kind===kind);return{...r,kind,name:window.qaDefs(r.id).name}}));
 await page.locator('.ink-pull-card').first().scrollIntoViewIfNeeded();
 if(width===390)await page.screenshot({path:`${out}/${name}-before-equip.png`});
 for(const r of cases){
  const button=page.getByRole('button',{name:`即學即裝：${r.name}`,exact:true}).first();
  if(!await page.getByRole('button',{name:`已裝備：${r.name}`,exact:true}).first().count())await button.click();
  const got=await page.evaluate(r=>{const st=window.qaLifeStore.getState().state,a=window.qaAncestryStore.getState();return{equipped:st.character.mainArts[r.kind]===r.id,learned:st.character.skills.filter(id=>id===r.id).length===1,oldKept:window.qaOldArts.every(id=>st.character.skills.includes(id)),samePage:st.tab==='jianghu',volumes:r.vol?st.character.volumes[r.id].includes(r.vol):true,jade:a.meta.jade,pulls:a.meta.gacha.pulls,manuals:a.meta.manuals}},r);
  check(got.equipped&&got.learned&&got.oldKept&&got.samePage&&got.volumes,tag+' '+r.kind+' learns-equips-keeps-original-and-volumes');
  check(JSON.stringify(got.jade)===JSON.stringify(before.jade)&&got.pulls===before.pulls&&JSON.stringify(got.manuals)===JSON.stringify(before.manuals),tag+' '+r.kind+' no-extra-cost-or-collection-change');
  check(await page.getByRole('button',{name:`已裝備：${r.name}`,exact:true}).first().isDisabled(),tag+' '+r.kind+' equipped-status-prevents-repeat');
 }
 const rest=await page.evaluate(()=>window.qaAncestryStore.getState().lastPull.find(r=>window.qaDefs(r.id).kind==='external'&&window.qaLifeStore.getState().state.character.mainArts.external!==r.id));
 if(rest){const r=await page.evaluate(r=>({...r,name:window.qaDefs(r.id).name}),rest);await page.getByRole('button',{name:`即學即裝：${r.name}`,exact:true}).first().click();check(await page.evaluate(id=>window.qaLifeStore.getState().state.character.mainArts.external===id,r.id),tag+' replace-same-kind-on-results');}
 const bounds=await page.evaluate(()=>[...document.querySelectorAll('.ink-pull-equip-btn')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>=44}));
 check(bounds,tag+' narrow-buttons-fit-and-touch-targets');
 if(width===390){await page.locator('.ink-pull-card').first().scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-after-equip.png`});await page.locator('.ink-pull-results').screenshot({path:`${out}/${name}-results.png`});}
 await page.waitForTimeout(700);
 check(await page.evaluate(async()=>{const {loadLifeSave}=await import('/core/life/saveIndexedDb.ts');const saved=await loadLifeSave();return JSON.stringify(saved.state.character.mainArts)===JSON.stringify(window.qaLifeStore.getState().state.character.mainArts)}),tag+' equipped-state-persisted');
 await context.close();
 }finally{await browser.close();}
}
check(!report.errors.length,'no-page-errors');console.log('Passed',report.checks.length);
