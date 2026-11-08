"""用既有官方Spine Runtime渲染兩個靜態姿勢；唔播放新動畫、唔連戰鬥核心。"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import base64
import shutil

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / '.local-online/rig-repair'
OUT = ROOT / 'production/qa/evidence/redesign/character-bind-review'


def render():
    """固定鏡頭及相同比例出圖，保留透明原幀同前後對照。"""
    OUT.mkdir(exist_ok=True, parents=True)
    shutil.copyfile(Path(__file__).with_name('character_bind_review.html'), BUILD/'index.html')
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox','--enable-unsafe-swiftshader'])
            page = browser.new_page(viewport={'width':780, 'height':920}, device_scale_factor=1)
            for tag in ['before','after']:
                page.goto(f'http://127.0.0.1:{server.server_port}/.local-online/rig-repair/index.html?tag={tag}')
                page.wait_for_function('window.player && player.skeleton', timeout=20_000)
                page.evaluate('ready')
                for pose in ['guard','punch']:
                    png = page.evaluate('pose', pose)
                    path = OUT/f'{tag}-{pose}-raw.png'
                    path.write_bytes(base64.b64decode(png))
                    image = Image.open(path)
                    assert image.getbbox() and image.getbbox()[3]-image.getbbox()[1] > 800, '渲染空白／人物被裁'
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

    font_path = next(str(p) for p in [Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'),Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')] if p.exists())
    heading = ImageFont.truetype(font_path, 34)
    label = ImageFont.truetype(font_path, 22)
    for pose, name in [('guard','待機'), ('punch','直拳')]:
        sheet = Image.new('RGBA', (780,1000), (240,233,219,255))
        draw = ImageDraw.Draw(sheet)
        draw.text((36,20), f'{name} · 單角色接位檢查', font=heading, fill='#28251f')
        sheet.alpha_composite(Image.open(OUT/f'after-{pose}-raw.png').convert('RGBA'), (0,60))
        draw.text((36,962), '實際骨架渲染 · 靜態評閱 · 尚未套用或上線', font=label, fill='#655e52')
        sheet.convert('RGB').save(OUT/f'{pose}.jpg', quality=96)

    comparison = Image.new('RGB', (1560,2000), '#f0e9db')
    draw = ImageDraw.Draw(comparison)
    for row, (pose,name) in enumerate([('guard','待機'),('punch','直拳')]):
        for column,tag in enumerate(['before','after']):
            x,y = column*780,row*1000
            draw.text((x+32,y+20), f'{"原版" if tag=="before" else "修正版"} · {name}／同姿勢同鏡頭', font=heading, fill='#28251f')
            comparison.paste(Image.open(OUT/f'{tag}-{pose}-raw.png'), (x,y+60), Image.open(OUT/f'{tag}-{pose}-raw.png'))
            # 紅框係證據註記，唔係遊戲效果。
            for box in [(250,218,360,335),(450,245,650,400)]:
                draw.rectangle((x+box[0],y+60+box[1],x+box[2],y+60+box[3]),outline='#a33e36',width=3)
    comparison.save(OUT/'before-after.jpg', quality=94)


if __name__ == '__main__':
    render()
