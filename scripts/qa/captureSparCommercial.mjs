// 第23項：同一真實種子嘅演武四季、步行及倒地驗收。
import { chromium, webkit } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const mode=process.argv[2] ?? 'after';
const port=process.argv[3] ?? '5175';
const kind=process.argv[4] ?? 'chromium';
const out=path.resolve(`production/qa/evidence/redesign/spar-commercial/${mode}-${kind}`);
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await (kind==='webkit'?webkit:chromium).launch(kind==='webkit'?{}:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();const report={checks:[],errors:[],badRequests:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url());});
await page.goto(`http://127.0.0.1:${port}/?still=1`,{waitUntil:'networkidle'});
await page.getByRole('button',{name:/定種子/}).click({timeout:60000});
async function store(fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
await store(s=>{s.getState().newLife({seed:42,skipCoach:true});const n=structuredClone(s.getState().state);n.character.money=103;n.character.flags.newbie_done=true;n.character.flags.coach_done=true;n.pending=null;n.tab='home';s.getState().importState(n);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});});
await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/ancestryStore.ts')).name;const {useAncestryStore:a}=await import(url);const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});
await page.locator('.ink-spar-stage canvas').waitFor();await page.waitForTimeout(1800);
await page.screenshot({path:`${out}/home-start-390.png`});
for(const [season,month] of [['spring',3],['summer',6],['autumn',9],['winter',12]]){
 await page.evaluate(async month=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);s.setState({state:{...s.getState().state,month}});},month);
 await page.locator('.ink-spar-slot').evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(1100);
 await page.screenshot({path:`${out}/${season}-390.png`});
 await page.locator('.ink-spar-stage').screenshot({path:`${out}/${season}-stage.png`});

 report.checks.push({name:`${season}主頁任務／底欄保留`,passed:await page.locator('.ink-task-dock').count()===1&&await page.locator('.ink-bottom-dock').count()===1});
}
if(kind==='chromium')for(let i=0;i<36;i++){await page.locator('.ink-spar-stage').screenshot({path:`${out}/frames/fight-${String(i).padStart(3,'0')}.png`});await page.waitForTimeout(85);}
for(const width of [320,390,420])for(const height of [690,844]){await page.setViewportSize({width,height});await page.waitForTimeout(250);await page.screenshot({path:`${out}/mobile-${width}-${height}.png`});report.checks.push({name:`${width}x${height}無橫向溢出`,passed:await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)});}
await page.setViewportSize({width:390,height:844});await page.locator('.scroll-shell').evaluate(e=>e.scrollTop=0);await page.screenshot({path:`${out}/home-390.png`});
report.checks.push({name:'生成素材全部載入',passed:await page.evaluate(()=>Array.from(document.images).filter(i=>i.src.includes('/ink/')).every(i=>i.complete&&i.naturalWidth>0))});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(c=>!c.passed))process.exitCode=1;
