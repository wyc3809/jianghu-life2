/**
 * 卡面 2D 插畫（Canvas 2D，唔用 SVG）：
 * - 三層卡通著色：底色、成塊陰影色、高光色
 * - 線條分粗細：外輪廓粗、內部結構線幼
 * - 每樣物件有自己表情同姿態（唔共用一塊面）
 * - 腳下投影；背景按屬性分圖案
 * 解像度＝顯示尺寸 × dpr × 1.5，放大都唔發虛。
 */
import type { CardPattern, IconKind } from './types';
import { OUTLINE } from './grades';

type Face =
  | 'determined'
  | 'fierce'
  | 'cool'
  | 'sleepy'
  | 'wink'
  | 'aim'
  | 'surprised'
  | 'proud'
  | 'shy'
  | 'wise'
  | 'excited'
  | 'greedy'
  | 'dazzled';

interface IconDef {
  base: string;
  /** 主體輪廓（單位座標 −1..1，y 向下） */
  body: (p: Path2D) => void;
  /** 內部結構線（幼） */
  details?: (c: CanvasRenderingContext2D) => void;
  /** 附件（另一色，例如劍柄） */
  parts?: { color: string; path: (p: Path2D) => void }[];
  face: Face;
  /** 面位置同大細 */
  faceAt: [number, number, number];
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
    base: '#DDE6F0',
    body: (p) => {
      p.moveTo(0, -0.95);
      p.lineTo(0.16, -0.72);
      p.lineTo(0.16, 0.3);
      p.lineTo(-0.16, 0.3);
      p.lineTo(-0.16, -0.72);
      p.closePath();
    },
    parts: [
      { color: '#E0B040', path: (p) => rr(p, -0.46, 0.28, 0.92, 0.16, 0.07) },
      { color: '#7A4A2A', path: (p) => rr(p, -0.1, 0.43, 0.2, 0.38, 0.05) },
      { color: '#E0B040', path: (p) => p.arc(0, 0.88, 0.12, 0, Math.PI * 2) },
    ],
    details: (c) => {
      c.moveTo(0, -0.7);
      c.lineTo(0, 0.2);
    },
    face: 'determined',
    faceAt: [0, -0.18, 0.2],
    tilt: 0.35,
  },
  blade: {
    base: '#D8DFEA',
    body: (p) => {
      p.moveTo(-0.2, 0.25);
      p.lineTo(-0.2, -0.7);
      p.quadraticCurveTo(0.1, -1.0, 0.42, -0.8);
      p.quadraticCurveTo(0.3, -0.2, 0.22, 0.25);
      p.closePath();
    },
    parts: [
      { color: '#B8323C', path: (p) => rr(p, -0.34, 0.24, 0.7, 0.14, 0.06) },
      { color: '#3A2A4A', path: (p) => rr(p, -0.1, 0.36, 0.22, 0.5, 0.06) },
    ],
    details: (c) => {
      c.moveTo(-0.08, -0.62);
      c.quadraticCurveTo(0.12, -0.8, 0.3, -0.72);
    },
    face: 'fierce',
    faceAt: [0.02, -0.2, 0.2],
    tilt: -0.3,
  },
  spear: {
    base: '#E4E9F2',
    body: (p) => {
      p.moveTo(0, -0.98);
      p.lineTo(0.28, -0.46);
      p.lineTo(0.1, -0.36);
      p.lineTo(-0.1, -0.36);
      p.lineTo(-0.28, -0.46);
      p.closePath();
    },
    parts: [
      { color: '#C8323C', path: (p) => p.ellipse(0, -0.28, 0.22, 0.1, 0, 0, Math.PI * 2) },
      { color: '#8A5A34', path: (p) => rr(p, -0.07, -0.22, 0.14, 1.12, 0.05) },
    ],
    details: (c) => {
      c.moveTo(0, -0.86);
      c.lineTo(0, -0.46);
    },
    face: 'cool',
    faceAt: [0, -0.6, 0.15],
    tilt: 0.5,
  },
  staff: {
    base: '#A86E3C',
    body: (p) => {
      rr(p, -0.12, -0.9, 0.24, 1.8, 0.12);
    },
    parts: [
      { color: '#E0B040', path: (p) => rr(p, -0.16, -0.62, 0.32, 0.12, 0.05) },
      { color: '#E0B040', path: (p) => rr(p, -0.16, 0.5, 0.32, 0.12, 0.05) },
    ],
    details: (c) => {
      c.moveTo(-0.04, -0.3);
      c.lineTo(-0.04, 0.3);
    },
    face: 'sleepy',
    faceAt: [0, -0.1, 0.13],
    tilt: -0.55,
  },
  whip: {
    base: '#9A5A3A',
    body: (p) => {
      p.moveTo(-0.5, 0.75);
      p.bezierCurveTo(-0.9, 0.1, 0.1, -0.2, -0.2, -0.6);
      p.bezierCurveTo(-0.35, -0.85, 0.3, -1.0, 0.6, -0.7);
      p.bezierCurveTo(0.2, -0.8, -0.1, -0.7, 0.0, -0.52);
      p.bezierCurveTo(0.3, -0.1, -0.55, 0.1, -0.34, 0.72);
      p.closePath();
    },
    parts: [{ color: '#3A2A4A', path: (p) => rr(p, -0.62, 0.62, 0.3, 0.3, 0.08) }],
    face: 'wink',
    faceAt: [-0.36, 0.2, 0.15],
    tilt: 0.1,
  },
  bow: {
    base: '#B87A3E',
    body: (p) => {
      p.moveTo(-0.2, -0.9);
      p.quadraticCurveTo(0.75, 0, -0.2, 0.9);
      p.lineTo(-0.06, 0.9);
      p.quadraticCurveTo(0.9, 0, -0.06, -0.9);
      p.closePath();
    },
    parts: [{ color: '#EEE6D2', path: (p) => rr(p, -0.24, -0.9, 0.04, 1.8, 0.02) }],
    face: 'aim',
    faceAt: [0.3, 0, 0.15],
    tilt: 0.2,
  },
  hidden: {
    base: '#C9D2DE',
    body: (p) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 0.85 : 0.3;
        p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      p.closePath();
    },
    parts: [{ color: '#3A2A4A', path: (p) => p.arc(0, 0, 0.1, 0, Math.PI * 2) }],
    face: 'surprised',
    faceAt: [0, 0.02, 0.2],
    tilt: 0.4,
  },
  armor: {
    base: '#8FA3C0',
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
    parts: [{ color: '#E0B040', path: (p) => rr(p, -0.52, 0.28, 1.04, 0.14, 0.05) }],
    details: (c) => {
      c.moveTo(0, -0.62);
      c.lineTo(0, 0.25);
      c.moveTo(-0.3, 0.55);
      c.lineTo(0.3, 0.55);
    },
    face: 'proud',
    faceAt: [0, -0.2, 0.22],
    tilt: 0,
  },
  accessory: {
    base: '#7ED6A8',
    body: (p) => {
      p.arc(0, 0.15, 0.62, 0, Math.PI * 2);
    },
    parts: [
      { color: '#C8323C', path: (p) => rr(p, -0.05, -0.95, 0.1, 0.45, 0.04) },
      { color: '#C8323C', path: (p) => p.arc(0, -0.5, 0.1, 0, Math.PI * 2) },
    ],
    details: (c) => {
      c.moveTo(0.18, 0.15);
      c.arc(0, 0.15, 0.18, 0, Math.PI * 2);
    },
    face: 'shy',
    faceAt: [0, 0.2, 0.2],
    tilt: -0.12,
  },
  scroll: {
    base: '#F2E6C4',
    body: (p) => {
      rr(p, -0.6, -0.6, 1.2, 1.2, 0.08);
    },
    parts: [
      { color: '#8A5A34', path: (p) => rr(p, -0.72, -0.76, 1.44, 0.2, 0.1) },
      { color: '#8A5A34', path: (p) => rr(p, -0.72, 0.56, 1.44, 0.2, 0.1) },
      { color: '#C8323C', path: (p) => rr(p, 0.28, -0.45, 0.16, 0.5, 0.03) },
    ],
    details: (c) => {
      for (const y of [-0.35, -0.2]) {
        c.moveTo(-0.42, y);
        c.lineTo(0.1, y);
      }
    },
    face: 'wise',
    faceAt: [-0.12, 0.18, 0.2],
    tilt: 0.08,
  },
  pill: {
    base: '#FF6A4A',
    body: (p) => {
      p.arc(0, 0.05, 0.72, 0, Math.PI * 2);
    },
    parts: [{ color: '#FFD36B', path: (p) => p.ellipse(0, -0.62, 0.3, 0.12, 0, 0, Math.PI * 2) }],
    face: 'excited',
    faceAt: [0, 0.08, 0.24],
    tilt: 0,
  },
  coin: {
    base: '#FFC83A',
    body: (p) => {
      p.arc(0, 0, 0.8, 0, Math.PI * 2);
    },
    details: (c) => {
      c.moveTo(0.62, 0);
      c.arc(0, 0, 0.62, 0, Math.PI * 2);
    },
    face: 'greedy',
    faceAt: [0, 0.02, 0.24],
    tilt: 0.15,
  },
  gem: {
    base: '#5FD3FF',
    body: (p) => {
      p.moveTo(-0.5, -0.55);
      p.lineTo(0.5, -0.55);
      p.lineTo(0.85, -0.15);
      p.lineTo(0, 0.85);
      p.lineTo(-0.85, -0.15);
      p.closePath();
    },
    details: (c) => {
      c.moveTo(-0.85, -0.15);
      c.lineTo(0.85, -0.15);
      c.moveTo(-0.25, -0.55);
      c.lineTo(-0.35, -0.15);
      c.lineTo(0, 0.85);
      c.moveTo(0.25, -0.55);
      c.lineTo(0.35, -0.15);
      c.lineTo(0, 0.85);
    },
    face: 'dazzled',
    faceAt: [0, 0.12, 0.2],
    tilt: -0.1,
  },
};

