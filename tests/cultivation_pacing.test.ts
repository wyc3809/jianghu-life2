import { describe, expect, it } from 'vitest';
import {
  attemptCultivationBreakthrough,
  currentCultivationTier,
  enforceMartialCap,
  isMinorBreakthrough,
  martialCap,
  nextCultivationLevel,
  rewriteMartialGainText,
  takeMartialOverflowPages,
} from '../core/life/cultivation';
import { applyChoice, rawCatalog } from '../core/life/eventEngine';
import { settleLifeIntoAccount } from '../core/life/accountSettle';
import type { AncestryMeta } from '../interfaces/ancestry';
import { createNewLife } from '../core/life/gameState';
import { SparDuel, sparFoeHpFactor, sparRand, type SparHeroStats } from '../core/life/sparDuel';
import { SPAR_FOE_HP_GROWTH, SPAR_FOE_HP_LATE_GROWTH, SPAR_FOE_HP_LATE_START } from '../data/redesign/testParams';
import { initRng } from '../core/random';
import {
  LEVEL_CAPS,
  LEVEL_TARGET_HOURS,
  MARTIAL_CAP_PER_REALM,
  MARTIAL_CAP_PER_STAGE,
  MARTIAL_OVERFLOW_PAGES_PER_POINT,
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

describe('2026-11-28 平衡檢視 B2：武學溢出化作書頁', () => {
  it('test_martial_overflow_becomes_pending_pages', () => {
    const s = fresh(9);
    s.character.cultivation = { xp: 0, tier: 0 };
    const cap = martialCap(s);
    s.character.martial = cap + 4;
    const r = enforceMartialCap(s, cap);
    expect(r.overflow).toBe(4);
    expect(r.pages).toBe(4 * MARTIAL_OVERFLOW_PAGES_PER_POINT);
    expect(takeMartialOverflowPages(s)).toBe(4 * MARTIAL_OVERFLOW_PAGES_PER_POINT);
    expect(takeMartialOverflowPages(s)).toBe(0);
  });

  it('test_rewrite_splits_partial_gain_into_martial_and_pages', () => {
    const k = MARTIAL_OVERFLOW_PAGES_PER_POINT;
    const lines = rewriteMartialGainText(['武學＋4', '名望＋2，武學＋3'], { before: 98, cap: 100, overflow: 5, pages: 5 * k });
    expect(lines).toEqual([`武學＋2（已達上限），書頁＋${2 * k}`, `名望＋2，武學已達上限，化作書頁＋${3 * k}`]);
  });

  it('test_event_at_cap_shows_pages_not_fake_martial_and_settles_into_account', () => {
    const ev = rawCatalog().find((e) => e.id === 'ord_dojo')!;
    const ch = ev.choices.find((c) => c.id === 'spar')!;
    const s = fresh(10);
    s.character.cultivation = { xp: 0, tier: 3 };
    s.character.martial = martialCap(s);
    const r = applyChoice(s, ev, ch.id);
    expect(s.character.martial).toBe(martialCap(s));
    expect(r.deltas.some((d) => /武學＋\d/.test(d))).toBe(false);
    expect(r.deltas.some((d) => d.includes('化作書頁＋'))).toBe(true);
    const meta = { pages: 10 } as AncestryMeta;
    const settle = settleLifeIntoAccount(meta, s);
    expect(meta.pages).toBeGreaterThan(10);
    expect(settle.metaChanged).toBe(true);
  });
});

describe('2026-11-28 平衡檢視 B1：演武後段放緩', () => {
  it('test_spar_hp_growth_slows_after_late_start', () => {
    const L = SPAR_FOE_HP_LATE_START;
    expect(sparFoeHpFactor(L) / sparFoeHpFactor(L - 1)).toBeCloseTo(SPAR_FOE_HP_GROWTH, 6);
    expect(sparFoeHpFactor(L + 1) / sparFoeHpFactor(L)).toBeCloseTo(SPAR_FOE_HP_LATE_GROWTH, 6);
    expect(sparFoeHpFactor(1)).toBe(1);
  });
});

describe('2026-11-28 平衡檢視 B1：反震以敵人攻擊為上限', () => {
  it('test_thorns_reflect_capped_by_foe_attack_not_hero_damage', () => {
    const hero: SparHeroStats = { ...HERO, maxHp: 900, atk: 200000, critRate: 0, lifesteal: 0 };
    const d = new SparDuel(hero, 41, sparRand(2, 41));
    // 打到首領（反震）
    for (let i = 0; i < 40 && !(d as unknown as { foe: { boss: boolean } }).foe.boss; i++) {
      d.heroStrike(1);
      d.advance();
    }
    const boss = (d as unknown as { foe: { boss: boolean; atk: number } }).foe;
    expect(boss.boss).toBe(true);
    const hit = d.heroStrike(1);
    expect(hit.reflect).toBeGreaterThan(0);
    expect(hit.reflect).toBeLessThanOrEqual(Math.round(boss.atk * 0.2) + 1);
  });
});
