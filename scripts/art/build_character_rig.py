"""原圖保留、逐件裁切／去除透明邊暈；關節標記人工校定，不按動畫幀重新縮放。"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json,hashlib,base64,io
from scipy.ndimage import label
R=Path(__file__).resolve().parents[2];S=R/'design/art/character-rig/sources';O=R/'public/ink/art/character-rig';O.mkdir(parents=True,exist_ok=True)
SOURCES={'traveller':'exec-021201b5-6cdb-4de4-8598-97d558e1a019.png','scholar':'exec-abcc42c9-e24d-41c5-87b3-e4dee06ee2c2.png','cloak':'exec-a68e6c5b-c43f-4209-b59a-ca7e2b4beb66.png','hips':'exec-af41d38b-6f7e-4c46-9603-19e6810e3505.png'}
for key,file in SOURCES.items():
 target=S/(key+'-original.png')
 if not target.exists():target.write_bytes((Path('/workspace/generated_images')/file).read_bytes())
# 座標在1024×1536原圖；每個關節位置明確標定，沒有按膚色推測握點。
parts={
 'torso':([70,0,505,365],[314,328],[307,93]),
 'upperArm':([115,365,485,703],[291,406],[316,672]),
 'forearm':([590,365,1008,735],[757,398],[798,691]),
 'thigh':([110,703,480,1040],[289,731],[285,1007]),
 'shin':([610,735,995,1040],[774,752],[778,1008]),
 'foot':([95,1040,505,1240],[225,1075],[432,1075]),
 'neck':([600,1040,1005,1240],[777,1198],[770,1098]),
 'handOpen':([140,1240,475,1536],[293,1280],[298,1425]),
 'handGrip':([610,1240,995,1536],[772,1295],[789,1418]),
}
manifest={};fallback={};report=[]
def export(im,outfit,part,pivot,tip):
 a=np.array(im.convert('RGBA'));groups,count=label(a[:,:,3]>140);sizes=np.bincount(groups.ravel());sizes[0]=0;main=groups==int(sizes.argmax());core=Image.fromarray(np.where(main,255,0).astype('uint8')).filter(ImageFilter.MaxFilter(9));a[:,:,3][np.array(core)==0]=0;a[:,:,3][a[:,:,3]<10]=0
 im=Image.fromarray(a);box=im.getbbox()
 if not box:raise ValueError((outfit,part,'empty'))
 im=im.crop(box);p=[pivot[0]-box[0],pivot[1]-box[1]];t=[tip[0]-box[0],tip[1]-box[1]]
 name=f'{outfit}-{part}.webp';im.save(O/name,'WEBP',quality=95,method=6)
 key=f'ink/art/character-rig/{name}';tiny=im.copy();tiny.thumbnail((140,180),Image.Resampling.LANCZOS);buf=io.BytesIO();tiny.save(buf,'WEBP',quality=86);fallback[key]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
 report.append({'file':key,'size':list(im.size),'alphaZeroFraction':float((np.array(im)[:,:,3]==0).mean()),'sha256':hashlib.sha256((O/name).read_bytes()).hexdigest()})
 return {'src':key,'width':im.width,'height':im.height,'pivot':p,'tip':t}
for outfit in ['traveller','scholar','cloak']:
 source=S/(outfit+'-natural.png');source=source if source.exists() else S/(outfit+'-original.png');im=Image.open(source).convert('RGBA');assert im.size==(1024,1536)
 manifest[outfit]={}
 for part,(rect,p,t) in parts.items():
  part_source=Image.open(S/'cloak-compact-torso.png').convert('RGBA') if outfit=='cloak' and part=='torso' else im
  manifest[outfit][part]=export(part_source.crop(rect),outfit,part,[p[0]-rect[0],p[1]-rect[1]],[t[0]-rect[0],t[1]-rect[1]])
hips=Image.open(S/'hips-original.png').convert('RGBA')
for i,outfit in enumerate(manifest):
 rect=[round(i*hips.width/3),0,round((i+1)*hips.width/3),hips.height];im=hips.crop(rect)
 # 腰帶中心；原圖整塊裙擺只作衣料，不包含任何腿部。
 manifest[outfit]['pelvis']=export(im,outfit,'pelvis',[im.width*.5,155],[im.width*.5,255])
for kind in ['sword','blade','spear','staff']:
 im=Image.open(R/('public/ink/spar/weapon-'+kind+'.webp')).convert('RGBA');im.thumbnail((100,256),Image.Resampling.LANCZOS);buf=io.BytesIO();im.save(buf,'WEBP',quality=90);fallback['ink/spar/weapon-'+kind+'.webp']='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
(R/'src/fx/actor/asset-map.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(R/'src/fx/actor/asset-fallback.json').write_text(json.dumps(fallback,ensure_ascii=False)+'\n')
(R/'design/art/character-rig/asset-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('RIG_PARTS',len(report),'RGBA_BYTES',sum(x['size'][0]*x['size'][1]*4 for x in report))
