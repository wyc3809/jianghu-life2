"""真素材解碼／唯一姿勢／完整邊界審核，另出逐門接觸板，唔繪製遊戲素材。"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'production/qa/evidence/redesign/martial-identities-full';O.mkdir(exist_ok=True);A=R/'public/ink/art/martial';meta=json.loads((A/'anchors.json').read_text());audit=json.loads((R/'production/qa/evidence/redesign/martial-identities/catalog-audit.json').read_text());font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16);cards={c['id']:c for c in audit['cards']};rows=[];errors=[]
for id,m in meta.items():
 im=Image.open(A/f'{id}.webp').convert('RGBA');assert im.size==(4096,352),(id,im.size);hashes=[];bounds=[]
 for i in range(8):
  tile=im.crop((i*512,0,(i+1)*512,352));a=np.array(tile);ys,xs=np.where(a[:,:,3]>100)
  if not len(xs):errors.append((id,i,'空格'));continue
  bounds.append([int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]);hashes.append(hashlib.sha256(a.tobytes()).hexdigest())
  if xs.min()<1 or xs.max()>510 or ys.min()<1 or ys.max()>350:errors.append((id,i,'貼邊',bounds[-1]))
 if len(set(hashes))!=8:errors.append((id,'重複姿勢',len(set(hashes))))
 rows.append({'id':id,'frames':8,'unique':len(set(hashes)),'bounds':bounds,'sha256':hashlib.sha256((A/f'{id}.webp').read_bytes()).hexdigest(),'bytes':(A/f'{id}.webp').stat().st_size})
for start in range(0,len(rows),12):
 group=rows[start:start+12];board=Image.new('RGBA',(1100,len(group)*112),'#f6eddd');d=ImageDraw.Draw(board)
 for row,r in enumerate(group):
  id=r['id'];name=cards.get(id,{}).get('name',id);d.text((8,row*112+2),name+'  '+id,fill='#342c24',font=font);im=Image.open(A/f'{id}.webp').convert('RGBA')
  for i in range(8):
   tile=im.crop((i*512,0,(i+1)*512,352)).resize((136,94),Image.Resampling.LANCZOS);board.alpha_composite(tile,(i*136,row*112+18))
 board.convert('RGB').save(O/f'contact-board-{start//12+1:02}.jpg',quality=92)
fxfiles=list(A.glob('*-fx-*.webp'));effects=[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in fxfiles]
report={'atlasCount':len(rows),'frames':len(rows)*8,'canonical':len([r for r in rows if r['id'] in cards]),'effects':len(effects),'uniqueEffects':len({r['sha256'] for r in effects}),'atlasBytes':sum(r['bytes'] for r in rows),'effectBytes':sum(r['bytes'] for r in effects),'errors':errors,'atlases':rows,'effectFiles':effects,'note':'自動檢查只驗像素完整／重複，持武及動作神髓仍需逐板人工檢視；唔等於商業驗收。'}
(O/'raster-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ['atlases','effectFiles']},ensure_ascii=False));assert not errors
