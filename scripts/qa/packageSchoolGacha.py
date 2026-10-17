"""真實改前／改後手機截圖紅框對照；唔繪製遊戲美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/school-gacha'
fontpath = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
if not Path(fontpath).exists():
    fontpath = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
f = ImageFont.truetype(fontpath, 20)
s = ImageFont.truetype(fontpath, 14)
board = Image.new('RGB', (840, 938), '#f6f1e6')
d = ImageDraw.Draw(board)
d.text((16, 9), '流派定向卡池・現有武學分類', font=f, fill='#28241e')
d.text((16, 39), '103門武學・六派・21本小冊・每冊6–8門（seed42，390×844）', font=s, fill='#6b5f50')
current = 'chromium-jianghu-長河疊浪.png' if (p / 'chromium-jianghu-長河疊浪.png').exists() else 'chromium-jianghu-連環.png'
for x, path, title in [(14, 'before.png', '改前：大池抽取'), (426, current, '改後：揀流派、揀小冊、預覽本冊名單')]:
    d.text((x, 66), title, font=s, fill='#a33a32')
    im = Image.open(p / path).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS)
    board.paste(im, (x, 88))
d.rectangle((440, 88 + 222, 804, 88 + 730), outline='#ad382e', width=2)
board.save(p / 'comparison.jpg', quality=91, optimize=True)
