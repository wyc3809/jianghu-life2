import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/release-ea073';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],failedAssets:[]};
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

fs.mkdirSync(out+'/frames',{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const kind of ['spar-win','event-boss']){
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const page=await ctx.newPage();await seed(page,kind,9);
 await page.evaluate(async()=>{const src=await(await fetch('/src/main.tsx')).text();const path=src.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1];const{useAncestryStore}=await import(path);useAncestryStore.getState().clearJadeToast();useAncestryStore.getState().clearMilestoneToast()});
 const dir=out+'/frames/'+kind;fs.mkdirSync(dir,{recursive:true});const times=[];
 for(let i=0;i<90;i++){times.push(performance.now());await page.screenshot({path:dir+'/'+String(i).padStart(3,'0')+'.png'});if(i>15&&await page.locator('.ink-unified-battle').count()===0)break;await page.waitForTimeout(60)}
 fs.writeFileSync(dir+'/times.json',JSON.stringify(times));await ctx.close();
}
await browser.close();console.log('recorded-real-release-battles');
