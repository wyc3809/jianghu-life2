/**
 * 部位傷勢（design/gdd/injury-system.md）：受傷、疊傷、每月復原、醫館、奇遇醫殘、戰鬥受傷。
 * 數值全部喺 data/injuries/tuning.ts；隨機一律用種子 RNG（getRng）。
 */
import type { InjuryPart, InjuryTier, LifeCharacter, LifeGameState, LifeInjury } from '@interfaces/lifeEngine';
import { getRng, type SeededRng } from '@core/random';
import {
  BOSS_CRIPPLE_CHANCE,
  CRIPPLED_REHIT_HP,
  CRIPPLE_ON_STACK,
  HEAVY_MONTHS,
  INJURY_PARTS,
  INJURY_PART_LABEL,
  INJURY_TIER_LABEL,
  LIGHT_MONTHS,
  LOSS_HEAVY_CHANCE,
  LOSS_INJURY_CHANCE,
  PART_WEIGHTS,
  WIN_INJURY_CHANCE,
  WIN_INJURY_HP_RATIO,
} from '@data/injuries/tuning';
import { recomputeCapBonuses } from './equipment';
import { injuryAt, legStaminaDrain } from './injuryMath';
import { pushMoment } from './moments';

export interface AddInjuryOptions {
  /** 切磋等：最多重傷，唔會傷殘 */
  noCripple?: boolean;
}

function ensureInjuries(c: LifeCharacter): LifeInjury[] {
  if (!c.injuries) c.injuries = [];
  return c.injuries;
}

/** 按 PART_WEIGHTS 擲部位 */
export function rollInjuryPart(rng: SeededRng = getRng()): InjuryPart {
  const total = INJURY_PARTS.reduce((s, p) => s + PART_WEIGHTS[p], 0);
  let roll = rng.nextFloat() * total;
  for (const p of INJURY_PARTS) {
    roll -= PART_WEIGHTS[p];
    if (roll < 0) return p;
  }
  return 'torso';
}

function monthsFor(tier: InjuryTier): number | null {
  if (tier === 'crippled') return null;
  return tier === 'heavy' ? HEAVY_MONTHS : LIGHT_MONTHS;
}

/**
 * 受一處傷（§3.2 疊傷表）。回傳一句敘事；會入隊特效時刻、按需重算氣血上限。
 * part 缺省＝按權重擲。
 */
export function addInjury(
  state: LifeGameState,
  tier: Exclude<InjuryTier, 'crippled'> | 'crippled',
  cause: string,
  part: InjuryPart = rollInjuryPart(),
  opts: AddInjuryOptions = {},
): string {
  const c = state.character;
  const list = ensureInjuries(c);
  const label = INJURY_PART_LABEL[part];
  const existing = injuryAt(c, part);

  if (existing?.tier === 'crippled') {
    c.health = Math.max(1, c.health - CRIPPLED_REHIT_HP);
    return `${label}舊患處再受重擊，氣血－${CRIPPLED_REHIT_HP}。`;
  }

  let next: InjuryTier = tier;
  let line: string;
  if (existing) {
    if (existing.tier === 'light') {
      next = 'heavy';
      line = `舊傷未癒，${label}傷勢加重。`;
    } else if (tier === 'heavy' && !opts.noCripple && getRng().chance(CRIPPLE_ON_STACK)) {
      next = 'crippled';
      line = `${label}一傷再傷，筋骨盡毀——落下殘疾。`;
    } else {
      next = 'heavy';
      line = `${label}重傷未癒，又添新創。`;
    }
  } else {
    line = next === 'crippled' ? `${label}遭重創，落下殘疾。` : `${label}受了${INJURY_TIER_LABEL[next]}。`;
  }
  if (opts.noCripple && next === 'crippled') next = 'heavy';

  const months = monthsFor(next);
  const record: LifeInjury = {
    part,
    tier: next,
    monthsLeft: existing?.monthsLeft != null && months != null ? Math.max(existing.monthsLeft, months) : months,
    cause,
  };
  if (existing) Object.assign(existing, record);
  else list.push(record);

  pushMoment(state, { kind: 'injury', part, tier: next });
  if (part === 'torso') recomputeCapBonuses(c);
  return line;
}

/** 每月：腿傷耗精力；輕傷倒數至消失，重傷倒數至轉輕傷；傷殘不變 */
export function tickInjuries(state: LifeGameState): void {
  const c = state.character;
  if (!c.injuries?.length) return;
  const drain = legStaminaDrain(c);
  if (drain) c.stamina = Math.max(0, c.stamina - drain);
  const torsoBefore = injuryAt(c, 'torso')?.tier;
  c.injuries = decay(c.injuries, 1);
  if (injuryAt(c, 'torso')?.tier !== torsoBefore) recomputeCapBonuses(c);
}

