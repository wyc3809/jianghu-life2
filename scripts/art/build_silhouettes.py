#!/usr/bin/env python3
"""
江湖一生 · 剪影（C 款：純墨 + 門派色乾筆描邊 + 一筆朱砂）

來源（皆為既有 AI 水墨位圖）：
  public/ink/spar/hero-v3-{sect}-full.webp   門派主角立繪 → 主角剪影
  public/ink/spar/sil/enemy-{name}.webp       切磋敵人剪影 → 敵人剪影（立繪潑墨太多，唔適合直接轉）

輸出 WebP（透明底）至 public/ink/art/sil/：
  hero-{sect}.webp        主角：純墨 + 門派色描邊 + 一筆朱砂（兵器／頭帶位置，見 HERO_ACCENT）
  enemy-{name}.webp       普通敵人：純墨 + 淡墨描邊（無朱砂）
  boss-{name}.webp        首領：純墨 + 朱砂描邊

規則見 design/art/ASSET_INDEX.md「剪影」段；不用 SVG／canvas path。

用法：
  pip install pillow numpy scipy
  python3 scripts/art/build_silhouettes.py [--sheet 輸出總覽.png]
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "ink" / "spar"
OUT = ROOT / "public" / "ink" / "art" / "sil"

OUT_H = 720  # 輸出高度（px）；寬按比例
BOSS_H = 1400  # 首領全屏用
INK = np.array([22, 19, 15]) / 255
CINNABAR = np.array([163, 58, 50]) / 255
INK_WASH = np.array([138, 130, 120]) / 255

# 門派色（低飽和；見 ASSET_INDEX 剪影段）
SECT_RIM: dict[str, str] = {
    "wudang": "#3D5C4F",
    "shaolin": "#8A7355",
    "emei": "#8A93A0",
    "huashan": "#44607A",
    "tangmen": "#4F5B3A",
    "taohua": "#B07A78",
    "qingyun": "#5E7F8C",
    "tiandao": "#5A5650",
    "mojiao": "#5A3E48",
    "wugen": "#8A8278",
}

# 主角朱砂一筆：相對座標（0–1，以輸出圖寬高計）起點→終點，粗幅（相對高度）
# 留空＝自動落喺斗笠帽身底（頭帶位，見 auto_headband）；個別門派要改位就喺度覆寫。
HERO_ACCENT: dict[str, tuple[tuple[float, float], tuple[float, float], float]] = {}


def auto_headband(mask: np.ndarray) -> tuple[tuple[float, float], tuple[float, float], float]:
    """搵斗笠帽簷（頂部 11% 內最闊嘅連續一段；飄帶／手臂會喺更下方），朱砂落喺帽簷下頭帶位。"""
    h, w = mask.shape
    solid = mask > 0.5
    top = int(np.argmax(solid.any(axis=1)))

    def run_width(row: np.ndarray) -> tuple[int, int, int]:
        """最長連續實心段（避開分離嘅飄帶碎片）。"""
        lab, n = ndimage.label(row)
        if n == 0:
            return 0, 0, 0
        sizes = ndimage.sum(row, lab, range(1, n + 1))
        k = int(np.argmax(sizes)) + 1
        idx = np.nonzero(lab == k)[0]
        return int(sizes[k - 1]), int(idx.min()), int(idx.max())

    rows = range(top, top + int(h * 0.11))
    brim = max(rows, key=lambda r: run_width(solid[r])[0])
    _, left, right = run_width(solid[brim])
    cx = (left + right) / 2
    half = (right - left) * 0.16
    y = brim + h * 0.016
    return ((cx - half) / w, y / h), ((cx + half) / w, (y + h * 0.004) / h), 0.0085


# 敵人：只出輪廓清楚、互不重複嘅 5 款（與 src/ui/inkSilhouettes.ts FOE_SILHOUETTE_KEYS 同步）。
# laoweng／qiangke／qigai／suoyi 來源有墨霧雜點；chifa＝toutuo、shadow＝tiemian 重複。
ENEMY_KEYS = ["daoke", "gouke", "nvcike", "toutuo", "tiemian"]


def hex_rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)]) / 255


def load_mask(path: Path, cut: float = 0.18, out_h: int = OUT_H) -> np.ndarray:
    """讀位圖 → 實心剪影遮罩（0..1）：補淺色部位造成的洞、平滑邊。cut＝alpha 門檻（剔淡霧）。"""
    im = Image.open(path).convert("RGBA")
    scale = out_h / im.height
    im = im.resize((max(1, round(im.width * scale)), out_h), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255
    alpha = a[..., 3]
    solid = alpha > cut
    # 淺色衣袖／手：先閉運算接駁，再補內洞
    solid = ndimage.binary_closing(solid, structure=np.ones((5, 5)), iterations=2)
    solid = ndimage.binary_fill_holes(solid)
    # 去零碎噪點，但保留飛白碎邊（細塊 < 30px 才刪）
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.nonzero(sizes >= 30 * max(1.0, scale) ** 2 * 4)[0])
        solid = keep
    # 放大來源會出現像素階梯：按放大倍數先模糊再二值化，磨圓輪廓（保留大形同飛白碎邊）
    sigma = max(0.8, 1.2 * scale)
    solid = ndimage.gaussian_filter(solid.astype(float), sigma) > 0.5
    # 反鋸齒邊
    return np.clip(ndimage.gaussian_filter(solid.astype(float), 0.9), 0, 1)


def dry_noise(shape: tuple[int, int], seed: int) -> np.ndarray:
    """乾筆斷續感（0..1）：沿邊的低頻雜訊。"""
    rng = np.random.default_rng(seed)
    n = rng.random((shape[0] // 6 + 2, shape[1] // 6 + 2))
    n = ndimage.zoom(n, 6, order=3)[: shape[0], : shape[1]]
    return np.clip((n - 0.25) * 1.8, 0, 1)


def rim_of(mask: np.ndarray, width: int, seed: int) -> np.ndarray:
    """外緣描邊帶（在剪影外側）：膨脹 − 原形，乘乾筆斷續。"""
    solid = mask > 0.5
    outer = ndimage.binary_dilation(solid, iterations=width)
    band = ndimage.gaussian_filter((outer & ~solid).astype(float), 0.7)
    return np.clip(band * (0.55 + 0.45 * dry_noise(mask.shape, seed)), 0, 1)


def compose(mask: np.ndarray, rim: np.ndarray, rim_rgb: np.ndarray, accent: np.ndarray | None = None) -> Image.Image:
    alpha = np.clip(np.maximum(mask, rim), 0, 1)
    rgb = np.broadcast_to(INK, mask.shape + (3,)).copy()
    # 描邊只在剪影外側著色
    w_rim = np.where(mask > 0.5, 0, rim / np.maximum(alpha, 1e-6))[..., None]
    rgb = rgb * (1 - w_rim) + rim_rgb * w_rim
    if accent is not None:
        rgb = rgb * (1 - accent[..., None]) + CINNABAR * accent[..., None]
    out = np.dstack([rgb, alpha])
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGBA")


def accent_stroke(mask: np.ndarray, spec, seed: int) -> np.ndarray:
    """一筆朱砂：起→終的毛筆短劃，裁在剪影內。"""
    (x0, y0), (x1, y1), thick = spec
    h, w = mask.shape
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(seed)
    n = 40
    for i in range(n):
        t = i / (n - 1)
        x = (x0 + (x1 - x0) * t) * w
        y = (y0 + (y1 - y0) * t) * h
        r = thick * h * (0.55 + 0.45 * np.sin(np.pi * min(1, t * 1.2))) * rng.uniform(0.85, 1.1)
        d.ellipse((x - r, y - r, x + r, y + r), fill=235)
    a = np.asarray(img).astype(float) / 255
    a = ndimage.gaussian_filter(a, 0.8) * (0.75 + 0.25 * dry_noise(mask.shape, seed + 7))
    return np.clip(a, 0, 1) * (mask > 0.5)


def save(img: Image.Image, name: str) -> Image.Image:
    OUT.mkdir(parents=True, exist_ok=True)
    bbox = img.getbbox()
    if bbox:
        pad = 6
        img = img.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(img.width, bbox[2] + pad), min(img.height, bbox[3] + pad)))
    p = OUT / name
    img.save(p, "WEBP", quality=88, method=6)
    print(f"  {p.relative_to(ROOT)}  {img.width}x{img.height}  {p.stat().st_size // 1024}KB")
    return img


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", help="另存總覽圖（PNG）")
    ap.add_argument("--font", help="總覽圖標籤用 CJK 字型（可選）")
    args = ap.parse_args()

    sheet_items: list[tuple[str, Image.Image]] = []
    print("heroes")
    for i, (sect, rim_hex) in enumerate(SECT_RIM.items()):
        src = SRC / f"hero-v3-{sect}-full.webp"
        mask = load_mask(src)
        rim = rim_of(mask, 5, 100 + i)
        spec = HERO_ACCENT.get(sect) or auto_headband(mask)
        acc = accent_stroke(mask, spec, 200 + i)
        sheet_items.append((f"主角·{sect}", save(compose(mask, rim, hex_rgb(rim_hex), acc), f"hero-{sect}.webp")))

    print("enemies")
    for j, name in enumerate(ENEMY_KEYS):
        src = SRC / "sil" / f"enemy-{name}.webp"
        # 用切磋剪影底（輪廓清）；部分檔四周有淡霧，提高門檻只留實墨
        mask = load_mask(src, cut=0.6)
        sheet_items.append((f"敵·{name}", save(compose(mask, rim_of(mask, 5, 300 + j), INK_WASH), f"enemy-{name}.webp")))
        # 首領會放到成個畫面咁大：高解像度（1400px）另出
        bmask = load_mask(src, cut=0.6, out_h=BOSS_H)
        boss = save(compose(bmask, rim_of(bmask, 11, 400 + j), CINNABAR), f"boss-{name}.webp")
        if name in ("daoke", "toutuo"):
            sheet_items.append((f"首領·{name}", boss))

    if args.sheet:
        cols, cw, ch = 6, 200, 300
        rows = (len(sheet_items) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * cw, rows * (ch + 30)), (243, 235, 220, 255))
        d = ImageDraw.Draw(sheet)
        font = ImageFont.truetype(args.font, 18) if args.font else None
        for k, (label, im) in enumerate(sheet_items):
            t = im.copy()
            t.thumbnail((cw - 16, ch - 10))
            x, y = (k % cols) * cw, (k // cols) * (ch + 30)
            sheet.alpha_composite(t, (x + (cw - t.width) // 2, y + ch - t.height))
            d.text((x + 8, y + ch + 4), label, fill=(26, 26, 26, 255), font=font)
        sheet.convert("RGB").save(args.sheet)
        print(f"sheet → {args.sheet}")


if __name__ == "__main__":
    main()
