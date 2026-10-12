"""將生成嘅四格透明牌章裁切成遊戲用 WebP；唔改圖案或重畫素材。"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = root / 'design/art/ui-commercial-review/icon-badges/source.webp'
image = Image.open(source).convert('RGBA')
out = root / 'public/ink/art/badges'
out.mkdir(parents=True, exist_ok=True)
for name, x, y in [('brown', 250, 8), ('slate', 785, 8), ('jade', 250, 514), ('red', 785, 514)]:
    image.crop((x, y, x + 500, y + 500)).resize((256, 256), Image.Resampling.LANCZOS).save(out / f'{name}.webp', quality=90)