function drawFace(c: CanvasRenderingContext2D, face: Face, s: number, lw: number) {
  c.save();
  c.strokeStyle = OUTLINE;
  c.fillStyle = OUTLINE;
  c.lineWidth = lw;
  c.lineCap = 'round';
  const ex = s * 0.55;
  const ey = 0;
  const eye = (x: number, r = s * 0.2) => {
    c.beginPath();
    c.ellipse(x, ey, r * 0.8, r, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(x + r * 0.25, ey - r * 0.35, r * 0.32, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = OUTLINE;
  };
  const arcEye = (x: number, up: boolean) => {
    c.beginPath();
    c.arc(
      x,
      ey + (up ? s * 0.08 : -s * 0.08),
      s * 0.18,
      up ? Math.PI * 1.1 : 0.1 * Math.PI,
      up ? Math.PI * 1.9 : 0.9 * Math.PI,
    );
    c.stroke();
  };
  const mouth = (kind: 'smile' | 'grin' | 'o' | 'flat' | 'shout' | 'smirk' | 'tongue') => {
    const my = s * 0.55;
    c.beginPath();
    if (kind === 'smile') c.arc(0, my - s * 0.12, s * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (kind === 'grin') {
      c.moveTo(-s * 0.3, my - s * 0.08);
      c.quadraticCurveTo(0, my + s * 0.45, s * 0.3, my - s * 0.08);
      c.closePath();
      c.fill();
      return;
    } else if (kind === 'o') {
      c.ellipse(0, my, s * 0.1, s * 0.14, 0, 0, Math.PI * 2);
      c.fill();
      return;
    } else if (kind === 'flat') {
      c.moveTo(-s * 0.14, my);
      c.lineTo(s * 0.14, my);
    } else if (kind === 'shout') {
      c.moveTo(-s * 0.22, my - s * 0.08);
      c.lineTo(s * 0.22, my - s * 0.08);
      c.lineTo(0, my + s * 0.28);
      c.closePath();
      c.fill();
      return;
    } else if (kind === 'smirk') {
      c.moveTo(-s * 0.16, my);
      c.quadraticCurveTo(s * 0.05, my + s * 0.12, s * 0.2, my - s * 0.1);
    } else if (kind === 'tongue') {
      c.arc(0, my - s * 0.1, s * 0.18, 0.1 * Math.PI, 0.9 * Math.PI);
      c.stroke();
      c.fillStyle = '#FF7A8A';
      c.beginPath();
      c.ellipse(s * 0.06, my + s * 0.1, s * 0.08, s * 0.1, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = OUTLINE;
      return;
    }
    c.stroke();
  };
  /** k<0：內端低（嬲）；k>0：內端高（專注／慈祥） */
  const brows = (k: number, y = -s * 0.38) => {
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.moveTo(sx * (ex - s * 0.2), y - k * s);
      c.lineTo(sx * (ex + s * 0.16), y + k * s);
      c.stroke();
    }
  };
  const blush = () => {
    c.fillStyle = 'rgba(255,110,140,0.55)';
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.ellipse(sx * ex * 1.25, s * 0.3, s * 0.16, s * 0.09, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = OUTLINE;
  };
  switch (face) {
    case 'determined':
      eye(-ex);
      eye(ex);
      brows(-0.12);
      mouth('smirk');
      break;
    case 'fierce':
      eye(-ex, s * 0.17);
      eye(ex, s * 0.17);
      brows(-0.2);
      mouth('shout');
      break;
    case 'cool':
      c.beginPath();
      c.moveTo(-ex - s * 0.16, ey);
      c.lineTo(-ex + s * 0.16, ey);
      c.moveTo(ex - s * 0.16, ey);
      c.lineTo(ex + s * 0.16, ey);
      c.stroke();
      mouth('flat');
      break;
    case 'sleepy':
      arcEye(-ex, false);
      arcEye(ex, false);
      mouth('smile');
      break;
    case 'wink':
      eye(-ex);
      arcEye(ex, true);
      mouth('tongue');
      break;
    case 'aim':
      eye(-ex);
      c.beginPath();
      c.moveTo(ex - s * 0.16, ey);
      c.lineTo(ex + s * 0.16, ey);
      c.stroke();
      brows(0.08);
      mouth('flat');
      break;
    case 'surprised':
      eye(-ex, s * 0.23);
      eye(ex, s * 0.23);
      mouth('o');
      break;
    case 'proud':
      arcEye(-ex, true);
      arcEye(ex, true);
      mouth('smile');
      break;
    case 'shy':
      eye(-ex * 0.9, s * 0.16);
      eye(ex * 1.1, s * 0.16);
      blush();
      mouth('smile');
      break;
    case 'wise':
      arcEye(-ex, false);
      arcEye(ex, false);
      brows(0.1, -s * 0.34);
      mouth('smirk');
      break;
    case 'excited':
      eye(-ex, s * 0.24);
      eye(ex, s * 0.24);
      blush();
      mouth('grin');
      break;
    case 'greedy':
      eye(-ex);
      eye(ex);
      blush();
      mouth('grin');
      break;
    case 'dazzled': {
      // 星星眼
      for (const x of [-ex, ex]) {
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? s * 0.24 : s * 0.1;
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          c.lineTo(x + Math.cos(a) * r, ey + Math.sin(a) * r);
        }
        c.closePath();
        c.fill();
      }
      mouth('o');
      break;
    }
  }
  c.restore();
}

function drawPattern(c: CanvasRenderingContext2D, pattern: CardPattern, w: number, h: number, bg: string, fg: string) {
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  c.save();
  c.globalAlpha = 0.28;
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
export function drawArt(opts: DrawArtOptions): HTMLCanvasElement {
  const dpr = opts.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const px = Math.round(opts.cssSize * dpr * 1.5);
  const cv = document.createElement('canvas');
  cv.width = px;
  cv.height = px;
  const c = cv.getContext('2d')!;
  if (opts.pattern && opts.bg) drawPattern(c, opts.pattern, px, px, opts.bg, opts.fg ?? '#ffffff');
  const def = ICONS[opts.kind];
  const base = opts.tint ?? def.base;
  const scale = px * 0.34;
  const cx = px / 2;
  const cy = px * 0.47;

  if (opts.shadow !== false) {
    c.fillStyle = 'rgba(26,16,51,0.35)';
    c.beginPath();
    c.ellipse(cx, px * 0.86, px * 0.26, px * 0.05, 0, 0, Math.PI * 2);
    c.fill();
  }

  c.save();
  c.translate(cx, cy);
  c.rotate(def.tilt);
  c.scale(scale, scale);
  const lwOuter = 0.085;
  const lwInner = 0.035;

  const drawShape = (path: Path2D, color: string) => {
    // 底色
    c.fillStyle = color;
    c.fill(path);
    // 成塊陰影（右下半），clip 喺形狀內
    c.save();
    c.clip(path);
    c.fillStyle = shade(color, -0.28);
    c.beginPath();
    c.moveTo(0.15, -1.2);
    c.lineTo(1.3, -1.2);
    c.lineTo(1.3, 1.3);
    c.lineTo(-1.3, 1.3);
    c.lineTo(-1.3, 0.35);
    c.bezierCurveTo(-0.4, 0.45, 0.3, 0.1, 0.15, -1.2);
    c.fill();
    // 高光（左上一塊）
    c.fillStyle = shade(color, 0.55);
    c.beginPath();
    c.ellipse(-0.3, -0.45, 0.16, 0.34, -0.5, 0, Math.PI * 2);
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
  // 外輪廓粗線：先畫（所有形狀嘅合併外框）
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = OUTLINE;
  c.lineWidth = lwOuter * 2;
  c.stroke(bodyPath);
  partPaths.forEach(({ p }) => c.stroke(p));
  // 填色
  drawShape(bodyPath, base);
  partPaths.forEach(({ p, color }) => drawShape(p, color));
  // 零件交界幼線
  c.lineWidth = lwInner;
  c.stroke(bodyPath);
  partPaths.forEach(({ p }) => c.stroke(p));
  if (def.details) {
    c.beginPath();
    def.details(c);
    c.lineWidth = lwInner;
    c.stroke();
  }
  // 表情
  c.save();
  c.translate(def.faceAt[0], def.faceAt[1]);
  c.rotate(-def.tilt * 0.6); // 面保持大致正向
  drawFace(c, def.face, def.faceAt[2], lwInner * 1.2);
  c.restore();
  c.restore();
  return cv;
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
