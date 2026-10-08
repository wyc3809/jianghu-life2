#!/usr/bin/env python3
"""
江湖一生 · 統一 UI icon（位圖，唔用 SVG）

風格參考：design/art/ref/ui-style-ref.png（頂欄 歷程／任務／背包／功法／選單）
  手繪古風：主體平塗＋一層陰影、深啡毛筆外框（粗幼略唔均）、內部墨線、左上光源、正面視角、主體佔畫布約 80%。

三個方案（style board 畀玩家揀）：
  A 米白線描：同參考圖頂欄一樣，米白主體，只有點綴色（朱砂穗、金）
  B 設色：同一外框，主體按物料上色（銀、青玉、朱紅），兩階明暗＋高光＋閃光（寶箱同級）
  C 徽章：B 嘅物件放入宣紙圓章（深啡雙圈＋左右菱形），做按鈕用

用法：
  python3 scripts/art/build_ui_icons.py --board OUT.png         # 出 style board（唔寫入遊戲）
  python3 scripts/art/build_ui_icons.py --style B --apply       # 揀定後輸出 public/ink/art/icons/ui-*.webp（64／128）
AI 生成嘅替換圖可同名同尺寸直接放入 public/ink/art/icons/。
"""
from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / 'public' / 'ink' / 'art' / 'icons'
REF = ROOT / 'design' / 'art' / 'ref' / 'ui-style-ref.png'
S = 1024  # 工作畫布（畫大再縮）
FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'

# 色板（由參考圖取色，見 production/redesign-scope.md）
INK = (46, 38, 34)
WOOD = (74, 58, 50)
PAPER = (239, 230, 214)
PAPER_HI = (246, 240, 228)
BEIGE = (236, 224, 200)
BEIGE_SH = (205, 188, 156)
TEAL = (63, 102, 112)
GOLD = (227, 196, 106)
GOLD_DK = (184, 145, 62)
CINNABAR = (181, 71, 59)
CINNABAR_DK = (130, 44, 38)
SILVER = (222, 219, 208)
SILVER_SH = (160, 156, 142)
JADE = (110, 170, 146)
JADE_SH = (52, 110, 96)
ORANGE = (217, 138, 43)


# ───────── 筆觸工具 ─────────

def blank() -> Image.Image:
    return Image.new('L', (S, S), 0)


def noise_field(seed: int, scale: int = 24) -> np.ndarray:
    """低頻雜訊（-1..1），用嚟令邊緣似毛筆"""
    rnd = np.random.default_rng(seed)
    small = rnd.uniform(-1, 1, (S // scale + 2, S // scale + 2)).astype(np.float32)
    img = Image.fromarray(((small + 1) * 127.5).astype(np.uint8)).resize((S, S), Image.BICUBIC)
    return np.asarray(img).astype(np.float32) / 127.5 - 1


def arr(m: Image.Image) -> np.ndarray:
    return np.asarray(m).astype(np.float32) / 255


def to_img(a: np.ndarray) -> Image.Image:
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def rough_outline(mask: Image.Image, width: float, seed: int) -> np.ndarray:
    """外框：模糊後按帶雜訊嘅門檻取外擴，再減去主體入面少少 → 粗幼略唔均嘅毛筆框"""
    n = noise_field(seed)
    blur = arr(mask.filter(ImageFilter.GaussianBlur(width)))
    outer = np.clip((blur - (0.06 + 0.05 * n)) * 30, 0, 1)
    inner = np.clip((arr(mask.filter(ImageFilter.GaussianBlur(width * 0.35))) - (0.93 + 0.04 * n)) * 30, 0, 1)
    return np.clip(outer - inner, 0, 1)


def stroke(d: ImageDraw.ImageDraw, pts: list[tuple[float, float]], w0: float, w1: float | None = None, taper: bool = True) -> None:
    """毛筆線：沿折線逐點畫圓，粗幼由頭到尾變（兩頭尖）"""
    w1 = w0 if w1 is None else w1
    dense: list[tuple[float, float]] = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(2, int(math.hypot(x1 - x0, y1 - y0) / 2))
        dense += [(x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n) for t in range(n)]
    dense.append(pts[-1])
    N = len(dense)
    for i, (x, y) in enumerate(dense):
        t = i / max(1, N - 1)
        w = w0 + (w1 - w0) * t
        if taper:
            w *= min(1, 0.35 + 2.2 * min(t, 1 - t))
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)


def curve(p0, p1, p2, n: int = 24) -> list[tuple[float, float]]:
    """二次貝茲"""
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]


def shift(a: np.ndarray, dx: int, dy: int) -> np.ndarray:
    out = np.zeros_like(a)
    ys = slice(max(0, dy), S + min(0, dy))
    yd = slice(max(0, -dy), S + min(0, -dy))
    xs = slice(max(0, dx), S + min(0, dx))
    xd = slice(max(0, -dx), S + min(0, -dx))
    out[ys, xs] = a[yd, xd]
    return out


def rim(mask: np.ndarray, d: int, toward: tuple[int, int]) -> np.ndarray:
    """主體入面靠某方向嘅月牙（toward=(1,1) → 右下陰影；(-1,-1) → 左上受光）"""
    moved = shift(mask, -toward[0] * d, -toward[1] * d)
    band = np.clip(mask - moved, 0, 1)
    return arr(to_img(band).filter(ImageFilter.GaussianBlur(d * 0.18))) * mask


