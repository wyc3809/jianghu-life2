/**
 * 卡面 2D 墨畫（Canvas 2D，唔用 SVG）：
 * - 三層墨色：淡墨設色底、中墨成塊陰影、濃墨點睛（冇卡通面）
 * - 線條分粗細：外輪廓乾筆粗線（有飛白）、內部結構線淡墨幼線
 * - 每樣物件有自己姿態（傾斜）；腳下淡墨投影；背景宣紙＋按屬性分淡墨圖案
 * 解像度＝顯示尺寸 × dpr × 1.5，放大都唔發虛。
 */
import type { CardPattern, IconKind } from './types';
import { OUTLINE } from './grades';

interface IconDef {
  base: string;
  /** 主體輪廓（單位座標 −1..1，y 向下） */
  body: (p: Path2D) => void;
  /** 內部結構線（幼） */
  details?: (c: CanvasRenderingContext2D) => void;
  /** 附件（另一色，例如劍柄） */
  parts?: { color: string; path: (p: Path2D) => void }[];
  /** 姿態：傾斜（弧度） */
  tilt: number;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (k < 0) {
    r *= 1 + k;
    g *= 1 + k;
    b *= 1 + k;
  } else {
    r += (255 - r) * k;
    g += (255 - g) * k;
    b += (255 - b) * k;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function rr(p: Path2D, x: number, y: number, w: number, h: number, r: number) {
  p.roundRect(x, y, w, h, r);
}

const ICONS: Record<IconKind, IconDef> = {
  sword: {
    base: '#D9D5CB',
    body: (p) => {
      p.moveTo(0, -0.95);
      p.lineTo(0.16, -0.72);
      p.lineTo(0.16, 0.3);
      p.lineTo(-0.16, 0.3);
      p.lineTo(-0.16, -0.72);
      p.closePath();
    },
    parts: [
      { color: '#B08A3E', path: (p) => rr(p, -0.46, 0.28, 0.92, 0.16, 0.07) },
      { color: '#5A4636', path: (p) => rr(p, -0.1, 0.43, 0.2, 0.38, 0.05) },
      { color: '#B08A3E', path: (p) => p.arc(0, 0.88, 0.12, 0, Math.PI * 2) },
    ],
    details: (c) => {
      c.moveTo(0, -0.7);
      c.lineTo(0, 0.2);
    },
    tilt: 0.35,
  },
  blade: {
    base: '#D4D0C6',
    body: (p) => {
      p.moveTo(-0.2, 0.25);
      p.lineTo(-0.2, -0.7);
      p.quadraticCurveTo(0.1, -1.0, 0.42, -0.8);
      p.quadraticCurveTo(0.3, -0.2, 0.22, 0.25);
      p.closePath();
    },
    parts: [
      { color: '#A33A32', path: (p) => rr(p, -0.34, 0.24, 0.7, 0.14, 0.06) },
      { color: '#2E2A25', path: (p) => rr(p, -0.1, 0.36, 0.22, 0.5, 0.06) },
    ],
    details: (c) => {
      c.moveTo(-0.08, -0.62);
      c.quadraticCurveTo(0.12, -0.8, 0.3, -0.72);
    },
    tilt: -0.3,
  },
  spear: {
    base: '#DCD8CE',
    body: (p) => {
      p.moveTo(0, -0.98);
      p.lineTo(0.28, -0.46);
      p.lineTo(0.1, -0.36);
      p.lineTo(-0.1, -0.36);
      p.lineTo(-0.28, -0.46);
      p.closePath();
    },
    parts: [
      { color: '#A33A32', path: (p) => p.ellipse(0, -0.28, 0.22, 0.1, 0, 0, Math.PI * 2) },
      { color: '#7A5E42', path: (p) => rr(p, -0.07, -0.22, 0.14, 1.12, 0.05) },
    ],
    details: (c) => {
      c.moveTo(0, -0.86);
      c.lineTo(0, -0.46);
    },
    tilt: 0.5,
  },
  staff: {
    base: '#8C6A4A',
    body: (p) => {
      rr(p, -0.12, -0.9, 0.24, 1.8, 0.12);
    },
    parts: [
      { color: '#B08A3E', path: (p) => rr(p, -0.16, -0.62, 0.32, 0.12, 0.05) },
      { color: '#B08A3E', path: (p) => rr(p, -0.16, 0.5, 0.32, 0.12, 0.05) },
    ],
    details: (c) => {
      c.moveTo(-0.04, -0.3);
      c.lineTo(-0.04, 0.3);
    },
    tilt: -0.55,
  },
  whip: {
    base: '#6E5A48',
    body: (p) => {
      p.moveTo(-0.5, 0.75);
      p.bezierCurveTo(-0.9, 0.1, 0.1, -0.2, -0.2, -0.6);
      p.bezierCurveTo(-0.35, -0.85, 0.3, -1.0, 0.6, -0.7);
      p.bezierCurveTo(0.2, -0.8, -0.1, -0.7, 0.0, -0.52);
      p.bezierCurveTo(0.3, -0.1, -0.55, 0.1, -0.34, 0.72);
      p.closePath();
    },
    parts: [{ color: '#2E2A25', path: (p) => rr(p, -0.62, 0.62, 0.3, 0.3, 0.08) }],
    tilt: 0.1,
  },
  bow: {
    base: '#8C6A4A',
    body: (p) => {
      p.moveTo(-0.2, -0.9);
      p.quadraticCurveTo(0.75, 0, -0.2, 0.9);
      p.lineTo(-0.06, 0.9);
      p.quadraticCurveTo(0.9, 0, -0.06, -0.9);
      p.closePath();
    },
    parts: [{ color: '#EFE7D6', path: (p) => rr(p, -0.24, -0.9, 0.04, 1.8, 0.02) }],
    tilt: 0.2,
  },
  hidden: {
    base: '#BDB8AE',
    body: (p) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 0.85 : 0.3;
        p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      p.closePath();
    },
    parts: [{ color: '#2E2A25', path: (p) => p.arc(0, 0, 0.1, 0, Math.PI * 2) }],
    tilt: 0.4,
  },
  armor: {
    base: '#76827F',
    body: (p) => {
      p.moveTo(-0.3, -0.8);
      p.quadraticCurveTo(0, -0.6, 0.3, -0.8);
      p.lineTo(0.78, -0.5);
      p.lineTo(0.62, -0.1);
      p.lineTo(0.5, -0.2);
      p.lineTo(0.52, 0.72);
      p.quadraticCurveTo(0, 0.92, -0.52, 0.72);
      p.lineTo(-0.5, -0.2);
      p.lineTo(-0.62, -0.1);
      p.lineTo(-0.78, -0.5);
      p.closePath();
    },
    parts: [{ color: '#B08A3E', path: (p) => rr(p, -0.52, 0.28, 1.04, 0.14, 0.05) }],
    details: (c) => {
      c.moveTo(0, -0.62);
      c.lineTo(0, 0.25);
      c.moveTo(-0.3, 0.55);
      c.lineTo(0.3, 0.55);
    },
    tilt: 0,
  },
  accessory: {
    base: '#9CB8A0',
    body: (p) => {
      p.arc(0, 0.15, 0.62, 0, Math.PI * 2);
    },
    parts: [
      { color: '#A33A32', path: (p) => rr(p, -0.05, -0.95, 0.1, 0.45, 0.04) },
      { color: '#A33A32', path: (p) => p.arc(0, -0.5, 0.1, 0, Math.PI * 2) },
    ],
    details: (c) => {
      c.moveTo(0.18, 0.15);
      c.arc(0, 0.15, 0.18, 0, Math.PI * 2);
    },
    tilt: -0.12,
  },
  scroll: {
    base: '#EFE3C4',
    body: (p) => {
      rr(p, -0.6, -0.6, 1.2, 1.2, 0.08);
    },
    parts: [
      { color: '#7A5E42', path: (p) => rr(p, -0.72, -0.76, 1.44, 0.2, 0.1) },
      { color: '#7A5E42', path: (p) => rr(p, -0.72, 0.56, 1.44, 0.2, 0.1) },
      { color: '#A33A32', path: (p) => rr(p, 0.28, -0.45, 0.16, 0.5, 0.03) },
    ],
    details: (c) => {
      for (const y of [-0.35, -0.2]) {
        c.moveTo(-0.42, y);
        c.lineTo(0.1, y);
      }
    },
    tilt: 0.08,
  },
  pill: {
    base: '#B8483C',
    body: (p) => {
      p.arc(0, 0.05, 0.72, 0, Math.PI * 2);
    },
    parts: [{ color: '#C9A24A', path: (p) => p.ellipse(0, -0.62, 0.3, 0.12, 0, 0, Math.PI * 2) }],
    tilt: 0,
  },
  coin: {
    // 銅錢：外圓內方（evenodd 挖孔）
    base: '#B89455',
    body: (p) => {
      p.arc(0, 0, 0.8, 0, Math.PI * 2);
      p.moveTo(-0.22, -0.22);
      p.lineTo(-0.22, 0.22);
      p.lineTo(0.22, 0.22);
      p.lineTo(0.22, -0.22);
      p.closePath();
    },
    details: (c) => {
      c.moveTo(0.64, 0);
      c.arc(0, 0, 0.64, 0, Math.PI * 2);
      c.moveTo(-0.32, -0.32);
      c.lineTo(0.32, -0.32);
      c.lineTo(0.32, 0.32);
      c.lineTo(-0.32, 0.32);
      c.closePath();
    },
    tilt: 0.15,
  },
  gem: {
    // 威望：朱砂印（印面留白框）
    base: '#A33A32',
    body: (p) => {
      rr(p, -0.72, -0.72, 1.44, 1.44, 0.12);
    },
    details: (c) => {
      c.moveTo(-0.5, -0.5);
      c.lineTo(0.5, -0.5);
      c.lineTo(0.5, 0.5);
      c.lineTo(-0.5, 0.5);
      c.closePath();
      c.moveTo(0, -0.5);
      c.lineTo(0, 0.5);
    },
    tilt: -0.1,
  },
};

function drawPattern(c: CanvasRenderingContext2D, pattern: CardPattern, w: number, h: number, bg: string, fg: string) {
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  c.save();
  // 淡墨圖案（紙上若隱若現）
  c.globalAlpha = 0.13;
  c.strokeStyle = fg;
  c.fillStyle = fg;
  const u = w / 10;
  c.lineWidth = u * 0.35;
  if (pattern === 'blade') {
    // 斜紋
    for (let x = -h; x < w; x += u * 1.6) {
      c.beginPath();
      c.moveTo(x, h);
      c.lineTo(x + h, 0);
      c.stroke();
    }
  } else if (pattern === 'guard') {
    // 龜甲六角
    c.lineWidth = u * 0.18;
    const r = u * 0.9;
    for (let y = 0, row = 0; y < h + r; y += r * 1.5, row++) {
      for (let x = row % 2 ? r * 0.866 : 0; x < w + r; x += r * 1.732) {
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        c.closePath();
        c.stroke();
      }
    }
  } else if (pattern === 'charm') {
    // 圓點
    for (let y = u / 2, row = 0; y < h; y += u * 1.4, row++) {
      for (let x = row % 2 ? u * 0.7 : 0; x < w + u; x += u * 1.4) {
        c.beginPath();
        c.arc(x, y, u * 0.28, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else if (pattern === 'art') {
    // 水波
    c.lineWidth = u * 0.2;
    for (let y = 0; y < h + u; y += u * 1.1) {
      for (let x = 0; x < w + u; x += u * 1.8) {
        c.beginPath();
        c.arc(x, y, u * 0.9, Math.PI, Math.PI * 2);
        c.stroke();
      }
    }
  } else if (pattern === 'elixir') {
    // 氣泡
    c.lineWidth = u * 0.15;
    const bubbles = [
      [0.15, 0.2, 0.7],
      [0.8, 0.15, 0.5],
      [0.3, 0.75, 0.9],
      [0.85, 0.7, 0.6],
      [0.55, 0.45, 0.35],
      [0.1, 0.55, 0.3],
    ];
    for (const [bx, by, br] of bubbles) {
      c.beginPath();
      c.arc(bx! * w, by! * h, br! * u, 0, Math.PI * 2);
      c.stroke();
    }
  } else {
    // 菱格
    c.lineWidth = u * 0.14;
    for (let i = -10; i < 20; i++) {
      c.beginPath();
      c.moveTo(i * u * 1.4, 0);
      c.lineTo(i * u * 1.4 + h, h);
      c.moveTo(i * u * 1.4, h);
      c.lineTo(i * u * 1.4 + h, 0);
      c.stroke();
    }
  }
  c.restore();
}

export interface DrawArtOptions {
  kind: IconKind;
  pattern?: CardPattern;
  /** 背景主色（無 pattern＝透明底，只畫物件） */
  bg?: string;
  fg?: string;
  /** 物件主色覆寫（例如寶石跟品階） */
  tint?: string;
  cssSize: number;
  dpr?: number;
  /** 投影 */
  shadow?: boolean;
}

/** 畫一張卡面圖／圖示到新 canvas，回傳 canvas */
/** 乾筆紋理：橫向斷續墨絲（當 strokeStyle 用 → 線條有飛白） */
let dryBrush: HTMLCanvasElement | null = null;
function dryBrushPattern(c: CanvasRenderingContext2D): CanvasPattern | string {
  if (!dryBrush) {
    dryBrush = document.createElement('canvas');
    dryBrush.width = 64;
    dryBrush.height = 64;
    const g = dryBrush.getContext('2d')!;
    g.fillStyle = OUTLINE;
    g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = 'destination-out';
    // 固定種子（唔用 Math.random：每次畫都一樣）
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 70; k++) {
      g.globalAlpha = 0.35 + rnd() * 0.5;
      g.fillRect(rnd() * 64, rnd() * 64, 4 + rnd() * 14, 0.6 + rnd() * 1.2);
    }
  }
  return c.createPattern(dryBrush, 'repeat') ?? OUTLINE;
}

export function drawArt(opts: DrawArtOptions): HTMLCanvasElement {
  const dpr = opts.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const px = Math.round(opts.cssSize * dpr * 1.5);
  const cv = document.createElement('canvas');
  cv.width = px;
  cv.height = px;
  const c = cv.getContext('2d')!;
  if (opts.pattern && opts.bg) drawPattern(c, opts.pattern, px, px, opts.bg, opts.fg ?? OUTLINE);
  const def = ICONS[opts.kind];
  const base = opts.tint ?? def.base;
  const scale = px * 0.34;
  const cx = px / 2;
  const cy = px * 0.47;

  if (opts.shadow !== false) {
    // 淡墨投影（兩層暈）
    c.fillStyle = 'rgba(28,26,23,0.12)';
    c.beginPath();
    c.ellipse(cx, px * 0.86, px * 0.3, px * 0.06, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(28,26,23,0.18)';
    c.beginPath();
    c.ellipse(cx, px * 0.86, px * 0.2, px * 0.035, 0, 0, Math.PI * 2);
    c.fill();
  }

  c.save();
  c.translate(cx, cy);
  c.rotate(def.tilt);
  c.scale(scale, scale);
  const lwOuter = 0.09;
  const lwInner = 0.03;
  const paper = '#F3EBDC';

  /** 三層墨色：淡墨設色（混紙色）→ 中墨成塊陰影 → 濃墨點睛 */
  const paint = (path: Path2D, color: string) => {
    c.fillStyle = mix(color, paper, 0.28);
    c.fill(path, 'evenodd');
    c.save();
    c.clip(path, 'evenodd');
    c.globalAlpha = 0.55;
    c.fillStyle = shade(color, -0.32);
    c.beginPath();
    c.moveTo(0.15, -1.2);
    c.lineTo(1.3, -1.2);
    c.lineTo(1.3, 1.3);
    c.lineTo(-1.3, 1.3);
    c.lineTo(-1.3, 0.35);
    c.bezierCurveTo(-0.4, 0.45, 0.3, 0.1, 0.15, -1.2);
    c.fill();
    // 濃墨點睛：陰影邊一筆
    c.globalAlpha = 0.5;
    c.fillStyle = shade(color, -0.6);
    c.beginPath();
    c.ellipse(0.55, 0.5, 0.42, 0.1, -0.7, 0, Math.PI * 2);
    c.fill();
    // 留白（紙色）代替高光
    c.globalAlpha = 0.7;
    c.fillStyle = paper;
    c.beginPath();
    c.ellipse(-0.32, -0.45, 0.1, 0.26, -0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  const bodyPath = new Path2D();
  def.body(bodyPath);
  const partPaths = (def.parts ?? []).map((pp) => {
    const p = new Path2D();
    pp.path(p);
    return { p, color: pp.color };
  });
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // 外輪廓：乾筆粗線（先畫，填色蓋走內半）
  const brush = dryBrushPattern(c);
  c.strokeStyle = brush;
  if (typeof brush !== 'string') brush.setTransform(new DOMMatrix().scale(1 / scale));
  c.lineWidth = lwOuter * 2;
  c.stroke(bodyPath);
  partPaths.forEach(({ p }) => c.stroke(p));
  paint(bodyPath, base);
  partPaths.forEach(({ p, color }) => paint(p, color));
  // 零件交界、結構：淡墨幼線
  c.strokeStyle = 'rgba(28,26,23,0.7)';
  c.lineWidth = lwInner;
  c.stroke(bodyPath);
  partPaths.forEach(({ p }) => c.stroke(p));
  if (def.details) {
    c.beginPath();
    def.details(c);
    c.stroke();
  }
  c.restore();
  return cv;
}

function mix(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, sh: number) => (n >> sh) & 255;
  const m = (sh: number) => Math.round(ch(pa, sh) * (1 - k) + ch(pb, sh) * k);
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

/** 金幣／寶石小圖（飛入 HUD 用）→ dataURL */
const iconCache = new Map<string, string>();
export function iconDataUrl(kind: IconKind, cssSize: number, tint?: string): string {
  const key = `${kind}:${cssSize}:${tint ?? ''}`;
  const hit = iconCache.get(key);
  if (hit) return hit;
  const url = drawArt({ kind, cssSize, tint, shadow: false }).toDataURL();
  iconCache.set(key, url);
  return url;
}
