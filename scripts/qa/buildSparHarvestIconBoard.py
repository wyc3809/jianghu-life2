"""淨icon入口前後對照：固定390×844、DPR2、seed42。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spar-harvest-icon'
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',20)
board=Image.new('RGB',(800,975),'#eee8dd');d=ImageDraw.Draw(board)
d.text((12,10),'掛機收成入口｜390×844 DPR2・seed42・玉石600／0',font=font,fill='#332e28')
for i,(f,label) in enumerate([('before.png','改前：文字＋長方框'),('after.png','改後：淨香爐icon')]):
 x=5+i*400;d.text((x+8,48),label,font=font,fill='#332e28');im=Image.open(OUT/f).convert('RGB').resize((390,844));board.paste(im,(x,90))
 d.rectangle((x+22,90+527,x+(154 if not i else 74),90+584),outline='#b74335',width=2)
d.text((12,944),'透明44×44觸控範圍；點開仍可睇詳情同收成。',font=font,fill='#332e28');board.save(OUT/'comparison.jpg',quality=93)
