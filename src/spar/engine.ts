/**
 * 切磋演武引擎（v3 側面圍剿版）：極簡骨骼木偶動畫 + canvas 渲染。
 *
 * v3 玩法：側身斗笠俠客面向右企喺台左，敵影源源不絕由右邊行埋嚟，
 * 入咗武器射程即出手——一擊一個，潰散後新敵補上。武器係獨立貼圖掛喺劍臂，
 * 跟裝備欄嘅 WeaponKind 換樣；冇裝備就空手。
 *
 * 設計重點：
 * - 數據驅動：動作全部寫喺 rig.ts 嘅 SparClip，呢度淨係識「播 clip」。
 * - 增量疊加：attack/death/spawn 嘅 track 數值係相對 rest pose 嘅增量，
 *   同循環 idle 相加，動作開頭結尾歸零就無縫。
 * - 事件鈎：clip 入面嘅 strike 事件喺時間軸跨過嗰刻觸發，遊戲邏輯
 *  （修為入賬）經 onStrike 接出去，引擎本身唔碰 store。
 */

import {
  ENEMY_SHADOW,
  SPAR_CLIPS,
  WARRIOR,
  isV3Rig,
  type AnyWarriorRig,
  type EnemyDef,
  type SparClip,
  type SparEasing,
  type WeaponSpriteDef,
} from './rig';
import {
  HERO_SIL,
  SILHOUETTE_DESIGN_H,
  drawSilhouetteSprite,
  weaponFromKind,
  weaponTipLocal,
} from './silhouetteDraw';

const DEG = Math.PI / 180;
const INK = '22,19,15';
const CINNABAR = '168,51,31';

/**
 * 將彩色貼圖轉成「純黑影 + 淡宣紙描邊」並快取（特效用）。
 * 角色本體已改原生剪影人偶，唔再靠呢個濾鏡。
 */
const silhouetteCache = new WeakMap<CanvasImageSource, HTMLCanvasElement>();

function toInkSilhouette(img: CanvasImageSource): HTMLCanvasElement {
  const hit = silhouetteCache.get(img);
  if (hit) return hit;

  const iw =
    img instanceof HTMLImageElement
      ? img.naturalWidth || img.width
      : img instanceof HTMLCanvasElement
        ? img.width
        : 1;
  const ih =
    img instanceof HTMLImageElement
      ? img.naturalHeight || img.height
      : img instanceof HTMLCanvasElement
        ? img.height
        : 1;
  const c = document.createElement('canvas');
  c.width = Math.max(1, iw);
  c.height = Math.max(1, ih);
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.clearRect(0, 0, c.width, c.height);
  x.drawImage(img as CanvasImageSource, 0, 0);
  const data = x.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  const w = c.width;
  const h = c.height;
  const src = new Uint8ClampedArray(d);

  for (let i = 0; i < d.length; i += 4) {
    const a = src[i + 3]!;
    if (a < 10) {
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      d[i + 3] = 0;
      continue;
    }
    const lum = (src[i]! * 0.3 + src[i + 1]! * 0.59 + src[i + 2]! * 0.11) / 255;
    const v = Math.round(8 + lum * 18);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v + 2;
    d[i + 3] = a;
  }

  const opaque = (px: number, py: number) => {
    if (px < 0 || py < 0 || px >= w || py >= h) return false;
    return src[(py * w + px) * 4 + 3]! >= 48;
  };
  for (let y = 0; y < h; y++) {
    for (let px = 0; px < w; px++) {
      const i = (y * w + px) * 4;
      if (src[i + 3]! >= 48) continue;
      let border = false;
      for (let dy = -1; dy <= 1 && !border; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (opaque(px + dx, y + dy)) {
            border = true;
            break;
          }
        }
      }
      if (border) {
        d[i] = 228;
        d[i + 1] = 222;
        d[i + 2] = 210;
        d[i + 3] = 150;
      }
    }
  }

  x.putImageData(data, 0, 0);
  silhouetteCache.set(img, c);
  return c;
}

type EaseFn = (p: number) => number;
const EASE: Record<SparEasing, EaseFn> = {
  linear: (p) => p,
  in: (p) => p * p,
  out: (p) => 1 - (1 - p) * (1 - p),
  inout: (p) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p)),
  expoin: (p) => (p <= 0 ? 0 : Math.pow(2, 10 * (p - 1))),
};

interface Pose {
  rot: number;
  x: number;
  y: number;
  sy: number;
  alpha: number;
}

