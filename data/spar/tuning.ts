/**
 * 演武台 v4 可調參數（節奏、頭目、兵器、服色、場景）。
 * 設計文件：design/ux/spar-stage.md
 */
import type { WeaponKind } from '../equipment/catalog';

/** 節奏（秒）：一個小兵約 nextSec + walkSec + windupSec + strikeSec + recoverSec ≈ 2.5 秒 */
export const SPAR_TIMING = {
  nextSec: 0.4,
  walkSec: 1.0,
  windupSec: 0.3,
  strikeSec: 0.2,
  recoverSec: 0.6,
  /** 撳敵人：衝前一步即出手 */
  dashSec: 0.14,
} as const;

export const SPAR_BOSS = {
  /** 每打幾多個小兵出一個頭目 */
  every: 15,
  /** 頭目要幾多擊（最後一擊係大招） */
  hits: 3,
} as const;

/** 舞台構圖（比例） */
export const SPAR_LAYOUT = {
  /** 主角腳底 x（佔闊度） */
  heroX: 0.27,
  /** 敵人出場 x */
  enemyStartX: 0.8,
  /** 地面 y（佔高度） */
  groundY: 0.9,
  /** 主角高度（設計 300 單位）佔舞台高度 */
  heroHeightFrac: 0.46,
  /** 主角高度最多佔舞台闊度（窄屏唔會大到同敵人黐埋） */
  heroWidthFrac: 0.5,
  /** 最細／最大主角像素高（細屏唔會細到睇唔到，大屏唔會大到出格） */
  heroMinPx: 110,
  heroMaxPx: 220,
  /** 視差：遠山、鎮屋、近景相對地面嘅速度 */
  parallax: { far: 0.12, mid: 0.4, near: 1 },
} as const;

/** 主角設計高度（腳底到斗笠頂，設計單位） */
export const HERO_DESIGN_H = 300;

export type SlashStyle = 'arc' | 'heavy' | 'thrust' | 'round' | 'fist' | 'ultimate';

export interface SparWeaponSpec {
  /** 射程（設計單位，腳底到敵人腳底嘅出手距離） */
  reach: number;
  /** 刀光筆觸 */
  slash: SlashStyle;
  /** 刀光大細倍率 */
  slashScale: number;
}

/** 兵器：null＝空手 */
export const SPAR_WEAPONS: Readonly<Record<WeaponKind | 'fist', SparWeaponSpec>> = {
  sword: { reach: 170, slash: 'arc', slashScale: 1 },
  blade: { reach: 165, slash: 'heavy', slashScale: 1.05 },
  spear: { reach: 230, slash: 'thrust', slashScale: 1.1 },
  staff: { reach: 215, slash: 'round', slashScale: 1.1 },
  whip: { reach: 210, slash: 'arc', slashScale: 1.15 },
  bow: { reach: 170, slash: 'thrust', slashScale: 0.9 },
  hidden: { reach: 150, slash: 'fist', slashScale: 1 },
  fist: { reach: 130, slash: 'fist', slashScale: 1 },
};

/** 門派服色（低飽和礦物顏料；袍層灰階 × 呢個色） */
export const SECT_ROBE_COLORS: Readonly<Record<string, string>> = {
  none: '#C9BFAC', // 浪人：本色麻
  sect_wudang: '#86A7A2', // 武當青
  sect_shaolin: '#B08A60', // 少林褐
  sect_emei: '#ECE8DF', // 峨嵋白
  sect_qingyun: '#93B08E', // 青雲竹青
  sect_tiandao: '#A57558', // 天刀赭
  sect_tangmen: '#6E8272', // 唐門墨綠
  sect_mojiao: '#7A5876', // 魔教紫檀
  sect_huashan: '#8697AC', // 華山藍灰
  sect_taohua: '#DDB0AC', // 桃花淡緋
  sect_wugen: '#A29D94', // 無根灰
};

/** 敵人按境界放大（index＝敵人等級 1–6） */
export const ENEMY_SCALE = [1, 1, 1.03, 1.07, 1.1, 1.14, 1.18] as const;
export const BOSS_SCALE = 1.22;

/** 季節飄落物：每秒幾多粒、速度（舞台高度／秒） */
export const SEASON_DROPS = {
  spring: { sprite: 'petal', perSec: 1.6, fall: 0.16, sway: 0.5, size: 0.035 },
  summer: { sprite: 'firefly', perSec: 1.2, fall: -0.02, sway: 0.8, size: 0.04 },
  autumn: { sprite: 'leaf', perSec: 1.2, fall: 0.2, sway: 0.7, size: 0.04 },
  winter: { sprite: 'snow', perSec: 2.6, fall: 0.12, sway: 0.3, size: 0.03 },
} as const;

export type SparSeason = keyof typeof SEASON_DROPS;
export type SparPlace = 'town' | 'river' | 'mountain' | 'hall' | 'wild';

/** 打擊：命中點墨點數、頭目朱砂點數、修為字飛入秒數 */
export const SPAR_FX = {
  inkDots: 14,
  bossCinnabarDots: 10,
  slashSec: 0.32,
  floaterRiseSec: 0.35,
  floaterFlySec: 0.7,
  /** 流血滴墨：每秒幾滴 */
  bleedPerSec: 1.6,
} as const;
