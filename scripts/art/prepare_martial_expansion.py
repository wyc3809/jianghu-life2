"""擴展圖集：只分割生成圖、校正腳底及壓縮；唔繪製人物。可指定 sheet 名增量重跑。"""
from pathlib import Path
import sys,json,hashlib
from PIL import Image
import numpy as np
from scipy.ndimage import label,find_objects,binary_dilation
R=Path(__file__).resolve().parents[2]; D=R/'design/art/martial-identities'; O=R/'public/ink/art/martial'
fixes=json.loads((D/'expansion-segmentation.json').read_text()); batches=json.loads((D/'expansion-generation.json').read_text()); selected=set(sys.argv[1:]); meta=json.loads((O/'anchors.json').read_text()); problems=[]; done=[]
for b in batches:
 if selected and b['sheet'] not in selected:continue
 p=D/'source'/f"{b['sheet']}.png"
 if not p.exists():continue
 im=Image.open(p).convert('RGBA'); raw=np.array(im); sha=hashlib.sha256(p.read_bytes()).hexdigest()
 if b['role']=='effects':
  w,h=im.width//4,im.height//4
  for i,e in enumerate(b['effects']):
   target=O/f"{e['id']}-fx-{e['layer']}.webp"
   tile=im.crop((i%4*w,i//4*h,(i%4+1)*w,(i//4+1)*h))
   tile.resize((256,256),Image.Resampling.LANCZOS).save(target,quality=88,method=4)
  done.append(b['sheet']);continue
 labels,_=label(raw[:,:,3]>80);components=[]
 for cid,rect in enumerate(find_objects(labels),1):
  if rect and int((labels[rect]==cid).sum())>1400:components.append((cid,rect))
 fix=fixes.get(b['sheet']); expected=fix['count'] if fix else len(b['arts'])*8
 if len(components)!=expected:
  problems.append({'sheet':b['sheet'],'components':len(components)});continue
 ordered=sorted(components,key=lambda t:t[1][0].stop);cells=[]
 row_counts=fix['rows'] if fix else [4]*b.get('rows',6);offset=0
 for count in row_counts:
  cells.extend(sorted(ordered[offset:offset+count],key=lambda t:t[1][1].start));offset+=count
 art_maps=fix['maps'] if fix else {art:list(range(i*8,i*8+8)) for i,art in enumerate(b['arts']) if art not in b['arts'][:i]}
 for art,indices in art_maps.items():
  # 重複填格唔覆寫首次完成序列。
  tiles=[];frames=[]
  bounds=[cells[indices[i]][1] for i in range(8)]
  # 組內固定身高，先用縱向原圖高度估值；大兵器保留更大橫向空間。
  body_h=float(np.percentile([s[0].stop-s[0].start for s in bounds],60));scale=218/max(175,body_h)
  prepared=[]
  for pose in range(8):
   cid,rect=cells[indices[pose]];x,y=max(0,rect[1].start-3),max(0,rect[0].start-3);x1,y1=min(im.width,rect[1].stop+3),min(im.height,rect[0].stop+3)
   a=raw[y:y1,x:x1].copy();mask=binary_dilation(labels[y:y1,x:x1]==cid,iterations=2);a[:,:,3][~mask]=0;a[:,:,3][a[:,:,3]<28]=0
   yy,xx=np.where(a[:,:,3]>110);fy=int(yy.max());feet=xx[yy>=fy-9];fx=float((np.percentile(feet,8)+np.percentile(feet,92))/2)
   # 統一縮細整組至所有兵器／衣角都有至少4px安全邊；唔裁斷部件。
   for limit in [(252/max(fx,1)),(252/max(a.shape[1]-fx,1)),(324/max(fy,1)),(20/max(a.shape[0]-fy,1))]:scale=min(scale,limit)
   prepared.append((a,xx,yy,fx,fy,[x,y,x1-x,y1-y]))
  atlas=Image.new('RGBA',(4096,352))
  for i,(a,xx,yy,fx,fy,rect) in enumerate(prepared):
   tile=Image.fromarray(a);size=(max(1,round(tile.width*scale)),max(1,round(tile.height*scale)));tile=tile.resize(size,Image.Resampling.LANCZOS);ox,oy=round(256-fx*scale),round(328-fy*scale)
   if ox<0 or oy<0 or ox+size[0]>512 or oy+size[1]>352:raise ValueError((art,i,size,ox,oy))
   out=Image.new('RGBA',(512,352));out.paste(tile,(ox,oy));atlas.paste(out,(i*512,0))
   lo=int(yy.min());band=(yy>=lo+(fy-lo)*.18)&(yy<=lo+(fy-lo)*.74);bx,by=xx[band],yy[band];tx=float(np.percentile(bx,99.5));ty=float(np.median(by[bx>=tx-3]))
   frames.append({'sourceRect':rect,'sourceFoot':[round(fx,2),fy],'scale':round(scale,5),'offset':[ox,oy],'contact':[round(ox+tx*scale,2),round(oy+ty*scale,2)]})
   if i==0:out.save(O/f'{art}-guard.webp',quality=90,method=4)
  target=O/f'{art}.webp';atlas.save(target,quality=90,method=4)
  meta[art]={'sheet':b['sheet'],'sourceSha256':sha,'frameWidth':512,'frameHeight':352,'frameCount':8,'foot':[256,328],'bodyHeight':218,'bytes':target.stat().st_size,'frames':frames}
 done.append(b['sheet'])
(O/'anchors.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
(R/'src/fx/art/poseAnchors.json').write_text(json.dumps({k:[f['contact'] for f in v['frames']] for k,v in meta.items()},separators=(',',':'))+'\n')
report={'done':done,'problems':problems,'totalAtlases':len(meta),'totalFrames':len(meta)*8};(D/'expansion-processing.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report))
if problems:sys.exit(1)
# 正確持武最低限度後備，跟主圖用同一原畫，唔另畫幾何人偶。
fallbacks={'finger':'qy_mist_step','staff':'art_staff_iron','whip':'art_whip_silk','bow':'art_bow_star','hook':'art_hook_silk','halberd':'art_heavy_halberd','flute':'th_flute_sword','mechanism':'tm_thousand_mech','dart':'tm_poison_dart'}
for family,art in fallbacks.items():
 p=O/f'{art}-guard.webp'
 if p.exists():Image.open(p).resize((256,176),Image.Resampling.LANCZOS).save(R/f'src/fx/art/fallback/{family}.webp',quality=85,method=4)
