"""中央過月牌章改前／改後、按壓及狀態對照。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
out = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/month-badge'
font = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
ft = ImageFont.truetype(font, 26)
small = ImageFont.truetype(font, 18)
board = Image.new('RGB', (1000, 1190), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((22, 10), '過一月 → 菱形器物牌章 · 實際遊戲畫面', font=ft, fill='#252422')
d.text((22, 52), 'seed42 · 銀兩103 · 玉石600 · 390×844 / DPR2 · 演武台保持原樣', font=small, fill='#45413b')
for i, (file, title, box) in enumerate([
    ('before-390.png', '改之前：圓形過月鈕', (288, 1485, 492, 1687)),
    ('after-390.png', '改之後：菱形過月牌章', (288, 1485, 492, 1687)),
]):
    x = 20 + i * 490
    shot = Image.open(out / file).convert('RGB').resize((470, 1017), Image.Resampling.LANCZOS)
    board.paste(shot, (x, 115))
    d.text((x, 80), title, font=ft, fill='#252422')
    d.rectangle((x + int(box[0]*470/780), 115 + int(box[1]*1017/1688), x + int(box[2]*470/780), 115 + int(box[3]*1017/1688)), outline='#b32623', width=2)
d.text((22, 1147), '保留境界、修為進度；滿修為轉成朱砂突破，過勞時停用。', font=small, fill='#45413b')
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('month-*.png'))]
frames[0].save(out / 'advance.gif', save_all=True, append_images=frames[1:], duration=220, loop=0)

# 只裁切真實截圖，放大底部控制三種狀態，唔重畫UI。
strip = Image.new('RGB', (900, 260), '#f0ebe1')
d = ImageDraw.Draw(strip)
for i, (file, title) in enumerate([('after-390.png','一般：過一月'), ('breakthrough-390.png','修為滿：突破'), ('exhausted-390.png','過勞：停用')]):
    crop = Image.open(out / file).convert('RGB').crop((270, 1410, 510, 1688)).resize((180, 208), Image.Resampling.LANCZOS)
    strip.paste(crop, (i*300+60, 46))
    d.text((i*300+35, 6), title, font=small, fill='#252422')
strip.save(out / 'states.png')
