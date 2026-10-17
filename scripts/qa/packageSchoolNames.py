"""用真實UI截圖整六派命名對比板及選派區放大，唔繪製遊戲美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
p = root / 'production/qa/evidence/redesign/school-names'
fontpath = Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
if not fontpath.exists():
    fontpath = Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
f = ImageFont.truetype(str(fontpath), 20)
s = ImageFont.truetype(str(fontpath), 14)
board = Image.new('RGB', (840, 938), '#f6f1e6')
d = ImageDraw.Draw(board)
d.text((16, 9), '六派武學神髓・完整命名＋打法定位', font=f, fill='#28241e')
d.text((16, 39), '同一seed42・390×844・DPR2・最後一派「逍遙遊」', font=s, fill='#6b5f50')
for x, path, title in [(14, 'before.png', '改前：兩字分類'), (426, 'chromium-jianghu-長河疊浪.png', '改後：完整流派名＋細字打法')]:
    d.text((x, 66), title, font=s, fill='#a33a32')
    im = Image.open(p / path).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS)
    board.paste(im, (x, 88))
d.rectangle((458, 286, 790, 454), outline='#ad382e', width=2)
board.save(p / 'comparison.jpg', quality=91, optimize=True)
# 只放大真正選派區；保留原有文字、器物位圖及顏色。
im = Image.open(p / 'chromium-jianghu-pool.png').convert('RGB')
im.crop((0, 0, im.width, 374)).save(p / 'six-schools-crop.jpg', quality=94)
