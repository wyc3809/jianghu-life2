"""首批青雲八職位及四時裝：完整立繪正規化，保留原圖與來源hash。"""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'design/art/qingyun-fashion/sources'
ROWS=json.loads((SOURCE.parent/'generation.json').read_text())
OUT=ROOT/'public/ink/art/wardrobe';OUT.mkdir(parents=True,exist_ok=True)
figures={};sources=[]
for row in ROWS:
 src=SOURCE/Path(row['file']).name;im=Image.open(src).convert('RGBA');w,h=im.size
 heads=['bamboo','topknot','master','silver'] if row['sex']=='male' else ['ponytail','loose','bun','short']
 sources.append({'file':src.name,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'costume':row['id'],'heads':heads,'tool':'image_gen.imagegen'})
 for i,head in enumerate(heads):
  x=i%2;y=i//2;cell=im.crop((x*w//2,y*h//2,(x+1)*w//2,(y+1)*h//2))
  significant=cell.getchannel('A').point(lambda a:255 if a>32 else 0);box=significant.getbbox();assert box,(row['key'],head)
  assert min(box[0],box[1],cell.width-box[2],cell.height-box[3])>2,(row['key'],head,'source clipped',box)
  box=(box[0]-2,box[1]-2,box[2]+2,box[3]+2)
  obj=cell.crop(box);obj.thumbnail((480,960),Image.Resampling.LANCZOS)
  final=Image.new('RGBA',(512,1024));final.alpha_composite(obj,((512-obj.width)//2,992-obj.height))
  path=OUT/f"{head}-{row['id']}.webp";tmp=path.with_suffix('.tmp');final.save(tmp,'WEBP',quality=95,method=4);tmp.replace(path)
  bounds=list(final.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox());l,t,r,b=bounds
  face=final.getchannel('A').crop((0,t,512,round(t+(b-t)*.25))).point(lambda a:255 if a>32 else 0).getbbox()
  side=round((b-t)*.30);cx=(face[0]+face[2])/2
  figures[f"{head}-{row['id']}"]={'src':str(path.relative_to(ROOT/'public')),'bounds':bounds,'portrait':[round(cx-side/2),t,side,side],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':src.name,'cell':i}
catalog={'width':512,'height':1024,'figures':figures,'sources':sources,'technicalChecksPassed':False}
assert len(figures)==96,len(figures)
target=ROOT/'src/appearance/manhua/wardrobe-catalog.json';tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');tmp.replace(target)
print('WARDROBE_FIGURES',len(figures),flush=True)
