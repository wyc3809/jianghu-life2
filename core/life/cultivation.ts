import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { getSkillDef } from '@data/skills/catalog';
import { gearTotals, raiseBaseMaxHp, raiseBaseMaxQi } from './equipment';
import { headProgressFactor } from './injuryMath';
import { pushChronicle } from './chronicle';
import {
  LEVEL_CAPS,
  LEVEL_FLOOR_MULT,
  LEVEL_TARGET_HOURS,
  MARTIAL_CAP_PER_REALM,
  MARTIAL_CAP_PER_STAGE,
  MARTIAL_OVERFLOW_PAGES_PER_POINT,
  MINOR_BREAKTHROUGH,
  REALM_STAGE_COUNT,
  REALM_STAGE_NAMES,
  STAGED_REALMS,
} from '@data/redesign/cultivationPacing';
import {
  TEST_ACTIVE_CULTIVATION_SECONDS,
  TEST_BREAKTHROUGH_FAIL_XP_LOSS,
  TEST_CULTIVATION_RESERVE_RATIO,
} from '@data/redesign/testParams';

/**
 * 放置修為層：功法／內功／門派加成／裝備詞條全部換算做一個「修為/秒」速率，
 * 實時累積、閒置都會郁；到頂要玩家主動突破先可以入下一境。
 */

export interface CultivationTier {
  level: number;
  name: string;
  /** 呢個境界要儲幾多修為先滿（滿咗停低，要突破先可以再升） */
  cap: number;
  /** 分段境界嘅段數（0 初期…3 圓滿）；唔分段＝0 */
  stage?: number;
  /** 大境界名（唔帶段數） */
  realmName?: string;
  /** 保底：最慢幾多秒儲滿（頂境冇） */
  floorSeconds?: number;
}

const levelKey = (tier: number, stage: number) => `${tier}.${stage}`;

/**
 * 十五個大境界；先天之境至破碎虛空再分初期／中期／後期／圓滿，合共 30 級，已至頂境冇上限。
 * 每級上限同保底時數見 data/redesign/cultivationPacing.ts（2026-11-28 節奏檢視：約 60 日到頂）。
 * 呢度嘅 cap 係該境第一級（初期）嘅上限；實際以 currentCultivationTier() 為準。
 */
const REALM_NAMES = ['引氣入體', '內息初成', '氣貫周天', '小周天', '大周天', '融匯貫通', '打通任督', '脫胎換骨', '洗髓伐毛', '先天之境', '返璞歸真', '化境', '天人合一', '破碎虛空', '武道通神'] as const;
export const CULTIVATION_TIERS: readonly CultivationTier[] = REALM_NAMES.map((name, level) => ({
  level,
  name,
  cap: LEVEL_CAPS[levelKey(level, 0)] ?? Number.POSITIVE_INFINITY,
}));

/** 呢個大境界係咪分段 */
export function isStagedRealm(tier: number): boolean {
  return STAGED_REALMS.includes(tier);
}

/** 某一級（大境界＋段）嘅完整資料 */
export function cultivationLevel(tier: number, stage = 0): CultivationTier {
  const t = Math.max(0, Math.min(CULTIVATION_TIERS.length - 1, Math.floor(tier)));
  const st = isStagedRealm(t) ? Math.max(0, Math.min(REALM_STAGE_COUNT - 1, Math.floor(stage))) : 0;
  const realmName = REALM_NAMES[t]!;
  const key = levelKey(t, st);
  const cap = LEVEL_CAPS[key] ?? Number.POSITIVE_INFINITY;
  const hours = LEVEL_TARGET_HOURS[key];
  return {
    level: t,
    stage: st,
    realmName,
    name: isStagedRealm(t) ? `${realmName}・${REALM_STAGE_NAMES[st]}` : realmName,
    cap,
    floorSeconds: Number.isFinite(cap) && hours ? hours * 3600 * LEVEL_FLOOR_MULT : undefined,
  };
}

/** 下一級（小突破去下一段，或者大突破去下一境）；頂境回傳 null */
export function nextCultivationLevel(state: LifeGameState): CultivationTier | null {
  const cur = currentCultivationTier(state);
  if (cur.level >= CULTIVATION_TIERS.length - 1) return null;
  if (isStagedRealm(cur.level) && (cur.stage ?? 0) < REALM_STAGE_COUNT - 1) return cultivationLevel(cur.level, (cur.stage ?? 0) + 1);
  return cultivationLevel(cur.level + 1, 0);
}

