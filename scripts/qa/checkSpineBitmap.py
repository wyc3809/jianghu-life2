"""檢查最終有損圖集的真頭胸連通，不只檢查骨節數值。"""
from pathlib import Path
from PIL import Image
import numpy as np,json,subprocess
import cv2
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'production/qa/evidence/redesign/spine-rollout';OUT.mkdir(exist_ok=True)
subprocess.run(['node','scripts/qa/checkSpineBitmap.mjs'],cwd=ROOT,check=True)
c=json.loads((ROOT/'src/appearance/spine/catalog.json').read_text());points=json.loads((ROOT/'.local-online/spine-rollout/material-points.json').read_text());failures=[];checked=0
for key,skin in c['skins'].items():
 image=np.array(Image.open(ROOT/'public'/skin['src']).convert('RGBA'))
 for index,p in points.items():
  r=skin['rects'][int(index)];x,y,w,h,dx,dy=r;mask=(image[y:y+h,x:x+w,3]>=160).astype('uint8');_,labels=cv2.connectedComponents(mask,connectivity=8)
  def label(point):
   px,py=point[0]-dx,point[1]-dy;hits=[]
   for yy in range(max(0,round(py)-2),min(h,round(py)+3)):
    for xx in range(max(0,round(px)-2),min(w,round(px)+3)):
     if labels[yy,xx]:hits.append(((yy-py)**2+(xx-px)**2,int(labels[yy,xx])))
   return min(hits)[1] if hits else 0
  head,chest=label(p['face']),label(p['chest']);checked+=1
  if not head or head!=chest:failures.append({'skin':key,'frame':int(index),'clip':p['clip'],'headComponent':head,'chestComponent':chest})
report={'skins':len(c['skins']),'framesChecked':checked,'clips':list(dict.fromkeys(p['clip'] for p in points.values())),'alphaThreshold':160,'materialPointSearchRadius':2,'failures':failures,'actualIphone':False,'scope':'檢查最終WebP中真臉部與胸口像素連通；不代替解剖及動作評閱。'}
(OUT/'bitmap-connectivity.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if failures:raise AssertionError(str(failures[:8]))
print('SPINE_BITMAP_CONNECTED',checked,'frames',len(c['skins']),'skins')
