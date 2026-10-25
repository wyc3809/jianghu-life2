/** 第44項玩家逐項確認的規則；個別配平值仍以實際原型驗收為準。 */
export const MANUAL_STAR_PAGE_COSTS = [100, 200, 300] as const;
export const NATURAL_QI_REGEN_RATIO = 0.01;
export const MEDITATE_QI_RATIO = 0.3;
export const BOSS_CONTROL_RESISTANCE = 0.3;
export const DAILY_TASK_JADE = 60;
export const DAILY_TASK_LIMIT = 3;
export const GUIDE_STEP_JADE = 30;
export const GUIDE_MAJOR_JADE = 120;
export const ONLINE_ATTACK_WIN_JADE = 120;
export const ONLINE_DEFEND_WIN_JADE = 60;
export const ONLINE_DAILY_WIN_LIMIT = 3;
export const HUASHAN_ROUND_JADE = [180, 240, 360] as const;
export const BREAKTHROUGH_FIRST_JADE = 120;
export const BREAKTHROUGH_JADE_STEP = 60;
/** 全池加權抽選；同段位權重為候選測試值，保留跨段機會。 */
export const SAME_RANK_MATCH_WEIGHT = 4;
/** 演武完整特效的護體基準，供破防／削防實際參與；候選配平值。 */
export const SPAR_FOE_DEFENSE = { minion: 4, elite: 12, boss: 20 } as const;
/** 少數頂級內功回內用百分比；其餘沿用各門固定回內數值。候選配平值。 */
export const INTERNAL_PERCENT_REGEN: Readonly<Record<string, number>> = {
  pr_void_breath: 0.04,
};
/** 舊帳戶已領成就／家族里程碑可證明的最低境界，首次遷移不補發。 */
export const LEGACY_TIER_RECEIPTS: Readonly<Record<string, number>> = {
  ach_tier_small_cycle: 3, ach_tier_rendu: 6, ach_tier_xiantian: 9,
  ach_tier_tianren: 12, ach_tier_god: 14, fm_tier6: 5, fm_tier11: 10,
};
/** 事件對手候選：普通保留短戰鬥，強敵／首領用連段及拆招建立壓力。 */
export const EVENT_FOE_HP_MULT = { weak: 1, normal: 1, strong: 1.35, boss: 1.8 } as const;
export const EVENT_FOE_CHAIN = {
  weak: { start: 1, tierStep: 99, cap: 1 }, normal: { start: 1, tierStep: 4, cap: 2 },
  strong: { start: 2, tierStep: 6, cap: 3 }, boss: { start: 2, tierStep: 4, cap: 4 },
} as const;
export const EVENT_FOE_CONTROL_CHANCE = 0.12;
export const EVENT_FOE_BLIND = 0.1;
export const EVENT_FOE_DEFENSE_BREAK = 2;
export const EVENT_FOE_ATK_MULT = { weak: 1, normal: 1, strong: 1.1, boss: 1.3 } as const;
/** 日常有效修煉候選；整裝、飲酒及失敗操作不計。 */
export const DAILY_TRAINING_ACTIONS: readonly string[] = ['train_martial','train_internal','temper_body','sect_ask_elder','sect_guard','sect_meditate'];
