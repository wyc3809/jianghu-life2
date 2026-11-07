"""獨立動作的三套衣著材質：只裁切／清低alpha／圖集打包；關節讀人工指引，共用骨架。"""
from pathlib import Path
from PIL import Image
import json,math,hashlib,shutil
import numpy as np
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation';OLD=ROOT/'design/art/spine-character';BUILD=ROOT/'.local-online/full-martial-motion';PARTS=ART/'parts';PARTS.mkdir(exist_ok=True)
SOURCES={'traveller':'exec-fe77c0a8-aabe-4c6b-9546-54a288ba71a3.png','scholar':'exec-a60f543e-5feb-4144-9cf2-be489f874775.png','cloak':'exec-15e4d09d-0a88-48b5-aba1-6b4ae4eb8be5.png','hands':'exec-78c55d62-c681-488c-b241-399e03bfb675.png','weapons':'exec-bfb99ea9-c225-4b66-9751-0da66a580cb7.png'}
# 原圖像素；源關節逐項保留，不用alpha包圍盒估身高或握點。
GUIDES={
 'traveller':{'near-arm':((0,0,512,682),[(310,112),(240,391),(286,626)]),'far-arm':((512,0,1024,682),[(745,110),(730,391),(757,622)]),'near-leg':((0,683,512,1536),[(330,750),(250,1120),(245,1390),(320,1460)]),'far-leg':((512,683,1024,1536),[(750,750),(695,1120),(697,1390),(770,1460)])},
 'scholar':{'near-arm':((0,0,512,470),[(240,92),(210,237),(315,370)]),'far-arm':((512,0,1024,470),[(840,92),(800,237),(690,370)]),'near-leg':((0,470,512,970),[(270,530),(260,725),(260,900),(330,936)]),'far-leg':((512,470,1024,970),[(750,530),(735,725),(735,900),(805,936)])},
 'cloak':{'near-arm':((0,0,512,430),[(305,92),(254,240),(365,328)]),'far-arm':((512,0,1024,430),[(770,92),(735,240),(757,378)]),'near-leg':((0,430,512,900),[(280,490),(268,655),(270,805),(330,844)]),'far-leg':((512,430,1024,900),[(750,490),(730,655),(733,805),(805,844)])},
}
CLOTH={'scholar':{'cloth-back':((0,970,512,1536),(263,992),(-35,908),.0),'cloth-front':((512,970,1024,1536),(759,992),(0,908),.0)},'cloak':{'cloth-back':((0,900,512,1536),(277,961),(-65,1195),.0),'cloth-front':((512,900,1024,1536),(748,955),(50,1185),.0)}}
HAND_NAMES=['fist','palm','finger','pinch','grip','draw','flute','stone']

def clean(im):
 a=np.array(im.convert('RGBA'));a[:,:,3][a[:,:,3]<30]=0;a[:,:,:3][a[:,:,3]==0]=0;return Image.fromarray(a)

def world_of(bones):
 w={}
 for b in bones:
  px,py,pa=w.get(b.get('parent'),(0,0,0));a=pa+math.radians(b.get('rotation',0));x,y=b.get('x',0),b.get('y',0);w[b['name']]=(px+x*math.cos(pa)-y*math.sin(pa),py+x*math.sin(pa)+y*math.cos(pa),a)
 return w

def smooth(a,b,v):
 t=max(0,min(1,(v-a)/(b-a)));return t*t*(3-2*t)

def mesh_uv(im,mapper,weights,indices,step=24):
 nx=max(4,math.ceil(im.width/step));ny=max(6,math.ceil(im.height/step));uv=[];verts=[];tris=[]
 for r in range(ny+1):
  for c in range(nx+1):
   u,v=c/nx,r/ny;x,y=u*im.width,v*im.height;uv.extend([u,v]);ws=weights(x,y);ws={k:z for k,z in ws.items()if z>1e-7};verts.append(len(ws))
   for name,z in ws.items():
    local=mapper(name,x,y);verts.extend([indices[name],round(local[0],5),round(local[1],5),round(z,8)])
 for r in range(ny):
  for c in range(nx):i=r*(nx+1)+c;tris.extend([i,i+1,i+nx+1,i+1,i+nx+2,i+nx+1])
 return {'type':'mesh','width':im.width,'height':im.height,'uvs':uv,'vertices':verts,'triangles':tris}