# ───────── 物件定義 ─────────
# 每個物件返回 regions: [(mask, base, shade)] 由底到面；lines: 內部墨線 mask；accents: 額外高光點

class Icon:
    def __init__(self) -> None:
        self.regions: list[tuple[Image.Image, tuple, tuple, bool]] = []  # mask, 設色, 設色陰影, 係咪點綴色（A 都保留）
        self.lines = blank()
        self.glints: list[tuple[float, float, float]] = []
        self.highlights = blank()
        self.free = blank()  # 唔受剪影裁切嘅墨線（例如煙、蒸氣）

    def region(self, base, shade, accent: bool = False) -> ImageDraw.ImageDraw:
        m = blank()
        self.regions.append((m, base, shade, accent))
        return ImageDraw.Draw(m)

    @property
    def ld(self) -> ImageDraw.ImageDraw:
        return ImageDraw.Draw(self.lines)

    @property
    def fd(self) -> ImageDraw.ImageDraw:
        return ImageDraw.Draw(self.free)

    @property
    def hd(self) -> ImageDraw.ImageDraw:
        return ImageDraw.Draw(self.highlights)


def icon_silver() -> Icon:
    """銀兩：元寶＋兩粒碎銀"""
    ic = Icon()
    # 碎銀（後面）
    d = ic.region(SILVER, SILVER_SH)
    d.polygon([(150, 700), (215, 640), (300, 660), (320, 740), (240, 790), (165, 770)], fill=255)
    d = ic.region(SILVER, SILVER_SH)
    d.polygon([(700, 690), (790, 650), (875, 690), (860, 770), (760, 800), (705, 760)], fill=255)
    # 元寶船身
    body = [(130, 360)] + curve((130, 360), (260, 470), (512, 480)) + curve((512, 480), (764, 470), (894, 360))
    body += curve((894, 360), (860, 640), (512, 720)) + curve((512, 720), (164, 640), (130, 360))
    d = ic.region(SILVER, SILVER_SH)
    d.polygon(body, fill=255)
    # 船面（凹位，用深一級）
    d = ic.region(SILVER_SH, (125, 120, 108))
    d.ellipse([250, 420, 774, 530], fill=255)
    # 中間元寶頂
    d = ic.region(SILVER, SILVER_SH)
    d.ellipse([352, 270, 672, 520], fill=255)
    L = ic.ld
    stroke(L, curve((190, 420), (340, 600), (512, 610)), 12)
    stroke(L, curve((512, 610), (690, 600), (835, 420)), 12)
    stroke(L, curve((215, 700), (240, 720), (280, 705)), 9)
    H = ic.hd
    stroke(H, curve((400, 340), (430, 300), (490, 292)), 26)
    stroke(H, curve((175, 400), (210, 470), (280, 520)), 18)
    ic.glints += [(640, 300, 70), (820, 660, 40)]
    return ic


def icon_jade() -> Icon:
    """玉石：青玉璧＋朱砂穗"""
    ic = Icon()
    cx, cy = 512, 420
    # 穗（後面）
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    d.polygon([(470, 760), (554, 760), (600, 960), (424, 960)], fill=255)
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    d.polygon([(512, 690), (560, 735), (512, 780), (464, 735)], fill=255)
    # 繩
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    stroke(d, [(512, 120), (512, 200)], 22, taper=False)
    stroke(d, [(512, 640), (512, 700)], 22, taper=False)
    # 玉璧
    d = ic.region(JADE, JADE_SH)
    R, r = 290, 92
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
    L = ic.ld
    # 內圈線＋穀紋
    L.ellipse([cx - 205, cy - 205, cx + 205, cy + 205], outline=255, width=9)
    rnd = random.Random(3)
    for k in range(10):
        a = k * math.tau / 10 + 0.3
        px, py = cx + math.cos(a) * 250, cy + math.sin(a) * 250
        stroke(L, [(px + math.cos(a + t) * 16, py + math.sin(a + t) * 16) for t in [i * 0.35 for i in range(14)]], 8)
    for k in range(7):
        a = k * math.tau / 7 + rnd.uniform(0, 0.3)
        px, py = cx + math.cos(a) * 150, cy + math.sin(a) * 150
        stroke(L, [(px + math.cos(a + t) * 13, py + math.sin(a + t) * 13) for t in [i * 0.4 for i in range(12)]], 7)
    # 穗線
    for x in (470, 500, 530, 560):
        stroke(L, [(x + (x - 512) * 0.1, 790), (x + (x - 512) * 0.4, 945)], 6)
    H = ic.hd
    stroke(H, [(cx + math.cos(a) * 255, cy + math.sin(a) * 255) for a in [math.pi * (1.05 + i * 0.03) for i in range(14)]], 30)
    stroke(H, [(cx + math.cos(a) * 125, cy + math.sin(a) * 125) for a in [math.pi * (1.1 + i * 0.03) for i in range(10)]], 14)
    ic.glints += [(330, 230, 80)]
    return ic


