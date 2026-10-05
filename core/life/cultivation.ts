import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { getSkillDef } from '@data/skills/catalog';
import { gearTotals, raiseBaseMaxHp, raiseBaseMaxQi } from './equipment';
import { gainJianghuPrestige } from './jianghuPrestige';
import { headProgressFactor } from './injuryMath';
import { pushChronicle } from './chronicle';
import {
  JADE_PER_BREAKTHROUGH_BASE,
  JADE_PER_BREAKTHROUGH_TIER,
  TEST_CULTIVATION_RESERVE_RATIO,
} from '@data/redesign/testParams';
import { addJadePending } from './jadePending';

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

/**
 * 境界階梯（15 境）：每境門檻約 ×1.8（放置遊戲常見嘅指數式門檻）；已至頂境冇上限。
 * 等待有封頂：見 MAX_TIER_FILL_SECONDS——速率再慢，儲滿任何一境都唔使超過 24 小時。
 */
export const CULTIVATION_TIERS: readonly CultivationTier[] = [
  { level: 0, name: '引氣入體', cap: 600 },
  { level: 1, name: '內息初成', cap: 1100 },
  { level: 2, name: '氣貫周天', cap: 2000 },
  { level: 3, name: '小周天', cap: 3600 },
  { level: 4, name: '大周天', cap: 6500 },
  { level: 5, name: '融匯貫通', cap: 11700 },
  { level: 6, name: '打通任督', cap: 21000 },
  { level: 7, name: '脫胎換骨', cap: 38000 },
  { level: 8, name: '洗髓伐毛', cap: 68000 },
  { level: 9, name: '先天之境', cap: 122000 },
  { level: 10, name: '返璞歸真', cap: 220000 },
  { level: 11, name: '化境', cap: 396000 },
  { level: 12, name: '天人合一', cap: 713000 },
  { level: 13, name: '破碎虛空', cap: 1284000 },
  { level: 14, name: '武道通神', cap: Number.POSITIVE_INFINITY },
];

/** 舊 7 境存檔 → 新 15 境（同名境界對返原位） */
export const LEGACY_TIER_MAP: readonly number[] = [0, 1, 2, 5, 7, 10, 12];

/** 等待封頂：任何一境由零儲滿，最多 24 小時現實時間（速率太慢會自動補底） */
export const MAX_TIER_FILL_SECONDS = 24 * 60 * 60;

/** 呢一境嘅保底速率：cap / 24 小時；頂境冇 cap 就冇保底 */
export function tierFloorRate(tier: CultivationTier): number {
  return Number.isFinite(tier.cap) ? tier.cap / MAX_TIER_FILL_SECONDS : 0;
}

/** 實際累積速率＝max(功法計出嚟嘅速率, 保底速率) */
export function effectiveCultivationRate(state: LifeGameState): number {
  return Math.max(calculateCultivationRate(state).total, tierFloorRate(currentCultivationTier(state)));
}

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
  // 頭部傷：修煉速率按比例扣
  const total = (preSectSubtotal + fromSect + fromGear) * headProgressFactor(c);
  return { base, fromMartial, fromSkills, fromSect, fromGear, total };
}

/** 離線收益上限：最多計 48 小時（玩家確認，見 design/agreed-design-2026-10.md §4） */
export const OFFLINE_CULTIVATION_CAP_MS = 48 * 60 * 60 * 1000;

/** 修為儲備上限（境界滿咗之後多出嘅修為暫存）；比例屬測試參數 */
export function cultivationReserveCap(state: LifeGameState): number {
  const tier = currentCultivationTier(state);
  return Number.isFinite(tier.cap) ? Math.floor(tier.cap * TEST_CULTIVATION_RESERVE_RATIO) : 0;
}

/** 現有儲備（舊存檔冇呢欄＝0） */
export function cultivationReserve(state: LifeGameState): number {
  return Math.max(0, state.character.cultivation.reserve ?? 0);
}

export interface CultivationGain {
  /** 入咗境界進度嘅修為 */
  toXp: number;
  /** 入咗儲備嘅修為 */
  toReserve: number;
  /** 儲備都滿咗、流走嘅修為 */
  lost: number;
}

