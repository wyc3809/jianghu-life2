import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';import fs from 'node:fs';
const out=process.cwd()+'/production/qa/evidence/redesign/spar-commercial/motion';fs.mkdirSync(out+'/frames',{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await p.getByRole('button',{name:/定種子/}).click({timeout:60000});
await p.evaluate(async()=>{const r=performance.getEntriesByType('resource');const url=r.find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);s.getState().newLife({seed:42,skipCoach:true});const n=structuredClone(s.getState().state);n.character.flags.newbie_done=true;n.character.flags.coach_done=true;n.pending=null;n.tab='home';n.month=3;s.getState().importState(n);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});});
await p.waitForFunction(()=>window.__sparStage?.art);await p.locator('.ink-spar-slot').evaluate(e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(1000);
// 畫面證據用同一正式引擎逐幀播放，唔係拼接概念圖。固定視覺時間；不改正式遊戲數值。
await p.evaluate(()=>{const s=window.__sparStage;s.__originalUpdate=s.update.bind(s);s.update=()=>{};s.settleIntro();});
const stage=p.locator('.ink-spar-stage');
for(let i=0;i<32;i++){await p.evaluate(()=>{const s=window.__sparStage;s.__originalUpdate(.04);s.render();});await stage.screenshot({path:`${out}/frames/walk-${String(i).padStart(3,'0')}.png`});}
await p.evaluate(async()=>{const s=window.__sparStage;const {loadFoeCollapse}=await import('/src/spar/presentation.ts');for(const key of ['daoke','town_boss','gate_boss']){const def=s.enemyPool.find(d=>d.part.src.includes(`enemy-${key}.webp`));s.art.deaths.set(def.part.src,await loadFoeCollapse(def.part.src));}s.enemies[0].state='dead';s.enemies[0].t=0;s.heroX=s.cssW*.5;s.attackT=null;s.heroMoving=false;});
const current=await p.evaluate(()=>window.__sparStage.enemies[0].def.part.src);
for(let i=0;i<16;i++){await p.evaluate(t=>{const s=window.__sparStage;s.enemies[0].t=t;s.render();},i*.039);await stage.screenshot({path:`${out}/frames/fall-${String(i).padStart(3,'0')}.png`});}
await p.evaluate(()=>{const s=window.__sparStage;s.setQuiet(true);s.weather=[];s.dust=[];s.afterimages=[];s.splashes=[];s.particles=[];s.floaters=[];s.heroDownT=null;s.enemies[0].state='hold';s.render();});
await stage.screenshot({path:out+'/reduced-motion.png'});
const reduced=await p.evaluate(()=>{const s=window.__sparStage;return {quiet:s.quiet,ground:s.getAnchors().heroHeadY+s.cssH*.26*.98,expected:s.cssH*.845}});
const sample=[];
// 分別用現有角色池檢視25款四幀，不只驗證檔案存在。
for(let idx=0;idx<25;idx++){
 await p.evaluate(async idx=>{const s=window.__sparStage;const {loadFoeCollapse}=await import('/src/spar/presentation.ts');const e=s.enemies[0];e.def=s.enemyPool[idx];e.state='dead';e.t=.4;e.scaleMul=1;e.boss=false;s.art.deaths.set(e.def.part.src,await loadFoeCollapse(e.def.part.src));s.render();},idx);
 if([0,1,8,9,10,15,17,23].includes(idx))await stage.screenshot({path:`${out}/enemy-${idx}.png`});
 sample.push(await p.evaluate(()=>({src:window.__sparStage.enemies[0].def.part.src,frames:window.__sparStage.art.deaths.get(window.__sparStage.enemies[0].def.part.src).length})));
}
fs.writeFileSync(out+'/validation.json',JSON.stringify({controlledVisualFixture:true,combatValuesEdited:false,fallSprite:current,reduced,sample,errors},null,2));await b.close();if(errors.length)process.exitCode=1;
