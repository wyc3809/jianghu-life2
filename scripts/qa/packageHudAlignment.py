"""實際頂欄對齊、疲勞進度條對照及動態GIF。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
out = root / 'production/qa/evidence/redesign/hud-alignment'
ft = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', 24)
small = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 18)
board = Image.new('RGB', (1000, 390), '#f0ebe1')
d = ImageDraw.Draw(board)
d.text((20, 8), '頂欄對齊＋疲勞度進度條 · 實際遊戲截圖', font=ft, fill='#252422')
d.text((20, 43), 'seed42 · 103銀兩 · 600玉石 · 390×844 / DPR2', font=small, fill='#514b42')
for i, (file, title) in enumerate([('before-390.png', '改之前'), ('after-390.png', '改之後')]):
    x = 20 + 490*i
    board.paste(Image.open(out / file).convert('RGB').crop((0, 0, 780, 365)).resize((470, 220), Image.Resampling.LANCZOS), (x, 105))
    d.text((x, 73), title, font=ft, fill='#252422')
    for x1,y1,x2,y2 in [(550,20,765,225),(20,230,760,348)]:
        d.rectangle((x+int(x1*470/780),105+int(y1*220/365),x+int(x2*470/780),105+int(y2*220/365)),outline='#b32623',width=2)
d.text((20, 347), '移除「墨」；設定與玉石文字對齊；三組標籤、進度條、數字一致。', font=small, fill='#514b42')
board.save(out / 'comparison.png')
frames = [Image.open(p).convert('RGB').resize((390, 844), Image.Resampling.LANCZOS) for p in sorted((out / 'frames').glob('hud-*.png'))]
frames[0].save(out / 'hud.gif', save_all=True, append_images=frames[1:], duration=180, loop=0)
