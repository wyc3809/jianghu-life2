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
import { ChoreoRun, offsetPx, splitDamage, type ArtSpriteKey, type ChoreoEvent, type ChoreoSample } from '../fx/art/choreo';
import { choreoForArt } from '../fx/art/recipes';
import { ART_SPRITE_KEYS, ArtFxLayer, loadArtSprites, makeAnchors, type FxAnchors } from '../fx/art/fxLayer';
import { StripRig, drawWarpedSprite } from './stripRig';
import { SceneAmbience } from './ambience';
import { advanceGait, gaitFrame, collapseSample, crossedGroundContact, SPAR_PRESENTATION, loadFoeCollapse, loadSparArt, type SparArtImages, type SparSeason } from './presentation';
import { BATTLE_CAMERA, BATTLE_PORTRAIT_GROUND, battleMotionHeight, fitBattleBackdrop } from './battleViewport';
import { createRng, spawnSeasonParticle, stepParticles, particleAlpha, type Particle as WeatherParticle } from '../fx/ambient/particles';
import { formatSparNumber } from '@core/life/sparDuel';
import { martialPoseFor, sampleMartialPose, type MartialAsset } from '../fx/art/martialPoses';
import { canonicalSkillId } from '@data/skills/catalog';
import { martialFootwork } from '../fx/art/footwork';
import { MartialIdentityFx } from '../fx/art/identityFx';
import { martialFallbackImage, MARTIAL_FALLBACK_ART } from '../fx/art/martialFallback';
import { heroAppearanceFrame, heroFigureScale, HERO_VISUAL_SCALE, loadHeroAppearance, type HeroAppearance } from './heroAppearance';
import { loadAppearanceAssets, type AppearanceAssets } from '../appearance/assets';
import { drawAppearance } from '../appearance/model';
import { readAppearance, type CharacterAppearance } from '@interfaces/appearance';
import poseAnchors from '../fx/art/poseAnchors.json';
import foeFigureMetrics from './foeFigureMetrics.json';
import { playInkBlade, playInkHit, playInkTap, playInkSeal } from '../audio/inkAudio';
import { FOE_TRAITS } from '@data/foes/traits';
import type { CombatTraitFx } from '@interfaces/lifeEngine';

const DEG = Math.PI / 180;
const INK = '22,19,15';
const CINNABAR = '168,51,31';
/** 精英描邊：金；首領描邊：朱砂（第 20 項敵人層級） */
const ELITE_RIM = '227,196,106';
const BOSS_RIM = '214,64,44';
type FoeTierLite = 'minion' | 'elite' | 'boss';

/**
 * 敵人點綴色／描邊用嘅位圖快取（offscreen canvas，唔用 SVG）：
 * - accent：剪影腰身一帶疊一層點綴色（衣帶），其餘仍係墨
 * - rim：成個剪影塗單色，畫喺本體後面四向錯開＝描邊
 */
const tintCache = new WeakMap<object, Map<string, HTMLCanvasElement>>();

function tintedSilhouette(img: CanvasImageSource, key: string, paint: (x: CanvasRenderingContext2D, w: number, h: number) => void): CanvasImageSource {
  const w = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width || 0;
  const h = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height || 0;
  if (!w || !h || typeof document === 'undefined') return img;
  let m = tintCache.get(img as object);
  if (!m) {
    m = new Map();
    tintCache.set(img as object, m);
  }
  const hit = m.get(key);
  if (hit) return hit;
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    if (!x) return img;
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    paint(x, w, h);
    m.set(key, c);
    return c;
  } catch {
    return img;
  }
}

/** 衣帶點綴色：腰身一條色帶＋頭頂少少，剪影其餘保持墨色 */
function accentSilhouette(img: CanvasImageSource, rgb: string): CanvasImageSource {
  return tintedSilhouette(img, `accent:${rgb}`, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(0.2, `rgba(${rgb},0.12)`);
    g.addColorStop(0.3, `rgba(${rgb},0)`);
    g.addColorStop(0.48, `rgba(${rgb},0)`);
    g.addColorStop(0.58, `rgba(${rgb},0.3)`);
    g.addColorStop(0.68, `rgba(${rgb},0.15)`);
    g.addColorStop(0.82, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  });
}

/** 單色剪影（描邊用） */
function solidSilhouette(img: CanvasImageSource, rgb: string): CanvasImageSource {
  return tintedSilhouette(img, `solid:${rgb}`, (x, w, h) => {
    x.fillStyle = `rgb(${rgb})`;
    x.fillRect(0, 0, w, h);
  });
}

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

interface Particle { x: number; y: number; vx: number; vy: number; r: number; age: number; dur: number; rgb?: string }
type FloaterKind = 'xp' | 'dmg' | 'crit' | 'heal' | 'hurt' | 'trait';
interface Floater { x: number; y: number; text: string; gain: number; age: number; dur: number; kind?: FloaterKind; rgb?: string }
interface CoinFx { x: number; y: number; vx: number; vy: number; rot: number; vr: number; age: number; dur: number; groundY: number }
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
  tier: FoeTierLite; // 小兵／精英（金邊）／首領（朱砂邊）
  traitRgb: string | null; // 特性色（光環、觸發字）；小兵冇
  accent: string | null; // 衣帶點綴色
  enragedShown: boolean; // 狂怒字已彈過（只彈一次）
  hitT: number; // 受擊後退計時（大＝冇受擊）
  atkTimer: number; // 距離下一次出手
  lungeT: number | null; // 撲擊動作計時
  lungeHit: boolean; // 今次撲擊已結算
  rig: StripRig; // 條帶變形骨架（衣擺、傾身）
}

/** 揮擊殘影：記低某一格嘅繪製參數，之後淡出重畫 */
interface Afterimage {
  img: CanvasImageSource;
  part: { w: number; h: number; dx: number; dy: number };
  x: number;
  y: number;
  rot: number;
  sy: number;
  age: number;
}

export interface SparStageImages {
  wardrobe?: AppearanceAssets;
  characterAppearance?: CharacterAppearance;
  opponentAppearance?: CharacterAppearance;
  opponentFamily?: string;
  /** 主角待機／行路／受擊／倒地共用細節人物；與武學圖集同一腳底錨點。 */
  heroAppearance?: HeroAppearance;
  art?: SparArtImages;
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
  heroStrike(): { dmg: number; crit: boolean; heal: number; killed: boolean; fx?: CombatTraitFx[]; reflect?: number };
  /** 敵人撲擊到肉 */
  foeStrike(): { dmg: number; heroDown: boolean; foeKilled?: boolean; fx?: CombatTraitFx[]; foeHeal?: number };
  /**
   * 下一個出場敵人：係咪首領、用邊款剪影（ENEMY_POOL 索引，按關卡主題）；
   * tier／trait／accent 係第 20 項敵人圖鑑（精英金邊、首領朱砂邊、特性光環、衣帶色）
   */
  nextFoe(): { boss: boolean; look?: number; tier?: FoeTierLite; trait?: keyof typeof FOE_TRAITS; accent?: string };
  /** 當前敵人下一擊係蓄力重擊（光環暴漲預告） */
  foeCharging?(): boolean;
  /** 當前敵人狂怒中（墨紅火焰） */
  foeEnraged?(): boolean;
  /** 敵人倒地動畫完：換下一個（或過關）；回傳要彈幾多個銅錢 */
  foeDefeated(): { coins: number };
  /** 敗退倒地動畫完：退一關、回血 */
  heroRecovered(): void;
  /**
   * 照劇本播（自動交手演出用，演武台唔傳）：而家輪唔輪到主角出手。
   * 唔傳＝照舊射程內即出手。
   */
  heroMayAttack?(): boolean;
  /** 照劇本播：而家輪唔輪到敵人出手（輪到就即刻撲擊，唔等計時）。唔傳＝照舊計時 */
  foeMayAttack?(): boolean;
  /**
   * 第 25 項：下一招用邊套外功（skill id）。有招式編排（src/fx/art/recipes.ts）就播嗰套專屬動畫；
   * 冇就照舊揮擊。只影響演出，傷害照 heroStrike 結算。
   */
  nextArt?(): string | null | undefined;
}

/** 血條等 DOM 浮層嘅錨點（css px） */
export interface SparAnchors {
  heroX: number;
  heroHeadY: number;
  foeX: number | null;
  foeHeadY: number;
  foeBoss: boolean;
}

/** 修為浮字用嘅水墨素材：宣紙墨漬徽章（字用 UI 字體） */
export interface SparUiImages {
  /** 宣紙色墨漬徽章底 */
  splashPaper: HTMLImageElement | null;
}

export interface SparStageOptions {
  /** 第26項獨立原型嘅直向AI場景；唔替換主頁四季素材。 */
  battleBackdrop?: HTMLImageElement | null;
  /** 第26項原型：battle用全屏攝影機；默認stage沿用原演武畫面。 */
  presentation?: 'stage' | 'battle';
  canvas: HTMLCanvasElement;
  /** 跟外層介面相同嘅字體；Canvas字體唔會自動繼承CSS。 */
  uiFontFamily?: string;
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

/** 揮擊殘影壽命（秒）同取樣間隔 */
const AFTERIMAGE_LIFE = 0.2;
const AFTERIMAGE_EVERY = 0.035;

const ATTACK_COOLDOWN = 0.18; // 收招後幾耐再出手（射程內有敵即出手）

export class SparStage {
  private battleBackdrop: HTMLImageElement | null;
  private presentation: 'stage' | 'battle';
  private canvas: HTMLCanvasElement;
  private uiFontFamily: string;
  private ctx: CanvasRenderingContext2D;
  private images: SparStageImages;
  private rig: AnyWarriorRig;
  /** 出敵池：每次入場隨機抽一款 */
  private enemyPool: EnemyDef[];
  private onStrike?: () => number;
  private combat?: SparCombatHooks;
  private coins: CoinFx[] = [];
  private heroHitT = 9;
  private heroRig = new StripRig();
  private afterimages: Afterimage[] = [];
  private afterClock = 0;
  private ambience = new SceneAmbience();
  private ambienceKey = 'valley';
  private bgT = 0;
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
  private dust: { x: number; y: number; age: number; dur: number; vx: number; landing?: boolean }[] = [];
  private art: SparArtImages | null = null;
  private season: SparSeason = 'spring';
  private previousSeason: SparSeason | null = null;
  private seasonFade = 1;
  private weather: WeatherParticle[] = [];
  private visualRng = createRng(23);
  private weatherRng = createRng(29);
  private heroMoving = false;

