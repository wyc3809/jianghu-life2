import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { getSkillDef } from '@data/skills/catalog';
import { gearTotals, raiseBaseMaxHp, raiseBaseMaxQi } from './equipment';
import { gainJianghuPrestige } from './jianghuPrestige';
import { addCondition } from './monthly';
import { pushChronicle } from './chronicle';

/**
 * 放置修為層：功法／內功／門派加成／裝備詞條全部換算做一個「修為/秒」速率，
 * 實時累積、閒置都會郁；到頂要玩家主動突破先可以入下一境。
 */

export interface CultivationTier {
  level: number;
  name: string;
  /** 呢個境界要儲幾多修為先滿（滿咗停低，要突破先可以再升） */
  cap: number;
}

/** 境界階梯：cap 越後越大（放置遊戲常見嘅指數式門檻）；已至頂境冇上限 */
export const CULTIVATION_TIERS: readonly CultivationTier[] = [
  { level: 0, name: '引氣入體', cap: 600 },
  { level: 1, name: '內息初成', cap: 1800 },
  { level: 2, name: '氣貫周天', cap: 4500 },
  { level: 3, name: '融匯貫通', cap: 10000 },
  { level: 4, name: '脫胎換骨', cap: 22000 },
  { level: 5, name: '返璞歸真', cap: 48000 },
  { level: 6, name: '天人合一', cap: Number.POSITIVE_INFINITY },
];

export function currentCultivationTier(state: LifeGameState): CultivationTier {
  const idx = Math.max(
    0,
    Math.min(CULTIVATION_TIERS.length - 1, Math.floor(state.character.cultivation?.tier ?? 0)),
  );
  return CULTIVATION_TIERS[idx]!;
}

export function isMaxCultivationTier(state: LifeGameState): boolean {
  return currentCultivationTier(state).level >= CULTIVATION_TIERS[CULTIVATION_TIERS.length - 1]!.level;
}

/** 修為已達現時境界上限，停止累積，等緊突破 */
export function isCultivationCapped(state: LifeGameState): boolean {
  const tier = currentCultivationTier(state);
  if (!Number.isFinite(tier.cap)) return false;
  return (state.character.cultivation?.xp ?? 0) >= tier.cap;
}

/** 現時境界進度百分比（0–100）；已至頂境冇上限，回傳 100 */
export function cultivationProgressPercent(state: LifeGameState): number {
  const tier = currentCultivationTier(state);
  if (!Number.isFinite(tier.cap)) return 100;
  const xp = state.character.cultivation?.xp ?? 0;
  return Math.max(0, Math.min(100, Math.round((xp / tier.cap) * 100)));
}

export interface CultivationRateBreakdown {
  /** 基礎呼吸吐納，恆定不變 */
  base: number;
  /** 武學根基（角色整體武學值換算） */
  fromMartial: number;
  /** 已學功法（按內功／輕功／外功、階位加成） */
  fromSkills: number;
  /** 門派加成（地位越高，藏書／心法越深） */
  fromSect: number;
  /** 裝備詞條（武學相關加成換算） */
  fromGear: number;
  /** 修為/秒 總速率 */
  total: number;
}

const BASE_RATE_PER_SEC = 0.3;
const MARTIAL_COEF = 0.02;
const SKILL_KIND_WEIGHT: Record<'internal' | 'qinggong' | 'external', number> = {
  internal: 0.55,
  qinggong: 0.32,
  external: 0.22,
};
/** 門派地位每級 +12% 加成（外門0 起計） */
const SECT_STANDING_BONUS_PER_STEP = 0.12;
const GEAR_MARTIAL_COEF = 0.03;

