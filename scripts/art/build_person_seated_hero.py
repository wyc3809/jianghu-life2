#!/usr/bin/env python3
"""由保留原圖重新編碼盤坐人物 WebP；保留 alpha，不裁切或改畫。"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/art/person-screen/sources/seated-hero-source.png'
TARGET = ROOT / 'public/ink/art/person/seated-hero.webp'


def main() -> None:
    image = Image.open(SOURCE).convert('RGBA')
    image.thumbnail((768, 768), Image.Resampling.LANCZOS)
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    image.save(TARGET, 'WEBP', quality=92, method=6, exact=True)
    print(f'{TARGET.relative_to(ROOT)}: {image.width}×{image.height}, {TARGET.stat().st_size} bytes')


if __name__ == '__main__':
    main()
