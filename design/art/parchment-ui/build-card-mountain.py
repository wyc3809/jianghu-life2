"""由保留的原創山水紙面輸出裝備格 WebP，不另繪內容。"""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
src=ROOT/'design/art/parchment-ui/sources/card-mountain-original.png'
out=ROOT/'public/ink/art/parchment-ui/card-mountain-paper.webp'
im=Image.open(src).convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS)
im.save(out,quality=90,method=6)
print(out.name,out.stat().st_size)
