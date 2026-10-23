"""把已確認的地圖原圖轉成遊戲用 WebP；不重繪或裁切原圖。"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/art/jianghu-map-concept/watercolor-v3.png'
DEST = ROOT / 'public/ink/art/jianghu/jianghu-map-watercolor.webp'
DEST.parent.mkdir(parents=True, exist_ok=True)
with Image.open(SOURCE) as source:
    source.convert('RGB').save(DEST, 'WEBP', quality=90, method=6)
print(f'{DEST.relative_to(ROOT)}: {DEST.stat().st_size} bytes')
