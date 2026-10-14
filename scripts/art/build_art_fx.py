#!/usr/bin/env python3
"""
江湖一生 · 外功專屬動畫特效位圖（第 25 項；唔用 SVG，.claude/rules/no-svg-game-art.md）

輸出 public/ink/art/artfx/<key>.webp，key 同 src/fx/art/choreo.ts 嘅 ArtSpriteKey 一一對應：
  長河拳   wave／wave-big／droplet
  裂石殘掌 crack／rock／dust
  聽雨劍意 rain／drop／thrust
  驚雷刀   storm／lightning／spark／scorch
  穿雲槍   streak／cloud／cloud-ring／qi
  唐門飛針 needle／glint／poison
  追風腿   wind／wind-ring
  珍瓏棋局 board／stone-black／stone-white／board-glow
水墨風：墨色用 multiply 疊喺畫面，光（雷、刀光、閃光）用 screen。
用法：python3 scripts/art/build_art_fx.py（固定種子，可重跑；AI 圖可以同名同尺寸替換）
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'ink' / 'art' / 'artfx'
SS = 3  # 超取樣

INK = (28, 26, 23)
INK_BLUE = (40, 62, 78)
STONE = (78, 72, 66)


# ───────── 工具 ─────────

def canvas(w: int, h: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    m = Image.new('L', (w * SS, h * SS), 0)
    return m, ImageDraw.Draw(m)


def arr(m: Image.Image) -> np.ndarray:
    return np.asarray(m).astype(np.float32) / 255


def blur(a: np.ndarray, r: float) -> np.ndarray:
    return arr(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)))


def noise(h: int, w: int, cell: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    gh, gw = max(2, int(h / cell) + 3), max(2, int(w / cell) + 3)
    small = rng.random((gh, gw)).astype(np.float32)
    big = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(big).astype(np.float32) / 255


def streaks(h: int, w: int, seed: int, horizontal: bool = True) -> np.ndarray:
    """乾筆絲紋：沿筆勢方向拉長嘅雜訊"""
    rng = np.random.default_rng(seed)
    if horizontal:
        small = rng.random((max(2, h // 6), 6)).astype(np.float32)
    else:
        small = rng.random((6, max(2, w // 6))).astype(np.float32)
    return np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255


def save(rgb: tuple[int, int, int] | np.ndarray, alpha: np.ndarray, name: str, size: tuple[int, int]) -> None:
    h, w = alpha.shape
    a = np.clip(alpha, 0, 1)
    if isinstance(rgb, tuple):
        col = np.dstack([np.full((h, w), c, np.float32) for c in rgb])
    else:
        col = rgb
    img = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(img, 'RGBA').resize(size, Image.LANCZOS).save(OUT / f'{name}.webp', 'WEBP', quality=90, method=6)
    print(f'  {name}.webp {size[0]}×{size[1]}')


def lerp_rgb(a: tuple[int, int, int], b: tuple[int, int, int], t: np.ndarray) -> np.ndarray:
    t = np.clip(t, 0, 1)[..., None]
    return np.array(a, np.float32) * (1 - t) + np.array(b, np.float32) * t


def grid(w: int, h: int) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    return xx / w, yy / h


# ───────── 長河拳 ─────────

def wave() -> None:
    """月牙水浪：凸向右，中間厚兩頭尖，帶乾筆水紋"""
    W, H = 256 * SS, 128 * SS
    x, y = grid(W, H)
    cx, cy = 0.18, 0.5
    r1 = np.sqrt(((x - cx) / 0.78) ** 2 + ((y - cy) / 0.5) ** 2)
    r2 = np.sqrt(((x - cx + 0.16) / 0.72) ** 2 + ((y - cy) / 0.47) ** 2)
    band = (r1 < 1) & (r2 > 1)
    a = blur(band.astype(np.float32), 2 * SS)
    s = streaks(H, W, 3)
    a = a * (0.55 + 0.45 * s)
    # 浪頭（右緣）白沫：淡啲
    foam = np.clip((r1 - 0.9) * 10, 0, 1)
    col = lerp_rgb(INK_BLUE, (120, 150, 165), foam * 0.8 + s * 0.15)
    save(col, a, 'wave', (256, 128))


def wave_big() -> None:
    """巨浪拍岸：浪頭由左下捲上再向右前方捲落，浪尖碎沫，底下一筆橫水"""
    W = H = 256 * SS
    m, d = canvas(256, 256)

    def stroke(cx: float, cy: float, r: float, a0: float, a1: float, w0: float, w1: float, n: int = 120) -> None:
        for k in range(n):
            t = k / (n - 1)
            ang = math.radians(a0 + (a1 - a0) * t)
            px, py = (cx + math.cos(ang) * r) * W, (cy - math.sin(ang) * r) * H
            wdt = (w0 + (w1 - w0) * t) * W
            d.ellipse([px - wdt, py - wdt, px + wdt, py + wdt], fill=255)

    # 浪身：由左下（200°）經頂（90°）捲去右邊（-10°），由粗變幼
    stroke(0.5, 0.7, 0.36, 200, -15, 0.075, 0.03)
    # 浪尖向內捲
    stroke(0.79, 0.62, 0.1, -15, -230, 0.03, 0.008, 80)
    # 底下橫水
    for k in range(200):
        t = k / 199
        px, py = (0.06 + 0.88 * t) * W, (0.84 + 0.015 * math.sin(t * 9)) * H
        wdt = 0.035 * W * math.sin(math.pi * t) ** 0.6
        d.ellipse([px - wdt * 1.6, py - wdt, px + wdt * 1.6, py + wdt], fill=255)
    a = blur(arr(m), 1.5 * SS)
    s = streaks(H, W, 7, horizontal=False)
    a = a * (0.55 + 0.45 * s)
    # 碎沫
    rng = np.random.default_rng(9)
    m2, d2 = canvas(256, 256)
    for _ in range(46):
        ang = math.radians(rng.uniform(-40, 110))
        rr = rng.uniform(0.4, 0.52)
        px, py = 0.5 * W + math.cos(ang) * rr * W, 0.7 * H - math.sin(ang) * rr * H
        r = rng.uniform(0.005, 0.016) * W
        d2.ellipse([px - r, py - r, px + r, py + r], fill=255)
    a = np.maximum(a, blur(arr(m2), SS) * 0.85)
    x, y = grid(W, H)
    col = lerp_rgb(INK_BLUE, (120, 150, 165), np.clip(1 - y, 0, 1) * 0.5 + s * 0.25)
    save(col, a, 'wave-big', (256, 256))


def droplet() -> None:
    W = H = 48 * SS
    x, y = grid(W, H)
    dx, dy = x - 0.5, y - 0.58
    body = np.sqrt(dx ** 2 + dy ** 2) < 0.28
    tip = (np.abs(dx) < 0.28 * np.clip((y - 0.1) / 0.5, 0, 1)) & (y > 0.1) & (y < 0.6)
    a = blur((body | tip).astype(np.float32), 1.2 * SS)
    col = lerp_rgb(INK_BLUE, (90, 120, 140), np.clip(1 - y, 0, 1))
    save(col, a, 'droplet', (32, 32))


# ───────── 裂石殘掌 ─────────

def crack() -> None:
    """地裂：由左向右伸嘅鋸齒裂紋＋分叉，左粗右幼"""
    W, H = 512 * SS, 96 * SS
    m, d = canvas(512, 96)
    rng = np.random.default_rng(21)

    def bolt(x0: float, y0: float, x1: float, w0: float, w1: float, steps: int, jit: float) -> list[tuple[float, float]]:
        pts = [(x0, y0)]
        for i in range(1, steps + 1):
            t = i / steps
            pts.append((x0 + (x1 - x0) * t, y0 + rng.uniform(-jit, jit) * H))
        for i in range(len(pts) - 1):
            t = i / (len(pts) - 1)
            wdt = int(max(1, (w0 + (w1 - w0) * t) * SS))
            d.line([pts[i], pts[i + 1]], fill=255, width=wdt)
        return pts

    main = bolt(0, H * 0.5, W * 0.98, 9, 1.5, 22, 0.16)
    for i in range(5):
        px, py = main[rng.integers(3, len(main) - 3)]
        bolt(px, py, px + rng.uniform(0.08, 0.2) * W, 4, 1, 6, 0.22)
    a = blur(arr(m), 0.8 * SS)
    # 邊緣碎屑陰影
    a = np.maximum(a, blur(arr(m), 5 * SS) * 0.35)
    save(INK, a, 'crack', (512, 96))


def rock() -> None:
    W = H = 64 * SS
    rng = np.random.default_rng(31)
    m, d = canvas(64, 64)
    pts = []
    for i in range(7):
        ang = i / 7 * math.tau + rng.uniform(-0.25, 0.25)
        r = rng.uniform(0.3, 0.46) * W
        pts.append((W / 2 + math.cos(ang) * r, H / 2 + math.sin(ang) * r))
    d.polygon(pts, fill=255)
    a = blur(arr(m), 0.8 * SS)
    x, y = grid(W, H)
    shade = np.clip((x + y) - 0.6, 0, 1)
    col = lerp_rgb((140, 130, 118), STONE, shade) * (0.85 + 0.15 * noise(H, W, 6 * SS, 32))[..., None]
    save(col, a, 'rock', (64, 64))


def dust() -> None:
    W, H = 160 * SS, 96 * SS
    x, y = grid(W, H)
    n = noise(H, W, 14 * SS, 41) * 0.6 + noise(H, W, 5 * SS, 42) * 0.4
    blob = np.exp(-(((x - 0.5) / 0.38) ** 2 + ((y - 0.62) / 0.34) ** 2))
    a = np.clip(blob * (0.4 + n) - 0.15, 0, 1)
    save((120, 108, 92), blur(a, 2 * SS), 'dust', (160, 96))


# ───────── 聽雨劍意 ─────────

def rain() -> None:
    W, H = 16 * SS, 128 * SS
    x, y = grid(W, H)
    a = np.exp(-((x - 0.5) / 0.16) ** 2) * np.clip(np.sin(y * math.pi), 0, 1) ** 0.6 * (0.3 + 0.7 * y)
    save((60, 76, 92), a, 'rain', (16, 128))


def drop() -> None:
    """懸空雨珠：透明水滴，有高光同深色邊"""
    W, H = 48 * SS, 64 * SS
    x, y = grid(W, H)
    dx, dy = (x - 0.5) / 0.36, (y - 0.62) / 0.3
    body = dx ** 2 + dy ** 2 < 1
    tip = (np.abs(x - 0.5) < 0.36 * np.clip((y - 0.08) / 0.55, 0, 1)) & (y > 0.08) & (y < 0.62)
    shape = blur((body | tip).astype(np.float32), 1.0 * SS)
    rim = np.clip(shape - blur(shape, 3 * SS) * 0.9, 0, 1) * 2.5
    hl = np.exp(-(((x - 0.4) / 0.08) ** 2 + ((y - 0.55) / 0.1) ** 2))
    a = np.clip(shape * 0.35 + rim, 0, 1)
    col = lerp_rgb((50, 74, 92), (245, 248, 250), np.clip(hl * 1.5, 0, 1))
    a = np.maximum(a, hl * shape)
    save(col, a, 'drop', (48, 64))


def thrust() -> None:
    """劍光一刺：極幼極亮嘅光線，兩頭尖"""
    W, H = 256 * SS, 32 * SS
    x, y = grid(W, H)
    taper = np.clip(np.sin(x * math.pi) ** 0.5, 0, 1) * np.clip(x * 3, 0, 1)
    core = np.exp(-((y - 0.5) / 0.05) ** 2) * taper
    glow = np.exp(-((y - 0.5) / 0.22) ** 2) * taper * 0.45
    a = np.clip(core + glow, 0, 1)
    col = lerp_rgb((170, 200, 230), (255, 255, 255), core)
    save(col, a, 'thrust', (256, 32))


# ───────── 驚雷刀 ─────────

def storm() -> None:
    W, H = 512 * SS, 256 * SS
    x, y = grid(W, H)
    n = noise(H, W, 40 * SS, 51) * 0.55 + noise(H, W, 14 * SS, 52) * 0.3 + noise(H, W, 5 * SS, 53) * 0.15
    mass = np.exp(-(((x - 0.5) / 0.5) ** 2 + ((y - 0.42) / 0.34) ** 2))
    a = np.clip((mass * (0.55 + n) - 0.32) * 1.8, 0, 1)
    a *= np.clip(1 - (y - 0.7) * 3, 0, 1)
    col = lerp_rgb((30, 30, 38), (70, 72, 84), n)
    save(col, blur(a, 2 * SS), 'storm', (512, 256))


def lightning() -> None:
    """驚雷：由上劈落嘅鋸齒雷，有分叉同光暈（screen）"""
    W, H = 128 * SS, 512 * SS
    rng = np.random.default_rng(61)
    m, d = canvas(128, 512)
    mg, dg = canvas(128, 512)

    def bolt(x0: float, y0: float, y1: float, wdt: float, jit: float, depth: int) -> None:
        pts = [(x0, y0)]
        steps = 14
        for i in range(1, steps + 1):
            t = i / steps
            pts.append((pts[-1][0] + rng.uniform(-jit, jit) * W, y0 + (y1 - y0) * t))
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=255, width=max(1, int(wdt * SS * (1 - 0.5 * i / steps))))
            dg.line([pts[i], pts[i + 1]], fill=255, width=max(1, int(wdt * 5 * SS)))
        if depth > 0:
            for _ in range(2):
                k = rng.integers(3, steps - 3)
                bx, by = pts[k]
                bolt(bx, by, by + rng.uniform(0.12, 0.22) * H, wdt * 0.45, jit * 0.8, depth - 1)

    bolt(W * 0.5, 0, H, 5, 0.09, 2)
    core = blur(arr(m), 0.7 * SS)
    glow = blur(arr(mg), 6 * SS) * 0.55
    a = np.clip(core + glow, 0, 1)
    col = lerp_rgb((150, 180, 235), (255, 255, 255), core)
    save(col, a, 'lightning', (128, 512))


def spark() -> None:
    W = H = 32 * SS
    x, y = grid(W, H)
    dx, dy = x - 0.5, y - 0.5
    r = np.sqrt(dx ** 2 + dy ** 2)
    star = np.exp(-(np.abs(dx) / 0.04)) * np.exp(-(np.abs(dy) / 0.3)) + np.exp(-(np.abs(dy) / 0.04)) * np.exp(-(np.abs(dx) / 0.3))
    a = np.clip(star + np.exp(-(r / 0.12) ** 2), 0, 1)
    col = lerp_rgb((240, 210, 140), (255, 255, 255), np.exp(-(r / 0.1) ** 2))
    save(col, a, 'spark', (32, 32))


def scorch() -> None:
    W, H = 256 * SS, 64 * SS
    x, y = grid(W, H)
    n = noise(H, W, 10 * SS, 71)
    e = (((x - 0.5) / 0.46) ** 2 + ((y - 0.5) / 0.4) ** 2)
    a = np.clip((1 - e) * (0.6 + 0.6 * n), 0, 1) * 0.85
    save((24, 20, 18), blur(a, 2 * SS), 'scorch', (256, 64))


# ───────── 穿雲槍 ─────────

def streak() -> None:
    """槍芒：極長嘅墨筆直線，頭尖尾散，帶速度絲"""
    W, H = 512 * SS, 48 * SS
    x, y = grid(W, H)
    width = 0.08 + 0.3 * (1 - x) ** 1.5
    core = np.exp(-((y - 0.5) / width) ** 2)
    s = streaks(H, W, 81)
    tip = np.clip((1 - x) * 12, 0, 1)
    a = np.clip(core * (0.45 + 0.55 * s) * tip * np.clip(x * 4, 0.2, 1), 0, 1)
    save(INK, a, 'streak', (512, 48))


def cloud() -> None:
    """雲團：大朵軟邊，底部青灰（淺色宣紙上都睇得到）"""
    W, H = 160 * SS, 112 * SS
    x, y = grid(W, H)
    rng = np.random.default_rng(91)
    a = np.zeros_like(x)
    for _ in range(9):
        cx, cy = rng.uniform(0.22, 0.78), rng.uniform(0.4, 0.6)
        r = rng.uniform(0.2, 0.3)
        a = a + np.exp(-(((x - cx) / r) ** 2 + ((y - cy) / (r * 0.95)) ** 2) * 2.5)
    a = np.clip((a - 0.45) * 1.4, 0, 1)
    a *= np.clip((0.9 - y) * 6, 0, 1)
    n = noise(H, W, 10 * SS, 92)
    col = lerp_rgb((228, 230, 234), (96, 108, 124), np.clip((y - 0.35) * 2, 0, 1) * 0.85 + n * 0.15)
    save(col, blur(a, 1.5 * SS), 'cloud', (160, 112))


def cloud_ring() -> None:
    W = H = 256 * SS
    x, y = grid(W, H)
    r = np.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2)
    ang = np.arctan2(y - 0.5, x - 0.5)
    wob = 0.36 + 0.03 * np.sin(ang * 9) + 0.02 * noise(H, W, 20 * SS, 95)
    ringv = np.exp(-((r - wob) / 0.07) ** 2)
    n = noise(H, W, 12 * SS, 96)
    a = np.clip(ringv * (0.5 + 0.7 * n) - 0.1, 0, 1)
    col = lerp_rgb((210, 214, 220), (100, 110, 125), np.clip((r - wob) * 8 + 0.5, 0, 1))
    save(col, a, 'cloud-ring', (256, 256))


def qi() -> None:
    """聚氣：墨氣旋渦向中心收"""
    W = H = 128 * SS
    x, y = grid(W, H)
    dx, dy = x - 0.5, y - 0.5
    r = np.sqrt(dx ** 2 + dy ** 2)
    ang = np.arctan2(dy, dx)
    swirl = 0.5 + 0.5 * np.sin(ang * 3 + r * 26)
    a = np.clip(swirl * np.exp(-((r - 0.25) / 0.14) ** 2) * 1.2, 0, 1)
    save(INK, blur(a, SS), 'qi', (128, 128))


# ───────── 唐門飛針 ─────────

def needle() -> None:
    W, H = 128 * SS, 12 * SS
    x, y = grid(W, H)
    body = np.exp(-((y - 0.5) / 0.09) ** 2) * np.clip(x * 8, 0, 1) * np.clip((1 - x) * 30, 0, 1)
    tip_glint = np.exp(-(((x - 0.93) / 0.05) ** 2 + ((y - 0.5) / 0.25) ** 2))
    a = np.clip(body + tip_glint * 0.8, 0, 1)
    col = lerp_rgb((70, 76, 84), (235, 240, 245), np.clip(tip_glint * 1.4 + (0.5 - np.abs(y - 0.5)) * 0.3, 0, 1))
    save(col, a, 'needle', (128, 12))


def glint() -> None:
    W = H = 64 * SS
    x, y = grid(W, H)
    dx, dy = x - 0.5, y - 0.5
    r = np.sqrt(dx ** 2 + dy ** 2)
    star = np.exp(-(np.abs(dx) / 0.025)) * np.exp(-(np.abs(dy) / 0.35)) + np.exp(-(np.abs(dy) / 0.025)) * np.exp(-(np.abs(dx) / 0.35))
    diag = np.exp(-(np.abs(dx - dy) / 0.02)) * np.exp(-(r / 0.18)) + np.exp(-(np.abs(dx + dy) / 0.02)) * np.exp(-(r / 0.18))
    a = np.clip(star + diag * 0.6 + np.exp(-(r / 0.06) ** 2), 0, 1)
    save((255, 255, 250), a, 'glint', (64, 64))


def poison() -> None:
    W = H = 192 * SS
    x, y = grid(W, H)
    n = noise(H, W, 18 * SS, 111) * 0.6 + noise(H, W, 6 * SS, 112) * 0.4
    r = np.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2)
    a = np.clip((np.exp(-(r / 0.32) ** 2) * (0.5 + n) - 0.3) * 1.6, 0, 1)
    col = lerp_rgb((40, 70, 44), (88, 120, 70), n)
    save(col, blur(a, 2 * SS), 'poison', (192, 192))


# ───────── 追風腿 ─────────

def wind() -> None:
    """風痕：幾條平行弧線，頭濃尾淡"""
    W, H = 256 * SS, 128 * SS
    m, d = canvas(256, 128)
    for i, (off, wdt) in enumerate([(0.0, 5), (0.12, 3), (0.24, 2), (-0.12, 3)]):
        pts = []
        for k in range(60):
            t = k / 59
            ang = math.pi * (0.85 - 0.7 * t)
            r = (0.42 + off) * W
            pts.append((W * 0.35 + math.cos(ang) * r, H * 1.1 - math.sin(ang) * r * 0.55))
        for k in range(len(pts) - 1):
            wk = max(1, int(wdt * SS * (1 - k / len(pts) * 0.8)))
            d.line([pts[k], pts[k + 1]], fill=int(255 * (1 - k / len(pts) * 0.7)), width=wk)
    a = blur(arr(m), 0.8 * SS)
    save((60, 64, 70), a, 'wind', (256, 128))


def wind_ring() -> None:
    W = H = 256 * SS
    m, d = canvas(256, 256)
    for i in range(5):
        start = i * 72
        r = (0.3 + 0.03 * (i % 2)) * W
        bbox = [W / 2 - r, H / 2 - r, W / 2 + r, H / 2 + r]
        d.arc(bbox, start, start + 50, fill=255, width=int((4 - i % 3) * SS))
    a = blur(arr(m), 1.0 * SS)
    save((55, 60, 66), a, 'wind-ring', (256, 256))


# ───────── 珍瓏棋局 ─────────

def board_shape(W: int, H: int) -> tuple[np.ndarray, np.ndarray]:
    """透視棋盤：梯形，近大遠細；回傳（盤面遮罩, 格線）"""
    m, d = canvas(W // SS, H // SS)
    g, dg = canvas(W // SS, H // SS)
    top_l, top_r, bot_l, bot_r = 0.22, 0.78, 0.02, 0.98
    top_y, bot_y = 0.08, 0.92
    quad = [(top_l * W, top_y * H), (top_r * W, top_y * H), (bot_r * W, bot_y * H), (bot_l * W, bot_y * H)]
    d.polygon(quad, fill=255)
    n = 9
    for i in range(n):
        t = i / (n - 1)
        # 橫線（透視：遠處密）
        ty = top_y + (bot_y - top_y) * (t ** 1.35)
        lx = top_l + (bot_l - top_l) * (t ** 1.35)
        rx = top_r + (bot_r - top_r) * (t ** 1.35)
        dg.line([(lx * W, ty * H), (rx * W, ty * H)], fill=255, width=int(1.6 * SS))
        # 直線
        dg.line([((top_l + (top_r - top_l) * t) * W, top_y * H), ((bot_l + (bot_r - bot_l) * t) * W, bot_y * H)], fill=255, width=int(1.6 * SS))
    return arr(m), arr(g)


def board() -> None:
    W, H = 512 * SS, 192 * SS
    mask, lines = board_shape(W, H)
    n = noise(H, W, 30 * SS, 121)
    a = np.clip(mask * (0.18 + 0.08 * n) + lines * 0.85, 0, 1)
    col = lerp_rgb((150, 120, 80), INK, lines)
    save(col, blur(a, 0.6 * SS), 'board', (512, 192))


def board_glow() -> None:
    W, H = 512 * SS, 192 * SS
    _, lines = board_shape(W, H)
    glow = blur(lines, 4 * SS) * 1.6 + lines
    save((255, 214, 120), np.clip(glow, 0, 1), 'board-glow', (512, 192))


def stone(name: str, base: tuple[int, int, int], hi: tuple[int, int, int], rim: tuple[int, int, int]) -> None:
    W, H = 64 * SS, 44 * SS
    x, y = grid(W, H)
    e = ((x - 0.5) / 0.46) ** 2 + ((y - 0.48) / 0.4) ** 2
    shape = blur((e < 1).astype(np.float32), 0.8 * SS)
    hl = np.exp(-(((x - 0.38) / 0.12) ** 2 + ((y - 0.3) / 0.08) ** 2))
    edge = np.clip(shape - blur(shape, 2.5 * SS), 0, 1) * 2
    col = lerp_rgb(base, hi, hl)
    col = col * (1 - np.clip(edge, 0, 0.8))[..., None] + np.array(rim, np.float32) * np.clip(edge, 0, 0.8)[..., None]
    # 落地影
    shadow = np.exp(-(((x - 0.55) / 0.45) ** 2 + ((y - 0.75) / 0.18) ** 2)) * 0.35
    a = np.maximum(shape, shadow)
    col = np.where((shape < 0.5)[..., None], np.array(INK, np.float32), col)
    save(col, a, name, (64, 44))


def main() -> None:
    wave()
    wave_big()
    droplet()
    crack()
    rock()
    dust()
    rain()
    drop()
    thrust()
    storm()
    lightning()
    spark()
    scorch()
    streak()
    cloud()
    cloud_ring()
    qi()
    needle()
    glint()
    poison()
    wind()
    wind_ring()
    board()
    board_glow()
    stone('stone-black', (24, 24, 26), (150, 150, 158), (8, 8, 8))
    stone('stone-white', (236, 232, 222), (255, 255, 255), (90, 86, 80))


if __name__ == '__main__':
    main()
