/**
 * 切磋演武 rig 數據：骨架定義 + 武器掛點 + 動作 clip（v2 雙邊圍剿版）。
 *
 * 座標系：design units（du）＝ 部件貼圖 webp 像素。y 向下為正。
 * 所有動作 clip 嘅數值都係「相對 rest pose 嘅增量」，引擎會疊加喺循環 idle 之上，
 * 所以新動作由 0 開始、喺 0 結束就會無縫銜接。
 *
 * v2 結構：俠客背影（冇樣）＋ 武器係獨立部件，掛喺劍臂嘅 grip 錨點，
 * 跟住手臂骨骼轉，再加自己嘅局部甩腕旋轉。邊款武器由裝備欄決定。
 *
 * 日後擴展：
 * - 新動作：加一個 SparClip 落 SPAR_CLIPS，喺引擎 schedule 嗰度引用個名。
 * - 俠客外觀：引擎只畫 `sil/` 剪影幀（見 silhouetteDraw.ts）；rig 只提供骨架掛點同揮擊 clip。
 * - 新武器：整張垂直（柄上鋒下）透明圖，加一個 WeaponSpriteDef 落 WEAPON_SPRITES。
 * - 新敵人：加一個 EnemyDef（單圖 + 腳底錨點 + 眼部位置），喺 STAGE 揀用。
 */

/** 骨骼屬性：rot＝角度（度，順時針為正）、x/y＝du 位移、sy＝垂直縮放、alpha＝透明度 */
export type SparBoneProp = 'rot' | 'x' | 'y' | 'sy' | 'alpha';
export type SparEasing = 'linear' | 'in' | 'out' | 'inout' | 'expoin';

export interface SparKey {
  t: number;
  v: number;
  /** 呢個 key 到下個 key 之間嘅緩動，預設 inout */
  e?: SparEasing;
}

export interface SparTrack {
  bone: string;
  prop: SparBoneProp;
  keys: SparKey[];
}

export interface SparClipEvent {
  t: number;
  id: 'strike' | string;
}

export interface SparClip {
  name: string;
  dur: number;
  loop?: boolean;
  tracks: SparTrack[];
  events?: SparClipEvent[];
}

/** 一塊可換膚嘅部件貼圖 */
export interface SparPart {
  src: string;
  /** 貼圖尺寸（du） */
  w: number;
  h: number;
  /** 畫嘅時候左上角相對「骨骼錨點」嘅偏移（du） */
  dx: number;
  dy: number;
}

export interface WarriorRigV3 {
  v: 3;
  /** 劍臂掛喺身嘅邊個位（相對腳底錨點，du） */
  shoulderSocket: { x: number; y: number };
  /** 武器握點相對肩錨點（du） */
  gripSocket: { x: number; y: number };
  designHeight: number;
  /** 自訂揮擊 clip（霧接臂用溫和版）；冇就用標準 attack */
  attackClip?: SparClip;
}

export type AnyWarriorRig = WarriorRig | WarriorRigV3;

export const isV3Rig = (r: AnyWarriorRig): r is WarriorRigV3 => (r as WarriorRigV3).v === 3;

export interface WarriorRig {
  /** 頭掛喺身嘅邊個位（相對腳底錨點，du） */
  neckSocket: { x: number; y: number };
  /** 劍臂掛喺身嘅邊個位（相對腳底錨點，du） */
  shoulderSocket: { x: number; y: number };
  /** 武器握點相對肩錨點（du）——武器圖嘅 grip 會對正呢度 */
  gripSocket: { x: number; y: number };
  /** 俠客設計身高（du），舞台縮放基準 */
  designHeight: number;
}

export interface EnemyDef {
  part: SparPart;
  /** 眼睛相對腳底錨點（du）——紅瞳殺氣脈動用 */
  eyes: { x: number; y: number }[];
  /** 身高倍率（1＝同俠客相若；巨漢 1.2、老翁 0.92 之類） */
  scale?: number;
}

