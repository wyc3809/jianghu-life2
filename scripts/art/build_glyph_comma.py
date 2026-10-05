"""重畫水墨數字嘅千位逗號 public/ink/ui/g-comma.webp。

舊版逗號圖成個字咁高、形似「9」，「1,234」會睇成「19234」。
新版：借 g-dot.webp 嘅墨點，縮細貼底，再加一撇向左下嘅墨尾；畫布高度同其他字形一樣（64），
寬度收窄，等佢喺數字之間似真正嘅逗號。純位圖（唔用 SVG）。
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
UI = ROOT / 'public' / 'ink' / 'ui'


def main() -> None:
    dot = Image.open(UI / 'g-dot.webp').convert('RGBA')
    bbox = dot.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    blob = dot.crop(bbox) if bbox else dot
    # 墨點縮到大約字高 18%
    s = 12 / max(blob.size)
    blob = blob.resize((max(1, round(blob.width * s)), max(1, round(blob.height * s))), Image.LANCZOS)

    W, H = 16, 64
    scale = 4  # 超取樣畫墨尾，之後縮返，邊緣先順
    big = Image.new('RGBA', (W * scale, H * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    ink = (14, 12, 10, 255)
    # 墨尾：由墨點右下向左下一撇，越尾越幼
    cx, cy = 9.5 * scale, 52 * scale
    pts = []
    for i in range(12):
        t = i / 11
        x = cx + (1.5 - 6.5 * t) * scale
        y = cy + (2 + 9 * t) * scale
        r = (2.6 * (1 - t) + 0.5) * scale
        pts.append((x, y, r))
    for x, y, r in pts:
        d.ellipse((x - r, y - r, x + r, y + r), fill=ink)
    big = big.filter(ImageFilter.GaussianBlur(scale * 0.35))
    out = big.resize((W, H), Image.LANCZOS)
    # 墨點貼底（中心大約 y=50）
    out.alpha_composite(blob, (round(9.5 - blob.width / 2), round(50 - blob.height / 2)))
    out.save(UI / 'g-comma.webp', 'WEBP', quality=95, method=6)
    print('→ public/ink/ui/g-comma.webp', out.size)


if __name__ == '__main__':
    main()
