/**
 * 環境特效粒子（純邏輯，冇 DOM）：主畫面場景會動（季節粒子＋流雲）、墨韻粒子（邊緣墨點、墨暈、點擊濺墨）。
 *
 * 畫面由 `src/components/ink/InkAmbientFx.tsx` 用 canvas 畫位圖（`public/ink/art/fx/`）；
 * 呢度只計位置、透明度、壽命，方便測試。用自己嘅 seeded RNG，唔用 Math.random。
 */
import { AMBIENT_TUNING, type AmbientSeason } from './tuning';

export type ParticleKind = 'petal' | 'rain' | 'leaf' | 'snow' | 'inkDot' | 'bloom' | 'splash';

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 弧度 */
  rot: number;
  vr: number;
  /** 畫出嚟嘅邊長（px） */
  size: number;
  /** 秒 */
  age: number;
  life: number;
  /** 最高透明度 */
  alpha: number;
  /** 左右擺動幅度（px／秒） */
  sway: number;
  phase: number;
  /** 由細變大（濺墨、墨暈用）：最後 size 係 size × grow */
  grow: number;
  /** 每秒減速率（濺墨飛出去嘅墨點用；0 = 唔減速） */
  drag: number;
  /** 點擊濺墨產生嘅（唔計入環境粒子數量） */
  burst: boolean;
}

export type Rng = () => number;

/** mulberry32：細、快、可重現 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const range = (rng: Rng, [lo, hi]: readonly [number, number]) => lo + (hi - lo) * rng();

function base(kind: ParticleKind): Particle {
  return { kind, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, size: 0, age: 0, life: 1, alpha: 1, sway: 0, phase: 0, grow: 1, drag: 0, burst: false };
}

/**
 * 季節粒子：喺場景上方（同風向上游）出現。
 * `scatter` 為 true 時一開始就散落成個畫面，唔使等佢跌落嚟。
 */
export function spawnSeasonParticle(season: AmbientSeason, w: number, h: number, rng: Rng, scatter = false): Particle {
  const t = AMBIENT_TUNING.season[season];
  const p = base(t.kind);
  p.size = range(rng, t.size);
  p.alpha = range(rng, t.alpha);
  p.life = range(rng, t.life);
  p.vx = range(rng, t.vx);
  p.vy = range(rng, t.vy);
  p.vr = range(rng, t.spin);
  p.rot = rng() * Math.PI * 2;
  p.sway = range(rng, t.sway);
  p.phase = rng() * Math.PI * 2;
  if (scatter) {
    p.x = rng() * w;
    p.y = rng() * h;
    if (scatter) p.age = rng() * p.life * 0.6;
  } else {
    // 由上邊（同風向上游）入場
    p.x = rng() * (w + 60) - (p.vx > 0 ? 60 : 0);
    p.y = -p.size - rng() * 30;
  }
  // 雨絲：條紋順住落雨方向
  if (t.kind === 'rain') p.rot = -Math.atan2(p.vx, p.vy);
  return p;
}

/** 墨點：只喺左右邊（同上下邊）嘅窄帶出現，唔遮中間文字 */
export function spawnInkMote(w: number, h: number, rng: Rng): Particle {
  const t = AMBIENT_TUNING.ink;
  const bloom = rng() < t.bloomChance;
  const p = base(bloom ? 'bloom' : 'inkDot');
  const band = Math.max(8, w * t.edgeBand);
  const side = rng();
  if (side < 0.4) p.x = rng() * band;
  else if (side < 0.8) p.x = w - rng() * band;
  else p.x = rng() * w;
  p.y = side < 0.8 ? rng() * h : rng() < 0.5 ? rng() * band : h - rng() * band;
  if (bloom) {
    p.size = range(rng, t.bloomSize);
    p.grow = t.bloomGrow;
    p.life = range(rng, t.bloomLife);
    p.alpha = range(rng, t.bloomAlpha);
  } else {
    p.size = range(rng, t.dotSize);
    p.life = range(rng, t.dotLife);
    p.alpha = range(rng, t.dotAlpha);
    p.vx = range(rng, t.dotDrift);
    p.vy = range(rng, t.dotRise);
    p.sway = range(rng, t.dotSway);
  }
  p.rot = rng() * Math.PI * 2;
  p.phase = rng() * Math.PI * 2;
  return p;
}

/** 點擊濺墨：一個濺墨＋一圈墨暈＋幾粒飛出去嘅墨點 */
export function spawnSplash(x: number, y: number, rng: Rng): Particle[] {
  const t = AMBIENT_TUNING.splash;
  const out: Particle[] = [];
  const splash = base('splash');
  Object.assign(splash, { x, y, size: range(rng, t.size), grow: t.grow, life: t.life, alpha: t.alpha, rot: rng() * Math.PI * 2 });
  out.push(splash);
  const ring = base('bloom');
  Object.assign(ring, { x, y, size: splash.size * 0.9, grow: t.grow * 1.6, life: t.life * 1.4, alpha: t.alpha * 0.45, rot: rng() * Math.PI * 2 });
  out.push(ring);
  for (let i = 0; i < t.droplets; i++) {
    const d = base('inkDot');
    const ang = (i / t.droplets) * Math.PI * 2 + rng() * 0.6;
    const sp = range(rng, t.dropletSpeed);
    Object.assign(d, {
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      size: range(rng, t.dropletSize),
      life: t.life * range(rng, [0.7, 1.1]),
      alpha: t.alpha,
      drag: t.drag,
    });
    out.push(d);
  }
  for (const p of out) p.burst = true;
  return out;
}

/** 0→1→0 嘅淡入淡出：頭尾各 `fade` 比例 */
export function particleAlpha(p: Particle, fade = 0.2): number {
  const k = p.age / p.life;
  if (k <= 0 || k >= 1) return 0;
  const inK = Math.min(1, k / fade);
  const outK = Math.min(1, (1 - k) / fade);
  return p.alpha * Math.min(inK, outK);
}

/** 而家畫幾大（濺墨／墨暈由細變大，前段快後段慢） */
export function particleSize(p: Particle): number {
  if (p.grow === 1) return p.size;
  const k = Math.min(1, p.age / p.life);
  const ease = 1 - (1 - k) ** 3;
  return p.size * (1 + (p.grow - 1) * ease);
}

/**
 * 推進 dt 秒；回傳仲生存嘅粒子（就地修改位置）。
 * 跌出畫面（下邊、左右）或者壽命完咗就移除。
 */
export function stepParticles(list: Particle[], dt: number, w: number, h: number): Particle[] {
  const keep: Particle[] = [];
  for (const p of list) {
    p.age += dt;
    if (p.age >= p.life) continue;
    if (p.drag > 0) {
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy *= k;
    }
    p.x += (p.vx + Math.sin(p.phase + p.age * 1.7) * p.sway) * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const m = p.size * 2;
    if (p.y > h + m || p.x < -m * 2 || p.x > w + m * 2) continue;
    keep.push(p);
  }
  return keep;
}

/** 流雲：每層水平位移（px），已經按圖寬取餘，可以直接畫兩張接住 */
export function mistOffset(layer: number, t: number, tileW: number): number {
  const L = AMBIENT_TUNING.mist.layers[layer];
  if (!L) return 0;
  const raw = t * L.speed;
  return ((raw % tileW) + tileW) % tileW;
}