def icon_book() -> Icon:
    """秘笈：線裝書（略斜），朱砂題簽"""
    ic = Icon()
    # 書頁（後面）
    d = ic.region(PAPER_HI, BEIGE_SH)
    d.polygon([(250, 230), (810, 190), (850, 820), (290, 870)], fill=255)
    # 封面
    d = ic.region(TEAL, (40, 68, 76))
    d.polygon([(200, 200), (770, 160), (810, 790), (240, 840)], fill=255)
    # 題簽
    d = ic.region(PAPER_HI, BEIGE_SH, accent=True)
    d.polygon([(610, 220), (700, 214), (728, 560), (638, 566)], fill=255)
    L = ic.ld
    # 書脊線＋訂線
    stroke(L, [(290, 195), (330, 835)], 10, taper=False)
    for y in (250, 420, 590, 760):
        yy = y + (y - 200) * 0.0
        stroke(L, [(205 + (y - 200) * 0.063, yy), (300 + (y - 200) * 0.063, yy - 6)], 9, taper=False)
    # 題簽字（兩橫一豎當「秘笈」意象）
    stroke(L, [(650, 280), (690, 277)], 10)
    stroke(L, [(653, 340), (694, 337)], 10)
    stroke(L, [(672, 380), (684, 520)], 10)
    H = ic.hd
    stroke(H, [(360, 230), (560, 214)], 18)
    return ic


def icon_blood() -> Icon:
    """氣血：血滴"""
    ic = Icon()
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    cx, cy, r = 512, 610, 240
    pts = [(512, 140)]
    for i in range(0, 181):
        a = math.radians(-30 + i * (240 / 180))
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    pts.reverse()
    d.polygon(pts, fill=255)
    L = ic.ld
    stroke(L, curve((420, 700), (470, 780), (580, 770)), 12)
    H = ic.hd
    stroke(H, curve((380, 560), (390, 470), (450, 380)), 30)
    ic.glints += [(400, 640, 34)]
    return ic


def rot(pts, ang: float, cx: float, cy: float):
    c, s = math.cos(ang), math.sin(ang)
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in pts]


def ellipse_pts(cx, cy, rx, ry, n: int = 48):
    return [(cx + math.cos(a) * rx, cy + math.sin(a) * ry) for a in [i * math.tau / n for i in range(n)]]


def icon_jade_paid() -> Icon:
    """付費玉石：金托鑲青玉（同免費玉璧分得開）"""
    ic = Icon()
    cx, cy = 512, 500
    d = ic.region(GOLD, GOLD_DK)
    star = []
    for i in range(16):
        a = i * math.tau / 16 - math.pi / 2
        r = 400 if i % 2 == 0 else 300
        star.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    d.polygon(star, fill=255)
    d = ic.region(JADE, JADE_SH)
    gem = ellipse_pts(cx, cy, 250, 290, 8)
    d.polygon(rot([(x - cx, y - cy) for x, y in gem], math.pi / 8, cx, cy), fill=255)
    L = ic.ld
    inner = rot([(x - cx, y - cy) for x, y in ellipse_pts(cx, cy, 130, 150, 8)], math.pi / 8, cx, cy)
    outer = rot([(x - cx, y - cy) for x, y in gem], math.pi / 8, cx, cy)
    stroke(L, inner + [inner[0]], 8, taper=False)
    for a, b in zip(inner, outer):
        stroke(L, [a, b], 7)
    H = ic.hd
    stroke(H, [(400, 330), (450, 290), (520, 270)], 26)
    ic.glints += [(640, 330, 90), (330, 640, 40)]
    return ic


def icon_pouch() -> Icon:
    """奇遇：錦囊"""
    ic = Icon()
    d = ic.region(CINNABAR, CINNABAR_DK)
    d.polygon([(370, 170), (450, 230), (512, 180), (574, 230), (654, 170), (620, 300), (404, 300)], fill=255)
    d = ic.region(CINNABAR, CINNABAR_DK)
    body = [(420, 320)] + curve((420, 320), (180, 520), (230, 760)) + curve((230, 760), (330, 900), (512, 900))
    body += curve((512, 900), (694, 900), (794, 760)) + curve((794, 760), (844, 520), (604, 320))
    d.polygon(body, fill=255)
    d = ic.region(GOLD, GOLD_DK, accent=True)
    d.polygon([(390, 290), (634, 290), (624, 350), (400, 350)], fill=255)
    d = ic.region(GOLD, GOLD_DK, accent=True)
    stroke(d, curve((560, 330), (700, 360), (720, 520)), 26)
    stroke(d, curve((560, 330), (650, 420), (620, 560)), 22)
    # 金菱形繡紋
    d = ic.region(GOLD, GOLD_DK, accent=True)
    d.polygon([(512, 520), (610, 640), (512, 760), (414, 640)], fill=255)
    L = ic.ld
    stroke(L, [(512, 570), (512, 710)], 9)
    stroke(L, [(462, 640), (562, 640)], 9)
    stroke(L, curve((300, 800), (512, 870), (724, 800)), 9)
    H = ic.hd
    stroke(H, curve((330, 520), (330, 440), (400, 380)), 30)
    ic.glints += [(700, 480, 60)]
    return ic


def _sword(ic: Icon, ang: float, cx: float, cy: float, grip) -> None:
    parts = [
        ([(-36, 130), (-36, -350), (0, -430), (36, -350), (36, 130)], SILVER, SILVER_SH),
        ([(-24, 160), (24, 160), (24, 320), (-24, 320)], grip, tuple(int(v * 0.65) for v in grip)),
        ([(-92, 120), (92, 120), (70, 168), (-70, 168)], GOLD, GOLD_DK),
        (ellipse_pts(0, 345, 34, 34, 20), GOLD, GOLD_DK),
    ]
    for pts, base, shade in parts:
        ic.region(base, shade).polygon(rot(pts, ang, cx, cy), fill=255)
    stroke(ic.ld, rot([(0, 100), (0, -360)], ang, cx, cy), 7)


