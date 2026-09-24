#!/usr/bin/env python3
"""
江湖一生 · 水墨 UI 位圖產生器（進度條／修為環／四象圖／角框／斬擊／紙紋）

取代所有 UI 內嵌 SVG。輸出 WebP（透明底）至 public/ink/art/ui/：

  brush-bar.webp       橫向毛筆條（起筆重、收筆飛白）— 進度條填色
  brush-bar-rail.webp  淡乾筆底軌 — 進度條底
  brush-ring.webp      一筆圓（順時針自 12 點起筆）— 修為環填色
  brush-ring-rail.webp 淡圓軌
  ink-halo-a/b.webp    斷續柔焦殘墨環（兩層反向慢轉）
  corner-bracket.webp  角框筆觸（左上 L 形）
  nature-grid.webp     心性四象：十字虛軸 + 上限菱形
  nature-wash.webp     朱砂淡染（四象多邊形填色）
  ink-dot.webp         墨點（四象頂點）
  slash-stroke.webp    首領一斬（橫向，CSS 旋轉）
  brush-btn-cinnabar.webp 主要按鈕朱砂筆觸底
  paper-grain.webp     可平鋪紙紋（灰階雜訊）

填色類素材皆以 alpha 為主：CSS 用 mask-image + background-color 染色，
一張紋理可出朱／墨／青各色。動畫全由 CSS（clip-path / conic mask / rotate）驅動。

用法：
  pip install pillow numpy
  python3 scripts/art/build_ink_ui.py

固定種子，重跑結果一致。之後如有 AI 出圖，同名同尺寸替換即可，程式碼毋須改。
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "ink" / "art" / "ui"

INK = (22, 19, 15)
CINNABAR = (170, 46, 38)


# ------------------------------------------------------------- helpers ---


def smooth_noise_1d(rng: np.random.Generator, n: int, knots: int) -> np.ndarray:
    """1D 平滑雜訊（-1..1），用於筆路抖動與筆壓。"""
    k = rng.uniform(-1, 1, knots + 3)
    x = np.linspace(0, knots, n)
    i = np.floor(x).astype(int)
    f = x - i
    f = f * f * (3 - 2 * f)
    return k[i] * (1 - f) + k[i + 1] * f


def value_noise_2d(rng: np.random.Generator, h: int, w: int, cell: int) -> np.ndarray:
    """2D 值雜訊（0..1），雙線性 + smoothstep。"""
    gh, gw = h // cell + 2, w // cell + 2
    g = rng.random((gh, gw))
    ys = np.arange(h) / cell
    xs = np.arange(w) / cell
    yi, xi = np.floor(ys).astype(int), np.floor(xs).astype(int)
    fy, fx = ys - yi, xs - xi
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a = g[yi][:, xi]
    b = g[yi][:, xi + 1]
    c = g[yi + 1][:, xi]
    d = g[yi + 1][:, xi + 1]
    top = a * (1 - fx) + b * fx
    bot = c * (1 - fx) + d * fx
    return top * (1 - fy[:, None]) + bot * fy[:, None]


def brush_stroke(
    rng: np.random.Generator,
    length: int,
    height: int,
    width_frac: float = 0.34,
    bristles: int = 70,
    dry: float = 0.55,
    wobble: float = 0.06,
    head: float = 0.08,
    taper: float = 0.2,
) -> np.ndarray:
    """
    模擬毛筆一劃（橫向，左→右）。回傳 alpha 0..1，shape=(height, length)。
    - head：起筆頓筆長度比例（較粗）
    - taper：收筆收尖長度比例
    - dry：收筆飛白程度（0 無 → 1 極乾）
    """
    t = np.linspace(0, 1, length)
    mid = height / 2 + smooth_noise_1d(rng, length, 5) * height * wobble
    half = height * width_frac / 2
    press = 0.84 + 0.1 * smooth_noise_1d(rng, length, 7)
    # 頓筆：起筆處圓潤加粗
    press = press * (1 + 0.16 * np.exp(-(((t - head * 0.6) / max(head, 1e-3)) ** 2)))
    # 入筆：由圓頭迅速張開
    press = press * np.sqrt(np.clip(t / 0.012, 0.35, 1))
    # 收筆：逐漸收尖
    tail = np.clip((1 - t) / max(taper, 1e-3), 0, 1)
    press = press * (0.18 + 0.82 * tail**0.7)
    w = half * press

    rows = np.arange(height)[:, None]
    alpha = np.zeros((height, length))
    offs = rng.uniform(-1, 1, bristles)
    caps = rng.uniform(0.8, 1.25, bristles)
    sig = max(0.8, half * 2.4 / bristles * 1.7)
    for k in range(bristles):
        y = mid + offs[k] * w + smooth_noise_1d(rng, length, 14) * sig * 0.8
        # 墨量隨行筆遞減；邊緣毛更早乾
        ink = caps[k] - t * dry * (0.5 + 1.0 * abs(offs[k])) * rng.uniform(0.7, 1.4)
        streak = smooth_noise_1d(rng, length, int(rng.integers(20, 60)))
        skip = smooth_noise_1d(rng, length, int(rng.integers(60, 140)))
        on = np.clip((ink + streak * 0.3 + skip * 0.22 * t) * 2.6 - 0.4, 0, 1)
        alpha += on[None, :] * np.exp(-(((rows - y[None, :]) / sig) ** 2))
    alpha = np.clip(alpha / 1.5, 0, 1)
    # 首尾柔化，避免硬切
    ends = np.clip(t / 0.004, 0, 1) * np.clip((1 - t) / 0.02, 0, 1)
    alpha *= ends[None, :]
    # 紙紋吃墨
    grain = value_noise_2d(rng, height, length, 3)
    alpha *= 0.8 + 0.2 * grain
    return alpha


def polar_warp(stroke: np.ndarray, size: int, r_mid: float, thickness: float, start_deg: float = -90.0) -> np.ndarray:
    """把橫向筆劃（左→右）繞成順時針圓環；x 對應角度，y 對應半徑。"""
    h, w = stroke.shape
    yy, xx = np.mgrid[0:size, 0:size].astype(float)
    c = (size - 1) / 2
    dx, dy = xx - c, yy - c
    r = np.hypot(dx, dy)
    ang = (np.degrees(np.arctan2(dy, dx)) - start_deg) % 360  # 0 = 起筆點，順時針增加
    sx = np.clip((ang / 360) * (w - 1), 0, w - 1).astype(int)
    sy = (r - (r_mid - thickness / 2)) / thickness * (h - 1)
    valid = (sy >= 0) & (sy <= h - 1)
    out = np.zeros((size, size))
    out[valid] = stroke[sy[valid].astype(int), sx[valid]]
    return out


def to_img(alpha: np.ndarray, color: tuple[int, int, int], gain: float = 1.0) -> Image.Image:
    a = (np.clip(alpha * gain, 0, 1) * 255).astype(np.uint8)
    img = Image.new("RGBA", (a.shape[1], a.shape[0]), color + (0,))
    img.putalpha(Image.fromarray(a, "L"))
    return img


def save(img: Image.Image, name: str, size: tuple[int, int] | None = None, quality: int = 86) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if size:
        img = img.resize(size, Image.LANCZOS)
    p = OUT / name
    img.save(p, "WEBP", quality=quality, method=6)
    print(f"  {p.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {p.stat().st_size // 1024}KB")


# --------------------------------------------------------------- assets ---


def build_bars() -> None:
    rng = np.random.default_rng(101)
    a = brush_stroke(rng, 2048, 128, width_frac=0.66, bristles=100, dry=0.55, taper=0.08, head=0.04)
    save(to_img(a, INK), "brush-bar.webp", (1024, 64))
    rng = np.random.default_rng(102)
    rail = brush_stroke(rng, 2048, 128, width_frac=0.6, bristles=70, dry=1.0, taper=0.06, head=0.03)
    save(to_img(rail, INK, 0.9), "brush-bar-rail.webp", (1024, 64))


def build_rings() -> None:
    S = 768
    rng = np.random.default_rng(201)
    # 一筆圓：周長方向拉長；收筆稍乾，但仍閉合（進度 100% 時唔見缺口）
    st = brush_stroke(rng, 3000, 96, width_frac=0.7, bristles=80, dry=0.35, taper=0.03, head=0.03, wobble=0.03)
    ring = polar_warp(st, S, r_mid=S * 0.42, thickness=S * 0.11)
    save(to_img(ring, INK), "brush-ring.webp", (256, 256))

    rng = np.random.default_rng(202)
    st = brush_stroke(rng, 3000, 96, width_frac=0.55, bristles=60, dry=0.95, taper=0.02, head=0.02, wobble=0.02)
    rail = polar_warp(st, S, r_mid=S * 0.42, thickness=S * 0.1)
    save(to_img(rail, INK, 0.8), "brush-ring-rail.webp", (256, 256))

    for name, seed, gaps, blur in (("ink-halo-a.webp", 211, 5, 5), ("ink-halo-b.webp", 212, 3, 9)):
        rng = np.random.default_rng(seed)
        st = brush_stroke(rng, 3000, 96, width_frac=0.5, bristles=50, dry=0.7, taper=0.02, head=0.02, wobble=0.05)
        # 斷筆：若干缺口
        cut = np.ones(st.shape[1])
        for _ in range(gaps):
            c0 = int(rng.integers(0, st.shape[1]))
            span = int(rng.integers(120, 420))
            idx = np.arange(c0, c0 + span) % st.shape[1]
            ramp = np.sin(np.linspace(0, math.pi, span)) ** 0.5
            cut[idx] = np.minimum(cut[idx], 1 - ramp)
        halo = polar_warp(st * cut[None, :], S, r_mid=S * 0.45, thickness=S * 0.09, start_deg=float(rng.uniform(0, 360)))
        img = to_img(halo, INK).filter(ImageFilter.GaussianBlur(blur))
        save(img, name, (256, 256))


def build_corner() -> None:
    S = 512
    rng = np.random.default_rng(301)
    h = brush_stroke(rng, 1400, 128, width_frac=0.5, bristles=50, dry=0.6, taper=0.25, head=0.05)
    v = brush_stroke(rng, 1400, 128, width_frac=0.5, bristles=50, dry=0.6, taper=0.25, head=0.05)
    hi = Image.fromarray((h * 255).astype(np.uint8)).resize((int(S * 0.94), 64), Image.LANCZOS)
    vi = Image.fromarray((v * 255).astype(np.uint8)).resize((int(S * 0.94), 64), Image.LANCZOS).rotate(-90, expand=True)
    m = Image.new("L", (S, S), 0)
    # 起筆在角：橫劃由左往右（翻轉令起筆在左上角），直劃由上往下
    m.paste(hi, (16, 12))
    m = Image.fromarray(np.maximum(np.array(m), 0))
    mv = Image.new("L", (S, S), 0)
    mv.paste(vi.transpose(Image.FLIP_LEFT_RIGHT), (12, 16))
    a = np.maximum(np.array(m), np.array(mv)) / 255
    save(to_img(a, INK), "corner-bracket.webp", (128, 128))


def build_nature() -> None:
    S = 600
    rng = np.random.default_rng(401)
    a = np.zeros((S, S))

    def dashed(length: int, dash: int, gap: int) -> np.ndarray:
        st = brush_stroke(rng, length, 48, width_frac=0.12, bristles=10, dry=0.3, taper=0.01, head=0.01, wobble=0.02)
        mask = ((np.arange(length) % (dash + gap)) < dash).astype(float)
        mask = np.convolve(mask, np.ones(5) / 5, mode="same")
        return st * mask[None, :]

    L = int(S * 0.9)
    hx = dashed(L, 14, 12)
    y0 = S // 2 - 24
    x0 = (S - L) // 2
    a[y0 : y0 + 48, x0 : x0 + L] = np.maximum(a[y0 : y0 + 48, x0 : x0 + L], hx)
    vx = dashed(L, 14, 12).T
    a[x0 : x0 + L, y0 : y0 + 48] = np.maximum(a[x0 : x0 + L, y0 : y0 + 48], vx)

    # 上限菱形（與 InkStatsPanel 之 NATURE_AXIS 對應：俠上 30、惡右 108、邪下 118、狂左 44；以 150 為全幅）
    pts = [(75, 30), (108, 75), (75, 118), (44, 75)]
    img = Image.fromarray((a * 255 * 0.4).astype(np.uint8))
    from PIL import ImageDraw

    d = ImageDraw.Draw(img)
    k = S / 150
    poly = [(x * k, y * k) for x, y in pts] + [(pts[0][0] * k, pts[0][1] * k)]
    for (xa, ya), (xb, yb) in zip(poly, poly[1:]):
        n = int(math.hypot(xb - xa, yb - ya) / 3)
        for i in range(n):
            if (i // 4) % 2:
                continue
            f = i / n
            r = 1.9 + rng.uniform(-0.4, 0.6)
            x, y = xa + (xb - xa) * f, ya + (yb - ya) * f
            d.ellipse((x - r, y - r, x + r, y + r), fill=int(90 + rng.uniform(0, 50)))
    alpha = np.array(img.filter(ImageFilter.GaussianBlur(0.8))) / 255
    save(to_img(alpha, INK), "nature-grid.webp", (300, 300))

    # 朱砂淡染：不勻濃淡，邊緣另由 CSS 疊深一層
    rng = np.random.default_rng(402)
    n = 0.65 * value_noise_2d(rng, 512, 512, 96) + 0.35 * value_noise_2d(rng, 512, 512, 32)
    wash = Image.fromarray(((0.6 + 0.4 * n) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
    save(to_img(np.array(wash) / 255, CINNABAR), "nature-wash.webp", (256, 256))

    # 墨點
    rng = np.random.default_rng(403)
    S2 = 192
    yy, xx = np.mgrid[0:S2, 0:S2]
    c = (S2 - 1) / 2
    ang = np.arctan2(yy - c, xx - c)
    edge = 0.34 + 0.05 * np.interp(ang, np.linspace(-math.pi, math.pi, 13), rng.uniform(-1, 1, 13))
    r = np.hypot(yy - c, xx - c) / S2
    dot = np.clip((edge - r) * 30, 0, 1) * (0.85 + 0.15 * value_noise_2d(rng, S2, S2, 10))
    save(to_img(dot, CINNABAR), "ink-dot.webp", (48, 48))


def build_button() -> None:
    """主要按鈕底：朱砂一筆，飽滿、兩端收得短，文字壓喺上面仍然清楚。"""
    rng = np.random.default_rng(701)
    a = brush_stroke(rng, 2048, 256, width_frac=0.9, bristles=120, dry=0.35, taper=0.05, head=0.03, wobble=0.02)
    save(to_img(a, CINNABAR), "brush-btn-cinnabar.webp", (1024, 128))


def build_slash() -> None:
    rng = np.random.default_rng(501)
    a = brush_stroke(rng, 3200, 200, width_frac=0.42, bristles=90, dry=0.75, taper=0.35, head=0.04, wobble=0.04)
    save(to_img(a, CINNABAR), "slash-stroke.webp", (1600, 100))


def build_grain() -> None:
    rng = np.random.default_rng(601)
    N = 256
    # 可平鋪：週期邊界的白雜訊 + 環繞模糊
    g = rng.random((N, N))
    acc = np.zeros_like(g)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            acc += np.roll(np.roll(g, dy, 0), dx, 1)
    g = 0.5 * g + 0.5 * acc / 9
    coarse = rng.random((N // 16, N // 16))
    coarse = np.kron(coarse, np.ones((16, 16)))
    for _ in range(4):
        coarse = (coarse + np.roll(coarse, 1, 0) + np.roll(coarse, -1, 0) + np.roll(coarse, 1, 1) + np.roll(coarse, -1, 1)) / 5
    v = np.clip(0.75 * g + 0.25 * coarse, 0, 1)
    gray = (v * 255).astype(np.uint8)
    img = Image.merge("RGBA", [Image.fromarray(gray)] * 3 + [Image.fromarray(np.full((N, N), 255, np.uint8))])
    save(img, "paper-grain.webp", quality=70)


def main() -> None:
    print("ui")
    build_bars()
    build_rings()
    build_corner()
    build_nature()
    build_slash()
    build_button()
    build_grain()


if __name__ == "__main__":
    main()
