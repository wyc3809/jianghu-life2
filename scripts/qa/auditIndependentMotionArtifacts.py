"""檢查真輸出與來源身份、圖集範圍、定位及所有採樣；缺圖或過時來源直接失敗。"""
from pathlib import Path
from PIL import Image
import json,hashlib,math
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation';OUT=ROOT/'production/qa/evidence/redesign/independent-animations';PUBLIC=ROOT/'public/ink/art/independent'
clips=json.loads((ART/'compiled-clips.json').read_text());animations=json.loads((ART/'rig/animations.json').read_text());rows=[]
for outfit in ['traveller','scholar','cloak']:
 rig=json.loads((ART/'rig'/f'{outfit}.json').read_text());bindsha=hashlib.sha256(json.dumps(rig,sort_keys=True).encode()).hexdigest()
 for id,c in clips.items():
  m=json.loads((PUBLIC/outfit/(id+'.json')).read_text());path=ROOT/'public'/m['atlas'];data=path.read_bytes();w,h=Image.open(path).size
  assert m['id']==id and m['outfit']==outfit and m['origin']==[192,272] and m['pixelsPerHeight']==191.625
  assert m['sha256']==hashlib.sha256(data).hexdigest() and m['bindSha256']==bindsha
  assert m['clipSha256']==hashlib.sha256(json.dumps(animations[id],sort_keys=True).encode()).hexdigest()
  assert len(m['frames'])==len(c['sampleTimes']) and h<=8192
  for f,t in zip(m['frames'],c['sampleTimes']):
   assert f['t']==t and len(f['parts'])==4 and all(math.isfinite(z)for k in ['upper','grip','farGrip','wrist']for z in f[k])
   a,b,d,e=f['upper'][:4];assert abs(a*e-b*d-1)<.0001 and -6<=f['head']<=6
   for x,y,pw,ph,dx,dy in f['parts']:assert 0<=x<=w and 0<=y<=h and 0<=x+pw<=w and 0<=y+ph<=h and dx>=0 and dy>=0 and dx+pw<=384 and dy+ph<=288
  rows.append({'id':id,'outfit':outfit,'family':c['family'],'kind':c['kind'],'frames':len(m['frames']),'bytes':len(data),'sha256':m['sha256'],'width':w,'height':h})
 for head in ['bamboo','topknot','master','silver','ponytail','loose','bun','short']:
  m=json.loads((PUBLIC/outfit/f'_upper-{head}.json').read_text());assert m['head']==head and m['outfit']==outfit and len(m['parts'])==13
  assert hashlib.sha256((ROOT/'public'/m['atlas']).read_bytes()).hexdigest()==m['sha256']
summary={'canonicalArts':103,'bodyClips':len(rows),'families':len(set(r['family']for r in rows if r['kind']!='lifecycle')),'upperSheets':24,'frames':sum(r['frames']for r in rows),'bodyBytes':sum(r['bytes']for r in rows),'actualIphone':False,'playerVisualAcceptance':False}
(OUT/'artifacts.json').write_text(json.dumps({'summary':summary,'rows':rows},ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary))
