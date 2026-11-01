"""同幅原稿／真瀏覽器截圖與舊原型對照；只排證據板，不修改遊戲美術。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'production/qa/evidence/redesign/sect-war'
font_path = next(p for p in [Path('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'), Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')] if p.exists())
font = ImageFont.truetype(str(font_path), 19)
small = ImageFont.truetype(str(font_path), 14)
source = Image.open(ROOT / 'design/art/sect-battle/selected-portrait.png').convert('RGB').resize((390, 844), Image.Resampling.LANCZOS)
current = Image.open(OUT / 'showcase/playing-390.png').convert('RGB').resize((390, 844), Image.Resampling.LANCZOS)
before = Image.open(ROOT / 'production/qa/evidence/redesign/neck-review/02-current-melee.png').convert('RGB').resize((390, 844), Image.Resampling.LANCZOS)

def board(left, right, titles, footer, name, marks=False):
 image=Image.new('RGB',(830,930),'#f7f2e7');draw=ImageDraw.Draw(image)
 for x,im,title in [(15,left,titles[0]),(425,right,titles[1])]:
  draw.text((x,10),title,font=font,fill='#28231e');image.paste(im,(x,43))
  if marks:
   draw.rectangle((x+3,43+170,x+387,43+678),outline='#ad352a',width=2)
   draw.rectangle((x+3,43+779,x+387,43+840),outline='#ad352a',width=2)
 draw.text((15,899),footer,font=small,fill='#554d40');image.save(OUT/name,quality=94)

board(source,current,('玩家選定直版原稿','正式構建 · 實際試演00:04'),'App內容同幅390×844；實作來源780×1688／DPR2。示範明示不計戰績。','source-comparison.jpg')
board(before,current,('EA0.99.2 · 開發原型','EA0.100.0 · 正式接入'),'紅框：單線戰場、完整水彩姿勢、實際操作；前後為不同戰鬥時刻。','before-after.jpg',True)
detail=Image.new('RGB',(830,520),'#f7f2e7');d=ImageDraw.Draw(detail)
for x,im,title in [(15,source,'原稿'),(425,current,'真元件')]:
 d.text((x,8),title,font=font,fill='#28231e')
 detail.paste(im.crop((0,665,390,844)).resize((390,179)),(x,38))
 detail.paste(im.crop((80,205,310,375)).resize((390,288)),(x,228))
detail.save(OUT/'focus-comparison.jpg',quality=95)
print('COMPARISON_READY')
