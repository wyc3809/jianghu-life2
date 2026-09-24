/**
 * 部位傷勢調校表（design/gdd/injury-system.md §4、§7；寬鬆機率版）。
 * 核心（core/life/injuries.ts、injuryMath.ts）只讀此表，唔寫死數值。
 */
import type { InjuryPart, InjuryTier } from '@interfaces/lifeEngine';

export const INJURY_PARTS: readonly InjuryPart[] = ['head', 'torso', 'arm', 'leg'];

export const INJURY_PART_LABEL: Readonly<Record<InjuryPart, string>> = {
  head: '頭部',
  torso: '軀幹',
  arm: '手臂',
  leg: '腿腳',
};

export const INJURY_TIER_LABEL: Readonly<Record<InjuryTier, string>> = {
  light: '輕傷',
  heavy: '重傷',
  crippled: '傷殘',
};

/** 部位擲選權重 */
export const PART_WEIGHTS: Readonly<Record<InjuryPart, number>> = { torso: 35, arm: 30, leg: 25, head: 10 };

export const LIGHT_MONTHS = 3;
export const HEAVY_MONTHS = 8;
/** 醫館每次減幾多個月 */
export const HEAL_MONTHS = 2;

/** 戰敗受傷機率 */
export const LOSS_INJURY_CHANCE = 0.6;
/** 戰敗受傷時係重傷嘅機率（按敵強度） */
export const LOSS_HEAVY_CHANCE: Readonly<Record<'weak' | 'normal' | 'strong' | 'boss', number>> = {
  weak: 0.1,
  normal: 0.25,
  strong: 0.5,
  boss: 0.7,
};
/** 險勝（氣血低於此比例）先有機會受傷 */
export const WIN_INJURY_HP_RATIO = 0.3;
export const WIN_INJURY_CHANCE = 0.2;
/** 重傷再重傷 → 傷殘 */
export const CRIPPLE_ON_STACK = 0.2;
/** 首領戰敗且重傷 → 直接傷殘 */
export const BOSS_CRIPPLE_CHANCE = 0.05;
/** 傷殘處再受傷：改扣氣血 */
export const CRIPPLED_REHIT_HP = 8;

/** 各部位按傷級嘅懲罰：[輕, 重, 殘] */
type TierTable = Readonly<Record<InjuryTier, number>>;
/** 頭：修煉／領悟進度倍率扣減 */
export const HEAD_PENALTY: TierTable = { light: 0.1, heavy: 0.25, crippled: 0.4 };
/** 軀幹：氣血上限扣減 */
export const TORSO_PENALTY: TierTable = { light: 0.05, heavy: 0.15, crippled: 0.25 };
/** 手臂：出手（攻擊）扣減 */
export const ARM_PENALTY: TierTable = { light: 0.08, heavy: 0.2, crippled: 0.35 };
/** 腿腳：閃避扣減（絕對值，戰鬥閃避 0–0.45） */
export const LEG_EVASION: TierTable = { light: 0.03, heavy: 0.06, crippled: 0.12 };
/** 腿腳：每月精力扣減 */
export const LEG_STAMINA: TierTable = { light: 4, heavy: 10, crippled: 16 };
