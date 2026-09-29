#!/usr/bin/env python3
"""
江湖一生 · 演武台 v4 佔位素材產生器（2D 點陣分層逐格 WebP，宣紙淡彩＋濃墨乾筆描邊）

輸出至 public/ink/spar/v4/：

  hero/{clip}.{layer}.webp     主角動作條圖（每格 480×600，橫排）
                               layer：back（披風、雙腿、後袖邊、後手）
                                      robe（灰階袍，執行時按門派染色）
                                      front（袍邊、腰帶、斗笠、垂紗）
                                      armor（護肩、護胸）  acc（玉佩）  hand（前手，蓋住兵器柄）
  enemy/t{1-6}/{clip}.webp     敵人（按境界 1–6）動作條圖；boss/t{1-6}/{clip}.webp 頭目
  weapon/{kind}.webp           兵器（橫向，劍尖向右，握點見 anchors）
  fx/slash-{style}.webp        墨痕刀光（arc／heavy／thrust／round／fist／ultimate）
  fx/drop-{season}.webp        季節飄落物（petal／firefly／leaf／snow）
  bg/{place}-{far,mid,near}.webp  背景三層（可左右無縫平鋪）

同時寫 data/spar/anchors.generated.json：每格手位、兵器角度（弧度，0＝向右，順時針正）、
敵人紅眼位、兵器握點。設計座標係 320×400 格（腳底錨點喺 anchors.cell.foot），圖像像素＝設計 × scale。

用法：python3 scripts/art/build_spar_v4.py        （全部，約 5 分鐘）
      python3 scripts/art/build_spar_v4.py fx bg  （只重出刀光、飄落物、背景；唔改錨點）
固定種子，重跑結果一致。AI 真圖可同名同尺寸替換；如果姿勢唔同，要一齊改 anchors 入面嘅手位同角度。
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_ink_ui import brush_stroke, value_noise_2d  # noqa: E402

OUT = ROOT / "public" / "ink" / "spar" / "v4"
ANCHORS = ROOT / "data" / "spar" / "anchors.generated.json"

S = 1.5  # 設計單位 → 像素
CW, CH = 320, 400  # 設計格
FOOT = (120, 388)  # 主角腳底（敵人鏡像：CW - 120）
INK = (28, 26, 23)
RNG = np.random.default_rng(20260928)

# ------------------------------------------------------------ 繪圖工具 ---


def P(pt):
    return (pt[0] * S, pt[1] * S)


def rot(v, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)


def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


class Layer:
    """一格一層：RGBA 畫布（像素）"""

    def __init__(self):
        self.img = Image.new("RGBA", (int(CW * S), int(CH * S)), (0, 0, 0, 0))

    def paste_shape(self, poly, base, shade=None, light=None, outline=True, width=4.2, smooth=True, opacity=1.0):
        """淡彩設色（墨暈陰影、邊緣積色、顏料顆粒、留白高光）＋粗幼有變化嘅乾筆描邊。
        poly：設計座標點列（預設 Catmull-Rom 圓滑）或 ('circle', c, r)／('ellipse', c, rx, ry)。"""
        m = shape_mask(poly, smooth)
        fill_wash(self.img, m, base, opacity)
        if outline:
            stroke_mask(self.img, m, width)

    def outline_only(self, poly, width=4.2, smooth=True):
        stroke_mask(self.img, shape_mask(poly, smooth), width)

    def brush(self, pts, width, color=INK, alpha=0.8, taper=0.25):
        """一筆（沿點列、起筆粗收筆尖、帶飛白），用嚟畫衣褶、竹篾、繩"""
        brush_line(self.img, pts, width, color, alpha, taper)


def smooth_poly(pts, n=7):
    """閉合 Catmull-Rom：多邊形變圓潤（衣袍、披風、袖）"""
    N = len(pts)
    out = []
    for i in range(N):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % N], pts[(i + 2) % N]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)
                for j in (0, 1)
            ))
    return out


def open_spline(pts, n=10):
    """開放 Catmull-Rom（筆畫用）"""
    if len(pts) < 3:
        return pts
    ext = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(
                0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)
                for j in (0, 1)
            ))
    out.append(pts[-1])
    return out


def shape_mask(poly, smooth=True):
    m = Image.new("L", (int(CW * S), int(CH * S)), 0)
    d = ImageDraw.Draw(m)
    if isinstance(poly, tuple) and poly and poly[0] == "circle":
        _, c, r = poly
        cx, cy = P(c)
        d.ellipse([cx - r * S, cy - r * S, cx + r * S, cy + r * S], fill=255)
    elif isinstance(poly, tuple) and poly and poly[0] == "ellipse":
        _, c, rx, ry = poly
        cx, cy = P(c)
        d.ellipse([cx - rx * S, cy - ry * S, cx + rx * S, cy + ry * S], fill=255)
    else:
        pts = smooth_poly(poly) if smooth and len(poly) >= 4 else poly
        d.polygon([P(p) for p in pts], fill=255)
    return m


def shift(m, dx, dy):
    return ImageChops.offset(m, int(dx), int(dy))


_FIELDS = {}


def field(size, cell, key):
    """固定雜訊場（0..1），同尺寸重用"""
    k = (size, cell, key)
    if k not in _FIELDS:
        w, h = size
        _FIELDS[k] = value_noise_2d(RNG, h, w, cell).astype(np.float32)
    return _FIELDS[k]


def fill_wash(img, m, base, opacity=1.0):
    """宣紙淡彩：底色＋右下墨暈陰影（柔邊）＋左上留白高光＋邊緣積色＋顏料顆粒"""
    size = m.size
    M = np.asarray(m, np.float32) / 255
    if M.max() <= 0:
        return
    blur = np.asarray(m.filter(ImageFilter.GaussianBlur(9 * S)), np.float32) / 255
    sh_src = np.asarray(shift(Image.fromarray((blur * 255).astype(np.uint8)), -7 * S, -8 * S), np.float32) / 255
    shadow = np.clip(M - sh_src * 1.05, 0, 1)
    shadow = np.asarray(Image.fromarray((shadow * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5 * S)), np.float32) / 255
    hi = np.clip(M - np.asarray(shift(m, 4 * S, 5 * S), np.float32) / 255, 0, 1)
    hi = np.asarray(Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2 * S)), np.float32) / 255
    er = np.asarray(m.filter(ImageFilter.MinFilter(int(5 * S) | 1)).filter(ImageFilter.GaussianBlur(2 * S)), np.float32) / 255
    pool = np.clip(M - er, 0, 1)
    gran = field(size, 2, "g") * 0.6 + field(size, 9, "g2") * 0.4
    b = np.array(base, np.float32)[None, None, :]
    col = b * (1 - 0.3 * shadow[..., None]) * (1 - 0.14 * pool[..., None]) * (0.93 + 0.1 * gran[..., None])
    col = col + (255 - col) * 0.32 * hi[..., None]
    col = np.clip(col, 0, 255)
    src = np.zeros(M.shape + (4,), np.float32)
    src[..., :3] = col
    src[..., 3] = M * 255 * opacity
    over = Image.fromarray(src.astype(np.uint8), "RGBA")
    img.alpha_composite(over)


def dry_mask(size):
    """飛白：拉長嘅雜訊，挖出紙色細縫"""
    n = field(size, 3, "d") * 0.6 + field(size, 11, "d2") * 0.4
    return Image.fromarray((np.clip((n - 0.2) * 4.0, 0, 1) * 255).astype(np.uint8), "L")


def stroke_mask(img, m, width):
    """外輪廓：粗幼隨雜訊起伏（幼線同粗線之間混合）＋內緣淡墨＋飛白"""
    size = m.size
    w1 = max(3, int(width * S * 0.5)) | 1
    w2 = max(5, int(width * S * 1.5)) | 1
    M = np.asarray(m, np.float32)
    thin = np.asarray(m.filter(ImageFilter.MaxFilter(w1)), np.float32) - M
    thick = np.asarray(m.filter(ImageFilter.MaxFilter(w2)), np.float32) - M
    n = field(size, int(16 * S), "w")
    ring = thin * (1 - n) + thick * n
    lip = (M - np.asarray(m.filter(ImageFilter.MinFilter(3)), np.float32)) * 0.55
    a = np.clip(ring * 1.25 + lip, 0, 255) * np.clip(np.asarray(dry_mask(size), np.float32) / 255 * 0.55 + 0.45 + 0.2 * n, 0, 1)
    ring_img = Image.fromarray(a.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.7))
    img.paste(Image.new("RGBA", img.size, INK + (255,)), (0, 0), ring_img)


def brush_line(img, pts, width, color=INK, alpha=0.8, taper=0.25):
    pts = open_spline(pts)
    n = len(pts)
    m = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(m)
    for i in range(n - 1):
        t = i / max(1, n - 2)
        # 起筆略頓、中段飽滿、收筆收尖
        w = width * (0.75 + 0.35 * math.sin(math.pi * min(1, t * 1.6))) * (1 - (1 - taper) * max(0, t - 0.55) / 0.45)
        a, b = P(pts[i]), P(pts[i + 1])
        r = max(0.6, w * S / 2)
        d.line([a, b], fill=255, width=max(1, int(r * 2)))
        d.ellipse([b[0] - r, b[1] - r, b[0] + r, b[1] + r], fill=255)
    m = ImageChops.multiply(m, dry_mask(img.size)).filter(ImageFilter.GaussianBlur(0.6))
    m = m.point(lambda v: int(v * alpha))
    img.paste(Image.new("RGBA", img.size, tuple(color) + (255,)), (0, 0), m)


def limb(a, b, wa, wb):
    """由 a 到 b 嘅錐形四邊形（設計座標）"""
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    return [
        (a[0] + nx * wa / 2, a[1] + ny * wa / 2),
        (b[0] + nx * wb / 2, b[1] + ny * wb / 2),
        (b[0] - nx * wb / 2, b[1] - ny * wb / 2),
        (a[0] - nx * wa / 2, a[1] - ny * wa / 2),
    ]


def sleeve(sh, el, hand, sgn, w_up=24, w_cuff=44, drape=14):
    """闊袖：上臂窄、前臂向袖口張開，袖口向下垂（重力），圓滑輪廓"""
    up = limb(sh, el, w_up, w_up + 4)
    dx, dy = hand[0] - el[0], hand[1] - el[1]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    # 下緣＝法線指向地面嗰邊
    if ny < 0:
        nx, ny = -nx, -ny
    top_el = (el[0] - nx * (w_up + 4) / 2, el[1] - ny * (w_up + 4) / 2)
    bot_el = (el[0] + nx * (w_up + 4) / 2, el[1] + ny * (w_up + 4) / 2)
    tip = (hand[0] - dx / L * 4, hand[1] - dy / L * 4)
    top_h = (tip[0] - nx * w_cuff * 0.35, tip[1] - ny * w_cuff * 0.35)
    bot_h = (tip[0] + nx * w_cuff * 0.65, tip[1] + ny * w_cuff * 0.65 + drape)
    mid_b = ((bot_el[0] + bot_h[0]) / 2, (bot_el[1] + bot_h[1]) / 2 + drape * 0.8)
    fore = [top_el, top_h, bot_h, mid_b, bot_el]
    return up, fore, (top_h, bot_h)


def gray_to_mask_strip(frames):
    w = frames[0].width
    strip = Image.new("RGBA", (w * len(frames), frames[0].height), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * w, 0))
    return strip


def save(img, path, q=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=q, method=6)


# ------------------------------------------------------------ 姿勢 ---
# 角度：arm＝上臂由「向下」逆時針轉向前（+x）嘅度數；fore＝前臂相對上臂再轉
# leg＝由向下擺向前（+x）嘅度數；lean＝上身前傾度數


def pose(**kw):
    base = dict(
        bob=0.0, lean=0.0, crouch=0.0, legF=6.0, legB=-6.0, arm=22.0, fore=38.0, armB=-8.0, foreB=10.0,
        cape=0.0, flare=0.0, hat=0.0, hurt=False, limp=False,
    )
    base.update(kw)
    return base


def hero_clips():
    c = {}
    c["idle"] = [
        pose(bob=math.sin(i / 8 * math.tau) * 1.6, arm=22 + math.sin(i / 8 * math.tau) * 2, cape=i / 8, flare=0.25)
        for i in range(8)
    ]
    c["idle-hurt"] = [
        pose(bob=math.sin(i / 8 * math.tau) * 1.2, lean=7, arm=18, fore=30, hurt=True, cape=i / 8, flare=0.2)
        for i in range(8)
    ]
    walk = []
    for i in range(8):
        t = i / 8 * math.tau
        walk.append(
            pose(
                bob=-abs(math.sin(t)) * 4 + 2, lean=5, legF=math.sin(t) * 26, legB=-math.sin(t) * 26,
                arm=30 - math.sin(t) * 12, fore=40, armB=-math.sin(t) * 18 - 4, cape=i / 8, flare=0.6,
            )
        )
    c["walk"] = walk
    limp = []
    for i in range(8):
        t = i / 8 * math.tau
        limp.append(
            pose(
                bob=(math.sin(t) < 0) * 5 + 1, lean=8 + (math.sin(t) < 0) * 4, legF=math.sin(t) * 24,
                legB=-6 - math.sin(t) * 6, arm=26, fore=36, armB=-10, cape=i / 8, flare=0.45, limp=True,
            )
        )
    c["walk-limp"] = limp
    c["windup"] = [
        pose(crouch=k * 10, lean=-6 * k, legF=14 * k, legB=-14 * k, arm=22 + 180 * k, fore=38 - 20 * k,
             armB=-10 - 30 * k, cape=0.1 * i, flare=0.3 + 0.3 * k)
        for i, k in enumerate([0.25, 0.55, 0.85, 1.0])
    ]
    c["strike"] = [
        pose(crouch=10 - 4 * i, lean=-4 + 6 * i, legF=14 + 8 * i, legB=-18 - 4 * i, arm=a, fore=f,
             armB=-40 + 8 * i, cape=0.2 * i, flare=0.8)
        for i, (a, f) in enumerate([(190, 14), (130, 6), (85, 2), (62, 4)])
    ]
    c["recover"] = [
        pose(crouch=6 - 2 * i, lean=12 - 3 * i, legF=30 - 6 * i, legB=-30 + 6 * i, arm=62 - 10 * i, fore=4 + 9 * i,
             armB=-16 + 2 * i, cape=0.3 + 0.2 * i, flare=0.7 - 0.12 * i)
        for i in range(4)
    ]
    c["combo"] = [
        pose(crouch=6, lean=l, legF=24, legB=-24, arm=a, fore=f, armB=-30, cape=0.15 * i, flare=0.8)
        for i, (a, f, l) in enumerate([(60, 10, 10), (120, 4, 4), (175, 10, -2), (140, 0, 6), (95, 0, 12), (70, 6, 14)])
    ]
    c["ultimate"] = [
        pose(bob=b, crouch=cr, lean=l, legF=lf, legB=-lf, arm=a, fore=f, armB=-50, cape=0.12 * i, flare=fl)
        for i, (b, cr, l, lf, a, f, fl) in enumerate(
            [
                (0, 12, -10, 18, 200, 20, 0.6),
                (-10, 4, -12, 26, 215, 10, 0.9),
                (-22, 0, -6, 30, 190, 0, 1.2),
                (-18, 0, 4, 34, 140, 0, 1.4),
                (-8, 4, 12, 36, 95, 0, 1.4),
                (0, 10, 16, 38, 70, 0, 1.2),
                (0, 12, 16, 38, 60, 2, 1.0),
                (0, 10, 12, 34, 56, 6, 0.8),
            ]
        )
    ]
    return c


# ------------------------------------------------------------ 主角 ---

HAT = (201, 179, 135)
HAT_RIB = (156, 132, 91)
VEIL = (226, 220, 206)
CAPE = (84, 79, 72)
LEG = (110, 104, 96)
BOOT = (58, 52, 44)
SKIN = (227, 211, 185)
FACE = (122, 114, 104)
BELT = (70, 64, 56)
ROBE_G = (224, 224, 224)
ARMOR = (122, 128, 132)
JADE = (141, 176, 155)
TASSEL = (163, 58, 50)


def skeleton(p, foot=FOOT, mirror=False):
    """回傳關節（設計座標）"""
    fx, fy = foot
    leg_len = 118
    hip = (fx, fy - leg_len + p["crouch"] + p["bob"] * 0.3)
    sgn = -1 if mirror else 1
    # lean 正＝向前傾：向 +x（mirror 時向 −x）
    up = rot((0, -1), p["lean"] * sgn)
    sh = add(hip, (up[0] * 92, up[1] * 92 + p["bob"]))
    head = add(hip, (up[0] * 118, up[1] * 118 + p["bob"]))

    def arm_pts(base, a, f):
        # a：由向下逆時針（向前）轉；鏡像時向 −x
        d1 = rot((0, 1), -a * sgn)
        el = add(base, (d1[0] * 46, d1[1] * 46))
        d2 = rot((0, 1), -(a + f) * sgn)
        hand = add(el, (d2[0] * 42, d2[1] * 42))
        return el, hand, math.atan2(d2[1], d2[0])

    shF = add(sh, (6 * sgn, 4))
    shB = add(sh, (-8 * sgn, 2))
    elF, handF, angF = arm_pts(shF, p["arm"], p["fore"])
    if p["hurt"]:
        # 後手掩住前臂上段
        handB = add(shF, (4 * sgn, 26))
        elB = add(shB, (6 * sgn, 30))
    else:
        elB, handB, _ = arm_pts(shB, p["armB"], p["foreB"])

    def leg_pt(a):
        d = rot((0, 1), -a * sgn)
        k = leg_len - p["crouch"] * 0.6
        return add(hip, (d[0] * k, d[1] * k))

    footF = leg_pt(p["legF"])
    footB = leg_pt(p["legB"])
    footF = (footF[0], min(footF[1], fy))
    footB = (footB[0], min(footB[1], fy))
    return dict(hip=hip, sh=sh, head=head, up=up, shF=shF, shB=shB, elF=elF, handF=handF, angF=angF, elB=elB,
                handB=handB, footF=footF, footB=footB, sgn=sgn)


def draw_hero_frame(p):
    k = skeleton(p)
    L = {n: Layer() for n in ("back", "robe", "front", "armor", "acc", "hand")}
    hip, sh, head, up = k["hip"], k["sh"], k["head"], k["up"]
    sgn = k["sgn"]
    wave = math.sin(p["cape"] * math.tau)
    wave2 = math.sin(p["cape"] * math.tau + 1.3)
    fl = p["flare"]
    # ---- back：披風（由肩後飄出，尾端分兩條波浪）
    tx = -44 - 52 * fl
    cape = [
        add(sh, (-6, -8)),
        add(sh, (14, -2)),
        add(sh, (8, 20)),
        add(hip, (-8, 34)),
        add(hip, (tx * 0.5, 84 + 6 * wave)),
        add(hip, (tx * 0.85, 96 - 14 * fl + 10 * wave2)),
        add(hip, (tx, 70 - 22 * fl + 8 * wave)),
        add(hip, (tx * 0.9 - 4, 30 - 16 * fl)),
        add(sh, (-26 - 22 * fl, 30 + 6 * wave2)),
        add(sh, (-18, 4)),
    ]
    L["back"].paste_shape(cape, CAPE, width=4.4)
    L["back"].brush([add(sh, (-10, 10)), add(hip, (tx * 0.35, 40)), add(hip, (tx * 0.6, 80 + 4 * wave))], 2.2, alpha=0.45)
    # 雙腿（褲＋靴，圓滑）
    for foot in (k["footB"], k["footF"]):
        L["back"].paste_shape(limb(add(hip, (0, 12)), add(foot, (0, -10)), 24, 17), LEG, width=3.4)
        boot = [add(foot, (-9, -20)), add(foot, (9, -20)), add(foot, (12, -8)), add(foot, (24, -2)), add(foot, (22, 3)), add(foot, (-10, 3)), add(foot, (-11, -8))]
        L["back"].paste_shape(boot, BOOT, width=3.2)
    # 後袖（闊袖，袍色喺 robe 層；外線喺 back 層）＋後手
    bUp, bFore, _ = sleeve(k["shB"], k["elB"], k["handB"], sgn, 20, 30, 6)
    L["back"].outline_only(bUp, 3.4)
    L["back"].outline_only(bFore, 3.4)
    L["back"].paste_shape(("circle", k["handB"], 6.5), SKIN, width=2.6)
    # ---- robe（灰階，執行時染門派色）
    R = L["robe"]
    R.paste_shape(bUp, ROBE_G, outline=False)
    R.paste_shape(bFore, ROBE_G, outline=False)
    sway = (p["legF"] + p["legB"]) * 0.22
    fw = max(0, p["legF"]) * 0.55
    bw = min(0, p["legB"]) * 0.55
    skirt = [
        add(hip, (-25, -8)),
        add(hip, (25, -8)),
        add(hip, (34 + fw * 0.5, 40)),
        add(hip, (44 + fw + sway, 90 + 3 * wave)),
        add(hip, (20 + sway, 96)),
        add(hip, (-8 + sway, 98 + 2 * wave2)),
        add(hip, (-40 + bw + sway, 92)),
        add(hip, (-32 + bw * 0.5, 40)),
    ]
    torso = [
        add(hip, (-24, 4)),
        add(hip, (24, 4)),
        add(sh, (28, 10)),
        add(sh, (20, -6)),
        add(sh, (4, -12)),
        add(sh, (-16, -8)),
        add(sh, (-26, 10)),
    ]
    R.paste_shape(skirt, ROBE_G, outline=False)
    R.paste_shape(torso, ROBE_G, outline=False)
    fUp, fFore, cuff = sleeve(k["shF"], k["elF"], k["handF"], sgn, 22, 32, 7)
    R.paste_shape(fUp, ROBE_G, outline=False)
    R.paste_shape(fFore, ROBE_G, outline=False)
    # ---- front：袍外線、衣褶、交領、腰帶、斗笠、垂紗
    F = L["front"]
    body_mask = ImageChops.lighter(shape_mask(skirt), shape_mask(torso))
    stroke_mask(F.img, body_mask, 4.4)
    stroke_mask(F.img, ImageChops.lighter(shape_mask(fUp), shape_mask(fFore)), 3.8)
    # 衣褶：由腰落到下襬，跟腿方向
    for dx, lx, al in ((-6, p["legB"], 0.42), (10, p["legF"], 0.5), (22, p["legF"] * 1.2, 0.36)):
        a0 = add(hip, (dx, 4))
        a1 = add(hip, (dx + lx * 0.25 + sway * 0.5, 50))
        a2 = add(hip, (dx + lx * 0.45 + sway, 88))
        F.brush([a0, a1, a2], 2.0, alpha=al)
    F.brush([cuff[0], ((cuff[0][0] + cuff[1][0]) / 2 + 2, (cuff[0][1] + cuff[1][1]) / 2 + 3), cuff[1]], 2.4, alpha=0.6)
    F.brush([add(k["elF"], (0, 0)), cuff[1]], 1.6, alpha=0.3)
    # 交領（右衽）
    F.brush([add(sh, (-12, -8)), add(sh, (2, 12)), add(hip, (16, -8))], 2.6, alpha=0.75)
    F.brush([add(sh, (8, -10)), add(sh, (0, 6))], 2.2, alpha=0.6)
    # 腰帶＋帶尾（隨風）
    F.paste_shape(limb(add(hip, (-26, -5)), add(hip, (26, -5)), 11, 11), BELT, width=2.2, smooth=False)
    F.brush([add(hip, (-18, 0)), add(hip, (-26 - 10 * fl, 18 + 3 * wave)), add(hip, (-30 - 16 * fl, 34 + 4 * wave2))], 4.2, color=BELT, alpha=0.95)
    F.brush([add(hip, (-14, 0)), add(hip, (-20 - 8 * fl, 22 + 3 * wave2)), add(hip, (-22 - 12 * fl, 40))], 3.6, color=BELT, alpha=0.9)
    # 頭（斗笠下淡墨陰影面，冇五官）
    F.paste_shape(("ellipse", add(head, (2 * sgn, 2)), 14, 17), FACE, width=2.2)
    hat_c = add(head, (0, -9))
    tilt = p["hat"]
    brimL = add(hat_c, rot((-62, 2), tilt))
    brimR = add(hat_c, rot((62, 2), tilt))
    apex = add(hat_c, rot((0, -32), tilt))
    # 斗笠陰影落喺面上：淡墨面（冇五官），笠沿下一抹淡墨暈
    F.paste_shape(("ellipse", add(hat_c, (4 * sgn, 12)), 30, 7), (120, 112, 100), outline=False, opacity=0.45)
    # 斗笠：寬扁錐，笠沿有厚度
    hat = [brimL, add(hat_c, rot((-30, -12), tilt)), apex, add(hat_c, rot((30, -12), tilt)), brimR, add(hat_c, rot((58, 7), tilt)), add(hat_c, rot((-58, 7), tilt))]
    F.paste_shape(hat, HAT, width=4.6, smooth=False)
    for t in (-0.75, -0.45, -0.15, 0.15, 0.45, 0.75):
        end = add(hat_c, rot((60 * t, 2 + 3 * abs(t)), tilt))
        F.brush([add(apex, (0, 3)), end], 1.4, color=HAT_RIB, alpha=0.7, taper=0.6)
    F.brush([brimL, add(hat_c, rot((0, 7), tilt)), brimR], 2.2, color=HAT_RIB, alpha=0.8, taper=0.8)
    F.paste_shape(("circle", add(apex, (0, -1)), 3.4), HAT_RIB, width=1.6)
    # ---- armor：護肩（兩片疊甲）＋護胸
    A = L["armor"]
    s0 = k["shF"]
    A.paste_shape([add(s0, (-16, -8)), add(s0, (6, -14)), add(s0, (20, -2)), add(s0, (16, 12)), add(s0, (-12, 10))], ARMOR, width=3)
    A.paste_shape([add(s0, (-12, 6)), add(s0, (14, 4)), add(s0, (16, 18)), add(s0, (-10, 20))], (112, 118, 122), width=2.6)
    # 皮護胸帶：由肩斜落腰
    A.brush([add(s0, (-6, 8)), add(sh, (6, 26)), add(hip, (20, -10))], 5, color=(92, 72, 56), alpha=0.95)
    A.paste_shape(("circle", add(sh, (8, 28)), 3.6), (176, 138, 62), width=1.6)
    # ---- acc：玉佩（繩＋玉環＋流蘇）
    C = L["acc"]
    pend = add(hip, (16 + 2 * wave, 24))
    C.brush([add(hip, (12, -2)), add(hip, (15, 10)), pend], 1.6, color=BELT, alpha=0.9)
    C.paste_shape(("circle", pend, 6.5), JADE, width=2.2)
    C.paste_shape(("circle", pend, 2.2), (220, 230, 222), outline=False)
    C.brush([add(pend, (0, 6)), add(pend, (1 + 2 * wave, 16)), add(pend, (2 + 4 * wave, 26))], 4.5, color=TASSEL, alpha=0.95, taper=0.5)
    # ---- hand：前手
    L["hand"].paste_shape(("ellipse", k["handF"], 7.5, 7), SKIN, width=2.8)
    return L, k


# ------------------------------------------------------------ 敵人 ---

TIER_LOOK = {
    1: dict(cloth=(163, 155, 140), weapon="club", head="band", w=1.0),
    2: dict(cloth=(140, 131, 120), weapon="dagger", head="hood", w=1.02),
    3: dict(cloth=(94, 111, 130), weapon="saber", head="hood", w=1.05),
    4: dict(cloth=(138, 90, 68), weapon="spear", head="helm", w=1.08),
    5: dict(cloth=(88, 69, 96), weapon="axe", head="horn", w=1.12),
    6: dict(cloth=(63, 58, 54), weapon="glaive", head="mask", w=1.16),
}
EFOOT = (CW - 120, 388)


def enemy_clips():
    c = {}
    c["enter"] = [
        pose(bob=-abs(math.sin(i / 6 * math.tau)) * 3, lean=6, legF=math.sin(i / 6 * math.tau) * 22,
             legB=-math.sin(i / 6 * math.tau) * 22, arm=60, fore=30, armB=-math.sin(i / 6 * math.tau) * 14, flare=0.4,
             cape=i / 6)
        for i in range(6)
    ]
    c["taunt"] = [
        pose(bob=math.sin(i / 8 * math.tau) * 2, lean=4, legF=16, legB=-16, arm=70 + math.sin(i / 8 * math.tau) * 26,
             fore=40 - math.sin(i / 8 * math.tau) * 20, armB=-24, flare=0.3, cape=i / 8)
        for i in range(8)
    ]
    c["hit"] = [
        pose(lean=-8 - 6 * k, legF=20, legB=-24, arm=40 - 20 * k, fore=20, armB=-40 - 20 * k, flare=0.6, cape=0.2 * i)
        for i, k in enumerate([0.5, 1.0, 0.7, 0.2])
    ]
    c["break"] = [
        pose(bob=b, crouch=cr, lean=l, legF=lf, legB=lb, arm=a, fore=10, armB=-60, flare=0.4, cape=0.1 * i)
        for i, (b, cr, l, lf, lb, a) in enumerate(
            [
                (0, 4, -16, 18, -30, 20),
                (0, 12, -24, 24, -34, 10),
                (0, 26, -10, 40, -20, -10),
                (0, 44, 10, 60, -10, -20),
                (0, 62, 30, 80, 0, -30),
                (0, 76, 52, 88, 10, -40),
                (0, 84, 70, 90, 20, -50),
                (0, 88, 80, 90, 24, -56),
            ]
        )
    ]
    return c


def draw_enemy_frame(p, tier, boss=False):
    look = TIER_LOOK[tier]
    k = skeleton(p, foot=EFOOT, mirror=True)
    img = Layer()
    hip, sh, head, sgn = k["hip"], k["sh"], k["head"], k["sgn"]
    wmul = look["w"] * (1.18 if boss else 1.0)
    cloth = look["cloth"]
    # 頭目披風（朱砂邊）
    if boss:
        tail = 40 + 40 * p["flare"]
        cape = [add(sh, (10, -4)), add(sh, (-6, 0)), add(hip, (4, 40)), add(hip, (tail, 92)), add(sh, (26 + tail * 0.4, 20))]
        img.paste_shape(cape, (74, 38, 34))
    wave = math.sin(p["cape"] * math.tau)
    dark = tuple(int(c * 0.78) for c in cloth)
    # 後袖
    bUp, bFore, _ = sleeve(k["shB"], k["elB"], k["handB"], sgn, 20 * wmul, 28 * wmul, 5)
    img.paste_shape(bUp, dark, width=3.4)
    img.paste_shape(bFore, dark, width=3.4)
    img.paste_shape(("circle", k["handB"], 6.5), (170, 150, 128), width=2.4)
    # 腿（綁腿褲＋布鞋，同主角比例）
    for foot in (k["footB"], k["footF"]):
        img.paste_shape(limb(add(hip, (0, 12)), add(foot, (0, -10)), 22 * wmul, 16), (84, 78, 70), width=3.2)
        img.brush([add(foot, (-6 * sgn, -30)), add(foot, (6 * sgn, -24)), add(foot, (-6 * sgn, -18))], 1.6, alpha=0.5)
        boot = [add(foot, (9, -18)), add(foot, (-9, -18)), add(foot, (-12, -8)), add(foot, (-24, -2)), add(foot, (-22, 3)), add(foot, (10, 3)), add(foot, (11, -8))]
        img.paste_shape(boot, (44, 40, 36), width=3)
    # 身：短打上衣＋長下襬（開衩隨步擺）
    sway = (p["legF"] + p["legB"]) * 0.2 * sgn
    skirt = [
        add(hip, (-25 * wmul, -8)), add(hip, (25 * wmul, -8)),
        add(hip, (30 * wmul, 36)), add(hip, (36 * wmul + sway, 72 + 3 * wave)),
        add(hip, (4 + sway, 78)), add(hip, (-34 * wmul + sway, 72)), add(hip, (-30 * wmul, 36)),
    ]
    torso = [
        add(hip, (-26 * wmul, 4)), add(hip, (26 * wmul, 4)), add(sh, (30 * wmul, 10)), add(sh, (18, -6)),
        add(sh, (0, -12)), add(sh, (-18, -6)), add(sh, (-30 * wmul, 10)),
    ]
    img.paste_shape(skirt, tuple(int(c * 0.9) for c in cloth), width=4.2)
    img.paste_shape(torso, cloth, width=4.4)
    for dx in (-10, 8):
        img.brush([add(hip, (dx * sgn, 2)), add(hip, (dx * sgn + sway * 0.6, 40)), add(hip, (dx * sgn + sway, 70))], 1.8, alpha=0.4)
    img.brush([add(sh, (12 * sgn, -8)), add(sh, (-2 * sgn, 12)), add(hip, (-14 * sgn, -8))], 2.4, alpha=0.7)
    sash = (163, 58, 50) if boss else (56, 50, 44)
    img.paste_shape(limb(add(hip, (-26 * wmul, -4)), add(hip, (26 * wmul, -4)), 11, 11), sash, width=2.2, smooth=False)
    img.brush([add(hip, (16 * sgn, 0)), add(hip, (26 * sgn, 18 + 3 * wave)), add(hip, (30 * sgn, 34))], 4, color=sash, alpha=0.95)
    if boss:
        # 肩甲
        for s0 in (k["shF"], k["shB"]):
            img.paste_shape([add(s0, (-18, -10)), add(s0, (4, -16)), add(s0, (20, -4)), add(s0, (16, 12)), add(s0, (-16, 12))], (96, 90, 84), width=3)
    # 頭：蒙面（濃墨布）＋款式
    img.paste_shape(("ellipse", head, 15.5 * (1.08 if boss else 1), 17.5 * (1.08 if boss else 1)), (150, 132, 112), width=3)
    # 蒙面：濃墨布包住下半面，留雙眼位
    img.paste_shape([add(head, (-17, -1)), add(head, (17, -1)), add(head, (18, 14)), add(head, (0, 20)), add(head, (-18, 14))], (40, 36, 33), width=2.6)
    hc = head
    hd = look["head"]
    if hd == "band":
        img.paste_shape(limb(add(hc, (-18, -6)), add(hc, (18, -6)), 6, 6), (150, 60, 50), width=2)
        img.paste_shape(limb(add(hc, (16, -6)), add(hc, (34, 4)), 5, 3), (150, 60, 50), width=2)
    elif hd == "hood":
        img.paste_shape([add(hc, (-22, 6)), add(hc, (-20, -20)), add(hc, (0, -28)), add(hc, (22, -16)), add(hc, (30, 16))], (60, 55, 50))
    elif hd == "helm":
        img.paste_shape([add(hc, (-20, -2)), add(hc, (-16, -22)), add(hc, (16, -22)), add(hc, (20, -2))], (110, 112, 114))
        img.paste_shape(limb(add(hc, (0, -22)), add(hc, (4, -40)), 4, 2), (163, 58, 50), width=2)
    elif hd == "horn":
        img.paste_shape([add(hc, (-20, 0)), add(hc, (-18, -20)), add(hc, (18, -20)), add(hc, (20, 0))], (60, 50, 66))
        for s in (-1, 1):
            img.paste_shape([add(hc, (12 * s, -16)), add(hc, (26 * s, -40)), add(hc, (6 * s, -20))], (220, 210, 190), width=2.4)
    elif hd == "mask":
        img.paste_shape(("ellipse", add(hc, (0, 0)), 19, 21), (200, 190, 170))
        img.paste_shape(limb(add(hc, (-12, 8)), add(hc, (12, 8)), 3, 3), (60, 40, 36), outline=False)
    # 兵器（前手）
    hand = k["handF"]
    ang = k["angF"]
    dirv = (math.cos(ang), math.sin(ang))
    wlen = {"club": 80, "dagger": 42, "saber": 90, "spear": 150, "axe": 84, "glaive": 150}[look["weapon"]] * (1.2 if boss else 1)
    tip = add(hand, (dirv[0] * wlen, dirv[1] * wlen))
    butt = add(hand, (-dirv[0] * 16, -dirv[1] * 16))
    wk = look["weapon"]
    shaft_w = {"club": 9, "dagger": 5, "saber": 5, "spear": 5, "axe": 6, "glaive": 6}[wk]
    img.paste_shape(limb(butt, tip, shaft_w, shaft_w * (1.6 if wk == "club" else 0.8)),
                    (92, 70, 52) if wk in ("club", "spear", "axe", "glaive") else (200, 204, 200), width=2.6)
    if wk in ("saber", "dagger"):
        img.paste_shape(limb(hand, tip, 12, 4), (214, 218, 214), width=2.6)
    if wk in ("spear", "glaive"):
        head_len = 30 if wk == "spear" else 44
        hb = add(tip, (-dirv[0] * head_len, -dirv[1] * head_len))
        img.paste_shape(limb(hb, tip, 16 if wk == "glaive" else 11, 2), (214, 218, 214), width=2.6)
    if wk == "axe":
        n = (-dirv[1], dirv[0])
        ax = add(tip, (-dirv[0] * 14, -dirv[1] * 14))
        img.paste_shape([add(ax, (n[0] * 4, n[1] * 4)), add(ax, (n[0] * 28 + dirv[0] * 10, n[1] * 28 + dirv[1] * 10)),
                         add(ax, (n[0] * 30 - dirv[0] * 22, n[1] * 30 - dirv[1] * 22)), add(ax, (-dirv[0] * 18, -dirv[1] * 18))],
                        (200, 204, 200), width=2.6)
    # 前手臂＋手
    fUp, fFore, _ = sleeve(k["shF"], k["elF"], hand, sgn, 21 * wmul, 28 * wmul, 5)
    img.paste_shape(fUp, cloth, width=3.8)
    img.paste_shape(fFore, cloth, width=3.8)
    img.paste_shape(("ellipse", hand, 7.5, 7), (170, 150, 128), width=2.6)
    # 紅眼位（望左）
    eye = add(head, (-8, -2))
    return img, eye


# ------------------------------------------------------------ 兵器、刀光、飄落物 ---

WEAPONS = {
    # 長度（設計單位）、握點 x
    "sword": dict(len=150, grip=22),
    "blade": dict(len=132, grip=22),
    "spear": dict(len=230, grip=70),
    "staff": dict(len=210, grip=80),
    "whip": dict(len=170, grip=18),
    "bow": dict(len=120, grip=60),
    "hidden": dict(len=62, grip=14),
}


def draw_weapon(kind):
    spec = WEAPONS[kind]
    Lx = spec["len"] + 16
    H = 60
    img = Image.new("RGBA", (int(Lx * S), int(H * S)), (0, 0, 0, 0))
    lay = Layer.__new__(Layer)
    lay.img = img
    global CW, CH
    cw0, ch0 = CW, CH
    CW, CH = Lx, H
    cy = H / 2
    g = spec["grip"]
    metal = (216, 220, 216)
    wood = (120, 88, 60)
    gold = (176, 138, 62)
    if kind in ("sword", "hidden"):
        blen = spec["len"] - g
        lay.paste_shape(limb((g - 14, cy), (g + 10, cy), 7, 7), (58, 52, 44), width=2.4)
        lay.paste_shape([(g + 8, cy - 11), (g + 14, cy - 11), (g + 14, cy + 11), (g + 8, cy + 11)], gold, width=2.4)
        lay.paste_shape([(g + 14, cy - 5), (g + 14 + blen - 16, cy - 4), (g + 14 + blen, cy), (g + 14 + blen - 16, cy + 4), (g + 14, cy + 5)], metal, width=2.6)
    elif kind == "blade":
        lay.paste_shape(limb((g - 14, cy), (g + 8, cy), 8, 8), (58, 52, 44), width=2.4)
        lay.paste_shape([(g + 6, cy - 12), (g + 12, cy - 12), (g + 12, cy + 12), (g + 6, cy + 12)], gold, width=2.4)
        lay.paste_shape([(g + 12, cy - 5), (g + 70, cy - 9), (g + 118, cy - 16), (g + 110, cy + 2), (g + 60, cy + 10), (g + 12, cy + 8)], metal, width=2.8)
    elif kind in ("spear", "staff"):
        lay.paste_shape(limb((4, cy), (spec["len"] - (26 if kind == "spear" else 2), cy), 7, 6), wood, width=2.4)
        if kind == "spear":
            e = spec["len"]
            lay.paste_shape([(e - 30, cy - 7), (e + 6, cy), (e - 30, cy + 7)], metal, width=2.6)
            lay.paste_shape([(e - 36, cy - 6), (e - 28, cy - 6), (e - 26, cy + 14), (e - 38, cy + 12)], (163, 58, 50), width=2)
        else:
            for x in (8, spec["len"] - 12):
                lay.paste_shape([(x - 5, cy - 6), (x + 5, cy - 6), (x + 5, cy + 6), (x - 5, cy + 6)], gold, width=2)
    elif kind == "whip":
        lay.paste_shape(limb((g - 14, cy), (g + 6, cy), 8, 8), (58, 52, 44), width=2.4)
        pts = [(g + 6 + i * 8, cy + math.sin(i * 0.55) * (4 + i * 0.5)) for i in range(20)]
        for a, b in zip(pts, pts[1:]):
            lay.paste_shape(limb(a, b, 5 - 0.15 * pts.index(a) / 2, 4), (92, 70, 52), outline=False)
    elif kind == "bow":
        c = (g, cy)
        pts = [(g + 22 * math.cos(t) - 20, cy + 26 * math.sin(t)) for t in np.linspace(-1.3, 1.3, 14)]
        for a, b in zip(pts, pts[1:]):
            lay.paste_shape(limb(a, b, 5, 5), wood, width=2)
        d = ImageDraw.Draw(img)
        d.line([P(pts[0]), P(pts[-1])], fill=(60, 56, 50, 255), width=2)
        lay.paste_shape(limb((c[0] - 24, cy), (c[0] + 60, cy), 3, 3), wood, width=1.6)
    CW, CH = cw0, ch0
    return img, (g, cy)


def slash_texture(style):
    """墨痕刀光：沿弧線彎嘅毛筆一撇（橫向起筆 → 收筆飛白）。回傳 RGBA。"""
    spec = {
        "arc": dict(L=620, H=110, bend=0.55, w=0.3),
        "heavy": dict(L=620, H=150, bend=0.6, w=0.46),
        "thrust": dict(L=760, H=70, bend=0.04, w=0.36),
        "round": dict(L=700, H=130, bend=0.9, w=0.34),
        "fist": dict(L=260, H=120, bend=0.3, w=0.5),
        "ultimate": dict(L=1100, H=220, bend=0.75, w=0.42),
    }[style]
    a = brush_stroke(RNG, spec["L"], spec["H"], width_frac=spec["w"], dry=0.8, bristles=90, taper=0.35)
    # 彎成弧：逐列向上移
    Lp, Hp = spec["L"], spec["H"]
    pad = int(Lp * spec["bend"] * 0.35) + 4
    out = np.zeros((Hp + pad, Lp))
    for x in range(Lp):
        t = x / (Lp - 1)
        dy = int(pad * (1 - (2 * t - 1) ** 2))
        out[pad - dy : pad - dy + Hp, x] = a[:, x]
    rgba = np.zeros(out.shape + (4,), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = INK
    rgba[..., 3] = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def drop_sprite(kind):
    n = 48
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if kind == "petal":
        d.ellipse([10, 16, 38, 32], fill=(222, 170, 168, 230))
        d.ellipse([14, 19, 30, 27], fill=(236, 200, 196, 200))
    elif kind == "firefly":
        for r, a in ((20, 40), (12, 90), (5, 255)):
            d.ellipse([24 - r, 24 - r, 24 + r, 24 + r], fill=(236, 222, 150, a))
    elif kind == "leaf":
        d.polygon([(6, 26), (22, 10), (42, 16), (30, 34), (12, 36)], fill=(178, 120, 66, 235))
        d.line([(8, 30), (38, 18)], fill=(120, 76, 40, 255), width=2)
    elif kind == "snow":
        # 宣紙底上要有淡墨邊先睇到
        d.ellipse([12, 12, 36, 36], fill=(150, 150, 146, 90))
        d.ellipse([15, 15, 33, 33], fill=(252, 252, 250, 250))
    return img.filter(ImageFilter.GaussianBlur(0.6))


# ------------------------------------------------------------ 背景 ---

BG_W, BG_H = 1440, 576


def wrap_draw(d, fn, x, w=BG_W):
    for off in (-w, 0, w):
        fn(d, x + off)


def ridge(rng, amp, base, knots, w=BG_W):
    xs = np.arange(w)
    k = rng.uniform(-1, 1, knots)
    k = np.append(k, k[0])
    f = xs / w * knots
    i = np.floor(f).astype(int)
    t = f - i
    t = t * t * (3 - 2 * t)
    y = k[i] * (1 - t) + k[i + 1] * t
    return base - y * amp


# 背景用 repo 已有嘅 AI 水墨長卷（public/ink/ai/banners/）：紙色轉透明、淨留墨跡，頭尾交叉淡化成無縫平鋪
PLACE_BANNERS = {
    "town": ("banner-market", "banner-bridge-mist"),
    "river": ("banner-lonely-boat", "banner-bridge-mist"),
    "mountain": ("banner-mountain-road", "banner-sword-road"),
    "hall": ("banner-sect-gate", "banner-courtyard"),
    "wild": ("banner-bamboo-practice", "banner-bond-plum"),
}


def banner_ink(name, fade=1.0, blur=0.0, lift=0):
    im = Image.open(ROOT / "public" / "ink" / "ai" / "banners" / f"{name}.webp").convert("L")
    im = im.resize((int(im.width * BG_H / im.height), BG_H), Image.LANCZOS)
    a = np.asarray(im, np.float32)
    paper = np.percentile(a, 90)
    alpha = np.clip((paper - a) / max(1.0, paper - 30), 0, 1) ** 0.85 * fade
    if lift:
        # 遠景：向上移，令地平線高過中景
        alpha = np.concatenate([alpha[lift:], np.zeros((lift, alpha.shape[1]), np.float32)], 0)
    # 頭尾交叉淡化成循環（唔用鏡像，免得出現對稱接口）
    w = alpha.shape[1]
    o = int(w * 0.12)
    k = np.linspace(0, 1, o, dtype=np.float32)[None, :]
    tile = alpha[:, : w - o].copy()
    tile[:, :o] = alpha[:, w - o :] * (1 - k) + alpha[:, :o] * k
    img = Image.fromarray((np.clip(tile, 0, 1) * 255).astype(np.uint8), "L")
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(img, np.float32) / 255


def bg_layers(place):
    rng = np.random.default_rng({"town": 11, "river": 23, "mountain": 37, "hall": 41, "wild": 53}[place])
    main_b, far_b = PLACE_BANNERS[place]
    far_img = to_ink(banner_ink(far_b, fade=0.32, blur=2.4, lift=70), (92, 88, 82))
    mid_img = to_ink(banner_ink(main_b, fade=0.72, blur=0.4), (58, 54, 48))
    W = far_img.width
    # near：地面淡墨帶＋草石
    near = np.zeros((BG_H, W), np.float32)
    yy = np.arange(BG_H)[:, None]
    gl = ridge(rng, 8, BG_H * 0.86, 9, w=W)
    near = np.maximum(near, np.clip((yy - gl[None, :]) / 30, 0, 1) * 0.16)
    near_img_l = Image.fromarray((near * 255).astype(np.uint8), "L")
    dn = ImageDraw.Draw(near_img_l)
    for i in range(36):
        x = rng.integers(0, W)
        y = BG_H * 0.86 + rng.integers(-4, 30)
        def tuft(dd, xx, y=y):
            for j in range(4):
                dd.line([(xx + j * 4, y), (xx + j * 4 + rng.integers(-10, 10), y - rng.integers(10, 26))], fill=120, width=2)
        wrap_draw(dn, tuft, x, W)
    near_img = to_ink(np.asarray(near_img_l.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255, (52, 48, 42))
    return far_img, mid_img, near_img


def to_ink(a, color):
    rgba = np.zeros(a.shape + (4,), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = color
    rgba[..., 3] = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


# ------------------------------------------------------------ 主程式 ---


def main():
    only = set(sys.argv[1:])  # 可只重出部分：hero enemy weapon fx bg（冇就全部）
    want = lambda k: not only or k in only  # noqa: E731
    if only and only <= {"fx", "bg"}:
        for st in ("arc", "heavy", "thrust", "round", "fist", "ultimate"):
            want("fx") and save(slash_texture(st), OUT / "fx" / f"slash-{st}.webp")
        for kind in ("petal", "firefly", "leaf", "snow"):
            want("fx") and save(drop_sprite(kind), OUT / "fx" / f"drop-{kind}.webp")
        if want("bg"):
            for place in ("town", "river", "mountain", "hall", "wild"):
                for layer, img in zip(("far", "mid", "near"), bg_layers(place)):
                    save(img, OUT / "bg" / f"{place}-{layer}.webp", 76)
        return
    anchors = {
        "scale": S,
        "cell": {"w": CW, "h": CH, "foot": list(FOOT), "enemyFoot": list(EFOOT)},
        "hero": {},
        "enemy": {},
        "weapon": {},
    }
    # 主角
    for clip, poses in hero_clips().items():
        layers = {n: [] for n in ("back", "robe", "front", "armor", "acc", "hand")}
        frames = []
        for p in poses:
            L, k = draw_hero_frame(p)
            for n in layers:
                layers[n].append(L[n].img)
            frames.append({"hand": [round(k["handF"][0], 1), round(k["handF"][1], 1)], "angle": round(k["angF"], 3)})
        for n, fr in layers.items():
            save(gray_to_mask_strip(fr), OUT / "hero" / f"{clip}.{n}.webp")
        anchors["hero"][clip] = frames
        print("hero", clip, len(poses))
    # 敵人＋頭目
    for tier in range(1, 7):
        for boss in (False, True):
            key = f"{'boss' if boss else 'enemy'}/t{tier}"
            anchors["enemy"][key] = {}
            for clip, poses in enemy_clips().items():
                frames, meta = [], []
                for p in poses:
                    img, eye = draw_enemy_frame(p, tier, boss)
                    frames.append(img.img)
                    meta.append({"eye": [round(eye[0], 1), round(eye[1], 1)]})
                save(gray_to_mask_strip(frames), OUT / key / f"{clip}.webp")
                anchors["enemy"][key][clip] = meta
        print("enemy tier", tier)
    # 兵器
    for kind in WEAPONS:
        img, grip = draw_weapon(kind)
        save(img, OUT / "weapon" / f"{kind}.webp")
        anchors["weapon"][kind] = {"grip": [grip[0], grip[1]], "len": WEAPONS[kind]["len"]}
    # 刀光、飄落物
    for st in ("arc", "heavy", "thrust", "round", "fist", "ultimate"):
        save(slash_texture(st), OUT / "fx" / f"slash-{st}.webp")
    for kind in ("petal", "firefly", "leaf", "snow"):
        save(drop_sprite(kind), OUT / "fx" / f"drop-{kind}.webp")
    # 背景
    for place in ("town", "river", "mountain", "hall", "wild"):
        far, mid, near = bg_layers(place)
        save(far, OUT / "bg" / f"{place}-far.webp", 76)
        save(mid, OUT / "bg" / f"{place}-mid.webp", 76)
        save(near, OUT / "bg" / f"{place}-near.webp", 76)
        print("bg", place)
    ANCHORS.parent.mkdir(parents=True, exist_ok=True)
    ANCHORS.write_text(json.dumps(anchors, ensure_ascii=False, indent=1) + "\n")
    print("anchors →", ANCHORS.relative_to(ROOT))


if __name__ == "__main__":
    main()
