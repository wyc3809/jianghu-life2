"""用真正瀏覽器截圖比較字體層級，唔繪製遊戲美術或重排文字。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
p = ROOT / 'production/qa/evidence/redesign/wuxia-typography'
fontpath = Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
if not fontpath.exists():
    fontpath = Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
f = ImageFont.truetype(str(fontpath), 20)
s = ImageFont.truetype(str(fontpath), 14)
for target, before, after, title, rectangle in [
    ('comparison.jpg', 'before.png', 'chromium-jianghu-長河疊浪.png', '武俠遊戲題字・楷筆標題與清晰內文', (458, 286, 790, 454)),
    ('main-arts-comparison.jpg', 'before-main-arts.png', 'chromium-main-arts.png', '人物主修・武學題字與流派印記', (458, 320, 790, 774)),
]:
    board = Image.new('RGB', (840, 938), '#f6f1e6')
    d = ImageDraw.Draw(board)
    d.text((16, 9), title, font=f, fill='#28241e')
    d.text((16, 39), '同一seed42・390×844・DPR2・真實畫面，未上線', font=s, fill='#6b5f50')
    for x, path, label in [(14, before, '改前：一般UI粗字'), (426, after, '改後：繁中楷筆題字＋字級層次')]:
        d.text((x, 66), label, font=s, fill='#a33a32')
        im = Image.open(p / path).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS)
        board.paste(im, (x, 88))
    d.rectangle(rectangle, outline='#ad382e', width=2)
    board.save(p / target, quality=91, optimize=True)
# 實際選派區放大，顯示新字形；唔修改文字或字體渲染。
im = Image.open(p / 'chromium-jianghu-pool.png').convert('RGB')
im.crop((0, 0, im.width, 374)).save(p / 'six-schools-crop.jpg', quality=94)
