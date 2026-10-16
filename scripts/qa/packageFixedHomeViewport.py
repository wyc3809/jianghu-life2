"""整理真實改前後截圖及紅框；唔製作遊戲美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/fixed-home-viewport'
fontpath = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
if not Path(fontpath).exists():
    fontpath = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font = ImageFont.truetype(fontpath, 20)
small = ImageFont.truetype(fontpath, 14)
board = Image.new('RGB', (808, 782), '#f6f1e6')
d = ImageDraw.Draw(board)
d.text((14, 8), '手機主頁：固定一屏、任務欄下移', font=font, fill='#28241e')
d.text((14, 36), '相同 seed 42・390×690 可見區域（工具列佔位）', font=small, fill='#655b4c')
for x, name, label in [(10, 'before.png', '改前：演武下半部／功能入口被切走'),
                        (408, 'chromium-390x690.png', '改後：演武完整，任務貼近底部導航')]:
    im = Image.open(p / name).convert('RGB').resize((390, 690), Image.Resampling.LANCZOS)
    board.paste(im, (x, 83))
    d.text((x, 61), label, font=small, fill='#a33a32')
d.rectangle((20, 83 + 440, 390, 83 + 552), outline='#b8372e', width=2)
d.rectangle((418, 83 + 235, 788, 83 + 441), outline='#b8372e', width=2)
d.rectangle((422, 83 + 516, 784, 83 + 574), outline='#b8372e', width=2)
board.save(p / 'comparison.jpg', quality=91, optimize=True)
