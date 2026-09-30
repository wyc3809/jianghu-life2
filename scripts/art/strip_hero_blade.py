#!/usr/bin/env python3
"""
演武台主角剪影：擦走原本畫死喺每格嘅刀，等引擎按裝備欄畫返唔同兵器剪影。

每格：沿「護手→刀尖」折線開一條帶，帶內只擦幼部分（形態學 opening 之後唔屬於身體嘅像素），手同身保留。
握點同方向同步寫喺 src/spar/silhouetteDraw.ts 嘅 HERO_WEAPON_GRIPS（改呢度要一齊改嗰度）。
重跑冇副作用（已擦嘅位置冇嘢再擦）。用法：python3 scripts/art/strip_hero_blade.py
"""
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
import os
B=os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'ink', 'spar', 'sil') + '/'
# (擦除折線：護手→刀尖, 握點, 角度方向點)
F={
 'hero-idle.webp':([(405,497),(575,628)],(398,490),(575,628)),
 'frames/hero-walk-0.webp':([(405,500),(574,628)],(398,494),(574,628)),
 'frames/hero-walk-2.webp':([(405,500),(574,628)],(398,494),(574,628)),
 'frames/hero-walk-3.webp':([(414,503),(576,631)],(406,497),(576,631)),
 'frames/hero-walk-1.webp':([(425,418),(455,378),(496,322)],(430,468),(600,600)),
 'hero-attack.webp':([(392,232),(300,192),(200,145),(90,100)],(425,262),(90,100)),
 'frames/hero-atk-0.webp':([(383,231),(289,188),(190,145),(92,118)],(422,260),(92,118)),
 'frames/hero-atk-1.webp':([(392,232),(300,192),(200,145),(90,100)],(425,262),(90,100)),
 'frames/hero-atk-2.webp':([(527,353),(572,370)],(512,349),(600,380)),
}
out={}
for f,(pts,grip,aim) in F.items():
    im=Image.open(B+f).convert('RGBA'); a=np.asarray(im).copy()
    M=a[...,3]>60
    band=Image.new('L',im.size,0); dr=ImageDraw.Draw(band)
    dr.line(pts,fill=255,width=30,joint='curve')
    e=pts[-1]; dr.ellipse([e[0]-16,e[1]-16,e[0]+16,e[1]+16],fill=255)
    band=np.asarray(band)>0
    op=ndi.binary_opening(M, structure=np.ones((13,13)))
    kill=band & ~op
    a[kill,3]=0
    Image.fromarray(a,'RGBA').save(B+f,'WEBP',quality=90,method=6)
    ang=float(np.degrees(np.arctan2(aim[1]-grip[1],aim[0]-grip[0])))
    out[f.split('/')[-1].replace('.webp','')]={'grip':list(grip),'angle':round(ang,1)}
print(json.dumps(out,ensure_ascii=False))
