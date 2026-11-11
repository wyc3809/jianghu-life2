"""核對離線輸出來源與圖像，再補同幀腕點；不改PNG、不重繪人體或改動戰鬥。"""
from pathlib import Path
import json,math,hashlib,gzip
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation';OUT=ROOT/'public/ink/art/independent'
animations=json.loads((ART/'rig/animations.json').read_text());clips=json.loads((ART/'compiled-clips.json').read_text());index={'schema':1,'canonical':103,'origin':[192,272],'pixelsPerHeight':191.625,'clips':{}}
def value(keys,t,key,default):
 if not keys:return default
 before=next((k for k in reversed(keys)if k.get('time',0)<=t+1e-7),keys[0]);return before.get(key,default)
def world(bones,anim,t):
 out={}
 for b in bones:
  k=anim['bones'].get(b['name'],{});a=(b.get('rotation',0)+value(k.get('rotate'),t,'value',0))*math.pi/180;x=b.get('x',0)+value(k.get('translate'),t,'x',0);y=b.get('y',0)+value(k.get('translate'),t,'y',0)
  if b.get('parent'):
   px,py,pa=out[b['parent']];x,y=px+x*math.cos(pa)-y*math.sin(pa),py+x*math.sin(pa)+y*math.cos(pa);a+=pa
  out[b['name']]=(x,y,a)
 return out
count=0;bytes=0
for outfit in ['traveller','scholar','cloak']:
 specific=ART/'rig'/f'animations-{outfit}.json.gz'
 actual_animations=json.loads(gzip.decompress(specific.read_bytes())) if specific.exists() else animations
 rig=json.loads((ART/'rig'/f'{outfit}.json').read_text());bindsha=hashlib.sha256(json.dumps(rig,sort_keys=True).encode()).hexdigest()
 for id,c in clips.items():
  file=OUT/outfit/(id+'.json');m=json.loads(file.read_text());clipsha=hashlib.sha256(json.dumps(actual_animations[id],sort_keys=True).encode()).hexdigest()
  if m.get('clipSha256')!=clipsha or m.get('bindSha256')!=bindsha:raise ValueError('輸出來源過時 '+outfit+' '+id)
  image=ROOT/'public'/m['atlas'];actual=hashlib.sha256(image.read_bytes()).hexdigest()
  if actual!=m['sha256']:raise ValueError('圖像hash不符 '+str(image))
  if len(m['frames'])!=len(c['sampleTimes']):raise ValueError('缺動作幀 '+id)
  for frame in m['frames']:
   x,y,a=world(rig['bones'],actual_animations[id],frame['t'])['near-hand'];frame['wrist']=[round(192+x*.125,5),round(272-y*.125,5),round(-a,5)]
  file.write_text(json.dumps(m,ensure_ascii=False,separators=(',',':'))+'\n');index['clips'][id]={k:c.get(k)for k in ['name','kind','family','duration','contacts','state','neutral']};count+=1;bytes+=image.stat().st_size
 for head in ['bamboo','topknot','master','silver','ponytail','loose','bun','short']:
  m=json.loads((OUT/outfit/f'_upper-{head}.json').read_text());p=ROOT/'public'/m['atlas'];assert hashlib.sha256(p.read_bytes()).hexdigest()==m['sha256'];bytes+=p.stat().st_size
for target in [OUT/'index.json',ROOT/'src/appearance/independent/index.json']:target.write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
print('FINALIZED',count,'BODY_BYTES',bytes)
