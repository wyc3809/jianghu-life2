/**
 * 外功招式編排（玩家 2026-10-14：每套外功要有自己嘅動畫，按功夫名有特色，唔可以淨係換色／換圖形；
 * 同一套外功七卷唔使分）。
 *
 * 呢度係純資料＋純邏輯（冇 DOM、冇 Three.js），演武台 2D 引擎（src/spar/engine.ts）同
 * 3D 自動交手（src/fx/highlight/duel/director.ts）都讀同一份編排，各自將位移、特效、鏡頭畫出嚟。
 *
 * 單位：
 * - 時間：秒（由出招開始計）
 * - 位移：x／y 以「身高 H」計（演武台＝剪影高，3D＝人物高）；x 向敵人為正，y 向上為正
 * - g：佔「主角到敵人距離」嘅比例（1＝貼到敵人身前），同 x 相加
 * - 角度：度，順時針為正
 */

/** 主角姿勢：對應各畫面嘅待機／蓄勢／揮擊／行路幀 */
export type ChoreoPose = 'idle' | 'windup' | 'strike' | 'walk';

export type ChoreoEase = 'linear' | 'in' | 'out' | 'inOut' | 'back' | 'step';

export interface ChoreoKey {
  t: number;
  /** 位移（H） */
  x?: number;
  /** 佔主角→敵人距離比例 */
  g?: number;
  /** 向上（H） */
  y?: number;
  /** 旋轉（度，以身體中心轉） */
  rot?: number;
  /** 橫向縮放（拉長／壓扁） */
  sx?: number;
  /** 直向縮放 */
  sy?: number;
  /** 透明度（閃現用） */
  alpha?: number;
  /** 由上一格去呢格嘅緩動 */
  ease?: ChoreoEase;
  /** 主角姿勢（只主角軌用；未寫就沿用上一格） */
  pose?: ChoreoPose;
}

/** 特效位圖（public/ink/art/artfx/<key>.webp，scripts/art/build_art_fx.py） */
export type ArtSpriteKey =
  | 'wave'
  | 'wave-big'
  | 'droplet'
  | 'crack'
  | 'rock'
  | 'dust'
  | 'rain'
  | 'drop'
  | 'thrust'
  | 'storm'
  | 'lightning'
  | 'spark'
  | 'scorch'
  | 'streak'
  | 'cloud'
  | 'cloud-ring'
  | 'needle'
  | 'glint'
  | 'poison'
  | 'wind'
  | 'wind-ring'
  | 'board'
  | 'stone-black'
  | 'stone-white'
  | 'board-glow'
  | 'qi';

/** 特效出現位置 */
export type FxAnchor =
  | 'hero'
  | 'heroHand'
  | 'heroGround'
  | 'foe'
  | 'foeGround'
  | 'foeTop'
  | 'sky'
  | 'between';

export interface FxSpawn {
  sprite: ArtSpriteKey;
  at: FxAnchor;
  /** 偏移（H） */
  dx?: number;
  dy?: number;
  /** 粒數；多粒時按 spread 隨機散開、按 stagger 逐粒出 */
  count?: number;
  spread?: number;
  stagger?: number;
  /** 速度（H／秒）；vy 向上為正 */
  vx?: number;
  vy?: number;
  /** 速度隨機幅度（H／秒） */
  vSpread?: number;
  /** 重力（H／秒²，向下） */
  gravity?: number;
  /** 跌到呢個高度就停（H，相對出現位置，向上為正）：棋子落盤 */
  floorDy?: number;
  /** 由出現位置飛向邊度（生命期內直線追住目標） */
  to?: FxAnchor;
  /** 飛行弧高（H，配合 to） */
  arc?: number;
  life: number;
  /** 大細（H） */
  size: number;
  sizeEnd?: number;
  /** 橫向拉長倍數（雨絲、槍芒） */
  stretch?: number;
  stretchEnd?: number;
  /** 起始角度、轉速（度、度／秒）；faceVel＝跟飛行方向 */
  rot?: number;
  rotSpread?: number;
  spin?: number;
  faceVel?: boolean;
  alpha?: number;
  /** 淡入佔生命比例（預設 0.15） */
  fadeIn?: number;
  /** 拉長由邊度起計：0＝左邊固定（地裂向右伸）、0.5＝中間 */
  originX?: number;
  /** 畫喺人物後面（地面裂紋、棋盤）定前面 */
  layer?: 'back' | 'front';
  /** 混合：multiply＝墨、screen＝光 */
  blend?: 'normal' | 'multiply' | 'screen';
}