def icon_swords() -> Icon:
    """論劍：交叉雙劍"""
    ic = Icon()
    _sword(ic, -math.pi / 4, 520, 470, WOOD)
    _sword(ic, math.pi / 4, 504, 470, TEAL)
    # 劍穗
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    for x0, y0, sgn in ((268, 728, -1), (756, 728, 1)):
        stroke(d, curve((x0, y0), (x0 + sgn * 30, y0 + 80), (x0 + sgn * 10, y0 + 180)), 30)
    H = ic.hd
    stroke(H, rot([(-8, 60), (-8, -320)], -math.pi / 4, 520, 470), 10)
    stroke(H, rot([(-8, 60), (-8, -320)], math.pi / 4, 504, 470), 10)
    ic.glints += [(250, 230, 70)]
    return ic


def icon_scroll() -> Icon:
    """武學：捲起嘅武功卷軸＋朱砂絲帶"""
    ic = Icon()
    ang = -math.pi / 5
    cx, cy = 512, 512
    d = ic.region(PAPER_HI, BEIGE_SH)
    d.polygon(rot([(-330, -110), (330, -110), (330, 110), (-330, 110)], ang, cx, cy), fill=255)
    for x in (-350, 350):
        ic.region(WOOD, (50, 38, 32)).polygon(rot([(x - 34, -130), (x + 34, -130), (x + 34, 130), (x - 34, 130)], ang, cx, cy), fill=255)
        ic.region(GOLD, GOLD_DK).polygon(rot(ellipse_pts(x + (40 if x > 0 else -40), 0, 34, 60, 20), ang, cx, cy), fill=255)
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    d.polygon(rot([(-40, -120), (40, -120), (40, 120), (-40, 120)], ang, cx, cy), fill=255)
    stroke(d, rot(curve((20, 110), (60, 230), (10, 330)), ang, cx, cy), 34)
    stroke(d, rot(curve((-10, 110), (-80, 220), (-60, 320)), ang, cx, cy), 30)
    L = ic.ld
    for y in (-60, 0, 60):
        stroke(L, rot([(-280, y), (-90, y)], ang, cx, cy), 8)
        stroke(L, rot([(90, y), (280, y)], ang, cx, cy), 8)
    H = ic.hd
    stroke(H, rot([(-300, -85), (-100, -85)], ang, cx, cy), 16)
    return ic


def icon_tablet() -> Icon:
    """祖祠：祖先牌位"""
    ic = Icon()
    lacquer = (128, 52, 40)
    d = ic.region(WOOD, (50, 38, 32))
    d.polygon([(250, 900), (774, 900), (730, 800), (294, 800)], fill=255)
    d = ic.region(lacquer, (82, 30, 24))
    d.polygon([(340, 810), (684, 810), (684, 300), (340, 300)], fill=255)
    d = ic.region(GOLD, GOLD_DK)
    crown = [(300, 320)] + curve((300, 320), (320, 180), (420, 200)) + curve((420, 200), (470, 110), (512, 110))
    crown += curve((512, 110), (554, 110), (604, 200)) + curve((604, 200), (704, 180), (724, 320))
    d.polygon(crown, fill=255)
    d = ic.region(GOLD, GOLD_DK)
    d.polygon([(450, 360), (574, 360), (574, 760), (450, 760)], fill=255)
    L = ic.ld
    for y in (420, 500, 580, 660):
        stroke(L, [(482, y), (542, y)], 10)
    stroke(L, [(512, 400), (512, 720)], 9)
    stroke(L, curve((420, 240), (512, 190), (604, 240)), 9)
    H = ic.hd
    stroke(H, [(370, 340), (370, 760)], 18)
    ic.glints += [(700, 230, 60)]
    return ic


def icon_qi() -> Icon:
    """內力：青色真氣火焰＋旋紋"""
    ic = Icon()
    d = ic.region((96, 160, 170), (48, 96, 108))
    pts = [(512, 120)] + curve((512, 120), (600, 300), (700, 340)) + curve((700, 340), (680, 260), (720, 220))
    pts += curve((720, 220), (850, 420), (800, 620)) + curve((800, 620), (740, 880), (512, 900))
    pts += curve((512, 900), (284, 880), (224, 620)) + curve((224, 620), (190, 450), (300, 330))
    pts += curve((300, 330), (320, 420), (380, 430)) + curve((380, 430), (380, 260), (512, 120))
    d.polygon(pts, fill=255)
    L = ic.ld
    cx, cy = 512, 660
    stroke(L, [(cx + math.cos(a) * (150 - a * 13), cy + math.sin(a) * (150 - a * 13)) for a in [i * 0.25 for i in range(40)]], 13)
    H = ic.hd
    stroke(H, curve((300, 560), (300, 450), (370, 400)), 26)
    ic.glints += [(650, 300, 50)]
    return ic


