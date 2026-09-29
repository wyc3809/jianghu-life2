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

    def paste_shape(self, poly, base, shade=None, light=None, outline=True, width=4.2):
        """三層設色（底色、成塊陰影、留白高光）＋乾筆描邊。poly：設計座標點列或 ('circle', c, r)。"""
        m = shape_mask(poly)
        fill_cel(self.img, m, base, shade, light)
        if outline:
            stroke_mask(self.img, m, width)

    def outline_only(self, poly, width=4.2):
        stroke_mask(self.img, shape_mask(poly), width)


def shape_mask(poly):
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
        d.polygon([P(p) for p in poly], fill=255)
    return m


def shift(m, dx, dy):
    return ImageChops.offset(m, int(dx), int(dy))


def fill_cel(img, m, base, shade=None, light=None):
    shade = shade or tuple(int(c * 0.78) for c in base)
    light = light or tuple(min(255, int(c + (255 - c) * 0.45)) for c in base)
    # 陰影：右下邊緣一塊；高光：左上邊緣一條
    sh = ImageChops.subtract(m, shift(m, -int(9 * S), -int(7 * S)))
    li = ImageChops.subtract(m, shift(m, int(4 * S), int(4 * S)))
    img.paste(Image.new("RGBA", img.size, base + (255,)), (0, 0), m)
    img.paste(Image.new("RGBA", img.size, shade + (255,)), (0, 0), sh)
    img.paste(Image.new("RGBA", img.size, light + (255,)), (0, 0), li)


_DRY = None


def dry_mask(size):
    """飛白：拉長嘅雜訊，挖出紙色細縫"""
    global _DRY
    if _DRY is None or _DRY.size != size:
        w, h = size
        n = value_noise_2d(RNG, h, w, 3) * 0.6 + value_noise_2d(RNG, h, w, 11) * 0.4
        a = np.clip((n - 0.22) * 4.0, 0, 1) * 255
        _DRY = Image.fromarray(a.astype(np.uint8), "L")
    return _DRY


