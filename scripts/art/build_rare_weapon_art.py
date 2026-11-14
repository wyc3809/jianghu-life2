"""依真武器ID裁出完整獨有器物；原圖守門、512透明WebP及來源hash。"""
from pathlib import Path
from PIL import Image
import hashlib,json
ROOT=Path(__file__).resolve().parents[2];SOURCE=ROOT/'design/art/rare-weapons'
brief=json.loads((SOURCE/'brief.json').read_text());rows=json.loads((SOURCE/'generation.json').read_text());records={r['key']:r for r in rows}
assert len(rows)==8 and len(records)==8,'incomplete source batch'
OUT=ROOT/'public/ink/art/manhua/weapons';OUT.mkdir(parents=True,exist_ok=True)
entries={};sources=[]
def transparent_split(alpha, axis):
 # 用實際透明走廊分隔圖格，容許生成圖的分界稍有偏移；不切穿器物。
 width,height=alpha.size;size=width if axis=='x' else height
 start,end=round(size*.40),round(size*.60);runs=[];current=[]
 for pos in range(start,end):
  strip=alpha.crop((pos,0,pos+1,height) if axis=='x' else (0,pos,width,pos+1))
  if strip.getextrema()[1]<=32:current.append(pos)
  else:
   if current:runs.append(current)
   current=[]
 if current:runs.append(current)
 assert runs,('no transparent cell corridor',axis,alpha.size)
 run=min(runs,key=lambda r:abs((r[0]+r[-1])/2-size/2))
 return (run[0]+run[-1])//2
for job in brief['jobs']:
 row=records[job['key']];src=SOURCE/row['file'];im=Image.open(src).convert('RGBA');w,h=im.size
 split_x=transparent_split(im.getchannel('A'),'x')
 sources.append({'file':row['file'],'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'tool':'image_gen.imagegen','items':[g['id'] for g in job['items']],'rights':'玩家授權AI生成的遊戲器物；依工具條款使用，參照既有獲接受原創漫畫器物風格。'})
 for i,item in enumerate(job['items']):
  x=i%2;y=i//2;left,right=(0,split_x) if x==0 else (split_x,w);column=im.crop((left,0,right,h));split_y=transparent_split(column.getchannel('A'),'y') if len(job['items'])>2 else h
  rect=(left,0 if y==0 else split_y,right,split_y if y==0 else h);cell=im.crop(rect);a=cell.getchannel('A')
  box=a.point(lambda v:255 if v>32 else 0).getbbox();assert box,(item['id'],'empty')
  assert a.getextrema()[0]==0,(item['id'],'no true transparency')
  assert min(box[0],box[1],cell.width-box[2],cell.height-box[3])>0,(item['id'],'source touches cell edge',box)
  obj=cell.crop((max(0,box[0]-2),max(0,box[1]-2),min(cell.width,box[2]+2),min(cell.height,box[3]+2)));obj.thumbnail((456,456),Image.Resampling.LANCZOS)
  final=Image.new('RGBA',(512,512));final.alpha_composite(obj,((512-obj.width)//2,(512-obj.height)//2))
  temp=OUT/f"{item['id']}.tmp";final.save(temp,'WEBP',lossless=True,method=4);sha=hashlib.sha256(temp.read_bytes()).hexdigest();dest=OUT/f"{item['id']}-{sha[:12]}.webp";temp.replace(dest)
  entries[item['id']]={'src':str(dest.relative_to(ROOT/'public/ink')),'sha256':sha,'bounds':list(final.getchannel('A').point(lambda v:255 if v>32 else 0).getbbox()),'source':row['file'],'cell':i,'sourceRect':list(rect),'rarity':item['rarity'],'name':item['name']}
assert len(entries)==30
manifest={'width':512,'height':512,'threshold':'rare','weapons':entries,'sources':sources,'technicalChecksPassed':False}
target=ROOT/'src/appearance/manhua/weapon-catalog.json';tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');tmp.replace(target)
print('UNIQUE_WEAPON_ART',len(entries),flush=True)
