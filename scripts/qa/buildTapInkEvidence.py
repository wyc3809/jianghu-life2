"""第50項：把真手機截圖並排；紅框只作驗收註記，不屬遊戲特效。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/tap-ink'
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(FONT,25);small=ImageFont.truetype(FONT,19)
board=Image.new('RGB',(1100,1050),'#f5efe4');draw=ImageDraw.Draw(board)
draw.text((25,18),'點按水墨 · 390×844 / DPR2 真實畫面',font=font,fill='#292721')
for index,(name,title) in enumerate([
 ('before-press.png','改前：按住出現實黑圓'),
 ('after-press.png','改後：保留器物牌章'),
 ('after-dialog-tap.png','改後：視窗內亦可落墨'),
]):
 source=Image.open(OUT/name).convert('RGB');image=source.copy();image.thumbnail((345,745));x=18+index*365
 board.paste(image,(x,90));draw.text((x,58),title,font=small,fill='#6d2a23')
 if index<2:
  crop=source.crop((12,1465,180,1685)).resize((148,193),Image.Resampling.LANCZOS)
  board.paste(crop,(x,845));draw.rectangle((x,845,x+148,1038),outline='#aa3d31',width=3)
  draw.rectangle((x+6,740,x+80,834),outline='#aa3d31',width=3)
 else:draw.text((x,870),'墨跡集中指尖附近\n最遲520ms收束\n拖動／長按不濺墨',font=small,fill='#302d26',spacing=10)
board.save(OUT/'before-after.jpg',quality=92)