/** 而家係咪小突破（同一境界內升段，必定成功） */
export function isMinorBreakthrough(state: LifeGameState): boolean {
  const cur = currentCultivationTier(state);
  return isStagedRealm(cur.level) && (cur.stage ?? 0) < REALM_STAGE_COUNT - 1;
}

/** 武學值上限：每境 ×（境界＋1）＋每段（2026-11-28 節奏檢視 P5） */
export function martialCap(state: LifeGameState): number {
  const cur = currentCultivationTier(state);
  return MARTIAL_CAP_PER_REALM * (cur.level + 1) + MARTIAL_CAP_PER_STAGE * (cur.stage ?? 0);
}

/**
 * 武學值上限守門：今次增加嘅部分唔可以超過上限；本身已超過（舊存檔）就唔扣，只係唔再加。
 * 各結算出口（事件、每月、交手、修煉、演武熟練、華山）完結時叫一次。
 */
export interface MartialCapResult {
  before: number;
  cap: number;
  /** 被截走、化作書頁嘅武學點數 */
  overflow: number;
  /** 化作嘅書頁（待帳戶結算入帳） */
  pages: number;
}

/** 待入帳嘅武學溢出書頁（帳戶結算時轉入秘笈書頁） */
export const MARTIAL_OVERFLOW_PAGES_FLAG = 'martial_overflow_pages';

/**
 * 守武學上限：只截走今次新增而超出上限嘅部分，截走嘅每點化作書頁（排隊等帳戶結算）。
 * before＝今次操作前嘅武學值；舊存檔已超上限唔扣。
 */
export function enforceMartialCap(state: LifeGameState, before: number): MartialCapResult {
  const c = state.character;
  const cap = martialCap(state);
  let overflow = 0;
  if (c.martial > before && c.martial > cap) {
    const kept = Math.max(before, cap);
    overflow = c.martial - kept;
    c.martial = kept;
  }
  const pages = overflow * MARTIAL_OVERFLOW_PAGES_PER_POINT;
  if (pages > 0) c.flags[MARTIAL_OVERFLOW_PAGES_FLAG] = Number(c.flags[MARTIAL_OVERFLOW_PAGES_FLAG] ?? 0) + pages;
  return { before, cap, overflow, pages };
}

/** 讀走待入帳書頁（帳戶結算用） */
export function takeMartialOverflowPages(state: LifeGameState): number {
  const n = Number(state.character.flags[MARTIAL_OVERFLOW_PAGES_FLAG] ?? 0);
  delete state.character.flags[MARTIAL_OVERFLOW_PAGES_FLAG];
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
}

/**
 * 截上限後改寫結果文字：逐個「武學＋N」按剩餘空位拆成「武學＋實得」同「書頁＋M」，
 * 免得提示話加咗武學但實際冇加。冇溢出就原樣返回。
 */
export function rewriteMartialGainText(lines: string[], r: MartialCapResult): string[] {
  if (r.overflow <= 0) return lines;
  let room = Math.max(0, r.cap - r.before);
  return lines.map((line) => line.replace(/武學[＋+](\d+)/g, (_m, n: string) => {
    const k = Number(n);
    const take = Math.min(k, room);
    room -= take;
    const pages = (k - take) * MARTIAL_OVERFLOW_PAGES_PER_POINT;
    if (pages <= 0) return `武學＋${take}`;
    return take > 0 ? `武學＋${take}（已達上限），書頁＋${pages}` : `武學已達上限，化作書頁＋${pages}`;
  }));
}

/** 舊 7 境存檔 → 新 15 境（同名境界對返原位） */
export const LEGACY_TIER_MAP: readonly number[] = [0, 1, 2, 5, 7, 10, 12];

/** 舊名保留：入門一級嘅保底秒數；各級實際保底見 CultivationTier.floorSeconds */
export const MAX_TIER_FILL_SECONDS = 24 * 60 * 60;

