"""底部任務欄改前／改後實際截圖及展開GIF。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/task-bar'
font = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
ft = ImageFont.truetype(font, 26)
small = ImageFont.truetype(font, 18)
board = Image.new('RGB', (1000, 1190), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((22, 10), '當前目標 → 底部小任務欄 · 實際遊戲畫面', font=ft, fill='#252422')
d.text((22, 52), 'seed42 · 銀兩103 · 玉石600 · 390×844 / DPR2 · 演武台保持原樣', font=small, fill='#45413b')
for i, (file, title, box) in enumerate([
    ('before-390.png', '改之前：大型目標卡', (28, 1050, 752, 1465)),
    ('after-390.png', '改之後：底部任務欄', (28, 1240, 752, 1405)),
]):
    x = 20 + i * 490
    shot = Image.open(out / file).convert('RGB').resize((470, 1017), Image.Resampling.LANCZOS)
    board.paste(shot, (x, 115))
    d.text((x, 80), title, font=ft, fill='#252422')
    d.rectangle((x + int(box[0]*470/780), 115 + int(box[1]*1017/1688), x + int(box[2]*470/780), 115 + int(box[3]*1017/1688)), outline='#b32623', width=2)
d.text((22, 1147), '任務詳情可展開；掛機收益、收成及原有任務行為保留。', font=small, fill='#45413b')
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('task-*.png'))]
frames[0].save(out / 'details.gif', save_all=True, append_images=frames[1:], duration=220, loop=0)