/** 一款武器嘅貼圖 + 掛點數據（全部原圖垂直、柄上鋒下） */
export interface WeaponSpriteDef {
  src: string;
  /** 貼圖尺寸（px） */
  w: number;
  h: number;
  /** 握點喺貼圖入面嘅位置（px）——會對正俠客手掌 */
  grip: { x: number; y: number };
  /** 武器鋒尖喺貼圖入面嘅位置（px）——拖墨軌用 */
  tip: { x: number; y: number };
  /** 顯示長度：俠客身高嘅幾多倍（du 空間） */
  lengthRatio: number;
  /** 攻擊距離（du，由俠客腳底計）——影響幾遠出手 */
  reach: number;
  /** 閒立時武器世界角度（度，順時針；0＝鋒垂直向下） */
  restRot: number;
}

const SPAR_BASE = `${import.meta.env.BASE_URL || '/'}ink/spar/`;

/** 默認骨架（無門派）：頸／肩／握點錨點＋設計身高 */
export const WARRIOR: WarriorRig = {
  neckSocket: { x: 27.5, y: -395 },
  shoulderSocket: { x: 70, y: -355 },
  gripSocket: { x: 116, y: 84 },
  designHeight: 531,
};

/**
 * v3 溫和揮擊：同主 attack 節奏，蓄勢略收（霧接臂門派唔好大風車）。
 * 仍走純黑影骨骼，只係角度細啲。
 */
const V3_ATTACK_SOFT: SparClip = {
  name: 'attack',
  dur: 0.72,
  tracks: [
    { bone: 'arm', prop: 'rot', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -95, e: 'expoin' }, { t: 0.36, v: 30, e: 'linear' }, { t: 0.48, v: 26, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'weapon', prop: 'rot', keys: [ { t: 0, v: 0, e: 'inout' }, { t: 0.2, v: 14, e: 'in' }, { t: 0.3, v: 8, e: 'expoin' }, { t: 0.38, v: 36, e: 'out' }, { t: 0.52, v: 22, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'body', prop: 'rot', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -6, e: 'expoin' }, { t: 0.36, v: 8, e: 'linear' }, { t: 0.5, v: 6, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'body', prop: 'x', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -14, e: 'expoin' }, { t: 0.36, v: 72, e: 'linear' }, { t: 0.52, v: 68, e: 'inout' }, { t: 0.72, v: 0 } ] },
    { bone: 'body', prop: 'y', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: 10, e: 'expoin' }, { t: 0.36, v: -6, e: 'linear' }, { t: 0.72, v: 0 } ] },
    { bone: 'head', prop: 'rot', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.22, v: -4, e: 'expoin' }, { t: 0.36, v: 6, e: 'inout' }, { t: 0.72, v: 0 } ] },
  ],
  events: [{ t: 0.36, id: 'strike' }],
};

