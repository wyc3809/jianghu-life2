/**
 * 首領特性（玩家決定 2026-10-09：每個首領一個特性；同區精英跟首領特性但弱化，視覺上要睇得出）。
 * 數值係測試參數（記錄喺 production/redesign-scope.md 第 20 項），演武台同事件交手共用。
 * 設計：design/gdd/foe-roster.md
 */

import type { CombatTraitId } from '@interfaces/lifeEngine';

export type FoeTraitId = CombatTraitId;
/** 敵人層級：小兵冇特性；精英＝弱化版；首領＝全力版 */
export type FoeTier = 'minion' | 'elite' | 'boss';

export interface FoeTraitPower {
  /**
   * 主數值：
   * guard＝受傷減幾成；charge＝重擊倍率；drain＝傷害幾成回血；
   * combo＝連擊機率；thorns＝反震幾成；enrage＝半血以下攻擊加幾成
   */
  value: number;
  /** charge：每幾擊一次重擊；其他特性唔用 */
  every?: number;
}

export interface FoeTraitDef {
  id: FoeTraitId;
  /** 特性名（名牌、首領登場卡） */
  name: string;
  /** 觸發時彈出嘅單字 */
  glyph: string;
  /** 一句講清楚做咩（首領登場卡、圖鑑） */
  blurb: string;
  /** 特性色（光環、觸發粒子、字）：'r,g,b' */
  rgb: string;
  boss: FoeTraitPower;
  elite: FoeTraitPower;
}

export const FOE_TRAITS: Readonly<Record<FoeTraitId, FoeTraitDef>> = {
  guard: {
    id: 'guard',
    name: '鐵布衫',
    glyph: '卸',
    blurb: '皮粗肉厚，受到嘅傷害減少',
    rgb: '176,122,60',
    boss: { value: 0.3 },
    elite: { value: 0.15 },
  },
  charge: {
    id: 'charge',
    name: '開山蓄力',
    glyph: '蓄',
    blurb: '每隔幾擊蓄滿力，打出一記重擊',
    rgb: '192,57,43',
    boss: { value: 2.2, every: 3 },
    elite: { value: 1.6, every: 4 },
  },
  drain: {
    id: 'drain',
    name: '噬血',
    glyph: '噬',
    blurb: '打中你就吸返血',
    rgb: '142,44,90',
    boss: { value: 0.35 },
    elite: { value: 0.18 },
  },
  combo: {
    id: 'combo',
    name: '分影連擊',
    glyph: '連',
    blurb: '有機會一口氣多打一擊',
    rgb: '63,95,138',
    boss: { value: 0.35 },
    elite: { value: 0.18 },
  },
  thorns: {
    id: 'thorns',
    name: '金剛反震',
    glyph: '震',
    blurb: '打佢會被反震返部分傷害',
    rgb: '212,169,55',
    boss: { value: 0.2 },
    elite: { value: 0.1 },
  },
  enrage: {
    id: 'enrage',
    name: '狂怒',
    glyph: '怒',
    blurb: '血量跌到一半以下，攻擊大增',
    rgb: '122,31,26',
    boss: { value: 0.6 },
    elite: { value: 0.3 },
  },
};

/** 連擊第二擊嘅威力（相對正常一擊） */
export const COMBO_FOLLOWUP_POWER = 0.6;
/** 狂怒觸發線：血量比例 */
export const ENRAGE_HP_RATIO = 0.5;

/** 層級 → 特性強度；小兵冇 */
export function traitPower(trait: FoeTraitId | undefined, tier: FoeTier): FoeTraitPower | null {
  if (!trait || tier === 'minion') return null;
  return FOE_TRAITS[trait][tier];
}