def icon_tea() -> Icon:
    """疲勞：熱茶（歇息）"""
    ic = Icon()
    d = ic.region(PAPER_HI, BEIGE_SH)
    d.polygon(ellipse_pts(512, 830, 330, 70), fill=255)
    d = ic.region(PAPER_HI, BEIGE_SH)
    cup = [(230, 470), (794, 470)] + curve((794, 470), (780, 790), (512, 810)) + curve((512, 810), (244, 790), (230, 470))
    d.polygon(cup, fill=255)
    d = ic.region(TEAL, (40, 68, 76))
    band = [(244, 540), (780, 540)] + curve((780, 540), (775, 610), (765, 640)) + [(259, 640)] + curve((259, 640), (249, 610), (244, 540))
    d.polygon(band, fill=255)
    d = ic.region((150, 120, 70), (110, 84, 46))
    d.polygon(ellipse_pts(512, 470, 282, 46), fill=255)
    L = ic.ld
    stroke(L, ellipse_pts(512, 470, 282, 46) + [ellipse_pts(512, 470, 282, 46)[0]], 9, taper=False)
    F = ic.fd
    for x in (420, 520, 620):
        stroke(F, [(x + 26 * math.sin(t * 0.06), 400 - t) for t in range(0, 230, 6)], 14)
    H = ic.hd
    stroke(H, curve((290, 660), (300, 740), (380, 770)), 22)
    return ic


def icon_fan() -> Icon:
    """設定：摺扇（同參考圖「選單」一樣）"""
    ic = Icon()
    px, py = 512, 800
    a0, a1 = math.radians(-160), math.radians(-20)
    d = ic.region(PAPER_HI, BEIGE_SH)
    outer = [(px + math.cos(a) * 560, py + math.sin(a) * 560) for a in [a0 + (a1 - a0) * i / 40 for i in range(41)]]
    inner = [(px + math.cos(a) * 190, py + math.sin(a) * 190) for a in [a1 - (a1 - a0) * i / 40 for i in range(41)]]
    d.polygon(outer + inner, fill=255)
    d = ic.region(TEAL, (40, 68, 76))
    band = [(px + math.cos(a) * 470, py + math.sin(a) * 470) for a in [a1 - (a1 - a0) * i / 40 for i in range(41)]]
    d.polygon(outer + band, fill=255)
    for k in range(9):
        a = a0 + (a1 - a0) * k / 8
        ic.region(WOOD, (50, 38, 32)).polygon(
            [(px + math.cos(a + 0.02) * 40, py + math.sin(a + 0.02) * 40), (px + math.cos(a) * 200, py + math.sin(a) * 200),
             (px + math.cos(a - 0.02) * 40, py + math.sin(a - 0.02) * 40)], fill=255)
    ic.region(GOLD, GOLD_DK).polygon(ellipse_pts(px, py, 36, 36, 20), fill=255)
    L = ic.ld
    for k in range(1, 16):
        a = a0 + (a1 - a0) * k / 16
        stroke(L, [(px + math.cos(a) * 200, py + math.sin(a) * 200), (px + math.cos(a) * 550, py + math.sin(a) * 550)], 6, taper=False)
    # 扇面月
    ic.region(GOLD, GOLD_DK, accent=True).polygon(ellipse_pts(640, 470, 70, 70, 30), fill=255)
    return ic


def icon_house() -> Icon:
    """鎮居：瓦屋"""
    ic = Icon()
    d = ic.region(PAPER_HI, BEIGE_SH)
    d.polygon([(250, 470), (774, 470), (774, 820), (250, 820)], fill=255)
    d = ic.region(WOOD, (50, 38, 32))
    d.polygon([(200, 820), (824, 820), (850, 880), (174, 880)], fill=255)
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    d.polygon([(260, 470), (300, 470), (300, 820), (260, 820)], fill=255)
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    d.polygon([(724, 470), (764, 470), (764, 820), (724, 820)], fill=255)
    d = ic.region(WOOD, (50, 38, 32))
    d.polygon([(430, 580), (594, 580), (594, 820), (430, 820)], fill=255)
    d = ic.region((76, 90, 98), (44, 52, 58))
    roof = [(100, 470)] + curve((100, 470), (180, 470), (240, 400)) + [(512, 210)]
    roof += [(784, 400)] + curve((784, 400), (844, 470), (924, 470)) + [(800, 500), (224, 500)]
    d.polygon(roof, fill=255)
    L = ic.ld
    for x in range(270, 760, 50):
        stroke(L, [(512 + (x - 512) * 0.55, 270 + abs(x - 512) * 0.15), (x, 470)], 6)
    stroke(L, [(512, 580), (512, 820)], 8)
    H = ic.hd
    stroke(H, curve((240, 410), (360, 320), (480, 240)), 18)
    return ic


def icon_hat() -> Icon:
    """人物：斗笠＋朱紅繫帶"""
    ic = Icon()
    straw, straw_sh = (214, 186, 126), (160, 128, 76)
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    # 下巴繫帶：一條 U 形
    stroke(d, curve((410, 650), (512, 880), (614, 650)), 22, taper=False)
    d = ic.region(straw, straw_sh)
    hat = [(512, 170)] + curve((512, 170), (700, 440), (930, 600)) + curve((930, 600), (512, 720), (94, 600)) + curve((94, 600), (324, 440), (512, 170))
    d.polygon(hat, fill=255)
    d = ic.region(straw, straw_sh)
    d.polygon(ellipse_pts(512, 190, 40, 30, 20), fill=255)
    L = ic.ld
    for k in range(-5, 6):
        stroke(L, [(512 + k * 6, 210), (512 + k * 80, 640 - abs(k) * 6)], 7)
    stroke(L, curve((150, 560), (512, 660), (874, 560)), 8)
    H = ic.hd
    stroke(H, curve((260, 520), (350, 410), (470, 260)), 22)
    return ic


