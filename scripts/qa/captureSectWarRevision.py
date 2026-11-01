"""玩家否決後的完整播放取樣：保留多個時刻，禁止只揀一張最好看的幀當完成。"""
from pathlib import Path
import time,subprocess
__file__=str(Path('scripts/qa/checkSectWarUI.py').resolve())
exec(compile(Path(__file__).read_text().split('with sync_playwright()as p:')[0],'war_helpers','exec'))
BASE=os.getenv('WAR_BASE','http://127.0.0.1:5260/')
OUT=ROOT/os.getenv('WAR_OUT','production/qa/evidence/redesign/sect-war-revision');OUT.mkdir(parents=True,exist_ok=True)
class RecordingBrowser:
 def __init__(self,b):self.b=b;self.start=0
 def new_context(self,**kw):
  self.start=time.monotonic();return self.b.new_context(**kw,record_video_dir=str(LOCAL/'revision-video'),record_video_size={'width':390,'height':844})
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 recorder=RecordingBrowser(b);c,page,errors=start(recorder,390,844);geometry(page);video=page.video
 page.screenshot(path=str(OUT/'ready.png'));start_at=time.monotonic()-recorder.start;click(page,'開始')
 samples=[]
 for second in [.75,2,3,4,6,8]:
  page.wait_for_function("Number(document.querySelector('.ink-sect-war').dataset.seconds)>="+str(second),timeout=20000)
  page.screenshot(path=str(OUT/(str(second)+'s.png')))
  coverage=page.locator('.war-stage canvas').evaluate('''e=>{const x=e.getContext('2d'),a=x.getImageData(0,0,e.width,e.height).data;return Array.from({length:5},(_,k)=>{let ink=0,total=0;for(let y=Math.floor(k*e.height/5);y<Math.floor((k+1)*e.height/5);y++)for(let xx=0;xx<e.width;xx++){ink+=a[(y*e.width+xx)*4+3]>50?1:0;total++;}return ink/total;});}''')
  samples.append({'seconds':second,'actorCoverageByFifth':coverage})
 click(page,'跳過');page.screenshot(path=str(OUT/'result.png'));assert not errors,errors;c.close();b.close()
 source=video.path()
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start_at),'-i',source,'-t','9','-c:v','libx264','-pix_fmt','yuv420p','-crf','23',str(OUT/'playback.mp4')],check=True)
 (OUT/'capture.json').write_text(json.dumps({'viewport':[390,844],'dpr':2,'actualComponent':True,'source':'design/art/sect-battle/selected-portrait.png','nativeIphone':False,'published':False,'pageerrors':errors,'samples':samples},ensure_ascii=False,indent=2));print('REVISION_CAPTURE_PASS',flush=True)
