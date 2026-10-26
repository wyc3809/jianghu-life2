"""人物頁背景：保留原圖，以WebP交付；不修改構圖或色彩。"""
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'design/art/person-screen/sources/person-mountain-paper-original.png'
OUT=ROOT/'public/ink/art/person'
OUT.mkdir(parents=True,exist_ok=True)
image=Image.open(SOURCE).convert('RGB')
image.save(OUT/'person-mountain-paper.webp',quality=90,method=6)
print(image.size,(OUT/'person-mountain-paper.webp').stat().st_size)
