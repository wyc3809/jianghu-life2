"""渲染一張自然站姿、除錯骨架及同身高前後對照；唔修畫人物。"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import base64
import json
import shutil

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
BUILD=ROOT/'.local-online/rig-repair/upright-v02'
OUT=ROOT/'production/qa/evidence/redesign/character-bind-review/upright-v02'


def render():
    """同一官方播放器、固定相機直接出幀，證據文字另加，人體不後製。"""
    OUT.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(Path(__file__).with_name('upright_character_review.html'),BUILD/'index.html')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
            page=browser.new_page(viewport={'width':780,'height':920},device_scale_factor=1)
            page.goto(f'http://127.0.0.1:{server.server_port}/.local-online/rig-repair/upright-v02/index.html')
            page.wait_for_function('window.__standingReview?.player?.skeleton',timeout=20_000)
            page.evaluate('ready')
            data=page.evaluate('__standingReview.stand()')
            (OUT/'stand-raw.png').write_bytes(base64.b64decode(data))
            assert Image.open(OUT/'stand-raw.png').getbbox(), '空白出圖唔可當完成'
            positions=page.evaluate('''()=>__standingReview.player.skeleton.bones.map(b=>({name:b.data.name,x:b.worldX,y:b.worldY,rotation:b.rotation,scaleX:b.scaleX,scaleY:b.scaleY}))''')
            page.evaluate('__standingReview.setDebug(true)')
            page.locator('#stage').screenshot(path=str(OUT/'bones-debug.png'))
            page.locator('#bones').click()
            assert page.locator('#bones').get_attribute('aria-pressed')=='false'
            page.locator('#stand').click()
            after=page.evaluate('__standingReview.stand()')
            assert after==data, '切除錯／重新選站姿唔可以改比例或位置'
            (OUT/'runtime-check.json').write_text(json.dumps({'browser':browser.version,'positions':positions,'staticReplayIdentical':True,'animations':page.evaluate('__standingReview.player.skeleton.data.animations.map(a=>a.name)'),'scope':'Linux Chromium靜態實畫；唔係App實戰／iPhone／TestFlight驗收'},ensure_ascii=False,indent=2)+'\n')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    font=next(p for p in [Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'),Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')] if p.exists())
    heading=ImageFont.truetype(str(font),30)
    small=ImageFont.truetype(str(font),20)
    paper=Image.new('RGBA',(780,1000),'#f0e9db')
    paper.alpha_composite(Image.open(OUT/'stand-raw.png'),(0,60))
    draw=ImageDraw.Draw(paper)
    draw.text((30,16),'自然站姿 · 完整母版原比例',font=heading,fill='#28251f')
    draw.text((30,957),'實際骨架渲染 · 只檢查站姿 · 未套用或上線',font=small,fill='#655e52')
    paper.convert('RGB').save(OUT/'standing.jpg',quality=97)
    comparison=Image.new('RGBA',(1560,1000),'#f0e9db')
    comparison.alpha_composite(Image.open(OUT.parent/'after-guard-raw.png'),(0,60))
    comparison.alpha_composite(Image.open(OUT/'stand-raw.png'),(780,60))
    draw=ImageDraw.Draw(comparison)
    draw.text((30,16),'上一版：已否決／屈膝與縮身',font=heading,fill='#28251f')
    draw.text((810,16),'自然站姿：重新量母版關節',font=heading,fill='#28251f')
    for box in [(300,650,550,925),(400,380,560,480)]:
        draw.rectangle(box,outline='#a43c32',width=3)
    draw.text((30,957),'相同相機比例；紅框只係問題註記。右圖沿用完整母版，未新增出拳或動畫。',font=small,fill='#655e52')
    comparison.convert('RGB').save(OUT/'before-after.jpg',quality=94)


if __name__=='__main__':
    render()
