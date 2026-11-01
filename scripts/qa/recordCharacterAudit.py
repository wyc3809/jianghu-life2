"""階段一只讀動畫審查；沒有新增 App 骨架、戰鬥或發獎入口。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,base64,time
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'production/qa/evidence/redesign/character-rig-audit';OUT.mkdir(parents=True,exist_ok=True)
def save_url(url,name): (OUT/name).write_bytes(base64.b64decode(url.split(',',1)[1]))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,record_video_dir=str(ROOT/'.local-online/rig-audit/raw'),record_video_size={'width':390,'height':844})
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:5270/scripts/qa/characterAudit.html');page.wait_for_function('window.__characterAudit?.ready',timeout=60000)
 page.get_by_role('button',name='循環',exact=True).click();page.wait_for_timeout(7300)
 page.get_by_role('button',name='轉向',exact=True).click();page.wait_for_timeout(7100)
 page.get_by_role('button',name='attack',exact=True).click();page.wait_for_timeout(100)
 page.get_by_role('button',name='暫停',exact=True).click();page.get_by_role('button',name='逐幀',exact=True).click()
 page.evaluate('window.__characterAudit.set({phase:"down",time:.5,face:1})');page.screenshot(path=str(OUT/'down-390.png'))
 save_url(page.evaluate('window.__characterAudit.sheet()'),'appearance-poses.png')
 save_url(page.evaluate('window.__characterAudit.sheet(true)'),'war-poses-readonly.png')
 (OUT/'anchors.json').write_text(json.dumps(page.evaluate('window.__characterAudit.anchors()'),indent=2))
 history=page.evaluate('window.__characterAudit.history'); simplified=page.evaluate('window.__characterAudit.simplified');v=page.video;c.close();v.save_as(str(OUT/'appearance-playback.webm'))
 # Actual App with controlled QA-only local storage, no cloud credentials or multiplayer request.
 f=json.loads((ROOT/'production/qa/evidence/redesign/character-rig-audit/qa-fixture.json').read_text())
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,record_video_dir=str(ROOT/'.local-online/rig-audit/raw'),record_video_size={'width':390,'height':844})
 c.route('**/*.supabase.co/**',lambda r:r.fulfill(status=503,content_type='application/json',body='{"code":"qa_offline"}'))
 c.add_init_script('''(()=>{const f='''+json.dumps(f)+''';localStorage.setItem('jianghu_life_v1_ls',JSON.stringify({version:1,savedAt:Date.now(),state:f.state}));localStorage.setItem('jianghu_ancestry_v1',JSON.stringify(f.meta));localStorage.setItem('jianghu_ancestry_saved_at_v1',String(Date.now()));})();''')
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5270/');page.get_by_role('button',name='續寫前緣',exact=False).click(timeout=30000);page.wait_for_timeout(600)
 if page.locator('.ink-offline-modal-btn').count():page.locator('.ink-offline-modal-btn').click()
 page.wait_for_timeout(25000);page.screenshot(path=str(OUT/'actual-app-home.png'))
 (OUT/'actual-app-visible.txt').write_text(page.locator('body').inner_text())
 v=page.video;c.close();v.save_as(str(OUT/'actual-app-home.webm'))
 # Existing developer single-player replay entry, same InkAutoBattle component as App.
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,record_video_dir=str(ROOT/'.local-online/rig-audit/raw'),record_video_size={'width':390,'height':844})
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5270/?battle-preview=unified&kind=event')
 page.wait_for_timeout(15000);page.screenshot(path=str(OUT/'actual-autobattle.png'))
 (OUT/'autobattle-visible.txt').write_text(page.locator('body').inner_text())
 v=page.video;c.close();v.save_as(str(OUT/'autobattle-playback.webm'))
 (OUT/'playback-log.json').write_text(json.dumps({'baseline':'9a07caf49b0b05b6d7b39def891a41925391bbed','actualIphone':False,'browser':'Chromium Linux SwiftShader','viewport':[390,844],'simplified':simplified,'history':history,'pageerrors':errors,'note':'audit harness uses original drawAppearance; existing developer replay entry uses real core seeded fixture; neither is the new rig prototype'},ensure_ascii=False,indent=2))
 b.close()
