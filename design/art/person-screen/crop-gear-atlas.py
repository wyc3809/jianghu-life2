"""裝備圖集：按檢視過的實際分格裁切，完整物件留16px透明邊。"""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'public/ink/art/person'
OUT.mkdir(parents=True,exist_ok=True)
ATLAS=ROOT/'design/art/person-screen/sources/gear-atlas-original.png'
ACCESSORY=ROOT/'design/art/person-screen/sources/gear-accessory-original.png'
atlas=Image.open(ATLAS).convert('RGBA')
# staff略越過名義418px分界；438px以內仍是完整空隙，不包含相鄰鞭。
rectangles={
 'sword':(0,0,438,418),'blade':(438,0,836,418),'spear':(836,0,1254,418),
 'staff':(0,418,438,836),'whip':(438,418,836,836),'bow':(836,418,1254,836),
 'hidden':(0,836,418,1254),'armor':(418,836,836,1254),
}
report={}
for kind in [*rectangles,'accessory']:
 source=Image.open(ACCESSORY).convert('RGBA') if kind=='accessory' else atlas.crop(rectangles[kind])
 bbox=source.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
 assert bbox,kind
 piece=source.crop(bbox)
 piece.thumbnail((224,224),Image.Resampling.LANCZOS)
 icon=Image.new('RGBA',(256,256),(0,0,0,0))
 icon.alpha_composite(piece,((256-piece.width)//2,(256-piece.height)//2))
 path=OUT/f'gear-{kind}.webp';icon.save(path,lossless=True,method=6)
 check=Image.open(path).convert('RGBA');a=check.getchannel('A')
 assert a.getextrema()==(0,255),(kind,a.getextrema())
 assert a.getpixel((0,0))==0 and a.getpixel((255,255))==0
 occupied=a.point(lambda v:255 if v>16 else 0).getbbox()
 assert occupied[0]>=15 and occupied[1]>=15 and occupied[2]<=241 and occupied[3]<=241,(kind,occupied)
 report[kind]={'file':str(path.relative_to(ROOT)),'size':check.size,'bytes':path.stat().st_size,'alphaRange':a.getextrema(),'opaqueBounds':occupied,'sourceCrop':rectangles.get(kind)}
(ROOT/'design/art/person-screen/gear-alpha-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
