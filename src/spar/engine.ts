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
  HERO_WALK_FRAMES,
  HERO_ATK_FRAMES,
  HERO_LAYERS,
  SILHOUETTE_DESIGN_H,
  HERO_WEAPON_GRIPS,
  WEAPON_SIL_LENGTH,
  attackFrameIndex,
  drawSilhouetteSprite,
  walkFrameIndex,
  weaponFromKind,
} from './silhouetteDraw';
import { AnimDirector, type DirectorSample } from './animDirector';
import { formatSparNumber } from '@core/life/sparDuel';

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
type FloaterKind = 'xp' | 'dmg' | 'crit' | 'heal' | 'hurt';
interface Floater { x: number; y: number; text: string; gain: number; age: number; dur: number; kind?: FloaterKind }
interface CoinFx { x: number; y: number; vx: number; vy: number; rot: number; vr: number; age: number; dur: number; groundY: number }
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
  boss: boolean; // 首領（身形大啲、出手快啲）
  hitT: number; // 受擊後退計時（大＝冇受擊）
  atkTimer: number; // 距離下一次出手
  lungeT: number | null; // 撲擊動作計時
  lungeHit: boolean; // 今次撲擊已結算
}

export interface SparStageImages {
  /** AI 剪影：俠客待機全身 */
  heroIdle: HTMLImageElement;
  /** AI 剪影：俠客揮擊全身 */
  heroAttack: HTMLImageElement;
  /** A：行路多幀 */
  heroWalk?: HTMLImageElement[];
  /** A：揮擊多幀 */
  heroAtk?: HTMLImageElement[];
  /** C：分層身／笠／臂 */
  layerBody?: HTMLImageElement | null;
  layerHat?: HTMLImageElement | null;
  layerArm?: HTMLImageElement | null;
  /** 出敵池剪影貼圖（同 EnemyDef 池一一對應） */
  enemies: HTMLImageElement[];
  splash: HTMLImageElement;
  /** 武器貼圖（剪影位圖模式可唔用；保留畀特效／將來） */
  weapon?: HTMLImageElement | null;
  /** 場景背景圖，用 setBackground 注入／切換（自動淡入淡出） */
  background?: HTMLImageElement | null;
  /** 修為浮字嘅 AI 水墨素材（未載好就用文字 fallback） */
  ui?: SparUiImages;
  /** 首領掉落銅錢（位圖） */
  coin?: HTMLImageElement | null;
}

/**
 * 對打鈎（演武台長血條玩法）：引擎淨係播動畫，數值同關卡由外面（core/life/sparDuel）話事。
 * 唔俾就係舊玩法（一擊一個、彈修為字）。
 */
export interface SparCombatHooks {
  /** 主角劍鋒到肉 */
  heroStrike(): { dmg: number; crit: boolean; heal: number; killed: boolean };
  /** 敵人撲擊到肉 */
  foeStrike(): { dmg: number; heroDown: boolean };
  /** 下一個出場敵人：係咪首領、用邊款剪影（ENEMY_POOL 索引，按關卡主題） */
  nextFoe(): { boss: boolean; look?: number };
  /** 敵人倒地動畫完：換下一個（或過關）；回傳要彈幾多個銅錢 */
  foeDefeated(): { coins: number };
  /** 敗退倒地動畫完：退一關、回血 */
  heroRecovered(): void;
}

/** 血條等 DOM 浮層嘅錨點（css px） */
export interface SparAnchors {
  heroX: number;
  heroHeadY: number;
  foeX: number | null;
  foeHeadY: number;
  foeBoss: boolean;
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
  combat?: SparCombatHooks;
}

/** 敵人撲擊節奏（秒） */
const LUNGE_DUR = 0.55;
const LUNGE_HIT_AT = 0.3;
const HERO_DOWN_DUR = 1.6;

const ATTACK_COOLDOWN = 0.18; // 收招後幾耐再出手（射程內有敵即出手）

