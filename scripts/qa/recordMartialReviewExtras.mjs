/** 隱去文字及粒子比較真實呈現器嘅肢體；另以真核心結果檢視珍本收勢。 */
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const out='production/qa/evidence/redesign/martial-identities';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report=[];
const ids=['art_river_fist','sl_luohan_fist','pr_mountain_split','art_rain_sword','pr_wind_thread','art_iron_body','pr_diamond_body','qg_broken_bridge','pr_cloud_step'];
for(const id of (process.env.QA_VARIANTS_ONLY ? [] : ids)){
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();
 await p.goto(`http://localhost:5188/?martial-preview=1&clean=1&art=${id}&pose=1&effects=off&mono=1`,{waitUntil:'networkidle'});
 await p.waitForFunction(()=>window.__martialBattleStage);await p.waitForTimeout(1500);
 const geom=await p.evaluate(()=>{const s=window.__martialBattleStage;window.qaDraw=s.render.bind(s);s.update=()=>{};s.render=()=>{};s.setMartialReview(true,true);return {ground:s.geom().groundY,top:document.querySelector('canvas').getBoundingClientRect().top};});
 const cropY=Math.round((geom.top+geom.ground-140)*2);const dir=`/tmp/martial-blind/${id}`;fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<48;i++){
  await p.evaluate(({id,t})=>{window.__martialBattleStage.inspectMartialPose(id,t);window.qaDraw();},{id,t:i/30});
  await p.screenshot({path:`${dir}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90});
 }
 execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','30','-i',`${dir}/%04d.jpg`,'-vf',`crop=400:340:0:${cropY}`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','18',`${out}/blind-${id}.mp4`]);
 report.push({id,kind:'同一產品呈現器姿勢檢視，無攻擊結算、無武學名／數字／粒子',cropY});await c.close();console.log('盲辨錄影',id);
}
for(const id of ['pr_mountain_split','pr_wind_thread'])for(const outcome of ['crit','kill']){
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();
 await p.goto(`http://localhost:5188/?martial-preview=1&clean=1&art=${id}&source=spar${outcome==='kill'?'&stage=1':''}`,{waitUntil:'networkidle'});
 await p.waitForFunction(()=>window.__martialBattleStage);await p.waitForTimeout(1500);
 const state=await p.evaluate(({id,outcome})=>{const s=window.__martialBattleStage;window.qaDraw=s.render.bind(s);const step=s.update.bind(s);s.update=()=>{};s.render=()=>{};
   let n=0;while(n++<24000){step(1/60);const r=s.poseResult;if(r&&r.dmg>0&&(outcome==='crit'?r.crit&&!r.killed:r.killed))break;}
   window.qaResult=s.poseResult;
   // 真結果已取得、時計凍結後，移返左側檢視，避免倒地敵影遮住收勢；唔係額外遊戲移動。
   s.heroX=s.cssW*.2;
   return {steps:n,result:s.poseResult,art:s.martialId,inspectionCamera:'真結果後凍結時計，主角置左檢視收勢；唔增加移動或攻擊',volume:window.__martialQa.replay.rounds.flatMap(r=>r.hits).filter(h=>h.crit).map(h=>h.vol)};
 },{id,outcome});
 if(!state.result||(outcome==='crit'?!state.result.crit:!state.result.killed))throw Error('未取得真正核心結果 '+id+' '+outcome);
 const dir=`/tmp/martial-variants/${id}-${outcome}`;fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<48;i++){
  await p.evaluate(({id,t})=>{window.__martialBattleStage.inspectMartialPose(id,t,window.qaResult);window.qaDraw();},{id,t:.36001+i/48*.3599});
  await p.screenshot({path:`${dir}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:85});
 }
 execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','24','-i',`${dir}/%04d.jpg`,'-vf','scale=390:844','-c:v','libx264','-pix_fmt','yuv420p','-crf','20',`${out}/${id}-${outcome}-recovery.mp4`]);
 report.push({id,outcome,kind:'真實核心結果後，以同一呈現器慢速檢視收勢；唔重複結算',...state});await c.close();console.log('真實結果收勢',id,outcome);
}
fs.writeFileSync(`${out}/blind-variants-report.json`,JSON.stringify(report,null,2));await b.close();
