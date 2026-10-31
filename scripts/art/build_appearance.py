"""原創人物素材透明清邊、模組裁切及映射；不產生角色路徑或改動遊戲數值。"""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,base64,io

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'design/art/appearance/sources';OUT=ROOT/'public/ink/art/appearance';OUT.mkdir(parents=True,exist_ok=True)
mapping={'heads':{},'outfits':{}};report=[];fallback={}
def export(image,name):
 a=np.array(image.convert('RGBA'));rgb=a[:,:,:3];alpha=a[:,:,3]
 # 清理生成透明邊緣極小的紅／黃污染；保留正常膚色、布料及墨線。
 bad=((rgb[:,:,0]>220)&(rgb[:,:,1]<85)&(rgb[:,:,2]<85))|((rgb[:,:,0]>220)&(rgb[:,:,1]>165)&(rgb[:,:,2]<70))
 alpha[(alpha<20)|bad]=0;a[:,:,3]=alpha
 im=Image.fromarray(a);box=im.getbbox()
 if not box:raise ValueError(name+' is empty')
 im=im.crop(box);im.thumbnail((560,512),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(im.width+16,im.height+16));canvas.alpha_composite(im,(8,8))
 target=OUT/(name+'.webp');canvas.save(target,format='WEBP',quality=94,method=6)
 pixels=np.array(canvas);transparent=float((pixels[:,:,3]==0).mean())
 assert transparent>.08,(name,'opaque matte')
 report.append({'name':name,'size':list(canvas.size),'transparentFraction':transparent,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
 path='ink/art/appearance/'+target.name
 tiny=canvas.copy();tiny.thumbnail((120,112),Image.Resampling.LANCZOS);buffer=io.BytesIO();tiny.save(buffer,format='WEBP',quality=84,method=6)
 fallback[path]='data:image/webp;base64,'+base64.b64encode(buffer.getvalue()).decode()
 return path

def clean_head(image):
 # 只保留主要頭部連通區及近旁髮絲，清走相鄰格越界碎片。
 from collections import deque
 from PIL import ImageFilter
 a=np.array(image.convert('RGBA'));mask=a[:,:,3]>32;seen=np.zeros(mask.shape,dtype=bool);groups=[]
 for yy,xx in zip(*np.nonzero(mask)):
  if seen[yy,xx]:continue
  group=[];q=deque([(int(yy),int(xx))]);seen[yy,xx]=True
  while q:
   y,x=q.popleft();group.append((y,x))
   for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
  groups.append(group)
 keep=np.zeros(mask.shape,dtype=np.uint8);threshold=max(map(len,groups))*.015
 for group in groups:
  if len(group)>=threshold:
   for y,x in group:keep[y,x]=255
 keep=np.array(Image.fromarray(keep).filter(ImageFilter.MaxFilter(5)))>0;a[:,:,3][~keep]=0
 return Image.fromarray(a)

heads=Image.open(SRC/'heads-original.png')
for key,column,row in [('master',2,0),('silver',3,0),('ponytail',0,1),('loose',1,1),('bun',2,1),('short',3,1)]:
 w,h=heads.size;im=heads.crop((round(column*w/4),round(row*h/2),round((column+1)*w/4),round((row+1)*h/2)))
 if key=='short':
  # 上方相鄰白髮素材越界的一小段，先清除再裁正，保留短髮本體。
  im=clean_head(im.crop((0,35,im.width,im.height)))
 mapping['heads'][key]=export(im,'head-'+key)
for key,file in [('bamboo','traveller-original.png'),('topknot','ponytail-original.png')]:mapping['heads'][key]=export(Image.open(SRC/file),'head-'+key)

body=Image.open(SRC/'outfits-original.png');w,h=body.size
rows=[0,331,594,805,1096,1350,h]
parts=['torso','upperArm','forearm','thigh','shin','hem']
for column,outfit in enumerate(['traveller','scholar','cloak']):
 mapping['outfits'][outfit]={}
 for row,part in enumerate(parts):
  im=body.crop((round(column*w/3),rows[row],round((column+1)*w/3),rows[row+1]))
  mapping['outfits'][outfit][part]=export(im,'outfit-'+outfit+'-'+part)
seated=Image.open(SRC/'seated-original.png');sw,sh=seated.size
for col,outfit in enumerate(['traveller','scholar','cloak']):
 mapping['outfits'][outfit]['seated']=export(seated.crop((round(col*sw/3),0,round((col+1)*sw/3),sh)),'outfit-'+outfit+'-seated')
(ROOT/'src/appearance/asset-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/appearance/asset-fallback.json').write_text(json.dumps(fallback,ensure_ascii=False)+'\n')
(ROOT/'design/art/appearance/alpha-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('APPEARANCE_ASSETS',len(report),'all real alpha')

# 更新頭部或舊來源後，完整姿勢映射必須一併保留。
if all((SRC/('poses-'+o+'-original.png')).exists() for o in ['traveller','scholar','cloak']) and (SRC/'poses-seated-original.png').exists():
 import runpy
 runpy.run_path(str(ROOT/'scripts/art/build_appearance_poses.py'),run_name='__main__')
