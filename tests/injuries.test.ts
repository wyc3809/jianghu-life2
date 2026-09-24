import { describe, expect, it } from 'vitest';
import type { LifeGameState } from '../interfaces/lifeEngine';
import { gameEventSchema, lifeGameStateSchema } from '../interfaces/lifeEngine';
import { INJURY_CURE_EVENTS } from '../data/events/injuryCures';
import { meetsRequirements } from '../core/life/requirements';
import { applyEffects } from '../core/life/effects';
import {
  addInjury,
  applyCombatInjuries,
  cureCrippled,
  healInjuries,
  migrateInjuries,
  tickInjuries,
} from '../core/life/injuries';
import { armAttackFactor, torsoHpFactor } from '../core/life/injuryMath';
import { buildPlayerFighter } from '../core/life/combat';
import { recomputeCapBonuses } from '../core/life/equipment';
import { addCondition } from '../core/life/monthly';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { getRng, initRng } from '../core/random';
import { HEAL_MONTHS, HEAVY_MONTHS, LIGHT_MONTHS, LOSS_INJURY_CHANCE } from '../data/injuries/tuning';

function fresh(seed: number): LifeGameState {
  initRng(seed);
  const state = createNewLife(seed);
  state.moments = [];
  state.character.injuries = [];
  return state;
}