def main():
 BUILD.mkdir(exist_ok=True);manifest={'sources':{},'guides':GUIDES,'outfits':{},'hands':{}}
 for name,source in SOURCES.items():
  original=ROOT/'../generated_images'/source;target=ART/'sources'/(name+'-v01.png')
  if not target.exists():shutil.copy2(original,target)
  manifest['sources'][name]={'file':str(target.relative_to(ROOT)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'generatorFile':source,'license':'原創生成素材，依生成服務適用條款；不宣稱CC0'}
 base=json.loads((OLD/'production/character.json').read_text());base['skeleton']['name']='jianghu-independent-v03';base['skeleton']['images']='parts/'
 # 新手形的握點沿腕骨，腳骨對準新原畫的真正腳背方向；不改肢體長度。
 base['bones'][14]['rotation']+=49
 for name in ['cloth-back','cloth-front']:
  base['bones'].append({'name':name,'parent':'hip','x':0,'y':0,'rotation':0})
 W=world_of(base['bones']);indices={b['name']:i for i,b in enumerate(base['bones'])};BD={b['name']:b for b in base['bones']}
 hands=Image.open(ART/'sources/hands-v01.png').convert('RGBA');handparts={};handmeta={}
 for row in range(4):
  for col in range(4):
   kind=HAND_NAMES[row*2+col//2];side='near'if col%2==0 else'far';box=(round(col*hands.width/4),round(row*hands.height/4),round((col+1)*hands.width/4),round((row+1)*hands.height/4));im=clean(hands.crop(box));bbox=im.getbbox();im=im.crop(bbox)
   # 腕頂的真膚色帶，忽略影像上極小的低alpha雜點。
   aa=np.array(im)[:,:,3];ys,xs=np.where(aa>180);top=int(ys.min());band=(ys<=top+10);wristx=float(np.median(xs[band]));wristw=float(np.percentile(xs[band],95)-np.percentile(xs[band],5));wrist=(wristx,top+18)
   scale=52/max(1,wristw);key=f'{side}-hand-{kind}'
   yy,xx=np.where(aa>180);middle=(yy>im.height*.42)&(yy<im.height*.72);gx,gy=float(np.mean(xx[middle])),float(np.mean(yy[middle]))
   if kind=='stone':
    pixels=np.array(im);yy0,xx0=np.where((aa>180)&(pixels[:,:,:3].max(axis=2)<90))
    if len(xx0)>20:gx,gy=float(xx0.mean()),float(yy0.mean())
   handmeta[key]={'wrist':wrist,'scale':scale,'grip':[(gy-wrist[1])*scale,-(gx-wrist[0])*scale]}
   handparts[key]=im
 manifest['hands']=handmeta
 for outfit,guide in GUIDES.items():
  folder=PARTS/outfit;folder.mkdir(exist_ok=True);image=Image.open(ART/'sources'/(outfit+'-v01.png')).convert('RGBA');parts={};attachments={}
  for name,(box,joints) in guide.items():
   im=clean(image.crop(box));bbox=im.getbbox();im=im.crop(bbox);ox,oy=box[0]+bbox[0],box[1]+bbox[1];points=[(x-ox,y-oy)for x,y in joints];parts[name]=im;side,kind=name.split('-');bones=[side+'-upper-'+kind,side+'-lower-'+kind]+([side+'-foot']if kind=='leg' else[])
   # 設計腳背指向與足骨一致，腳尖不按PNG包圍盒重新縮放。
   segments=[]
   for i,bone in enumerate(bones):
    s=np.array(points[i],dtype=float);e=np.array(points[i+1],dtype=float);unit=(e-s)/np.linalg.norm(e-s);segments.append((bone,s,unit,BD[bone]['length']/np.linalg.norm(e-s)))
   def mapper(bone,x,y,segments=segments):
    _,p,u,scale=next(z for z in segments if z[0]==bone);d=np.array([x,y])-p;return(float(np.dot(d,u)*scale),float((d[0]*u[1]-d[1]*u[0])*scale))
   def weights(x,y,points=points,bones=bones):
    elbow=points[1][1];t=smooth(elbow-35,elbow+35,y)
    if len(bones)==2:return{bones[0]:1-t,bones[1]:t}
    ankle=points[2][1];u=smooth(ankle-25,ankle+25,y);return{bones[0]:(1-t)*(1-u),bones[1]:t*(1-u),bones[2]:u}
   attachments[name]={name:dict(mesh_uv(im,mapper,weights,indices),path=name)};im.save(folder/(name+'.png'))
  # 舊已接受上半身保持原像素及頸面權重。腰以上綁同一胸骨，方便只烘一次上身轉頭材質。
  upper=base['skins'][0]['attachments']['upper-body']['upper-body'];upper=json.loads(json.dumps(upper));v=upper['vertices'];cursor=0;outv=[]
  for vertex in range(len(upper['uvs'])//2):
   n=int(v[cursor]);cursor+=1;entries=[]
   for _ in range(n):
    idx,x,y,w=v[cursor:cursor+4];cursor+=4;bone=base['bones'][idx]['name']
    if bone=='hip':
     wx,wy,ang=W[bone];worldx=wx+x*math.cos(ang)-y*math.sin(ang);worldy=wy+x*math.sin(ang)+y*math.cos(ang);tx,ty,ta=W['chest'];dx,dy=worldx-tx,worldy-ty;entries.append((indices['chest'],dx*math.cos(ta)+dy*math.sin(ta),-dx*math.sin(ta)+dy*math.cos(ta),w))
    else:entries.append((idx,x,y,w))
   merged={}
   for idx,x,y,w in entries:
    if idx not in merged:merged[idx]=[x*w,y*w,w]
    else:merged[idx][0]+=x*w;merged[idx][1]+=y*w;merged[idx][2]+=w
   outv.append(len(merged))
   for idx,(x,y,w)in merged.items():outv.extend([idx,x/w,y/w,w])
  upper['vertices']=outv;attachments['upper-body']={'upper-body':upper};parts['upper-body']=Image.open(OLD/f'production/upper-topknot-{outfit}.png').convert('RGBA')
  if outfit!='scholar':
   attachments['hip']=base['skins'][0]['attachments']['hip'];parts['hip']=Image.open(OLD/'parts/hip.png').convert('RGBA')
  for name,(box,anchor,target,_unused)in CLOTH.get(outfit,{}).items():
   im=clean(image.crop(box));bbox=im.getbbox();im=im.crop(bbox);ox,oy=box[0]+bbox[0],box[1]+bbox[1];ax,ay=anchor[0]-ox,anchor[1]-oy;scale=(target[1]-65)/max(1,im.height-ay);parts[name]=im
   def mapper(bone,x,y,ax=ax,ay=ay,scale=scale,target=target):
    wx,wy=target[0]+(x-ax)*scale,target[1]-(y-ay)*scale;px,py,pa=W[bone];dx,dy=wx-px,wy-py;return(dx*math.cos(pa)+dy*math.sin(pa),-dx*math.sin(pa)+dy*math.cos(pa))
   def weights(x,y,name=name,h=im.height):t=smooth(h*.12,h*.8,y);return{'hip':1-t,name:t}
   attachments[name]={name:dict(mesh_uv(im,mapper,weights,indices,32),path=name)};im.save(folder/(name+'.png'))
  for side in ['near','far']:
   slot=side+'-hand';attachments[slot]={}
   for kind in HAND_NAMES:
    key=f'{side}-hand-{kind}';im=handparts[key];meta=handmeta[key];parts[key]=im;wx,wy=meta['wrist'];scale=meta['scale']
    def mapper(bone,x,y,wx=wx,wy=wy,scale=scale):return((y-wy)*scale,-(x-wx)*scale)
    attachments[slot][key]=dict(mesh_uv(im,mapper,lambda x,y,slot=slot:{slot:1},indices,64),path=key)
  order=['cloth-back','far-leg','near-leg','upper-body','hip','cloth-front','far-hand','near-hand','far-arm','near-arm'];order=[k for k in order if k in attachments]
  skeleton=json.loads(json.dumps(base));skeleton['slots']=[{'name':k,'bone':k if k.endswith('hand')else'hip','attachment':k+'-fist'if k.endswith('hand')else k}for k in order];skeleton['skins']=[{'name':'default','attachments':attachments}];skeleton['animations']={}
  # 同一圖集大小／格位供八個頭部替換，沒有對每幀fit。
  width=2048;x=y=2;row=0;pos={}
  for name,im in sorted(parts.items(),key=lambda z:-z[1].height):
   if x+im.width+2>width:x=2;y+=row+2;row=0
   pos[name]=(x,y);x+=im.width+2;row=max(row,im.height)
  height=1<<(y+row+1).bit_length();atlas=Image.new('RGBA',(width,height));lines=['atlas.png',f'size: {width},{height}','format: RGBA8888','filter: Linear,Linear','repeat: none']
  for name,im in parts.items():
   xx,yy=pos[name];atlas.paste(im,(xx,yy));lines +=[name,'  rotate: false',f'  xy: {xx}, {yy}',f'  size: {im.width}, {im.height}',f'  orig: {im.width}, {im.height}','  offset: 0, 0','  index: -1']
  dest=BUILD/outfit;dest.mkdir(exist_ok=True);atlas.save(dest/'atlas.png');(dest/'character.atlas').write_text('\n'.join(lines)+'\n');(dest/'rig.json').write_text(json.dumps(skeleton,separators=(',',':'))+'\n');manifest['outfits'][outfit]={'atlasSize':[width,height],'upperRegion':[*pos['upper-body'],parts['upper-body'].width,parts['upper-body'].height],'slots':order,'boneCount':len(base['bones'])}
 (ART/'materials.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print('MATERIAL_RIGS',manifest['outfits'])
if __name__=='__main__':main()
