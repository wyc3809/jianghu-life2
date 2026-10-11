#!/usr/bin/env python3
"""
江湖一生 · 環境特效粒子位圖（唔用 SVG；.claude/rules/no-svg-game-art.md）

輸出 public/ink/art/fx/：
  petal.webp     春：桃花瓣（64×64）
  rain.webp      夏：雨絲（64×64，直條喺中間）
  leaf.webp      秋：落葉（64×64）
  snow.webp      冬：雪花（白芯＋淡灰邊，淺色場景都睇得到；64×64）
  mist.webp      遠山流雲／霧帶（512×128，左右可平鋪）
  ink-dot.webp   墨點（64×64）
  ink-bloom.webp 墨暈開（128×128）
  ink-splash.webp 點擊濺墨（128×128）
用法：python3 scripts/art/build_ink_fx.py（固定種子，可重跑；AI 圖可以同名同尺寸替換）
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'ink' / 'art' / 'fx'
SS = 4


def save(rgb: tuple[int, int, int], alpha: np.ndarray, name: str, size: tuple[int, int]) -> None:
    h, w = alpha.shape
    a = np.clip(alpha, 0, 1)
    img = np.dstack([np.full((h, w), c, np.uint8) for c in rgb] + [(a * 255).astype(np.uint8)])
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(img, 'RGBA').resize(size, Image.LANCZOS).save(OUT / name, 'WEBP', quality=90, method=6)
    print(f'  {(OUT / name).relative_to(ROOT)}  {(OUT / name).stat().st_size // 1024}KB')


def save_rgba(arr: np.ndarray, name: str, size: tuple[int, int]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS).save(
        OUT / name, 'WEBP', quality=90, method=6)
    print(f'  {(OUT / name).relative_to(ROOT)}  {(OUT / name).stat().st_size // 1024}KB')


def noise(h: int, w: int, cell: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    small = rng.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((w + 3 * cell, h + 3 * cell), Image.BICUBIC)
    return np.asarray(img).astype(np.float32)[:h, :w] / 255


def radial(n: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    yy, xx = (np.mgrid[0:n, 0:n] + 0.5) / n * 2 - 1
    return xx, yy, np.sqrt(xx ** 2 + yy ** 2)


def blur(a: np.ndarray, r: float) -> np.ndarray:
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def petal() -> None:
    n = 64 * SS
    xx, yy, _ = radial(n)
    # 心形瓣：上闊下尖，頂有缺口
    body = ((xx / 0.62) ** 2 + ((yy + 0.05) / 0.85) ** 2) < 1
    body &= ~(((xx / 0.16) ** 2 + ((yy + 0.95) / 0.3) ** 2) < 1)
    a = blur(body.astype(np.float32), 1.5 * SS)
    t = np.clip((yy + 1) / 2, 0, 1)
    rgb = np.dstack([np.full_like(t, 242) - t * 10, 178 + t * 50, 190 + t * 40])
    save_rgba(np.dstack([rgb, a * 235]), 'petal.webp', (64, 64))


def leaf() -> None:
    n = 64 * SS
    xx, yy, _ = radial(n)
    body = ((xx / 0.42) ** 2 + (yy / 0.92) ** 2) < 1
    a = blur(body.astype(np.float32), 1.2 * SS)
    vein = np.exp(-(xx / 0.03) ** 2) * (np.abs(yy) < 0.85)
    nz = noise(n, n, 10 * SS, 3)
    r = 196 - nz * 40 - vein * 60
    g = 112 - nz * 30 - vein * 40
    b = 48 - vein * 20
    save_rgba(np.dstack([r, g, b, a * 240]), 'leaf.webp', (64, 64))


def periodic_noise(h: int, w: int, gx: int, gy: int, seed: int) -> np.ndarray:
    """左右循環嘅雜訊：細格左右各補一份再放大，取中間一段"""
    rng = np.random.default_rng(seed)
    small = rng.random((gy, gx)).astype(np.float32)
    tiled = np.tile(small, (1, 3))
    big = Image.fromarray((tiled * 255).astype(np.uint8)).resize((w * 3, h), Image.BICUBIC)
    return np.asarray(big).astype(np.float32)[:, w:2 * w] / 255


def snow() -> None:
    n = 64 * SS
    _, _, d = radial(n)
    core = np.exp(-(d / 0.42) ** 2)
    halo = np.exp(-((d - 0.5) / 0.16) ** 2) * 0.55
    a = np.clip(core + halo, 0, 1)
    shade = np.clip(halo / (core + halo + 1e-6), 0, 1)
    rgb = np.dstack([255 - shade * 120, 255 - shade * 112, 255 - shade * 96])
    save_rgba(np.dstack([rgb, a * 255]), 'snow.webp', (64, 64))


def rain() -> None:
    n = 64 * SS
    xx, yy, _ = radial(n)
    streak = np.exp(-(xx / 0.05) ** 2) * np.clip(1 - np.abs(yy) ** 2, 0, 1)
    t = np.clip((yy + 1) / 2, 0, 1)
    save((70, 82, 98), streak * (0.35 + 0.65 * t), 'rain.webp', (64, 64))


def mist() -> None:
    w, h = 512 * 2, 128 * 2
    # 橫向拉長嘅雲絲：粗＋細兩層
    nz = periodic_noise(h, w, 6, 5, 7) * 0.6 + periodic_noise(h, w, 14, 9, 8) * 0.4
    yy = np.linspace(-1, 1, h)[:, None]
    band = np.exp(-(yy / 0.55) ** 2)
    a = np.clip((nz - 0.35) * 2.4, 0, 1) * band
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    save((250, 248, 242), a, 'mist.webp', (512, 128))


def ink_dot() -> None:
    n = 64 * SS
    xx, yy, d = radial(n)
    nz = noise(n, n, 6 * SS, 11)
    a = np.clip((0.62 + nz * 0.25 - d) * 4, 0, 1)
    a = blur(a, 2 * SS)
    save((24, 22, 20), a, 'ink-dot.webp', (64, 64))


def ink_bloom() -> None:
    n = 128 * SS
    xx, yy, d = radial(n)
    ang = np.arctan2(yy, xx)
    nz = noise(n, n, 8 * SS, 21)
    edge = 0.78 + 0.08 * np.sin(ang * 7 + 1.3) + nz * 0.12
    inside = np.clip((edge - d) * 6, 0, 1)
    # 濕墨：邊深、中間淡
    rim = np.exp(-((d - edge + 0.04) / 0.07) ** 2)
    a = blur(inside * (0.28 + nz * 0.15) + rim * 0.55 * inside, 1.5 * SS)
    save((22, 20, 18), a, 'ink-bloom.webp', (128, 128))


def ink_splash() -> None:
    n = 128 * SS
    m = Image.new('L', (n, n), 0)
    d = ImageDraw.Draw(m)
    rng = np.random.default_rng(31)
    c = n / 2
    r0 = n * 0.16
    d.ellipse([c - r0, c - r0, c + r0, c + r0], fill=255)
    for i in range(14):
        ang = i / 14 * math.tau + rng.uniform(-0.2, 0.2)
        L = n * rng.uniform(0.22, 0.44)
        wdt = n * rng.uniform(0.02, 0.05)
        x1, y1 = c + math.cos(ang) * L, c + math.sin(ang) * L
        d.line([(c, c), (x1, y1)], fill=255, width=int(wdt))
        rr = wdt * rng.uniform(0.7, 1.3)
        d.ellipse([x1 - rr, y1 - rr, x1 + rr, y1 + rr], fill=255)
    for _ in range(26):
        ang = rng.uniform(0, math.tau)
        L = n * rng.uniform(0.3, 0.48)
        rr = n * rng.uniform(0.006, 0.02)
        x, y = c + math.cos(ang) * L, c + math.sin(ang) * L
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=255)
    a = blur(np.asarray(m).astype(np.float32) / 255, 1.2 * SS)
    save((20, 18, 16), np.clip(a * 1.3, 0, 1), 'ink-splash.webp', (128, 128))


def main() -> None:
    petal()
    leaf()
    rain()
    snow()
    mist()
    ink_dot()
    ink_bloom()
    ink_splash()


if __name__ == '__main__':
    main()