  private idleT = 0;
  private attackT: number | null = null;
  private firedStrike = false;
  private attackCooldown = 0.6;

  private enemies: EnemyInst[] = [];

  private hitStop = 0;
  private shake = 0;
  private flash = 0;

  // 第 25 項：外功專屬動畫（src/fx/art/）
  private artRun: ChoreoRun | null = null;
  private identityFx = new MartialIdentityFx();
  private martialAssets = new Map<string, MartialAsset>();
  private martialId: string | null = null;
  private poseResult: ReturnType<SparCombatHooks['heroStrike']> | null = null;
  private supportIds: readonly string[] = [];
  private supportPose: { id: string; t: number } | null = null;
  private poseInspection: { id: string; t: number; result: ReturnType<SparCombatHooks['heroStrike']> | null } | null = null;
  private reviewEffectsOff = false;
  private reviewMonochrome = false;
  private artTarget: EnemyInst | null = null;
  private artResult: ReturnType<SparCombatHooks['heroStrike']> | null = null;
  private artDamage: number[] = [];
  private pendingContactFx: Extract<ChoreoEvent, { kind: 'fx' }>[] = [];
  private artFx = new ArtFxLayer(() => this.artRng());
  private artRng = createRng(37);
  private artSprites: Partial<Record<ArtSpriteKey, HTMLImageElement>> = {};
  private artAfterimage = false;
  private darken = 0;
  private darkenHold = 0;
  private slowAmt = 1;
  private slowLeft = 0;
  private artFlash = 0;
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private splashes: SplashFx[] = [];

  constructor(opts: SparStageOptions) {
    this.battleBackdrop = opts.battleBackdrop ?? null;
    this.presentation = opts.presentation ?? 'stage';
    this.canvas = opts.canvas;
    this.uiFontFamily = opts.uiFontFamily ?? 'sans-serif';
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
    this.art = opts.images.art ?? null;
    this.artFx.sizeMul = 1.5;
    if (typeof Image !== 'undefined') {
      void loadArtSprites(ART_SPRITE_KEYS).then((sp) => {
        this.artSprites = { ...sp, ...this.artSprites };
      });
    }
  }

  /** 只切換人物繪圖資料，不重建演武或改動敵陣。 */
  setCharacterAppearance(hero: CharacterAppearance, foe?: CharacterAppearance): void {
    this.images.characterAppearance = readAppearance(hero);
    this.images.opponentAppearance = foe ? readAppearance(foe) : undefined;
  }

  /** 全屏只改視覺比例；預設演武台所有座標倍率維持原有。 */
  private get motionHeight(): number {
    return this.presentation === 'battle' ? battleMotionHeight(this.cssW) : this.cssH;
  }

  /** 當前裝備嘅代表動作素材；唔改裝備、屬性、導演或結算時間。 */
  setMartialAssets(assets: Map<string, MartialAsset>, supportIds: readonly string[] = []) {
    this.martialAssets = assets;
    this.supportIds = supportIds.map(canonicalSkillId);
  }

  /** 每招只覆寫自己嘅效果，唔因另一門珍本載入次序而串圖。 */
  private artSpriteImages(): Partial<Record<ArtSpriteKey, HTMLImageElement>> {
    const effects = this.martialId ? this.martialAssets.get(this.martialId)?.effects : null;
    return effects ? { ...this.artSprites, ...effects } : this.artSprites;
  }

  /** 開發驗收逐格檢視；依然用產品人物呈現器，唔執行戰鬥或派獎。 */
  inspectMartialPose(id: string | null, t = 0, result: ReturnType<SparCombatHooks['heroStrike']> | null = null) {
    this.poseInspection = id ? { id, t, result } : null;
  }

  /** 敵人撲擊及收勢未完成時，不開始主角下一回合。 */
  get foeAttackActive(): boolean {
    return this.enemies.some(e => e.lungeT !== null);
  }

  /** 主角出招至收勢完成前，保留招名並等待回合交接。 */
  get heroAttackActive(): boolean {
    return this.heroDownT === null && this.attackT !== null;
  }

  /** 驗收只關畫面層，唔改時計／命中／視覺事件。 */
  setMartialReview(effectsOff: boolean, monochrome = false) {
    this.reviewEffectsOff = effectsOff; this.reviewMonochrome = monochrome;
  }

  /** 離開畫面釋放舞台持有嘅圖集同演出狀態。 */
  releaseMartialAssets() {
    this.identityFx.clear();
    this.martialAssets.clear(); this.supportIds = []; this.supportPose = null; this.poseInspection = null;
  }

  /** 同一Canvas喺主頁同全屏之間換攝影機，唔重開角色／敵人／攻擊。 */
  setPresentation(mode: 'stage' | 'battle', backdrop: HTMLImageElement | null = null) {
    this.presentation = mode;
    this.battleBackdrop = backdrop;
  }

  /** AI四季／動作位圖；只影響演出，結算仍用原戰鬥鈎。 */
  setArt(art: SparArtImages) {
    this.art = art;
    for (const enemy of this.enemies) this.prepareCollapse(enemy.def.part.src);
  }

  setSeason(season: SparSeason) {
    if (this.season === season) return;
    this.previousSeason = this.season;
    this.season = season;
    this.seasonFade = 0;
    this.weather = [];
  }

