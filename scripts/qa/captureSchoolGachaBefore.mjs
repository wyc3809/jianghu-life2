// a210e2f獨立工作區port5178；只讀舊版UI作改前證據。
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5178/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const app=await(await fetch('/src/App.tsx')).text(),main=await(await fetch('/src/main.tsx')).text();
  const{useLifeStore:s}=await import(app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1]);const{useAncestryStore:a}=await import(main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1]);
  const{createNewLife}=await import('/core/life/gameState.ts');const{emptyAncestry}=await import('/core/life/ancestry.ts');
  const state=createNewLife({seed:42,name:'黃青雲',skipCoach:true});state.phase='playing';state.pending=null;state.tab='jianghu';state.character.flags.newbie_done=true;state.character.flags.coach_done=true;state.character.skills=['art_silk_hand','基礎吐納','art_river_fist','art_nine_shadow','art_lake_breath','art_bridge_step'];state.character.mainArts={};state.character.skillRanks=Object.fromEntries(state.character.skills.map(id=>[id,1]));
  const meta=emptyAncestry();meta.jade={free:6000,paidTest:6000};meta.gacha={pulls:40,banners:{jianghu:{wish:'art_river_fist',sinceWish:12,total:12},zhenben:{wish:'pr_tide_step',sinceWish:39,total:39}}};
  a.setState({meta,lastPull:null,jadeToast:0,milestoneToast:[],encounterOpen:false});s.setState({state,lastResult:null,flashLines:[],sealText:null,combatReplay:null});window.qaAncestryStore=a;
 });
 await page.locator('.ink-gacha-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);await page.evaluate(()=>{window.qaAncestryStore.getState().clearJadeToast();window.qaAncestryStore.getState().clearMilestoneToast();});
 await page.screenshot({path:'production/qa/evidence/redesign/school-gacha/before.png'});
 await page.locator('.ink-gacha-stage').screenshot({path:'production/qa/evidence/redesign/school-gacha/before-pool.png'});
}finally{await browser.close();}