/** 純算術、deterministic：唔碰 RNG，畀 UI tooltip 拆解嚟源用 */
export function calculateCultivationRate(state: LifeGameState): CultivationRateBreakdown {
  const c = state.character;
  const base = BASE_RATE_PER_SEC;
  const fromMartial = c.martial * MARTIAL_COEF;
  const fromSkills = c.skills.reduce((sum, id) => {
    const def = getSkillDef(id);
    const weight = SKILL_KIND_WEIGHT[def?.kind ?? 'external'] ?? SKILL_KIND_WEIGHT.external;
    const rank = c.skillRanks?.[id] ?? 0;
    return sum + weight * (rank + 1);
  }, 0);
  const preSectSubtotal = base + fromMartial + fromSkills;
  const fromSect = c.sectId ? preSectSubtotal * (SECT_STANDING_BONUS_PER_STEP * (c.sectStanding ?? 0)) : 0;
  const fromGear = gearTotals(c).martialBonus * GEAR_MARTIAL_COEF;
  const total = preSectSubtotal + fromSect + fromGear;
  return { base, fromMartial, fromSkills, fromSect, fromGear, total };
}

/** 離線收益上限：最多計 8 小時 */
export const OFFLINE_CULTIVATION_CAP_MS = 8 * 60 * 60 * 1000;

/** 實時累積一段時間；到頂會自動停低（唔會爆錶），純算術唔碰 RNG */
export function tickCultivation(state: LifeGameState, deltaSeconds: number): number {
  if (deltaSeconds <= 0) return 0;
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const tier = currentCultivationTier(state);
  const rate = calculateCultivationRate(state).total;
  const before = state.character.cultivation.xp;
  const rawAfter = before + rate * deltaSeconds;
  const after = Number.isFinite(tier.cap) ? Math.min(tier.cap, rawAfter) : rawAfter;
  state.character.cultivation.xp = after;
  return after - before;
}

export interface OfflineCultivationResult {
  /** 實際入帳修為（已扣減境界上限／時間上限） */
  gainedXp: number;
  /** 計入嘅離線秒數（已扣 8 小時上限） */
  countedSeconds: number;
  /** 離線時間是否超過 8 小時而被截斷 */
  timeCapped: boolean;
  /** 是否因境界已滿而截斷 */
  tierCapped: boolean;
}

/**
 * 離線收益：deterministic 純函數——同一 state（速率）+ 同一 elapsedMs，
 * 結果必定一樣，唔涉及 RNG。呼叫方（store）負責讀存檔時間戳算 elapsedMs。
 */
export function applyOfflineCultivation(state: LifeGameState, elapsedMs: number): OfflineCultivationResult {
  const clampedMs = Math.max(0, Math.min(OFFLINE_CULTIVATION_CAP_MS, elapsedMs));
  const timeCapped = elapsedMs > OFFLINE_CULTIVATION_CAP_MS;
  if (!state.character.alive || state.phase !== 'playing' || clampedMs <= 0) {
    return { gainedXp: 0, countedSeconds: 0, timeCapped, tierCapped: false };
  }
  const seconds = clampedMs / 1000;
  const tier = currentCultivationTier(state);
  const rate = calculateCultivationRate(state).total;
  const before = state.character.cultivation.xp;
  const rawAfter = before + rate * seconds;
  const after = Number.isFinite(tier.cap) ? Math.min(tier.cap, rawAfter) : rawAfter;
  state.character.cultivation.xp = after;
  return {
    gainedXp: after - before,
    countedSeconds: seconds,
    timeCapped,
    tierCapped: after < rawAfter,
  };
}

/** 每次事件了結（唔問成敗）隨手加嘅一筆修為，做「事件回饋感」；細過 idle 速率，唔會蓋過原有曲線 */
export function grantEventCultivation(state: LifeGameState): number {
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const tier = currentCultivationTier(state);
  const gain = getRng().nextInt(2, 6);
  const before = state.character.cultivation.xp;
  const rawAfter = before + gain;
  const after = Number.isFinite(tier.cap) ? Math.min(tier.cap, rawAfter) : rawAfter;
  state.character.cultivation.xp = after;
  return after - before;
}

