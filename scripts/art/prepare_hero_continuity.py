"""只分割原創人物透明圖、統一比例及腳底；唔繪製或重畫人物。"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import label,find_objects,binary_dilation
import hashlib,json

root=Path(__file__).resolve().parents[2]
folder=root/'design/art/hero-continuity';source=folder/'source.png'
im=Image.open(source).convert('RGBA');raw=np.array(im)
labels,_=label(raw[:,:,3]>80);parts=[]
for cid,rect in enumerate(find_objects(labels),1):
    if rect and int((labels[rect]==cid).sum())>2000:parts.append((cid,rect))
assert len(parts)==12,f'須人手核對分格，找到{len(parts)}個人物'
parts.sort(key=lambda item:item[1][0].stop)
ordered=[]
for row in range(3):ordered.extend(sorted(parts[row*4:row*4+4],key=lambda item:item[1][1].start))
# 同一人物固定比例，倒地幀唔按低矮bbox放大。
scale=218/float(np.median([r[0].stop-r[0].start for _,r in ordered[:6]]))
atlas=Image.new('RGBA',(2048,1056));frames=[]
names=['walk-left','walk-left-pass','walk-right','walk-right-pass','idle','idle-breath','hurt','hurt-recover','down-recoil','down-kneel','down-fall','down-rest']
for i,(cid,rect) in enumerate(ordered):
    x0,y0=max(0,rect[1].start-3),max(0,rect[0].start-3)
    x1,y1=min(im.width,rect[1].stop+3),min(im.height,rect[0].stop+3)
    a=raw[y0:y1,x0:x1].copy();mask=binary_dilation(labels[y0:y1,x0:x1]==cid,iterations=2)
    a[:,:,3][~mask]=0;a[:,:,3][a[:,:,3]<28]=0
    yy,xx=np.where(a[:,:,3]>110);foot_y=int(yy.max())
    feet=xx[yy>=foot_y-9]
    foot_x=float((np.percentile(feet,8)+np.percentile(feet,92))/2) if i<8 else (a.shape[1]-1)/2
    tile=Image.fromarray(a).resize((round(a.shape[1]*scale),round(a.shape[0]*scale)),Image.Resampling.LANCZOS)
    ox,oy=round(256-foot_x*scale),round(328-foot_y*scale)
    assert ox>=4 and oy>=4 and ox+tile.width<=508 and oy+tile.height<=348,(i,ox,oy,tile.size)
    frame=Image.new('RGBA',(512,352));frame.paste(tile,(ox,oy))
    atlas.paste(frame,(i%4*512,i//4*352))
    frames.append({'name':names[i],'sourceRect':[x0,y0,x1,y1],'offset':[ox,oy],'scale':scale,'foot':[256,328]})
dest=root/'public/ink/spar/hero-detail';dest.mkdir(parents=True,exist_ok=True)
atlas.save(dest/'lifecycle.webp',quality=90,method=4)
meta={'source':'source.png','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output':'public/ink/spar/hero-detail/lifecycle.webp','outputSha256':hashlib.sha256((dest/'lifecycle.webp').read_bytes()).hexdigest(),'columns':4,'rows':3,'frameWidth':512,'frameHeight':352,'bodyHeight':218,'frames':frames}
(folder/'manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
# 用斗笠／身體有足夠寬度嘅首行估身高，排除槍尖等幼長兵器。
# 每套主圖／暴擊／擊倒／內功細節圖各自固定校準，顯示時統一縮細；唔逐幀fit。
def standing_height(image):
    alpha=np.array(image.convert('RGBA'))[:,:,3]>110
    rows=np.where(alpha.sum(axis=1)>=40)[0]
    return int(np.where(alpha)[0].max()-rows[0]+1)
neutral_h=standing_height(atlas.crop((0,352,512,704)))
scales={p.stem.removesuffix('-guard'):round(standing_height(Image.open(p))/neutral_h,5)
        for p in sorted((root/'public/ink/art/martial').glob('*-guard.webp'))}
(root/'src/fx/art/heroStanceScale.json').write_text(json.dumps(scales,ensure_ascii=False,separators=(',',':'))+'\n')
print('12 detailed hero frames prepared, bytes:',(dest/'lifecycle.webp').stat().st_size)
