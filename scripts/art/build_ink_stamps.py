#!/usr/bin/env python3
"""
江湖一生 · 朱砂印／氣場／筆觸 位圖產生器（取代舊 SVG 手繪路徑）

輸出（WebP，透明底）：
  public/ink/art/seals/seal-*.webp    朱砂印（白文／朱文，帶石刻崩口與印泥不勻）
  public/ink/art/auras/aura-*.webp    內功模式呼吸氣場（墨暈環 + 淡字）
  public/ink/art/strokes/stroke-*.webp 招式筆觸小圖示

用法：
  pip install pillow
  python3 scripts/art/build_ink_stamps.py --font /path/to/LXGWWenKaiTC-Bold.ttf

字型：霞鶩文楷 TC Bold（LXGW WenKai TC，SIL OFL 1.1，Google Fonts）。
須為繁體字型（Ma Shan Zheng 只有簡體，勝／終／緣／龜／鶴 會變豆腐）。
字型檔體積大（~13MB），不入庫；只提交產出的 WebP。
所有雜訊用固定種子，重跑結果一致。
"""

from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "ink" / "art"

WORK = 768  # 工作解析度（輸出時縮小 → 邊緣自然反鋸齒）

CINNABAR = (170, 46, 38)
CINNABAR_DEEP = (128, 30, 26)
INK = (26, 24, 22)
JADE = (54, 92, 78)
GOLD = (138, 108, 70)


# ---------------------------------------------------------------- noise ---