const BREAKTHROUGH_BASE_CHANCE = 0.62;
/** 境界越高，突破越難 */
const BREAKTHROUGH_TIER_PENALTY = 0.05;
/** 根骨／悟性合計每點加成 */
const BREAKTHROUGH_ATTR_BONUS = 0.003;
/** 失敗回退：現境界上限的 30% */
const BREAKTHROUGH_SETBACK_RATIO = 0.3;

export function canAttemptBreakthrough(state: LifeGameState): boolean {
  if (!state.character.alive || state.phase !== 'playing') return false;
  if (isMaxCultivationTier(state)) return false;
  return isCultivationCapped(state);
}

export interface BreakthroughResult {
  success: boolean;
  lines: string[];
  oldTierName: string;
  /** 成功先有 */
  newTierName?: string;
  martialGain?: number;
  hpLoss?: number;
  qiLoss?: number;
  setback?: number;
}

/**
 * 突破：修為滿咗先可以觸發。成功＝躍境＋大幅實力提升＋敘事爆發感；
 * 失敗＝走火入魔，修為部分倒退＋氣血/內力損傷＋留下內傷，可再修煉重試。
 * 用 seeded RNG（唔用 Math.random()），走 syncRngFromState/snapshotRng 慣例。
 */
export function attemptCultivationBreakthrough(state: LifeGameState): BreakthroughResult {
  const beforeTierName = currentCultivationTier(state).name;
  if (!canAttemptBreakthrough(state)) {
    return { success: false, lines: ['尚未到突破關口，修為未滿。'], oldTierName: beforeTierName };
  }
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const tier = currentCultivationTier(state);
  const nextTier = CULTIVATION_TIERS[tier.level + 1];

  const attrBonus = (c.attributes.genGu + c.attributes.wuXing) * BREAKTHROUGH_ATTR_BONUS;
  const chance = Math.max(
    0.15,
    Math.min(0.92, BREAKTHROUGH_BASE_CHANCE - tier.level * BREAKTHROUGH_TIER_PENALTY + attrBonus),
  );
  const success = rng.chance(chance);
  const lines: string[] = [];

  if (success && nextTier) {
    c.cultivation.tier = nextTier.level;
    c.cultivation.xp = 0;
    const martialGain = 8 + nextTier.level * 4;
    c.martial += martialGain;
    raiseBaseMaxHp(c, 20 + nextTier.level * 8);
    raiseBaseMaxQi(c, 24 + nextTier.level * 10);
    lines.push(
      `你於千鈞一髮之際，忽覺丹田一暖——「打通任督二脈」！`,
      `自此踏入「${nextTier.name}」之境，武學＋${martialGain}，氣血上限、內力上限同步提升。`,
    );
    lines.push(...gainJianghuPrestige(state, 60 + nextTier.level * 40));
    pushChronicle(state, lines);
    snapshotRng(state);
    return {
      success: true,
      lines,
      oldTierName: tier.name,
      newTierName: nextTier.name,
      martialGain,
    };
  }

  const setback = Math.round((Number.isFinite(tier.cap) ? tier.cap : 0) * BREAKTHROUGH_SETBACK_RATIO);
  c.cultivation.xp = Math.max(0, c.cultivation.xp - setback);
  const hpLoss = Math.round(c.maxHealth * 0.12);
  const qiLoss = Math.round(c.maxQi * 0.18);
  c.health = Math.max(1, c.health - hpLoss);
  c.qi = Math.max(0, c.qi - qiLoss);
  addCondition(state, 'internal');
  lines.push(
    '閉關數月，行至緊要關頭卻氣息紊亂——走火入魔！',
    `修為倒退，氣血－${hpLoss}，內力－${qiLoss}，落下內傷，需再修煉方可重闖此關。`,
  );
  pushChronicle(state, lines);
  snapshotRng(state);
  return { success: false, lines, oldTierName: tier.name, hpLoss, qiLoss, setback };
}
