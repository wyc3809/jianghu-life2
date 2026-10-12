// 第22項：固定情境驗證演武靜態及Canvas動態字體。
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('production/qa/evidence/redesign/spar-typography');
fs.mkdirSync(`${out}/frames`,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report={checks:[],errors:[],badRequests:[],samples:[]};

async function modules(page){return page.evaluate(async()=>{const resources=performance.getEntriesByType('resource');const get=(name)=>resources.find(x=>x.name.includes(name))?.name;const {useLifeStore:s}=await import(get('/src/store/lifeStore.ts'));const {useAncestryStore:a}=await import(get('/src/store/ancestryStore.ts'));s.getState().newLife({seed:42,skipCoach:true});const next=structuredClone(s.getState().state);next.character.money=103;next.character.flags.newbie_done=true;next.character.flags.coach_done=true;next.character.flags.idle_silver=128;next.pending=null;next.tab='home';s.getState().importState(next);s.setState({sealText:null,lastResult:null,flashLines:[],breakthroughResult:null});const meta=structuredClone(a.getState().meta);meta.jade={free:600,paidTest:0};a.setState({meta,milestoneToast:[],jadeToast:0});});}
async function store(page,fn){return page.evaluate(async source=>{const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/src/store/lifeStore.ts')).name;const {useLifeStore:s}=await import(url);return (new Function('s',`return (${source})(s)`))(s);},fn.toString());}
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();
await page.addInitScript(()=>{window.__sparText=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__sparText.push({text,font:this.font});if(window.__sparText.length>500)window.__sparText.shift();return original.call(this,text,...args);};});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badRequests.push(r.url())});
await page.goto('http://127.0.0.1:5175/?still=1',{waitUntil:'networkidle'});await page.getByRole('button',{name:/定種子/}).click();await modules(page);await page.waitForTimeout(1800);
await page.screenshot({path:`${out}/after-390.png`});






for(const width of [320,390,420]) {
 await page.setViewportSize({width,height:844});await page.waitForTimeout(200);await page.screenshot({path:`${out}/home-${width}.png`});
 report.checks.push({name:`${width}px無橫向溢出`,passed:await page.evaluate(()=>document.querySelector('.scroll-shell').scrollWidth<=innerWidth)});
}
await page.setViewportSize({width:390,height:844});
for(let i=0;i<24;i++){await page.screenshot({path:`${out}/frames/spar-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(180);}
report.checks.push({name:'演武靜態文字與介面同一字體',passed:await page.evaluate(()=>{const family=getComputedStyle(document.querySelector('.ink-wallet-value')).fontFamily;return ['.ink-spar-caption','.ink-spar-hud-stage','.ink-spar-hud-left','.ink-spar-bar-num'].every(q=>getComputedStyle(document.querySelector(q)).fontFamily===family);})});
report.checks.push({name:'傷害暴擊修為浮字與介面同一字體',passed:await page.evaluate(()=>{const family=getComputedStyle(document.querySelector('.ink-wallet-value')).fontFamily.split(',')[0].replace(/['"]/g,'').trim();return window.__sparText.length>0&&window.__sparText.every(x=>x.font.includes(family)&&!x.font.includes('italic'));})});
report.canvasTexts=await page.evaluate(()=>window.__sparText);
report.checks.push({name:'對打文字已实际繪製',passed:report.canvasTexts.some(x=>/[0-9]/.test(x.text))});
fs.writeFileSync(`${out}/validation.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,errors:report.errors,badRequests:report.badRequests,drawn:report.canvasTexts.length},null,2));await browser.close();if(report.errors.length||report.badRequests.length||report.checks.some(x=>!x.passed))process.exitCode=1;
