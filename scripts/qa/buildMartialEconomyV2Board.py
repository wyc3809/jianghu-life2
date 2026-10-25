"""保留原截圖，只為前後對比板加說明及紅框。"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[2]
p=root/'production/qa/evidence/redesign/martial-economy-v2'
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
f=ImageFont.truetype(font,20);small=ImageFont.truetype(font,16)
board=Image.new('RGB',(820,1908),'#f4eee2');d=ImageDraw.Draw(board)
d.text((20,10),'第44項原型：配搭與書頁兌換',font=f,fill='#282c29')
d.text((20,43),'隔離seed42；390×844；左：EA0.90.0舊版，右：本輪原型',font=small,fill='#595449')
for row,(a,b,title) in enumerate([
 ('before-skills.png','chromium-390-844-duel.png','人物頁加入普通／對戰配搭'),
 ('before-shelf.png','chromium-390-844-exchange.png','200頁自選缺卷；兌換及按鈕換行')]):
 y=80+row*914;d.text((20,y),title,font=f,fill='#282c29')
 for col,file in enumerate([a,b]):board.paste(Image.open(p/file).convert('RGB').resize((390,844)),(10+col*410,y+34))
 d.rectangle((423,y+270,802,y+419) if row==0 else (423,y+366,802,y+512),outline='#b13b2e',width=3)
board.save(p/'comparison.png')
