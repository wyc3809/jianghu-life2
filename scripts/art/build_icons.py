#!/usr/bin/env python3
"""
江湖一生 · 列表小圖示（由 AI 物象圖裁出）

來源：public/ink/ai/motifs/motif-*.webp（640×601，物象只佔中下方一小部分，四周大片紙色）
輸出：public/ink/art/icons/motif-*.webp（160×160，物象置中撐滿，紙色轉透明）

做法：以四角中位數估紙色 → 與紙色差距作 alpha（柔邊）→ 按物象外框裁正方形、留 9% 邊。
用法：pip install pillow numpy && python3 scripts/art/build_icons.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "ink" / "ai" / "motifs"
OUT = ROOT / "public" / "ink" / "art" / "icons"
SIZE = 160


def build(path: Path) -> None:
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(float)
    corners = np.concatenate([a[:10, :10], a[:10, -10:], a[-10:, :10], a[-10:, -10:]]).reshape(-1, 3)
    paper = np.median(corners, axis=0)
    dist = np.abs(a - paper).sum(axis=2)
    # 差距 25 以下當紙（透明），110 以上全不透明，中間柔邊
    alpha = np.clip((dist - 25) / 85, 0, 1)
    ys, xs = np.nonzero(alpha > 0.5)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    half = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 * 1.09
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    pad = int(half) + 4
    big = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    big.paste(img, (pad, pad))
    box = (int(cx - half) + pad, int(cy - half) + pad, int(cx + half) + pad, int(cy + half) + pad)
    out = big.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / path.name
    out.save(dst, "WEBP", quality=88, method=6)
    print(f"  {dst.relative_to(ROOT)}  {dst.stat().st_size // 1024}KB")


def main() -> None:
    for p in sorted(SRC.glob("motif-*.webp")):
        build(p)


if __name__ == "__main__":
    main()
