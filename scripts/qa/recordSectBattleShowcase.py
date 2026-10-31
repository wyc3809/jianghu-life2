"""原型真瀏覽器錄影：固定列陣→自動混戰，不加速核心、不另製假戰報。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/os.getenv('SECT_OUT','production/qa/evidence/redesign/sect-battle-prototype')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,reduced_motion='no-preference',record_video_dir=str(ROOT/'.local-online/organization-wars/showcase'),record_video_size={'width':390,'height':844})
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5250/sect-battle-preview.html');page.get_by_role('button',name='開始會武',exact=True).wait_for();page.wait_for_timeout(500)
 page.screenshot(path=str(OUT/'formation-390.png'));page.get_by_role('button',name='開始會武',exact=True).click();page.wait_for_timeout(6500);page.screenshot(path=str(OUT/'melee-showcase-390.png'));page.wait_for_timeout(9500);page.get_by_role('button',name='暫停',exact=True).click();page.wait_for_timeout(700)
 video=page.video;c.close();assert not errors,errors
 (OUT/'showcase.json').write_text(json.dumps({'video':video.path(),'actualBrowserPlayback':True,'viewport':[390,844],'dpr':2,'actualIphone':False,'errors':errors},ensure_ascii=False,indent=2));b.close()
print('SHOWCASE_PASS',flush=True)