/** 十派骨架：肩／握點錨點（按原 v3 立繪實測）＋可選溫和揮擊 clip */
export const SECT_RIGS_V3: Record<string, WarriorRigV3> = {
  sect_emei: {
    v: 3,
    shoulderSocket: { x: -1.7, y: -384.5 },
    gripSocket: { x: 117.9, y: 64.7 },
    designHeight: WARRIOR.designHeight,
  },
  sect_qingyun: {
    v: 3,
    shoulderSocket: { x: 14.2, y: -375.5 },
    gripSocket: { x: 67.3, y: 67.3 },
    designHeight: WARRIOR.designHeight, // 青雲劍派

  },
  sect_tiandao: {
    v: 3,
    shoulderSocket: { x: 6.6, y: -394.3 },
    gripSocket: { x: 96.4, y: 30.9 },
    designHeight: WARRIOR.designHeight, // 天刀門

  },
  sect_shaolin: {
    v: 3,
    shoulderSocket: { x: 0.2, y: -384.1 },
    gripSocket: { x: 89.6, y: 53.4 },
    designHeight: WARRIOR.designHeight, // 少林派

  },
  sect_wudang: {
    v: 3,
    shoulderSocket: { x: 25.1, y: -378.3 },
    gripSocket: { x: 86.7, y: 72.8 },
    designHeight: WARRIOR.designHeight, // 武當派（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_tangmen: {
    v: 3,
    shoulderSocket: { x: 52.8, y: -373.8 },
    gripSocket: { x: 29.8, y: 67.2 },
    designHeight: WARRIOR.designHeight, // 唐門（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_mojiao: {
    v: 3,
    shoulderSocket: { x: 50.7, y: -367.3 },
    gripSocket: { x: 73.2, y: 27.4 },
    designHeight: WARRIOR.designHeight, // 魔教（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_huashan: {
    v: 3,
    shoulderSocket: { x: 34.1, y: -401.8 },
    gripSocket: { x: 93.3, y: 42.9 },
    designHeight: WARRIOR.designHeight, // 華山（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
  sect_taohua: {
    v: 3,
    shoulderSocket: { x: 3.8, y: -365.4 },
    gripSocket: { x: 63.7, y: 96.4 },
    designHeight: WARRIOR.designHeight, // 桃花島

  },
  sect_wugen: {
    v: 3,
    shoulderSocket: { x: 23.8, y: -363.2 },
    gripSocket: { x: 97.2, y: 25.7 },
    designHeight: WARRIOR.designHeight, // 無根門（霧接臂，蓄勢收細）
    attackClip: V3_ATTACK_SOFT,
  },
};

/** 按門派揀俠客骨架；冇門派／未知門派用默認骨架 */
export function rigForSect(sectId: string | null | undefined): AnyWarriorRig {
  return (sectId && SECT_RIGS_V3[sectId]) || WARRIOR;
}

/** 敵影：單圖，腳底錨點，雙眼位置（紅眼脈動） */
export const ENEMY_SHADOW: EnemyDef = {
  part: { src: `${SPAR_BASE}sil/enemy-shadow.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  eyes: [
    { x: -18, y: -520 },
    { x: 22, y: -520 },
  ],
};

/** 敵人圖鑑組裝：腳底錨點＝圖中底部中央，eye 係紅瞳殺氣位置（相對錨點） */
const SPAR_E = (n: string, w: number, h: number, eye: { x: number; y: number }, scale = 1): EnemyDef => ({
  part: { src: `${SPAR_BASE}sil/enemy-${n}.webp`, w, h, dx: -w / 2, dy: -h },
  eyes: [eye],
  scale,
});

/**
 * 江湖敵手（AI 水墨剪影，側身面左行向俠客）＋墨影，組成出敵池。
 * 老翁／槍客／丐幫／蓑衣嘅剪影檔四周有墨霧雜點，暫時移出池；
 * 新圖（design/art/SILHOUETTE-PROMPTS.md B 表）到咗再加返。
 */
export const ENEMY_POOL: EnemyDef[] = [
  ENEMY_SHADOW,
  SPAR_E('daoke', 616, 788, { x: -20, y: -520 }), // 黑衣刀客（AI 剪影）
  SPAR_E('nvcike', 616, 788, { x: -16, y: -530 }, 0.96), // 女刺客
  SPAR_E('toutuo', 616, 788, { x: -10, y: -510 }, 1.08), // 胖頭陀
  SPAR_E('tiemian', 615, 788, { x: -12, y: -520 }, 1.1), // 鐵面／影魁
  SPAR_E('gouke', 616, 788, { x: -20, y: -520 }), // 雙鉤客（刀客剪影）
  SPAR_E('chifa', 616, 788, { x: -10, y: -510 }, 1.15), // 赤髮（頭陀剪影）
];

export const FX_SPLASH_SRC = `${SPAR_BASE}fx-splash.webp`;

/**
 * 場景背景註冊表：通用水墨底圖，畫喺打鬥後面。
 * 日後換場景（市集／山門／雪原）就係加一條 key，再喺組件按 location 揀用，
 * 引擎 setBackground 會自動淡入淡出過場。
 */
export const SPAR_BACKGROUNDS: Record<string, { src: string; opacity?: number }> = {
  /** 通用：霧嶺空谷（淡墨遠山，下半留白做戰鬥地面） */
  valley: { src: `${SPAR_BASE}bg-valley.webp` },
  /** 鎮居：千燈鎮水鄉長卷（即主畫面地圖 banner 同一幅，舞台 cover 貼底，水面留白做地面；調淡令角色突出） */
  town: {
    src: `${import.meta.env.BASE_URL || '/'}ink/ai/backdrops/backdrop-town-scroll.webp`,
    opacity: 0.52,
  },
};

export const SPAR_DEFAULT_BACKGROUND = 'valley';

/**
 * 七款武器貼圖（原圖全部 768px 高、垂直、柄上鋒下、透明底）。
 * key 對應 data/equipment/catalog.ts 嘅 WeaponKind；冇裝備武器就空手唔畫。
 */
export const WEAPON_SPRITES: Record<string, WeaponSpriteDef> = {
  sword: {
    src: `${SPAR_BASE}weapon-sword.webp`, w: 131, h: 768,
    grip: { x: 66, y: 70 }, tip: { x: 66, y: 750 },
    lengthRatio: 0.55, reach: 265, restRot: 10,
  },
  blade: {
    src: `${SPAR_BASE}weapon-blade.webp`, w: 117, h: 768,
    grip: { x: 58, y: 75 }, tip: { x: 58, y: 735 },
    lengthRatio: 0.58, reach: 275, restRot: 10,
  },
  spear: {
    src: `${SPAR_BASE}weapon-spear.webp`, w: 107, h: 768,
    grip: { x: 53, y: 290 }, tip: { x: 53, y: 752 },
    lengthRatio: 0.88, reach: 365, restRot: 6,
  },
  staff: {
    src: `${SPAR_BASE}weapon-staff.webp`, w: 31, h: 768,
    grip: { x: 15, y: 346 }, tip: { x: 15, y: 752 },
    lengthRatio: 0.88, reach: 345, restRot: 6,
  },
  whip: {
    src: `${SPAR_BASE}weapon-whip.webp`, w: 66, h: 768,
    grip: { x: 33, y: 50 }, tip: { x: 33, y: 748 },
    lengthRatio: 0.66, reach: 385, restRot: 14,
  },
  bow: {
    src: `${SPAR_BASE}weapon-bow.webp`, w: 105, h: 768,
    grip: { x: 52, y: 350 }, tip: { x: 52, y: 745 },
    lengthRatio: 0.66, reach: 300, restRot: 8,
  },
  hidden: {
    src: `${SPAR_BASE}weapon-hidden.webp`, w: 524, h: 768,
    grip: { x: 262, y: 60 }, tip: { x: 262, y: 730 },
    lengthRatio: 0.34, reach: 245, restRot: 12,
  },
};

/* ================= 動作 clip（純黑影專用：誇張剪影可讀性） ================= */

/**
 * 閒立：明顯呼吸起伏＋持械臂／兵器相位錯開，斗笠微擺。
 * 剪影場要「郁得到」，唔好似紙板企定。
 */
const IDLE: SparClip = {
  name: 'idle',
  dur: 2.8,
  loop: true,
  tracks: [
    { bone: 'body', prop: 'sy', keys: [ { t: 0, v: 1 }, { t: 1.4, v: 1.028 }, { t: 2.8, v: 1 } ] },
    { bone: 'body', prop: 'y', keys: [ { t: 0, v: 0 }, { t: 1.4, v: -7 }, { t: 2.8, v: 0 } ] },
    { bone: 'body', prop: 'rot', keys: [ { t: 0, v: 0 }, { t: 0.9, v: -1.6 }, { t: 2.0, v: 1.4 }, { t: 2.8, v: 0 } ] },
    { bone: 'head', prop: 'rot', keys: [ { t: 0, v: 0 }, { t: 0.8, v: 3.2 }, { t: 1.8, v: -2.6 }, { t: 2.8, v: 0 } ] },
    { bone: 'arm', prop: 'rot', keys: [ { t: 0, v: -8 }, { t: 1.4, v: 6 }, { t: 2.8, v: -8 } ] },
    { bone: 'weapon', prop: 'rot', keys: [ { t: 0, v: 4 }, { t: 1.4, v: -8 }, { t: 2.8, v: 4 } ] },
  ],
};

/**
 * 揮擊（剪影可讀版，0.72s）：
 * 蓄勢大後引（臂 -130°）→ 爆發踏步前撲 → 定格 → 收招。
 * 武器 follow-through 刻意滯後，令斬弧喺剪影入面清楚。
 */
const ATTACK: SparClip = {
  name: 'attack',
  dur: 0.72,
  tracks: [
    {
      bone: 'arm', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -130, e: 'expoin' },
        { t: 0.36, v: 38, e: 'linear' },
        { t: 0.48, v: 32, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'weapon', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'inout' },
        { t: 0.2, v: 22, e: 'in' },
        { t: 0.3, v: 10, e: 'expoin' },
        { t: 0.38, v: 48, e: 'out' },
        { t: 0.52, v: 28, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -8, e: 'expoin' },
        { t: 0.36, v: 10, e: 'linear' },
        { t: 0.5, v: 8, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'x',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -18, e: 'expoin' },
        { t: 0.36, v: 92, e: 'linear' },
        { t: 0.52, v: 86, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'y',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: 12, e: 'expoin' },
        { t: 0.36, v: -8, e: 'linear' },
        { t: 0.5, v: -2, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'body', prop: 'sy',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -0.04, e: 'expoin' },
        { t: 0.36, v: 0.05, e: 'linear' },
        { t: 0.72, v: 0 },
      ],
    },
    {
      bone: 'head', prop: 'rot',
      keys: [
        { t: 0, v: 0, e: 'out' },
        { t: 0.22, v: -6, e: 'expoin' },
        { t: 0.36, v: 8, e: 'inout' },
        { t: 0.72, v: 0 },
      ],
    },
  ],
  events: [{ t: 0.36, id: 'strike' }],
};

/** 敵影潰散：飛退＋翻仰＋壓扁，剪影碎散感 */
const ENEMY_DEATH: SparClip = {
  name: 'enemy-death',
  dur: 0.62,
  tracks: [
    { bone: 'enemy', prop: 'alpha', keys: [ { t: 0, v: 1, e: 'linear' }, { t: 0.12, v: 1, e: 'in' }, { t: 0.62, v: 0 } ] },
    { bone: 'enemy', prop: 'x', keys: [ { t: 0, v: 0, e: 'in' }, { t: 0.62, v: 36 } ] },
    { bone: 'enemy', prop: 'y', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.18, v: -28, e: 'in' }, { t: 0.62, v: 58 } ] },
    { bone: 'enemy', prop: 'rot', keys: [ { t: 0, v: 0, e: 'in' }, { t: 0.62, v: 28 } ] },
    { bone: 'enemy', prop: 'sy', keys: [ { t: 0, v: 0, e: 'in' }, { t: 0.2, v: 0.08, e: 'in' }, { t: 0.62, v: -0.35 } ] },
  ],
};

/** 新敵影由地影抽高凝聚 */
const ENEMY_SPAWN: SparClip = {
  name: 'enemy-spawn',
  dur: 0.5,
  tracks: [
    { bone: 'enemy', prop: 'alpha', keys: [ { t: 0, v: 0, e: 'out' }, { t: 0.5, v: 1 } ] },
    { bone: 'enemy', prop: 'sy', keys: [ { t: 0, v: -0.55, e: 'out' }, { t: 0.5, v: 0 } ] },
    { bone: 'enemy', prop: 'y', keys: [ { t: 0, v: 36, e: 'out' }, { t: 0.5, v: 0 } ] },
  ],
};

export const SPAR_CLIPS: Record<string, SparClip> = {
  idle: IDLE,
  attack: ATTACK,
  'enemy-death': ENEMY_DEATH,
  'enemy-spawn': ENEMY_SPAWN,
};
