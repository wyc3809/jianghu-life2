// iPhone WebKit／Chromium：固定欄需獨立於捲動容器。
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';import path from 'node:path';
const [engine='chromium',mode='after',port='5175']=process.argv.slice(2);
const out=path.resolve('production/qa/evidence/redesign/fixed-dock-ios');fs.mkdirSync(out,{recursive:true});
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={engine,mode,checks:[],errors:[],samples:[]};
async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}

const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
await page.goto(`http://127.0.0.1:${port}/?still=1`,{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1200);
await page.evaluate(()=>{const d=window.__sparDuel;d.foeHp=1e9;d.foe.atk=0;});
const hit=(e)=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight&&h&&e.contains(h);};
for(const width of [320,390,420]) for(const height of [690,844]) {
 await page.setViewportSize({width,height});await page.waitForTimeout(150);
 await page.locator('.ink-quick').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(100);
 const task=page.locator('.ink-task-bar');
 report.checks.push({name:`${width}x${height}固定欄不在捲動容器內`,passed:await page.evaluate(()=>!document.querySelector('.ink-tabs').closest('.scroll-shell')&&!document.querySelector('.ink-task-bar').closest('.scroll-shell'))});
 report.checks.push({name:`${width}x${height}底部四個分頁可點`,passed:await page.locator('.ink-tabs .ink-tab').evaluateAll((nodes,source)=>nodes.length===4&&nodes.every(new Function('return ('+source+')')()),hit.toString())});
 report.checks.push({name:`${width}x${height}任務可見及可點`,passed:await task.locator('summary').evaluate((e,source)=>new Function('return ('+source+')')()(e),hit.toString())});
 report.checks.push({name:`${width}x${height}五個捷徑可點`,passed:await page.locator('.ink-quick-btn').evaluateAll((nodes,source)=>nodes.every(new Function('return ('+source+')')()),hit.toString())});
 report.checks.push({name:`${width}x${height}內容不遮固定欄`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').getBoundingClientRect().bottom<=document.querySelector('.ink-task-bar').getBoundingClientRect().top)});
 await page.screenshot({path:`${out}/${mode}-${engine}-${width}-${height}.png`});
}
if(mode==='after'){
await page.getByRole('button',{name:'人物',exact:true}).last().click();await page.waitForTimeout(200);report.checks.push({name:'人物頁導航保留及任務隱藏',passed:await page.locator('.ink-tabs').count()===1&&await page.locator('.ink-task-bar').count()===0});
await page.getByRole('button',{name:'鎮居',exact:true}).click();await page.waitForTimeout(200);report.checks.push({name:'返主頁任務及导航恢復',passed:await page.locator('.ink-task-bar').count()===1&&await page.locator('.ink-tabs').count()===1});
await page.locator('.ink-task-details summary').click();report.checks.push({name:'任務詳情可展開',passed:await page.locator('.ink-task-details').evaluate(e=>e.open)});await page.screenshot({path:`${out}/${mode}-${engine}-task-open.png`});
}
await page.locator('.ink-task-details').evaluate(e=>e.open=false);
await page.addStyleTag({content:'.scroll-shell.scroll-shell--play { transform: translateZ(0) !important; contain: paint !important; }'});
await page.locator('.ink-quick').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(150);
report.checks.push({name:'模擬祖先裁切時導航仍可點',passed:await page.locator('.ink-tabs .ink-tab').evaluateAll((nodes,source)=>nodes.every(new Function('return ('+source+')')()),hit.toString())});
report.checks.push({name:'模擬祖先裁切時任務仍可點',passed:await page.locator('.ink-task-details summary').evaluate((e,source)=>new Function('return ('+source+')')()(e),hit.toString())});
report.checks.push({name:'祖先裁切時導航仍錨定視窗底',passed:await page.locator('.ink-tabs').evaluate(e=>Math.abs(e.getBoundingClientRect().bottom-innerHeight)<1)});
report.checks.push({name:'祖先裁切時任務仍錨定底bar上方',passed:await page.locator('.ink-task-bar').evaluate(e=>Math.abs(e.getBoundingClientRect().bottom-(innerHeight-144))<1)});
await page.screenshot({path:`${out}/${mode}-${engine}-composited.png`});
await browser.close();fs.writeFileSync(`${out}/${mode}-${engine}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(mode==='after'&&(report.errors.length||report.checks.some(x=>!x.passed)))process.exitCode=1;
