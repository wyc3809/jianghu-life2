"""九派完整制服正規化，保留已發布96張與來源；不拼接身體。"""
from pathlib import Path
from PIL import Image
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'design/art/all-sect-uniforms'
ROWS=json.loads((SOURCE/'generation.json').read_text())
assert len(ROWS)==144,('incomplete batch',len(ROWS))
OUT=ROOT/'public/ink/art/wardrobe';OUT.mkdir(parents=True,exist_ok=True)
target=ROOT/'src/appearance/manhua/wardrobe-catalog.json'
catalog=json.loads(target.read_text())
# 重跑時只保留上一批圖，不累加新批來源或舊hash。
figures={k:v for k,v in catalog['figures'].items() if '-uniform-' not in k or '-uniform-qingyun-' in k}
sources=[s for s in catalog['sources'] if s.get('family')!='all-sect-uniforms']
assert len(figures)==96,len(figures)
for row in ROWS:
 src=SOURCE/row['file'];im=Image.open(src).convert('RGBA');w,h=im.size
 heads=['bamboo','topknot','master','silver'] if row['sex']=='male' else ['ponytail','loose','bun','short']
 sources.append({'file':src.name,'family':'all-sect-uniforms','sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'costume':row['id'],'heads':heads,'tool':'image_gen.imagegen','generationNote':'玩家授權AI生成；完整人體參照已接受造型，只裁切、等比例適配及WebP壓縮。'})
 for i,head in enumerate(heads):
  x=i%2;y=i//2;cell=im.crop((x*w//2,y*h//2,(x+1)*w//2,(y+1)*h//2))
  alpha=cell.getchannel('A');assert alpha.getextrema()[0]==0,(row['key'],head,'missing transparency')
  box=alpha.point(lambda a:255 if a>32 else 0).getbbox();assert box,(row['key'],head,'empty')
  assert min(box[0],box[1],cell.width-box[2],cell.height-box[3])>2,(row['key'],head,'source clipped',box)
  obj=cell.crop((box[0]-2,box[1]-2,box[2]+2,box[3]+2));obj.thumbnail((480,960),Image.Resampling.LANCZOS)
  final=Image.new('RGBA',(512,1024));final.alpha_composite(obj,((512-obj.width)//2,992-obj.height))
  path=OUT/f"{head}-{row['id']}.webp";tmp=path.with_suffix('.tmp');final.save(tmp,'WEBP',quality=95,method=4);tmp.replace(path)
  bounds=list(final.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox());l,t,r,b=bounds
  face=final.getchannel('A').crop((0,t,512,round(t+(b-t)*.25))).point(lambda a:255 if a>32 else 0).getbbox()
  side=round((b-t)*.30);cx=(face[0]+face[2])/2;portrait=[round(cx-side/2),t,side,side]
  assert portrait[0]>=0 and portrait[0]+side<=512,(row['key'],head,'portrait clipped')
  figures[f"{head}-{row['id']}"]={'src':str(path.relative_to(ROOT/'public')),'bounds':bounds,'portrait':portrait,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':src.name,'sourceFamily':'all-sect-uniforms','cell':i}
assert len(figures)==672,len(figures)
catalog.update(figures=figures,sources=sources,technicalChecksPassed=False)
tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');tmp.replace(target)
print('WARDROBE_FIGURES',len(figures),flush=True)
