"""固定原始DPR2截圖及紅框，重建引導只展示一次的前後對比。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
r=Path('production/qa/evidence/redesign/guide-once')
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
board=Image.new('RGB',(1600,1830),'#f4efdf');d=ImageDraw.Draw(board)
d.text((20,12),'同一存檔：返回鎮居後，再次進入人物',font=ImageFont.truetype(font,29),fill='#222222')
for x,name,label in [(10,'before-reenter.png','EA0.98.0：再次出現提示及選框'),(810,'after-reenter.png','EA0.98.1：已讀提示不再出現')]:
 board.paste(Image.open(r/name).convert('RGB'),(x,110))
 d.text((x+8,66),label,font=ImageFont.truetype(font,22),fill='#a12d26')
 d.rectangle((x+6,465,x+774,650),outline='#be2b27',width=5)
board.save(r/'before-after.jpg',quality=88)
