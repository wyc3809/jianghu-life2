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

const DEG = Math.PI / 180;
const INK = '22,19,15';
const CINNABAR = '168,51,31';
/** 純黑影風格：英雄青帶點綴（對照剪影動作遊戲嘅色帶） */
const SASH_BLUE = '48,110,190';

/**
 * 將彩色貼圖轉成「純黑影 + 淡宣紙描邊」並快取。
 * 透明區保留；實心區壓成近黑，外緣一圈淡白線——唔使重畫素材。
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
    // 近純黑，略留一點層次（用原本亮度做極微灰階，保持剪影可讀）
    const lum = (src[i]! * 0.3 + src[i + 1]! * 0.59 + src[i + 2]! * 0.11) / 255;
    const v = Math.round(8 + lum * 18);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v + 2;
    d[i + 3] = a;
  }

  // 淡白描邊：透明像素若鄰近不透明，塗淡宣紙色
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

function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  ctx.drawImage(toInkSilhouette(img), dx, dy, dw, dh);
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
  x: number; // css px（敵影淨係由右邊上，面向左行向俠客）
  state: EnemyState;
  t: number; // 狀態計時
  bob: number; // 浮沉相位
  stopJitter: number; // 停步距離倍率（前後錯開，唔會疊埋一舊）
  def: EnemyDef; // 邊款敵人（出敵池抽）
  speedMul: number; // 行路速度倍率（每隻唔同節奏）
  scaleMul: number; // 身形微調倍率
}

export interface SparStageImages {
  body: HTMLImageElement;
  /** v3 一圖切件冇獨立頭件，可留空 */
  head?: HTMLImageElement;
  arm: HTMLImageElement;
  /** v3 肩位遮縫墨痕（v3 皮膚先有） */
  patch?: HTMLImageElement;
  /** 出敵池貼圖（同 EnemyDef 池一一對應） */
  enemies: HTMLImageElement[];
  splash: HTMLImageElement;
  /** 武器貼圖可以之後先載入／轉款，用 setWeapon 注入 */
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

