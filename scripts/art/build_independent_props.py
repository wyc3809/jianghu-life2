"""從原創道具原圖裁切真正完整物件及握點，不把鉤／戟／簫換成劍槍棍。"""
from pathlib import Path
from PIL import Image
import json,shutil,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation';OUT=ROOT/'public/ink/art/independent/props';OUT.mkdir(exist_ok=True)
src=ART/'sources/weapons-v01.png';im=Image.open(src).convert('RGBA');guides={'hook':((160,0,400,620),(263,120),(252,584),.53),'halberd':((650,0,900,630),(775,285),(771,605),.68),'flute':((0,630,530,1020),(265,760),(492,760),.26),'mechanism':((540,625,1024,1020),(816,808),(595,767),.16),'dart':((650,1020,900,1536),(775,1195),(770,1498),.11)};meta={}
def clean(im):
 a=np.array(im);a[:,:,3][a[:,:,3]<30]=0;a[:,:,:3][a[:,:,3]==0]=0;return Image.fromarray(a)
for name,(box,grip,tip,ratio)in guides.items():
 p=clean(im.crop(box));b=p.getbbox();p=p.crop(b);x,y=box[0]+b[0],box[1]+b[1];target=OUT/(name+'.webp');p.save(target,quality=96,method=4);meta[name]={'src':'ink/art/independent/props/'+target.name,'w':p.width,'h':p.height,'grip':[grip[0]-x,grip[1]-y],'tip':[tip[0]-x,tip[1]-y],'ratio':ratio,'source':str(src.relative_to(ROOT)),'sourceBox':box,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
needle=ART/'sources/needle-v01.png'
if not needle.exists():shutil.copy2(ROOT/'../generated_images/exec-62e28ba3-c2df-4c42-b235-5d004f9e0456.png',needle)
p=clean(Image.open(needle).convert('RGBA'));b=p.getbbox();p=p.crop(b);p.thumbnail((80,1024),Image.Resampling.LANCZOS);target=OUT/'needle.webp';p.save(target,quality=96,method=4);meta['needle']={'src':'ink/art/independent/props/needle.webp','w':p.width,'h':p.height,'grip':[p.width*.5,p.height*.22],'tip':[p.width*.5,p.height*.98],'ratio':.055,'source':str(needle.relative_to(ROOT)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
meta['rejectedSourceCell']={'file':str(src.relative_to(ROOT)),'cell':'左下','reason':'生成成短刃而非細針，不投入遊戲；細針另製'}
(ROOT/'src/appearance/independent').mkdir(exist_ok=True);(ROOT/'src/appearance/independent/props.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');print('DISTINCT_PROPS',len(guides)+1)
# 沿用既有弓原畫，分離弓身、真弦紋理及箭，供同幀拉弦；沒有補畫或SVG。
bow=Image.open(ROOT/'public/ink/spar/weapon-bow.webp').convert('RGBA');a=np.array(bow);guides=[(0,105),(60,99),(100,90),(130,76),(150,58),(200,39),(250,43),(300,61),(350,64),(400,54),(450,48),(500,42),(550,46),(580,55),(600,64),(630,78),(670,90),(700,100),(767,105)]
for y in range(bow.height):
 limit=np.interp(y,[p[0]for p in guides],[p[1]for p in guides]);a[y,int(limit):,3]=0
bow=clean(Image.fromarray(a));bow.save(OUT/'bow.webp',quality=96,method=4)
meta['bow']={'src':'ink/art/independent/props/bow.webp','w':105,'h':768,'grip':[35,350],'tip':[86,745],'ratio':.42,'flipX':-1,'source':'public/ink/spar/weapon-bow.webp','processing':'按逐行原畫指引去除烘入弦及箭；同幀獨立播放'}
original=Image.open(ROOT/'public/ink/spar/weapon-bow.webp').convert('RGBA');original.crop((102,130,105,600)).save(OUT/'bow-cord.webp',quality=96,method=4);original.crop((62,145,100,595)).save(OUT/'arrow.webp',quality=96,method=4)
meta['cord']={'src':'ink/art/independent/props/bow-cord.webp','w':3,'h':470,'grip':[1.5,0],'tip':[1.5,470],'ratio':.4}
meta['arrow']={'src':'ink/art/independent/props/arrow.webp','w':38,'h':450,'grip':[21,405],'tip':[21,5],'ratio':.4}
(ROOT/'src/appearance/independent/props.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')

# 每個投入遊戲的圖像均保留處理後及來源hash。
for name,v in meta.items():
 if 'src'not in v:continue
 if name in ['cord','arrow']:v['source']='public/ink/spar/weapon-bow.webp'
 v['sha256']=hashlib.sha256((ROOT/'public'/v['src']).read_bytes()).hexdigest()
 if v.get('source'):v['sourceSha256']=hashlib.sha256((ROOT/v['source']).read_bytes()).hexdigest()
(ROOT/'src/appearance/independent/props.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
