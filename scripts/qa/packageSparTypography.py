"""實際演武字體紅框對照及正常對打GIF；唔重畫畫面或數字。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
out = root / 'production/qa/evidence/redesign/spar-typography'
ft = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 24)
small = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 18)
board = Image.new('RGB', (1000, 438), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((20, 8), '演武字體統一 · 實際遊戲截圖', font=ft, fill='#252422')
d.text((20, 43), 'seed42 · 103銀兩 · 600玉石 · 390×844 / DPR2 · 對打照常運行', font=small, fill='#514b42')
for i, (file, title) in enumerate([('before-390.png', '改之前'), ('frames/spar-01.png', '改之後：對打中')]):
    x = 20 + 490*i
    board.paste(Image.open(out / file).convert('RGB').crop((0, 508, 780, 968)).resize((470, 277), Image.Resampling.LANCZOS), (x, 105))
    d.text((x, 73), title, font=ft, fill='#252422')
    d.rectangle((x+8, 110, x+462, 375), outline='#b32623', width=2)
d.text((20, 397), '日期、地名、血量、傷害及暴擊同介面字體一致；完整動態見GIF。', font=small, fill='#514b42')
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('spar-*.png'))]
frames[0].save(out / 'spar-font.gif', save_all=True, append_images=frames[1:], duration=180, loop=0)
