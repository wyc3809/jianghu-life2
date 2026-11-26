import type { LifeGameState } from '@interfaces/lifeEngine';
import { RETIRE_MIN_TIER } from '@data/redesign/testParams';
import { CULTIVATION_TIERS } from './cultivation';

export const REINCARNATION_DAYS = 7;
export const REINCARNATION_MIN_TIER = RETIRE_MIN_TIER;
export const REINCARNATION_BONUS_PER_LIFE = 3;
export const REINCARNATION_MAX_BONUS = 15;

export function reincarnationBonus(count: number): number {
  return Math.min(REINCARNATION_MAX_BONUS, count * REINCARNATION_BONUS_PER_LIFE);
}

export function reincarnationStatus(state: LifeGameState) {
  const { flags, cultivation } = state.character;
  const count = Number(flags.reincarnation_count ?? 0);
  const days = Number(flags.reincarnation_days ?? 0);
  const tierMet = cultivation.tier >= REINCARNATION_MIN_TIER;
  const ended = state.phase === 'summary';
  const busy = Boolean(state.pendingCombat) || (!ended && (state.phase !== 'playing' || !state.character.alive));
  const ready = tierMet && days >= REINCARNATION_DAYS;
  return {
    count, days, tierMet, busy, ended,
    requiredTier: CULTIVATION_TIERS[REINCARNATION_MIN_TIER]!.name,
    currentTier: CULTIVATION_TIERS[cultivation.tier]?.name ?? '引氣入體',
    bonus: reincarnationBonus(count),
    nextBonus: reincarnationBonus(count + 1),
    canReincarnate: ready && !busy,
    canStartAfterEnding: ended && !busy && !ready,
  };
}

/** 每個遊戲日最多記一次。讀檔後由實際前景遊玩補記，唔從離線時數推算。 */
export function recordLifeDay(state: LifeGameState, day: string): boolean {
  const { flags, alive } = state.character;
  const days = Number(flags.reincarnation_days ?? 0);
  if (!alive || state.phase !== 'playing' || days >= REINCARNATION_DAYS) return false;
  if (typeof flags.reincarnation_day === 'string' && day <= flags.reincarnation_day) return false;
  flags.reincarnation_day = day;
  flags.reincarnation_days = days + 1;
  return true;
}
