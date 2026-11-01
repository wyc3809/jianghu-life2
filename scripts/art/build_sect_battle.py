"""會武原畫處理：完整連通身體、原圖頸／握點、同圖後備與素材映射；不重畫人物。"""
from pathlib import Path
from collections import deque
from PIL import Image,ImageFilter
import numpy as np,json,io,base64,hashlib
ROOT=Path(__file__).resolve().parents[2];SRC=ROOT/'design/art/sect-battle/sources';OUT=ROOT/'public/ink/art/sect-battle';OUT.mkdir(parents=True,exist_ok=True)
POSES=['idle','walkA','walkB','windup','strikeA','followA','strikeB','followB','hurt','guard','down','jump']
manifest={'bodies':{},'images':{},'weapons':{}};layout={};fallback={};validation=[]
def save(im,name,tiny=120):
 path='ink/art/sect-battle/'+name+'.webp';im.save(ROOT/'public'/path,'WEBP',quality=95,method=6)
 copy=im.copy();copy.thumbnail((tiny,tiny),Image.Resampling.LANCZOS);buf=io.BytesIO();copy.save(buf,'WEBP',quality=85);fallback[path]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode();return path
def bodies(source):
 ar=np.array(source.convert('RGBA'));mask=ar[:,:,3]>32;seen=np.zeros(mask.shape,dtype=bool);groups=[]
 for yy,xx in zip(*np.nonzero(mask)):
  if seen[yy,xx]:continue
  pts=[];q=deque([(int(yy),int(xx))]);seen[yy,xx]=True
  while q:
   y,x=q.popleft();pts.append((y,x))
   for ny,nx in((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=ny<mask.shape[0]and 0<=nx<mask.shape[1]and mask[ny,nx]and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
  if len(pts)>2000:groups.append(np.array(pts))
 groups=sorted(groups,key=len,reverse=True)[:12];assert len(groups)==12
 groups.sort(key=lambda pts:float(pts[:,0].mean()));ordered=[]
 for row in range(3):ordered+=sorted(groups[row*4:(row+1)*4],key=lambda pts:float(pts[:,1].mean()))
 result=[]
 for pts in ordered:
  y0,x0=pts.min(axis=0);y1,x1=pts.max(axis=0)+1
  keep=np.zeros(mask.shape,dtype=np.uint8);keep[pts[:,0],pts[:,1]]=255;keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(5)))>0
  copy=ar.copy();copy[:,:,3][~keep]=0;copy[:,:,3][copy[:,:,3]<25]=0
  r,g,b=[copy[:,:,i].astype(int)for i in range(3)];bad=((r>220)&(g<85)&(b<85))|((r>220)&(g>165)&(b<75));copy[:,:,3][bad]=0
  box=(max(0,int(x0)-6),max(0,int(y0)-6),min(source.width,int(x1)+6),min(source.height,int(y1)+6))
  cropped=Image.fromarray(copy).crop(box);padded=Image.new('RGBA',(cropped.width+12,cropped.height+12));padded.alpha_composite(cropped,(6,6));result.append((box,padded))
 return result
for outfit in['traveller','scholar','cloak']:
 source=Image.open(SRC/(outfit+'-original.png'));marks=json.loads((SRC/(outfit+'-landmarks.json')).read_text());manifest['bodies'][outfit]={};layout[outfit]={}
 for pose,(box,im)in zip(POSES,bodies(source)):
  origin=[marks[pose]['neck'][0]-box[0]+6,im.getbbox()[3]-1]
  neck=[marks[pose]['neck'][0]-box[0]+6,marks[pose]['neck'][1]-box[1]+6]
  grip=[marks[pose]['grip'][0]-box[0]+6,marks[pose]['grip'][1]-box[1]+6]
  assert 0<=neck[0]<im.width and 0<=neck[1]<im.height,(outfit,pose,'neck',box,neck)
  assert 0<=grip[0]<im.width and 0<=grip[1]<im.height,(outfit,pose,'grip',box,grip)
  path=save(im,outfit+'-'+pose);manifest['bodies'][outfit][pose]=path
  layout[outfit][pose]={'width':im.width,'height':im.height,'neck':neck,'grip':grip,'origin':origin,'sourceBox':list(box),'rotation':-1.15 if pose=='down'else -.12 if pose in['strikeA','strikeB','jump']else 0}
  if pose=='idle':layout[outfit]['pixelsPerUnit']=(origin[1]-neck[1])/300
  validation.append({'outfit':outfit,'pose':pose,'size':list(im.size),'sha256':hashlib.sha256((ROOT/'public'/path).read_bytes()).hexdigest()})
