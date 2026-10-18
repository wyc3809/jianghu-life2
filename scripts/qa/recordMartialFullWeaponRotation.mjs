/** 完整記錄劍→拳→掌→腿→劍，唔只錄開頭三秒。真正戰報，產品同一呈現器。 */
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const out='production/qa/evidence/redesign/martial-identities-full';
const dir='/workspace/martial-qa/rotation-complete';fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();const errors=[];
p.on('pageerror',e=>errors.push(String(e)));
// 江湖每回合先打同一門七卷，會先進處置；改用真演武逐招輪替，唔改遊戲次序。
await p.goto('http://127.0.0.1:5188/?martial-preview=1&clean=1&art=art_river_fist&rotation=1&source=spar',{waitUntil:'networkidle'});
await p.bringToFront();await p.waitForFunction(()=>window.__martialBattleStage,null,{polling:100});await p.waitForTimeout(1500);
await p.evaluate(()=>{const s=window.__martialBattleStage;window.qaAdvance=s.update.bind(s);window.qaDraw=s.render.bind(s);s.update=()=>{};s.render=()=>{};});
const seen=[];let previous='';let returnedAt=null;let frames=0;
for(let n=0;n<600;n++){
 const info=await p.evaluate(()=>{const s=window.__martialBattleStage;for(let j=0;j<4;j++)window.qaAdvance(1/48);window.qaDraw();return {id:s.attackT!==null?s.martialId:null,weapon:s.weaponDef?.src};});
 if(info.id&&info.id!==previous){seen.push({frame:n,id:info.id});previous=info.id;}
 if(seen.filter(x=>x.id==='art_rain_sword').length>=2&&returnedAt===null)returnedAt=n;
 await p.screenshot({path:`${dir}/${String(n).padStart(4,'0')}.jpg`,type:'jpeg',quality:85});frames++;
 if(returnedAt!==null&&n-returnedAt>=22)break;
}
const required=['art_rain_sword','art_river_fist','art_stone_palm','art_wind_chase','art_rain_sword'];
if(seen.map(x=>x.id).slice(0,5).join('|')!==required.join('|'))throw Error('未錄齊完整切換 '+JSON.stringify(seen));
execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','12','-i',`${dir}/%04d.jpg`,'-frames:v',String(frames),'-vf','scale=390:844','-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',`${out}/art_river_fist-rotation.mp4`]);
fs.writeFileSync(`${out}/weapon-rotation-report.json`,JSON.stringify({seed:42,dpr:2,recordingFps:12,frames,gameSeconds:frames/12,sequence:seen,required,errors},null,2));
await b.close();console.log('完整切換通過',frames,seen);
