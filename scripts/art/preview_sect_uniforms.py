"""十派服飾接觸表；檢視真正出貨WebP及完整頭腳，不拼身體。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'production/qa/evidence/redesign/all-sect-uniforms/contacts';OUT.mkdir(parents=True,exist_ok=True)
content=json.loads((ROOT/'content/sects/sects.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
title=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc',26)
heads={'male':['bamboo','topknot','master','silver'],'female':['ponytail','loose','bun','short']}
labels={'bamboo':'斗笠','topknot':'束髮','master':'宗師','silver':'霜髮','ponytail':'高馬尾','loose':'披髮','bun':'髮髻','short':'短髮'}
for sect in content['sects'][1:]:
 for sex,choices in heads.items():
  out=Image.new('RGB',(1280,1348),(238,229,211));d=ImageDraw.Draw(out);d.text((16,8),f"{sect['name']} · 八職位完整立繪 · {'男' if sex=='male' else '女'}",font=title,fill='#29231e')
  for rank in range(8):
   d.text((rank*160+8,48),content['ranks'][rank]['name'],font=font,fill='#6c352b')
   for j,head in enumerate(choices):
    im=Image.open(ROOT/f"public/ink/art/wardrobe/{head}-uniform-{sect['id'][5:]}-{rank}.webp").convert('RGBA')
    bounds=im.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();im=im.crop(bounds);im.thumbnail((148,280),Image.Resampling.LANCZOS)
    x=rank*160+(160-im.width)//2;y=78+j*316+(280-im.height);out.paste(im,(x,y),im)
    d.text((rank*160+8,78+j*316+284),labels[head],font=font,fill='#393028')
  out.save(OUT/f"{sect['id'][5:]}-{sex}.jpg",quality=92)
print('CONTACTS',18,flush=True)
