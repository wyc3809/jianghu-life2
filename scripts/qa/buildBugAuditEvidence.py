"""第53項：相同存檔、390×844 DPR2的修煉及門派保存前後圖。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[2];out=root/'production/qa/evidence/redesign/bug-audit-ea097';font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',25);small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',18)
for name,before,after,title in [('practice','before-poor-practice.png','after-poor-practice.png','零銀兩：不能鑄器時不扣修煉次數'),('save','before-founder-reload.png','after-founder-initial.png','同一有門派存檔：重新載入後保留門派及弟子')]:
 if not (out/after).exists():continue
 board=Image.new('RGB',(1620,1850),'#f8f1e3');d=ImageDraw.Draw(board);d.text((22,18),title,font=font,fill='#25241f');d.text((22,57),'左：EA0.97.0 · 右：EA0.97.1 · 真資料／隔離存檔 · 390 × 844 DPR2',font=small,fill='#625d53')
 for x,file,label in [(20,before,'修正前'),(820,after,'修正後')]:
  d.text((x,94),label,font=font,fill='#25241f');im=Image.open(out/file).convert('RGB');assert im.size==(780,1688);board.paste(im,(x,132))
 if name=='save':
  d.rectangle((45,132+410,775,132+1050),outline='#b12d26',width=5);d.rectangle((845,132+410,1575,132+1200),outline='#b12d26',width=5)
 else:
  d.rectangle((45,132+400,775,132+1530),outline='#b12d26',width=5);d.rectangle((845,132+400,1575,132+1530),outline='#b12d26',width=5)
 board.save(out/(name+'-before-after.jpg'),quality=89)