const REST: Pose = { rot: 0, x: 0, y: 0, sy: 1, alpha: 1 };

function evalTrack(clip: SparClip, bone: string, prop: keyof Pose, t: number): number | null {
  for (const track of clip.tracks) {
    if (track.bone !== bone || track.prop !== prop) continue;
    const keys = track.keys;
    if (keys.length === 0) return null;
    if (t <= keys[0]!.t) return keys[0]!.v;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i]!;
      const b = keys[i + 1]!;
      if (t >= a.t && t <= b.t) {
        const span = b.t - a.t;
        const p = span <= 0 ? 1 : (t - a.t) / span;
        return a.v + (b.v - a.v) * EASE[a.e ?? 'inout'](p);
      }
    }
    return keys[keys.length - 1]!.v;
  }
  return null;
}

/** 評估某骨骼喺時間 t 嘅姿勢：idle 絕對值 + 增量 clip（如有）；enemy 骨骼唔跟 idle */
function evalPose(bone: string, idleT: number, deltaClip: SparClip | null, deltaT: number): Pose {
  const idle = SPAR_CLIPS.idle;
  const pose = { ...REST };
  (['rot', 'x', 'y', 'sy', 'alpha'] as const).forEach((prop) => {
    const base = bone === 'enemy' ? null : evalTrack(idle, bone, prop, idleT);
    if (base !== null) pose[prop] = base;
    if (deltaClip) {
      const d = evalTrack(deltaClip, bone, prop, deltaT);
      if (d !== null) {
        // alpha 屬絕對控制（death/spawn 用），其他屬疊加
        pose[prop] = prop === 'alpha' ? d : pose[prop] + d;
      }
    }
  });
  return pose;
}

interface Particle { x: number; y: number; vx: number; vy: number; r: number; age: number; dur: number }
interface Floater { x: number; y: number; text: string; gain: number; age: number; dur: number }
interface TrailDot { x: number; y: number; age: number }
interface SplashFx { x: number; y: number; rot: number; age: number; dur: number }

type EnemyState = 'spawn' | 'walk' | 'hold' | 'dead';
interface EnemyInst {
  x: number; // 畫面 css px（敵人企定唔郁、望左；主角行過去）
  state: EnemyState;
  t: number; // 狀態計時
  bob: number; // 浮沉相位
  stopJitter: number; // 停步距離倍率（前後錯開，唔會疊埋一舊）
  def: EnemyDef; // 邊款敵人（出敵池抽）
  speedMul: number; // 行路速度倍率（每隻唔同節奏）
  scaleMul: number; // 身形微調倍率
}

export interface SparStageImages {
  /** AI 剪影：俠客待機全身 */
  heroIdle: HTMLImageElement;
  /** AI 剪影：俠客揮擊全身 */
  heroAttack: HTMLImageElement;
  /** 出敵池剪影貼圖（同 EnemyDef 池一一對應） */
  enemies: HTMLImageElement[];
  splash: HTMLImageElement;
  /** 武器貼圖（剪影位圖模式可唔用；保留畀特效／將來） */
  weapon?: HTMLImageElement | null;
  /** 場景背景圖，用 setBackground 注入／切換（自動淡入淡出） */
  background?: HTMLImageElement | null;
  /** 修為浮字嘅 AI 水墨素材（未載好就用文字 fallback） */
  ui?: SparUiImages;
}

/** 修為浮字用嘅水墨素材：宣紙墨漬徽章＋朱砂書法字形 */
export interface SparUiImages {
  /** 朱砂「修為」 */
  xiuwei: HTMLImageElement | null;
  /** 宣紙色墨漬徽章底 */
  splashPaper: HTMLImageElement | null;
  /** 朱砂字形：'+' '.' '0'-'9' */
  glyphs: Record<string, HTMLImageElement>;
}

export interface SparStageOptions {
  canvas: HTMLCanvasElement;
  images: SparStageImages;
  /** 劍鋒到肉嗰刻觸發；回傳實際入賬修為（>0 先彈字） */
  onStrike?: () => number;
  rig?: AnyWarriorRig;
  /** 出敵池：每次入場隨機抽一款；冇俾就淨係墨影 */
  enemies?: EnemyDef[];
  weapon?: WeaponSpriteDef | null;
}

const ATTACK_COOLDOWN = 0.18; // 收招後幾耐再出手（射程內有敵即出手）

