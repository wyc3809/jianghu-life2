"""整理實際抽卡截圖；兩張畫面交替示意按鈕狀態，唔合成遊戲美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p = Path(__file__).resolve().parents[2] / 'production/qa/evidence/redesign/gacha-quick-equip'
fontpath = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
if not Path(fontpath).exists():
    fontpath = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
f = ImageFont.truetype(fontpath, 19)
s = ImageFont.truetype(fontpath, 14)
im = Image.new('RGB', (808, 782), '#f6f1e6')
d = ImageDraw.Draw(im)
d.text((14, 8), '抽卡揭曉：揀中武學，即學即裝', font=f, fill='#28241e')
d.text((14, 36), '同一批十連・390×690・卡池及機率未改', font=s, fill='#6b5f50')
for x, src, label in [(10, 'before-reveal.png', '改前：先領取，再入收藏／人物裝備'),
                       (408, 'chromium-reveal-before.png', '改後：兩行十張，直接替換對應主修')]:
    a = Image.open(p / src).convert('RGB').resize((390, 690), Image.Resampling.LANCZOS)
    im.paste(a, (x, 83))
    d.text((x, 61), label, font=s, fill='#a33a32')
d.rectangle((420, 83 + 598, 680, 83 + 677), outline='#af342c', width=2)
im.save(p / 'comparison.jpg', quality=91, optimize=True)
frames = [Image.open(p / name).convert('RGB').resize((390, 690), Image.Resampling.LANCZOS).quantize(colors=192)
          for name in ['chromium-reveal-before.png', 'chromium-reveal-after.png']]
frames[0].save(p / 'equip-example.gif', save_all=True, append_images=frames[1:], duration=[1800, 1800], loop=0, disposal=2)
