"""人物心性四印：固定seed，透明位圖；中央留給遊戲毛筆字。"""
from pathlib import Path
from PIL import Image, ImageDraw
import random, math
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/ink/art/nature';OUT.mkdir(parents=True,exist_ok=True)
COLORS={'xia':(53,98,84),'xie':(72,86,106),'kuang':(147,96,44),'e':(147,59,55)}
for i,(kind,color) in enumerate(COLORS.items()):
 rng=random.Random(721+i);im=Image.new('RGBA',(384,384));d=ImageDraw.Draw(im)
 def stroke(points,width=3,alpha=170):
  pts=[(int(x*3),int(y*3)) for x,y in points];d.line(pts,fill=(*color,alpha),width=width*3,joint='curve')
 # 開口印邊：有乾筆缺口，不用規則方框填底。
 for pts in [[(18,53),(17,19),(44,17)],[(54,17),(108,19),(110,46)],[(109,59),(108,102),(77,107)],[(65,109),(19,107),(18,67)]]:
  for n in range(3):stroke([(x+rng.uniform(-1.3,1.3),y+rng.uniform(-1,1)) for x,y in pts],1,70+n*28)
 if kind=='xia':
  stroke([(96,122),(101,99),(101,80),(106,61)],2,190)
  for x,y,sgn in [(101,99,-1),(102,87,1),(104,74,-1)]:
   d.polygon([(int(x*3),int(y*3)),(int((x+sgn*17)*3),int((y-13)*3)),(int((x+sgn*11)*3),int((y+1)*3))],fill=(*color,185))
 elif kind=='xie':
  for shift in [0,11]:
   pts=[(104+math.sin(t*.16)*9+shift*.3,t) for t in range(74+shift,124,2)];stroke(pts,2,170)
 elif kind=='kuang':
  for pts in [[(88,120),(119,83),(107,104),(125,93)],[(84,109),(104,90)],[(102,121),(122,103)]]:stroke(pts,3,185)
 else:
  stroke([(89,122),(100,105),(108,91),(117,72)],2,200)
  for pts in [[(98,107),(86,100),(104,101)],[(108,90),(124,91),(111,82)],[(94,115),(112,118),(102,106)]]:stroke(pts,2,185)
 # 印泥自然粒缺，固定seed不影響遊戲RNG。
 for _ in range(850):
  x,y=rng.randrange(384),rng.randrange(384)
  if im.getpixel((x,y))[3]:d.ellipse((x,y,x+rng.randrange(1,5),y+rng.randrange(1,4)),fill=(0,0,0,0))
 im.resize((192,192),Image.Resampling.LANCZOS).save(OUT/f'nature-{kind}.webp',lossless=True)
 print(kind,flush=True)
