import { describe, expect, it } from 'vitest';
import {
  CULTIVATION_TIERS,
  MAX_TIER_FILL_SECONDS,
  OFFLINE_CULTIVATION_CAP_MS,
  applyOfflineCultivation,
  isCultivationCapped,
  tickCultivation,
} from '../core/life/cultivation';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { tryGainSectStanding } from '../core/life/sectStanding';
import { ACHIEVEMENT_RULES } from '../core/life/achievements';
import { MAX_SECT_STANDING, SECT_RANKS, sectStandingName } from '../data/content/packs';
import type { LifeGameState } from '../interfaces/lifeEngine';
import { initRng } from '../core/random';

function fresh(seed: number): LifeGameState {
  initRng(seed);
  return createNewLife(seed);
}

describe('ladder v2: cultivation 15 tiers', () => {
  it('test_cultivation_has_15_tiers_with_growing_caps', () => {
    expect(CULTIVATION_TIERS).toHaveLength(15);
    for (let i = 1; i < CULTIVATION_TIERS.length - 1; i++) {
      expect(CULTIVATION_TIERS[i]!.cap).toBeGreaterThan(CULTIVATION_TIERS[i - 1]!.cap * 1.7);
    }
    expect(Number.isFinite(CULTIVATION_TIERS[14]!.cap)).toBe(false);
  });

  it('test_cultivation_any_tier_fills_within_24_hours', () => {
    for (const tier of CULTIVATION_TIERS.slice(0, -1)) {
      const state = fresh(11);
      state.character.cultivation = { xp: 0, tier: tier.level };
      tickCultivation(state, MAX_TIER_FILL_SECONDS);
      expect(isCultivationCapped(state)).toBe(true);
    }
  });

  it('test_cultivation_offline_counts_up_to_48_hours', () => {
    expect(OFFLINE_CULTIVATION_CAP_MS).toBe(48 * 60 * 60 * 1000);
    const state = fresh(12);
    state.character.cultivation = { xp: 0, tier: 13 };
    const r = applyOfflineCultivation(state, 49 * 60 * 60 * 1000);
    expect(r.timeCapped).toBe(true);
    expect(r.countedSeconds).toBe(48 * 60 * 60);
  });
});

describe('ladder v2: sect ranks', () => {
  it('test_sect_has_8_ranks_topped_by_zhangmen', () => {
    expect(SECT_RANKS).toHaveLength(8);
    expect(MAX_SECT_STANDING).toBe(7);
    expect(sectStandingName(0)).toBe('記名弟子');
    expect(sectStandingName(7)).toBe('掌門');
  });

  it('test_sect_standing_stops_at_zhangmen', () => {
    const state = fresh(13);
    state.character.sectId = 'sect_qingyun';
    state.character.sectStanding = 0;
    for (let i = 0; i < 200; i++) tryGainSectStanding(state, 1);
    expect(state.character.sectStanding).toBe(7);
  });
});

describe('ladder v2: old-save migration', () => {
  it('test_migration_maps_old_tier_and_standing_once', () => {
    const state = fresh(14);
    const legacy = JSON.parse(JSON.stringify(state)) as LifeGameState;
    delete legacy.character.flags.ladder_v2;
    legacy.character.cultivation = { xp: 999999, tier: 6 }; // 舊「天人合一」
    legacy.character.sectId = 'sect_qingyun';
    legacy.character.sectStanding = 3; // 舊「門中執事」
    const m = migrateLifeState(legacy);
    expect(CULTIVATION_TIERS[m.character.cultivation.tier]!.name).toBe('天人合一');
    expect(m.character.cultivation.xp).toBeLessThanOrEqual(CULTIVATION_TIERS[12]!.cap);
    expect(sectStandingName(m.character.sectStanding)).toBe('門中執事');
    // 再載入唔會再轉
    const again = migrateLifeState(JSON.parse(JSON.stringify(m)) as LifeGameState);
    expect(again.character.cultivation.tier).toBe(12);
    expect(again.character.sectStanding).toBe(4);
  });

  it('test_new_life_is_not_migrated', () => {
    const state = fresh(15);
    state.character.cultivation = { xp: 0, tier: 3 };
    const m = migrateLifeState(JSON.parse(JSON.stringify(state)) as LifeGameState);
    expect(m.character.cultivation.tier).toBe(3);
  });
});

describe('ladder v2: achievements', () => {
  it('test_achievements_has_40_unique_ids', () => {
    expect(ACHIEVEMENT_RULES).toHaveLength(40);
    expect(new Set(ACHIEVEMENT_RULES.map((r) => r.id)).size).toBe(40);
    expect(new Set(ACHIEVEMENT_RULES.map((r) => r.label)).size).toBe(40);
  });

  it('test_achievements_fresh_life_does_not_unlock_late_goals', () => {
    const state = fresh(16);
    const late = ['ach_tier_god', 'ach_sect_master', 'ach_rank_10', 'ach_age_80'];
    for (const id of late) {
      expect(ACHIEVEMENT_RULES.find((r) => r.id === id)!.test(state)).toBe(false);
    }
  });
});
