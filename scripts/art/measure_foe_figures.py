"""量度既有敵人位圖身高及腳底，唔改圖；死亡四格共用同一比例，唔放大低矮倒地格。"""
from pathlib import Path
from PIL import Image
import numpy as np
import json,hashlib

ROOT=Path(__file__).resolve().parents[2];metrics={};sources={}
for path in sorted((ROOT/'public/ink/spar/sil').glob('enemy-*.webp')):
    im=Image.open(path).convert('RGBA');alpha=np.array(im)[:,:,3]>110
    y=np.where(alpha)[0];rows=np.where(alpha.sum(axis=1)>=im.width*40/512)[0]
    key=path.stem.removeprefix('enemy-');down_heights=[]
    for i in range(4):
        down=ROOT/f'public/ink/spar/commercial/enemy-{key}-down-{i}.webp'
        if down.exists():
            d=Image.open(down).convert('RGBA');box=d.getchannel('A').point(lambda a:255 if a>110 else 0).getbbox()
            assert box;down_heights.append((box[3]-box[1])*800/d.height)
            sources[str(down.relative_to(ROOT))]=hashlib.sha256(down.read_bytes()).hexdigest()
    metrics[key]={'sourceHeight':im.height,'bodyHeight':int(y.max()-rows[0]+1),'footY':int(y.max()+1),
                  'downBodyHeight':round(max(down_heights),5) if down_heights else 788}
    sources[str(path.relative_to(ROOT))]=hashlib.sha256(path.read_bytes()).hexdigest()
(ROOT/'src/spar/foeFigureMetrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
folder=ROOT/'design/art/foe-figure-scale';folder.mkdir(exist_ok=True)
(folder/'sources.json').write_text(json.dumps(sources,indent=2)+'\n')
print('25款敵人既有原圖已量度：',len(metrics))
