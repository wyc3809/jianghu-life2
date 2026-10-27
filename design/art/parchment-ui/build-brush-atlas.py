"""從原創筆觸圖集裁切、清走游離雜點，保留半透明刷毛；不繪製替代筆觸。"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
import hashlib, json
ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'design/art/parchment-ui/sources/brush-atlas-original.png'
OUT=ROOT/'public/ink/art/parchment-ui'
OUT.mkdir(parents=True,exist_ok=True)
source=Image.open(SOURCE).convert('RGBA')
specs={
 'brush-confirm':{'box':(20,0,1755,300),'width':1536},
 'brush-underline':{'box':(60,299,1720,351),'width':1536},
 'brush-caption':{'box':(30,355,1750,555),'width':1024},
 'brush-delta':{'box':(585,552,1190,701),'width':384},
 'brush-selected':{'box':(350,697,1406,887),'width':1024},
}
report={}
for name,spec in specs.items():
 a=np.array(source.crop(spec['box']))
 alpha=a[:,:,3]
 labels,count=ndimage.label(alpha>40)
 sizes=np.bincount(labels.ravel());sizes[0]=0
 largest=labels==sizes.argmax()
 # Only retain the original connected paint and its antialiased fringe.
 retain=ndimage.binary_dilation(largest,iterations=3)
 alpha[~retain]=0
 if name=='brush-selected':
  # The source has accidental pigment in its nominally empty center.
  # Remove only that center; all four original handpainted edges remain intact.
  alpha[35:-35,38:-38]=0
 mask=alpha>220
 median=np.median(a[:,:,:3][mask],axis=0).astype('uint8') if mask.any() else np.array([158,52,42],dtype='uint8')
 # Transparent fringe from image generation may have saturated matte RGB.
 # Use pigment RGB for those low-alpha pixels to prevent halos on ivory.
 fringe=(alpha>0)&(alpha<120)
 a[fringe,:3]=median
 a[:,:,3]=alpha
 im=Image.fromarray(a,'RGBA')
 bbox=im.getbbox()
 if bbox:
  # Extra transparent breathing room protects drybrush tips during scaling.
  x0,y0,x1,y1=bbox
  im=im.crop((max(0,x0-3),max(0,y0-3),min(im.width,x1+3),min(im.height,y1+3)))
 factor=spec['width']/im.width
 im=im.resize((spec['width'],max(1,round(im.height*factor))),Image.Resampling.LANCZOS)
 im.save(OUT/(name+'.webp'),format='WEBP',quality=94,method=6,exact=True)
 report[name]={'sourceCrop':spec['box'],'runtimeSize':im.size,'bytes':(OUT/(name+'.webp')).stat().st_size,'sha256':hashlib.sha256((OUT/(name+'.webp')).read_bytes()).hexdigest(),'alphaExtrema':im.getchannel('A').getextrema()}
report['brush-selected']['recommendedBorderImageSlice']=32
(ROOT/'design/art/parchment-ui/brush-alpha-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Inspectable preview, not shipped.
preview=Image.new('RGB',(1100,820),'#f4ecd9');draw=ImageDraw.Draw(preview)
for y in range(0,820,24):
 for x in range(0,1100,24):
  if (x//24+y//24)%2:draw.rectangle((x,y,x+23,y+23),fill='#e1d7c4')
y=12
for name in specs:
 im=Image.open(OUT/(name+'.webp')).convert('RGBA')
 if name=='brush-selected':
  im.thumbnail((700,135),Image.Resampling.LANCZOS)
 else:im.thumbnail((1050,180),Image.Resampling.LANCZOS)
 preview.paste(im,((1100-im.width)//2,y),im);y+=im.height+22
preview.save(ROOT/'design/art/parchment-ui/brush-alpha-preview.jpg',quality=94)
print(json.dumps(report,ensure_ascii=False,indent=2))
# Exact thin selected outline extracted from the project-owned chosen reference.
# Keep only cinnabar pigment in its outer rim; discard the weapon and editable UI text.
reference=Image.open(ROOT/'design/art/person-screen/selected-third.png').convert('RGBA')
a=np.array(reference.crop((35,909,297,1132)))
r,g,b=[a[:,:,i].astype(float) for i in range(3)]
y,x=np.indices(a.shape[:2]);rim=(x<13)|(x>=a.shape[1]-13)|(y<13)|(y>=a.shape[0]-13)
difference=np.minimum(r-g,r-b)
alpha=np.clip((difference-30)/25*255,0,255).astype('uint8')
alpha[~rim]=0
alpha[(g>160)|(r>225)]=0
# Neutralize the paper matte on antialias pixels; opaque pigment retains original color.
low=(alpha>0)&(alpha<240)
a[low,:3]=[163,55,43]
a[:,:,3]=alpha
im=Image.fromarray(a,'RGBA')
im.save(OUT/'brush-selected-reference.webp',quality=96,method=6,exact=True)
report['brush-selected-reference']={'source':'design/art/person-screen/selected-third.png','sourceCrop':[35,909,297,1132],'runtimeSize':im.size,'recommendedBorderImageSlice':13,'bytes':(OUT/'brush-selected-reference.webp').stat().st_size,'alphaExtrema':im.getchannel('A').getextrema(),'note':'Exact chosen reference pigment, center cleared; use as preferred card outline.'}
(ROOT/'design/art/parchment-ui/brush-alpha-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
