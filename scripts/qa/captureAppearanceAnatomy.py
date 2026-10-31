"""共用繪圖器放大實播：完整身體姿勢，畫面不讀寫玩家存檔。"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,subprocess
ROOT=Path(__file__).resolve().parents[2];LOCAL=ROOT/'.local-online/appearance-fix';OUT=ROOT/'production/qa/evidence/redesign/appearance-fix'
(LOCAL/'playback.html').write_text('<html><body style="margin:0;background:#f7efdf"><canvas width="960" height="440"></canvas><script type="module" src="./playback.ts"></script></body></html>')
(LOCAL/'playback.ts').write_text('''import {loadAppearanceAssets} from '../../src/appearance/assets';
import {drawAppearance} from '../../src/appearance/model';
const a=await loadAppearanceAssets(),c=document.querySelector('canvas')!,x=c.getContext('2d')!;
let start=0;const poses=['idle','walk','attack','hurt','down','seated'] as const;const labels=['待機','行走','出招','受擊','倒地','盤坐'];
const run=(now:number)=>{start||=now;const time=(now-start)/1000,index=Math.floor(time/1.6)%6,t=time%1.6;
x.clearRect(0,0,960,440);x.fillStyle='#30352e';x.font='20px sans-serif';x.fillText('共用人物繪圖器放大實播 · '+labels[index],18,30);
for(let i=0;i<3;i++)drawAppearance(x,a,{head:['topknot','ponytail','silver'][i],outfit:['traveller','scholar','cloak'][i],tone:['ink','jade','cinnabar'][i]},{x:160+i*320,y:400,height:320,pose:poses[index],time:t,family:i===2?'sword':'fist'});
requestAnimationFrame(run);};requestAnimationFrame(run);document.body.dataset.ready='1';''')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=b.new_context(viewport={'width':960,'height':440},device_scale_factor=2,record_video_dir=str(LOCAL/'video'),record_video_size={'width':960,'height':440});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5251/.local-online/appearance-fix/playback.html');page.wait_for_function("document.body.dataset.ready==='1'");page.wait_for_timeout(10000);v=page.video;c.close();assert not errors,errors;b.close()
 report={'actualSharedRenderer':True,'enlargedAnatomyReview':True,'playerCombat':False,'saveWrites':False,'video':v.path(),'pageerrors':errors};(OUT/'anatomy-playback.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 subprocess.run(['ffmpeg','-y','-i',v.path(),'-t','10','-filter_complex','fps=10,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',str(OUT/'anatomy-demo.gif')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print('ANATOMY_PLAYBACK_PASS',flush=True)
