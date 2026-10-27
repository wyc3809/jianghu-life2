#!/usr/bin/env python3
"""原創武學令玉面：固定seed水彩礦物紋，不含文字、外部圖片或SVG。"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parents[2]

def noise(n,cells,seed):
 rng=np.random.default_rng(seed);source=Image.fromarray((rng.random((cells,cells))*255).astype('uint8'))
 return np.asarray(source.resize((n,n),Image.Resampling.BICUBIC)).astype(float)/255

def build():
 n=512;yy,xx=np.mgrid[0:1:complex(n),0:1:complex(n)]
 broad=noise(n,8,81);fine=noise(n,60,82);grain=noise(n,230,83)
 veins=np.exp(-((np.sin(xx*7+np.sin(yy*8)*.4+1.5)+yy*.9)/.09)**2)
 cloud=(broad-.5)*12+(fine-.5)*3+(grain-.5)*1.7
 rgb=np.stack([225+cloud-veins*10,231+cloud-veins*7,215+cloud-veins*5],axis=-1)
 out=ROOT/'public/ink/art/token/jade.webp';out.parent.mkdir(parents=True,exist_ok=True)
 Image.fromarray(np.clip(rgb,0,255).astype('uint8')).save(out,'WEBP',quality=95,method=6)
 print(out.relative_to(ROOT),out.stat().st_size)
if __name__=='__main__':build()
