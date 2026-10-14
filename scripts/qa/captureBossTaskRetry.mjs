// 第22項：固定情境驗證設定對齊、移除墨及三種數值條。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve(process.env.QA_OUT || 'production/qa/evidence/redesign/boss-task-retry');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};

async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
await page.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);


await page.evaluate(()=>{window.__qaCanvas=document.querySelector('.ink-spar-stage canvas');const d=window.__sparDuel;d.hero.atk=0;d.foe.atk=0;d.foeHp=1e9;});
for(const width of [320,390,420]) for(const height of [690,844]) {
 await page.setViewportSize({width,height});await page.waitForTimeout(160);
 const task=page.locator('.ink-task-bar');const y=await task.evaluate(e=>e.getBoundingClientRect().y);
 await page.locator('.ink-quick').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(160);
 report.checks.push({name:`${width}x${height}任務固定`,passed:Math.abs(y-await task.evaluate(e=>e.getBoundingClientRect().y))<.6});
 report.checks.push({name:`${width}x${height}內容視窗預留任務空間`,passed:await page.evaluate(()=>{const s=document.querySelector('.scroll-shell').getBoundingClientRect(),t=document.querySelector('.ink-task-bar').getBoundingClientRect();return s.bottom<=t.top;})});
 report.checks.push({name:`${width}x${height}五個捷徑可點`,passed:await page.locator('.ink-quick-btn').evaluateAll(nodes=>nodes.every(e=>{const r=e.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h&&e.contains(h);}))});
 await page.screenshot({path:`${out}/task-${width}-${height}.png`});
}
await page.setViewportSize({width:390,height:844});await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);
await page.evaluate(()=>{const d=window.__sparDuel;d.idx=d.queue.length-1;d.foeHp=d.foe.maxHp;d.foe.atk=0;});
await page.getByRole('dialog',{name:'演武首領自動戰鬥',exact:true}).waitFor({timeout:10000});
report.checks.push({name:'演武首領自動進獨立畫面',passed:await page.locator('.ink-spar-boss-screen canvas').count()===1});
report.checks.push({name:'首領戰沿用同一Canvas無重建',passed:await page.evaluate(()=>document.querySelector('.ink-spar-boss-screen canvas')===window.__qaCanvas)});
await page.screenshot({path:`${out}/spar-boss.png`});
for(let i=0;i<10;i++){await page.screenshot({path:`${out}/frames/boss-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(120);}
const before=await page.evaluate(()=>window.__sparDuel.stage);
await page.evaluate(()=>{window.__sparDuel.foeHp=0;});
await page.waitForFunction(()=>!document.querySelector('.ink-spar-boss-screen'),null,{timeout:10000});
report.checks.push({name:'演武首領結束返回主頁且只過一關',passed:await page.evaluate(before=>window.__sparDuel.stage===before+1,before)});
await page.locator('.ink-spar-slot').evaluate(e=>e.scrollIntoView({block:'center'}));
await page.evaluate(async()=>{const {sparStageFoes}=await import('/core/life/sparDuel.ts');const d=window.__sparDuel;d.stage=25;d.queue=sparStageFoes(25);d.idx=0;d.foeHp=d.foe.maxHp;d.heroHp=1;d.foe.atk=10000;});
await page.waitForFunction(()=>document.querySelector('.ink-spar-clear-note')?.textContent.includes('第 25 關重新挑戰'),null,{timeout:15000});
report.checks.push({name:'實際演武倒地動畫後仍係25關並重置敵陣',passed:await page.evaluate(()=>window.__sparDuel.stage===25&&window.__sparDuel.idx===0&&window.__sparDuel.heroHp>1)});
await page.screenshot({path:`${out}/same-stage-retry.png`});
await store(page,s=>{const n=structuredClone(s.getState().state);n.character.health=n.character.maxHealth;n.character.qi=n.character.maxQi;n.pending=null;s.getState().importState(n);});
await page.evaluate(async()=>{const {startCombat}=await import('/core/life/combat.ts');const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);const n=structuredClone(s.getState().state);startCombat(n,{source:'event',title:'首領自動戰測試',foeName:'赤練娘',foePower:'boss',rewardOnWin:{},rewardOnLose:{},lifeOrDeath:false});s.setState({state:n,lastResult:null,combatReplay:null});});
await page.waitForFunction(async()=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return Boolean(s.getState().combatReplay);},null,{timeout:10000});
report.checks.push({name:'江湖首領直接計算自動戰無開場攔截',passed:await store(page,s=>Boolean(s.getState().combatReplay))});
await page.waitForTimeout(300);await page.screenshot({path:`${out}/event-boss.png`});
await store(page,s=>s.setState({combatReplay:null}));
await page.evaluate(async()=>{const {startCombat}=await import('/core/life/combat.ts');const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);const n=structuredClone(s.getState().state);n.pendingCombat=null;startCombat(n,{source:'event',title:'首領生死確認測試',foeName:'赤練娘',foePower:'boss',rewardOnWin:{},rewardOnLose:{},lifeOrDeath:true});s.setState({state:n,lastResult:null,combatReplay:null});});
await page.waitForTimeout(350);report.checks.push({name:'生死風險未确认唔會自動開打',passed:await store(page,s=>!s.getState().combatReplay&&s.getState().state.pendingCombat?.lifeOrDeath===true)});
await page.screenshot({path:`${out}/life-or-death.png`});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
