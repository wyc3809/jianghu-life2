"""用真正手機UI截圖整藝術框改前後對比；唔拼貼元件或繪製遊戲美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
p = ROOT / 'production/qa/evidence/redesign/wuxia-art-frames'
fontpath = Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
if not fontpath.exists():
    fontpath = Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
f = ImageFont.truetype(str(fontpath), 20)
s = ImageFont.truetype(str(fontpath), 14)
for target, before, after, title, rectangle in [
    ('comparison.jpg', 'before.png', 'chromium-jianghu-長河疊浪.png', '武學藝術框・冊頁紙邊與綁冊角位', (452, 280, 794, 810)),
    ('main-arts-comparison.jpg', 'before-main-arts.png', 'chromium-main-arts.png', '人物主修・卷冊區塊與武學題簽', (452, 280, 794, 810)),
    ('collection-comparison.jpg', 'before-collection.png', 'chromium-collection.png', '家族收藏・三列六派與珍本淡金框', (452, 280, 794, 810)),
]:
    board = Image.new('RGB', (840, 938), '#f6f1e6')
    d = ImageDraw.Draw(board)
    d.text((16, 9), title, font=f, fill='#28241e')
    d.text((16, 39), '同一seed42・390×844・DPR2・真實畫面，未上線', font=s, fill='#6b5f50')
    for x, path, label in [(14, before, '改前：平直框線'), (426, after, '改後：淺色位圖藝術框')]:
        d.text((x, 66), label, font=s, fill='#a33a32')
        board.paste(Image.open(p / path).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS), (x, 88))
    d.rectangle(rectangle, outline='#ad382e', width=2)
    board.save(p / target, quality=91, optimize=True)
