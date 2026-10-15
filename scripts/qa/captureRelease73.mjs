import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/release-ea073';fs.mkdirSync(out,{recursive:true});
const prior=process.env.QA_BROWSER&&fs.existsSync(out+'/browser-qa.json')?JSON.parse(fs.readFileSync(out+'/browser-qa.json','utf8')):null;
const report={checks:prior?prior.checks.filter(c=>c.name.startsWith('chromium-')):[],errors:[],failedAssets:[]};
function check(pass,name){report.checks.push({name,pass:!!pass});fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));if(!pass)throw Error(name)}
async function seed(page,kind,month){
 await page.goto('http://127.0.0.1:5177/',{waitUntil:'networkidle'});
 await page.evaluate(async({kind,month})=>{
  const{createNewLife}=await import('/core/life/gameState.ts');const{startCombat}=await import('/core/life/combat.ts');
  const appSource=await(await fetch('/src/App.tsx')).text();
  const storePath=appSource.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];
  const{useLifeStore}=await import(storePath);window.qaLifeStore=useLifeStore;
  const s=createNewLife({seed:42,name:'黃問天',skipCoach:true});s.phase='playing';s.pending=null;s.tab='home';s.month=month;
  const c=s.character;c.age=19;c.flags.newbie_done=true;c.flags.spar_stage=2;c.maxHealth=261;c.health=261;c.money=103;c.martial=kind==='spar-win'?200:0;
  c.skills=['art_river_fist','art_rain_sword','art_thunder_blade'];c.mainArts={external:c.skills[0]};c.skillRanks=Object.fromEntries(c.skills.map(id=>[id,1]));c.volumes={art_river_fist:[1,6],art_rain_sword:[1,3],art_thunder_blade:[1,2]};
  if(kind.startsWith('event'))startCombat(s,{source:'event',title:'鏢旗告急',foeName:kind==='event-boss'?'鎮上惡霸':'黑衣刀客',foePower:kind==='event-boss'?'boss':'strong',lifeOrDeath:false});
  window.qa73={clears:0,commits:0};const original=useLifeStore.getState().combatAutoCommit;
  useLifeStore.setState({state:s,lastResult:null,combatReplay:null,combatAutoCommit:()=>{window.qa73.commits++;original()}});
 },{kind,month});
 if(kind.startsWith('spar')){
  await page.waitForFunction(()=>window.__sparDuel&&window.__sparStage);
  await page.evaluate(async()=>{
   const useLifeStore=window.qaLifeStore;const{useAncestryStore}=await import('/src/store/ancestryStore.ts');
   useAncestryStore.getState().clearJadeToast();useAncestryStore.getState().clearMilestoneToast();
   const meta=window.qa73,d=window.__sparDuel;meta.canvas=document.querySelector('.ink-spar-stage canvas');meta.duel=d;meta.engine=window.__sparStage;
   const original=useLifeStore.getState().sparStageClear;useLifeStore.setState({sparStageClear:n=>{meta.clears++;return original(n)}});
   while(d.foe&&!d.foe.boss){d.foeHp=0;d.ensureLiveFoe()}d.heroHp=150;window.__sparStage.settleIntro();useLifeStore.getState().sparSyncHealth(150);
  });
 }
 await page.locator('.ink-unified-battle').waitFor({state:'attached'});
}
for(const[name,type]of[['chromium',chromium],['webkit',webkit]]){
 if(process.env.QA_BROWSER&&process.env.QA_BROWSER!==name)continue;
 const launch=()=>type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});let browser=await launch();
 for(const width of [320,390,420])for(const height of [690,844])for(const kind of ['spar-win','event','event-boss']){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2});const page=await ctx.newPage();const tag=`${name}-${kind}-${width}x${height}`;
  page.on('pageerror',e=>{report.errors.push(e.message);console.log('PAGEERROR',e.message)});page.on('response',r=>{if(r.status()>=400)report.failedAssets.push(r.url())});
  await seed(page,kind,width===320?3:width===390?6:12);
  if(kind.startsWith('event'))await page.evaluate(async()=>{const useLifeStore=window.qaLifeStore;const r=useLifeStore.getState().combatReplay;window.qa73.expected={health:r.next.character.health,money:r.next.character.money,phase:r.next.pendingCombat?.phase??null};window.qa73.originalHealth=useLifeStore.getState().state.character.health});
  await page.locator('.ink-battle-entrance').waitFor({state:'detached',timeout:10000});
  await page.evaluate(async()=>{const source=await(await fetch('/src/main.tsx')).text();const path=source.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1];const{useAncestryStore}=await import(path);useAncestryStore.getState().clearJadeToast();useAncestryStore.getState().clearMilestoneToast();});
  const layout=await page.evaluate(()=>{
   const bars=[...document.querySelectorAll('.ink-unified-hp .ink-brush-bar')].map(e=>e.getBoundingClientRect());const footer=document.querySelector('.ink-unified-footer').getBoundingClientRect();
   return{aligned:bars.length===2&&Math.abs(bars[0].left-bars[1].left)<.1&&Math.abs(bars[0].width-bars[1].width)<.1,
    fits:footer.bottom<=innerHeight+.1&&document.documentElement.scrollWidth<=innerWidth,
    slots:document.querySelectorAll('.ink-unified-volumes li').length===7,
    ratio:[...document.querySelectorAll('.ink-unified-hp')].every(e=>{const[a,b]=e.getAttribute('aria-label').match(/(\d+)\/(\d+)$/).slice(1).map(Number);return Math.abs(Number(e.querySelector('.ink-brush-bar').style.getPropertyValue('--pct'))-a/b*100)<.001})};
  });check(layout.aligned&&layout.fits&&layout.slots&&layout.ratio,tag+' header-bars-and-skills-fit');
  if(kind.startsWith('spar'))check(await page.evaluate(()=>window.qa73.canvas===document.querySelector('.ink-unified-battle canvas')&&window.qa73.duel===window.__sparDuel&&window.qa73.engine===window.__sparStage&&window.__sparDuel.heroHp===150&&window.__sparDuel.foeHp===window.__sparDuel.foe.maxHp),tag+' same-live-duel-and-hp-after-entrance');
  else check(await page.evaluate(async()=>{const useLifeStore=window.qaLifeStore;return window.qa73.commits===0&&useLifeStore.getState().state.character.health===window.qa73.originalHealth}),tag+' no-early-commit');
  await page.getByRole('button',{name:'加速 ×2',exact:true}).click();check(await page.getByRole('button',{name:'加速 ×2',exact:true}).getAttribute('aria-pressed')==='true',tag+' speed-toggle');
  if(width===390&&height===844)await page.screenshot({path:`${out}/${name}-${kind}.png`});
  await page.getByRole('button',{name:'跳過 ›',exact:true}).click();await page.locator('.ink-unified-battle').waitFor({state:'detached',timeout:15000});
  const result=await page.evaluate(async()=>{const useLifeStore=window.qaLifeStore;const s=useLifeStore.getState().state;const m=window.qa73;return{stage:s.character.flags.spar_stage,money:s.character.money,hp:s.character.health,clears:m.clears,commits:m.commits,expected:m.expected,phase:s.pendingCombat?.phase??null,sameCanvas:m.canvas===document.querySelector('.ink-spar-stage canvas'),sameDuel:m.duel===window.__sparDuel,sameEngine:m.engine===window.__sparStage}});
  if(kind.startsWith('spar'))check(result.stage===3&&result.money===105&&result.hp===261&&result.clears===1&&result.sameCanvas&&result.sameEngine&&result.sameDuel,tag+' win-once-return-same-canvas-full-health');
  else check(result.commits===1&&result.hp===result.expected.health&&result.money===result.expected.money&&result.phase===result.expected.phase,tag+' commits-real-result-once');
  await ctx.close();if(name==='webkit'||(height===844&&kind==='event-boss'&&width!==420)){await browser.close();browser=await launch();}
 }
 // 敗退同關重試，唔派過關獎勵；減少動態亦要播得完。
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,reducedMotion:'reduce'});const page=await ctx.newPage();page.on('pageerror',e=>{report.errors.push(e.message);console.log('PAGEERROR',e.message)});await seed(page,'spar-lose',9);await page.locator('.ink-battle-entrance').waitFor({state:'detached'});await page.getByRole('button',{name:'跳過 ›',exact:true}).click();await page.locator('.ink-unified-battle').waitFor({state:'detached',timeout:15000});
 check(await page.evaluate(async()=>{const useLifeStore=window.qaLifeStore;const s=useLifeStore.getState().state;return s.character.flags.spar_stage===2&&s.character.money===103&&s.character.health===261&&window.qa73.clears===0&&window.qa73.duel===window.__sparDuel&&!window.__sparDuel.foe.boss}),`${name}-loss-retries-same-stage-without-reward`);await ctx.close();await browser.close();
}
check(!report.errors.length,'no-page-errors');check(!report.failedAssets.length,'all-release-assets-load');console.log('passed',report.checks.length);
