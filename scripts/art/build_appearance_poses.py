"""完整姿勢人物：以連通區裁切原圖，保留完整手腳；生成來源錨點及相同姿勢後備。"""
from pathlib import Path
from collections import deque
from PIL import Image,ImageFilter
import numpy as np,json,hashlib,io,base64
ROOT=Path(__file__).resolve().parents[2];SRC=ROOT/'design/art/appearance/sources';OUT=ROOT/'public/ink/art/appearance'
POSES=['idle','walkA','walkB','windup','strike','hurt','down','seated']

def components(im,count):
 a=np.array(im.convert('RGBA'));mask=a[:,:,3]>32;seen=np.zeros(mask.shape,dtype=bool);groups=[]
 for yy,xx in zip(*np.nonzero(mask)):
  if seen[yy,xx]:continue
  group=[];q=deque([(int(yy),int(xx))]);seen[yy,xx]=True
  while q:
   y,x=q.popleft();group.append((y,x))
   for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
  if len(group)>3000:groups.append(group)
 groups=sorted(groups,key=len,reverse=True)[:count];assert len(groups)==count,(count,len(groups))
 results=[]
 for group in groups:
  pts=np.array(group);y0,x0=pts.min(axis=0);y1,x1=pts.max(axis=0)+1
  keep=np.zeros(mask.shape,dtype=np.uint8);keep[pts[:,0],pts[:,1]]=255
  keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(5)))>0
  copy=a.copy();copy[:,:,3][~keep]=0;copy[:,:,3][copy[:,:,3]<20]=0
  # 生成邊緣偶見紅黃色像素，清邊但不改正常膚色。
  rgb=copy[:,:,:3];bad=((rgb[:,:,0]>220)&(rgb[:,:,1]<85)&(rgb[:,:,2]<85))|((rgb[:,:,0]>220)&(rgb[:,:,1]>165)&(rgb[:,:,2]<70));copy[:,:,3][bad]=0
  box=(max(0,int(x0)-6),max(0,int(y0)-6),min(im.width,int(x1)+6),min(im.height,int(y1)+6))
  results.append((box,Image.fromarray(copy).crop(box)))
 return results

def hand_grip(body):
 # 頭部不在身體圖中；上半身兩個主要膚色區即雙手，用真正拳心定位兵器。
 a=np.array(body.convert('RGBA'));r,g,b=a[:,:,0].astype(int),a[:,:,1].astype(int),a[:,:,2].astype(int)
 mask=(a[:,:,3]>128)&(r>150)&(g>85)&(r-g>12)&(r-b>28)&(g>b*1.05);mask[int(body.height*.62):]=False
 seen=np.zeros(mask.shape,dtype=bool);groups=[]
 for yy,xx in zip(*np.nonzero(mask)):
  if seen[yy,xx]:continue
  q=deque([(int(yy),int(xx))]);seen[yy,xx]=True;group=[]
  while q:
   y,x=q.popleft();group.append((y,x))
   for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
  if len(group)>40:groups.append(group)
 if not groups:return None
 hands=sorted(groups,key=len,reverse=True)[:2];front=max(hands,key=lambda p:np.mean(np.array(p)[:,1]));pts=np.array(front)
 return [float(pts[:,1].mean()),float(pts[:,0].mean())]

mapping=json.loads((ROOT/'src/appearance/asset-map.json').read_text());fallback={p:v for p,v in json.loads((ROOT/'src/appearance/asset-fallback.json').read_text()).items() if '/head-' in p};mapping['bodies']={};layout={};report=[]
seated_source=Image.open(SRC/'poses-seated-original.png');seated_bodies=sorted(components(seated_source,3),key=lambda v:v[0][0])
for outfit_index,outfit in enumerate(['traveller','scholar','cloak']):
 im=Image.open(SRC/('poses-'+outfit+'-original.png'));items=components(im,8)
 top=sorted([v for v in items if v[0][1]<im.height*.4],key=lambda v:v[0][0]);bottom=sorted([v for v in items if v[0][1]>=im.height*.4],key=lambda v:v[0][0]);assert len(top)==len(bottom)==4,(outfit,[b for b,_ in items])
 mapping['bodies'][outfit]={};layout[outfit]={};reference=0
 for pose,(box,body) in zip(POSES,top+bottom):
  density=1.0
  if pose=='seated':
   old_width=body.width;box,body=seated_bodies[outfit_index];density=old_width/body.width
  ar=np.array(body);yy,xx=np.nonzero(ar[:,:,3]>100);topY=int(yy.min());near=(ar[topY:topY+10,:,3]>100).nonzero()[1];neck=[float((near.min()+near.max())/2),float(topY+35/density)]
  if pose=='down':neck=[body.width*.16,body.height*.16]
  origin=[neck[0] if pose!='down' else body.width*.5,float(yy.max())]
  if pose=='idle':reference=origin[1]-neck[1]
  grip={'idle':(.74,.34),'walkA':(.91,.41),'walkB':(.91,.41),'windup':(.85,.23),'strike':(.94,.12),'hurt':(.55,.30),'down':(.5,.5),'seated':(.5,.55)}[pose]
  target=OUT/('body-'+outfit+'-'+pose+'.webp');body.save(target,'WEBP',quality=95,method=4)
  path='ink/art/appearance/'+target.name;mapping['bodies'][outfit][pose]=path
  hand=hand_grip(body) if pose not in ['down','seated'] else [body.width*grip[0],body.height*grip[1]]
  layout[outfit][pose]={'width':body.width*density,'height':body.height*density,'neck':[v*density for v in neck],'origin':[v*density for v in origin],'grip':[v*density for v in hand],'sourceBox':list(box),'sourceDensity':1/density}
  tiny=body.copy();tiny.thumbnail((144,160),Image.Resampling.LANCZOS);buf=io.BytesIO();tiny.save(buf,'WEBP',quality=85,method=4);fallback[path]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
  report.append({'outfit':outfit,'pose':pose,'size':list(body.size),'transparentFraction':float((ar[:,:,3]==0).mean()),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
 layout[outfit]['pixelsPerUnit']=reference/300
(ROOT/'src/appearance/asset-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n');(ROOT/'src/appearance/asset-fallback.json').write_text(json.dumps(fallback,ensure_ascii=False)+'\n');(ROOT/'src/appearance/pose-layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n');(ROOT/'design/art/appearance/pose-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('CONNECTED_POSES',len(report))