def value_noise(rng: random.Random, size: int, cell: int, blur: float = 0.0) -> Image.Image:
    """低解析隨機灰階 → 雙三次放大；cell 越大越粗糙。"""
    n = max(2, size // cell + 2)
    small = Image.new("L", (n, n))
    small.putdata([rng.randrange(256) for _ in range(n * n)])
    img = small.resize((size, size), Image.BICUBIC)
    return img.filter(ImageFilter.GaussianBlur(blur)) if blur else img


def fbm(rng: random.Random, size: int, cells: list[tuple[int, float]]) -> Image.Image:
    """多八度疊加（權重和 = 1）。"""
    acc = Image.new("L", (size, size), 0)
    total = 0.0
    for cell, w in cells:
        layer = value_noise(rng, size, cell)
        acc = Image.blend(acc, layer, w / (total + w)) if total else layer
        total += w
    return acc


def threshold(img: Image.Image, t: int) -> Image.Image:
    return img.point(lambda v: 255 if v >= t else 0)


def roughen(mask: Image.Image, rng: random.Random, amount: float, blur: float = 3.0) -> Image.Image:
    """把硬邊遮罩變成石刻崩口：模糊後加雜訊再二值化。"""
    size = mask.size[0]
    soft = mask.filter(ImageFilter.GaussianBlur(blur))
    grain = fbm(rng, size, [(6, 0.45), (18, 0.35), (48, 0.2)])
    # soft + (grain-128)*amount → threshold 128
    mixed = ImageChops.add(soft, grain.point(lambda v: int(max(0, (v - 128) * amount + 128))), scale=1.0, offset=-128)
    return threshold(mixed, 128)


# ---------------------------------------------------------------- glyph ---


def glyph_mask(font_path: str, text: str, box: tuple[int, int, int, int], weight: int = 0) -> Image.Image:
    """把字（可多字，直排右起）塞滿 box；weight>0 加粗（刀刻白文較肥）。"""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    canvas = Image.new("L", (WORK, WORK), 0)
    chars = list(text)
    if len(chars) == 1:
        slots = [(x0, y0, x1, y1)]
    elif len(chars) == 2:
        # 傳統印文：右行先讀
        mid = x0 + bw // 2
        gap = int(bw * 0.04)
        slots = [(mid + gap, y0, x1, y1), (x0, y0, mid - gap, y1)]
    else:
        raise ValueError("最多兩字")

    for ch, (sx0, sy0, sx1, sy1) in zip(chars, slots):
        sw, sh = sx1 - sx0, sy1 - sy0
        font = ImageFont.truetype(font_path, 400)
        l, t, r, b = font.getbbox(ch)
        g = Image.new("L", (r - l + 40, b - t + 40), 0)
        ImageDraw.Draw(g).text((20 - l, 20 - t), ch, font=font, fill=255)
        g = g.crop(g.getbbox())
        # 印文字要撐滿格：保持比例放到最大，再沿短邊拉伸（單字 18%；雙字直排瘦長格可拉到 1.8 倍）
        gw, gh = g.size
        k = min(sw / gw, sh / gh)
        stretch = 1.18 if len(chars) == 1 else 1.8
        tw = min(sw, int(gw * k * (stretch if gw * k < sw else 1)))
        th = min(sh, int(gh * k * (stretch if gh * k < sh else 1)))
        g = g.resize((tw, th), Image.LANCZOS)
        canvas.paste(g, (sx0 + (sw - tw) // 2, sy0 + (sh - th) // 2), g)
    if weight:
        canvas = canvas.filter(ImageFilter.MaxFilter(weight))
    return threshold(canvas.filter(ImageFilter.GaussianBlur(1.2)), 110)


def rounded_rect(size: int, box: tuple[int, int, int, int], radius: int, fill: int = 255) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle(box, radius=radius, fill=fill)
    return m


# ----------------------------------------------------------------- seal ---


def colorize(alpha: Image.Image, rng: random.Random, base: tuple[int, int, int], deep: tuple[int, int, int]) -> Image.Image:
    """印泥濃淡：大尺度雜訊在 base/deep 間插值，alpha 再乘乾擦。"""
    size = alpha.size[0]
    density = fbm(rng, size, [(90, 0.6), (30, 0.4)])
    lo = Image.new("RGB", (size, size), base)
    hi = Image.new("RGB", (size, size), deep)
    rgb = Image.composite(hi, lo, density.point(lambda v: int(max(0, min(255, (v - 110) * 1.6)))))
    # 乾擦：局部 alpha 降到 ~70%
    dry = fbm(rng, size, [(12, 0.5), (40, 0.5)]).point(lambda v: 255 if v > 92 else int(180 + v * 0.8))
    a = ImageChops.multiply(alpha, dry)
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def speckle(rng: random.Random, size: int, density: int) -> Image.Image:
    """印面白點（印泥未著）：回傳 255=保留、0=剔除。"""
    n = fbm(rng, size, [(5, 0.7), (14, 0.3)])
    return n.point(lambda v: 0 if v > 255 - density else 255)


def make_seal(font: str, text: str, style: str, seed: int, tilt: float = 0.0) -> Image.Image:
    rng = random.Random(seed)
    S = WORK
    pad = int(S * 0.08)
    outer = (pad, pad, S - pad, S - pad)

    if style == "baiwen":
        # 白文：實心朱底，字為留白
        block = rounded_rect(S, outer, radius=int(S * 0.035))
        inner = int(S * 0.15)
        g = glyph_mask(font, text, (inner, inner, S - inner, S - inner), weight=7)
        body = ImageChops.subtract(block, g)
    else:
        # 朱文：朱字 + 朱框（框內留白）
        frame = rounded_rect(S, outer, radius=int(S * 0.06))
        th = int(S * 0.045)
        hole = rounded_rect(S, (pad + th, pad + th, S - pad - th, S - pad - th), radius=int(S * 0.04))
        ring = ImageChops.subtract(frame, hole)
        inner = int(S * 0.19)
        g = glyph_mask(font, text, (inner, inner, S - inner, S - inner), weight=3)
        body = ImageChops.lighter(ring, g)

    body = roughen(body, rng, amount=1.35, blur=2.6)
    # 邊框崩角：隨機在外緣咬幾口
    bite = Image.new("L", (S, S), 255)
    d = ImageDraw.Draw(bite)
    for _ in range(rng.randint(3, 6)):
        side = rng.randrange(4)
        t = rng.uniform(0.1, 0.9) * (S - 2 * pad) + pad
        r = rng.uniform(S * 0.012, S * 0.03)
        cx, cy = [(t, pad), (S - pad, t), (t, S - pad), (pad, t)][side]
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    body = ImageChops.multiply(body, roughen(bite, rng, 1.2, 2.0))
    body = ImageChops.multiply(body, speckle(rng, S, 18))

    img = colorize(body, rng, CINNABAR, CINNABAR_DEEP)
    if tilt:
        img = img.rotate(tilt, resample=Image.BICUBIC, expand=False)
    return img


# ----------------------------------------------------------------- aura ---


def make_aura(font: str, glyph: str, color: tuple[int, int, int], seed: int, gaps: int) -> Image.Image:
    """墨暈氣場：斷續筆環兩重 + 中心淡字；透明底。"""
    rng = random.Random(seed)
    S = WORK
    c = S / 2
    alpha = Image.new("L", (S, S), 0)

    def brush_ring(radius: float, width: float, strength: int, n_gaps: int) -> Image.Image:
        ring = Image.new("L", (S, S), 0)
        d = ImageDraw.Draw(ring)
        start = rng.uniform(0, 360)
        arcs = []
        span = 360 / n_gaps
        for i in range(n_gaps):
            a0 = start + i * span + rng.uniform(4, 14)
            a1 = start + (i + 1) * span - rng.uniform(4, 16)
            arcs.append((a0, a1))
        for a0, a1 in arcs:
            steps = int((a1 - a0) * 2)
            for k in range(steps):
                a = math.radians(a0 + (a1 - a0) * k / steps)
                # 筆壓：起筆重、收筆輕
                p = k / steps
                w = width * (0.55 + 0.45 * math.sin(math.pi * min(1, p * 1.3)))
                rr = radius + rng.uniform(-1.5, 1.5)
                x, y = c + rr * math.cos(a), c + rr * math.sin(a)
                d.ellipse((x - w, y - w, x + w, y + w), fill=strength)
        # 飛白：沿筆鋒方向的細紋
        streak = fbm(rng, S, [(3, 0.6), (9, 0.4)]).point(lambda v: 255 if v < 150 else 110)
        return ImageChops.multiply(ring.filter(ImageFilter.GaussianBlur(1.4)), streak)

    alpha = ImageChops.lighter(alpha, brush_ring(S * 0.43, S * 0.022, 235, gaps))
    alpha = ImageChops.lighter(alpha, brush_ring(S * 0.35, S * 0.011, 150, gaps + 2))

    # 暈染：外環外擴的淡墨
    halo = Image.new("L", (S, S), 0)
    ImageDraw.Draw(halo).ellipse((c - S * 0.46, c - S * 0.46, c + S * 0.46, c + S * 0.46), fill=70)
    ImageDraw.Draw(halo).ellipse((c - S * 0.30, c - S * 0.30, c + S * 0.30, c + S * 0.30), fill=0)
    halo = halo.filter(ImageFilter.GaussianBlur(S * 0.04))
    alpha = ImageChops.lighter(alpha, halo)

    # 中心字：極淡
    inner = int(S * 0.3)
    g = glyph_mask(font, glyph, (inner, inner, S - inner, S - inner), weight=0)
    g = g.filter(ImageFilter.GaussianBlur(1.0)).point(lambda v: int(v * 0.42))
    alpha = ImageChops.lighter(alpha, g)

    img = Image.new("RGBA", (S, S), color + (0,))
    img.putalpha(alpha)
    return img


# --------------------------------------------------------------- stroke ---


def make_stroke(font: str, glyph: str, seed: int) -> Image.Image:
    """小尺寸筆觸字：墨色 + 輕微乾擦。"""
    rng = random.Random(seed)
    S = WORK
    pad = int(S * 0.08)
    g = glyph_mask(font, glyph, (pad, pad, S - pad, S - pad), weight=5)
    g = ImageChops.multiply(g, speckle(rng, S, 10))
    img = Image.new("RGBA", (S, S), INK + (0,))
    img.putalpha(g.filter(ImageFilter.GaussianBlur(0.8)))
    return img


# ----------------------------------------------------------------- main ---

SEALS = [
    # id, 印文, 樣式, 種子, 傾角
    ("sheng", "生", "zhuwen", 11, -3.0),
    ("zhong", "終", "baiwen", 12, 2.0),
    ("yuan", "緣", "zhuwen", 13, -2.0),
    ("jianghu", "江湖", "baiwen", 14, 0.0),
    ("zhao", "招", "baiwen", 21, -4.0),
    ("sheng-win", "勝", "baiwen", 22, 3.0),
    ("ming", "命", "zhuwen", 23, -2.5),
    ("wei", "危", "baiwen", 24, 4.0),
    # 落印（sealText）全集補齊：果斷用白文、溫和用朱文
    ("ding", "定", "baiwen", 31, -3.0),
    ("jian", "劍", "baiwen", 32, 2.5),
    ("zhan", "戰", "baiwen", 33, -4.0),
    ("bai", "敗", "baiwen", 34, 3.5),
    ("wu", "武", "baiwen", 35, -2.0),
    ("dun", "遁", "baiwen", 36, 3.0),
    ("zong", "宗", "zhuwen", 37, -2.5),
    ("shou", "收", "zhuwen", 38, 2.0),
    ("jiao", "教", "zhuwen", 39, -3.0),
    ("jin", "晉", "zhuwen", 40, 2.5),
    ("yue", "月", "zhuwen", 41, -2.0),
    ("lian", "煉", "zhuwen", 42, 3.0),
    ("zhuang", "裝", "zhuwen", 43, -3.5),
]

AURAS = [
    # id(=internalMode), 字, 色, 種子, 斷筆數
    ("guixi", "龜", JADE, 31, 3),
    ("huxiao", "虎", CINNABAR, 32, 5),
    ("hexian", "鶴", INK, 33, 4),
    ("shepan", "蛇", GOLD, 34, 6),
]

STROKES = [
    ("guard", "守", 41),
    ("dodge", "遁", 42),
]


def save(img: Image.Image, path: Path, size: int, quality: int = 88) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.relative_to(ROOT)}  {path.stat().st_size // 1024}KB")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", required=True, help="LXGW WenKai TC Bold TTF 路徑")
    args = ap.parse_args()

    print("seals")
    for sid, text, style, seed, tilt in SEALS:
        save(make_seal(args.font, text, style, seed, tilt), OUT / "seals" / f"seal-{sid}.webp", 256)
    print("auras")
    for aid, glyph, color, seed, gaps in AURAS:
        save(make_aura(args.font, glyph, color, seed, gaps), OUT / "auras" / f"aura-{aid}.webp", 256)
    print("strokes")
    for sid, glyph, seed in STROKES:
        save(make_stroke(args.font, glyph, seed), OUT / "strokes" / f"stroke-{sid}.webp", 64)


if __name__ == "__main__":
    main()
