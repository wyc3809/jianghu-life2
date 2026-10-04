"""分卷導航 tab 徽章（位圖，唔用 SVG）：粗糙墨圈＋四向尖刺＋頂珠，中間白色器物剪影。
輸入：public/ink/icons/tab-<id>.webp（彩色器物）
輸出：public/ink/icons/tab-<id>-badge.webp（256×256 透明底）
AI 新圖可同名同尺寸直接替換。用法：python3 scripts/art/build_tab_badges.py
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

IDS = ['home', 'person', 'jianghu', 'practice']
S = 768          # 先畫大再縮
OUT = 256
INK = (18, 16, 14)


def rough_disc(seed: int) -> Image.Image:
    """墨圈：半徑帶低頻起伏（毛筆一圈）＋外沿飛白筆鋒＋四向尖刺＋頂珠"""
    rnd = random.Random(seed)
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    c = S / 2
    r = S * 0.34
    ph = [rnd.uniform(0, math.tau) for _ in range(4)]

    def radius(a: float) -> float:
        return r * (1 + 0.035 * math.sin(3 * a + ph[0]) + 0.025 * math.sin(5 * a + ph[1]) + 0.015 * math.sin(11 * a + ph[2]))

    pts = [(c + math.cos(a) * radius(a), c + math.sin(a) * radius(a)) for a in [i * math.tau / 360 for i in range(360)]]
    d.polygon(pts, fill=255)
    # 外沿飛白：沿圓周一段段短筆鋒，向外拖尾
    for i in range(26):
        a = rnd.uniform(0, math.tau)
        sweep = rnd.uniform(0.2, 0.6)
        w = rnd.randint(6, 14)
        off = rnd.uniform(-2, 9)
        seg = [(c + math.cos(a + t * sweep / 12) * (radius(a) + off), c + math.sin(a + t * sweep / 12) * (radius(a) + off)) for t in range(13)]
        d.line(seg, fill=rnd.randint(150, 255), width=w)

    def spike(angle: float, length: float, width: float) -> None:
        base = radius(angle) * 0.9
        ax, ay = c + math.cos(angle) * base, c + math.sin(angle) * base
        tx, ty = c + math.cos(angle) * (base + length), c + math.sin(angle) * (base + length)
        px, py = -math.sin(angle) * width, math.cos(angle) * width
        d.polygon([(ax + px, ay + py), (tx, ty), (ax - px, ay - py)], fill=255)

    for ang, ln, wd in [(math.pi, 92, 24), (0, 92, 24), (math.pi * 0.76, 62, 18), (math.pi * 0.24, 62, 18), (math.pi * 1.24, 40, 12), (math.pi * 1.76, 40, 12)]:
        spike(ang, ln, wd)
    top = c - radius(-math.pi / 2)
    d.ellipse([c - 24, top - 58, c + 24, top - 10], fill=255)   # 頂珠
    d.rectangle([c - 7, top - 18, c + 7, top + 10], fill=255)
    return m.filter(ImageFilter.GaussianBlur(1.4))


def fill_holes(mask: Image.Image) -> Image.Image:
    """由外圍 flood fill，剩低未填嘅黑位就係破洞 → 補實"""
    m = mask.copy()
    ImageDraw.floodfill(m, (0, 0), 128)
    return m.point(lambda v: 0 if v == 128 else 255)


def white_glyph(src: Image.Image) -> Image.Image:
    """彩色器物 → 實心白剪影：低門檻取輪廓、補破洞、去雜點，邊緣微微毛化似筆觸"""
    size = int(S * 0.46)
    src = src.convert('RGBA').resize((size, size), Image.LANCZOS)
    pad = Image.new('L', (size + 4, size + 4), 0)
    pad.paste(src.getchannel('A').point(lambda v: 255 if v > 40 else 0), (2, 2))
    a = fill_holes(pad).crop((2, 2, size + 2, size + 2))
    a = a.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))     # 去細碎雜點
    a = a.filter(ImageFilter.GaussianBlur(1.4))
    # 刻紋：原圖深色筆劃變成白剪影入面嘅墨線（似參考圖白字入面嘅黑筆）
    lum = src.convert('L').filter(ImageFilter.GaussianBlur(1.2))
    shade = lum.point(lambda v: 40 if v < 95 else int(236 + (v / 255) * 19))
    shade = shade.filter(ImageFilter.MedianFilter(5))
    return Image.merge('RGBA', (shade, shade, shade, a))


def build(icon_id: str, seed: int) -> None:
    disc = rough_disc(seed)
    canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ink = Image.new('RGBA', (S, S), INK + (255,))
    canvas.paste(ink, (0, 0), disc)
    # 圈內淡淡灰暈，唔好死黑一舊
    wash = Image.new('L', (S, S), 0)
    ImageDraw.Draw(wash).ellipse([S * 0.24, S * 0.22, S * 0.62, S * 0.56], fill=70)
    wash = wash.filter(ImageFilter.GaussianBlur(40))
    grey = Image.new('RGBA', (S, S), (90, 88, 84, 255))
    canvas.paste(grey, (0, 0), ImageChops.multiply(wash, disc))
    glyph = white_glyph(Image.open(f'public/ink/icons/tab-{icon_id}.webp'))
    gx = (S - glyph.width) // 2
    gy = (S - glyph.height) // 2
    # 白剪影加一圈墨邊，貼喺黑圈上更清楚
    edge = Image.new('RGBA', glyph.size, INK + (255,))
    halo = glyph.getchannel('A').filter(ImageFilter.MaxFilter(9))
    canvas.paste(edge, (gx, gy), halo)
    canvas.alpha_composite(glyph, (gx, gy))
    canvas.resize((OUT, OUT), Image.LANCZOS).save(f'public/ink/icons/tab-{icon_id}-badge.webp', 'WEBP', quality=92, method=6)


if __name__ == '__main__':
    for i, icon in enumerate(IDS):
        build(icon, 11 + i * 7)
        print('wrote', f'public/ink/icons/tab-{icon}-badge.webp')
