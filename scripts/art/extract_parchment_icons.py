"""從已選原創設計稿提取四款操作圖示；保留原筆觸而非程式繪圖。"""
from pathlib import Path
from collections import deque
import hashlib
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT/'design/art/person-screen/selected-third.png'
BOXES = {'icon-close':(693,766,742,813),'icon-back':(25,18,111,120),'icon-arrow':(357,1594,443,1684),'icon-caret':(373,861,400,885)}


def connected(mask, start):
    """只清除與外圍相連嘅背景，保留菱形內嘅白色箭頭。"""
    h,w=mask.shape; seen=np.zeros_like(mask); queue=deque(start)
    while queue:
        x,y=queue.popleft()
        if x<0 or y<0 or x>=w or y>=h or seen[y,x] or not mask[y,x]: continue
        seen[y,x]=True; queue.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    return seen


def build():
    """輸出真alpha WebP並記錄來源座標及原檔雜湊。"""
    source=Image.open(SOURCE).convert('RGB');out=ROOT/'public/ink/art/parchment-ui';out.mkdir(parents=True,exist_ok=True)
    records=[]
    for name,box in BOXES.items():
        im=source.crop(box);rgb=np.asarray(im).astype(float);lum=rgb@np.array([.2126,.7152,.0722])
        if name=='icon-back':
            dark=lum<115;seen=np.zeros_like(dark);largest=None
            for y,x in zip(*np.where(dark)):
                if seen[y,x]:continue
                component=connected(dark,[(int(x),int(y))]);seen|=component
                if largest is None or component.sum()>largest.sum():largest=component
            h,w=dark.shape;edges=[(x,0) for x in range(w)]+[(x,h-1) for x in range(w)]+[(0,y) for y in range(h)]+[(w-1,y) for y in range(h)]
            alpha=(~connected(~largest,edges)).astype(float)
        elif name=='icon-arrow':
            alpha=np.clip((rgb[:,:,0]-rgb[:,:,1]-15)/65,0,1)
        else:alpha=np.clip((190-lum)/105,0,1)
        alpha[alpha<.08]=0
        rgba=np.dstack([rgb,np.uint8(alpha*255)]).astype(np.uint8)
        result=Image.fromarray(rgba,'RGBA');bounds=result.getbbox();result=result.crop(bounds)
        target=out/(name+'.webp');result.save(target,format='WEBP',lossless=True)
        records.append({'file':str(target.relative_to(ROOT)),'sourceCrop':box,'dimensions':list(result.size),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    (ROOT/'design/art/parchment-ui/icon-source.json').write_text(json.dumps({'source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'origin':'玩家選定的原創生成設計稿；只提取圖示，文字仍為可讀介面文字。','icons':records},ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':build()
