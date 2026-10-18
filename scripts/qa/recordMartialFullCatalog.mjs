/** 全103門真實呈現器錄影；固定時計，影片fps唔係裝置效能量測。支援按ID重跑。 */
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const out=path.resolve('production/qa/evidence/redesign/martial-identities-full');fs.mkdirSync(out,{recursive:true});
const audit=JSON.parse(fs.readFileSync('production/qa/evidence/redesign/martial-identities/catalog-audit.json','utf8'));
const selected=new Set((process.env.QA_ARTS||'').split(',').filter(Boolean));
const cards=audit.cards.filter(c=>!selected.size||selected.has(c.id));
const base=process.env.QA_BASE_URL||'http://127.0.0.1:5188/';
const reportPath=out+'/catalog-browser.json';const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath)): {seed:42,viewport:{width:390,height:844},dpr:2,cases:[],errors:[],note:'外功係真核心戰報；內功／身法及盲辨係同一呈現器姿勢檢視，唔新增攻擊。固定步進影片唔係效能量測。'};
if(process.env.QA_RESUME&&report.errors.length){ fs.writeFileSync(out+'/interrupted-attempt-'+Date.now()+'.json',JSON.stringify(report,null,2)+'\n'); report.errors=[]; }
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const groups=Array.from({length:3},(_,g)=>cards.filter((_,i)=>i%3===g));
await Promise.all(groups.map(async group=>{for(const card of group){
 const id=card.id;if(process.env.QA_RESUME&&report.cases.some(c=>c.id===id&&c.passed))continue;
 const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:2});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{const pending=new Set();const original=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{let id=0;id=original(t=>{pending.delete(id);fn(t);});pending.add(id);return id;};window.__stopQaRaf=()=>{for(const id of pending)cancelAnimationFrame(id);pending.clear();window.requestAnimationFrame=()=>0;};performance.setResourceTimingBufferSize(5000);});
 try{
 const support=card.kind!=='external';
 await page.goto(`${base}?martial-preview=1&clean=1&art=${encodeURIComponent(id)}&source=spar${support?'&pose=1':''}`,{waitUntil:'networkidle'});
 await page.bringToFront();await page.waitForFunction(()=>window.__martialQa&&window.__martialBattleStage,null,{timeout:60000,polling:100});
 await page.evaluate(()=>document.fonts.ready);
 const cdp=await context.newCDPSession(page);
 const capture=async (file,scale=1)=>{const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:86,fromSurface:true,captureBeyondViewport:false,clip:{x:0,y:0,width:390,height:844,scale}});fs.writeFileSync(file,Buffer.from(shot.data,'base64'));};
 const info=await page.evaluate(({id,support})=>{window.__stopQaRaf();const s=window.__martialBattleStage;window.qaAdvance=s.update.bind(s);window.qaDraw=s.render.bind(s);s.update=()=>{};s.render=()=>{};
  if(!support)for(let n=0;n<1000&&s.attackT===null;n++)window.qaAdvance(1/60);
  const asset=s.martialAssets.get(id);return {atlas:asset?decodeURIComponent(asset.atlas.src.split('/').at(-1)):undefined,guard:asset?.guard,variants:Object.keys(asset?.variants??{}),effects:Object.keys(asset?.identityEffects??{}),assets:[...s.martialAssets.keys()],resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/ink/art/martial/')).map(r=>r.name.split('/').at(-1)),activeArt:s.martialId};
 },{id,support});
 if(info.guard||info.atlas!==id+'.webp'||info.effects.length!==(card.rarity==='珍本'?3:1))throw Error('素材未齊 '+JSON.stringify(info));
 const dir=path.resolve('/workspace/martial-record-full',id);fs.mkdirSync(dir,{recursive:true});
 for(let frame=0;frame<48;frame++){
  await page.evaluate(({id,support,frame})=>{const s=window.__martialBattleStage;if(support)s.inspectMartialPose(id,(frame/24)%1.1);else{window.qaAdvance(1/48);window.qaAdvance(1/48);}window.qaDraw();},{id,support,frame});
  if(frame===16)await capture(`${out}/${id}.jpg`,2);
  await capture(`${dir}/normal-${String(frame).padStart(3,'0')}.jpg`);
 }
 execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','24','-i',`${dir}/normal-%03d.jpg`,'-frames:v','48','-vf','scale=390:844','-c:v','libx264','-pix_fmt','yuv420p','-crf','21','-movflags','+faststart',`${out}/${id}.mp4`]);
 const crop=await page.evaluate(()=>{const s=window.__martialBattleStage;s.heroX=s.cssW*.2;s.setMartialReview(true,true);const g=s.geom();return {y:Math.max(0,Math.round((document.querySelector('canvas').getBoundingClientRect().top+g.groundY-150)*2)),duration:s.attackClipNow().dur};});
 const duration=support?1.1:1.6;
 for(let frame=0;frame<32;frame++){
  await page.evaluate(({id,t})=>{window.__martialBattleStage.inspectMartialPose(id,t);window.qaDraw();},{id,t:duration*frame/31});
  await capture(`${dir}/blind-${String(frame).padStart(3,'0')}.jpg`);
 }
 execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','20','-i',`${dir}/blind-%03d.jpg`,'-frames:v','32','-vf',`crop=240:180:0:${Math.round(crop.y/2)}`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',`${out}/blind-${id}.mp4`]);
 const check={id,name:card.name,kind:card.kind,rarity:card.rarity,normalFrames:48,blindFrames:32,source:support?'產品呈現器運氣／步法檢視':'真核心演武首領戰報',...info,errors,passed:errors.length===0};
 report.cases=report.cases.filter(c=>c.id!==id);report.cases.push(check);report.errors.push(...errors);fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log('完成全量動態',id,report.cases.length);
 }catch(e){report.errors.push({id,error:String(e),pageErrors:errors});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.error('失敗',id,String(e));process.exitCode=1;}
 finally{await context.close();}
}}));await browser.close();if(report.errors.length)process.exitCode=1;
