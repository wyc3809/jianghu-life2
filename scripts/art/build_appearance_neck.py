"""裁出原創頸部材質並保留真正透明邊緣；不重繪面孔或肢體。"""
from pathlib import Path
from PIL import Image
import numpy as np, json, io, base64
ROOT=Path(__file__).resolve().parents[2]
source=Image.open(ROOT/'design/art/appearance/sources/neck-bridge-original.png').convert('RGBA')
a=np.array(source); a[:,:,3][a[:,:,3]<40]=0
# 只清除生成透明邊上的紅黃異色，不改正常膚色。
r,g,b=[a[:,:,i].astype(int) for i in range(3)]
a[:,:,3][((r>210)&(g<85))|((r>210)&(g>165)&(b<80))]=0
image=Image.fromarray(a);box=image.getbbox();image=image.crop(box)
image.thumbnail((512,512),Image.Resampling.LANCZOS)
path='ink/art/appearance/neck-bridge.webp'
image.save(ROOT/'public'/path,'WEBP',quality=95,method=6)
mapping_path=ROOT/'src/appearance/asset-map.json';mapping=json.loads(mapping_path.read_text());mapping['neck']=path;mapping_path.write_text(json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
fallback_path=ROOT/'src/appearance/asset-fallback.json';fallback=json.loads(fallback_path.read_text());image.thumbnail((128,128),Image.Resampling.LANCZOS);buf=io.BytesIO();image.save(buf,'WEBP',quality=85);fallback[path]='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode();fallback_path.write_text(json.dumps(fallback,ensure_ascii=False)+'\n')
print('NECK_BRIDGE',box)
