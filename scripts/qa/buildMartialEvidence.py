"""第51項：同一滿欄存檔及同DPR令牌真截圖，紅框只作驗收標示。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/martial-ui'
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';font=ImageFont.truetype(FONT,24);small=ImageFont.truetype(FONT,19)
for target,items,title in [
 ('before-after.jpg',[('before-loadout.png','改前：直排配搭'),('after-loadout-390.png','改後：七格一屏'),('after-volumes.png','七卷：已學／已得／未得')],'武學配搭 · 同一滿欄存檔 / 390×844 DPR2'),
 ('token-before-after.jpg',[('before-token-3-result.png','改前：多pass粗描邊'),('after-token-3-result.png','改後：玉紋／金屬／懸穗'),('actual-rank-result.png','真苦練升階結果')],'武學令 · 真3D演出 / 同尺寸DPR2靜圖'),
]:
 board=Image.new('RGB',(1200,970),'#f5eee1');draw=ImageDraw.Draw(board);draw.text((20,12),title,font=font,fill='#302c24')
 for i,(name,label) in enumerate(items):
  image=Image.open(OUT/name).convert('RGB');image.thumbnail((380,824));x=10+i*400;board.paste(image,(x,88));draw.text((x,52),label,font=small,fill='#8d3d31')
  if target=='before-after.jpg':box=(x+5,88+195,x+375,88+805)
  else:box=(x+95,88+195,x+285,88+450)
  draw.rectangle(box,outline='#a13e31',width=3)
 draw.text((20,935),'紅框為QA註記；原畫面與完整操作GIF另附。',font=small,fill='#655b4b');board.save(OUT/target,quality=92)
