"""錄同一官方播放器嘅單人短拳；交正常／慢速實畫，唔後製畫接位。"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import base64
import io
import json
import subprocess
import time

from PIL import Image,ImageDraw,ImageFont
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
BUILD=ROOT/'.local-online/rig-repair/punch-v03'
OUT=ROOT/'production/qa/evidence/redesign/character-bind-review/punch-v03'


def render():
    """固定相機拍真蒙皮幀，再加證據標題；動畫本身唔補畫或換鏡。"""
    OUT.mkdir(parents=True,exist_ok=True);(BUILD/'frames').mkdir(exist_ok=True)
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}/.local-online/rig-repair/punch-v03/index.html'
    metrics={}
    font=next(p for p in [Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'),Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')] if p.exists())
    heading=ImageFont.truetype(str(font),29);small=ImageFont.truetype(str(font),20)
    frames=[]
    def paper(raw,title='單人短拳 · 正常速度'):
        image=Image.new('RGBA',(780,1000),'#f0e9db');image.alpha_composite(raw,(0,60));d=ImageDraw.Draw(image)
        d.text((30,16),title,font=heading,fill='#28251f');d.text((30,958),'同一骨架 · 固定比例 · 短段待評閱／未上線',font=small,fill='#655e52')
        return image.convert('RGB')
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
            page=browser.new_page(viewport={'width':780,'height':1100},device_scale_factor=1)
            start=time.perf_counter();page.goto(origin);page.evaluate('window.ready');metrics['loadMs']=(time.perf_counter()-start)*1000;metrics['browser']=browser.version
            for i in range(97):
                t=i/60;data=page.evaluate('__punchReview.inspect',t);raw=Image.open(io.BytesIO(base64.b64decode(data))).convert('RGBA');frames.append(raw)
                paper(raw).save(BUILD/'frames'/f'{i:04d}.png')
            for label,t in [('standing',0),('windup',.28),('contact',.52),('recover',.9),('settled',1.6)]:
                data=page.evaluate('__punchReview.inspect',t);raw=Image.open(io.BytesIO(base64.b64decode(data))).convert('RGBA');raw.save(OUT/f'{label}-raw.png');paper(raw,'單人短拳 · '+label).save(OUT/f'{label}.jpg',quality=96)
            page.evaluate('__punchReview.inspect(0)');page.locator('#play').click();page.wait_for_function('__punchReview.time>.12',timeout=10_000);page.locator('#play').click();paused=page.evaluate('__punchReview.time');page.wait_for_timeout(100);assert page.evaluate('__punchReview.time')==paused
            page.locator('#step').click();assert abs(page.evaluate('__punchReview.time')-paused-1/60)<1e-6
            page.locator('#slow').click();page.evaluate('__punchReview.inspect(0)');page.locator('#play').click();page.wait_for_timeout(400);assert 0<page.evaluate('__punchReview.time')<.25;page.locator('#play').click();page.locator('#slow').click()
            page.locator('#restart').click();page.wait_for_function('__punchReview.time>=1.6&&!__punchReview.playing',timeout=12_000)
            metrics['controls']={'playPause':True,'singleStep':True,'quarterSpeed':True,'restartToEnd':True}
            page.evaluate('__punchReview.inspect(.52)');page.locator('#bones').click();page.locator('#stage').screenshot(path=str(OUT/'bones-debug.png'));page.locator('#bones').click()
            mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce');mobile.goto(origin);mobile.evaluate('window.ready');assert not mobile.evaluate('__punchReview.playing');mobile.locator('#restart').click();mobile.wait_for_timeout(150);assert mobile.evaluate('__punchReview.time')==0
            assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
            mobile.locator('#step').click();assert abs(mobile.evaluate('__punchReview.time')-1/60)<1e-6;mobile.screenshot(path=str(OUT/'mobile-reduced.png'));metrics['reducedMotionManualStep']=True
            mobile.close();browser.close()
    finally:server.shutdown();server.server_close()
    assert frames[0].tobytes()==frames[-1].tobytes(), '收招必須回同一站姿'
    def gif(path,close=False):
        picked=[frames[round(i/25*60)] for i in range(41)]
        if close:
            imgs=[im.crop((230,20,630,540)).resize((520,676),Image.Resampling.LANCZOS) for im in picked]
            boards=[]
            for im in imgs:
                p=Image.new('RGBA',(520,740),'#f0e9db');p.alpha_composite(im,(0,42));d=ImageDraw.Draw(p);d.text((16,6),'接位近鏡 · 四分之一速度',font=small,fill='#28251f');d.text((16,719),'同一段渲染／非新動作',font=small,fill='#655e52');boards.append(p.convert('RGB'))
        else:boards=[paper(im).resize((520,667),Image.Resampling.LANCZOS) for im in picked]
        palette=Image.new('RGB',(520*3,boards[0].height))
        for i,n in enumerate([0,13,24]):palette.paste(boards[n],(i*520,0))
        palette=palette.quantize(colors=256)
        encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in boards]
        durations=[160 if close else 40]*len(encoded);durations[0]+=400;durations[-1]+=400
        encoded[0].save(path,save_all=True,append_images=encoded[1:],duration=durations,loop=0,optimize=False,disposal=2)
    gif(OUT/'punch-normal.gif');gif(OUT/'punch-slow-close.gif',True)
    subprocess.run(['ffmpeg','-v','error','-y','-framerate','60','-i',str(BUILD/'frames/%04d.png'),'-vf','format=yuv420p','-c:v','libx264','-crf','17','-movflags','+faststart',str(OUT/'punch-normal.mp4')],check=True)
    slow_filter=f"setpts=4*PTS,fps=30,drawbox=x=0:y=0:w=iw:h=60:color=0xf0e9db:t=fill,drawtext=fontfile={font}:text='單人短拳 · 四分之一速度':x=30:y=16:fontsize=29:fontcolor=0x28251f"
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(OUT/'punch-normal.mp4'),'-vf',slow_filter,'-an','-c:v','libx264','-crf','17','-movflags','+faststart',str(OUT/'punch-slow.mp4')],check=True)
    metrics.update({'exportFps':60,'frames':len(frames),'duration':1.6,'scope':'Linux Chromium官方Runtime離線出幀；唔係真iPhone／TestFlight或即時60fps驗收','sameStandingPixelsAfterRecovery':True})
    (OUT/'operation.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(metrics,ensure_ascii=False,indent=2))


if __name__=='__main__':render()
