"""把原創四格材質圖按固定座標切出並轉檔；不重繪素材。"""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'design/art/chest-quality/material-atlas-original.png'
im=Image.open(source).convert('RGB')
w,h=im.size
out=ROOT/'public/ink/art/chest';out.mkdir(parents=True,exist_ok=True)
materials={}
for name,box in {'wood':(0,0,w//2,h//2),'metal':(w//2,0,w,h//2),'lining':(0,h//2,w//2,h),'stone':(w//2,h//2,w,h)}.items():
 p=out/f'{name}.webp'
 im.crop(box).resize((512,512),Image.Resampling.LANCZOS).save(p,quality=92,method=6)
 materials[name]={'crop':box,'file':str(p.relative_to(ROOT)),'size':[512,512],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
(ROOT/'design/art/chest-quality/materials.json').write_text(json.dumps({'originalSize':[w,h],'originalSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'materials':materials},indent=2)+'\n')
print('CHEST_MATERIALS_READY',sum(x['bytes'] for x in materials.values()))
