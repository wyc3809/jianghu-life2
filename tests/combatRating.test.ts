import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { combatRating, combatRatingTier } from '../core/life/combatRating';
import { sparHeroStats, sparStageFoes } from '../core/life/sparDuel';

describe('戰力及演武氣血改版', () => {
  it('test_rating_growth_training_health_qi_and_tier_raise_power', () => {
    const s = createNewLife({ seed: 42, skipCoach: true });
    let before = combatRating(s);
    for (const upgrade of [() => s.character.martial += 30, () => s.character.maxHealth += 100,
      () => s.character.maxQi += 200, () => s.character.cultivation.tier += 1]) {
      upgrade();
      expect(combatRating(s)).toBeGreaterThan(before);
      before = combatRating(s);
    }
  });
  it('test_rating_social_rank_and_injury_do_not_inflate_power', () => {
    const s = createNewLife({ seed: 42, skipCoach: true });
    const before = combatRating(s);
    s.character.flags.jianghu_prestige = 99999;
    s.character.flags.jianghu_rank = 1;
    s.character.health = 1;
    expect(combatRating(s)).toBe(before);
    expect(combatRatingTier(0)).toBe('初窺門徑');
    expect(combatRatingTier(500)).toBe('初出茅廬');
  });
  it('test_spar_max_hp_matches_actual_at_all_tiers_and_foes_grow', () => {
    const s = createNewLife({ seed: 42, skipCoach: true });
    for (const tier of [0, 6, 14]) {
      s.character.cultivation.tier = tier;
      expect(sparHeroStats(s).maxHp).toBe(s.character.maxHealth);
    }
    // 第38項候選：後期血量與攻擊成長提高，主角氣血仍與實際相同。
    expect(sparStageFoes(10)[0]!.maxHp).toBe(Math.round(140 * 1.21 ** 9));
    expect(sparStageFoes(10)[0]!.atk).toBe(Math.round(16 * 1.045 ** 9));
  });
});

import { SparDuel } from '../core/life/sparDuel';
import { useLifeStore } from '../src/store/lifeStore';

it('test_spar_real_health_sync_nonlethal_and_retreat_recovers', () => {
  const s = createNewLife({ seed: 42, skipCoach: true });
  const d = new SparDuel(sparHeroStats(s), 1, () => .5);
  d.setHero(sparHeroStats(s), 5);
  expect(d.heroHp).toBe(5);
  expect(d.foeStrike().heroDown).toBe(true);
  expect(d.heroHp).toBe(1);
  useLifeStore.setState({ state: s });
  useLifeStore.getState().sparSyncHealth(d.heroHp);
  expect(useLifeStore.getState().state!.character.health).toBe(1);
  expect(useLifeStore.getState().state!.character.alive).toBe(true);
  d.retreat();
  useLifeStore.getState().sparSyncHealth(d.heroHp);
  expect(useLifeStore.getState().state!.character.health).toBe(s.character.maxHealth);
});
