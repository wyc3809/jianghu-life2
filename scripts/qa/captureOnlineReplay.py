"""用已完成QA世界重播真戰報；正常速度捕捉主角卷六，重播前後驗證無再結算。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,subprocess,os
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/online-prototype'
BASE=os.environ.get('ONLINE_QA_BASE','http://127.0.0.1:5178/')
def state(page):return page.evaluate("async()=>await(await fetch('/api/jianghu/world',{headers:{Authorization:'Bearer '+sessionStorage.getItem('jianghu-online-session')}})).json()")
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 started=time.monotonic();ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,record_video_dir='/tmp/jianghu-online-replay-final',record_video_size={'width':390,'height':844})
 page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.route('https://**',lambda r:r.abort())
 page.goto(BASE+'?online=1',wait_until='networkidle');page.get_by_role('button',name='沈雲舟').click();page.locator('[data-my-rank]').wait_for();before=state(page)
 page.get_by_role('button',name='重播交手').scroll_into_view_if_needed();offset=time.monotonic()-started;page.get_by_role('button',name='重播交手').click()
 page.wait_for_function("document.querySelector('.ink-unified-callout')?.textContent.includes('卷六')&&document.querySelector('.ink-unified-callout')?.textContent.includes('大河落日')",timeout=45000)
 page.wait_for_timeout(350);page.screenshot(path=str(OUT/'hero-volume-six-final.png'))
 page.wait_for_timeout(1800);page.get_by_role('button',name='跳過 ›',exact=True).click();page.get_by_role('dialog').wait_for(state='detached')
 after=state(page);assert len(before['battles'])==len(after['battles']) and before['me']['rank']==after['me']['rank'];assert before['me']['character']==after['me']['character'];assert not errs,errs
 page.locator('.online-self').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'world-final.png'))
 video=page.video;ctx.close();b.close()
 subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(offset),'-i',video.path(),'-an','-vf','fps=24','-c:v','libx264','-crf','25','-pix_fmt','yuv420p',str(OUT/'replay-normal-speed.mp4')],check=True)
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(OUT/'replay-normal-speed.mp4'),'-vf','fps=8,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse','-loop','0',str(OUT/'replay-preview.gif')],check=True)
 (OUT/'replay-final.json').write_text(json.dumps({'normalSpeed':True,'heroVolumeSixVisible':True,'replayNoRankOrCharacterMutation':True,'errors':errs},ensure_ascii=False,indent=2));print('FINAL_REPLAY_PASS')