def stroke_mask(img, m, width):
    """由形狀外緣畫一圈濃墨：膨脹減原形（外線）＋少少內收，再乘飛白"""
    w = max(1, int(width * S))
    outer = m.filter(ImageFilter.MaxFilter(w | 1))
    inner = m.filter(ImageFilter.MinFilter(max(3, (w // 2) | 1)))
    ring = ImageChops.subtract(outer, inner)
    ring = ImageChops.multiply(ring, dry_mask(m.size))
    ring = ring.filter(ImageFilter.GaussianBlur(0.6))
    img.paste(Image.new("RGBA", img.size, INK + (255,)), (0, 0), ring)


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
VEIL = (240, 235, 224)
CAPE = (84, 79, 72)
LEG = (110, 104, 96)
BOOT = (58, 52, 44)
SKIN = (227, 211, 185)
FACE = (140, 133, 122)
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
    # ---- back：披風
    wave = math.sin(p["cape"] * math.tau)
    fl = p["flare"]
    tail = (-38 - 46 * fl, 96 + 6 * wave)
    cape = [
        add(sh, (-10, -4)),
        add(sh, (12, 2)),
        add(hip, (-6, 30)),
        add(hip, (tail[0] * 0.55, tail[1] * 0.75 + 8 * wave)),
        add(hip, (tail[0], tail[1] - 10 + 10 * wave)),
        add(hip, (tail[0] * 0.8 - 6, 34 - 12 * fl)),
        add(sh, (-22 - 18 * fl, 22)),
    ]
    L["back"].paste_shape(cape, CAPE)
    # 雙腿（褲＋靴）
    for foot, a in ((k["footB"], p["legB"]), (k["footF"], p["legF"])):
        L["back"].paste_shape(limb(add(hip, (0, 10)), foot, 26, 20), LEG)
        boot = [add(foot, (-10, -18)), add(foot, (10, -18)), add(foot, (22, -2)), add(foot, (22, 3)), add(foot, (-10, 3))]
        L["back"].paste_shape(boot, BOOT)
    # 後袖（袍色，喺 robe 層先畫）＋後袖邊喺 back 層
    backSleeve = limb(k["shB"], k["elB"], 24, 26) + []
    backFore = limb(k["elB"], k["handB"], 26, 30)
    L["back"].outline_only(backSleeve)
    L["back"].outline_only(backFore)
    L["back"].paste_shape(("circle", k["handB"], 7), SKIN)
    # ---- robe（灰階）
    R = L["robe"]
    R.paste_shape(backSleeve, ROBE_G, outline=False)
    R.paste_shape(backFore, ROBE_G, outline=False)
    skirt_sway = (p["legF"] + p["legB"]) * 0.2
    skirt = [
        add(hip, (-26, -6)),
        add(hip, (26, -6)),
        add(hip, (40 + max(0, p["legF"]) * 0.5 + skirt_sway, 88)),
        add(hip, (8, 94)),
        add(hip, (-38 + min(0, p["legB"]) * 0.5 + skirt_sway, 88)),
    ]
    torso = [
        add(hip, (-24, 2)),
        add(hip, (24, 2)),
        add(sh, (26 * 1.0 + up[0] * 4, 6)),
        add(sh, (14, -8)),
        add(sh, (-14, -8)),
        add(sh, (-24, 8)),
    ]
    R.paste_shape(skirt, ROBE_G, outline=False)
    R.paste_shape(torso, ROBE_G, outline=False)
    frontSleeve = limb(k["shF"], k["elF"], 24, 26)
    frontFore = limb(k["elF"], k["handF"], 26, 32)
    R.paste_shape(frontSleeve, ROBE_G, outline=False)
    R.paste_shape(frontFore, ROBE_G, outline=False)
    # ---- front：袍外緣、交領、腰帶、斗笠、垂紗
    F = L["front"]
    body_mask = ImageChops.lighter(shape_mask(skirt), shape_mask(torso))
    stroke_mask(F.img, body_mask, 4.2)
    stroke_mask(F.img, ImageChops.lighter(shape_mask(frontSleeve), shape_mask(frontFore)), 3.6)
    collar = limb(add(sh, (-10, -6)), add(hip, (14, -6)), 7, 6)
    F.paste_shape(collar, (90, 96, 98), outline=False)
    belt = limb(add(hip, (-26, -4)), add(hip, (26, -4)), 12, 12)
    F.paste_shape(belt, BELT, outline=True, width=2.4)
    # 頭（淡墨陰影面）＋斗笠＋垂紗
    F.paste_shape(("circle", head, 16), FACE, outline=False)
    hat_c = add(head, (0, -8))
    brim = [rot((x, y), p["hat"]) for x, y in ((-54, 0), (54, 0), (0, -38))]
    hat = [add(hat_c, v) for v in (brim[0], (brim[0][0] + 6, brim[0][1] + 5), (brim[1][0] - 6, brim[1][1] + 5), brim[1], brim[2])]
    veil = [add(hat_c, (-44, 2)), add(hat_c, (44, 2)), add(hat_c, (46, 26)), add(hat_c, (-46, 26))]
    # 垂紗前開縫（見淡墨面）
    veil_l = [veil[0], add(hat_c, (8 * sgn - 6, 2)), add(hat_c, (8 * sgn - 8, 22)), veil[3]]
    veil_r = [add(hat_c, (8 * sgn + 10, 2)), veil[1], veil[2], add(hat_c, (8 * sgn + 12, 22))]
    F.paste_shape(veil_l, VEIL, width=3)
    F.paste_shape(veil_r, VEIL, width=3)
    F.paste_shape(hat, HAT, width=4.6)
    # 竹篾骨
    d = ImageDraw.Draw(F.img)
    for t in (-0.6, -0.3, 0.0, 0.3, 0.6):
        a = add(hat_c, brim[2])
        b = add(hat_c, (brim[0][0] + (brim[1][0] - brim[0][0]) * (0.5 + t * 0.8), brim[0][1] + (brim[1][1] - brim[0][1]) * (0.5 + t * 0.8)))
        d.line([P(a), P(b)], fill=HAT_RIB + (255,), width=int(1.6 * S))
    # ---- armor：護肩＋護胸
    A = L["armor"]
    pauld = [add(k["shF"], (-14, -8)), add(k["shF"], (14, -10)), add(k["shF"], (18, 10)), add(k["shF"], (-10, 14))]
    A.paste_shape(pauld, ARMOR, width=3.2)
    plate = [add(sh, (-6, 14)), add(sh, (20, 12)), add(hip, (20, -16)), add(hip, (-4, -14))]
    A.paste_shape(plate, (140, 144, 146), width=3)
    # ---- acc：玉佩（繩＋玉環＋流蘇）
    C = L["acc"]
    pend = add(hip, (14, 22))
    C.paste_shape(limb(add(hip, (12, 2)), pend, 2, 2), BELT, outline=False)
    C.paste_shape(("circle", pend, 6), JADE, width=2.4)
    C.paste_shape(limb(add(pend, (0, 6)), add(pend, (1, 22)), 3, 7), TASSEL, width=1.8)
    # ---- hand：前手
    L["hand"].paste_shape(("circle", k["handF"], 7.5), SKIN, width=3)
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
    # 後手臂
    img.paste_shape(limb(k["shB"], k["elB"], 22 * wmul, 22 * wmul), tuple(int(c * 0.8) for c in cloth))
    img.paste_shape(limb(k["elB"], k["handB"], 22 * wmul, 20 * wmul), tuple(int(c * 0.8) for c in cloth))
    # 腿
    for foot in (k["footB"], k["footF"]):
        img.paste_shape(limb(add(hip, (0, 8)), foot, 26 * wmul, 20 * wmul), (72, 66, 60))
        boot = [add(foot, (10, -16)), add(foot, (-10, -16)), add(foot, (-22, -2)), add(foot, (-22, 3)), add(foot, (10, 3))]
        img.paste_shape(boot, (40, 36, 32))
    # 身
    torso = [add(hip, (-26 * wmul, 4)), add(hip, (26 * wmul, 4)), add(sh, (28 * wmul, 8)), add(sh, (14, -8)),
             add(sh, (-14, -8)), add(sh, (-28 * wmul, 8))]
    skirt = [add(hip, (-24 * wmul, -4)), add(hip, (24 * wmul, -4)), add(hip, (32 * wmul, 58)), add(hip, (-34 * wmul, 58))]
    img.paste_shape(skirt, tuple(int(c * 0.9) for c in cloth))
    img.paste_shape(torso, cloth)
    sash = (163, 58, 50) if boss else (56, 50, 44)
    img.paste_shape(limb(add(hip, (-26 * wmul, -2)), add(hip, (26 * wmul, -2)), 12, 12), sash, width=2.4)
    if boss:
        # 肩甲
        for s in (k["shF"], k["shB"]):
            img.paste_shape([add(s, (-18, -10)), add(s, (16, -12)), add(s, (20, 10)), add(s, (-16, 12))], (96, 90, 84), width=3)
    # 頭：蒙面（濃墨布）＋款式
    img.paste_shape(("circle", head, 17 * (1.08 if boss else 1)), (46, 42, 38))
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
    img.paste_shape(limb(k["shF"], k["elF"], 22 * wmul, 22 * wmul), cloth)
    img.paste_shape(limb(k["elF"], hand, 22 * wmul, 20 * wmul), cloth)
    img.paste_shape(("circle", hand, 7), (180, 160, 136), width=2.6)
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


def wrap_draw(d, fn, x, *a):
    for off in (-BG_W, 0, BG_W):
        fn(d, x + off, *a)


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


def bg_layers(place):
    rng = np.random.default_rng({"town": 11, "river": 23, "mountain": 37, "hall": 41, "wild": 53}[place])
    # far：兩重遠山淡墨暈
    far = np.zeros((BG_H, BG_W), np.float32)
    for amp, base, tone, kn in ((90, BG_H * 0.46, 0.18, 5), (60, BG_H * 0.58, 0.28, 7)):
        if place == "river":
            amp *= 0.6
            base += 30
        if place == "mountain":
            amp *= 1.5
        top = ridge(rng, amp, base, kn)
        yy = np.arange(BG_H)[:, None]
        body = np.clip((yy - top[None, :]) / 60, 0, 1) * np.clip(1 - (yy - top[None, :]) / 260, 0.25, 1)
        far = np.maximum(far, body * tone)
    far = far * (0.85 + 0.15 * value_noise_2d(rng, BG_H, BG_W, 40))
    far_img = to_ink(far, (70, 66, 60))
    # mid：地點特色剪影
    mid = Image.new("L", (BG_W, BG_H), 0)
    d = ImageDraw.Draw(mid)
    ground = BG_H * 0.72
    if place == "town":
        x = 0
        while x < BG_W:
            w = rng.integers(80, 150)
            h = rng.integers(60, 120)
            wrap_draw(d, lambda dd, xx, w=w, h=h: (dd.rectangle([xx, ground - h, xx + w, ground], fill=70),
                      dd.polygon([(xx - 14, ground - h), (xx + w / 2, ground - h - 34), (xx + w + 14, ground - h)], fill=110)), x)
            x += w + rng.integers(20, 90)
    elif place == "river":
        for i in range(40):
            x = rng.integers(0, BG_W)
            h = rng.integers(30, 80)
            wrap_draw(d, lambda dd, xx, h=h: dd.line([(xx, ground + 6), (xx + rng.integers(-8, 8), ground - h)], fill=110, width=3), x)
        wrap_draw(d, lambda dd, xx: dd.polygon([(xx, ground - 8), (xx + 140, ground - 8), (xx + 120, ground + 10), (xx + 20, ground + 10)], fill=120), 700)
    elif place == "mountain":
        for i in range(9):
            x = rng.integers(0, BG_W)
            h = rng.integers(120, 220)
            def pine(dd, xx, h=h):
                dd.line([(xx, ground), (xx, ground - h)], fill=120, width=6)
                for j in range(4):
                    y = ground - h + j * h * 0.18
                    w = 30 + j * 18
                    dd.polygon([(xx - w, y + 26), (xx, y - 6), (xx + w, y + 26)], fill=100)
            wrap_draw(d, pine, x)
    elif place == "hall":
        wrap_draw(d, lambda dd, xx: (dd.rectangle([xx, ground - 170, xx + 26, ground], fill=110), dd.rectangle([xx + 220, ground - 170, xx + 246, ground], fill=110),
                  dd.polygon([(xx - 40, ground - 170), (xx + 123, ground - 230), (xx + 286, ground - 170)], fill=120),
                  dd.rectangle([xx - 400, ground - 70, xx - 20, ground], fill=60), dd.rectangle([xx + 266, ground - 70, xx + 700, ground], fill=60)), 500)
    else:  # wild：竹
        for i in range(34):
            x = rng.integers(0, BG_W)
            h = rng.integers(180, 330)
            def bamboo(dd, xx, h=h):
                dd.line([(xx, ground), (xx + 6, ground - h)], fill=110, width=5)
                for j in range(1, 6):
                    y = ground - h * j / 6
                    dd.line([(xx - 3, y), (xx + 9, y)], fill=150, width=2)
                    dd.polygon([(xx + 6, y), (xx + 40, y - 12), (xx + 12, y + 4)], fill=90)
            wrap_draw(d, bamboo, x)
    mid_a = np.asarray(mid.filter(ImageFilter.GaussianBlur(1.6)), np.float32) / 255 * 0.55
    mid_img = to_ink(mid_a, (60, 56, 50))
    # near：地面淡墨帶＋草石
    near = np.zeros((BG_H, BG_W), np.float32)
    yy = np.arange(BG_H)[:, None]
    gl = ridge(rng, 8, BG_H * 0.86, 9)
    near = np.maximum(near, np.clip((yy - gl[None, :]) / 30, 0, 1) * 0.16)
    near_img_l = Image.fromarray((near * 255).astype(np.uint8), "L")
    dn = ImageDraw.Draw(near_img_l)
    for i in range(60):
        x = rng.integers(0, BG_W)
        y = BG_H * 0.86 + rng.integers(-4, 30)
        def tuft(dd, xx, y=y):
            for j in range(4):
                dd.line([(xx + j * 4, y), (xx + j * 4 + rng.integers(-10, 10), y - rng.integers(10, 26))], fill=120, width=2)
        wrap_draw(dn, tuft, x)
    for i in range(10):
        x = rng.integers(0, BG_W)
        y = BG_H * 0.9 + rng.integers(0, 30)
        wrap_draw(dn, lambda dd, xx, y=y: dd.ellipse([xx, y - 12, xx + 44, y + 8], fill=110), x)
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