export class SparStage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private images: SparStageImages;
  private rig: AnyWarriorRig;
  /** 出敵池：每次入場隨機抽一款 */
  private enemyPool: EnemyDef[];
  private onStrike?: () => number;
  private combat?: SparCombatHooks;
  private coins: CoinFx[] = [];
  private heroHitT = 9;
  private heroDownT: number | null = null;
  private pendingDefeat = false;

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
  private director = new AnimDirector();
  private directorSample: DirectorSample | null = null;
  private walkT = 0;
  private heroFade = 1;
  private dust: { x: number; y: number; age: number; dur: number; vx: number }[] = [];
  private footClock = 0;

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
    this.combat = opts.combat;
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

  /** 換武器（裝備欄轉武器時叫）；null＝空手。兵器剪影掛喺每格握點（HERO_WEAPON_GRIPS）。 */
  setWeapon(def: WeaponSpriteDef | null, img: HTMLImageElement | null) {
    this.weaponDef = def;
    this.images.weapon = def ? img : null;
  }

  /** 減少動態：保留「行過去打敵人」核心觀感，關掉震屏／粒子 */
  setQuiet(quiet: boolean) {
    this.quiet = quiet;
  }

  /** 開局：右邊企一個望左敵人，一打一個 */
  settleIntro() {
    if (this.cssW === 0) return;
    // 0.20：縮小身形後留多啲行路空間
    this.heroX = this.cssW * 0.20;
    this.laneResetting = false;
    this.director.resetToEnter();
    this.walkT = 0;
    this.heroFade = 1;
    // 單挑：淨擺一個敵人喺右緣望左
    this.enemies = [this.makeEnemy(this.cssW * 0.74, 'hold', 1)];
  }

  /** 出一個敵人：對打模式問外面係咪首領（首領用鐵面／赤髮，身形大啲） */
  private makeEnemy(x: number, state: EnemyState, defIdx?: number): EnemyInst {
    const next = this.combat?.nextFoe();
    const boss = next?.boss ?? false;
    const pool = this.enemyPool;
    // 對打模式：剪影跟關卡主題（唔再亂抽）
    const idx = next?.look !== undefined ? next.look : defIdx ?? Math.floor(Math.random() * pool.length);
    return {
      x,
      state,
      t: state === 'hold' ? 9 : 0,
      bob: Math.random() * 6,
      stopJitter: 1,
      def: pool[idx % pool.length]!,
      speedMul: 1,
      scaleMul: boss ? 1.3 : 0.94 + Math.random() * 0.1,
      boss,
      hitT: 9,
      atkTimer: 1.1 + Math.random() * 0.5,
      lungeT: null,
      lungeHit: false,
    };
  }

  /** 清場後／行盡右緣：俠客返左，再出下一個望左敵人 */
  private resetLane() {
    this.heroX = this.cssW * 0.20;
    this.laneResetting = false;
    this.attackT = null;
    this.walkT = 0;
    this.heroFade = 0.45;
    this.attackCooldown = 0.28;
    this.heroDownT = null;
    this.heroHitT = 9;
    // 一打一個：每次淨補一個
    this.enemies = [this.makeEnemy(this.cssW * 0.72 + Math.random() * 16, 'spawn')];
  }

  /** 對打模式：敵人站位（固定右邊），俠客最多行到佢面前 */
  private foeSpotX() {
    return this.cssW * 0.7;
  }

  /** 對打企位間距：兩個剪影唔好疊埋，敵人撲擊剛好撲到 */
  private duelGap() {
    return Math.max(34, this.cssW * 0.11);
  }

  /** 俠客停步位：唔好穿過敵人 */
  private heroStopX(e: EnemyInst | null) {
    const ex = e ? e.x : this.foeSpotX();
    const front = e ? this.enemyFront(e) : 90 * this.geom().k * 0.45;
    return ex - this.duelGap() - front;
  }

  /** DOM 浮層（血條）錨點 */
  getAnchors(): SparAnchors {
    const g = this.geom();
    const foe = this.enemies.find((e) => e.state !== 'dead') ?? null;
    const ke = foe ? this.enemyKe(foe) : g.k;
    return {
      heroX: g.heroX,
      heroHeadY: g.groundY - SILHOUETTE_DESIGN_H * g.k * 0.98,
      foeX: foe ? foe.x : null,
      foeHeadY: g.groundY - SILHOUETTE_DESIGN_H * ke * 0.98,
      foeBoss: foe?.boss ?? false,
    };
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
    this.heroHitT += dt;

    // 對打：敗退倒地 → 退一關、回血、重新入場
    if (this.heroDownT !== null) {
      this.heroDownT += dt;
      this.attackT = null;
      for (const e of this.enemies) e.bob += dt;
      if (this.heroDownT >= HERO_DOWN_DUR) {
        this.combat?.heroRecovered();
        this.resetLane();
        this.director.resetToEnter();
      }
      this.ageFx(dt);
      return;
    }

    // B：導演節奏
    const inMelee = !!this.nearestInRange();
    this.director.notifyMelee(inMelee);
    if (inMelee && this.attackT === null) this.director.requestWindup();
    if (this.director.consumeWindupReady() && this.attackT === null) {
      this.attackT = 0;
      this.firedStrike = false;
      this.trail = [];
    }
    const dir = this.director.update(dt);
    this.directorSample = dir;
    this.heroFade = Math.max(0.35, dir.fadeIn);

    // 俠客向右行速：導演倍率 × 基礎速
    const walkSpeed = (this.quiet ? 85 : 130) * (this.cssH / 218) * dir.walkMul;

    // 敵人：望左企定，畫面 x 唔郁；淨處理出生／死亡
    for (const e of this.enemies) {
      e.bob += dt;
      e.hitT += dt;
      if (this.combat && e.state === 'hold') this.updateLunge(e, dt);
      if (e.state === 'spawn') {
        e.t += dt;
        if (e.t >= this.spawnDur()) { e.state = 'hold'; e.t = 0; }
      } else if (e.state === 'walk') {
        e.state = 'hold'; // 永不向俠客行
      } else if (e.state === 'dead') {
        e.t += dt;
      }
    }
    this.enemies = this.enemies.filter((e) => !(e.state === 'dead' && e.t >= SPAR_CLIPS['enemy-death'].dur));

    // 對打：敵人倒地動畫完 → 結算（換人／過關掉錢）→ 右邊再出一個
    if (this.combat && this.enemies.length === 0) {
      if (this.pendingDefeat) {
        this.pendingDefeat = false;
        const { coins } = this.combat.foeDefeated();
        this.spawnCoins(coins);
      }
      this.enemies = [this.makeEnemy(this.foeSpotX(), 'spawn')];
    }

    // 俠客行過去
    const striking = this.attackT !== null;
    const moving = !this.laneResetting && dir.phase !== 'reset' && walkSpeed > 1;
    if (moving) {
      this.heroX += walkSpeed * dt * (striking ? 0.55 : 1);
      this.walkT += dt * (striking ? 0.4 : 1);
      // A：腳步揚塵
      this.footClock += dt;
      if (!this.quiet && this.footClock > 0.22 && dir.phase === 'approach') {
        this.footClock = 0;
        this.dust.push({
          x: this.heroX - 8,
          y: this.geom().groundY - 2,
          age: 0,
          dur: 0.45,
          vx: -20 - Math.random() * 30,
        });
      }
    }

    // 對打：唔好穿過敵人（企喺射程內你一刀我一刀）
    if (this.combat) {
      const foe = this.enemies.find((e) => e.state !== 'dead') ?? null;
      this.heroX = Math.min(this.heroX, this.heroStopX(foe));
    }

    // 行過右緣、或單挑清場後 → 重置再出下一個（對打模式由上面自己補敵）
    const alive = this.enemies.filter((e) => e.state !== 'dead').length;
    if (
      !this.combat &&
      !this.laneResetting &&
      (this.heroX > this.cssW * 0.94 ||
        (alive === 0 && this.attackT === null && this.enemies.length === 0) ||
        (alive === 0 && this.attackT === null && this.heroX > this.cssW * 0.52))
    ) {
      this.laneResetting = true;
      this.director.notifyLaneReset();
    }
    if (this.director.consumeResetDone()) {
      this.resetLane();
      this.director.resetToEnter();
    }

    // 攻擊排程：導演 strike 階段播 clip；否則射程內備招
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
        this.director.notifyStrikeDone();
      }
    } else if (dir.phase === 'strike' || (inRange && dir.phase === 'approach')) {
      // approach 入近戰已 requestWindup；strike 由 consumeWindup 開招
      this.attackCooldown -= dt;
      if (dir.phase === 'approach' && this.attackCooldown <= 0 && inRange) {
        this.director.requestWindup();
      }
    } else {
      this.attackCooldown = Math.min(this.attackCooldown, 0.1);
    }

    this.ageFx(dt);
  }

  /** 特效老化（停格／倒地時都要繼續） */
  private ageFx(dt: number) {
    const age = <T extends { age: number; dur: number }>(arr: T[], dtv: number) => {
      for (const it of arr) it.age += dtv;
      return arr.filter((it) => it.age < it.dur);
    };
    this.particles = age(this.particles, dt);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 240 * dt;
    }
    this.floaters = age(this.floaters, dt);
    this.splashes = age(this.splashes, dt);
    this.dust = age(this.dust, dt);
    for (const d of this.dust) d.x += d.vx * dt;
    this.trail = age(
      this.trail.map((d) => ({ ...d, dur: 0.32 })),
      dt,
    );
    this.coins = age(this.coins, dt);
    for (const c of this.coins) {
      c.vy += 620 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      if (c.y > c.groundY && c.vy > 0) {
        c.y = c.groundY;
        c.vy *= -0.38;
        c.vx *= 0.6;
        c.vr *= 0.5;
      }
    }
  }

  /** 敵人撲擊：射程內計時 → 後縮蓄勢 → 撲前到肉 → 收勢 */
  private updateLunge(e: EnemyInst, dt: number) {
    const close = e.x - this.heroX <= this.duelGap() + this.enemyFront(e) + 24;
    if (e.lungeT === null) {
      if (!close) return;
      e.atkTimer -= dt;
      if (e.atkTimer <= 0) {
        e.lungeT = 0;
        e.lungeHit = false;
      }
      return;
    }
    e.lungeT += dt;
    if (!e.lungeHit && e.lungeT >= LUNGE_HIT_AT) {
      e.lungeHit = true;
      this.foeHits(e);
    }
    if (e.lungeT >= LUNGE_DUR) {
      e.lungeT = null;
      e.atkTimer = (e.boss ? 1.15 : 1.6) + Math.random() * 0.5;
    }
  }

  /** 敵人一擊到肉：主角退縮、彈紅字；血見底就敗退 */
  private foeHits(e: EnemyInst) {
    if (!this.combat || this.heroDownT !== null) return;
    const r = this.combat.foeStrike();
    if (r.dmg <= 0) return;
    const g = this.geom();
    this.heroHitT = 0;
    this.shake = Math.max(this.shake, this.quiet ? 0 : e.boss ? 5 : 3);
    this.floaters.push({
      x: g.heroX + (Math.random() - 0.5) * 22,
      y: g.groundY - SILHOUETTE_DESIGN_H * g.k * 0.58,
      text: `-${formatSparNumber(r.dmg)}`,
      gain: r.dmg,
      age: 0,
      dur: 0.95,
      kind: 'hurt',
    });
    if (!this.quiet) {
      const hy = g.groundY - SILHOUETTE_DESIGN_H * g.k * 0.55;
      this.splashes.push({ x: g.heroX + 6, y: hy, rot: Math.random() * Math.PI * 2, age: 0, dur: e.boss ? 0.45 : 0.32 });
      for (let i = 0; i < (e.boss ? 10 : 6); i++) {
        const a = Math.PI + (Math.random() - 0.5) * 1.6;
        const sp = 50 + Math.random() * 110;
        this.particles.push({ x: g.heroX + 6, y: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, r: 0.8 + Math.random() * 2, age: 0, dur: 0.45 });
      }
    }
    if (r.heroDown) {
      this.heroDownT = 0;
      this.attackT = null;
      this.trail = [];
    }
  }

  /** 首領掉銅錢：由首領位彈出、跌落地彈兩彈 */
  private spawnCoins(n: number) {
    if (n <= 0 || this.quiet) return;
    const g = this.geom();
    const x0 = this.foeSpotX();
    for (let i = 0; i < n; i++) {
      this.coins.push({
        x: x0 + (Math.random() - 0.5) * 20,
        y: g.groundY - 60 * (this.cssH / 218),
        vx: -40 - Math.random() * 120,
        vy: -170 - Math.random() * 130,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 14,
        age: 0,
        dur: 1.8 + Math.random() * 0.4,
        groundY: g.groundY - 6,
      });
    }
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
    const melee = this.combat ? this.duelGap() + 12 : this.reachPx() * 0.72 + this.cssW * 0.04;
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
    const g = this.geom();
    const ix = target ? target.x - 12 : g.heroX + this.reachPx() * 0.8;
    const iy = g.groundY - 300 * g.k * 1.05;

    if (this.combat) {
      if (target && target.state !== 'dead') {
        const r = this.combat.heroStrike();
        this.onStrike?.();
        if (r.killed) {
          target.state = 'dead';
          target.t = 0;
          target.lungeT = null;
          this.pendingDefeat = true;
        } else {
          target.hitT = 0;
        }
        const headY = g.groundY - SILHOUETTE_DESIGN_H * this.enemyKe(target) * 0.6;
        this.floaters.push({
          x: target.x + (Math.random() - 0.5) * 34,
          y: headY - Math.random() * 14,
          text: formatSparNumber(r.dmg),
          gain: r.dmg,
          age: 0,
          dur: r.crit ? 1.15 : 0.9,
          kind: r.crit ? 'crit' : 'dmg',
        });
        if (r.heal > 0) {
          this.floaters.push({
            x: g.heroX - 14 + (Math.random() - 0.5) * 16,
            y: g.groundY - SILHOUETTE_DESIGN_H * g.k * 0.78,
            text: `+${formatSparNumber(r.heal)}`,
            gain: r.heal,
            age: 0,
            dur: 0.95,
            kind: 'heal',
          });
        }
        if (r.crit && !this.quiet) {
          this.shake = 9;
          this.hitStop = 0.13;
        }
      }
    } else if (target && target.state !== 'dead') {
      target.state = 'dead';
      target.t = 0;
    }

    const gained = this.combat ? 0 : this.onStrike?.() ?? 0;
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
    // 身形約佔舞台高度 1/4，同山水比例更協調（舊 0.82 太大）
    const k = (h * 0.26) / SILHOUETTE_DESIGN_H;
    // 首次／重設：俠客由左邊起步
    if (this.heroX <= 0) this.heroX = this.cssW * 0.20;
    return {
      k,
      groundY: h * 0.92,
      heroX: this.heroX,
    };
  }

  /** 敵影縮放：剪影模式唔跟舊貼圖高度（否則高圖敵人會縮成火柴） */
  private enemyKe(e: EnemyInst) {
    const g = this.geom();
    return g.k * 1.0 * (e.def.scale ?? 1) * e.scaleMul;
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

    this.drawDust(g);

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
    this.drawCoins();
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

  /** 出場時長：對打模式由右邊行入（長啲），舊玩法地影抽高 */
  private spawnDur() {
    return this.combat ? 0.9 : SPAR_CLIPS['enemy-spawn'].dur;
  }

  private enemyPose(e: EnemyInst): Pose {
    if (e.state === 'dead') {
      const pose = evalPose('enemy', this.idleT, SPAR_CLIPS['enemy-death'], e.t);
      if (!this.combat) return pose;
      // 對打：中最後一刀向後飛、打轉（首領飛得遠啲）
      const p = Math.min(1, e.t / SPAR_CLIPS['enemy-death'].dur);
      const fly = e.boss ? 420 : 300;
      return { ...pose, x: pose.x + fly * (1 - (1 - p) ** 2), rot: pose.rot + 30 * p };
    }
    if (e.state === 'spawn') {
      if (!this.combat) return evalPose('enemy', this.idleT, SPAR_CLIPS['enemy-spawn'], e.t);
      // 由右邊大步行入：三步跳躍、落地微蹲；首領慢啲、重啲
      const p = Math.min(1, e.t / this.spawnDur());
      const ease = 1 - (1 - p) ** 3;
      const steps = e.boss ? 2 : 3;
      const hop = Math.abs(Math.sin(p * Math.PI * steps)) * (e.boss ? 14 : 26) * (1 - p);
      return {
        ...REST,
        x: 760 * (1 - ease),
        y: -hop,
        rot: -4 * Math.sin(p * Math.PI * steps * 2) * (1 - p),
        sy: p > 0.85 ? 1 - 0.08 * Math.sin(((p - 0.85) / 0.15) * Math.PI) : 1,
        alpha: Math.min(1, p * 3),
      };
    }
    const bobY = Math.sin(e.bob * (e.state === 'walk' ? 8.5 : 2.4)) * (e.state === 'walk' ? 3.4 : 2.2);
    // 待機：呼吸起伏、重心左右移、身體微擺（剪影唔再企到死實）
    let x = this.combat ? 14 * Math.sin(e.bob * 1.3) : 0;
    let rot = this.combat ? 2.4 * Math.sin(e.bob * 1.7) : 0;
    let sy = this.combat ? 1 + 0.028 * Math.sin(e.bob * 2.6) : 1;
    let alpha = 1;
    // 受擊：向後一彈、身仰、壓扁；頭 0.06 秒閃一閃
    if (e.hitT < 0.26) {
      const p = 1 - e.hitT / 0.26;
      x += (e.boss ? 120 : 180) * p * p;
      rot += 9 * p;
      sy -= 0.08 * p;
      if (e.hitT < 0.06) alpha = 0.55;
    }
    // 撲擊：後縮蓄勢 → 撲前 → 收勢（du，向左＝負）
    if (e.lungeT !== null) {
      const t = e.lungeT;
      if (t < 0.18) {
        // 蓄勢：後縮、蹲低
        const p = t / 0.18;
        x += 110 * p;
        rot += 7 * p;
        sy -= 0.1 * p;
      } else if (t < LUNGE_HIT_AT + 0.04) {
        // 撲前：拉長身形
        const p = (t - 0.18) / (LUNGE_HIT_AT + 0.04 - 0.18);
        x += 110 - 560 * Math.sin((p * Math.PI) / 2);
        rot += 7 - 18 * p;
        sy += -0.1 + 0.16 * p;
      } else {
        const p = Math.min(1, (t - LUNGE_HIT_AT - 0.04) / (LUNGE_DUR - LUNGE_HIT_AT - 0.04));
        x += -450 * (1 - p) * (1 - p);
        rot += -11 * (1 - p);
        sy += 0.06 * (1 - p);
      }
    }
    return { ...REST, x, y: bobY, rot, sy, alpha };
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
    try {
      const attack = this.attackT !== null ? this.attackClipNow() : null;
      const at = this.attackT ?? 0;
      const body = evalPose('body', this.idleT, attack, at);
      const arm = evalPose('arm', this.idleT, attack, at);
      const wep = evalPose('weapon', this.idleT, attack, at);
      const head = evalPose('head', this.idleT, attack, at);
      const crouch = (this.directorSample?.crouchY ?? 0) * g.k;
      const fade = Math.max(0.35, Math.min(1, this.heroFade || 1));

      // 對打：中招向後一縮；敗退向後仰倒、淡出
      const flinch = this.heroHitT < 0.22 ? 1 - this.heroHitT / 0.22 : 0;
      const downP = this.heroDownT !== null ? Math.min(1, this.heroDownT / 0.7) : 0;
      const downFade = this.heroDownT !== null ? Math.max(0, 1 - Math.max(0, this.heroDownT - 0.9) / 0.6) : 1;
      const fx = g.heroX + body.x * g.k - 9 * flinch * flinch - 18 * downP;
      const fy = g.groundY + body.y * g.k + crouch;
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

      const striking = this.attackT !== null;
      const sy = Number.isFinite(body.sy) && body.sy > 0.2 ? body.sy : 1;

      // A：揀全身幀（行路／揮擊／待機）——永遠先畫，確保主角可見
      let heroImg: CanvasImageSource = this.images.heroIdle;
      let part: { w: number; h: number; dx: number; dy: number } = HERO_SIL.idle;
      let frameKey = 'idle';
      if (striking && this.images.heroAtk && this.images.heroAtk.length >= 3) {
        const fi = attackFrameIndex(at, this.attackClipNow().dur);
        heroImg = this.images.heroAtk[fi] ?? this.images.heroAttack;
        part = HERO_ATK_FRAMES[fi] ?? HERO_SIL.attack;
        frameKey = this.images.heroAtk[fi] ? `atk-${fi}` : 'attack';
      } else if (striking) {
        heroImg = this.images.heroAttack;
        part = HERO_SIL.attack;
        frameKey = 'attack';
      } else if (this.images.heroWalk && this.images.heroWalk.length >= 4 && (this.directorSample?.walkMul ?? 1) > 0.15) {
        const fi = walkFrameIndex(this.walkT);
        heroImg = this.images.heroWalk[fi] ?? this.images.heroIdle;
        part = HERO_WALK_FRAMES[fi] ?? HERO_SIL.idle;
        frameKey = this.images.heroWalk[fi] ? `walk-${fi}` : 'idle';
      }

      ctx.save();
      ctx.globalAlpha *= fade * downFade;
      ctx.translate(fx, fy);
      ctx.rotate((body.rot - 6 * flinch - 78 * (1 - (1 - downP) ** 3)) * DEG);
      ctx.scale(1, sy);
      drawSilhouetteSprite(ctx, heroImg, {
        k: g.k,
        w: part.w,
        h: part.h,
        dx: part.dx,
        dy: part.dy,
      });

      // 兵器剪影：掛喺呢格握點，沿該格揮擊方向；空手唔畫（拖墨用拳風距離）
      void arm;
      void head;
      const gripDef = HERO_WEAPON_GRIPS[frameKey] ?? HERO_WEAPON_GRIPS.idle!;
      const gx = (gripDef.x + HERO_SIL.idle.dx) * g.k;
      const gy = (gripDef.y + HERO_SIL.idle.dy) * g.k;
      // 待機時兵器隨呼吸輕晃
      const ang = gripDef.angle * DEG + (striking ? wep.rot * DEG * 0.15 : Math.sin(this.idleT * 2.2) * 0.03);
      const len = (WEAPON_SIL_LENGTH[weaponKind] ?? WEAPON_SIL_LENGTH.fist!) * g.k;
      if (this.images.weapon && this.weaponDef) {
        const wd = this.weaponDef;
        const s = len / Math.max(1, wd.tip.y - wd.grip.y);
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(ang - Math.PI / 2);
        ctx.drawImage(toInkSilhouette(this.images.weapon), -wd.grip.x * s, -wd.grip.y * s, wd.w * s, wd.h * s);
        ctx.restore();
      }

      ctx.save();
      const local = { x: gx + Math.cos(ang) * len, y: gy + Math.sin(ang) * len };
      const m = ctx.getTransform();
      const tip = {
        x: (m.a * local.x + m.c * local.y + m.e) / this.dpr,
        y: (m.b * local.x + m.d * local.y + m.f) / this.dpr,
      };
      ctx.restore();
      ctx.restore();
      return tip;
    } catch (err) {
      // 兜底：最簡全身待機，避免整幀崩潰令主角消失
      try {
        const { ctx } = this;
        ctx.save();
        ctx.translate(g.heroX, g.groundY);
        drawSilhouetteSprite(ctx, this.images.heroIdle, {
          k: g.k,
          w: HERO_SIL.idle.w,
          h: HERO_SIL.idle.h,
          dx: HERO_SIL.idle.dx,
          dy: HERO_SIL.idle.dy,
        });
        ctx.restore();
      } catch {
        /* ignore */
      }
      console.warn('[spar] drawWarrior failed', err);
      return null;
    }
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
      // 蓄勢時腳下紅光暴漲：預告要出手
      const windup = e.lungeT !== null && e.lungeT < LUNGE_HIT_AT ? e.lungeT / LUNGE_HIT_AT : 0;
      const pulse = (0.55 + 0.25 * Math.sin(e.bob * 2.6)) * (1 + windup * 1.6);
      const aura = e.boss ? 1.6 : 1;
      const rg = ctx.createRadialGradient(footX, footY, 2, footX, footY, 58 * ke * aura);
      rg.addColorStop(0, `rgba(${CINNABAR},${0.5 * pulse})`);
      rg.addColorStop(0.45, `rgba(${CINNABAR},${0.16 * pulse})`);
      rg.addColorStop(1, `rgba(${CINNABAR},0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(footX, footY, 54 * ke * aura, 15 * ke * aura, 0, 0, Math.PI * 2);
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
  private drawDust(g: ReturnType<SparStage['geom']>) {
    if (this.quiet) return;
    const { ctx } = this;
    for (const d of this.dust) {
      const p = d.age / d.dur;
      ctx.fillStyle = `rgba(${INK},${0.28 * (1 - p)})`;
      ctx.beginPath();
      ctx.ellipse(d.x, g.groundY - 1, 10 * (1 + p), 3.2 * (1 - p * 0.5), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

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
      if (f.kind && f.kind !== 'xp') {
        this.drawCombatNumber(f, p, alpha);
        continue;
      }
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

  /** 傷害／暴擊／回血／受傷數字：彈出放大再縮返、向上飄 */
  private drawCombatNumber(f: Floater, p: number, alpha: number) {
    const { ctx } = this;
    const k = this.cssH / 218;
    const base = f.kind === 'crit' ? 30 : f.kind === 'heal' ? 19 : f.kind === 'hurt' ? 20 : 23;
    const pop = p < 0.12 ? 1.5 - (p / 0.12) * 0.5 : 1;
    const size = Math.round(base * k * pop);
    const rise = f.kind === 'crit' ? 22 : 30;
    const y = f.y - (1 - (1 - p) ** 2) * rise * k;
    const fill =
      f.kind === 'crit'
        ? '#f6d36b'
        : f.kind === 'heal'
          ? '#9ee06a'
          : f.kind === 'hurt'
            ? '#f08a70'
            : '#fbf7ee';
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    if (f.kind === 'crit') {
      ctx.font = NUM_FONT.replace('SIZE', String(Math.round(12 * k)));
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(${INK},0.9)`;
      ctx.strokeText('暴擊', f.x - size * 1.1, y - size * 0.62);
      ctx.fillStyle = `rgb(${CINNABAR})`;
      ctx.fillText('暴擊', f.x - size * 1.1, y - size * 0.62);
    }
    ctx.font = NUM_FONT.replace('SIZE', String(size));
    ctx.lineWidth = Math.max(3, size * 0.22);
    ctx.strokeStyle = `rgba(${INK},0.92)`;
    ctx.strokeText(f.text, f.x, y);
    ctx.fillStyle = fill;
    ctx.fillText(f.text, f.x, y);
    ctx.restore();
  }

  /** 首領掉嘅銅錢（位圖）：落地彈兩彈、最後淡出 */
  private drawCoins() {
    const img = this.images.coin;
    if (!img || !this.coins.length) return;
    const { ctx } = this;
    const size = 18 * (this.cssH / 218);
    for (const c of this.coins) {
      const p = c.age / c.dur;
      ctx.save();
      ctx.globalAlpha = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.scale(Math.max(0.25, Math.abs(Math.cos(c.rot * 0.7))), 1);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

/** 對打數字字型：粗楷書斜體，白字墨邊（似參考圖嘅手寫大數） */
const NUM_FONT = `italic 800 SIZEpx 'Kaiti TC', 'STKaiti', 'KaiTi', 'DFKai-SB', serif`;

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
  const walkSrcs = HERO_WALK_FRAMES.map((f) => f.src);
  const atkSrcs = HERO_ATK_FRAMES.map((f) => f.src);
  return Promise.all([
    loadOptional(HERO_SIL.idle.src),
    loadOptional(HERO_SIL.attack.src),
    ...walkSrcs.map(loadOptional),
    ...atkSrcs.map(loadOptional),
    loadOptional(HERO_LAYERS.body.src),
    loadOptional(HERO_LAYERS.hat.src),
    loadOptional(HERO_LAYERS.arm.src),
    ...enemies.map((d) => loadOptional(d.part.src)),
    loadRequired(splashSrc ?? `${import.meta.env.BASE_URL || '/'}ink/spar/fx-splash.webp`),
  ]).then((loaded) => {
    let i = 0;
    const heroIdle = loaded[i++]!;
    const heroAttack = loaded[i++]!;
    const heroWalk = loaded.slice(i, i + walkSrcs.length) as HTMLImageElement[];
    i += walkSrcs.length;
    const heroAtk = loaded.slice(i, i + atkSrcs.length) as HTMLImageElement[];
    i += atkSrcs.length;
    const layerBody = loaded[i++]!;
    const layerHat = loaded[i++]!;
    const layerArm = loaded[i++]!;
    const enemyImgs = loaded.slice(i, i + enemies.length) as HTMLImageElement[];
    i += enemies.length;
    const splash = loaded[i++]!;
    return {
      heroIdle,
      heroAttack,
      heroWalk,
      heroAtk,
      layerBody,
      layerHat,
      layerArm,
      enemies: enemyImgs,
      splash,
    };
  });
}

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