export class SparStage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private images: SparStageImages;
  private rig: AnyWarriorRig;
  /** 出敵池：每次入場隨機抽一款 */
  private enemyPool: EnemyDef[];
  private onStrike?: () => number;

  private weaponDef: WeaponSpriteDef | null = null;

  private bgImg: HTMLImageElement | null = null;
  private bgOpacity = 1;
  private bgPrev: HTMLImageElement | null = null;
  private bgFade = 1; // 1＝冇過場緊

  private cssW = 0;
  private cssH = 0;
  private dpr = 1;
  /** 俠客畫面 x（由左向右行過去敵人）；敵人 x 固定 */
  private heroX = 0;
  private laneResetting = false;
  /** 減少動態：仍行過去，但慢啲、唔震唔噴墨 */
  private quiet = false;

  private idleT = 0;
  private attackT: number | null = null;
  private firedStrike = false;
  private attackCooldown = 0.6;

  private enemies: EnemyInst[] = [];

  private hitStop = 0;
  private shake = 0;
  private flash = 0;
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private trail: TrailDot[] = [];
  private splashes: SplashFx[] = [];
  private prevTip: { x: number; y: number } | null = null;

  constructor(opts: SparStageOptions) {
    this.canvas = opts.canvas;
    const ctx = opts.canvas.getContext('2d');
    if (!ctx) throw new Error('spar: no 2d context');
    this.ctx = ctx;
    this.images = opts.images;
    this.rig = opts.rig ?? WARRIOR;
    this.enemyPool = opts.enemies && opts.enemies.length ? opts.enemies : [ENEMY_SHADOW];
    this.onStrike = opts.onStrike;
    this.weaponDef = opts.weapon ?? null;
    this.bgImg = opts.images.background ?? null;
  }

  /** 切換場景背景（0.6s 淡入淡出）；null＝冇背景；opacity 調淡背景令角色突出 */
  setBackground(img: HTMLImageElement | null, opacity = 1) {
    if (img === this.bgImg && opacity === this.bgOpacity) return;
    this.bgPrev = this.bgImg;
    this.bgImg = img;
    this.bgOpacity = opacity;
    this.bgFade = 0;
  }

  /** 換武器（裝備欄轉武器時叫）；null＝空手。剪影模式只讀 def.src 推斷兵種。 */
  setWeapon(def: WeaponSpriteDef | null, _img: HTMLImageElement | null) {
    this.weaponDef = def;
  }

  /** 減少動態：保留「行過去打敵人」核心觀感，關掉震屏／粒子 */
  setQuiet(quiet: boolean) {
    this.quiet = quiet;
  }

  /** 靜態模式：右邊擺兩個企定嘅敵人，唔行唔郁 */
  settleIntro() {
    if (this.cssW === 0) return;
    this.heroX = this.cssW * 0.12;
    this.laneResetting = false;
    const pick = (i: number) => this.enemyPool[i % this.enemyPool.length]!;
    // 敵人企喺右緣固定畫面位置，望左唔郁（俾俠客有空間行過去）
    this.enemies = [
      { x: this.cssW * 0.72, state: 'hold', t: 9, bob: 1.7, stopJitter: 1, def: pick(1), speedMul: 1, scaleMul: 1 },
      { x: this.cssW * 0.88, state: 'hold', t: 9, bob: 3.9, stopJitter: 1.55, def: pick(4), speedMul: 1, scaleMul: 1 },
    ];
  }

  /** 清場後／行盡右緣：俠客返左，右邊再企兩個望左敵人 */
  private resetLane() {
    this.heroX = this.cssW * 0.12;
    this.laneResetting = false;
    this.attackT = null;
    this.attackCooldown = 0.35;
    const pick = (i: number) => this.enemyPool[i % this.enemyPool.length]!;
    const defIdx = Math.floor(Math.random() * this.enemyPool.length);
    // 敵人企右邊，留出大半畫面畀主角行過去
    this.enemies = [
      { x: this.cssW * 0.70 + Math.random() * 12, state: 'spawn', t: 0, bob: Math.random() * 6, stopJitter: 1, def: pick(defIdx), speedMul: 1, scaleMul: 0.94 + Math.random() * 0.12 },
      { x: this.cssW * 0.86 + Math.random() * 14, state: 'spawn', t: 0, bob: Math.random() * 6, stopJitter: 1.4, def: pick((defIdx + 3) % this.enemyPool.length), speedMul: 1, scaleMul: 0.94 + Math.random() * 0.12 },
    ];
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
  }

  /** 推進一幀；dt 以秒計 */
  update(rawDt: number) {
    const dt = Math.min(rawDt, 0.05);
    if (this.hitStop > 0) {
      this.hitStop -= dt * (this.quiet ? 3 : 1);
      if (!this.quiet) return; // 打擊停格：時間凍結，淨係渲染（減少動態唔凍）
    }

    this.idleT = (this.idleT + dt * 1.35) % SPAR_CLIPS.idle.dur; // 向右行時節奏略快，似行路
    this.shake = Math.max(0, this.shake - dt * 22);
    this.flash = Math.max(0, this.flash - dt * 6);
    if (this.bgFade < 1) this.bgFade = Math.min(1, this.bgFade + dt / 0.6);

    this.geom(); // 確保 heroX 已初始化
    // 俠客向右行速：減少動態時放慢，但仍要明顯行過半個舞台
    const walkSpeed = (this.quiet ? 70 : 110) * (this.cssH / 218);

    // 敵人：望左企定，畫面 x 唔郁；淨處理出生／死亡
    for (const e of this.enemies) {
      e.bob += dt;
      if (e.state === 'spawn') {
        e.t += dt;
        if (e.t >= SPAR_CLIPS['enemy-spawn'].dur) { e.state = 'hold'; e.t = 0; }
      } else if (e.state === 'walk') {
        e.state = 'hold'; // 永不向俠客行
      } else if (e.state === 'dead') {
        e.t += dt;
      }
    }
    this.enemies = this.enemies.filter((e) => !(e.state === 'dead' && e.t >= SPAR_CLIPS['enemy-death'].dur));

    // 俠客行過去：畫面 x 向右加；揮擊中略慢但仍前進，唔好企死左邊
    const striking = this.attackT !== null;
    if (!this.laneResetting) {
      this.heroX += walkSpeed * dt * (striking ? 0.45 : 1);
    }

    // 行過右緣、或清場後繼續行過敵位 → 重置（主角返左，敵人再企右邊）
    const alive = this.enemies.filter((e) => e.state !== 'dead').length;
    if (!this.laneResetting && (this.heroX > this.cssW * 0.94 || (alive === 0 && this.heroX > this.cssW * 0.78))) {
      this.laneResetting = true;
      this.resetLane();
    }

    // 攻擊排程：射程內最近嘅敵影，入程即打
    const inRange = this.nearestInRange();
    if (this.attackT !== null) {
      const clip = this.attackClipNow();
      const prev = this.attackT;
      this.attackT += dt;
      for (const ev of clip.events ?? []) {
        if (prev < ev.t && this.attackT >= ev.t) this.fireStrike();
      }
      if (this.attackT >= clip.dur) {
        this.attackT = null;
        this.attackCooldown = ATTACK_COOLDOWN;
      }
    } else if (inRange) {
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        this.attackT = 0;
        this.firedStrike = false;
        this.trail = [];
      }
    } else {
      this.attackCooldown = Math.min(this.attackCooldown, 0.1);
    }

    // 特效老化
    const age = <T extends { age: number; dur: number }>(arr: T[], dtv: number) => {
      for (const it of arr) it.age += dtv;
      return arr.filter((it) => it.age < it.dur);
    };
    this.particles = age(this.particles, dt);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 240 * dt; // 微重力，墨滴下墜
    }
    this.floaters = age(this.floaters, dt);
    this.splashes = age(this.splashes, dt);
    this.trail = age(
      this.trail.map((d) => ({ ...d, dur: 0.26 })),
      dt,
    );
  }

  /** 而家用緊嘅揮擊 clip：v3 皮膚可以有自訂（霧接臂用溫和版） */
  private attackClipNow(): SparClip {
    const r = this.rig;
    return (isV3Rig(r) && r.attackClip) || SPAR_CLIPS.attack;
  }

  /** 武器射程（css px）：空手用拳距 */
  private reachPx() {
    return (this.weaponDef?.reach ?? 210) * this.geom().k;
  }

  private aliveEnemy(e: EnemyInst) {
    return e.state !== 'dead';
  }

  private nearestInRange(): EnemyInst | null {
    const g = this.geom();
    let best: EnemyInst | null = null;
    let bestD = Infinity;
    // 近戰先出手：要主角真係行埋去，唔好半個舞台外就揮劍
    const melee = this.reachPx() * 0.72 + this.cssW * 0.04;
    for (const e of this.enemies) {
      if (!this.aliveEnemy(e)) continue;
      const d = e.x - g.heroX; // 畫面距離：敵人喺俠客右邊
      if (d < -10) continue;
      if (d <= melee + this.enemyFront(e) && d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  private fireStrike() {
    if (this.firedStrike) return;
    this.firedStrike = true;
    this.hitStop = this.quiet ? 0 : 0.085;
    this.shake = this.quiet ? 0 : 4.5;
    this.flash = this.quiet ? 0 : 1;

    const target = this.nearestInRange();
    if (target && target.state !== 'dead') {
      target.state = 'dead';
      target.t = 0;
    }

    const g = this.geom();
    const ix = target ? target.x - 12 : g.heroX + this.reachPx() * 0.8;
    const iy = g.groundY - 300 * g.k * 1.05;

    const gained = this.onStrike?.() ?? 0;
    if (gained > 0) {
      // 修為累積有浮點尾數（1.0000000000000004），顯示時收返整
      const shown = Math.abs(gained - Math.round(gained)) < 1e-6 ? Math.round(gained) : Number(gained.toFixed(1));
      this.floaters.push({ x: ix, y: iy - 14, text: `+${shown} 修為`, gain: shown, age: 0, dur: 1.15 });
    }
    this.splashes.push({ x: ix, y: iy, rot: Math.random() * Math.PI * 2, age: 0, dur: 0.5 });
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 130;
      this.particles.push({
        x: ix,
        y: iy,
        vx: Math.cos(a) * sp + 60, // 墨點順住劍勢向右飛
        vy: Math.sin(a) * sp - 30,
        r: 0.8 + Math.random() * 2.6,
        age: 0,
        dur: 0.5 + Math.random() * 0.35,
      });
    }
  }

  /** 舞台幾何：全部 px（CSS 像素）。俠客由左行過去；敵人右邊企定望左 */
  private geom() {
    const h = this.cssH;
    const k = (h * 0.82) / SILHOUETTE_DESIGN_H;
    // 首次／重設：俠客由左邊起步
    if (this.heroX <= 0) this.heroX = this.cssW * 0.12;
    return {
      k,
      groundY: h * 0.92,
      heroX: this.heroX,
    };
  }

  /** 敵影縮放：剪影模式唔跟舊貼圖高度（否則高圖敵人會縮成火柴） */
  private enemyKe(e: EnemyInst) {
    const g = this.geom();
    return g.k * 1.06 * (e.def.scale ?? 1) * e.scaleMul;
  }

  /** 敵人前緣伸出（css px）——剪影袍身約 90du 半寬 */
  private enemyFront(e: EnemyInst) {
    return 90 * this.enemyKe(e) * 0.45;
  }

  render() {
    const { ctx } = this;
    const g = this.geom();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssW, this.cssH);
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    this.drawBackground();

    // 地面淡墨影
    this.shadow(g.heroX, g.groundY, 60 * g.k);
    for (const e of this.enemies) {
      if (this.enemyAlpha(e) > 0.01) this.shadow(e.x, g.groundY, 68 * this.enemyKe(e));
    }

    // 敵影先畫（喺俠客身後）
    for (const e of this.enemies) this.drawEnemy(g, e);
    const tip = this.drawWarrior(g);

    // 武器鋒拖墨：攻擊爆發段先記錄
    const attacking = this.attackT !== null && this.attackT > 0.16 && this.attackT < 0.46;
    if (attacking && tip) {
      if (this.prevTip) {
        const moved = Math.hypot(tip.x - this.prevTip.x, tip.y - this.prevTip.y);
        if (moved > 1.2) this.trail.push({ x: tip.x, y: tip.y, age: 0 });
      }
      this.prevTip = tip;
    } else {
      this.prevTip = null;
    }
    this.drawTrail();
    this.drawSplashes();
    this.drawParticles();
    this.drawFloaters();

    // 敵影受擊白閃：全台微微提亮一瞬（極輕）
    if (this.flash > 0.5) {
      ctx.fillStyle = `rgba(240,233,216,${(this.flash - 0.5) * 0.12})`;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
  }

  /** 場景背景：cover 貼底 + 冷霧罩層，襯托純黑影角色 */
  private drawBackground() {
    const { ctx } = this;
    const drawOne = (img: HTMLImageElement, alpha: number) => {
      const scale = Math.max(this.cssW / img.width, this.cssH / img.height) * 1.08;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const drift = Math.sin(this.idleT * 0.18) * 5 - (this.heroX * 0.04) % 40;
      const dx = (this.cssW - dw) / 2 + drift;
      const dy = this.cssH - dh;
      ctx.save();
      ctx.globalAlpha = alpha * this.bgOpacity;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };
    if (this.bgPrev && this.bgFade < 1) drawOne(this.bgPrev, 1 - this.bgFade);
    if (this.bgImg) drawOne(this.bgImg, this.bgFade);
    if (this.bgFade >= 1) this.bgPrev = null;

    // 冷青灰霧：把彩色山水壓成參考圖嗰種煙嵐剪影舞台
    ctx.save();
    ctx.globalAlpha = 0.55 * this.bgOpacity;
    const mist = ctx.createLinearGradient(0, 0, 0, this.cssH);
    mist.addColorStop(0, 'rgba(55, 72, 92, 0.55)');
    mist.addColorStop(0.45, 'rgba(70, 88, 108, 0.28)');
    mist.addColorStop(0.78, 'rgba(90, 100, 110, 0.12)');
    mist.addColorStop(1, 'rgba(120, 118, 110, 0.05)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    ctx.restore();
  }

  private enemyAlpha(e: EnemyInst): number {
    return this.enemyPose(e).alpha;
  }

  private enemyPose(e: EnemyInst): Pose {
    if (e.state === 'dead') return evalPose('enemy', this.idleT, SPAR_CLIPS['enemy-death'], e.t);
    if (e.state === 'spawn') return evalPose('enemy', this.idleT, SPAR_CLIPS['enemy-spawn'], e.t);
    const bobY = Math.sin(e.bob * (e.state === 'walk' ? 8.5 : 2.4)) * (e.state === 'walk' ? 3.4 : 2.2);
    return { ...REST, y: bobY };
  }

  private shadow(x: number, y: number, rx: number) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = `rgba(${INK},0.22)`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawWarrior(g: ReturnType<SparStage['geom']>): { x: number; y: number } | null {
    const { ctx } = this;
    const attack = this.attackT !== null ? this.attackClipNow() : null;
    const at = this.attackT ?? 0;
    const body = evalPose('body', this.idleT, attack, at);
    const arm = evalPose('arm', this.idleT, attack, at);
    const wep = evalPose('weapon', this.idleT, attack, at);

    const fx = g.heroX + body.x * g.k;
    const fy = g.groundY + body.y * g.k;
    const src = this.weaponDef?.src ?? '';
    const weaponKind = !this.weaponDef
      ? weaponFromKind(null)
      : src.includes('blade')
        ? weaponFromKind('blade')
        : src.includes('spear')
          ? weaponFromKind('spear')
          : src.includes('staff')
            ? weaponFromKind('staff')
            : src.includes('bow')
              ? weaponFromKind('bow')
              : src.includes('hidden')
                ? weaponFromKind('hidden')
                : src.includes('whip')
                  ? weaponFromKind('whip')
                  : weaponFromKind('sword');

    const striking = this.attackT !== null && this.attackT > 0.18 && this.attackT < 0.55;
    const heroImg = striking ? this.images.heroAttack : this.images.heroIdle;
    const part = striking ? HERO_SIL.attack : HERO_SIL.idle;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(body.rot * DEG);
    ctx.scale(1, body.sy);
    drawSilhouetteSprite(ctx, heroImg, {
      k: g.k,
      w: part.w,
      h: part.h,
      dx: part.dx,
      dy: part.dy,
    });

    ctx.save();
    ctx.rotate(arm.rot * DEG * 0.15);
    ctx.rotate(wep.rot * DEG * 0.1);
    const local = weaponTipLocal(weaponKind, g.k);
    const m = ctx.getTransform();
    const tip = {
      x: (m.a * local.x + m.c * local.y + m.e) / this.dpr,
      y: (m.b * local.x + m.d * local.y + m.f) / this.dpr,
    };
    ctx.restore();
    ctx.restore();

    return tip;
  }

  private drawEnemy(g: ReturnType<SparStage['geom']>, e: EnemyInst) {
    const pose = this.enemyPose(e);
    if (pose.alpha <= 0.01) return;
    const { ctx } = this;
    const ke = this.enemyKe(e);
    const footX = e.x + pose.x * ke;
    const footY = g.groundY + pose.y * ke;
    const idx = Math.max(0, this.enemyPool.indexOf(e.def));
    const enemyImg = this.images.enemies[idx] ?? this.images.enemies[0];
    if (!enemyImg) return;

    if (e.state !== 'dead') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pose.alpha)) * 0.9;
      const pulse = 0.55 + 0.25 * Math.sin(e.bob * 2.6);
      const rg = ctx.createRadialGradient(footX, footY, 2, footX, footY, 58 * ke);
      rg.addColorStop(0, `rgba(${CINNABAR},${0.5 * pulse})`);
      rg.addColorStop(0.45, `rgba(${CINNABAR},${0.16 * pulse})`);
      rg.addColorStop(1, `rgba(${CINNABAR},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(footX, footY, 54 * ke, 15 * ke, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pose.alpha));
    ctx.translate(footX, footY);
    ctx.rotate(pose.rot * DEG);
    ctx.scale(1, pose.sy);
    // 素材本身望左，唔好再 flip（否則會變望右）
    drawSilhouetteSprite(ctx, enemyImg, {
      k: ke,
      flipX: false,
      w: e.def.part.w,
      h: e.def.part.h,
      dx: e.def.part.dx,
      dy: e.def.part.dy,
    });
    if (e.state !== 'dead') {
      const glow = 0.45 + 0.35 * Math.sin(e.bob * 3.1);
      for (const eye of e.def.eyes) {
        const ex = eye.x * ke;
        const ey = eye.y * ke;
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14 * ke);
        grad.addColorStop(0, `rgba(${CINNABAR},${glow})`);
        grad.addColorStop(1, `rgba(${CINNABAR},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex, ey, 14 * ke, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * 劍鋒拖墨（參考水墨動作遊戲嘅斬擊殘影）：軌跡畫做一條漸幼漸淡嘅墨帶，
   * 最新一段加宣紙白刃高光——快揮嗰陣就好似一彎墨虹掃過，唔再係一串圓點。
   */
  private drawTrail() {
    const { ctx } = this;
    const pts = this.trail;
    if (pts.length < 2) return;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const pa = a.age / 0.26;
      const pb = b.age / 0.26;
      if (pa >= 1) continue;
      const wa = 8 * (1 - pa) + 0.6;
      const wb = 8 * (1 - pb) + 0.6;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      ctx.fillStyle = `rgba(${INK},${0.4 * (1 - pa)})`;
      ctx.beginPath();
      ctx.moveTo(a.x + nx * wa, a.y + ny * wa);
      ctx.lineTo(b.x + nx * wb, b.y + ny * wb);
      ctx.lineTo(b.x - nx * wb, b.y - ny * wb);
      ctx.lineTo(a.x - nx * wa, a.y - ny * wa);
      ctx.closePath();
      ctx.fill();
    }
    // 白刃高光：最新 0.09s 嘅鋒口
    ctx.strokeStyle = 'rgba(250,246,238,0.85)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let started = false;
    for (const d of pts) {
      if (d.age > 0.09) continue;
      if (!started) {
        ctx.moveTo(d.x, d.y);
        started = true;
      } else ctx.lineTo(d.x, d.y);
    }
    if (started) ctx.stroke();
  }

  private drawSplashes() {
    const { ctx } = this;
    for (const s of this.splashes) {
      const p = s.age / s.dur;
      const scale = (0.45 + p * 0.6) * (this.cssH / 218);
      const size = 225 * scale;
      ctx.save();
      ctx.globalAlpha = Math.pow(1 - p, 1.4) * 0.9;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.drawImage(toInkSilhouette(this.images.splash), -size / 2, -size / 2, size, size * (this.images.splash.height / this.images.splash.width));
      ctx.restore();
    }
  }

  private drawParticles() {
    const { ctx } = this;
    for (const pt of this.particles) {
      const p = pt.age / pt.dur;
      ctx.fillStyle = `rgba(${INK},${0.75 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * (1 - p * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFloaters() {
    const { ctx } = this;
    const ui = this.images.ui;
    for (const f of this.floaters) {
      const p = f.age / f.dur;
      const alpha = p < 0.15 ? p / 0.15 : 1 - Math.pow((p - 0.15) / 0.85, 2);
      const ty = f.y - p * 38;
      // AI 水墨版：宣紙墨漬徽章＋朱砂書法字形（未載好就用文字 fallback）
      if (ui?.splashPaper && ui.xiuwei && ui.glyphs['+']) {
        const gh = 17; // 數字字形高（css px）
        const lh = 15; // 「修為」高
        const chars = `+${f.gain}`;
        let w = 4; // 數字同修為之間嘅空隙
        w += (ui.xiuwei.width / ui.xiuwei.height) * lh;
        for (const c of chars) {
          const g = ui.glyphs[c];
          if (!g) continue;
          w += (g.width / g.height) * gh + 1.5;
        }
        ctx.save();
        ctx.globalAlpha = alpha * 0.94;
        // 墨漬徽章（微微彈出）
        const pop = p < 0.18 ? 0.7 + (p / 0.18) * 0.3 : 1;
        const sp = ui.splashPaper;
        const sh = Math.max(44, (gh + 26) * pop);
        const sw = (sp.width / sp.height) * sh;
        ctx.drawImage(sp, f.x - sw / 2, ty - sh / 2 - gh * 0.32, sw, sh);
        // 朱砂字形由左至右排
        let cx = f.x - w / 2;
        for (const c of chars) {
          const g = ui.glyphs[c];
          if (!g) continue;
          const gw = (g.width / g.height) * gh;
          ctx.drawImage(g, cx, ty - gh * 0.82, gw, gh);
          cx += gw + 1.5;
        }
        const lw = (ui.xiuwei.width / ui.xiuwei.height) * lh;
        ctx.drawImage(ui.xiuwei, cx + 2.5, ty - lh * 0.72, lw, lh);
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `600 13px 'Kaiti TC', 'STKaiti', 'KaiTi', serif`;
      ctx.textAlign = 'center';
      // 宣紙色光暈打底，朱砂字先唔會俾深色敵影食咗
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(240,233,216,0.92)';
      ctx.strokeText(f.text, f.x, ty);
      ctx.fillStyle = `rgba(${CINNABAR},1)`;
      ctx.fillText(f.text, f.x, ty);
      ctx.restore();
    }
  }
}

/** 載入 AI 剪影位圖（俠客待機／揮擊＋敵人池）＋特效；角色可失敗用佔位，splash 必要 */
export function loadSparImages(
  _rig: AnyWarriorRig = WARRIOR,
  enemies: EnemyDef[] = [ENEMY_SHADOW],
  splashSrc?: string,
): Promise<SparStageImages> {
  const loadOptional = (src: string) =>
    new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        const blank = document.createElement('canvas');
        blank.width = 1;
        blank.height = 1;
        const placeholder = new Image();
        placeholder.src = blank.toDataURL();
        placeholder.onload = () => resolve(placeholder);
      };
      img.src = src;
    });
  const loadRequired = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`spar asset failed: ${src}`));
      img.src = src;
    });
  return Promise.all([
    loadOptional(HERO_SIL.idle.src),
    loadOptional(HERO_SIL.attack.src),
    ...enemies.map((d) => loadOptional(d.part.src)),
    loadRequired(splashSrc ?? `${import.meta.env.BASE_URL || '/'}ink/spar/fx-splash.webp`),
  ]).then((loaded) => {
    const heroIdle = loaded[0]!;
    const heroAttack = loaded[1]!;
    const enemyImgs = loaded.slice(2, 2 + enemies.length);
    const splash = loaded[2 + enemies.length]!;
    return { heroIdle, heroAttack, enemies: enemyImgs, splash };
  });
}

/** 載入修為浮字嘅水墨素材；邊張載唔到就嗰張留空（floater 會用返文字 fallback） */
export function loadSparUiImages(): Promise<SparUiImages> {
  const base = `${import.meta.env.BASE_URL || '/'}ink/ui/`;
  const tryLoad = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  const keys = ['+', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const file = (k: string) => (k === '+' ? 'r-plus.webp' : k === '.' ? 'r-dot.webp' : `r-${k}.webp`);
  return Promise.all([tryLoad(`${base}r-xiuwei.webp`), tryLoad(`${base}splash-paper.webp`), ...keys.map((k) => tryLoad(`${base}${file(k)}`))]).then(
    ([xiuwei, splashPaper, ...gs]) => {
      const glyphs: Record<string, HTMLImageElement> = {};
      keys.forEach((k, i) => {
        const g = gs[i];
        if (g) glyphs[k] = g;
      });
      return { xiuwei: xiuwei ?? null, splashPaper: splashPaper ?? null, glyphs };
    },
  );
}

/** 載入單張素材（武器／背景通用） */
export function loadSparImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`spar asset failed: ${src}`));
    img.src = src;
  });
}
