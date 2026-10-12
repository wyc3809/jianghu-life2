"""EA0.65實際介面對照及對打氣血GIF。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
out = root / 'production/qa/evidence/redesign/release-ea065'
ft = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 24)
board = Image.new('RGB', (1000, 1150), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((20, 8), 'EA0.65.0 · 玩家指定四項修正 · 實際手機畫面', font=ft, fill='#24211d')
d.text((20, 42), 'seed42 · 103銀兩 · 600玉石 · 390×844 / DPR2', font=ft, fill='#514b42')
for i, (file, title) in enumerate([
    (root / 'production/qa/evidence/redesign/month-badge/after-390.png', '改之前'),
    (out / 'home-390.png', '改之後'),
]):
    x = 20 + 490*i
    board.paste(Image.open(file).convert('RGB').resize((470, 1017)), (x, 112))
    d.text((x, 78), title, font=ft, fill='#24211d')
    for y1, y2 in [(28, 296), (736, 934)]:
        d.rectangle((x+5, 112+int(y1*1017/1688), x+460, 112+int(y2*1017/1688)), outline='#b32623', width=2)
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844)) for p in sorted((out / 'frames').glob('spar-*.png'))]
frames[0].save(out / 'spar-health.gif', save_all=True, append_images=frames[1:], duration=250, loop=0)
