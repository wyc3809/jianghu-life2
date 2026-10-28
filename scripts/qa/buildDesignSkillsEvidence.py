"""第52項：以同一390×844真存檔畫面製作紅框前後對照。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/design-skills'
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font=ImageFont.truetype(FONT,24);small=ImageFont.truetype(FONT,18)
board=Image.new('RGB',(1620,1850),'#f8f1e3');d=ImageDraw.Draw(board)
d.text((28,16),'家族藏本：先找秘笈，再點入兌換及養成',font=font,fill='#25241f')
d.text((28,54),'同一隔離存檔 · 390 × 844 · DPR 2 · 11門真藏本 · 1,000書頁',font=small,fill='#625d53')
for x,name,title in [(20,'before-gacha-shelf.png','之前：長說明與兌換佔據首屏'),(820,'after-collection-390.png','之後：藏本與功能入口先行')]:
 d.text((x,90),title,font=font,fill='#25241f');im=Image.open(OUT/name).convert('RGB');assert im.size==(780,1688);board.paste(im,(x,132))
d.rectangle((58,132+470,758,132+1480),outline='#b12d26',width=5)
d.rectangle((850,132+380,1570,132+580),outline='#b12d26',width=5)
d.rectangle((850,132+610,1570,132+1290),outline='#b12d26',width=5)
board.save(OUT/'before-after.jpg',quality=90)