/**
 * 所有修為入賬嘅唯一入口：先填境界進度，滿咗入儲備（有上限），再多就流走。
 * 純算術，唔碰 RNG。
 */
export function addCultivationXp(state: LifeGameState, gain: number): CultivationGain {
  const out: CultivationGain = { toXp: 0, toReserve: 0, lost: 0 };
  if (!(gain > 0)) return out;
  const cult = state.character.cultivation;
  const tier = currentCultivationTier(state);
  if (!Number.isFinite(tier.cap)) {
    cult.xp += gain;
    out.toXp = gain;
    return out;
  }
  const room = Math.max(0, tier.cap - cult.xp);
  out.toXp = Math.min(room, gain);
  cult.xp += out.toXp;
  const rest = gain - out.toXp;
  if (rest > 0) {
    const reserve = cultivationReserve(state);
    const reserveRoom = Math.max(0, cultivationReserveCap(state) - reserve);
    out.toReserve = Math.min(reserveRoom, rest);
    out.lost = rest - out.toReserve;
    if (out.toReserve > 0) cult.reserve = reserve + out.toReserve;
  }
  return out;
}

/**
 * 突破成功後釋放儲備：撥入新境界（以新境界上限為頂），撥唔晒嘅留喺儲備，
 * 再按新境界嘅儲備上限截。回傳撥入咗幾多。
 */
export function releaseCultivationReserve(state: LifeGameState): number {
  const cult = state.character.cultivation;
  const reserve = cultivationReserve(state);
  if (reserve <= 0) {
    if (cult.reserve !== undefined) cult.reserve = 0;
    return 0;
  }
  cult.reserve = 0;
  const g = addCultivationXp(state, reserve);
  return g.toXp;
}

/** 實時累積一段時間；境界滿咗入儲備，儲備滿咗先停。純算術唔碰 RNG */
export function tickCultivation(state: LifeGameState, deltaSeconds: number): number {
  if (deltaSeconds <= 0) return 0;
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const g = addCultivationXp(state, effectiveCultivationRate(state) * deltaSeconds);
  return g.toXp + g.toReserve;
}

export interface OfflineCultivationResult {
  /** 實際入帳修為（境界進度＋儲備） */
  gainedXp: number;
  /** 其中入咗儲備嘅部份 */
  reserveGained: number;
  /** 計入嘅離線秒數（已扣 48 小時上限） */
  countedSeconds: number;
  /** 離線時間是否超過 48 小時而被截斷 */
  timeCapped: boolean;
  /** 境界已滿（多出嘅入咗儲備或流走） */
  tierCapped: boolean;
  /** 儲備都滿咗，有修為流走 */
  reserveCapped: boolean;
}

/**
 * 離線收益：deterministic 純函數——同一 state（速率）+ 同一 elapsedMs，
 * 結果必定一樣，唔涉及 RNG。呼叫方（store）負責讀存檔時間戳算 elapsedMs。
 * 離線唔會老（年齡只跟手動過月）。
 */
export function applyOfflineCultivation(state: LifeGameState, elapsedMs: number): OfflineCultivationResult {
  const clampedMs = Math.max(0, Math.min(OFFLINE_CULTIVATION_CAP_MS, elapsedMs));
  const timeCapped = elapsedMs > OFFLINE_CULTIVATION_CAP_MS;
  if (!state.character.alive || state.phase !== 'playing' || clampedMs <= 0) {
    return { gainedXp: 0, reserveGained: 0, countedSeconds: 0, timeCapped, tierCapped: false, reserveCapped: false };
  }
  const seconds = clampedMs / 1000;
  const g = addCultivationXp(state, effectiveCultivationRate(state) * seconds);
  return {
    gainedXp: g.toXp + g.toReserve,
    reserveGained: g.toReserve,
    countedSeconds: seconds,
    timeCapped,
    tierCapped: g.toReserve > 0 || g.lost > 0,
    reserveCapped: g.lost > 0,
  };
}

/** 切磋演武：主畫面俠客每擊中敵影一次嘅修為回饋。固定 +1（deterministic，唔碰 RNG） */
export function grantSparCultivation(state: LifeGameState): number {
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const g = addCultivationXp(state, 1);
  return g.toXp + g.toReserve;
}

