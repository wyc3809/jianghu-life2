from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[2];srcroot=root/'design/art/manhua/sources'
groups=[('traveller',['bamboo','topknot','master','silver'],'exec-cb93f5cb-dc9e-4720-95b6-ef54b9febd93.png'),('traveller',['ponytail','loose','bun','short'],'exec-79caeef6-255d-443f-86c1-e370c2f5ee59.png'),('scholar',['bamboo','topknot','master','silver'],'exec-9ea9a38d-fa85-469e-9b2c-dd248d924a5c.png'),('scholar',['ponytail','loose','bun','short'],'exec-fbbf5916-6d06-4089-b30c-087c9d55c4e5.png'),('cloak',['bamboo','topknot','master','silver'],'exec-2cc91bfd-50d0-4eea-97ed-02aa644c360b.png'),('cloak',['ponytail','loose','bun','short'],'exec-f888d924-8f96-4015-961c-a8196d677c63.png')]
out=root/'public/ink/art/manhua/figures';out.mkdir(parents=True,exist_ok=True)
entries={};sources=[]
for outfit,heads,filename in groups:
 src=srcroot/filename;im=Image.open(src).convert('RGBA');w,h=im.size
 sources.append({'file':filename,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'tool':'image_gen.imagegen','outfit':outfit,'heads':heads})
 for i,head in enumerate(heads):
  x=i%2;y=i//2;cell=im.crop((x*w//2,y*h//2,(x+1)*w//2,(y+1)*h//2))
  significant=cell.getchannel('A').point(lambda a:255 if a>32 else 0);box=significant.getbbox();assert box
  assert box[0]>2 and box[1]>2 and box[2]<cell.width-2 and box[3]<cell.height-2,(head,outfit,box)
  box=(max(0,box[0]-2),max(0,box[1]-2),min(cell.width,box[2]+2),min(cell.height,box[3]+2))
  obj=cell.crop(box);obj.thumbnail((480,960),Image.Resampling.LANCZOS)
  final=Image.new('RGBA',(512,1024));final.alpha_composite(obj,((512-obj.width)//2,992-obj.height))
  path=out/(head+'-'+outfit+'.webp');final.save(path,'WEBP',quality=95,method=6)
  bounds=list(final.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox());l,t,r,b=bounds
  face=final.getchannel('A').crop((0,t,512,round(t+(b-t)*.25))).point(lambda a:255 if a>32 else 0).getbbox()
  side=round((b-t)*.30);cx=(face[0]+face[2])/2
  entries[head+'-'+outfit]={'src':str(path.relative_to(root/'public')),'bounds':bounds,'portrait':[round(cx-side/2),t,side,side],'source':filename,'cell':i,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
manifest={'width':512,'height':1024,'baseTone':'jade','figures':entries,'sources':sources,'sourceKind':'ai-generated','styleApproval':'玩家確認2026-11-14武俠漫畫小樣並要求套用','technicalChecksPassed':False}
dest=root/'src/appearance/manhua/catalog.json';dest.parent.mkdir(exist_ok=True);dest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('FIGURES',len(entries))
