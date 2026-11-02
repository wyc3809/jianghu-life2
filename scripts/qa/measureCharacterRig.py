"""單角色App元件120秒量測；headless瀏覽器數字不代表真iPhone。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,statistics
R=Path(__file__).resolve().parents[2];O=R/'production/qa/evidence/redesign/character-rig-prototype'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5271/?rig-lab=1');page.wait_for_function('window.__characterRigLab',timeout=60000)
 cold=page.evaluate('performance.now()');page.evaluate('''()=>{const lab=__characterRigLab,canvas=document.querySelector('.rig-lab canvas'),ctx=canvas.getContext('2d');window.rigPerf={update:[],draw:[],gaps:[],last:0,depth:0,start:0};let m=rigPerf,u=lab.animator.advance.bind(lab.animator),clear=ctx.clearRect.bind(ctx),save=ctx.save.bind(ctx),restore=ctx.restore.bind(ctx);lab.animator.advance=(dt)=>{let t=performance.now();u(dt);m.update.push(performance.now()-t)};ctx.clearRect=(...args)=>{m.start=performance.now();clear(...args)};ctx.save=()=>{m.depth++;save()};ctx.restore=()=>{restore();m.depth--;if(m.depth===0)m.draw.push(performance.now()-m.start)};function tick(t){if(m.last)m.gaps.push(t-m.last);m.last=t;requestAnimationFrame(tick)}requestAnimationFrame(tick);let i=0,actions=['idle','walk','run','attack','hurt','knockback','down','getup'];window.rigPerfTimer=setInterval(()=>lab.animator.play(actions[i++%actions.length]),2200);}''')
 cdp=c.new_cdp_session(page);heaps=[]
 for i in range(6):page.wait_for_timeout(20000);heaps.append({'seconds':20*(i+1),**cdp.send('Runtime.getHeapUsage')})
 raw=page.evaluate('''()=>{clearInterval(rigPerfTimer);const a=__characterRigLab.assets,images=[...Object.values(a.parts).flatMap(Object.values),...Object.values(a.heads),...Object.values(a.weapons)];return{...rigPerf,images:images.length,decodedRgbaEstimate:images.reduce((s,i)=>s+i.naturalWidth*i.naturalHeight*4,0),invalidFrames:__characterRigLab.animator.invalidFrames,resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/ink/art/character-rig/')).map(r=>({name:new URL(r.name).pathname,duration:r.duration,bytes:r.encodedBodySize}))}}''')
 def stats(v):
  s=sorted(v);return{'count':len(s),'p50':round(statistics.median(s),3),'p95':round(s[int((len(s)-1)*.95)],3),'p99':round(s[int((len(s)-1)*.99)],3),'max':round(max(s),3)}
 summary={'actualIphone':False,'environment':'Linux Chromium headless Canvas2D,390x844,DPR2,Vite development','seconds':120,'readyObservedAtMs':cold,'updateMs':stats(raw['update']),'drawCpuMs':stats(raw['draw']),'rafGapMs':stats(raw['gaps']),'images':raw['images'],'decodedRgbaEstimate':raw['decodedRgbaEstimate'],'heaps':heaps,'invalidFrames':raw['invalidFrames'],'pageerrors':errors}
 assert raw['invalidFrames']==0 and not errors,(raw['invalidFrames'],errors)
 (O/'performance-raw.json').write_text(json.dumps(raw,indent=2));(O/'performance-summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2));c.close();b.close()