/** 每次事件了結（唔問成敗）隨手加嘅一筆修為，做「事件回饋感」；細過 idle 速率，唔會蓋過原有曲線 */
export function grantEventCultivation(state: LifeGameState): number {
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const g = addCultivationXp(state, getRng().nextInt(2, 6));
  return g.toXp + g.toReserve;
}

const BREAKTHROUGH_BASE_CHANCE = 0.66;
/** 境界越高，突破越難：每境 −3.5%，後期（第 12–13 境）未計屬性約 20%，計埋根骨悟性約 25–35% */
const BREAKTHROUGH_TIER_PENALTY = 0.035;
/** 根骨／悟性合計每點加成 */
const BREAKTHROUGH_ATTR_BONUS = 0.003;

/** 突破成功率（0.15–0.92）：境界越高越難，根骨＋悟性加成。純函數，畀介面事先顯示 */
export function breakthroughChance(state: LifeGameState): number {
  const c = state.character;
  const tier = currentCultivationTier(state);
  const attrBonus = (c.attributes.genGu + c.attributes.wuXing) * BREAKTHROUGH_ATTR_BONUS;
  return Math.max(0.15, Math.min(0.92, BREAKTHROUGH_BASE_CHANCE - tier.level * BREAKTHROUGH_TIER_PENALTY + attrBonus));
}

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
  /** 成功後新境界 level（高光時刻品階用） */
  newTierLevel?: number;
  martialGain?: number;
  hpGain?: number;
  qiGain?: number;
  prestigeGain?: number;
  hpLoss?: number;
  qiLoss?: number;
  setback?: number;
  /** 突破成功時由儲備撥入新境界嘅修為 */
  reserveReleased?: number;
  /** 今次嘅成功率（失敗提示用） */
  chance?: number;
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

  const chance = breakthroughChance(state);
  const success = rng.chance(chance);
  const lines: string[] = [];

  if (success && nextTier) {
    c.cultivation.tier = nextTier.level;
    c.cultivation.xp = 0;
    const reserveReleased = releaseCultivationReserve(state);
    addJadePending(state, JADE_PER_BREAKTHROUGH_BASE + JADE_PER_BREAKTHROUGH_TIER * nextTier.level);
    const martialGain = 6 + nextTier.level * 2;
    c.martial += martialGain;
    const hpGain = 16 + nextTier.level * 5;
    const qiGain = 20 + nextTier.level * 6;
    raiseBaseMaxHp(c, hpGain);
    raiseBaseMaxQi(c, qiGain);
    lines.push(
      `你於千鈞一髮之際，忽覺丹田一暖——「打通任督二脈」！`,
      `自此踏入「${nextTier.name}」之境，武學＋${martialGain}，氣血上限、內力上限同步提升。`,
    );
    if (reserveReleased > 0) {
      lines.push(`積存嘅修為傾瀉而下，新境界修為＋${Math.floor(reserveReleased).toLocaleString('zh-Hant')}。`);
    }
    const prestigeGain = 50 + nextTier.level * 25;
    lines.push(...gainJianghuPrestige(state, prestigeGain));
    pushChronicle(state, lines);
    snapshotRng(state);
    return {
      success: true,
      lines,
      oldTierName: tier.name,
      newTierName: nextTier.name,
      newTierLevel: nextTier.level,
      martialGain,
      hpGain,
      qiGain,
      prestigeGain,
      reserveReleased,
    };
  }

  // 失敗保留修為（design/agreed-design-2026-10.md §3）；代價只扣氣血、內力，唔落內傷（玩家決定 2026-10-05）
  const hpLoss = Math.round(c.maxHealth * 0.12);
  const qiLoss = Math.round(c.maxQi * 0.18);
  c.health = Math.max(1, c.health - hpLoss);
  c.qi = Math.max(0, c.qi - qiLoss);
  const setback = 0;
  lines.push(
    '閉關數月，行至緊要關頭卻氣息紊亂，未能破關。',
    `修為保留，氣血－${hpLoss}，內力－${qiLoss}。調整配搭可再試（今次成功率約 ${Math.round(chance * 100)}%）。`,
  );
  pushChronicle(state, lines);
  snapshotRng(state);
  return { success: false, lines, oldTierName: tier.name, hpLoss, qiLoss, setback, chance };
}