function decay(list: LifeInjury[], months: number): LifeInjury[] {
  const out: LifeInjury[] = [];
  for (const inj of list) {
    if (inj.monthsLeft == null) {
      out.push(inj);
      continue;
    }
    const left = inj.monthsLeft - months;
    if (left > 0) out.push({ ...inj, monthsLeft: left });
    else if (inj.tier === 'heavy') out.push({ ...inj, tier: 'light', monthsLeft: LIGHT_MONTHS });
  }
  return out;
}

/** 醫館調養：所有非傷殘傷減 months 個月（重傷減盡只降輕傷）。回傳有冇傷被處理 */
export function healInjuries(state: LifeGameState, months: number): boolean {
  const c = state.character;
  if (!c.injuries?.some((x) => x.monthsLeft != null)) return false;
  const torsoBefore = injuryAt(c, 'torso')?.tier;
  c.injuries = decay(c.injuries, months);
  if (injuryAt(c, 'torso')?.tier !== torsoBefore) recomputeCapBonuses(c);
  return true;
}

/** 奇遇醫殘：傷殘 → 重傷（仍要再養）。part 缺省＝第一處傷殘。無傷殘回 null */
export function cureCrippled(state: LifeGameState, part?: InjuryPart): string | null {
  const c = state.character;
  const target = c.injuries?.find((x) => x.tier === 'crippled' && (!part || x.part === part));
  if (!target) return null;
  target.tier = 'heavy';
  target.monthsLeft = HEAVY_MONTHS;
  pushMoment(state, { kind: 'cure', part: target.part });
  if (target.part === 'torso') recomputeCapBonuses(c);
  return `${INJURY_PART_LABEL[target.part]}殘疾竟有轉機，筋骨漸復，仍需調養。`;
}

export interface CombatInjuryContext {
  won: boolean;
  /** 戰後氣血比例 0–1 */
  hpRatio: number;
  foePower?: 'weak' | 'normal' | 'strong' | 'boss';
  source?: 'spar' | 'event' | 'bandit' | 'road';
  foeName: string;
}

/** 戰鬥完結時擲傷（§3.3）。回傳敘事行（可能為空） */
export function applyCombatInjuries(
  state: LifeGameState,
  ctx: CombatInjuryContext,
  rng: SeededRng = getRng(),
): string[] {
  const power = ctx.foePower ?? 'normal';
  const noCripple = ctx.source === 'spar';
  if (ctx.won) {
    if (ctx.hpRatio >= WIN_INJURY_HP_RATIO || !rng.chance(WIN_INJURY_CHANCE)) return [];
    return [addInjury(state, 'light', `險勝${ctx.foeName}`, rollInjuryPart(rng), { noCripple })];
  }
  if (!rng.chance(LOSS_INJURY_CHANCE)) return [];
  const heavy = rng.chance(LOSS_HEAVY_CHANCE[power]);
  const cause = `敗於${ctx.foeName}`;
  const part = rollInjuryPart(rng);
  if (heavy && power === 'boss' && !noCripple && rng.chance(BOSS_CRIPPLE_CHANCE)) {
    return [addInjury(state, 'crippled', cause, part)];
  }
  return [addInjury(state, heavy ? 'heavy' : 'light', cause, part, { noCripple })];
}

/** 舊 condition（骨裂／腿傷難行）→ 部位重傷；其餘回 false 由 addCondition 照舊處理 */
export function conditionAsInjury(state: LifeGameState, id: string, cause = '舊患'): string | null {
  if (id === 'limp') return addInjury(state, 'heavy', cause, 'leg');
  if (id === 'fracture') return addInjury(state, 'heavy', cause, getRng().chance(0.5) ? 'arm' : 'leg');
  return null;
}

/** 讀檔遷移：補 injuries；舊 conditions 嘅 fracture／limp 轉部位重傷（保留剩餘月數，唔播特效） */
export function migrateInjuries(c: LifeCharacter): void {
  const list = ensureInjuries(c);
  const keep = [];
  for (const cond of c.conditions ?? []) {
    if (cond.id !== 'fracture' && cond.id !== 'limp') {
      keep.push(cond);
      continue;
    }
    const part: InjuryPart = cond.id === 'limp' ? 'leg' : 'arm';
    if (!list.some((x) => x.part === part)) {
      list.push({ part, tier: 'heavy', monthsLeft: Math.max(1, cond.monthsLeft), cause: cond.name });
    }
  }
  c.conditions = keep;
}
