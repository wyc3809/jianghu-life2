"""第31項：保留生成原畫，只縮放及轉WebP，唔重畫素材。"""
from pathlib import Path
from PIL import Image
import shutil

root = Path(__file__).resolve().parents[2]
source = root / 'design/art/gacha-codex/cover-source.png'
source.parent.mkdir(parents=True, exist_ok=True)
if not source.exists():
    shutil.copy('/workspace/generated_images/exec-8a76c794-58e5-4eea-a333-df614661e536.png', source)
dest = root / 'public/ink/art/gacha'
dest.mkdir(parents=True, exist_ok=True)
image = Image.open(source).convert('RGB')
image.save(dest / 'codex-cover.webp', quality=92)
premium_source = source.with_name('cover-premium-source.png')
if premium_source.exists():
    Image.open(premium_source).convert('RGB').save(dest / 'codex-cover-premium.webp', quality=92)
pages_source = source.with_name('pages-source.png')
if not pages_source.exists():
    shutil.copy('/workspace/generated_images/exec-5f18c024-61cc-4baf-b730-e90eacb2180d.png', pages_source)
pages = Image.open(pages_source).convert('RGB')
for side, bounds in [('left', (0, 0, pages.width // 2, pages.height)),
                     ('right', (pages.width // 2, 0, pages.width, pages.height))]:
    pages.crop(bounds).save(dest / f'codex-page-{side}.webp', quality=92)
