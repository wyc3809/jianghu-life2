/** 真核心暴擊／擊倒後，凍結時計以同一呈現器慢速檢視十一門珍本外功收勢。 */
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const out='production/qa/evidence/redesign/martial-identities-full';const audit=JSON.parse(fs.readFileSync('production/qa/evidence/redesign/martial-identities/catalog-audit.json'));
const arts=audit.cards.filter(c=>c.kind==='external'&&c.rarity==='珍本');const report=[];const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
for(const art of arts)for(const outcome of ['crit','kill']){
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{const ids=new Set();const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{let id=0;id=raf(t=>{ids.delete(id);fn(t)});ids.add(id);return id};window.stopReview=()=>{for(const id of ids)cancelAnimationFrame(id);window.requestAnimationFrame=()=>0};});
 await p.goto(`http://127.0.0.1:5188/?martial-preview=1&clean=1&art=${art.id}&source=spar${outcome==='kill'?'&stage=1':''}`,{waitUntil:'networkidle'});await p.bringToFront();await p.waitForFunction(()=>window.__martialQa,null,{polling:100,timeout:60000});await p.evaluate(()=>document.fonts.ready);
 const state=await p.evaluate(({id,outcome})=>{window.stopReview();const s=window.__martialBattleStage;const step=s.update.bind(s);window.qaDraw=s.render.bind(s);s.update=()=>{};s.render=()=>{};let frames=0;
  while(frames++<24000){step(1/60);const r=s.poseResult;if(r&&r.dmg>0&&(outcome==='crit'?r.crit&&!r.killed:r.killed))break;}
  window.qaResult=s.poseResult;s.heroX=s.cssW*.2;const result=s.poseResult;s.setMartialReview(true,false);
  return {frames,result,active:s.martialId,loaded:Object.keys(s.martialAssets.get(id)?.variants??{}),source:'真實SparDuel seed42結果；凍結時計後置左檢視收勢，冇新增移動／傷害'};
 },{id:art.id,outcome});
 if(!state.result||state.active!==art.id||(outcome==='crit'?!state.result.crit||state.result.killed:!state.result.killed))throw Error('未有真實結果 '+art.id+outcome);
 const dir=path.resolve('/workspace/martial-rare-full',art.id+'-'+outcome);fs.mkdirSync(dir,{recursive:true});const cdp=await c.newCDPSession(p);const seen=new Set();
 await p.evaluate(()=>{const s=window.__martialBattleStage;const ctx=s.ctx;const draw=ctx.drawImage.bind(ctx);window.qaActorSources=[];ctx.drawImage=(im,...args)=>{if(im?.src?.includes('/martial/'))window.qaActorSources.push(im.src.split('/').at(-1));draw(im,...args);};});
 for(let frame=0;frame<32;frame++){
  await p.evaluate(({id,t})=>{window.__martialBattleStage.inspectMartialPose(id,t,window.qaResult);window.qaDraw();},{id:art.id,t:.4001+frame/31*.3198});
  const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:86,fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(`${dir}/${String(frame).padStart(3,'0')}.jpg`,Buffer.from(shot.data,'base64'));
 }
 const sources=await p.evaluate(()=>[...new Set(window.qaActorSources)]);if(!sources.includes(`${art.id}-${outcome}.webp`))throw Error('未畫出正確變體 '+JSON.stringify(sources));
 execFileSync('ffmpeg',['-loglevel','error','-y','-framerate','16','-i',`${dir}/%03d.jpg`,'-frames:v','32','-vf','scale=390:844','-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',`${out}/${art.id}-${outcome}-recovery.mp4`]);
 report.push({id:art.id,outcome,...state,actualSources:sources,errors});fs.writeFileSync(out+'/rare-outcomes.json',JSON.stringify(report,null,2)+'\n');await c.close();console.log('真實珍本結果',art.id,outcome);
}
await b.close();if(report.some(r=>r.errors.length))process.exitCode=1;