def icon_banner() -> Icon:
    """江湖：酒旗"""
    ic = Icon()
    d = ic.region(WOOD, (50, 38, 32))
    d.polygon([(268, 120), (310, 120), (310, 920), (268, 920)], fill=255)
    d = ic.region(WOOD, (50, 38, 32))
    d.polygon([(290, 180), (800, 180), (800, 216), (290, 216)], fill=255)
    d = ic.region(PAPER_HI, BEIGE_SH)
    flag = [(340, 216), (760, 216), (770, 700), (700, 640), (630, 720), (560, 650), (490, 730), (420, 660), (350, 720)]
    d.polygon(flag, fill=255)
    d = ic.region(TEAL, (40, 68, 76))
    d.polygon([(340, 216), (760, 216), (760, 290), (340, 290)], fill=255)
    d = ic.region(CINNABAR, CINNABAR_DK, accent=True)
    d.polygon(ellipse_pts(555, 470, 120, 120, 40), fill=255)
    L = ic.ld
    # 「酒」意象：三點水＋酉
    for y in (400, 460, 525):
        stroke(L, [(470, y), (500, y + 14)], 14)
    stroke(L, [(520, 400), (625, 400)], 11)
    stroke(L, [(530, 420), (530, 545), (615, 545), (615, 420), (530, 420)], 10, taper=False)
    stroke(L, [(572, 400), (572, 490)], 10)
    stroke(L, [(530, 495), (615, 495)], 9)
    H = ic.hd
    stroke(H, [(370, 320), (370, 640)], 16)
    return ic


def icon_censer() -> Icon:
    """修煉：香爐＋輕煙"""
    ic = Icon()
    bronze, bronze_sh = (176, 136, 72), (112, 80, 40)
    for x0, x1 in ((330, 380), (644, 694), (487, 537)):
        ic.region(bronze, bronze_sh).polygon([(x0, 760), (x1, 760), (x1 - 10 + (x0 - 487) * 0.1, 900), (x0 + 10 + (x0 - 487) * 0.1, 900)], fill=255)
    d = ic.region(bronze, bronze_sh)
    bowl = [(230, 520), (794, 520)] + curve((794, 520), (790, 800), (512, 810)) + curve((512, 810), (234, 800), (230, 520))
    d.polygon(bowl, fill=255)
    for sx in (-1, 1):
        d = ic.region(bronze, bronze_sh)
        x = 512 + sx * 230
        d.polygon([(x, 520), (x + sx * 70, 400), (x + sx * 110, 420), (x + sx * 50, 540)], fill=255)
    d = ic.region(GOLD, GOLD_DK)
    d.polygon(ellipse_pts(512, 520, 300, 50), fill=255)
    L = ic.ld
    stroke(L, curve((280, 640), (512, 700), (744, 640)), 9)
    for cx in (400, 512, 624):
        stroke(L, [(cx + math.cos(a) * 26, 735 + math.sin(a) * 26) for a in [i * 0.4 for i in range(16)]], 7)
    F = ic.fd
    for x, ph in ((470, 0), (560, 1.6)):
        stroke(F, [(x + 40 * math.sin(t * 0.03 + ph), 470 - t) for t in range(0, 330, 6)], 13)
    H = ic.hd
    stroke(H, curve((290, 580), (300, 690), (380, 760)), 22)
    ic.glints += [(720, 560, 46)]
    return ic


ICONS = {
    'silver': ('銀兩', icon_silver),
    'jade': ('玉石', icon_jade),
    'book': ('秘笈閣', icon_book),
    'blood': ('氣血', icon_blood),
    'jade-paid': ('付費玉石', icon_jade_paid),
    'pouch': ('奇遇', icon_pouch),
    'swords': ('論劍', icon_swords),
    'scroll': ('武學', icon_scroll),
    'tablet': ('祖祠', icon_tablet),
    'qi': ('內力', icon_qi),
    'tea': ('疲勞', icon_tea),
    'fan': ('設定', icon_fan),
    'house': ('鎮居', icon_house),
    'hat': ('人物', icon_hat),
    'banner': ('江湖', icon_banner),
    'censer': ('修煉', icon_censer),
}
BOARD_KEYS = ['silver', 'jade', 'book', 'blood']


# ───────── 上色 ─────────