  private prepareCollapse(src: string) {
    if (!this.art || this.art.deaths.has(src)) return;
    const art = this.art;
    void loadFoeCollapse(src).then(frames => art.deaths.set(src, frames)).catch(() => {
      // 缺圖仍保留同一敵人，用原位圖貼地收身；唔令戰鬥中斷。
    });
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

  /** 場景氛圍（霧、雨、落葉、雲、螢火…）：key 同背景 key 一致 */
  setAmbience(key: string) {
    this.ambienceKey = key;
    this.ambience.setScene(key, this.cssW, this.cssH, this.quiet);
  }

  /** 減少動態：保留「行過去打敵人」核心觀感，關掉震屏／粒子 */
  setQuiet(quiet: boolean) {
    this.quiet = quiet;
    this.ambience.setScene(this.ambienceKey, this.cssW, this.cssH, quiet);
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
    const tier: FoeTierLite = next?.tier ?? (boss ? 'boss' : 'minion');
    const trait = tier !== 'minion' && next?.trait ? FOE_TRAITS[next.trait] : null;
    const pool = this.enemyPool;
    // 對打模式：剪影跟關卡主題（唔再亂抽）
    const idx = next?.look !== undefined ? next.look : defIdx ?? Math.floor(this.visualRng() * pool.length);
    this.prepareCollapse(pool[idx % pool.length]!.part.src);
    return {
      x,
      state,
      t: state === 'hold' ? 9 : 0,
      bob: this.visualRng() * 6,
      stopJitter: 1,
      def: pool[idx % pool.length]!,
      speedMul: 1,
      scaleMul: boss ? 1.3 : tier === 'elite' ? 1.12 : 0.94 + this.visualRng() * 0.1,
      boss,
      tier,
      traitRgb: trait?.rgb ?? null,
      accent: next?.accent ?? null,
      enragedShown: false,
      hitT: 9,
      atkTimer: 1.1 + this.visualRng() * 0.5,
      lungeT: null,
      lungeHit: false,
      rig: new StripRig(),
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
    this.enemies = [this.makeEnemy(this.cssW * 0.72 + this.visualRng() * 16, 'spawn')];
  }

  /** 換場景：俠客由左邊重新行入（背景由 setBackground 淡入淡出） */
  enterScene() {
    if (this.cssW === 0) return;
    this.resetLane();
    this.director.resetToEnter();
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
    return {
      heroX: g.heroX,
      heroHeadY: g.groundY - this.heroVisualHeight() * 0.98,
      foeX: foe ? foe.x : null,
      foeHeadY: g.groundY - (foe ? this.enemyVisualHeight(foe) : SILHOUETTE_DESIGN_H * g.k) * 0.98,
      foeBoss: foe?.boss ?? false,
    };
  }

  /** 細人物嘅畫面身高；只供血條／受擊／回復提示定位。 */
  private heroVisualHeight(): number {
    return this.images.heroAppearance ? this.heroArtHeight() * HERO_VISUAL_SCALE : SILHOUETTE_DESIGN_H * this.geom().k;
  }

  /** 跟手機闊度固定人物比例，演武台轉全屏時唔再跟畫布高度縮放。 */
  private heroArtHeight(): number {
    // 頁內有留白、全屏冇留白，都用同一手機闊度；桌面沿用420px手機框上限。
    const width = typeof window === 'undefined' ? this.cssW : Math.min(420, window.innerWidth);
    return width * .23;
  }

  /** 生命週期待機圖實測身高204／設計218；敵人跟同一人物身高，唔跟畫布高度。 */
  private enemyVisualHeight(e: EnemyInst): number {
    return this.images.heroAppearance ? this.heroVisualHeight() * 204 / 218 : SILHOUETTE_DESIGN_H * this.enemyKe(e);
  }

  /** 原圖留白／腳底校準；只供繪圖，enemyKe仍處理原有企位與時間。 */
  private enemyFigure(e: EnemyInst): { k: number; dy: number; footOffset: number; downK: number } {
    if (!this.images.heroAppearance) return { k: this.enemyKe(e), dy: e.def.part.dy, footOffset: 0, downK: this.enemyKe(e) };
    const key = e.def.part.src.split('/').pop()?.replace(/^enemy-|\.webp$/g, '') ?? '';
    const metric = (foeFigureMetrics as Record<string, { sourceHeight: number; bodyHeight: number; footY: number; downBodyHeight: number }>)[key];
    const height = this.enemyVisualHeight(e);
    const sourceScale = e.def.part.h / (metric?.sourceHeight ?? e.def.part.h);
    const footOffset = e.def.part.h - (metric?.footY ?? e.def.part.h) * sourceScale;
    return { k: height / ((metric?.bodyHeight ?? e.def.part.h) * sourceScale),
      dy: e.def.part.dy + footOffset, footOffset, downK: height / (metric?.downBodyHeight ?? 788) };
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ambience.setScene(this.ambienceKey, cssW, cssH, this.quiet);
  }

  /** 推進一幀；dt 以秒計 */
  update(rawDt: number) {
    let dt = Math.min(rawDt, 0.05);
    // 外功慢鏡（穿雲槍貫穿嗰刻）
    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      dt *= this.slowAmt;
    }
    this.darkenHold = Math.max(0, this.darkenHold - dt);
    if (this.darkenHold <= 0) this.darken = Math.max(0, this.darken - dt * 1.6);
    if (this.hitStop > 0) {
      this.hitStop -= dt * (this.quiet ? 3 : 1);
      if (!this.quiet) return; // 打擊停格：時間凍結，淨係渲染（減少動態唔凍）
    }

    this.idleT = (this.idleT + dt * 1.35) % SPAR_CLIPS.idle.dur; // 向右行時節奏略快，似行路
    this.shake = Math.max(0, this.shake - dt * 22);
    this.flash = Math.max(0, this.flash - dt * 6);
    this.artFlash = Math.max(0, this.artFlash - dt * 5);
    if (this.bgFade < 1) this.bgFade = Math.min(1, this.bgFade + dt / 0.6);

    this.heroMoving = false;
    this.geom(); // 確保 heroX 已初始化
    this.heroHitT += dt;

    // 對打：敗退倒地 → 同關重試、回血、重新入場
    if (this.heroDownT !== null) {
      if (!this.quiet && crossedGroundContact(this.heroDownT, this.heroDownT + dt)) this.dust.push({ x: this.heroX - 9, y: this.geom().groundY, age: 0, dur: .45, vx: 0, landing: true });
      this.heroDownT += dt;
      this.attackT = null;
      this.endArt();
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
    if (inMelee && this.attackT === null && (this.combat?.heroMayAttack?.() ?? true)) this.director.requestWindup();
    if ((this.combat?.heroMayAttack?.() ?? true) && this.director.consumeWindupReady() && this.attackT === null) {
      this.attackT = 0;
      this.firedStrike = false;
      this.startArt();
    }
    const dir = this.director.update(dt);
    this.directorSample = dir;
    this.heroFade = Math.max(0.35, dir.fadeIn);

    // 俠客向右行速：導演倍率 × 基礎速
    const walkSpeed = (this.quiet ? 85 : 130) * (this.motionHeight / 218) * dir.walkMul;

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
        if (!this.quiet && crossedGroundContact(e.t, e.t + dt)) this.dust.push({ x: e.x + 7, y: this.geom().groundY, age: 0, dur: .45, vx: 0, landing: true });
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

    // 先限制實際位移，再推腳步；站定唔踏步、唔噴塵。
    const striking = this.attackT !== null;
    const moving = !this.laneResetting && dir.phase !== 'reset' && walkSpeed > 1;
    const previousX = this.heroX;
    const previousGait = this.walkT;
    if (moving) this.heroX += walkSpeed * dt * (striking ? .55 : 1);
    if (this.combat) {
      const foe = this.enemies.find(e => e.state !== 'dead') ?? null;
      this.heroX = Math.min(this.heroX, this.heroStopX(foe));
    }
    const distance = Math.max(0, this.heroX - previousX);
    this.heroMoving = distance > .01 && !striking;
    if (this.heroMoving) {
      this.walkT = advanceGait(this.walkT, distance, this.motionHeight);
      if (!this.quiet && Math.floor(previousGait * 2) !== Math.floor(this.walkT * 2)) {
        this.dust.push({ x: this.heroX - 3, y: this.geom().groundY, age: 0, dur: .32, vx: -8 });
      }
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
    if (this.attackT !== null && this.artRun) {
      this.updateArt(dt);
    } else if (this.attackT !== null) {
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
      if (dir.phase === 'approach' && this.attackCooldown <= 0 && inRange && (this.combat?.heroMayAttack?.() ?? true)) {
        this.director.requestWindup();
      }
    } else {
      this.attackCooldown = Math.min(this.attackCooldown, 0.1);
    }

    this.updateRigs(dt);
    this.ageFx(dt);
  }

  /** 骨架彈簧：主角按導演階段傾身，敵人按撲擊／受擊；殘影計時 */
  private updateRigs(dt: number) {
    const g = this.geom();
    const phase = this.directorSample?.phase;
    const heroLean =
      phase === 'windup' ? -26 : phase === 'strike' ? 34 : this.heroHitT < 0.25 ? -30 : 0;
    this.heroRig.update(dt, g.heroX, g.k, heroLean);
    for (const e of this.enemies) {
      const ke = this.enemyKe(e);
      const pose = this.enemyPose(e);
      // 敵人望左：蓄勢向右（正）、撲前向左（負）
      let lean = 0;
      if (e.lungeT !== null) lean = e.lungeT < 0.18 ? 22 : e.lungeT < LUNGE_HIT_AT + 0.04 ? -36 : 0;
      e.rig.update(dt, e.x + pose.x * ke, ke, lean);
    }
    for (const a of this.afterimages) a.age += dt;
    this.afterimages = this.afterimages.filter((a) => a.age < AFTERIMAGE_LIFE);
  }

  /** 特效老化（停格／倒地時都要繼續） */
  private ageFx(dt: number) {
    if (this.supportPose) {
      this.supportPose.t += dt;
      if (this.supportPose.t >= 1.1) this.supportPose = null;
    }
    if (this.artFx.count) this.artFx.step(dt, this.artAnchors());
    this.identityFx.step(dt);
    if (!this.art) this.ambience.update(dt);
    this.seasonFade = Math.min(1, this.seasonFade + dt / SPAR_PRESENTATION.sceneFade);
    if (this.art && !this.quiet && this.cssW > 0) {
      this.weather = stepParticles(this.weather, dt, this.cssW, this.cssH);
      const count = this.season === 'summer' ? 22 : this.season === 'winter' ? 16 : 8;
      while (this.weather.length < count) this.weather.push(spawnSeasonParticle(this.season, this.cssW, this.cssH * .83, this.weatherRng, true));
    }
    this.bgT += dt;
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
      if (this.combat?.foeMayAttack) {
        // 照劇本：未輪到就企定；輪到就好快出手
        if (!this.combat.foeMayAttack()) return;
        e.atkTimer = Math.min(e.atkTimer, 0.18);
      } else if (this.artRun && this.artRun.t > SPAR_CLIPS.attack.dur) {
        // 外功動畫長過原本揮擊：多出嗰段敵人唔計時，演武難度（出手比例）唔變
        return;
      }
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
      e.atkTimer = (e.boss ? 1.15 : 1.6) + this.visualRng() * 0.5;
    }
  }

  /** 狀態傷害擊倒，沿用現有死亡及換人流程，不額外出招。 */
  foeFellFromStatus(): void {
    const enemy=this.enemies.find(e=>e.state!=='dead');
    if(!enemy)return;
    enemy.state='dead';enemy.t=0;enemy.lungeT=null;this.pendingDefeat=true;
  }

  /** 敵人一擊到肉：主角退縮、彈紅字；血見底就敗退 */
  private foeHits(e: EnemyInst) {
    if (!this.combat || this.heroDownT !== null) return;
    const r = this.combat.foeStrike();
    if(r.foeKilled){e.state='dead';e.t=0;e.lungeT=null;this.pendingDefeat=true;this.attackT=null;}
    // 只跟真正受擊／落空做運氣或閃步，唔製造護盾、閃避或新攻擊。
    const support = this.supportIds.find(id => martialPoseFor(id)?.family === (r.dmg > 0 ? 'internal' : 'step'));
    if (support && !r.heroDown) {
      this.supportPose = { id: support, t: 0 };
      this.identityImpact(support, r.dmg, false, false, true);
    }
    if (r.dmg <= 0) return;
    const g = this.geom();
    this.heroHitT = 0;
    this.heroRig.kick(e.boss ? -460 : -320);
    this.shake = Math.max(this.shake, this.quiet ? 0 : e.boss ? 5 : 3);
    this.floaters.push({
      x: g.heroX + (this.visualRng() - 0.5) * 22,
      y: g.groundY - this.heroVisualHeight() * 0.58,
      text: `-${formatSparNumber(r.dmg)}`,
      gain: r.dmg,
      age: 0,
      dur: 0.95,
      kind: 'hurt',
    });
    if (!this.quiet) {
      const hy = g.groundY - this.heroVisualHeight() * 0.55;
      this.splashes.push({ x: g.heroX + 6, y: hy, rot: this.visualRng() * Math.PI * 2, age: 0, dur: e.boss ? 0.45 : 0.32 });
      for (let i = 0; i < (e.boss ? 10 : 6); i++) {
        const a = Math.PI + (this.visualRng() - 0.5) * 1.6;
        const sp = 50 + this.visualRng() * 110;
        this.particles.push({ x: g.heroX + 6, y: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, r: 0.8 + this.visualRng() * 2, age: 0, dur: 0.45 });
      }
    }
    if (r.fx?.length) this.showTraitFx(r.fx, e, 0, r.foeHeal ?? 0);
    if (r.heroDown) {
      this.heroDownT = 0;
      this.attackT = null;
    }
  }

  /**
   * 敵人特性觸發演出（第 20 項）：特性色圓印＋單字、特性色墨點；
   * 卸（鐵布衫）／噬（噬血）／蓄（蓄力）／連（分影）／怒（狂怒）喺敵人頭頂，震（反震）喺主角身上。
   */
  private showTraitFx(fx: CombatTraitFx[], e: EnemyInst, reflect: number, foeHeal: number) {
    const g = this.geom();
    const foeHead = g.groundY - this.enemyVisualHeight(e) * 0.95;
    const heroHead = g.groundY - this.heroVisualHeight() * 0.95;
    for (const f of fx) {
      const def = FOE_TRAITS[f.kind];
      if (f.kind === 'enrage') {
        if (e.enragedShown) continue;
        e.enragedShown = true;
      }
      const onHero = f.kind === 'thorns';
      const x = onHero ? g.heroX : e.x - 8;
      const y = onHero ? heroHead : foeHead;
      this.floaters.push({ x, y, text: def.glyph, gain: 0, age: 0, dur: 1.05, kind: 'trait', rgb: def.rgb });
      if (!this.quiet) {
        const n = e.boss ? 16 : 10;
        for (let i = 0; i < n; i++) {
          const a = this.visualRng() * Math.PI * 2;
          const sp = 40 + this.visualRng() * 120;
          this.particles.push({
            x,
            y: y + 30,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 30,
            r: 1 + this.visualRng() * 2.4,
            age: 0,
            dur: 0.55 + this.visualRng() * 0.3,
            rgb: def.rgb,
          });
        }
        if (f.kind === 'charge') {
          this.shake = Math.max(this.shake, e.boss ? 10 : 6);
          this.hitStop = Math.max(this.hitStop, 0.1);
        }
      }
    }
    if (reflect > 0) {
      this.floaters.push({ x: g.heroX + 10, y: g.groundY - this.heroVisualHeight() * 0.58, text: `-${formatSparNumber(reflect)}`, gain: reflect, age: 0, dur: 0.95, kind: 'hurt' });
    }
    if (foeHeal > 0) {
      this.floaters.push({ x: e.x + 14, y: foeHead + 26, text: `+${formatSparNumber(foeHeal)}`, gain: foeHeal, age: 0, dur: 0.95, kind: 'heal' });
    }
  }

  /** 首領掉銅錢：由首領位彈出、跌落地彈兩彈 */
  private spawnCoins(n: number) {
    if (n <= 0 || this.quiet) return;
    const g = this.geom();
    const x0 = this.foeSpotX();
    for (let i = 0; i < n; i++) {
      this.coins.push({
        x: x0 + (this.visualRng() - 0.5) * 20,
        y: g.groundY - 60 * (this.motionHeight / 218),
        vx: -40 - this.visualRng() * 120,
        vy: -170 - this.visualRng() * 130,
        rot: this.visualRng() * 6,
        vr: (this.visualRng() - 0.5) * 14,
        age: 0,
        dur: 1.8 + this.visualRng() * 0.4,
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

  // ───────── 第 25 項：外功專屬動畫 ─────────

  /** 開招：問外面今招用邊套外功，有編排就播專屬動畫 */
  private startArt() {
    this.endArt();
    if (!this.combat) return;
    const id = this.combat.nextArt?.();
    this.martialId = id ? canonicalSkillId(id) : null;
    this.poseResult = null;
    const choreo = choreoForArt(this.martialId);
    if (!choreo) return;
    this.artRun = new ChoreoRun(choreo);
    this.artTarget = this.nearestInRange();
  }

  private endArt() {
    this.artRun = null;
    this.artTarget = null;
    this.artResult = null;
    this.artDamage = [];
    this.pendingContactFx = [];
    this.artAfterimage = false;
  }

  private updateArt(dt: number) {
    const run = this.artRun!;
    this.attackT = (this.attackT ?? 0) + dt;
    for (const ev of run.advance(dt)) this.artEvent(ev);
    if (run.done) {
      this.endArt();
      this.attackT = null;
      this.attackCooldown = ATTACK_COOLDOWN;
      this.director.notifyStrikeDone();
    }
  }

  private artEvent(ev: ChoreoEvent) {
    switch (ev.kind) {
      case 'fx':
        // 投射／蓄勢可在結果前出現，受傷爆點一定等真正命中先畫。
        if ((ev.fx.at === 'foe' || ev.fx.at === 'foeTop' || ev.fx.at === 'foeGround')
          && !['board', 'stone-black', 'stone-white', 'cloud-ring'].includes(ev.fx.sprite)) {
          if (!this.artResult) { this.pendingContactFx.push(ev); break; }
          if (this.artResult.dmg <= 0) break;
        }
        this.artFx.spawn(ev.fx, this.artAnchors(), this.quiet);
        break;
      case 'afterimage':
        this.artAfterimage = ev.on && !this.quiet;
        break;
      case 'screen':
        if (this.quiet) break;
        if (ev.effect === 'shake') this.shake = Math.max(this.shake, ev.amount);
        else if (ev.effect === 'flash') this.artFlash = Math.max(this.artFlash, ev.amount);
        else if (ev.effect === 'darken') {
          this.darken = Math.max(this.darken, ev.amount);
          this.darkenHold = ev.dur ?? 0.4;
        } else if (ev.effect === 'hitstop') this.hitStop = Math.max(this.hitStop, ev.amount);
        else if (ev.effect === 'slow') {
          this.slowAmt = ev.amount;
          this.slowLeft = ev.dur ?? 0.2;
        }
        break;
      case 'hit':
        this.artHit(ev);
        break;
    }
  }

  /** 一段命中：第一段先結算（heroStrike 一次），之後按 share 分開彈數字；最後一段先倒地 */
  private artHit(ev: Extract<ChoreoEvent, { kind: 'hit' }>) {
    const run = this.artRun;
    if (!run || !this.combat) return;
    const info = run.hitInfo(ev);
    let target = this.artTarget;
    if (!target || !this.aliveEnemy(target)) {
      target = this.enemies.find((e) => this.aliveEnemy(e)) ?? null;
      this.artTarget = target;
    }
    if (!target) return;
    const g = this.geom();
    if (!this.artResult) {
      const r = this.combat.heroStrike();
      this.artResult = r;
      this.artDamage = splitDamage(r.dmg, run.shares());
      this.identityImpact(this.martialId, r.dmg, r.crit, r.killed);
      if (r.dmg > 0) for (const pending of this.pendingContactFx) this.artFx.spawn(pending.fx, this.artAnchors(), this.quiet);
      this.pendingContactFx = [];
      if (r.dmg > 0 || r.killed) {
        this.onStrike?.();
        if (r.heal > 0) {
          this.floaters.push({
            x: g.heroX - 14,
            y: g.groundY - this.heroVisualHeight() * 0.78,
            text: `+${formatSparNumber(r.heal)}`,
            gain: r.heal,
            age: 0,
            dur: 0.95,
            kind: 'heal',
          });
        }
        if (r.fx?.length) this.showTraitFx(r.fx, target, r.reflect ?? 0, 0);
      }
    }
    const r = this.artResult;
    if (r.dmg <= 0 && !r.killed) return; // 落空：冇數字
    const part = this.artDamage[info.index] ?? 0;
    if (part > 0) this.martialContactSound(r.crit && info.last);
    this.heroRig.kick(300);
    target.rig.kick(ev.heavy ? 560 : 360);
    const foeOff = this.artFoeOffset(target);
    const headY = g.groundY - foeOff.dy - this.enemyVisualHeight(target) * 0.6;
    if (part > 0) {
      this.floaters.push({
        x: target.x + foeOff.dx + (this.visualRng() - 0.5) * 30,
        y: headY - info.index * 12,
        text: formatSparNumber(part),
        gain: part,
        age: 0,
        dur: ev.heavy || r.crit ? 1.15 : 0.9,
        kind: r.crit && info.last ? 'crit' : 'dmg',
      });
    }
    if (!this.quiet) {
      const ix = target.x + foeOff.dx - 10;
      const iy = headY + 14;
      for (let i = 0; i < (ev.heavy ? 12 : 6); i++) {
        const a = this.visualRng() * Math.PI * 2;
        const sp = 40 + this.visualRng() * 110;
        this.particles.push({ x: ix, y: iy, vx: Math.cos(a) * sp + 40, vy: Math.sin(a) * sp - 30, r: 0.8 + this.visualRng() * 2.2, age: 0, dur: 0.4 + this.visualRng() * 0.3 });
      }
      if (ev.heavy) this.shake = Math.max(this.shake, 6);
    }
    if (info.last && r.killed) {
      target.state = 'dead';
      target.t = 0;
      target.lungeT = null;
      this.pendingDefeat = true;
    } else {
      target.hitT = 0;
    }
  }

  /** 主角到敵人身前嘅距離（css px）：編排 g＝1 就係貼到敵人面前 */
  private artGap(): number {
    const g = this.geom();
    const foe = this.artTarget ?? this.enemies.find((e) => this.aliveEnemy(e)) ?? null;
    if (!foe) return 0;
    return Math.max(0, foe.x - g.heroX - 0.3 * SILHOUETTE_DESIGN_H * g.k);
  }

  private artHeroSample(): ChoreoSample | null {
    return this.artRun ? this.artRun.hero() : null;
  }

  private artHeroOffset(): { dx: number; dy: number } {
    const s = this.artHeroSample();
    if (!s) return { dx: 0, dy: 0 };
    return offsetPx(s, SILHOUETTE_DESIGN_H * this.geom().k, this.artGap());
  }

  /** 被打嗰個敵人嘅位移（被推後、拋起） */
  private artFoeOffset(e: EnemyInst): { dx: number; dy: number; rot: number; sy: number } {
    if (!this.artRun || e !== this.artTarget || e.state === 'dead' || !this.artResult || this.artResult.dmg <= 0) return { dx: 0, dy: 0, rot: 0, sy: 1 };
    const s = this.artRun.foe();
    const H = SILHOUETTE_DESIGN_H * this.geom().k;
    return { dx: s.x * H, dy: s.y * H, rot: s.rot, sy: s.sy };
  }

  private artAnchors(): FxAnchors {
    const g = this.geom();
    const H = SILHOUETTE_DESIGN_H * g.k;
    const foe = this.artTarget && this.artTarget.state !== 'dead' ? this.artTarget : this.enemies.find((e) => e.state !== 'dead') ?? null;
    const ho = this.artHeroOffset();
    const fo = foe ? this.artFoeOffset(foe) : { dx: 0, dy: 0 };
    const anchors = makeAnchors({
      unitH: H,
      heroFootX: g.heroX + ho.dx,
      heroFootY: g.groundY - ho.dy,
      foeFootX: foe ? foe.x + fo.dx : g.heroX + H,
      foeFootY: g.groundY - fo.dy,
      foeScale: foe ? this.enemyVisualHeight(foe) / H : 1,
      skyMinY: 8,
    });
    if (this.images.heroAppearance) {
      // 只移主角身體錨點；敵方尺寸同特效單位唔跟住縮。
      anchors.hero.y = g.groundY - ho.dy - .55 * this.heroVisualHeight();
      anchors.heroHand = { x: g.heroX + ho.dx + .28 * this.heroVisualHeight(),
        y: g.groundY - ho.dy - .6 * this.heroVisualHeight() };
      anchors.between.y = (anchors.hero.y + anchors.foe.y) / 2;
    }
    const def = martialPoseFor(this.martialId);
    if (def && this.artRun) {
      const contact = this.artRun.c.events.find(e => e.kind === 'hit')?.t ?? .36;
      const frame = sampleMartialPose(def, this.artRun.t, this.artRun.c.dur, contact, this.artResult, this.quiet) % 8;
      const point = (poseAnchors as Record<string, number[][]>)[def.id]?.[frame];
      const unit = this.heroArtHeight() / 218 * heroFigureScale(this.martialAssets.get(def.id)?.scaleId ?? def.id);
      if (point) anchors.heroHand = { x: g.heroX + ho.dx + (point[0]! - 256) * unit,
        y: g.groundY - ho.dy + (point[1]! - 328) * unit };
    }
    return anchors;
  }

  /** 新圖層只跟已結算事件；內功／身法效果固定喺自身。 */
  private identityImpact(id: string | null, damage: number, crit: boolean, killed: boolean, support = false) {
    const def = martialPoseFor(id); const asset = id ? this.martialAssets.get(id) : null;
    if (!def || !asset?.identityEffects) return;
    const a = this.artAnchors();
    this.identityFx.impact({ textures: asset.identityEffects, hero: a.hero, target: a.foe, height: a.unitH,
      premium: def.premium, support, damage, crit, killed, quiet: this.quiet });
  }

  /** 真正接觸先發聲，沿用全域靜音、混音及 limiter。 */
  private martialContactSound(critical = false) {
    const def = martialPoseFor(this.martialId);
    if (!def || !this.martialAssets.has(def.id) || this.quiet) return;
    if (['sword', 'blade', 'spear', 'staff', 'halberd', 'hook', 'whip'].includes(def.family)) playInkBlade();
    else if (['needle', 'dart', 'finger', 'bow', 'mechanism'].includes(def.family)) playInkTap();
    else if (def.family === 'weiqi' || def.family === 'flute') playInkSeal();
    else if (critical || def.family === 'fist' || def.family === 'palm' || def.family === 'kick') playInkHit();
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
        this.poseResult = r;
        this.identityImpact(this.martialId, r.dmg, r.crit, r.killed);
        if (r.dmg <= 0 && !r.killed) return; // 冇嘢好打（保險：唔好彈「0」）
        this.martialContactSound(r.crit);
        const identity = martialPoseFor(this.martialId);
        if (identity && this.martialAssets.has(identity.id) && !this.martialAssets.get(identity.id)?.identityEffects?.signature) {
          this.artTarget = target;
          this.artFx.spawn({ sprite: identity.id === 'pr_mountain_split' ? 'crack' : identity.family === 'sword' ? 'streak' : 'qi',
            at: identity.id === 'pr_mountain_split' ? 'foeGround' : 'foe', size: identity.premium ? .85 : .45,
            life: identity.premium ? .42 : .22, alpha: .72, layer: 'back' }, this.artAnchors(), this.quiet);
          if (identity.premium && (r.crit || r.killed) && !this.quiet) this.artFx.spawn({ sprite: 'spark', at: 'foe', size: .7, life: .25, alpha: .6 }, this.artAnchors());
        }
        this.onStrike?.();
        this.heroRig.kick(340);
        target.rig.kick(r.crit ? 560 : 380);
        if (r.killed) {
          target.state = 'dead';
          target.t = 0;
          target.lungeT = null;
          this.pendingDefeat = true;
        } else {
          target.hitT = 0;
        }
        const headY = g.groundY - this.enemyVisualHeight(target) * 0.6;
        this.floaters.push({
          x: target.x + (this.visualRng() - 0.5) * 34,
          y: headY - this.visualRng() * 14,
          text: formatSparNumber(r.dmg),
          gain: r.dmg,
          age: 0,
          dur: r.crit ? 1.15 : 0.9,
          kind: r.crit ? 'crit' : 'dmg',
        });
        if (r.heal > 0) {
          this.floaters.push({
            x: g.heroX - 14 + (this.visualRng() - 0.5) * 16,
            y: g.groundY - this.heroVisualHeight() * 0.78,
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
        if (r.fx?.length) this.showTraitFx(r.fx, target, r.reflect ?? 0, 0);
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
    this.splashes.push({ x: ix, y: iy, rot: this.visualRng() * Math.PI * 2, age: 0, dur: 0.5 });
    for (let i = 0; i < 14; i++) {
      const a = this.visualRng() * Math.PI * 2;
      const sp = 40 + this.visualRng() * 130;
      this.particles.push({
        x: ix,
        y: iy,
        vx: Math.cos(a) * sp + 60, // 墨點順住劍勢向右飛
        vy: Math.sin(a) * sp - 30,
        r: 0.8 + this.visualRng() * 2.6,
        age: 0,
        dur: 0.5 + this.visualRng() * 0.35,
      });
    }
  }

  /** 舞台幾何：全部 px（CSS 像素）。俠客由左行過去；敵人右邊企定望左 */
  private geom() {
    const h = this.cssH;
    // 身形約佔舞台高度 1/4，同山水比例更協調（舊 0.82 太大）
    const k = (this.motionHeight * 0.26) / SILHOUETTE_DESIGN_H;
    // 首次／重設：俠客由左邊起步
    if (this.heroX <= 0) this.heroX = this.cssW * 0.20;
    return {
      k,
      groundY: h * (this.presentation === 'battle' ? BATTLE_CAMERA.ground : this.art ? SPAR_PRESENTATION.ground : 0.92),
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
    if (this.shake > 0 && !this.reviewEffectsOff) {
      ctx.translate((this.visualRng() - 0.5) * this.shake, (this.visualRng() - 0.5) * this.shake);
    }

    this.drawBackground();
    if (!this.art && !this.quiet) this.ambience.draw(ctx, 'back');
    // 外功：天色轉暗（聽雨、驚雷、棋局）
    if (this.darken > 0.01 && !this.reviewEffectsOff) {
      ctx.fillStyle = `rgba(18, 20, 28, ${this.darken})`;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
    const artAnchors = this.artFx.count && !this.reviewEffectsOff ? this.artAnchors() : null;
    const artSprites = artAnchors ? this.artSpriteImages() : this.artSprites;
    if (artAnchors) this.artFx.draw(ctx, artSprites, artAnchors, 'back');

    // 地面淡墨影（跳起時影留喺地、細啲）
    const heroOff = this.artHeroOffset();
    this.shadow(g.heroX + heroOff.dx, g.groundY, 60 * g.k * Math.max(0.45, 1 - heroOff.dy / (SILHOUETTE_DESIGN_H * g.k * 2)));
    for (const e of this.enemies) {
      if (this.enemyAlpha(e) > 0.01) this.shadow(e.x, g.groundY, 68 * this.enemyFigure(e).k);
    }

    this.drawDust(g);

    // 敵影先畫（喺俠客身後）
    for (const e of this.enemies) this.drawEnemy(g, e);
    ctx.save();
    if (this.reviewMonochrome) ctx.filter = 'brightness(0)';
    this.drawWarrior(g);
    ctx.restore();
    if (this.art) this.drawWeather();
    else if (!this.quiet) this.ambience.draw(ctx, 'front');

    if (!this.reviewEffectsOff) this.drawTrail();
    if (artAnchors) this.artFx.draw(ctx, artSprites, artAnchors, 'front');
    if (!this.reviewEffectsOff && !this.quiet) this.identityFx.draw(ctx);
    if (!this.reviewEffectsOff) { this.drawSplashes(); this.drawParticles(); }
    this.drawCoins();
    this.drawFloaters();

    // 外功白光（驚雷劈落、聽雨刺破）
    if (this.artFlash > 0.01 && !this.reviewEffectsOff) {
      ctx.fillStyle = `rgba(255, 252, 240, ${this.artFlash * 0.55})`;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
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
      // 鏡頭慢慢呼吸（推近拉遠少少），靜態圖都似有景深
      const breathe = 1 + 0.022 * Math.sin(this.bgT * 0.11);
      const scale = Math.max(this.cssW / img.width, this.cssH / img.height) * 1.08 * breathe;
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
    if (this.art) {
      // 畫面比例獨立適配，地面錨點固定；唔對前景做呼吸縮放。
      const drawSeason = (season: SparSeason, alpha: number) => {
        ctx.save(); ctx.globalAlpha = alpha;
        const image = this.presentation === 'battle' && this.battleBackdrop ? this.battleBackdrop : this.art!.seasons[season];
        if (this.presentation === 'battle') {
          const rect = fitBattleBackdrop(this.cssW, this.cssH, image.naturalWidth, image.naturalHeight,
            this.battleBackdrop ? BATTLE_PORTRAIT_GROUND : SPAR_PRESENTATION.ground);
          ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
        } else ctx.drawImage(image, 0, 0, this.cssW, this.cssH);
        ctx.restore();
      };
      if (this.previousSeason && this.seasonFade < 1) drawSeason(this.previousSeason, 1);
      drawSeason(this.season, this.seasonFade);
      if (!this.quiet) {
        ctx.save(); ctx.globalAlpha = .16;
        const shift = Math.sin(this.bgT * .15) * this.cssW * .055;
        ctx.drawImage(this.art.mist, -this.cssW * .15 + shift, this.cssH * .27, this.cssW * 1.3, this.cssH * .3);
        ctx.restore();
      }
      return;
    }
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
      const sample = collapseSample(e.t, SPAR_CLIPS['enemy-death'].dur);
      return { ...REST, x: 100 * sample.recoil, y: 0, rot: 0, sy: 1, alpha: sample.alpha };
    }
    if (e.state === 'spawn') {
      if (!this.combat) return evalPose('enemy', this.idleT, SPAR_CLIPS['enemy-spawn'], e.t);
      // 由右邊大步行入：三步跳躍、落地微蹲；首領慢啲、重啲
      const p = Math.min(1, e.t / this.spawnDur());
      const ease = 1 - (1 - p) ** 3;
      const steps = e.boss ? 2 : 3;

      return {
        ...REST,
        x: 760 * (1 - ease),
        y: 0,
        rot: -4 * Math.sin(p * Math.PI * steps * 2) * (1 - p),
        sy: p > 0.85 ? 1 - 0.08 * Math.sin(((p - 0.85) / 0.15) * Math.PI) : 1,
        alpha: Math.min(1, p * 3),
      };
    }
    const bobY = Math.sin(e.bob * (e.state === 'walk' ? 8.5 : 2.4)) * (e.state === 'walk' ? 3.4 : 2.2);
    // 待機只微移重心，唔用垂直拉伸令人物忽大忽細。
    let x = this.combat ? 14 * Math.sin(e.bob * 1.3) : 0;
    let rot = this.combat ? 2.4 * Math.sin(e.bob * 1.7) : 0;
    let sy = 1;
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
    return { ...REST, x, y: this.art ? 0 : bobY, rot, sy, alpha };
  }

  private shadow(x: number, y: number, rx: number) {
    const { ctx } = this;
    ctx.save();
    if (this.art) {
      ctx.globalAlpha *= .52;
      ctx.drawImage(this.art.shadow, x - Math.max(9, rx * 2), y - 3, Math.max(18, rx * 4), 7);
    } else {
      ctx.fillStyle = `rgba(${INK},0.22)`;
      ctx.beginPath(); ctx.ellipse(x, y, rx, rx * .16, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** 圖集已畫好手形／持武：呢一層完全唔疊裝備武器或舊劍影。 */
  private drawMartialWarrior(g: ReturnType<SparStage['geom']>): boolean {
    const inspection = this.poseInspection;
    const attacking = this.attackT !== null;
    const id = inspection?.id ?? (attacking ? this.martialId : this.supportPose?.id);
    const def = martialPoseFor(id);
    if (!def) return false;
    const staticImage = martialFallbackImage(def.family);
    const asset = (id ? this.martialAssets.get(id) : null) ?? (staticImage ? { atlas: staticImage, guard: true, scaleId: MARTIAL_FALLBACK_ART[def.family] } : null);
    // 首次解碼仍由細節人物後備承接，唔空一格或退返黑影。
    if (!asset) return false;
    const run = this.artRun;
    const support = !inspection && !attacking;
    const c = choreoForArt(id);
    const duration = support || (inspection && (def.family === 'internal' || def.family === 'step')) ? 1.1 : c?.dur ?? this.attackClipNow().dur;
    const t = inspection?.t ?? (support ? this.supportPose!.t : run?.t ?? this.attackT ?? 0);
    const contact = c?.events.find(e => e.kind === 'hit')?.t ?? (support ? .42 : .36);
    const result = inspection?.result ?? this.artResult ?? this.poseResult;
    const variant = !asset.guard && !this.quiet && t > contact + (def.contactIndex === undefined ? 0 : .04) && result && result.dmg > 0
      ? result.killed && def.killRecovery ? asset.variants?.kill : result.crit && def.critRecovery ? asset.variants?.crit : null : null;
    let frame = asset.guard ? 0 : sampleMartialPose(def, t, duration, contact, variant ? result : null, this.quiet);
    const atlas = variant ?? (frame >= 8 ? asset.variants?.detail : null) ?? asset.atlas;
    frame %= 8;
    const off = inspection || support ? { dx: 0, dy: 0 } : this.artHeroOffset();
    const H = SILHOUETTE_DESIGN_H * g.k;
    const p = Math.max(0, Math.min(1, t / duration));
    const footwork = martialFootwork(def.id, p, this.quiet);
    off.dx += H * footwork.dx; off.dy += H * footwork.dy;
    if (def.id === 'pr_mountain_split' && !this.quiet) {
      off.dy += H * .3 * Math.max(0, Math.sin(p * Math.PI * 2));
    }
    const scaleId = variant ? `${def.id}-${variant === asset.variants?.kill ? 'kill' : 'crit'}`
      : atlas === asset.variants?.detail ? `${def.id}-detail` : asset.scaleId ?? def.id;
    const unit = this.heroArtHeight() / 218 * heroFigureScale(scaleId);
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(g.heroX + off.dx, g.groundY - off.dy);
    // 素材本身有轉胯、手腳同衣擺，唔再用條帶變形扭曲手形同兵器。
    const pose = !this.quiet && !inspection && !support ? this.artHeroSample() : null;
    if (pose) {
      ctx.globalAlpha *= pose.alpha;
      // 大幅翻轉只適用舊平面剪影；新素材已畫出踢腿／轉身姿勢。
      ctx.rotate(Math.max(-12, Math.min(12, pose.rot)) * DEG);
    }
    if (asset.guard) ctx.drawImage(atlas, -256 * unit, -328 * unit, 512 * unit, 352 * unit);
    else ctx.drawImage(atlas, frame * 512, 0, 512, 352, -256 * unit, -328 * unit, 512 * unit, 352 * unit);
    ctx.restore();
    return true;
  }

  /** 非出招階段維持同款人物；移動、受擊及倒地唔再讀舊黑影幀。 */
  private drawDetailedWarrior(g: ReturnType<SparStage['geom']>): boolean {
    if(this.images.wardrobe&&this.images.characterAppearance){
      const off=this.artHeroOffset(),down=this.heroDownT,hurt=this.heroHitT<.22;
      const active=this.artRun!==null||this.attackT!==null||this.supportPose!==null;
      const def=martialPoseFor(this.martialId);
      const family=active?def?.family??'fist':this.weaponDef?.src.match(/weapon-([\w-]+)\.webp/)?.[1]??'fist';
      drawAppearance(this.ctx,this.images.wardrobe,this.images.characterAppearance,{
        x:g.heroX+off.dx,y:g.groundY-off.dy,height:this.heroVisualHeight(),face:1,
        pose:down!==null?'down':hurt?'hurt':active?'attack':this.heroMoving?'walk':'idle',
        time:down??(hurt?this.heroHitT:this.artRun?(this.artRun.hero().pose==='windup'?.02:this.artRun.hero().pose==='strike'?.2:.65):active?this.attackT??this.supportPose?.t??0:this.walkT),
        family,reduced:this.quiet,
      });return true;
    }
    const appearance = this.images.heroAppearance;
    if (!appearance) return false;
    const active = this.poseInspection || this.attackT !== null || this.supportPose;
    if (this.heroDownT === null && active && this.drawMartialWarrior(g)) return true;
    const frame = heroAppearanceFrame({ moving: this.heroMoving, gait: this.walkT, idle: this.idleT,
      hurt: this.heroHitT, down: this.heroDownT, reduced: this.quiet });
    // 平靜待機保留上一門／當前裝備武學嘅同一人物及正確持武；唔另外疊裝備劍。
    const restId = this.martialAssets.has(this.martialId ?? '') ? this.martialId
      : [...this.martialAssets.keys()].find(id => !['internal', 'step'].includes(martialPoseFor(id)?.family ?? ''));
    const rest = !active && frame >= 4 && frame <= 5 && restId ? this.martialAssets.get(restId) : null;
    const basic = this.heroDownT === null && this.attackT !== null && !martialPoseFor(this.martialId) ? appearance.basic : null;
    const image = rest?.atlas ?? basic?.image ?? appearance.image;
    const guard = rest ? rest.guard : basic ? basic.guard : appearance.guard;
    const sample = rest ? 0 : basic && !basic.guard
      ? sampleMartialPose(martialPoseFor('art_river_fist')!, this.attackT ?? 0, this.attackClipNow().dur, .36, null, this.quiet) : frame;
    // 生命週期固定同一細比例，唔再跟上一招放大；武學圖只按自己守勢校準一次。
    const scaleId = rest ? rest.scaleId ?? restId! : basic || guard ? 'art_river_fist' : undefined;
    const unit = this.heroArtHeight() / 218 * heroFigureScale(scaleId);
    const flinch = this.heroHitT < .22 ? 1 - this.heroHitT / .22 : 0;
    const downFade = this.heroDownT === null ? 1 : Math.max(0, 1 - Math.max(0, this.heroDownT - .9) / .6);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= Math.max(.35, Math.min(1, this.heroFade || 1)) * downFade;
    ctx.translate(g.heroX - 9 * flinch * flinch, g.groundY);
    if (guard && this.heroDownT !== null) {
      // 整套網絡圖失敗只用同款細節靜態人物後備，保持倒地／淡出節點。
      ctx.rotate(-Math.min(1, this.heroDownT / .7) * Math.PI * .44);
    }
    if (guard) ctx.drawImage(image, -256 * unit, -328 * unit, 512 * unit, 352 * unit);
    else ctx.drawImage(image, (rest || basic ? sample : sample % 4) * 512, rest || basic ? 0 : Math.floor(sample / 4) * 352,
      512, 352, -256 * unit, -328 * unit, 512 * unit, 352 * unit);
    ctx.restore();
    return true;
  }

  private drawWarrior(g: ReturnType<SparStage['geom']>): { x: number; y: number } | null {
    const { ctx } = this;
    if (this.drawDetailedWarrior(g)) return null;
    if (this.heroDownT === null && this.drawMartialWarrior(g)) return null;
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
      // 第 25 項：外功編排位移（衝前、跳起、穿過敵人、後跳）
      const artS = this.heroDownT === null ? this.artHeroSample() : null;
      const artOff = artS ? this.artHeroOffset() : { dx: 0, dy: 0 };
      const fx = g.heroX + body.x * g.k - 9 * flinch * flinch - 18 * downP + artOff.dx;
      const fy = (this.art ? g.groundY : g.groundY + body.y * g.k + crouch) - artOff.dy;
      if (this.art && this.heroDownT !== null) {
        const sample = collapseSample(this.heroDownT, .9);
        const img = this.art.heroDown[sample.frame]!;
        ctx.save(); ctx.globalAlpha *= downFade;
        ctx.drawImage(img, g.heroX - 450 * g.k - 10 * sample.recoil, g.groundY - 788 * g.k, 900 * g.k, 800 * g.k);
        ctx.restore(); return null;
      }
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
      const sy = (Number.isFinite(body.sy) && body.sy > 0.2 ? body.sy : 1) - (this.art ? crouch / (788 * g.k) : 0);

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
      } else if (this.art && this.heroMoving) {
        const fi = gaitFrame(this.walkT);
        heroImg = this.art.walk[fi]!;
        part = { w: 900, h: 800, dx: -450, dy: -788 };
        frameKey = 'generated-walk';
      } else if (!this.art && this.images.heroWalk && this.images.heroWalk.length >= 4 && (this.directorSample?.walkMul ?? 1) > 0.15) {
        const fi = walkFrameIndex(this.walkT);
        heroImg = this.images.heroWalk[fi] ?? this.images.heroIdle;
        part = HERO_WALK_FRAMES[fi] ?? HERO_SIL.idle;
        frameKey = this.images.heroWalk[fi] ? `walk-${fi}` : 'idle';
      }

      // 外功編排：姿勢由編排話事（蓄勢／揮擊／行路／待機）
      if (artS) {
        if (artS.pose === 'windup' && this.images.heroAtk?.[0]) {
          heroImg = this.images.heroAtk[0];
          part = HERO_ATK_FRAMES[0]!;
          frameKey = 'atk-0';
        } else if (artS.pose === 'strike' && this.images.heroAtk?.[2]) {
          heroImg = this.images.heroAtk[2];
          part = HERO_ATK_FRAMES[2]!;
          frameKey = 'atk-2';
        } else if (artS.pose === 'walk' && this.art) {
          const fi = gaitFrame(this.walkT + (this.artRun?.t ?? 0) * 2.4);
          heroImg = this.art.walk[fi]!;
          part = { w: 900, h: 800, dx: -450, dy: -788 };
          frameKey = 'generated-walk';
        } else if (artS.pose === 'idle') {
          heroImg = this.images.heroIdle;
          part = HERO_SIL.idle;
          frameKey = 'idle';
        }
      }
      const artRot = artS ? artS.rot * DEG : 0;
      const artSx = artS ? artS.sx : 1;
      const artAlpha = artS ? artS.alpha : 1;
      const bodyH = SILHOUETTE_DESIGN_H * g.k;

      const rot = (body.rot - 6 * flinch - 78 * (1 - (1 - downP) ** 3)) * DEG;

      // 外功殘影（閃現、衝刺、迴旋）
      if (artS && this.artAfterimage) {
        this.afterClock += 1 / 60;
        if (this.afterClock >= AFTERIMAGE_EVERY) {
          this.afterClock = 0;
          this.afterimages.push({ img: heroImg, part, x: fx, y: fy, rot: rot + artRot, sy, age: 0 });
          if (this.afterimages.length > 6) this.afterimages.shift();
        }
      }
      // 揮擊殘影：出招爆發段每隔少少記一格，淡灰墨影跟喺身後
      if (!artS && striking && at > 0.12 && at < 0.52 && !this.quiet) {
        this.afterClock += 1 / 60;
        if (this.afterClock >= AFTERIMAGE_EVERY) {
          this.afterClock = 0;
          this.afterimages.push({ img: heroImg, part, x: fx, y: fy, rot, sy, age: 0 });
          if (this.afterimages.length > 5) this.afterimages.shift();
        }
      }
      for (const a of this.afterimages) {
        ctx.save();
        ctx.globalAlpha *= 0.26 * (1 - a.age / AFTERIMAGE_LIFE);
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.scale(1, a.sy);
        drawSilhouetteSprite(ctx, a.img, { k: g.k, w: a.part.w, h: a.part.h, dx: a.part.dx, dy: a.part.dy });
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha *= fade * downFade * artAlpha;
      ctx.translate(fx, fy);
      if (artS) {
        // 外功：以身體中心轉（迴旋、空翻），橫向拉長（衝刺）
        ctx.translate(0, -bodyH * 0.5);
        ctx.rotate(artRot);
        ctx.scale(artSx, 1);
        ctx.translate(0, bodyH * 0.5);
      }
      ctx.rotate(rot);
      ctx.scale(1, sy);
      // 條帶變形：上身傾、衣擺擺、頭髮飄（腳底固定）
      const heroRig = this.heroRig;
      drawWarpedSprite(
        ctx,
        heroImg,
        { k: g.k, w: part.w, h: part.h, dx: part.dx, dy: part.dy },
        // 倒地時成個人轉，唔再疊加變形（避免條帶錯位）
        (t) => (this.heroDownT !== null ? 0 : heroRig.offsetAt(t)),
      );

      // 兵器剪影：掛喺呢格握點，沿該格揮擊方向；空手唔畫（拖墨用拳風距離）
      void arm;
      void head;
      const gripDef = frameKey === 'generated-walk' ? { x: 495, y: 490, angle: 38 } : HERO_WEAPON_GRIPS[frameKey] ?? HERO_WEAPON_GRIPS.idle!;
      // 握點跟住條帶變形一齊郁，兵器唔會同手分家
      const gx = (gripDef.x + HERO_SIL.idle.dx + this.heroRig.offsetAt(gripDef.y / SILHOUETTE_DESIGN_H)) * g.k;
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
    const figure = this.enemyFigure(e);
    const ke = figure.k;
    const artOff = this.artFoeOffset(e);
    const footX = e.x + pose.x * this.enemyKe(e) + artOff.dx;
    const footY = g.groundY + pose.y * this.enemyKe(e) - artOff.dy;
    if(this.images.wardrobe&&this.images.opponentAppearance){
      this.ctx.save();this.ctx.globalAlpha=pose.alpha;
      drawAppearance(this.ctx,this.images.wardrobe,this.images.opponentAppearance,{
        x:footX,y:footY,height:this.heroVisualHeight(),face:-1,
        pose:e.state==='dead'?'down':this.foeAttackActive?'attack':String(e.state)==='hurt'?'hurt':'idle',
        time:e.t,family:this.images.opponentFamily??'fist',reduced:this.quiet,
      });this.ctx.restore();return;
    }
    pose.rot += artOff.rot;
    pose.sy *= artOff.sy;
    const idx = Math.max(0, this.enemyPool.indexOf(e.def));
    const enemyImg = this.images.enemies[idx] ?? this.images.enemies[0];
    if (!enemyImg) return;

    if (e.state === 'dead') {
      const sample = collapseSample(e.t, SPAR_CLIPS['enemy-death'].dur);
      const frames = this.art?.deaths.get(e.def.part.src);
      ctx.save(); ctx.globalAlpha = pose.alpha;
      if (frames) {
        const downK = figure.downK;
        // 圖集邊緣有少量上一格兵器碎影；倒地格只顯示接地姿勢嘅範圍。
        // 呢度係矩形裁切位圖，唔以path補畫角色。
        const postureHeight = [1, .95, .72, .55][sample.frame]! * SILHOUETTE_DESIGN_H * downK;
        ctx.beginPath(); ctx.rect(footX - 900 * downK, g.groundY - postureHeight, 1800 * downK, postureHeight + 12 * downK); ctx.clip();
        ctx.drawImage(frames[sample.frame]!, footX - 900 * downK, g.groundY - 788 * downK, 1800 * downK, 800 * downK);
      } else {
        // 素材未到時仍用原造型；貼地半蹲，唔飛起打轉。
        const flatten = Math.max(.22, 1 - sample.recoil * .78);
        ctx.translate(footX, g.groundY); ctx.scale(1, flatten);
        drawSilhouetteSprite(ctx, enemyImg, { ...e.def.part, k: ke, dy: figure.dy });
      }
      ctx.restore(); return;
    }

    // 特性／蓄勢提示用AI位圖，保留原有特性語意，唔畫粗線圈／火舌。
    const isCurrent = this.enemies[0] === e;
    const charging = isCurrent && e.tier !== 'minion' && (this.combat?.foeCharging?.() ?? false);
    const enraged = isCurrent && e.tier !== 'minion' && (this.combat?.foeEnraged?.() ?? false);
    if (this.art && e.tier !== 'minion') {
      const radius = (e.boss ? 30 : 21) * this.motionHeight / 218;
      ctx.save(); ctx.globalAlpha = charging ? .75 : .34;
      const shadow = solidSilhouette(this.art.shadow, e.traitRgb ?? CINNABAR);
      ctx.drawImage(shadow, footX - radius, footY - 4, radius * 2, 10);
      if (!this.quiet && (charging || enraged)) {
        ctx.globalAlpha = .3 + .12 * Math.sin(this.bgT * 5);
        const size = 42 * this.motionHeight / 218;
        const plume = solidSilhouette(this.art.landing, e.traitRgb ?? CINNABAR);
        ctx.drawImage(plume, footX - size / 2, footY - size * .8, size, size);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pose.alpha));
    ctx.translate(footX, footY);
    ctx.rotate(pose.rot * DEG);
    ctx.scale(1, pose.sy);
    const sprite = { k: ke, w: e.def.part.w, h: e.def.part.h, dx: e.def.part.dx, dy: figure.dy };
    // 精英金邊、首領朱砂邊：單色剪影四向錯開畫喺後面
    if (e.tier !== 'minion') {
      const rim = solidSilhouette(enemyImg, e.boss ? BOSS_RIM : ELITE_RIM);
      const off = (e.boss ? 1.1 : .8) * (0.85 + 0.15 * Math.sin(e.bob * 4));
      const a = ctx.globalAlpha;
      ctx.globalAlpha = a * (e.boss ? .72 : .6);
      for (const [ox, oy] of [[-off, 0], [off, 0], [0, -off], [0, off]] as const) {
        ctx.save();
        ctx.translate(ox, oy);
        drawWarpedSprite(ctx, rim, { ...sprite, strips: 20 }, (t) => e.rig.offsetAt(t));
        ctx.restore();
      }
      ctx.globalAlpha = a;
    }
    // 素材本身望左，唔好再 flip（否則會變望右）；條帶變形做衣擺同傾身；衣帶疊點綴色
    drawWarpedSprite(ctx, e.accent ? accentSilhouette(enemyImg, e.accent) : enemyImg, sprite, (t) => e.rig.offsetAt(t));
    // 微細眼神高光用位圖，唔以圓形光暈搶走造型。
    if (this.art && !this.quiet) {
      for (const eye of e.def.eyes) {
        const size = Math.max(1.1, 13 * ke);
        ctx.globalAlpha *= .5;
        ctx.drawImage(this.art.impact, eye.x * ke - size / 2, (eye.y + figure.footOffset) * ke - size / 2, size, size);
      }
    }
    ctx.restore();
  }

  /**
   * 劍鋒拖墨（參考水墨動作遊戲嘅斬擊殘影）：軌跡畫做一條漸幼漸淡嘅墨帶，
   * 最新一段加宣紙白刃高光——快揮嗰陣就好似一彎墨虹掃過，唔再係一串圓點。
   */
  private drawDust(g: ReturnType<SparStage['geom']>) {
    if (this.quiet || !this.art) return;
    const { ctx } = this;
    for (const d of this.dust) {
      const p = d.age / d.dur;
      const size = (d.landing ? 48 : 23) * (1 + p * .45) * this.motionHeight / 218;
      ctx.save(); ctx.globalAlpha = (1 - p) * (d.landing ? .65 : .36);
      ctx.drawImage(d.landing ? this.art.landing : this.art.dust, d.x - size / 2, g.groundY - size * .75, size, size * .8);
      ctx.restore();
    }
  }

  private drawTrail() {
    if (this.quiet || !this.art || this.attackT === null || this.artRun || (this.martialId && this.martialAssets.has(this.martialId))) return;
    const p = (this.attackT - .19) / .27;
    if (p < 0 || p > 1) return;
    const g = this.geom(), size = 74 * this.motionHeight / 218;
    this.ctx.save(); this.ctx.globalAlpha = Math.sin(p * Math.PI) * .8;
    this.ctx.translate(g.heroX + 19, g.groundY - 28); this.ctx.rotate(-.35 + p * .55);
    this.ctx.drawImage(this.art.slash, -size * .5, -size * .65, size, size);
    this.ctx.restore();
  }

  private drawSplashes() {
    if (this.quiet) return;
    const { ctx } = this;
    for (const s of this.splashes) {
      const p = s.age / s.dur;
      const size = (this.art ? 46 : 100) * (.75 + Math.min(p * 4, 1) * .3) * this.motionHeight / 218;
      ctx.save(); ctx.globalAlpha = Math.pow(1 - p, 2) * .85;
      ctx.translate(s.x, s.y); ctx.rotate(s.rot * .15);
      ctx.drawImage(this.art?.impact ?? this.images.splash, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  private drawParticles() {
    if (this.quiet || !this.art) return;
    const { ctx } = this;
    for (const pt of this.particles) {
      const p = pt.age / pt.dur, size = Math.max(2, pt.r * 3);
      ctx.save(); ctx.globalAlpha = .45 * (1 - p);
      ctx.drawImage(this.art.impact, pt.x - size / 2, pt.y - size / 2, size, size);
      ctx.restore();
    }
  }

  private drawWeather() {
    if (this.quiet || !this.art) return;
    const { ctx } = this;
    // 地面之前只播位圖天氣；避免花／雪落穿石台。
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, this.cssW, this.presentation === 'battle' ? this.geom().groundY : this.cssH * .84); ctx.clip();
    for (const p of this.weather) {
      const size = this.season === 'summer' ? p.size * .7 : p.size * .45;
      ctx.save(); ctx.globalAlpha = particleAlpha(p, .2) * (this.season === 'winter' ? .55 : .7);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(this.art.weather[this.season], -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.restore();
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
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `600 13px ${this.uiFontFamily}`;
      // 保留墨漬底圖；修為字同數字一律用介面字體，唔用預畫書法字形。
      if (ui?.splashPaper) {
        const pop = p < 0.18 ? 0.7 + (p / 0.18) * 0.3 : 1;
        const width = Math.max(54, ctx.measureText(f.text).width + 24) * pop;
        ctx.drawImage(ui.splashPaper, f.x - width / 2, ty - 28, width, 44 * pop);
      }
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
    const k = this.motionHeight / 218;
    if (f.kind === 'trait') {
      // 特性圓印：特性色實心圓＋宣紙色單字，彈出再飄
      const pop = p < 0.14 ? 0.4 + (p / 0.14) * 0.8 : p < 0.24 ? 1.2 - ((p - 0.14) / 0.1) * 0.2 : 1;
      const r = 13 * k * pop;
      const y = f.y - (1 - (1 - p) ** 2) * 18 * k;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = `rgb(${f.rgb ?? CINNABAR})`;
      ctx.strokeStyle = 'rgba(246,240,228,0.95)';
      ctx.lineWidth = 2;
      const stamp = this.art?.impact ?? this.images.ui?.splashPaper;
      if (stamp) ctx.drawImage(solidSilhouette(stamp, f.rgb ?? CINNABAR), f.x - r, y - r, r * 2, r * 2);
      ctx.font = `800 ${Math.round(r * 1.25)}px ${this.uiFontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fbf7ee';
      ctx.fillText(f.text, f.x, y + r * 0.06);
      ctx.restore();
      return;
    }
    const base = f.kind === 'crit' ? 22 : f.kind === 'heal' ? 14 : f.kind === 'hurt' ? 16 : 17;
    const pop = p < 0.12 ? 1.15 - (p / 0.12) * 0.15 : 1;
    const size = Math.round(base * k * pop);
    const rise = f.kind === 'crit' ? 22 : 30;
    const y = f.y - (1 - (1 - p) ** 2) * rise * k;
    const fill =
      f.kind === 'crit'
        ? '#f6d36b'
        : f.kind === 'heal'
          ? '#b3d0bc'
          : f.kind === 'hurt'
            ? '#d29c8e'
            : '#fbf7ee';
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    if (f.kind === 'crit') {
      ctx.font = `800 ${Math.round(12 * k)}px ${this.uiFontFamily}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(${INK},0.9)`;
      ctx.strokeText('暴擊', f.x - size * 1.1, y - size * 0.62);
      ctx.fillStyle = `rgb(${CINNABAR})`;
      ctx.fillText('暴擊', f.x - size * 1.1, y - size * 0.62);
    }
    ctx.font = `800 ${size}px ${this.uiFontFamily}`;
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
    const size = 18 * (this.motionHeight / 218);
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

/** 對打浮字沿用統一UI字體，淡色字配墨邊。 */

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
  ]).then(async (loaded) => {
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
    const [art, heroAppearance, wardrobe] = await Promise.all([loadSparArt().catch(() => undefined), loadHeroAppearance(),loadAppearanceAssets()]);
    return {
      wardrobe,
      heroAppearance,
      heroIdle,
      heroAttack,
      heroWalk,
      heroAtk,
      layerBody,
      layerHat,
      layerArm,
      enemies: enemyImgs,
      splash,
      art,
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
  return tryLoad(`${base}splash-paper.webp`).then((splashPaper) => ({ splashPaper: splashPaper ?? null }));
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
