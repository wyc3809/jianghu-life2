// 真實六派選冊／舊心願保底／抽卡與分類。此矩陣測無WebGL後備，3D另用即裝回歸。
import {chromium,webkit} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.env.QA_EVIDENCE_DIR??'production/qa/evidence/redesign/school-gacha';fs.mkdirSync(out,{recursive:true});
const previous=process.env.QA_BROWSER&&fs.existsSync(out+'/browser-qa.json')?JSON.parse(fs.readFileSync(out+'/browser-qa.json','utf8')):null;
const report={checks:previous?previous.checks.filter(c=>!c.name.startsWith(process.env.QA_BROWSER)):[],errors:[],layouts:[]};
function check(pass,name){report.checks.push({name,pass:!!pass});fs.writeFileSync(out+'/browser-qa.json',JSON.stringify(report,null,2));if(!pass)throw Error(name);}
async function seed(page){
 await page.goto('http://127.0.0.1:5177/',{waitUntil:'networkidle'});
 await page.evaluate(async()=>{
  const app=await(await fetch('/src/App.tsx')).text(),main=await(await fetch('/src/main.tsx')).text();
  const{useLifeStore:s}=await import(app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1]);
  const{useAncestryStore:a}=await import(main.match(/from ["']([^"']*store\/ancestryStore\.ts[^"']*)["']/)[1]);
  const{createNewLife}=await import('/core/life/gameState.ts');const{emptyAncestry}=await import('/core/life/ancestry.ts');
  const{SKILL_DEFS,getSkillDef}=await import('/data/skills/catalog.ts');
  const{MARTIAL_SCHOOL_GROUPS}=await import('/data/redesign/martialSchools.ts');
  const{activeSchoolGachaPool}=await import('/core/life/schoolGachaPools.ts');
  const{primarySchoolOfSkill,SCHOOLS}=await import('/data/redesign/schools.ts');
  const st=createNewLife({seed:42,name:'黃青雲',skipCoach:true});st.phase='playing';st.pending=null;st.tab='jianghu';
  const c=st.character;c.flags.newbie_done=true;c.flags.coach_done=true;
  c.skills=Object.values(MARTIAL_SCHOOL_GROUPS).map(ids=>ids[0]);c.mainArts={};c.skillRanks=Object.fromEntries(c.skills.map(id=>[id,1]));
  const m=emptyAncestry();m.jade={free:6000,paidTest:6000};m.gacha={pulls:40,banners:{jianghu:{wish:'art_river_fist',sinceWish:12,total:12},zhenben:{wish:'pr_tide_step',sinceWish:39,total:39}}};
  m.manuals=Object.fromEntries(Object.keys(SKILL_DEFS).map(id=>[id,{stars:0,copies:0,vols:getSkillDef(id).kind==='external'?[1]:undefined}]));
  a.setState({meta:m,lastPull:null,jadeToast:0,milestoneToast:[],encounterOpen:false});s.setState({state:st,lastResult:null,combatReplay:null,flashLines:[],sealText:null});
  window.qaLifeStore=s;window.qaAncestryStore=a;window.qaPool=activeSchoolGachaPool;window.qaPrimary=primarySchoolOfSkill;window.qaDefs=getSkillDef;window.qaSchools=SCHOOLS;
 });
 await page.getByRole('group',{name:'抽卡流派'}).waitFor();await page.waitForTimeout(250);
 await page.evaluate(()=>{window.qaAncestryStore.getState().clearJadeToast();window.qaAncestryStore.getState().clearMilestoneToast();});
}
for(const[name,type]of[['chromium',chromium],['webkit',webkit]])for(const[width,height]of[[320,690],[390,844],[420,844]]){
 if(process.env.QA_BROWSER&&process.env.QA_BROWSER!==name)continue;
 const browser=await type.launch(name==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(String(kind).startsWith('webgl'))return null;return original.call(this,kind,...args)};});
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));await seed(page);
  const tag=`${name}-${width}x${height}`;
  check(await page.evaluate(()=>window.qaPool(window.qaAncestryStore.getState().meta,'jianghu').free.includes('art_river_fist')),tag+' legacy-free-wish-routed-to-correct-book');
  await page.getByRole('tab',{name:/珍本奇功/}).click();
  check(await page.getByLabel('心願',{exact:true}).inputValue()==='pr_tide_step',tag+' legacy-premium-wish-kept');
  check(await page.evaluate(()=>window.qaAncestryStore.getState().meta.gacha.banners.zhenben.sinceWish===39),tag+' legacy-pity-kept');
  const groups=await page.evaluate(()=>window.qaSchools.map(s=>s.name));
  const labelsFit=()=>page.locator('.ink-school-tabs').evaluateAll(tabs=>tabs.every(tab=>[...tab.querySelectorAll('button')].every(button=>{
   const r=button.getBoundingClientRect();return r.height>=44&&r.width>=44&&button.scrollWidth<=button.clientWidth&&[...button.querySelectorAll('strong,small')].every(label=>{const t=label.getBoundingClientRect();return t.left>=r.left&&t.right<=r.right&&t.top>=r.top&&t.bottom<=r.bottom&&label.scrollWidth<=label.clientWidth});
  })));
  check(await labelsFit(),tag+' full-school-names-and-focus-fit-touch-buttons');
  check(await page.evaluate(()=>window.qaSchools.map(s=>s.name).join('、')==='修羅血戰道、長河疊浪、摧鋒破陣、鎖脈擒龍、不動金剛、逍遙遊'),tag+' confirmed-six-full-names');
  for(const banner of ['jianghu','zhenben']){
   await page.getByRole('tab',{name:banner==='jianghu'?/江湖秘笈/:/珍本奇功/}).click();
   for(const school of groups){
    await page.getByRole('group',{name:'抽卡流派'}).getByRole('button',{name:`選${school}流派`,exact:true}).click();
    const details=page.locator('.ink-school-pool-preview');await details.locator('summary').click();
    const data=await page.evaluate(banner=>{const m=window.qaAncestryStore.getState().meta,p=window.qaPool(m,banner);return{pool:p,pity:m.gacha.banners[banner].sinceWish,options:[...document.querySelector('[aria-label="心願"]').options].filter(o=>o.value).map(o=>o.value)}},banner);
    check(await page.getByRole('list',{name:'本冊可得武學'}).locator('li').count()===data.pool.arts.length&&data.pool.arts.length>=6&&data.pool.arts.length<=8,tag+' '+banner+' '+school+' preview-6-to-8');
    check(JSON.stringify(data.options)===JSON.stringify(banner==='zhenben'?data.pool.premium:data.pool.free),tag+' '+banner+' '+school+' wishlist-matches-book');
    check(data.pity===(banner==='jianghu'?12:39),tag+' '+banner+' '+school+' switch-keeps-pity');
    if(banner==='jianghu'&&await page.getByLabel('揀流派小冊').count()){
     const select=page.getByLabel('揀流派小冊');const values=await select.locator('option').evaluateAll(es=>es.map(e=>e.value));await select.selectOption(values.at(-1));
     check(await page.evaluate(banner=>window.qaPool(window.qaAncestryStore.getState().meta,banner).id,banner)===values.at(-1),tag+' '+school+' select-another-book');
     await page.locator('.ink-school-pool-preview summary').click();
    }
    if(width===390&&((banner==='jianghu'&&school===groups[1])||(banner==='zhenben'&&school===groups[5]))){await page.locator('.ink-school-pool').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);await page.screenshot({path:`${out}/${name}-${banner}-${school}.png`});await page.locator('.ink-school-pool').screenshot({path:`${out}/${name}-${banner}-pool.png`});}
   }
  }
  // 39/40舊保底實際抽一次，仍喺本冊，免費／付費分開扣。
  const wish=await page.evaluate(()=>window.qaPool(window.qaAncestryStore.getState().meta,'zhenben').premium.find(id=>!window.qaLifeStore.getState().state.character.skills.includes(id)));
  await page.getByLabel('心願',{exact:true}).selectOption(wish);
  const before=await page.evaluate(()=>structuredClone(window.qaAncestryStore.getState().meta.jade));
  await page.getByRole('button',{name:/抽一次/}).click();await page.locator('.ink-pull-results li').waitFor();
  check(await page.evaluate(({wish,before})=>{const a=window.qaAncestryStore.getState();return a.lastPull.length===1&&a.lastPull[0].id===wish&&a.meta.jade.free===before.free&&a.meta.jade.paidTest===before.paidTest-60&&a.meta.gacha.banners.zhenben.sinceWish===0},{wish,before}),tag+' old-pity-draws-wish-and-spends-only-paid');
  await page.locator('.ink-pull-results').getByRole('button',{name:/即學即裝/}).click();
  check(await page.evaluate(wish=>{const s=window.qaLifeStore.getState().state;return s.character.skills.includes(wish)&&s.character.mainArts[window.qaDefs(wish).kind]===wish&&s.tab==='jianghu'},wish),tag+' real-pull-quick-equip-still-works');
  await page.getByRole('tab',{name:/江湖秘笈/}).click();
  check((await page.getByLabel('抽取結果來源').innerText()).includes('珍本奇功')&&(await page.getByLabel('抽取結果來源').innerText()).includes('目前已切換小冊'),tag+' previous-results-keep-correct-source-after-switch');
  await page.getByRole('button',{name:/家族收藏/}).click();
  const collection=page.getByRole('group',{name:'收藏流派分類'});await collection.getByRole('button',{name:`選${groups[5]}流派`,exact:true}).click();
  check(await page.locator('.ink-shelf > li').count()===18,tag+' all-existing-collection-sorted-by-primary');
  check(await labelsFit(),tag+' collection-long-name-buttons-fit');
  if(width===390){await collection.scrollIntoViewIfNeeded();await page.waitForTimeout(1200);await page.screenshot({path:`${out}/${name}-collection.png`});}
  await page.getByRole('navigation',{name:'分卷'}).getByRole('button',{name:'鎮居',exact:true}).click();
  await page.getByRole('navigation',{name:'功能入口'}).getByRole('button',{name:'武學',exact:true}).click();
  const learned=page.getByRole('group',{name:'已學武學流派分類'});await learned.getByRole('button',{name:`選${groups[2]}流派`,exact:true}).click();
  check(await page.locator('.ink-skill-cards > li').count()===await page.evaluate(()=>window.qaLifeStore.getState().state.character.skills.filter(id=>window.qaPrimary(window.qaDefs(id))==='pojia').length),tag+' person-skills-filter-matches-classification');
  check(await labelsFit(),tag+' person-long-name-buttons-fit');
  if(width===390){await learned.scrollIntoViewIfNeeded();await page.waitForTimeout(1200);await page.screenshot({path:`${out}/${name}-person.png`});}
  // 多適性主修fixture：檢查五種兼修長名稱、流派小成／大成都唔撐爆手機。
  await page.evaluate(()=>{const store=window.qaLifeStore,s=structuredClone(store.getState().state),c=s.character;const ids=['mj_soul_drain','wg_root_severed_creed','qg_canopy_void'];c.skills=[...new Set([...c.skills,...ids])];for(const id of ids)c.skillRanks[id]=1;c.mainArts={external:ids[0],internal:ids[1],qinggong:ids[2]};store.setState({state:s});});
  await page.locator('.ink-main-arts').scrollIntoViewIfNeeded();
  check(await page.locator('.ink-main-arts').evaluate(el=>[el,...el.querySelectorAll('.ink-main-slot,.ink-main-slot-tags,.ink-school-row')].every(e=>e.scrollWidth<=e.clientWidth)),tag+' multi-affinity-main-and-synergy-long-labels-fit');
  check(await page.locator('.ink-main-slot').nth(1).locator('.ink-school-tag').count()===5,tag+' all-five-internal-affinities-preserved');
  if(width===390){await page.waitForTimeout(1200);await page.screenshot({path:`${out}/${name}-main-arts.png`});}
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.scroll-shell').scrollTop===0),tag+' fixed-frame-and-no-horizontal-overflow');
  await context.close();console.log('passed',tag);
 }finally{await browser.close();}
}
check(!report.errors.length,'no-page-errors');console.log('Passed',report.checks.length);