def glint(img: Image.Image, x: float, y: float, r: float) -> None:
    """四角閃光"""
    m = blank()
    d = ImageDraw.Draw(m)
    w = r * 0.16
    d.polygon([(x, y - r), (x + w, y - w), (x + r, y), (x + w, y + w), (x, y + r), (x - w, y + w), (x - r, y), (x - w, y - w)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(2))
    img.alpha_composite(Image.merge('RGBA', (*[Image.new('L', (S, S), 255)] * 3, m)))


def paint(ic: Icon, style: str, seed: int = 7) -> Image.Image:
    """A 米白線描 / B 設色（寶箱同級）"""
    out = np.zeros((S, S, 4), np.float32)
    union = np.zeros((S, S), np.float32)
    grain = (noise_field(seed + 11, 6) * 0.035)[..., None]
    for i, (m, base, shade, accent) in enumerate(ic.regions):
        a = arr(m)
        if style == 'A' and not accent:
            base, shade = BEIGE, BEIGE_SH
        col = np.zeros((S, S, 3), np.float32) + np.array(base, np.float32) / 255
        sh = rim(a, 70, (1, 1))
        col = col * (1 - sh[..., None]) + np.array(shade, np.float32)[None, None] / 255 * sh[..., None]
        if style == 'B':
            lit = rim(a, 40, (-1, -1)) * 0.35
            col = col * (1 - lit[..., None]) + lit[..., None]
        col = np.clip(col + grain, 0, 1)
        out[..., :3] = out[..., :3] * (1 - a[..., None]) + col * a[..., None]
        out[..., 3] = np.maximum(out[..., 3], a)
        union = np.maximum(union, a)
        # 每個部件之間都有幼框，似參考圖
        edge = rough_outline(m, 7, seed + i) * 0.9
        out[..., :3] = out[..., :3] * (1 - edge[..., None]) + np.array(INK) / 255 * edge[..., None]
        out[..., 3] = np.maximum(out[..., 3], edge)
    lines = arr(ic.lines.filter(ImageFilter.GaussianBlur(1.2))) * union
    out[..., :3] = out[..., :3] * (1 - lines[..., None]) + np.array(INK) / 255 * lines[..., None]
    if style == 'B':
        hl = arr(ic.highlights.filter(ImageFilter.GaussianBlur(4))) * union * 0.85
        out[..., :3] = out[..., :3] * (1 - hl[..., None]) + hl[..., None]
    # 外框：成個剪影一圈粗框
    outer = rough_outline(to_img(union), 16, seed)
    out[..., :3] = out[..., :3] * (1 - outer[..., None]) + np.array(INK) / 255 * outer[..., None]
    out[..., 3] = np.maximum(out[..., 3], outer)
    free = arr(ic.free.filter(ImageFilter.GaussianBlur(1.2)))
    out[..., :3] = out[..., :3] * (1 - free[..., None]) + np.array(INK) / 255 * free[..., None]
    out[..., 3] = np.maximum(out[..., 3], free)
    img = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA')
    if style == 'B':
        for g in ic.glints:
            glint(img, *g)
    return img


def medallion(icon: Image.Image, seed: int = 5) -> Image.Image:
    """C：宣紙圓章，深啡雙圈＋金幼線＋左右菱形"""
    base = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    c, R = S / 2, S * 0.40
    disc = blank()
    ImageDraw.Draw(disc).ellipse([c - R, c - R, c + R, c + R], fill=255)
    for x in (c - R - 30, c + R + 30):
        ImageDraw.Draw(disc).polygon([(x - 60, c), (x, c - 46), (x + 60, c), (x, c + 46)], fill=255)
    da = arr(disc)
    col = np.zeros((S, S, 3), np.float32) + np.array(PAPER, np.float32) / 255
    vign = np.clip(1 - rim(da, 120, (1, 1)) * 0.25, 0, 1)
    col *= vign[..., None]
    col = np.clip(col + (noise_field(seed, 5) * 0.03)[..., None], 0, 1)
    ring = rough_outline(disc, 26, seed)
    col = col * (1 - ring[..., None]) + np.array(WOOD) / 255 * ring[..., None]
    gold = blank()
    ImageDraw.Draw(gold).ellipse([c - R + 34, c - R + 34, c + R - 34, c + R - 34], outline=255, width=10)
    ga = arr(gold.filter(ImageFilter.GaussianBlur(1.5)))
    col = col * (1 - ga[..., None]) + np.array(GOLD_DK) / 255 * ga[..., None]
    a = np.maximum(da, ring)
    base = Image.fromarray((np.dstack([col, a]) * 255).astype(np.uint8), 'RGBA')
    small = icon.resize((int(S * 0.62),) * 2, Image.LANCZOS)
    o = (S - small.width) // 2
    base.alpha_composite(small, (o, o))
    return base


def render(key: str, style: str) -> Image.Image:
    ic = ICONS[key][1]()
    if style == 'C':
        return medallion(paint(ic, 'B'))
    return paint(ic, style)


# ───────── style board ─────────

def board(path: Path) -> None:
    font = lambda n: ImageFont.truetype(FONT, n)
    W, H = 1500, 1960
    bd = Image.new('RGB', (W, H), PAPER_HI)
    d = ImageDraw.Draw(bd)
    d.text((40, 30), 'UI icon 統一 · style board（揀一個方案）', fill=INK, font=font(46))
    d.text((40, 92), '參考：玩家截圖頂欄 icon（已去掉彈窗遮罩提亮）', fill=WOOD, font=font(26))
    if REF.exists():
        ref = Image.open(REF).convert('RGB').crop((510, 110, 1190, 230))
        a = np.clip((np.asarray(ref).astype(float) - 20) * 3.2, 0, 255).astype(np.uint8)
        ref = Image.fromarray(a).resize((1020, 180), Image.LANCZOS)
        bd.paste(ref, (40, 135))
        d.rectangle([40, 135, 1060, 315], outline=CINNABAR, width=3)
    names = {'A': 'A 米白線描（同參考頂欄一樣）', 'B': 'B 設色＋閃光（寶箱同級）', 'C': 'C 徽章（B 放入宣紙圓章，做按鈕）'}
    y = 350
    for style in 'ABC':
        d.text((40, y), names[style], fill=CINNABAR, font=font(34))
        y += 52
        x = 40
        for key in BOARD_KEYS:
            label = ICONS[key][0]
            im = render(key, style)
            big = im.resize((220, 220), Image.LANCZOS)
            bd.paste(big, (x, y), big)
            d.text((x + 110 - len(label) * 14, y + 226), label, fill=INK, font=font(28))
            x += 250
        # 實際大小（深底＋淺底）
        d.rectangle([1050, y, 1460, y + 260], fill=(52, 42, 36))
        d.rectangle([1050, y + 130, 1460, y + 260], fill=PAPER)
        for row, by in enumerate((y + 20, y + 150)):
            xx = 1070
            for key in BOARD_KEYS:
                im = render(key, style)
                for sz in (48, 24):
                    s = im.resize((sz, sz), Image.LANCZOS)
                    bd.paste(s, (xx, by + (48 - sz) // 2), s)
                    xx += sz + 12
        d.text((1050, y + 268), '實際大小 48／24px（深底／紙底）', fill=WOOD, font=font(20))
        y += 330
    # 情境：頂欄錢包、快捷鈕
    d.text((40, y), '情境示意（實際手機大小 ×2）', fill=CINNABAR, font=font(34))
    y += 56
    for i, style in enumerate('ABC'):
        x0 = 40 + i * 480
        d.rectangle([x0, y, x0 + 450, y + 300], fill=PAPER, outline=(200, 186, 160), width=2)
        d.text((x0 + 14, y + 10), style, fill=CINNABAR, font=font(30))
        for k, (key, num) in enumerate((('silver', '107'), ('jade', '600'))):
            cy = y + 60 + k * 70
            d.rounded_rectangle([x0 + 60, cy, x0 + 330, cy + 56], radius=28, fill=PAPER_HI, outline=WOOD, width=3)
            ic = render(key, 'B' if style == 'C' else style).resize((64, 64), Image.LANCZOS)
            bd.paste(ic, (x0 + 50, cy - 4), ic)
            d.text((x0 + 220, cy + 10), num, fill=INK, font=font(34))
        for k, (key, label) in enumerate((('book', '秘笈閣'), ('jade', '奇遇'), ('blood', '武學'))):
            cx = x0 + 70 + k * 140
            ic = render(key, 'C' if style == 'C' else style).resize((96, 96), Image.LANCZOS)
            if style != 'C':
                d.ellipse([cx - 4, y + 200 - 4, cx + 96 + 4, y + 200 + 96 + 4], fill=PAPER_HI, outline=WOOD, width=4)
                ic = ic.resize((80, 80), Image.LANCZOS)
                bd.paste(ic, (cx + 8, y + 208), ic)
            else:
                bd.paste(ic, (cx, y + 200), ic)
        y += 0
    d.text((40, H - 50), '註：快捷鈕情境入面「奇遇」「武學」暫借玉石／氣血圖示示意排版；揀定方案後逐個畫。', fill=WOOD, font=font(22))
    bd.save(path)
    print(path)


def sheet(path: Path, style: str) -> None:
    """全套 icon 一覽（128／48／24px，紙底＋深底）"""
    font = ImageFont.truetype(FONT, 24)
    keys = list(ICONS)
    cols = 4
    cw, chh = 360, 300
    W, H = cols * cw + 40, (len(keys) + cols - 1) // cols * chh + 40
    bd = Image.new('RGB', (W, H), PAPER_HI)
    d = ImageDraw.Draw(bd)
    for i, key in enumerate(keys):
        x, y = 20 + (i % cols) * cw, 20 + (i // cols) * chh
        im = render(key, style)
        big = im.resize((180, 180), Image.LANCZOS)
        bd.paste(big, (x, y), big)
        d.rectangle([x + 196, y, x + 330, y + 180], fill=(52, 42, 36))
        for k, sz in enumerate((48, 24)):
            s_ = im.resize((sz, sz), Image.LANCZOS)
            bd.paste(s_, (x + 206 + k * 64, y + 20), s_)
            bd.paste(s_, (x + 206 + k * 64, y + 110), s_) if False else None
        d.rectangle([x + 196, y + 90, x + 330, y + 180], fill=PAPER)
        for k, sz in enumerate((48, 24)):
            s_ = im.resize((sz, sz), Image.LANCZOS)
            bd.paste(s_, (x + 206 + k * 64, y + 110), s_)
        d.text((x + 60, y + 196), f'{ICONS[key][0]}  {key}', fill=INK, font=font)
    bd.save(path)
    print(path)


def apply(style: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for key in ICONS:
        im = render(key, style)
        for sz in (64, 128):
            dst = OUT_DIR / f'ui-{key}-{sz}.webp'
            im.resize((sz, sz), Image.LANCZOS).save(dst, 'WEBP', quality=90, method=6)
            print(dst.relative_to(ROOT), dst.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--board')
    ap.add_argument('--style', default='B')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--sheet')
    a = ap.parse_args()
    if a.board:
        board(Path(a.board))
    if a.sheet:
        sheet(Path(a.sheet), a.style)
    if a.apply:
        apply(a.style)
