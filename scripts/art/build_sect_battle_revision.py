"""否決稿後的原稿匹配：只裁切原創位圖、轉WebP與映射；保留舊來源。"""
from pathlib import Path
from PIL import Image, ImageFilter
from scipy import ndimage
import numpy as np, json, io, base64, hashlib

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'design/art/sect-battle/revision/sources'
OUT=ROOT/'public/ink/art/sect-battle/revision';OUT.mkdir(parents=True,exist_ok=True)
POSES=['idle','walkA','walkB','windup','strikeA','followA','strikeB','followB','hurt','guard','down','jump']
manifest=json.loads((ROOT/'src/sectBattle/assets.json').read_text())
layout=json.loads((ROOT/'src/sectBattle/layout.json').read_text())
fallback=json.loads((ROOT/'src/sectBattle/fallback.json').read_text())
validation=[]

def save(im,name,tiny=120):
 path='ink/art/sect-battle/revision/'+name+'.webp';dest=ROOT/'public'/path
 source_name='heads-original.png' if name.startswith('head-') else 'backdrop-original.png' if name=='backdrop' else name.split('-')[0]+'-original.png'
 if not dest.exists() or dest.stat().st_mtime < (SRC/source_name).stat().st_mtime:
  im.save(dest,'WEBP',quality=96,method=3)
 small=im.copy();small.thumbnail((tiny,tiny),Image.Resampling.LANCZOS);buf=io.BytesIO();small.save(buf,'WEBP',quality=86,method=0)
 fallback[path]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
 validation.append({'path':path,'size':list(im.size),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
 return path

def components(image,count,cols):
 a=np.array(image.convert('RGBA'));labels,n=ndimage.label(a[:,:,3]>32);counts=np.bincount(labels.ravel());ids=sorted(range(1,n+1),key=lambda i:int(counts[i]),reverse=True)[:count]
 assert len(ids)==count and min(counts[i] for i in ids)>2000
 boxes=ndimage.find_objects(labels)
 ids.sort(key=lambda i:float(np.nonzero(labels==i)[0].mean()));ordered=[]
 for row in range(count//cols):ordered+=sorted(ids[row*cols:(row+1)*cols],key=lambda i:float(np.nonzero(labels==i)[1].mean()))
 for i in ordered:
  sy,sx=boxes[i-1];x0=max(0,sx.start-4);x1=min(image.width,sx.stop+4);y0=max(0,sy.start-4);y1=min(image.height,sy.stop+4)
  copy=a[y0:y1,x0:x1].copy();keep=labels[y0:y1,x0:x1]==i
  keep=np.array(Image.fromarray(keep.astype('uint8')*255).filter(ImageFilter.MaxFilter(7)))>0
  copy[:,:,3][~keep]=0;copy[:,:,3][copy[:,:,3]<24]=0
  r,g,b=[copy[:,:,k].astype(int) for k in range(3)]
  fringe=((r>210)&(g<85)&(b<90))|((r>205)&(g>160)&(b<75))|((g>190)&(r<110)&(b<110))
  copy[:,:,3][fringe]=0
  im=Image.fromarray(copy);pad=Image.new('RGBA',(im.width+12,im.height+12));pad.alpha_composite(im,(6,6))
  yield (x0,y0,x1,y1),pad

for outfit in ['traveller','scholar','cloak']:
 marksfile=SRC/(outfit+'-landmarks.json')
 if not marksfile.exists():continue
 source=Image.open(SRC/(outfit+'-original.png'));marks=json.loads(marksfile.read_text());layout[outfit]={};manifest['bodies'][outfit]={}
 for pose,(box,im) in zip(POSES,components(source,12,4)):
  local=lambda p:[p[0]-box[0]+6,p[1]-box[1]+6]
  neck=local(marks[pose]['neck']);grip=local(marks[pose]['grip']);foot=local(marks[pose]['foot'])
  assert all(0<=p[0]<im.width and 0<=p[1]<im.height for p in [neck,grip,foot]),(outfit,pose,box,marks[pose])
  origin=[neck[0],foot[1]]
  rotation=marks[pose].get('rotation',(1.15 if neck[0]>im.width/2 else -1.15) if pose=='down' else -.12 if pose in ['strikeA','strikeB','jump']else 0)
  layout[outfit][pose]={'width':im.width,'height':im.height,'neck':neck,'grip':grip,'origin':origin,'sourceBox':list(box),'rotation':rotation,'weaponGrip':marks[pose].get('weaponGrip',True)}
  if pose=='idle':layout[outfit]['pixelsPerUnit']=(origin[1]-neck[1])/300
  manifest['bodies'][outfit][pose]=save(im,outfit+'-'+pose)

manifest['heads']={}
for key,(_,im) in zip(['bamboo','topknot','master','silver','ponytail','loose','bun','short'],components(Image.open(SRC/'heads-original.png'),8,4)):
 im.thumbnail((480,480),Image.Resampling.LANCZOS);manifest['heads'][key]=save(im,'head-'+key,120)
manifest['images']['backdrop']=save(Image.open(SRC/'backdrop-original.png').convert('RGB'),'backdrop',256)
impact=Image.open(SRC/'ink-contact-original.png').convert('RGBA');impact=impact.crop(impact.getbbox());impact.thumbnail((384,384),Image.Resampling.LANCZOS)
impact_path='ink/art/sect-battle/revision/ink-contact.webp';impact.save(ROOT/'public'/impact_path,'WEBP',quality=96,method=3);manifest['images']['impact']=impact_path
validation.append({'path':impact_path,'size':list(impact.size),'sha256':hashlib.sha256((ROOT/'public'/impact_path).read_bytes()).hexdigest()})
buf=io.BytesIO();impact.thumbnail((96,96),Image.Resampling.LANCZOS);impact.save(buf,'WEBP',quality=90,method=0);fallback[impact_path]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
icon=Image.open(SRC.parent.parent/'selected-portrait.png').convert('RGB').crop((32,70,60,115));pixels=np.array(icon);alpha=np.clip((180-pixels.mean(axis=2))/100,0,1)*255
rgba=np.zeros((icon.height,icon.width,4),dtype='uint8');rgba[:,:,:3]=[25,25,22];rgba[:,:,3]=alpha.astype('uint8');arrow=Image.fromarray(rgba)
path='ink/art/sect-battle/revision/icon-back.webp';arrow.save(ROOT/'public'/path,'WEBP',lossless=True);manifest['images']['back']=path
validation.append({'path':path,'size':list(arrow.size),'sha256':hashlib.sha256((ROOT/'public'/path).read_bytes()).hexdigest()})
buf=io.BytesIO();arrow.save(buf,'WEBP',lossless=True);fallback[path]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
used=set(manifest['images'].values())|set(manifest['weapons'].values())|set(manifest['heads'].values())
for frames in manifest['bodies'].values():used.update(frames.values())
fallback={k:v for k,v in fallback.items()if k in used}
for name,data in [('assets.json',manifest),('layout.json',layout),('fallback.json',fallback)]:
 (ROOT/'src/sectBattle'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2 if name!='fallback.json'else None)+'\n')
(SRC.parent/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
print('REVISION_ART',len(validation),'files; bodies',[k for k in ['traveller','scholar','cloak']if (SRC/(k+'-landmarks.json')).exists()])
