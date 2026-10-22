"""同一seed手機主頁前後對照，紅框標出收起資訊後嘅場景空間。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spar-hud-harvest'
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20)
board=Image.new('RGB',(800,975),'#eee8dd');d=ImageDraw.Draw(board)
d.text((12,10),'演武台排版｜390×844 DPR2・seed42・玉石600／0',font=font,fill='#332e28')
for i,(file,label) in enumerate([('before.png','改前：收益整行佔位'),('after.png','改後：資料分區・掛機收起')]):
 x=5+i*400;d.text((x+8,48),label,font=font,fill='#332e28');im=Image.open(OUT/file).convert('RGB').resize((390,844));board.paste(im,(x,90))
 if i:
  d.rectangle((x+12,90+174,x+378,90+594),outline='#b74335',width=3)
  d.rectangle((x+22,90+530,x+154,90+581),outline='#b74335',width=2)
 else:d.rectangle((x+14,90+174,x+376,90+231),outline='#b74335',width=2)
d.text((12,944),'演武台多約62px；人物沿用原有細比例，玩法／獎勵不變。',font=font,fill='#332e28')
board.save(OUT/'comparison.jpg',quality=93)
