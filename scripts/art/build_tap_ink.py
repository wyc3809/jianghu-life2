#!/usr/bin/env python3
"""第50項：原創點墨粒子。固定seed、真alpha，無文字／外部素材／SVG。
只於離線生成時使用numpy及Pillow；執行時只貼位圖，無濾鏡或像素運算。
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/ink/art/fx'

def noise(n, cells, seed):
    rng=np.random.default_rng(seed)
    im=Image.fromarray((rng.random((cells,cells))*255).astype('uint8'))
    return np.asarray(im.resize((n,n),Image.Resampling.BICUBIC)).astype(float)/255

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    for i,(name,n) in enumerate([('core',256),('wash',256),('speck',64)]):
        yy,xx=np.mgrid[-1:1:complex(n),-1:1:complex(n)]
        theta=np.arctan2(yy,xx);radius=np.sqrt((xx*1.07)**2+(yy*.94)**2)
        # 不規則吸水邊，不畫太陽狀長刺；多尺度纖維使墨色有濃淡。
        boundary=.65+.06*np.sin(theta*3+.8)+.035*np.sin(theta*7+2)+.025*np.sin(theta*11)
        coarse=noise(n,9,71+i);fiber=noise(n,85 if n>64 else 23,101+i)
        if name=='wash':
            alpha=np.clip((boundary+coarse*.08-radius)*8,0,1)*(.25+.3*coarse+.14*fiber)
            alpha+=np.exp(-((radius-boundary+.025)/.045)**2)*.20
        else:
            alpha=np.clip((boundary+coarse*.06-radius)*12,0,1)*(.6+.25*coarse+.15*fiber)
        alpha=np.asarray(Image.fromarray((np.clip(alpha,0,1)*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.55)))
        rgba=np.zeros((n,n,4),dtype='uint8');rgba[:,:,:3]=[41,39,34];rgba[:,:,3]=alpha
        path=OUT/f'tap-{name}.webp';Image.fromarray(rgba).save(path,'WEBP',lossless=True,method=6)
        print(path.relative_to(ROOT),path.stat().st_size)
if __name__=='__main__':build()