back=Image.open(SRC/'backdrop-original.png').convert('RGB');back.thumbnail((1080,1600),Image.Resampling.LANCZOS);manifest['images']['backdrop']=save(back,'backdrop',256)
for name,path in [('impact','ink/art/fx/ink-splash.webp'),('thrust','ink/art/artfx/thrust.webp')]:
 im=Image.open(ROOT/'public'/path).convert('RGBA');manifest['images'][name]=save(im,name,64)
ring=Image.open(SRC/'portrait-ring-original.png').convert('RGBA');a=np.array(ring);a[:,:,3][a[:,:,3]<25]=0;ring=Image.fromarray(a);ring=ring.crop(ring.getbbox());ring.thumbnail((256,256),Image.Resampling.LANCZOS);manifest['images']['portraitRing']=save(ring,'portrait-ring',96)
flags=Image.open(SRC/'flags-original.png').convert('RGBA')
for i,name in enumerate(['jade','red']):
 im=flags.crop((i*flags.width//2,0,(i+1)*flags.width//2,flags.height));a=np.array(im);a[:,:,3][a[:,:,3]<32]=0;im=Image.fromarray(a);im=im.crop(im.getbbox());im.thumbnail((240,360),Image.Resampling.LANCZOS);manifest['images']['flag'+str(i)]=save(im,'flag-'+name,80)
controls=Image.open(SRC/'controls-original.png').convert('RGBA')
for i,name in enumerate(['pause','play','skip','roster']):
 im=controls.crop((i*controls.width//4,0,(i+1)*controls.width//4,controls.height));a=np.array(im);a[:,:,3][a[:,:,3]<30]=0;im=Image.fromarray(a);im=im.crop(im.getbbox());im.thumbnail((96,96),Image.Resampling.LANCZOS);manifest['images'][name]=save(im,'control-'+name,32)
weapons=Image.open(SRC/'weapons-original.png').convert('RGBA');weapon_layout={}
for name,marks in json.loads((SRC/'weapons-landmarks.json').read_text()).items():
 box=marks['bbox'];im=weapons.crop(tuple(box));a=np.array(im);a[:,:,3][a[:,:,3]<20]=0;im=Image.fromarray(a);scale=min(1,512/im.height);im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
 padded=Image.new('RGBA',(im.width+12,im.height+12));padded.alpha_composite(im,(6,6));manifest['weapons'][name]=save(padded,'weapon-'+name,128)
 weapon_layout[name]={'width':padded.width,'height':padded.height,'grip':[(marks['grip'][0]-box[0])*scale+6,(marks['grip'][1]-box[1])*scale+6],'tip':[(marks['tip'][0]-box[0])*scale+6,(marks['tip'][1]-box[1])*scale+6]}
for file,data in [('assets.json',manifest),('layout.json',layout),('fallback.json',fallback)]:
 (ROOT/'src/sectBattle'/file).write_text(json.dumps(data,ensure_ascii=False,indent=2 if file!='fallback.json'else None)+'\n')
(ROOT/'src/sectBattle/weapon-layout.json').write_text(json.dumps(weapon_layout,ensure_ascii=False,indent=2)+'\n')
(ROOT/'design/art/sect-battle/validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n');print('SECT_ART',len(validation),'complete body frames')
