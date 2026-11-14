from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[2]
src=root/'design/art/manhua/sources/exec-81290d3d-3963-4e7c-8720-6762f897eb85.png'
im=Image.open(src).convert('RGBA');w,h=im.size
names=['sword','blade','spear','staff','whip','bow','hidden','plain-robe','pine-armor','stormcloud-armor','divine-silk-armor','cloud-boots','jade-token','divine-moon-pendant']
out=root/'public/ink/art/manhua/icons';out.mkdir(parents=True,exist_ok=True)
entries=[]
for i,name in enumerate(names):
 x=i%4;y=i//4
 cell=im.crop((round(x*w/4),round(y*h/4),round((x+1)*w/4),round((y+1)*h/4)))
 box=cell.getbbox();assert box,name
 obj=cell.crop(box);obj.thumbnail((228,228),Image.Resampling.LANCZOS)
 final=Image.new('RGBA',(256,256));final.alpha_composite(obj,((256-obj.width)//2,(256-obj.height)//2))
 dest=out/(name+'.webp');final.save(dest,'WEBP',lossless=True)
 entries.append({'id':name,'path':str(dest.relative_to(root)),'source_cell':[x,y],'size':[256,256],'source_kind':'ai-generated','source_tool':'image_gen.imagegen','status':'integration-review','sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
manifest={'source':str(src),'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'style_reference':'approved silver-haired jade traveller concept, 2026-11-14','source_size':[w,h],'assets':entries}
(root/'design/art/manhua/icons-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(w,h,len(entries))
