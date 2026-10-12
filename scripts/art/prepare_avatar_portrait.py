"""原創透明水墨頭像轉成遊戲用WebP；只做尺寸及格式準備。"""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[2]
image = Image.open(root / 'design/art/ui-commercial-review/avatar-portrait/source.webp').convert('RGBA')
image.thumbnail((256, 256), Image.Resampling.LANCZOS)
canvas = Image.new('RGBA', (256, 256))
canvas.alpha_composite(image, ((256-image.width)//2, (256-image.height)//2))
out = root / 'public/ink/art/portraits/wanderer.webp'
out.parent.mkdir(parents=True, exist_ok=True)
canvas.save(out, quality=90)
