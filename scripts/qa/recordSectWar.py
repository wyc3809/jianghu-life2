"""正式會武元件實際錄影與瀏覽器幀間距；不是 iPhone 幀率聲稱。"""
from pathlib import Path
exec(compile(Path('scripts/qa/checkSectWarUI.py').read_text().split('with sync_playwright()as p:')[0], 'war_helpers', 'exec'))
OUT = ROOT / 'production/qa/evidence/redesign/sect-war/showcase'
OUT.mkdir(parents=True, exist_ok=True)
class RecordingBrowser:
 def __init__(self,browser):self.browser=browser
 def new_context(self,**kwargs):
  return self.browser.new_context(**kwargs,record_video_dir=str(LOCAL/'video'),record_video_size={'width':390,'height':844})
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c,page,errors=start(RecordingBrowser(b),390,844)
 video=page.video
 click(page,'開始')
 page.wait_for_function("Number(document.querySelector('.ink-sect-war').dataset.seconds)>4",timeout=15000)
 page.screenshot(path=str(OUT/'playing-390.png'))
 samples=page.evaluate('''()=>new Promise(resolve=>{const samples=[];let last=performance.now(),start=last;function frame(now){samples.push(now-last);last=now;if(now-start<4500)requestAnimationFrame(frame);else resolve(samples.slice(1));}requestAnimationFrame(frame);})''')
 click(page,'跳過');page.screenshot(path=str(OUT/'result-390.png'))
 assert not errors,errors
 c.close();b.close()
 samples.sort()
 result={'productionBuild':True,'recording':'trial, no rewards or real players','viewport':[390,844],'dpr':2,'actualIphone':False,'engine':'headless Chromium','recordingOverhead':True,'rafSamples':len(samples),'p50FrameMs':round(samples[len(samples)//2],2),'p95FrameMs':round(samples[int(len(samples)*.95)],2),'over50ms':sum(x>50 for x in samples),'sourceVideo':str(Path(video.path()).relative_to(ROOT)),'pageerrors':errors}
 (OUT/'playback.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result),flush=True)
