import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { allTitles, syncTitles, titleBonusTotals, topTitles } from '../core/life/titles';
import { buildPlayerFighter } from '../core/life/combat';

describe('title (稱號) system', () => {
  it('test_titles_sync_grants_and_persists_earned_titles', () => {
    const state = createNewLife({ seed: 1 });
    state.character.stats.eventsSeen = 40;

    const gained = syncTitles(state);

    expect(gained.some((line) => line.includes('墨手'))).toBe(true);
    expect(allTitles(state).some((t) => t.id === 'title_ink_hand')).toBe(true);

    // running again must not re-grant the same title
    const gainedAgain = syncTitles(state);
    expect(gainedAgain.some((line) => line.includes('墨手'))).toBe(false);
  });

  it('test_titles_topTitles_returns_only_the_strongest_three', () => {
    const state = createNewLife({ seed: 2 });
    // qualify for 5 titles across tiers 1-4
    state.character.stats.eventsSeen = 100; // title_ink_hand (1), title_wanderer (2)
    state.character.stats.lovers = 1; // title_lover (1)
    state.character.stats.combatsWon = 40; // title_blade_scar (3), title_hunter (3), title_duelist (4)
    state.character.martial = 70; // title_master (4)
    syncTitles(state);

    const all = allTitles(state);
    expect(all.length).toBeGreaterThan(3);

    const top = topTitles(state, 3);
    expect(top).toHaveLength(3);
    // top 3 must be exactly the 3 highest-tier entries from allTitles
    expect(top).toEqual(all.slice(0, 3).map((t) => t.label));
    // sorted descending by tier
    const tiers = all.map((t) => t.tier);
    expect([...tiers]).toEqual([...tiers].sort((a, b) => b - a));
  });

  it('test_titles_sect_rank_label_updates_with_sect_and_standing', () => {
    const state = createNewLife({ seed: 3 });
    state.character.sectId = 'sect_qingyun';
    state.character.sectStanding = 0;
    syncTitles(state);
    const rankLow = allTitles(state).find((t) => t.id === 'title_sect_rank');
    expect(rankLow?.label).toContain('青雲劍派');
    expect(rankLow?.label).toContain('外門弟子');

    state.character.sectStanding = 3;
    const rankHigh = allTitles(state).find((t) => t.id === 'title_sect_rank');
    expect(rankHigh?.label).toContain('門中執事');
  });

  it('test_titles_bonusTotals_only_counts_titles_within_display_cap', () => {
    const state = createNewLife({ seed: 4 });
    state.character.stats.eventsSeen = 100; // tier1 + tier2, both carry bonus
    state.character.stats.combatsWon = 40; // tier3 x2 + tier4, all carry bonus
    state.character.martial = 70; // tier4, carries bonus
    syncTitles(state);

    const bonusAll = titleBonusTotals(state, 999);
    const bonusTop3 = titleBonusTotals(state, 3);

    // capping to the top 3 must never exceed summing everything earned
    expect(bonusTop3.attack).toBeLessThanOrEqual(bonusAll.attack);
    expect(bonusTop3.attack).toBeGreaterThan(0);
  });

  it('test_titles_combat_bonus_feeds_into_player_fighter_attack', () => {
    const base = createNewLife({ seed: 5 });
    const boosted = createNewLife({ seed: 5 });
    boosted.character.martial = 95;
    boosted.character.stats.combatsWon = 40;
    boosted.character.reputation = 200; // qualifies for title_top4 (+8 attack)
    syncTitles(boosted);

    const baseFighter = buildPlayerFighter(base);
    const boostedFighter = buildPlayerFighter(boosted);

    // martial itself also raises attack (martial/4), so isolate the title contribution
    const martialOnlyDelta = Math.floor(boosted.character.martial / 4) - Math.floor(base.character.martial / 4);
    const titleContribution = boostedFighter.attack - baseFighter.attack - martialOnlyDelta;
    expect(titleContribution).toBeGreaterThanOrEqual(8);
  });
});
