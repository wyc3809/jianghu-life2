"""階段一只讀動畫審查；沒有新增 App 骨架、戰鬥或發獎入口。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,statistics,os,base64
R=Path(__file__).resolve().parents[2];O=R/'production/qa/evidence/redesign/character-rig-audit'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,record_video_dir=str(R/'.local-online/rig-audit/raw'),record_video_size={'width':390,'height':844})
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5270/?battle-preview=unified&kind=event');page.wait_for_function('window.__martialBattleStage',timeout=60000)
 page.evaluate('''()=>{let s=window.__martialBattleStage; s.setCharacterAppearance({head:'silver',outfit:'scholar',tone:'jade'},{head:'bun',outfit:'traveller',tone:'cinnabar'});window.probe={samples:[],updates:[],renders:[],gaps:[],last:0};let p=window.probe;let u=s.update.bind(s),r=s.render.bind(s);s.update=(dt)=>{let a=performance.now();u(dt);p.updates.push(performance.now()-a)};s.render=()=>{let a=performance.now();r();p.renders.push(performance.now()-a);if(p.last)p.gaps.push(a-p.last);p.last=a;p.samples.push({at:a,attack:s.foeAttackActive,heroAttack:s.heroAttackActive,heroDown:s.heroDownT,heroHurt:s.heroHitT,foes:s.enemies.map(e=>({state:e.state,t:e.t,hitT:e.hitT,lunge:e.lungeT}))})}}''')
 page.wait_for_timeout(15000);page.screenshot(path=str(O/'detailed-opponent.png'))
 btn=page.get_by_role('button',name='加速 ×2',exact=True)
 if btn.count():btn.click()
 page.wait_for_timeout(18000)
 data=page.evaluate('window.probe');(O/'detailed-opponent-probe.json').write_text(json.dumps(data,indent=2))
 (O/'detailed-opponent-final.txt').write_text(page.locator('body').inner_text())
 v=page.video;c.close();v.save_as(str(O/'detailed-opponent-playback.webm'))
 # Warm run of original common renderer, not the proposed rig or a multiplayer stress scene.
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5270/scripts/qa/characterAudit.html');page.wait_for_function('window.__characterAudit?.ready',timeout=60000)
 page.get_by_role('button',name='循環',exact=True).click()
 page.evaluate('''()=>{window.metrics={gaps:[],last:0};function f(t){let m=window.metrics;if(m.last)m.gaps.push(t-m.last);m.last=t;requestAnimationFrame(f)}requestAnimationFrame(f)}''')
 cdp=c.new_cdp_session(page);heaps=[]
 for i in range(6):
  page.wait_for_timeout(20000);heaps.append({'second':(i+1)*20,**cdp.send('Runtime.getHeapUsage')})
 result=page.evaluate('''()=>({gaps:window.metrics.gaps,resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/ink/art/appearance/')).map(r=>({name:new URL(r.name).pathname,duration:r.duration,transfer:r.transferSize,encoded:r.encodedBodySize})),images:(()=>{let a=window.__characterAudit.assets,ims=[...Object.values(a.heads),...Object.values(a.bodies).flatMap(Object.values),...Object.values(a.weapons),a.neck].filter(Boolean);return{count:ims.length,decodedRgbaEstimate:ims.reduce((s,i)=>s+i.naturalWidth*i.naturalHeight*4,0)}})(),readyAt:performance.getEntriesByType('resource').filter(r=>r.name.includes('/ink/art/appearance/')).reduce((s,r)=>Math.max(s,r.responseEnd),0)})''')
 result['heapSamples']=heaps;result['actualIphone']=False;result['warmRunSeconds']=120;result['renderer']='three original appearance sprites at DPR2';result['pageerrors']=errors;(O/'performance.json').write_text(json.dumps(result,indent=2));c.close();b.close()
 # Linux WebKit is compatibility evidence, not an iPhone.
 wb=p.webkit.launch(executable_path=os.getenv('MARTIAL_WEBKIT_EXECUTABLE','/workspace/jianghu-testflight-setup/.local-online/martial-economy/webkit.sh'));wc=wb.new_context(viewport={'width':390,'height':844},device_scale_factor=2);page=wc.new_page();we=[];page.on('pageerror',lambda e:we.append(str(e)));page.goto('http://127.0.0.1:5270/scripts/qa/characterAudit.html');page.wait_for_function('window.__characterAudit?.ready',timeout=60000);page.get_by_role('button',name='循環',exact=True).click();page.wait_for_timeout(7200);page.get_by_role('button',name='轉向',exact=True).click();page.wait_for_timeout(7200);(O/'webkit.json').write_text(json.dumps({'actualIphone':False,'pageerrors':we,'history':page.evaluate('window.__characterAudit.history')},indent=2));wc.close();wb.close()