const MAX_ENEMIES = 3;
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
  private weaponImg: HTMLImageElement | null = null;

  private bgImg: HTMLImageElement | null = null;
  private bgOpacity = 1;
  private bgPrev: HTMLImageElement | null = null;
  private bgFade = 1; // 1＝冇過場緊

  private cssW = 0;
  private cssH = 0;
  private dpr = 1;

  private idleT = 0;
  private attackT: number | null = null;
  private firedStrike = false;
  private attackCooldown = 0.6;

  private enemies: EnemyInst[] = [];
  private spawnTimer = 0.4;
  private lastDefIdx = -1;

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
    this.weaponImg = opts.images.weapon ?? null;
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

  /** 換武器（裝備欄轉武器時叫）；null＝空手 */
  setWeapon(def: WeaponSpriteDef | null, img: HTMLImageElement | null) {
    this.weaponDef = def;
    this.weaponImg = def ? img : null;
  }

  /** 靜態模式：右邊擺兩個企定嘅敵人，唔行唔郁 */
  settleIntro() {
    if (this.cssW === 0) return;
    const g = this.geom();
    const stop = this.stopDist();
    const pick = (i: number) => this.enemyPool[i % this.enemyPool.length]!;
    this.enemies = [
      { x: g.heroX + stop, state: 'hold', t: 9, bob: 1.7, stopJitter: 1, def: pick(1), speedMul: 1, scaleMul: 1 },
      { x: g.heroX + stop * 1.45, state: 'hold', t: 9, bob: 3.9, stopJitter: 1.45, def: pick(4), speedMul: 1, scaleMul: 1 },
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
      this.hitStop -= dt;
      return; // 打擊停格：時間凍結，淨係渲染
    }

    this.idleT = (this.idleT + dt) % SPAR_CLIPS.idle.dur;
    this.shake = Math.max(0, this.shake - dt * 22);
    this.flash = Math.max(0, this.flash - dt * 6);
    if (this.bgFade < 1) this.bgFade = Math.min(1, this.bgFade + dt / 0.6);

    const g = this.geom();
    const walkSpeed = 64 * (this.cssH / 218); // css px/s（每隻敵再乘自己嘅速度倍率）
    const stop = this.stopDist();

    // 敵人推進
    for (const e of this.enemies) {
      e.bob += dt;
      if (e.state === 'spawn') {
        e.t += dt;
        if (e.t >= SPAR_CLIPS['enemy-spawn'].dur) { e.state = 'walk'; e.t = 0; }
      } else if (e.state === 'walk') {
        e.x -= walkSpeed * e.speedMul * dt; // 由右向左行向俠客
        if (e.x - g.heroX <= stop * e.stopJitter + this.enemyFront(e)) e.state = 'hold';
      } else if (e.state === 'dead') {
        e.t += dt;
      }
    }
    this.enemies = this.enemies.filter((e) => !(e.state === 'dead' && e.t >= SPAR_CLIPS['enemy-death'].dur));

    // 補充敵人：保持場上至少兩個，全部由右邊上；入場間隔／位置／速度／身形每隻都微調，
    // 等每次上場都啱啱好有少少唔同，唔會似流水線
    const active = this.enemies.filter((e) => e.state !== 'dead').length;
    if (active < 2) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.enemies.length < MAX_ENEMIES) {
        // 唔好連續出同款，招式先有多樣感
        let defIdx = Math.floor(Math.random() * this.enemyPool.length);
        if (this.enemyPool.length > 1 && defIdx === this.lastDefIdx) {
          defIdx = (defIdx + 1 + Math.floor(Math.random() * (this.enemyPool.length - 1))) % this.enemyPool.length;
        }
        this.lastDefIdx = defIdx;
        const def = this.enemyPool[defIdx]!;
        const scaleMul = 0.94 + Math.random() * 0.12;
        // 停步梯級：前中後三段錯開；同場上敵人嘅停步位至少隔開 52px，唔會疊埋一舊
        let stopJitter = 0.9 + (this.enemies.length * 0.5) % 1.5 + Math.random() * 0.12;
        const candPos = () => stop * stopJitter + def.part.w * (g.k * (this.rig.designHeight / def.part.h) * 1.05 * (def.scale ?? 1) * scaleMul) * 0.22;
        for (const other of this.enemies) {
          if (other.state === 'dead') continue;
          const otherPos = stop * other.stopJitter + this.enemyFront(other);
          while (Math.abs(candPos() - otherPos) < 52 && stopJitter < 2.0) {
            stopJitter += 0.3;
          }
        }
        // 最遠停步位都一定要喺攻擊判定內（長兵器 reach 大，梯級上限要收窄）
        stopJitter = Math.min(stopJitter, (this.reachPx() + 55) / stop);
        this.enemies.push({
          x: this.cssW + 40 + Math.random() * 90,
          state: 'spawn',
          t: 0,
          bob: Math.random() * 6,
          stopJitter,
          def,
          speedMul: 0.85 + Math.random() * 0.45,
          scaleMul,
        });
        this.spawnTimer = 0.3 + Math.random() * 0.55;
      }
    } else {
      this.spawnTimer = Math.max(this.spawnTimer, 0.25);
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

  /** 敵影停步位（css px，離俠客中線）——一定要細過攻擊判定，否則企喺射程外永遠僵持 */
  private stopDist() {
    return this.reachPx() * 0.8 + 6;
  }

  private aliveEnemy(e: EnemyInst) {
    return e.state !== 'dead';
  }

  private nearestInRange(): EnemyInst | null {
    const g = this.geom();
    let best: EnemyInst | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!this.aliveEnemy(e)) continue;
      const d = e.x - g.heroX; // 敵影全部喺右邊
      // 判定要涵蓋最遠停步位（連寬身敵人嘅前緣預鬆），否則企喺射程外永遠僵持
      if (d <= this.reachPx() + 62 + this.enemyFront(e) && d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  private fireStrike() {
    if (this.firedStrike) return;
    this.firedStrike = true;
    this.hitStop = 0.085;
    this.shake = 4.5;
    this.flash = 1;

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

  /** 舞台幾何：全部 px（CSS 像素）。俠客企台左，右邊留位俾敵影大軍壓境 */
  private geom() {
    const h = this.cssH;
    const k = (h * 0.62) / this.rig.designHeight;
    return {
      k,
      groundY: h * 0.9,
      heroX: this.cssW * 0.32,
    };
  }

  /** 某隻敵嘅貼圖縮放（敵影略高大；每款有身高倍率，每隻再有微調） */
  private enemyKe(e: EnemyInst) {
    const g = this.geom();
    return g.k * (this.rig.designHeight / e.def.part.h) * 1.05 * (e.def.scale ?? 1) * e.scaleMul;
  }

  /** 敵人貼圖左緣伸出錨點幾遠（css px）——寬身敵人（長槍／雙鉤）停步要預鬆啲，否則身軀壓埋俠客 */
  private enemyFront(e: EnemyInst) {
    return e.def.part.w * this.enemyKe(e) * 0.22;
  }

  private enemyImg(e: EnemyInst): HTMLImageElement {
    const i = this.enemyPool.indexOf(e.def);
    return this.images.enemies[i >= 0 ? i : 0]!;
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
      const drift = Math.sin(this.idleT * 0.18) * 5;
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
    const rig = this.rig;
    const v3 = isV3Rig(rig);
    const attack = this.attackT !== null ? this.attackClipNow() : null;
    const at = this.attackT ?? 0;
    const body = evalPose('body', this.idleT, attack, at);
    const head = v3 ? null : evalPose('head', this.idleT, attack, at);
    const arm = evalPose('arm', this.idleT, attack, at);
    const wep = evalPose('weapon', this.idleT, attack, at);

    const fx = g.heroX + body.x * g.k;
    const fy = g.groundY + body.y * g.k;

    let tip: { x: number; y: number } | null = null;

    const bodyPart = v3 ? rig.skin.full : rig.skin.body;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(body.rot * DEG);
    ctx.scale(1, body.sy);
    drawSilhouette(ctx, this.images.body, bodyPart.dx * g.k, bodyPart.dy * g.k, bodyPart.w * g.k, bodyPart.h * g.k);
    // 青帶：腰間飄帶，跟身搖——純黑影唯一色點
    this.drawHeroSash(g.k, arm.rot);
    ctx.restore();

    const armPart = v3 ? rig.skin.arm : rig.skin.arm;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(body.rot * DEG);
    ctx.scale(1, body.sy);
    ctx.translate(rig.shoulderSocket.x * g.k, rig.shoulderSocket.y * g.k);
    ctx.rotate(arm.rot * DEG);
    drawSilhouette(ctx, this.images.arm, armPart.dx * g.k, armPart.dy * g.k, armPart.w * g.k, armPart.h * g.k);
    if (v3 && this.images.patch) {
      ctx.save();
      ctx.rotate(-arm.rot * DEG);
      const pp = rig.skin.shoulderPatch;
      drawSilhouette(ctx, this.images.patch, pp.dx * g.k, pp.dy * g.k, pp.w * g.k, pp.h * g.k);
      ctx.restore();
    }
    ctx.translate(this.rig.gripSocket.x * g.k, this.rig.gripSocket.y * g.k);
    if (this.weaponDef && this.weaponImg) {
      const wd = this.weaponDef;
      const kw = (this.rig.designHeight * wd.lengthRatio) / wd.h;
      ctx.rotate((wd.restRot + wep.rot) * DEG);
      drawSilhouette(
        ctx,
        this.weaponImg,
        -wd.grip.x * kw * g.k,
        -wd.grip.y * kw * g.k,
        wd.w * kw * g.k,
        wd.h * kw * g.k,
      );
      const m = ctx.getTransform();
      const tx = (wd.tip.x - wd.grip.x) * kw * g.k;
      const ty = (wd.tip.y - wd.grip.y) * kw * g.k;
      tip = {
        x: (m.a * tx + m.c * ty + m.e) / this.dpr,
        y: (m.b * tx + m.d * ty + m.f) / this.dpr,
      };
    }
    ctx.restore();

    if (!v3 && head && this.images.head) {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(body.rot * DEG);
      ctx.scale(1, body.sy);
      ctx.translate(rig.neckSocket.x * g.k, rig.neckSocket.y * g.k);
      ctx.rotate(head.rot * DEG);
      drawSilhouette(
        ctx,
        this.images.head,
        rig.skin.head.dx * g.k,
        rig.skin.head.dy * g.k,
        rig.skin.head.w * g.k,
        rig.skin.head.h * g.k,
      );
      ctx.restore();
    }

    return tip;
  }

  /** 俠客腰間青帶（局部座標系：已喺身 transform 之內） */
  private drawHeroSash(k: number, armRot: number) {
    const { ctx } = this;
    const sway = Math.sin(this.idleT * 2.4) * 6 + armRot * 0.08;
    const baseX = 8 * k;
    const baseY = -210 * k;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = `rgba(${SASH_BLUE},0.95)`;
    ctx.lineWidth = Math.max(2.2, 3.2 * k);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.bezierCurveTo(
      baseX + 18 * k + sway,
      baseY + 22 * k,
      baseX + 34 * k + sway * 1.4,
      baseY + 48 * k,
      baseX + 22 * k + sway * 0.6,
      baseY + 78 * k,
    );
    ctx.stroke();
    ctx.strokeStyle = `rgba(${SASH_BLUE},0.55)`;
    ctx.lineWidth = Math.max(1.4, 2 * k);
    ctx.beginPath();
    ctx.moveTo(baseX - 4 * k, baseY + 4 * k);
    ctx.bezierCurveTo(
      baseX + 10 * k - sway * 0.5,
      baseY + 28 * k,
      baseX + 28 * k - sway,
      baseY + 52 * k,
      baseX + 14 * k - sway * 0.3,
      baseY + 72 * k,
    );
    ctx.stroke();
    ctx.restore();
  }

  private drawEnemy(g: ReturnType<SparStage['geom']>, e: EnemyInst) {
    const pose = this.enemyPose(e);
    if (pose.alpha <= 0.01) return;
    const { ctx } = this;
    const { part } = e.def;
    const ke = this.enemyKe(e);
    const footX = e.x;
    const footY = g.groundY + pose.y * ke;

    // 腳底殺氣紅光（Boss 感）
    if (e.state !== 'dead') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pose.alpha)) * 0.85;
      const pulse = 0.55 + 0.25 * Math.sin(e.bob * 2.6);
      const rg = ctx.createRadialGradient(footX, footY, 2, footX, footY, 56 * ke);
      rg.addColorStop(0, `rgba(${CINNABAR},${0.45 * pulse})`);
      rg.addColorStop(0.45, `rgba(${CINNABAR},${0.14 * pulse})`);
      rg.addColorStop(1, `rgba(${CINNABAR},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(footX, footY, 52 * ke, 14 * ke, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pose.alpha));
    ctx.translate(footX, footY);
    ctx.rotate(pose.rot * DEG);
    ctx.scale(1, pose.sy);
    drawSilhouette(ctx, this.enemyImg(e), part.dx * ke, part.dy * ke, part.w * ke, part.h * ke);
    if (e.state !== 'dead') {
      const glow = 0.5 + 0.35 * Math.sin(e.bob * 3.1);
      for (const eye of e.def.eyes) {
        const ex = eye.x * ke;
        const ey = eye.y * ke;
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 10 * ke);
        grad.addColorStop(0, `rgba(${CINNABAR},${glow})`);
        grad.addColorStop(1, `rgba(${CINNABAR},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex, ey, 10 * ke, 0, Math.PI * 2);
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

/** 載入俠客＋敵人池＋特效素材；武器貼圖用 loadSparImage 另外載（可以換） */
export function loadSparImages(
  rig: AnyWarriorRig = WARRIOR,
  enemies: EnemyDef[] = [ENEMY_SHADOW],
  splashSrc?: string,
): Promise<SparStageImages> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`spar asset failed: ${src}`));
      img.src = src;
    });
  const v3 = isV3Rig(rig);
  const skinSrcs = v3 ? [rig.skin.full.src, rig.skin.arm.src, rig.skin.shoulderPatch.src] : [rig.skin.body.src, rig.skin.head.src, rig.skin.arm.src];
  return Promise.all([
    ...skinSrcs.map(load),
    ...enemies.map((d) => load(d.part.src)),
    load(splashSrc ?? `${import.meta.env.BASE_URL || '/'}ink/spar/fx-splash.webp`),
  ]).then((loaded) => {
    const rest = loaded.slice(skinSrcs.length);
    const enemyImgs = rest.slice(0, enemies.length);
    const splash = rest[enemies.length]!;
    if (v3) {
      const [body, arm, patch] = loaded;
      return { body: body!, arm: arm!, patch: patch!, enemies: enemyImgs, splash };
    }
    const [body, head, arm] = loaded;
    return { body: body!, head: head!, arm: arm!, enemies: enemyImgs, splash };
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
