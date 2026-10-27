"""由保留原圖輸出紙面及九宮格磨邊；不繪製或偽造原圖細節。"""
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'design/art/parchment-ui/sources/paper-panel-original.png'
OUT=ROOT/'public/ink/art/parchment-ui';OUT.mkdir(parents=True,exist_ok=True)
im=Image.open(SRC).convert('RGB')
im.save(OUT/'paper-panel.webp',quality=92,method=6)
w,h=im.size
im.crop((112,112,w-112,h-112)).resize((768,768),Image.Resampling.LANCZOS).save(OUT/'paper-fiber.webp',quality=90,method=6)
# Retain all four photographed/generated edges. The inner fade prevents a hard seam.
rim=im.resize((1024,1024),Image.Resampling.LANCZOS).convert('RGBA')
y,x=np.mgrid[:1024,:1024]
d=np.minimum(np.minimum(x,1023-x),np.minimum(y,1023-y))
a=np.clip((48-d)/16,0,1)*255
rim.putalpha(Image.fromarray(a.astype('uint8')))
rim.save(OUT/'paper-rim.webp',lossless=True,method=6)
print({p.name:p.stat().st_size for p in OUT.glob('paper-*.webp')})
