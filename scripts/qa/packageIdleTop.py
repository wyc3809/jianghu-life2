"""收益欄移到演武台上方嘅實際對照及收成GIF。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/idle-top'
font = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
ft = ImageFont.truetype(font, 26)
small = ImageFont.truetype(font, 18)
board = Image.new('RGB', (1000, 1190), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((22, 10), '收益欄 → 演武台上方 · 實際遊戲畫面', font=ft, fill='#252422')
d.text((22, 52), 'seed42 · 銀兩103 · 玉石600 · 390×844 / DPR2 · 演武台尺寸／玩法保留', font=small, fill='#45413b')
for i, (file, title, box) in enumerate([
    ('before-390.png', '改之前：收益喺下方', (28, 1050, 752, 1220)),
    ('after-390.png', '改之後：收益喺上方', (28, 330, 752, 466)),
]):
    x = 20 + i * 490
    shot = Image.open(out / file).convert('RGB').resize((470, 1017), Image.Resampling.LANCZOS)
    board.paste(shot, (x, 115))
    d.text((x, 80), title, font=ft, fill='#252422')
    d.rectangle((x + int(box[0]*470/780), 115 + int(box[1]*1017/1688), x + int(box[2]*470/780), 115 + int(box[3]*1017/1688)), outline='#b32623', width=2)
d.text((22, 1147), '收益欄融入宣紙墨色UI；收成同底部任務欄保留。', font=small, fill='#45413b')
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('idle-*.png'))]
frames[0].save(out / 'harvest.gif', save_all=True, append_images=frames[1:], duration=220, loop=0)