export type ScreenEffect = 'shake' | 'flash' | 'darken' | 'hitstop' | 'slow';

export type ChoreoEvent =
  /** 命中：share＝今下佔總傷害比例（所有 hit 加埋＝1）；heavy＝重擊（震屏、停格） */
  | { t: number; kind: 'hit'; share: number; heavy?: boolean }
  | { t: number; kind: 'fx'; fx: FxSpawn }
  | { t: number; kind: 'screen'; effect: ScreenEffect; amount: number; dur?: number }
  /** 殘影開關 */
  | { t: number; kind: 'afterimage'; on: boolean };

export interface ArtChoreo {
  /** 外功 id（content/martial/*.json） */
  artId: string;
  /** 招式特色（文件／測試用，一句講清楚個動作） */
  motif: string;
  /** 動作類型（測試用：每套要唔同） */
  motion: string;
  dur: number;
  hero: ChoreoKey[];
  foe: ChoreoKey[];
  events: ChoreoEvent[];
}

/** 取樣結果 */
export interface ChoreoSample {
  x: number;
  g: number;
  y: number;
  rot: number;
  sx: number;
  sy: number;
  alpha: number;
  pose: ChoreoPose;
}

const REST: ChoreoSample = { x: 0, g: 0, y: 0, rot: 0, sx: 1, sy: 1, alpha: 1, pose: 'idle' };

export function ease(kind: ChoreoEase | undefined, p: number): number {
  const q = Math.max(0, Math.min(1, p));
  switch (kind) {
    case 'in':
      return q * q * q;
    case 'out':
      return 1 - (1 - q) ** 3;
    case 'inOut':
      return q < 0.5 ? 4 * q * q * q : 1 - (-2 * q + 2) ** 3 / 2;
    case 'back': {
      const c = 1.70158;
      return 1 + (c + 1) * (q - 1) ** 3 + c * (q - 1) ** 2;
    }
    case 'step':
      return q < 1 ? 0 : 1;
    default:
      return q;
  }
}

/** 某一軌喺時間 t 嘅數值；未寫嘅欄位沿用上一格（第一格之前＝原位） */
export function sampleTrack(keys: readonly ChoreoKey[], t: number): ChoreoSample {
  // 每格補齊欄位（沿用上一格）
  let prev: ChoreoSample & { t: number } = { ...REST, t: 0 };
  const full: (ChoreoSample & { t: number; ease?: ChoreoEase })[] = [];
  for (const k of keys) {
    const cur = {
      t: k.t,
      x: k.x ?? prev.x,
      g: k.g ?? prev.g,
      y: k.y ?? prev.y,
      rot: k.rot ?? prev.rot,
      sx: k.sx ?? prev.sx,
      sy: k.sy ?? prev.sy,
      alpha: k.alpha ?? prev.alpha,
      pose: k.pose ?? prev.pose,
      ease: k.ease,
    };
    full.push(cur);
    prev = cur;
  }
  if (!full.length) return { ...REST };
  if (t <= full[0]!.t) {
    // 第一格之前：由原位過渡去第一格
    const f = full[0]!;
    if (f.t <= 0) return strip(f);
    const p = ease(f.ease, t / f.t);
    return mix({ ...REST }, f, p, f.pose);
  }
  for (let i = 1; i < full.length; i++) {
    const b = full[i]!;
    if (t <= b.t) {
      const a = full[i - 1]!;
      const span = Math.max(1e-6, b.t - a.t);
      const p = ease(b.ease, (t - a.t) / span);
      // 姿勢唔漸變：過咗一半就轉（step 就到點先轉）
      const pose = b.ease === 'step' ? (t >= b.t ? b.pose : a.pose) : (t - a.t) / span >= 0.5 ? b.pose : a.pose;
      return mix(a, b, p, pose);
    }
  }
  return strip(full[full.length - 1]!);
}

