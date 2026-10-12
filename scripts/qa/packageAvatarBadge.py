"""實際左上人物入口改前後紅框對照及操作GIF。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
out = root / 'production/qa/evidence/redesign/avatar-badge'
ft = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 24)
small = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 18)
board = Image.new('RGB', (1000, 348), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((20, 8), '左上人物入口 → 同款菱形牌章 · 實際遊戲截圖', font=ft, fill='#252422')
d.text((20, 43), 'seed42 · 103銀兩 · 600玉石 · 390×844 / DPR2', font=small, fill='#514b42')
for i, (file, title) in enumerate([('before-390.png', '改之前'), ('after-390.png', '改之後')]):
    x = 20 + 490*i
    board.paste(Image.open(out / file).convert('RGB').crop((0, 0, 780, 325)).resize((470, 196), Image.Resampling.LANCZOS), (x, 105))
    d.text((x, 73), title, font=ft, fill='#252422')
    d.rectangle((x+int(20*470/780), 105+int(42*196/325), x+int(152*470/780), 105+int(194*196/325)), outline='#b32623', width=2)
d.text((20, 310), '灰墨菱形底牌＋角色圖像＋描邊「人物」；保留年齡同入口功能。', font=small, fill='#514b42')
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('avatar-*.png'))]
frames[0].save(out / 'press.gif', save_all=True, append_images=frames[1:], duration=180, loop=0)
