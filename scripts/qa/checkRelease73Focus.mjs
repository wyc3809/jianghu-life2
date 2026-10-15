import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/release-ea073';fs.mkdirSync(out,{recursive:true});
const prior=process.env.QA_BROWSER&&fs.existsSync(out+'/focus-qa.json')?JSON.parse(fs.readFileSync(out+'/focus-qa.json','utf8')):null;
const report={checks:prior?prior.checks.filter(c=>c.name.startsWith('chromium-')):[],errors:[],failedAssets:[]};
function check(pass,name){report.checks.push({name,pass:!!pass});fs.writeFileSync(out+'/focus-qa.json',JSON.stringify(report,null,2));if(!pass)throw Error(name)}
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

for(const[name,type]of[['chromium',chromium],['webkit',webkit]])for(const kind of ['spar-win','event-boss']){
 const browser=await type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});const page=await browser.newPage({viewport:{width:390,height:844}});await seed(page,kind,9);await page.locator('.ink-battle-entrance').waitFor({state:'detached'});
 check(await page.locator('.scroll-shell').getAttribute('inert')!==null,name+'-'+kind+'-background-inert');check(await page.evaluate(()=>document.activeElement?.classList.contains('ink-unified-battle')),name+'-'+kind+'-focus-inside-modal');await page.getByRole('button',{name:'跳過 ›',exact:true}).click();await page.locator('.ink-unified-battle').waitFor({state:'detached',timeout:15000});check(await page.locator('.scroll-shell').getAttribute('inert')===null,name+'-'+kind+'-background-restored');await browser.close();
}
console.log('focus passed',report.checks.length);
