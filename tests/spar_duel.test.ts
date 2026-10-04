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

const HERO: SparHeroStats = { maxHp: 1000, atk: 100, critRate: 0.2, critMul: 2, lifesteal: 0.1, guard: 0 };

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
