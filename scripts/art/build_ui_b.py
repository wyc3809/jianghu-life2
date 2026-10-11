#!/usr/bin/env python3
"""
江湖一生 · 美術方向 B UI kit（古風寫實，參考《九陰真經 Online》；design/art/art-direction-b.md）

全部位圖（唔用 SVG），用 CSS border-image 九宮格拉伸：
  panel.webp       深漆木面板＋古銅雲紋角花＋金細線（512×512，切 96）
  scroll.webp      舊紙卷軸面板（512×512，切 72）
  btn-cinnabar.webp／btn-jade.webp／btn-wood.webp  漆面按鈕＋古銅邊（480×128，左右切 56）
  plaque.webp      標題牌（橫匾，640×128，左右切 96）
  wood-grain.webp  可平鋪漆木紋（256×256）
  scroll-ink.webp  水墨版卷軸：宣紙＋墨色木軸＋朱紅軸頭（512×512，切 72）
  panel-ink.webp   水墨版面板：宣紙底＋墨色雲紋角花＋墨細線（512×512，切 160）
輸出：public/ink/art/ui-b/
用法：python3 scripts/art/build_ui_b.py
AI 生成嘅替換圖可以同名同尺寸放入。
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'ink' / 'art' / 'ui-b'
SS = 2  # 先畫大一倍再縮細，邊緣更順

LACQUER = np.array([30, 24, 20], np.float32)
LACQUER_HI = np.array([58, 44, 34], np.float32)
BRONZE_DK = np.array([92, 64, 28], np.float32)
BRONZE = np.array([184, 145, 62], np.float32)
BRONZE_HI = np.array([240, 214, 140], np.float32)
PARCH = np.array([233, 223, 200], np.float32)
PARCH_DK = np.array([196, 178, 142], np.float32)
CINNABAR = np.array([168, 52, 42], np.float32)
CINNABAR_DK = np.array([96, 26, 20], np.float32)
JADE = np.array([63, 102, 112], np.float32)
JADE_DK = np.array([28, 50, 58], np.float32)
WOOD = np.array([90, 67, 52], np.float32)
WOOD_DK = np.array([46, 34, 26], np.float32)
# 水墨版（玩家 2026-10-10：方向 B 太深色，轉水墨風）
RICE = np.array([247, 242, 230], np.float32)
RICE_DK = np.array([228, 218, 196], np.float32)
INK = np.array([40, 38, 36], np.float32)
INK_DK = np.array([10, 10, 10], np.float32)
INK_HI = np.array([120, 116, 108], np.float32)


# ───────── 工具 ─────────

def noise(h: int, w: int, cell: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    small = rng.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((w + 3 * cell, h + 3 * cell), Image.BICUBIC)
    return np.asarray(img).astype(np.float32)[:h, :w] / 255


def grain(h: int, w: int, seed: int) -> np.ndarray:
    """木紋：橫向拉長嘅雜訊＋細紋"""
    rng = np.random.default_rng(seed)
    small = rng.random((h // 6 + 3, w // 90 + 3)).astype(np.float32)
    g = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
    fine = noise(h, w, 3, seed + 1)
    rings = 0.5 + 0.5 * np.sin((np.arange(h)[:, None] / h * 60 + g * 9) * math.pi)
    return np.clip(0.55 * g + 0.25 * rings + 0.2 * fine, 0, 1)


def lerp(a: np.ndarray, b: np.ndarray, t: np.ndarray) -> np.ndarray:
    return a + (b - a) * t[..., None]


def mask(size: tuple[int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    m = Image.new('L', size, 0)
    return m, ImageDraw.Draw(m)


def arr(m: Image.Image) -> np.ndarray:
    return np.asarray(m).astype(np.float32) / 255


def metal(m: np.ndarray, base: np.ndarray, dark: np.ndarray, hi: np.ndarray, light_dir=(-1, -1)) -> np.ndarray:
    """金屬質感：模糊後嘅高度做斜面光，左上亮右下暗，再加邊緣暗線"""
    h, w = m.shape
    blur = arr(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3 * SS)))
    gy, gx = np.gradient(blur)
    shade = -(gx * light_dir[0] + gy * light_dir[1]) * 6 * SS
    shade = np.clip(shade, -1, 1)
    col = np.where(shade[..., None] > 0, lerp(base, hi, np.clip(shade, 0, 1)), lerp(base, dark, np.clip(-shade, 0, 1)))
    # 由上至下輕微變暗
    yy = (np.arange(h) / h)[:, None]
    col = col * (1.05 - 0.15 * yy)[..., None]
    # 邊緣暗線
    edge = np.clip((blur - 0.15) * 3, 0, 1) * (1 - np.clip((blur - 0.6) * 3, 0, 1))
    col = lerp(col, dark * 0.6, edge * 0.5)
    return np.clip(col, 0, 255)


def compose(layers: list[tuple[np.ndarray, np.ndarray]], size: tuple[int, int]) -> Image.Image:
    """layers：[(rgb, alpha)] 由底到面"""
    h, w = size[1], size[0]
    out = np.zeros((h, w, 3), np.float32)
    a = np.zeros((h, w), np.float32)
    for rgb, al in layers:
        out = out * (1 - al[..., None]) + rgb * al[..., None]
        a = a + al * (1 - a)
    rgba = np.dstack([out, a * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def save(img: Image.Image, name: str, size: tuple[int, int]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    img.resize(size, Image.LANCZOS).save(OUT / name, 'WEBP', quality=90, method=6)
    print(f'  {OUT.relative_to(ROOT) / name}  {(OUT / name).stat().st_size // 1024}KB')


# ───────── 角花：古銅如意雲紋 ─────────

def corner_mask(size: int) -> Image.Image:
    """左上角花（其他角翻轉）：L 形邊條＋角位如意雲頭＋捲尾"""
    m, d = mask((size, size))
    t = size * 0.075  # 邊條粗
    L = size * 0.92
    d.rounded_rectangle([0, 0, L, t], radius=t / 2, fill=255)
    d.rounded_rectangle([0, 0, t, L], radius=t / 2, fill=255)
    # 如意雲頭（三瓣）
    c = size * 0.2
    r = size * 0.16
    for ox, oy in ((0, 0), (r * 0.95, -r * 0.15), (-r * 0.15, r * 0.95)):
        d.ellipse([c + ox - r, c + oy - r, c + ox + r, c + oy + r], fill=255)
    # 邊條尾端捲雲
    for (x, y) in ((L, t / 2), (t / 2, L)):
        rr = t * 1.4
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=255)
    # 挖空：雲頭中間螺旋
    cut, dc = mask((size, size))
    pts = [(c + r * 0.35 + math.cos(a) * (r * 0.62 - a * r * 0.06), c + r * 0.35 + math.sin(a) * (r * 0.62 - a * r * 0.06)) for a in np.linspace(0, 6.5, 80)]
    dc.line(pts, fill=255, width=int(t * 0.55))
    for (x, y) in ((L, t / 2), (t / 2, L)):
        dc.ellipse([x - t * 0.55, y - t * 0.55, x + t * 0.55, y + t * 0.55], fill=255)
    m = Image.fromarray(np.clip(arr(m) - arr(cut), 0, 1).__mul__(255).astype(np.uint8))
    return m.filter(ImageFilter.GaussianBlur(0.8 * SS))


# ───────── 面板 ─────────

def build_panel(name: str = 'panel.webp', ink: bool = False) -> None:
    S = 512 * SS
    yy, xx = np.mgrid[0:S, 0:S] / S
    if ink:
        # 宣紙：纖維雜訊＋邊緣微黃
        n = noise(S, S, 14 * SS, 5) * 0.5 + noise(S, S, 2 * SS, 6) * 0.5
        base = lerp(RICE, RICE_DK, n * 0.35)
        vig = np.clip(1 - ((xx - 0.5) ** 2 + (yy - 0.5) ** 2) * 0.5, 0.88, 1)
        line_c, corner_c = (INK, INK_DK, INK_HI), (INK, INK_DK, INK_HI)
    else:
        g = grain(S, S, 3)
        base = lerp(LACQUER, LACQUER_HI, g * 0.55)
        # 暗角＋內凹
        vig = np.clip(1 - ((xx - 0.5) ** 2 + (yy - 0.5) ** 2) * 1.6, 0.55, 1)
        line_c, corner_c = (BRONZE, BRONZE_DK, BRONZE_HI), (BRONZE, BRONZE_DK, BRONZE_HI)
    base = base * vig[..., None]
    body, dbody = mask((S, S))
    inset = 6 * SS
    dbody.rounded_rectangle([inset, inset, S - inset, S - inset], radius=14 * SS, fill=255)
    body_a = arr(body.filter(ImageFilter.GaussianBlur(1)))
    # 內斜面：上邊亮、下邊暗
    bevel = np.zeros((S, S), np.float32)
    bw = 10 * SS
    top = np.clip(1 - (yy * S - inset) / bw, 0, 1)
    left = np.clip(1 - (xx * S - inset) / bw, 0, 1)
    bot = np.clip(1 - (S - inset - yy * S) / bw, 0, 1)
    right = np.clip(1 - (S - inset - xx * S) / bw, 0, 1)
    bevel = np.maximum(top, left) * 0.5 - np.maximum(bot, right) * 0.6
    base = np.clip(base + bevel[..., None] * (14 if ink else 60), 0, 255)
    layers = [(base, body_a)]
    # 金細線（兩條）
    for off, wdt in ((22 * SS, 2.2 * SS), (32 * SS, 1.2 * SS)):
        lm, dl = mask((S, S))
        dl.rounded_rectangle([off, off, S - off, S - off], radius=8 * SS, outline=255, width=int(wdt))
        la = arr(lm.filter(ImageFilter.GaussianBlur(0.6)))
        layers.append((metal(la, *line_c), la * (0.8 if ink else 0.95)))
    # 四角角花
    cs = int(150 * SS)
    cm = corner_mask(cs)
    full = Image.new('L', (S, S), 0)
    off = int(10 * SS)
    for flip_x in (False, True):
        for flip_y in (False, True):
            c = cm
            if flip_x:
                c = c.transpose(Image.FLIP_LEFT_RIGHT)
            if flip_y:
                c = c.transpose(Image.FLIP_TOP_BOTTOM)
            x = S - cs - off if flip_x else off
            y = S - cs - off if flip_y else off
            full.paste(c, (x, y), c)
    ca = arr(full)
    # 角花陰影
    sh = arr(full.filter(ImageFilter.GaussianBlur(4 * SS)))
    sh = np.roll(np.roll(sh, 3 * SS, 0), 3 * SS, 1)
    layers.append((np.zeros((S, S, 3)) + 5, sh * (0.18 if ink else 0.6)))
    layers.append((metal(ca, *corner_c), ca))
    save(compose(layers, (S, S)), name, (512, 512))


# ───────── 卷軸（舊紙） ─────────

def build_scroll(name: str = 'scroll.webp', ink: bool = False) -> None:
    S = 512 * SS
    n = noise(S, S, 18 * SS, 9) * 0.6 + noise(S, S, 4 * SS, 10) * 0.4
    paper, paper_dk = (RICE, RICE_DK) if ink else (PARCH, PARCH_DK)
    base = lerp(paper, paper_dk, n * (0.4 if ink else 0.55))
    yy, xx = np.mgrid[0:S, 0:S] / S
    edge = np.clip(np.minimum(np.minimum(xx, 1 - xx), np.minimum(yy, 1 - yy)) * 10, 0, 1)
    base = lerp(paper_dk * (0.95 if ink else 0.85), base, edge)
    rod = (INK, INK_DK, INK_HI) if ink else (WOOD, WOOD_DK, np.array([160, 120, 90], np.float32))
    cap = (np.array([150, 52, 40], np.float32), CINNABAR_DK, np.array([220, 120, 100], np.float32)) if ink else (BRONZE, BRONZE_DK, BRONZE_HI)
    body, d = mask((S, S))
    d.rectangle([8 * SS, 30 * SS, S - 8 * SS, S - 30 * SS], fill=255)
    layers = [(base, arr(body.filter(ImageFilter.GaussianBlur(1.5 * SS))))]
    # 上下木軸
    for y0 in (6 * SS, S - 42 * SS):
        rm, dr = mask((S, S))
        dr.rounded_rectangle([0, y0, S, y0 + 36 * SS], radius=18 * SS, fill=255)
        ra = arr(rm)
        wood = metal(ra, *rod, light_dir=(0, -1))
        layers.append((wood, ra))
        # 軸頭古銅
        for x0 in (0, S - 34 * SS):
            km, dk = mask((S, S))
            dk.rounded_rectangle([x0, y0 - 2 * SS, x0 + 34 * SS, y0 + 38 * SS], radius=10 * SS, fill=255)
            ka = arr(km)
            layers.append((metal(ka, *cap), ka))
    save(compose(layers, (S, S)), name, (512, 512))


# ───────── 按鈕 ─────────

def build_button(name: str, col: np.ndarray, dark: np.ndarray) -> None:
    W, H = 480 * SS, 128 * SS
    yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
    # 漆面：上亮下暗＋上半光澤
    lac = lerp(col * 1.15, dark, np.clip(yy * 1.1, 0, 1))
    gloss = np.clip(1 - np.abs(yy - 0.22) * 6, 0, 1) * 0.35
    lac = np.clip(lac + gloss[..., None] * 120, 0, 255)
    g = grain(H, W, 21)
    lac = lac * (0.92 + 0.12 * g)[..., None]
    body, d = mask((W, H))
    pad = 10 * SS
    # 兩端菱形尖角
    pts = [(pad + 30 * SS, pad), (W - pad - 30 * SS, pad), (W - pad, H / 2), (W - pad - 30 * SS, H - pad), (pad + 30 * SS, H - pad), (pad, H / 2)]
    d.polygon(pts, fill=255)
    ba = arr(body.filter(ImageFilter.GaussianBlur(1)))
    # 古銅邊：外框描一圈
    rim, dr = mask((W, H))
    dr.polygon(pts, outline=255)
    dr.line(pts + [pts[0]], fill=255, width=int(7 * SS), joint='curve')
    ra = arr(rim.filter(ImageFilter.GaussianBlur(0.8 * SS)))
    # 內細金線
    il, di = mask((W, H))
    k = 9 * SS
    ipts = [(pad + 30 * SS + 4, pad + k), (W - pad - 30 * SS - 4, pad + k), (W - pad - k * 1.6, H / 2), (W - pad - 30 * SS - 4, H - pad - k), (pad + 30 * SS + 4, H - pad - k), (pad + k * 1.6, H / 2)]
    di.line(ipts + [ipts[0]], fill=255, width=int(1.6 * SS))
    ia = arr(il) * ba
    # 陰影
    sh = np.roll(arr(body.filter(ImageFilter.GaussianBlur(5 * SS))), 4 * SS, 0)
    layers = [
        (np.zeros((H, W, 3)) + 8, sh * 0.55),
        (lac, ba),
        (metal(ia, BRONZE, BRONZE_DK, BRONZE_HI), ia * 0.8),
        (metal(ra, BRONZE, BRONZE_DK, BRONZE_HI), ra),
    ]
    save(compose(layers, (W, H)), name, (480, 128))


# ───────── 橫匾 ─────────

def build_plaque() -> None:
    W, H = 640 * SS, 128 * SS
    g = grain(H, W, 31)
    base = lerp(LACQUER, LACQUER_HI, g * 0.6)
    body, d = mask((W, H))
    d.rounded_rectangle([40 * SS, 14 * SS, W - 40 * SS, H - 14 * SS], radius=10 * SS, fill=255)
    ba = arr(body.filter(ImageFilter.GaussianBlur(1)))
    rim, dr = mask((W, H))
    dr.rounded_rectangle([40 * SS, 14 * SS, W - 40 * SS, H - 14 * SS], radius=10 * SS, outline=255, width=int(6 * SS))
    dr.rounded_rectangle([54 * SS, 26 * SS, W - 54 * SS, H - 26 * SS], radius=6 * SS, outline=255, width=int(1.6 * SS))
    ra = arr(rim.filter(ImageFilter.GaussianBlur(0.6 * SS)))
    # 兩端雲紋耳
    ear, de = mask((W, H))
    for cx in (40 * SS, W - 40 * SS):
        for oy in (-22, 0, 22):
            r = 20 * SS if oy == 0 else 14 * SS
            de.ellipse([cx - r, H / 2 + oy * SS - r, cx + r, H / 2 + oy * SS + r], fill=255)
    ea = arr(ear.filter(ImageFilter.GaussianBlur(0.8 * SS)))
    sh = np.roll(arr(body.filter(ImageFilter.GaussianBlur(5 * SS))), 4 * SS, 0)
    layers = [
        (np.zeros((H, W, 3)) + 6, sh * 0.5),
        (base, ba),
        (metal(ea, BRONZE, BRONZE_DK, BRONZE_HI), ea),
        (metal(ra, BRONZE, BRONZE_DK, BRONZE_HI), ra),
    ]
    save(compose(layers, (W, H)), 'plaque.webp', (640, 128))


def build_wood_tile() -> None:
    S = 256 * SS
    g = grain(S, S, 41)
    # 平鋪：左右、上下鏡像融合
    g = (g + g[:, ::-1]) / 2
    g = (g + g[::-1, :]) / 2
    base = lerp(LACQUER, LACQUER_HI, g * 0.6)
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), 'RGB')
    OUT.mkdir(parents=True, exist_ok=True)
    img.resize((256, 256), Image.LANCZOS).save(OUT / 'wood-grain.webp', 'WEBP', quality=86, method=6)
    print(f"  {OUT.relative_to(ROOT) / 'wood-grain.webp'}")


def main() -> None:
    build_panel()
    build_panel('panel-ink.webp', ink=True)
    build_scroll()
    build_scroll('scroll-ink.webp', ink=True)
    build_button('btn-cinnabar.webp', CINNABAR, CINNABAR_DK)
    build_button('btn-jade.webp', JADE, JADE_DK)
    build_button('btn-wood.webp', WOOD, WOOD_DK)
    build_plaque()
    build_wood_tile()


if __name__ == '__main__':
    main()
