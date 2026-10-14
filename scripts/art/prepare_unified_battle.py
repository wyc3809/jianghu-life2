"""第26項：只轉AI原圖尺寸／WebP格式，唔畫新圖。"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
for season in ('autumn', 'spring'):
    image = Image.open(ROOT / f'design/art/unified-battle/source/{season}.webp').convert('RGB')
    image.thumbnail((1000, 1400), Image.Resampling.LANCZOS)
    target = ROOT / f'public/ink/art/battle-preview/{season}.webp'
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, 'WEBP', quality=90, method=4)
