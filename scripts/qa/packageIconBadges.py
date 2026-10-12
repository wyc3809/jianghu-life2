"""實際畫面對照板及操作GIF；唔加工遊戲內圖示或場景。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
out = root / 'production/qa/evidence/redesign/icon-badges'
font = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
ft = ImageFont.truetype(font, 26)
small = ImageFont.truetype(font, 18)
board = Image.new('RGB', (1000, 1190), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((22, 10), '器物＋文字菱形牌章 · 真實遊戲畫面', font=ft, fill='#252422')
d.text((22, 52), 'seed42 · 銀兩103 · 玉石600 · 390×844 / DPR2 · 演武台保持原樣', font=small, fill='#45413b')
for i, (file, title) in enumerate([('original-390.png', '改之前'), ('after-390.png', '改之後')]):
    x = 20 + i * 490
    shot = Image.open(out / file).convert('RGB').resize((470, 1017), Image.Resampling.LANCZOS)
    board.paste(shot, (x, 115))
    d.text((x, 80), title, font=ft, fill='#252422')
    for box in [(565, 26, 760, 215), (28, 844, 752, 1025), (32, 1530, 288, 1668), (497, 1530, 755, 1668)]:
        d.rectangle(tuple([x + int(box[0] * 470 / 780), 115 + int(box[1] * 1017 / 1688), x + int(box[2] * 470 / 780), 115 + int(box[3] * 1017 / 1688)]), outline='#b32623', width=2)
d.text((22, 1147), '紅框：資源、快捷入口及底部分頁圖示。頁面實際操作仍然有效。', font=small, fill='#45413b')
board.save(out / 'comparison.png')
gallery = Image.new('RGB', (1170, 910), '#f0ebe1')
d = ImageDraw.Draw(gallery)
d.text((18, 8), '實際介面 · 主畫面／人物／修煉', font=ft, fill='#252422')
for i, file in enumerate(['after-390.png', 'person-390.png', 'practice-390.png']):
    gallery.paste(Image.open(out / file).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS), (i*390, 56))
gallery.save(out / 'pages.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('badge-*.png'))]
frames[0].save(out / 'press.gif', save_all=True, append_images=frames[1:], duration=180, loop=0)
