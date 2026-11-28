import { describe, expect, it } from 'vitest';
import {
  attemptCultivationBreakthrough,
  currentCultivationTier,
  enforceMartialCap,
  isMinorBreakthrough,
  martialCap,
  nextCultivationLevel,
} from '../core/life/cultivation';
import { createNewLife } from '../core/life/gameState';
import { SparDuel, sparRand, type SparHeroStats } from '../core/life/sparDuel';
import { initRng } from '../core/random';
import {
  LEVEL_CAPS,
  LEVEL_TARGET_HOURS,
  MARTIAL_CAP_PER_REALM,
  MARTIAL_CAP_PER_STAGE,
  MINOR_BREAKTHROUGH,
  SPAR_STAGE_TIME_LIMIT_SEC,
} from '../data/redesign/cultivationPacing';
import type { LifeGameState } from '../interfaces/lifeEngine';

function fresh(seed: number): LifeGameState {
  initRng(seed);
  const s = createNewLife(seed);
  s.pending = null;
  return s;
}

const HERO: SparHeroStats = { maxHp: 1000, atk: 100, critRate: 0.2, critMul: 2, lifesteal: 0.1, killHeal: 0.12, guard: 0 };

describe('2026-11-28 節奏檢視：分段境界', () => {
  it('test_pacing_has_30_levels_with_targets_summing_to_60_days', () => {
    const keys = Object.keys(LEVEL_CAPS);
    expect(keys).toHaveLength(29);
    expect(Object.keys(LEVEL_TARGET_HOURS).sort()).toEqual(keys.sort());
    const total = Object.values(LEVEL_TARGET_HOURS).reduce((a, b) => a + b, 0);
    expect(total / 24).toBe(60);
  });

  it('test_staged_realm_name_includes_stage', () => {
    const s = fresh(3);
    s.character.cultivation = { xp: 0, tier: 9, stage: 1 };
    expect(currentCultivationTier(s).name).toBe('先天之境・中期');
    expect(nextCultivationLevel(s)?.name).toBe('先天之境・後期');
  });

  it('test_minor_breakthrough_always_succeeds_without_rng', () => {
    const s = fresh(4);
    s.character.cultivation = { xp: LEVEL_CAPS['9.0']!, tier: 9, stage: 0 };
    expect(isMinorBreakthrough(s)).toBe(true);
    const martial = s.character.martial;
    const rngBefore = structuredClone(s.rngState);
    const r = attemptCultivationBreakthrough(s);
    expect(r.success).toBe(true);
    expect(r.minor).toBe(true);
    expect(s.character.cultivation).toMatchObject({ tier: 9, stage: 1, xp: 0 });
    expect(s.character.martial).toBe(martial + MINOR_BREAKTHROUGH.martial);
    expect(s.rngState).toEqual(rngBefore);
  });

  it('test_last_stage_leads_to_major_breakthrough', () => {
    const s = fresh(5);
    s.character.cultivation = { xp: LEVEL_CAPS['9.3']!, tier: 9, stage: 3 };
    expect(isMinorBreakthrough(s)).toBe(false);
    expect(nextCultivationLevel(s)?.name).toBe('返璞歸真・初期');
  });
});

describe('2026-11-28 節奏檢視：武學上限', () => {
  it('test_martial_cap_formula_by_realm_and_stage', () => {
    const s = fresh(6);
    s.character.cultivation = { xp: 0, tier: 10, stage: 2 };
    expect(martialCap(s)).toBe(MARTIAL_CAP_PER_REALM * 11 + MARTIAL_CAP_PER_STAGE * 2);
  });

  it('test_martial_gain_clipped_at_cap', () => {
    const s = fresh(7);
    s.character.cultivation = { xp: 0, tier: 0 };
    const cap = martialCap(s);
    s.character.martial = cap + 40;
    enforceMartialCap(s, cap - 5);
    expect(s.character.martial).toBe(cap);
  });

  it('test_martial_above_cap_from_old_save_is_never_reduced', () => {
    const s = fresh(8);
    s.character.cultivation = { xp: 0, tier: 0 };
    const old = martialCap(s) + 500;
    s.character.martial = old + 20;
    enforceMartialCap(s, old);
    expect(s.character.martial).toBe(old);
    s.character.martial = old - 10;
    enforceMartialCap(s, old);
    expect(s.character.martial).toBe(old - 10);
  });
});

describe('2026-11-28 節奏檢視：演武時限', () => {
  it('test_spar_stage_times_out_after_limit_and_resets_on_retreat', () => {
    const d = new SparDuel(HERO, 1, sparRand(1, 1));
    expect(d.addStageTime(SPAR_STAGE_TIME_LIMIT_SEC - 1)).toBe(false);
    expect(d.addStageTime(2)).toBe(true);
    d.retreat();
    expect(d.addStageTime(1)).toBe(false);
  });
});
