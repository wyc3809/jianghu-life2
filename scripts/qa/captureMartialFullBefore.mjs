/** 同seed42、390×844、DPR2，改前係43d6b77，唔修改舊呈現器。 */
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='production/qa/evidence/redesign/martial-identities-full';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();
await p.addInitScript(()=>{const pending=new Set();const original=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{let id=0;id=original(t=>{pending.delete(id);fn(t);});pending.add(id);return id;};window.__stopQaRaf=()=>{for(const id of pending)cancelAnimationFrame(id);window.requestAnimationFrame=()=>0;};});
await p.goto('http://127.0.0.1:5189/?martial-preview=1&clean=1&art=pr_vajra_palm&source=spar',{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__martialQa,null,{polling:100});
const state=await p.evaluate(()=>{window.__stopQaRaf();const s=window.__martialBattleStage;const step=s.update.bind(s);const draw=s.render.bind(s);s.update=()=>{};s.render=()=>{};for(let n=0;n<1000&&s.attackT===null;n++)step(1/60);for(let n=0;n<=16;n++){step(1/48);step(1/48);}draw();return {id:s.martialId,result:s.poseResult,assets:[...s.martialAssets.keys()]};});
await p.screenshot({path:out+'/before-pr_vajra_palm.jpg',type:'jpeg',quality:90});fs.writeFileSync(out+'/baseline.json',JSON.stringify({commit:'43d6b7709311881c8b60b6b62372a4621ca33c03',seed:42,viewport:[390,844],dpr:2,frame:16,...state},null,2)+'\n');await b.close();