/** 呢一級嘅保底速率：cap ／ 保底秒數；頂境冇 cap 就冇保底 */
export function tierFloorRate(tier: CultivationTier): number {
  return Number.isFinite(tier.cap) ? tier.cap / (tier.floorSeconds ?? MAX_TIER_FILL_SECONDS) : 0;
}

/** 實際累積速率＝max(功法計出嚟嘅速率, 保底速率) */
export function effectiveCultivationRate(state: LifeGameState): number {
  return Math.max(calculateCultivationRate(state).total, tierFloorRate(currentCultivationTier(state)));
}

/** 現時所在一級（level＝大境界；分段境界帶 stage，name 會寫「先天之境・中期」） */
export function currentCultivationTier(state: LifeGameState): CultivationTier {
  return cultivationLevel(state.character.cultivation?.tier ?? 0, state.character.cultivation?.stage ?? 0);
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
const MARTIAL_COEF = 0.016;
const SKILL_KIND_WEIGHT: Record<'internal' | 'qinggong' | 'external', number> = {
  internal: 0.47,
  qinggong: 0.27,
  external: 0.19,
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
 * 離線只結算修為；角色不設年齡與自然老死。
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

/** 主動玩法折算嘅修為：當刻掛機速率 × 秒數（純算術，唔碰 RNG） */
export function activeCultivationGain(state: LifeGameState, seconds: number): number {
  return Math.round(effectiveCultivationRate(state) * Math.max(0, seconds));
}

/** 主動玩法入帳（演武過關、江湖勝仗等）；返回實際入咗幾多（境界進度＋儲備） */
export function grantActiveCultivation(state: LifeGameState, seconds: number): number {
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const g = addCultivationXp(state, activeCultivationGain(state, seconds));
  return g.toXp + g.toReserve;
}

/**
 * 每次事件了結（唔問成敗）嘅修為：舊有 2–6 點＋掛機速率 × eventResolve 秒。
 * 舊隨機數照抽一次，保持人生事件 RNG 序列唔變。
 */
export function grantEventCultivation(state: LifeGameState): number {
  if (!state.character.alive || state.phase !== 'playing') return 0;
  const legacy = getRng().nextInt(2, 6);
  const g = addCultivationXp(state, legacy + activeCultivationGain(state, TEST_ACTIVE_CULTIVATION_SECONDS.eventResolve));
  return g.toXp + g.toReserve;
}

const BREAKTHROUGH_BASE_CHANCE = 0.66;
/** 境界越高，突破越難：每境基本減 3.5 個百分點 */
const BREAKTHROUGH_TIER_PENALTY = 0.035;
/** 大周天起，每境額外降低一個百分點，入門突破沿用原本成功率。 */
const BREAKTHROUGH_ADVANCED_PENALTY = 0.01;
/** 根骨／悟性合計每點加成 */
const BREAKTHROUGH_ATTR_BONUS = 0.003;

/** 突破成功率（0.15–0.92）：境界越高越難，根骨＋悟性加成。純函數，畀介面事先顯示 */
export function breakthroughChance(state: LifeGameState): number {
  const c = state.character;
  const tier = currentCultivationTier(state);
  const attrBonus = (c.attributes.genGu + c.attributes.wuXing) * BREAKTHROUGH_ATTR_BONUS;
  const tierPenalty = tier.level * BREAKTHROUGH_TIER_PENALTY
    + Math.max(0, tier.level - 3) * BREAKTHROUGH_ADVANCED_PENALTY;
  return Math.max(0.15, Math.min(0.92, BREAKTHROUGH_BASE_CHANCE - tierPenalty + attrBonus));
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
  /** 帳戶結算成功後實際入帳的突破玉石。 */
  jadeGain?: number;
  hpLoss?: number;
  qiLoss?: number;
  /** 失敗扣走嘅修為（要儲返滿先可以再試） */
  setback?: number;
  /** 突破成功時由儲備撥入新境界嘅修為 */
  reserveReleased?: number;
  /** 今次嘅成功率（失敗提示用） */
  chance?: number;
  /** 小突破（同境界內升段） */
  minor?: boolean;
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
  const c = state.character;
  const tier = currentCultivationTier(state);
  // 小突破：同一境界內升段，必定成功，唔推 RNG（2026-11-28 節奏檢視）
  if (isMinorBreakthrough(state)) {
    const next = cultivationLevel(tier.level, (tier.stage ?? 0) + 1);
    c.cultivation.stage = next.stage;
    c.cultivation.xp = 0;
    const reserveReleased = releaseCultivationReserve(state);
    c.martial += MINOR_BREAKTHROUGH.martial;
    raiseBaseMaxHp(c, MINOR_BREAKTHROUGH.hp);
    raiseBaseMaxQi(c, MINOR_BREAKTHROUGH.qi);
    const lines = [`內息再進一層，踏入「${next.name}」，武學＋${MINOR_BREAKTHROUGH.martial}，氣血、內力上限略增。`];
    if (reserveReleased > 0) lines.push(`儲備修為已轉入，修為＋${Math.floor(reserveReleased).toLocaleString('zh-Hant')}。`);
    pushChronicle(state, lines);
    return { success: true, lines, oldTierName: tier.name, newTierName: next.name, newTierLevel: next.level, martialGain: MINOR_BREAKTHROUGH.martial, hpGain: MINOR_BREAKTHROUGH.hp, qiGain: MINOR_BREAKTHROUGH.qi, prestigeGain: 0, reserveReleased, minor: true };
  }
  syncRngFromState(state);
  const rng = getRng();
  const nextTier = CULTIVATION_TIERS[tier.level + 1];

  const chance = breakthroughChance(state);
  const success = rng.chance(chance);
  const lines: string[] = [];

  if (success && nextTier) {
    c.cultivation.tier = nextTier.level;
    c.cultivation.stage = 0;
    c.cultivation.xp = 0;
    const reserveReleased = releaseCultivationReserve(state);
    // 免費玉石由帳戶最高境界收據一次結算，唔再沿用逐代待入帳。
    const martialGain = 6 + nextTier.level * 2;
    c.martial += martialGain;
    const hpGain = 16 + nextTier.level * 5;
    const qiGain = 20 + nextTier.level * 6;
    raiseBaseMaxHp(c, hpGain);
    raiseBaseMaxQi(c, qiGain);
    const entered = cultivationLevel(nextTier.level, 0);
    lines.push(
      `你於千鈞一髮之際，忽覺丹田一暖——「打通任督二脈」！`,
      `自此踏入「${entered.name}」之境，武學＋${martialGain}，氣血上限、內力上限同步提升。`,
    );
    if (reserveReleased > 0) {
      lines.push(`儲備修為已轉入新境界，修為＋${Math.floor(reserveReleased).toLocaleString('zh-Hant')}。`);
    }
    const prestigeGain = 0;
    pushChronicle(state, lines);
    snapshotRng(state);
    return {
      success: true,
      lines,
      oldTierName: tier.name,
      newTierName: entered.name,
      newTierLevel: nextTier.level,
      martialGain,
      hpGain,
      qiGain,
      prestigeGain,
      reserveReleased,
    };
  }

  // 失敗扣修為（TEST_BREAKTHROUGH_FAIL_XP_LOSS），要儲返滿先可以再試；取代舊「失敗保留修為」
  // （design/agreed-design-2026-10.md §3，2026-10-25 審計 B1 玩家改選）。儲備唔扣，突破成功先撥入。
  // 氣血、內力照扣，唔落內傷（玩家決定 2026-10-05）
  const hpLoss = Math.round(c.maxHealth * 0.12);
  const qiLoss = Math.round(c.maxQi * 0.18);
  c.health = Math.max(1, c.health - hpLoss);
  c.qi = Math.max(0, c.qi - qiLoss);
  const setback = Math.min(c.cultivation.xp, Math.round(tier.cap * TEST_BREAKTHROUGH_FAIL_XP_LOSS));
  c.cultivation.xp -= setback;
  lines.push(
    '運功衝關，行至緊要關頭卻氣息紊亂，未能破關。',
    `修為－${setback.toLocaleString('zh-Hant')}，氣血－${hpLoss}，內力－${qiLoss}。修為儲滿可再試（本次成功率約 ${Math.round(chance * 100)}%，看根骨、悟性）。`,
  );
  pushChronicle(state, lines);
  snapshotRng(state);
  return { success: false, lines, oldTierName: tier.name, hpLoss, qiLoss, setback, chance };
}