describe('injury system (design/gdd/injury-system.md)', () => {
  it('test_injury_new_part_records_given_tier', () => {
    const state = fresh(1);
    addInjury(state, 'light', '試', 'arm');
    expect(state.character.injuries).toEqual([{ part: 'arm', tier: 'light', monthsLeft: LIGHT_MONTHS, cause: '試' }]);
    expect(state.moments).toEqual([{ kind: 'injury', part: 'arm', tier: 'light' }]);
  });

  it('test_injury_light_on_light_escalates_to_heavy_single_record', () => {
    const state = fresh(2);
    addInjury(state, 'light', 'a', 'leg');
    addInjury(state, 'light', 'b', 'leg');
    expect(state.character.injuries).toHaveLength(1);
    expect(state.character.injuries![0]).toMatchObject({ part: 'leg', tier: 'heavy', monthsLeft: HEAVY_MONTHS });
  });

  it('test_injury_heavy_on_heavy_is_heavy_or_crippled_and_deterministic', () => {
    const outcomes = (seed: number) => {
      const state = fresh(seed);
      addInjury(state, 'heavy', 'a', 'arm');
      addInjury(state, 'heavy', 'b', 'arm');
      return state.character.injuries!.map((x) => x.tier).join();
    };
    const seen = new Set<string>();
    for (let s = 0; s < 60; s++) {
      const a = outcomes(s);
      expect(a).toBe(outcomes(s));
      seen.add(a);
    }
    expect(seen).toEqual(new Set(['heavy', 'crippled']));
  });

  it('test_injury_no_cripple_option_caps_at_heavy', () => {
    for (let s = 0; s < 40; s++) {
      const state = fresh(100 + s);
      addInjury(state, 'heavy', 'a', 'arm', { noCripple: true });
      addInjury(state, 'heavy', 'b', 'arm', { noCripple: true });
      expect(state.character.injuries![0]!.tier).toBe('heavy');
    }
  });

  it('test_injury_rehit_on_crippled_costs_health_not_tier', () => {
    const state = fresh(3);
    addInjury(state, 'crippled', 'a', 'head');
    state.character.health = 50;
    addInjury(state, 'heavy', 'b', 'head');
    expect(state.character.injuries![0]!.tier).toBe('crippled');
    expect(state.character.health).toBe(42);
  });

  it('test_injury_tick_light_heals_heavy_downgrades_crippled_stays', () => {
    const state = fresh(4);
    addInjury(state, 'light', 'a', 'arm');
    addInjury(state, 'heavy', 'b', 'torso');
    addInjury(state, 'crippled', 'c', 'head');
    for (let m = 0; m < LIGHT_MONTHS; m++) tickInjuries(state);
    expect(state.character.injuries!.find((x) => x.part === 'arm')).toBeUndefined();
    for (let m = LIGHT_MONTHS; m < HEAVY_MONTHS; m++) tickInjuries(state);
    expect(state.character.injuries!.find((x) => x.part === 'torso')).toMatchObject({ tier: 'light' });
    for (let m = 0; m < LIGHT_MONTHS; m++) tickInjuries(state);
    expect(state.character.injuries!.find((x) => x.part === 'torso')).toBeUndefined();
    for (let m = 0; m < 120; m++) tickInjuries(state);
    expect(state.character.injuries).toEqual([expect.objectContaining({ part: 'head', tier: 'crippled' })]);
  });

  it('test_injury_heal_reduces_months_but_not_crippled', () => {
    const state = fresh(5);
    addInjury(state, 'heavy', 'a', 'leg');
    addInjury(state, 'crippled', 'b', 'arm');
    expect(healInjuries(state, HEAL_MONTHS)).toBe(true);
    expect(state.character.injuries!.find((x) => x.part === 'leg')!.monthsLeft).toBe(HEAVY_MONTHS - HEAL_MONTHS);
    expect(state.character.injuries!.find((x) => x.part === 'arm')).toMatchObject({
      tier: 'crippled',
      monthsLeft: null,
    });
  });

  it('test_injury_cure_crippled_only_affects_crippled', () => {
    const state = fresh(6);
    addInjury(state, 'heavy', 'a', 'leg');
    expect(cureCrippled(state)).toBeNull();
    addInjury(state, 'crippled', 'b', 'arm');
    expect(cureCrippled(state)).toContain('手臂');
    expect(state.character.injuries!.find((x) => x.part === 'arm')).toMatchObject({
      tier: 'heavy',
      monthsLeft: HEAVY_MONTHS,
    });
    expect(state.moments!.at(-1)).toEqual({ kind: 'cure', part: 'arm' });
  });

  it('test_injury_arm_heavy_scales_attack_and_torso_crippled_scales_max_health', () => {
    const state = fresh(7);
    const baseAttack = buildPlayerFighter(state).attack;
    recomputeCapBonuses(state.character);
    const baseMax = state.character.maxHealth;
    addInjury(state, 'heavy', 'a', 'arm');
    expect(armAttackFactor(state.character)).toBeCloseTo(0.8);
    expect(Math.abs(buildPlayerFighter(state).attack - baseAttack * 0.8)).toBeLessThanOrEqual(1);
    addInjury(state, 'crippled', 'b', 'torso');
    expect(torsoHpFactor(state.character)).toBeCloseTo(0.75);
    expect(Math.abs(state.character.maxHealth - baseMax * 0.75)).toBeLessThanOrEqual(1);
    expect(state.character.health).toBeLessThanOrEqual(state.character.maxHealth);
  });

  it('test_injury_legacy_save_migrates_fracture_and_limp', () => {
    const state = fresh(8);
    delete state.character.injuries;
    state.character.conditions = [
      { id: 'fracture', name: '骨裂', severity: 2, monthsLeft: 3 },
      { id: 'limp', name: '腿傷難行', severity: 2, monthsLeft: 6 },
      { id: 'poison', name: '餘毒', severity: 2, monthsLeft: 2 },
    ];
    const migrated = migrateLifeState(state);
    expect(migrated.character.conditions.map((x) => x.id)).toEqual(['poison']);
    expect(migrated.character.injuries).toEqual([
      { part: 'arm', tier: 'heavy', monthsLeft: 3, cause: '骨裂' },
      { part: 'leg', tier: 'heavy', monthsLeft: 6, cause: '腿傷難行' },
    ]);
    expect(lifeGameStateSchema.safeParse(migrated).success).toBe(true);
    // 再遷移一次唔會重複
    migrateInjuries(migrated.character);
    expect(migrated.character.injuries).toHaveLength(2);
  });

  it('test_injury_condition_fracture_becomes_part_injury', () => {
    const state = fresh(9);
    addCondition(state, 'limp');
    expect(state.character.conditions.find((x) => x.id === 'limp')).toBeUndefined();
    expect(state.character.injuries).toEqual([expect.objectContaining({ part: 'leg', tier: 'heavy' })]);
  });

  it('test_injury_combat_loss_rate_near_tuning_and_spar_never_cripples', () => {
    let injured = 0;
    const N = 1000;
    initRng(4242);
    const rng = getRng();
    for (let i = 0; i < N; i++) {
      const state = createNewLife(1);
      state.character.injuries = [];
      applyCombatInjuries(state, { won: false, hpRatio: 0, foePower: 'normal', foeName: '賊' }, rng);
      if (state.character.injuries.length) injured++;
    }
    expect(Math.abs(injured / N - LOSS_INJURY_CHANCE)).toBeLessThan(0.05);

    const spar = createNewLife(2);
    spar.character.injuries = [];
    for (let i = 0; i < N; i++) {
      applyCombatInjuries(spar, { won: false, hpRatio: 0, foePower: 'boss', source: 'spar', foeName: '師兄' }, rng);
    }
    expect(spar.character.injuries.some((x) => x.tier === 'crippled')).toBe(false);
  });

  it('test_injury_comfortable_win_never_injures', () => {
    const state = fresh(10);
    for (let i = 0; i < 200; i++) {
      applyCombatInjuries(state, { won: true, hpRatio: 0.8, foeName: '賊' });
    }
    expect(state.character.injuries).toEqual([]);
  });

  it('test_injury_cure_events_validate_and_gate_on_crippled', () => {
    const state = fresh(11);
    state.character.age = 30;
    state.character.money = 200;
    state.character.attributes.wuXing = 50;
    for (const ev of INJURY_CURE_EVENTS) {
      expect(gameEventSchema.safeParse(ev).success).toBe(true);
      expect(meetsRequirements(state, ev.requirements, ev.id)).toBe(false);
    }
    addInjury(state, 'crippled', '試', 'leg');
    for (const ev of INJURY_CURE_EVENTS) expect(meetsRequirements(state, ev.requirements, ev.id)).toBe(true);
    applyEffects(state, INJURY_CURE_EVENTS[0]!.choices[0]!.outcomes[0]!.effects);
    expect(state.character.injuries![0]).toMatchObject({ part: 'leg', tier: 'heavy' });
  });
});