function strip(k: ChoreoSample): ChoreoSample {
  return { x: k.x, g: k.g, y: k.y, rot: k.rot, sx: k.sx, sy: k.sy, alpha: k.alpha, pose: k.pose };
}

function mix(a: ChoreoSample, b: ChoreoSample, p: number, pose: ChoreoPose): ChoreoSample {
  const l = (u: number, v: number) => u + (v - u) * p;
  return { x: l(a.x, b.x), g: l(a.g, b.g), y: l(a.y, b.y), rot: l(a.rot, b.rot), sx: l(a.sx, b.sx), sy: l(a.sy, b.sy), alpha: l(a.alpha, b.alpha), pose };
}

/** 呢段時間（prev, t] 內要發生嘅事件（按時間排） */
export function eventsBetween(c: ArtChoreo, prev: number, t: number): ChoreoEvent[] {
  return c.events.filter((e) => e.t > prev && e.t <= t).sort((a, b) => a.t - b.t);
}

/** 命中事件（按時間排） */
export function hitEvents(c: ArtChoreo): Extract<ChoreoEvent, { kind: 'hit' }>[] {
  return c.events.filter((e): e is Extract<ChoreoEvent, { kind: 'hit' }> => e.kind === 'hit').sort((a, b) => a.t - b.t);
}

/**
 * 將一下總傷害按 share 分落每段命中（整數，加埋一定等於總數；最後一段補尾數）。
 * 演出用：數值照戰鬥結算，唔會多咗或者少咗。
 */
export function splitDamage(total: number, shares: readonly number[]): number[] {
  if (!shares.length) return [];
  const sum = shares.reduce((a, b) => a + b, 0) || 1;
  const out: number[] = [];
  let used = 0;
  shares.forEach((s, i) => {
    if (i === shares.length - 1) out.push(Math.max(0, total - used));
    else {
      const v = Math.floor((total * s) / sum);
      out.push(v);
      used += v;
    }
  });
  return out;
}

/** 世界位移：x（H）＋ g × 主角到敵人距離 */
export function offsetPx(s: Pick<ChoreoSample, 'x' | 'g' | 'y'>, unitH: number, gap: number): { dx: number; dy: number } {
  return { dx: s.x * unitH + s.g * gap, dy: s.y * unitH };
}

/**
 * 播一套編排：逐幀推時間、攞事件；命中按 share 分傷害。
 * 兩個畫面都用：spar engine 同 3D director 各自將樣本套落人物、將事件變特效。
 */
export class ChoreoRun {
  t = 0;
  private hitTimes: number[];
  constructor(readonly c: ArtChoreo) {
    this.hitTimes = hitEvents(c).map((e) => e.t);
  }

  get done(): boolean {
    return this.t >= this.c.dur;
  }

  /** 推 dt 秒，回傳期間發生嘅事件 */
  advance(dt: number): ChoreoEvent[] {
    const prev = this.t;
    this.t = Math.min(this.c.dur, this.t + Math.max(0, dt));
    // 第一幀包埋 t=0 嘅事件
    return eventsBetween(this.c, prev === 0 ? -1 : prev, this.t);
  }

  hero(): ChoreoSample {
    return sampleTrack(this.c.hero, this.t);
  }

  foe(): ChoreoSample {
    return sampleTrack(this.c.foe, this.t);
  }

  /** 呢下命中係第幾下、係咪第一／最後一下 */
  hitInfo(ev: { t: number }): { index: number; first: boolean; last: boolean; total: number } {
    const index = Math.max(0, this.hitTimes.indexOf(ev.t));
    return { index, first: index === 0, last: index === this.hitTimes.length - 1, total: this.hitTimes.length };
  }

  /** 各段命中嘅 share */
  shares(): number[] {
    return hitEvents(this.c).map((e) => e.share);
  }
}
