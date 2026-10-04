import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import {
  SparDuel,
  sparHeroStats,
  sparMinionCount,
  sparSavedStage,
  sparStageFoes,
  sparStageReward,
  type SparHeroStats,
} from '../core/life/sparDuel';

/** 固定序列 RNG：測試唔靠隨機 */
function seq(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

const HERO: SparHeroStats = { maxHp: 1000, atk: 100, critRate: 0.2, critMul: 2, lifesteal: 0.1, clearHeal: 0.35, guard: 0 };

describe('spar duel (演武台對打)', () => {
  it('test_stage_has_minions_then_boss_and_grows', () => {
    const s1 = sparStageFoes(1);
    expect(s1).toHaveLength(sparMinionCount(1) + 1);
    expect(s1.at(-1)!.boss).toBe(true);
    expect(s1.slice(0, -1).every((f) => !f.boss)).toBe(true);
    expect(s1.at(-1)!.maxHp).toBeGreaterThan(s1[0]!.maxHp * 5);
    expect(sparStageFoes(10)[0]!.maxHp).toBeGreaterThan(s1[0]!.maxHp * 3);
  });

  it('test_hero_strike_crit_and_lifesteal', () => {
    const d = new SparDuel(HERO, 1, seq([0.1, 0.5])); // 0.1 < critRate → 暴擊；spread 1.0
    d.heroHp = 500;
    const hit = d.heroStrike();
    expect(hit.crit).toBe(true);
    expect(hit.dmg).toBe(200);
    expect(hit.heal).toBe(20);
    expect(d.heroHp).toBe(520);
  });

  it('test_kill_minions_then_boss_clears_stage', () => {
    const d = new SparDuel({ ...HERO, atk: 1e6 }, 1, seq([0.9, 0.5]));
    const n = sparMinionCount(1);
    for (let i = 0; i < n; i++) {
      const h = d.heroStrike();
      expect(h.killed).toBe(true);
      expect(h.bossKilled).toBe(false);
      expect(d.advance().stageCleared).toBe(false);
    }
    expect(d.foe!.boss).toBe(true);
    const boss = d.heroStrike();
    expect(boss.bossKilled).toBe(true);
    expect(d.advance().stageCleared).toBe(true);
    expect(d.stage).toBe(2);
  });

  it('test_hero_down_retreats_one_stage_and_full_heals', () => {
    const d = new SparDuel({ ...HERO, maxHp: 10 }, 5, seq([0.99]));
    let down = false;
    for (let i = 0; i < 50 && !down; i++) down = d.foeStrike().heroDown;
    expect(down).toBe(true);
    d.retreat();
    expect(d.stage).toBe(4);
    expect(d.heroHp).toBe(10);
    const d1 = new SparDuel(HERO, 1);
    d1.retreat();
    expect(d1.stage).toBe(1);
  });

  it('test_minions_left_counts_down', () => {
    const d = new SparDuel({ ...HERO, atk: 1e6 }, 1, seq([0.9]));
    const first = d.snapshot().minionsLeft;
    expect(first).toBe(sparMinionCount(1) - 1);
    d.heroStrike();
    d.advance();
    expect(d.snapshot().minionsLeft).toBe(first - 1);
  });

  it('test_hero_stats_grow_with_cultivation_tier', () => {
    initRng(3);
    const s = createNewLife(3);
    const low = sparHeroStats(s);
    s.character.cultivation = { xp: 0, tier: 6 };
    const high = sparHeroStats(s);
    expect(high.atk).toBeGreaterThan(low.atk * 4);
    expect(high.maxHp).toBeGreaterThan(low.maxHp * 4);
  });

  it('test_fresh_hero_can_clear_stage_one', () => {
    initRng(4);
    const s = createNewLife(4);
    const d = new SparDuel(sparHeroStats(s), 1, seq([0.37, 0.61, 0.12, 0.88, 0.45]));
    // 主角出手 1.2 秒一次，敵人 1.6 秒一次 → 每 4 擊對 3 擊
    let cleared = false;
    for (let round = 0; round < 400 && !cleared; round++) {
      for (let k = 0; k < 4 && !cleared; k++) {
        const h = d.heroStrike();
        if (h.killed) cleared = d.advance().stageCleared;
      }
      for (let k = 0; k < 3; k++) expect(d.foeStrike().heroDown).toBe(false);
    }
    expect(cleared).toBe(true);
  });

  it('test_reward_and_saved_stage', () => {
    expect(sparStageReward(9).silver).toBeGreaterThan(sparStageReward(1).silver);
    initRng(5);
    const s = createNewLife(5);
    expect(sparSavedStage(s)).toBe(1);
    s.character.flags.spar_stage = 7;
    expect(sparSavedStage(s)).toBe(7);
  });
});

describe('spar hero breakdown (戰力頁)', () => {
  it('test_breakdown_parts_sum_to_stats', async () => {
    const { sparHeroBreakdown } = await import('../core/life/sparDuel');
    initRng(6);
    const s = createNewLife(6);
    s.character.cultivation = { xp: 0, tier: 3 };
    const b = sparHeroBreakdown(s);
    expect(b.stats.atk).toBe(Math.round((b.atk.base + b.atk.fromMartial + b.atk.fromWeapon) * b.scale));
    expect(b.stats.maxHp).toBe(Math.round((b.hp.fromHealth + b.hp.fromMartial) * b.scale));
    expect(b.stats.critRate).toBeCloseTo(Math.min(b.crit.cap, b.crit.base + b.crit.fromDanShi + b.crit.fromWuXing), 9);
    expect(b.stats).toEqual(sparHeroStats(s));
  });
});

describe('spar heal rules (無回血技唔會自動回血)', () => {
  it('test_no_heal_skill_means_no_lifesteal_and_no_clear_heal', () => {
    initRng(7);
    const s = createNewLife(7);
    s.character.skills = ['art_river_fist'];
    s.character.equipment = { weapon: null, armor: null, accessory: null };
    const st = sparHeroStats(s);
    expect(st.lifesteal).toBe(0);
    expect(st.clearHeal).toBe(0);
    const d = new SparDuel({ ...st, atk: 1e6 }, 1, seq([0.9]));
    d.heroHp = 10;
    const h = d.heroStrike();
    expect(h.heal).toBe(0);
    expect(d.heroHp).toBe(10);
  });

  it('test_stage_clear_heals_only_with_heal_skill', () => {
    const noHeal = new SparDuel({ ...HERO, atk: 1e9, clearHeal: 0, lifesteal: 0 }, 1, seq([0.9]));
    noHeal.heroHp = 100;
    for (let i = 0; i < 10 && noHeal.stage === 1; i++) {
      noHeal.heroStrike();
      noHeal.advance();
    }
    expect(noHeal.stage).toBe(2);
    expect(noHeal.heroHp).toBe(100);
    const withHeal = new SparDuel({ ...HERO, atk: 1e9, clearHeal: 0.35, lifesteal: 0 }, 1, seq([0.9]));
    withHeal.heroHp = 100;
    for (let i = 0; i < 10 && withHeal.stage === 1; i++) {
      withHeal.heroStrike();
      withHeal.advance();
    }
    expect(withHeal.heroHp).toBe(450);
  });
});

describe('spar themes (出場有規律、主題)', () => {
  it('test_same_stage_same_roster_and_theme_changes_every_span', async () => {
    const { sparThemeFor, SPAR_THEME_SPAN, SPAR_THEMES } = await import('../core/life/sparDuel');
    expect(sparStageFoes(3).map((f) => f.look)).toEqual(sparStageFoes(3).map((f) => f.look));
    expect(sparThemeFor(1).name).toBe(sparThemeFor(SPAR_THEME_SPAN).name);
    expect(sparThemeFor(SPAR_THEME_SPAN + 1).name).not.toBe(sparThemeFor(1).name);
    expect(sparThemeFor(SPAR_THEME_SPAN * SPAR_THEMES.length + 1).name).toBe(sparThemeFor(1).name);
  });

  it('test_roster_follows_theme_order_and_boss_last', async () => {
    const { sparThemeFor } = await import('../core/life/sparDuel');
    const theme = sparThemeFor(2);
    const foes = sparStageFoes(2);
    foes.slice(0, -1).forEach((f, i) => {
      expect([f.look, f.name]).toEqual([...theme.minions[i % theme.minions.length]!]);
    });
    expect([foes.at(-1)!.look, foes.at(-1)!.name]).toEqual([...theme.boss]);
  });
});

describe('spar number format (過千用 k、m)', () => {
  it('test_format_uses_k_and_m', async () => {
    const { formatSparNumber } = await import('../core/life/sparDuel');
    expect(formatSparNumber(950)).toBe('950');
    expect(formatSparNumber(1000)).toBe('1k');
    expect(formatSparNumber(1234)).toBe('1.2k');
    expect(formatSparNumber(12_400)).toBe('12k');
    expect(formatSparNumber(304_437)).toBe('304k');
    expect(formatSparNumber(1_500_000)).toBe('1.5m');
    expect(formatSparNumber(3_923_950)).toBe('3.9m');
    expect(formatSparNumber(25_000_000)).toBe('25m');
  });
});
