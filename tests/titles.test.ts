import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import {
  TITLE_TIER_COLOR_CLASS,
  allTitles,
  equippedTitles,
  setEquippedTitles,
  titleCollection,
  syncTitles,
  titleBonusTotals,
  titleTierColorClass,
  topTitle,
  topTitles,
} from '../core/life/titles';
import { SKILL_DEFS } from '../data/skills/catalog';
import { MARTIAL_RANKS } from '../core/life/martialRanks';
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
    expect(rankLow?.label).toContain('記名弟子');

    state.character.sectStanding = 4;
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
    boosted.character.stats.combatsWon = 60;
    boosted.character.reputation = 250; // qualifies for title_top4 (+8 attack)
    syncTitles(boosted);

    const baseFighter = buildPlayerFighter(base);
    const boostedFighter = buildPlayerFighter(boosted);

    // martial itself also raises attack (martial/4), so isolate the title contribution
    const martialOnlyDelta = Math.floor(boosted.character.martial / 4) - Math.floor(base.character.martial / 4);
    const titleContribution = boostedFighter.attack - baseFighter.attack - martialOnlyDelta;
    expect(titleContribution).toBeGreaterThanOrEqual(8);
  });

  it('test_titles_topTitle_returns_the_single_highest_tier_title_or_null', () => {
    const fresh = createNewLife({ seed: 6 });
    expect(topTitle(fresh)).toBeNull();

    const state = createNewLife({ seed: 6 });
    state.character.stats.eventsSeen = 100; // tier1 + tier2
    state.character.stats.combatsWon = 40; // tier3 x2 + tier4
    state.character.martial = 70; // tier4
    syncTitles(state);

    const top = topTitle(state);
    const all = allTitles(state);
    expect(top).not.toBeNull();
    expect(top!.label).toBe(all[0]!.label);
    expect(top!.tier).toBe(all[0]!.tier);
  });

  it('keeps at most three owned titles in the player’s chosen order, including across reload', () => {
    const state = createNewLife({ seed: 7 });
    state.character.flags.titles = 'title_ink_hand,title_blade_scar,title_master,title_top4';
    expect(topTitles(state)).toEqual(['天下四絕之一', '一派高手', '刀疤客']);
    expect(setEquippedTitles(state, ['title_ink_hand', 'title_blade_scar', 'title_master'])).toBe(true);
    const saved = JSON.parse(JSON.stringify(state)) as typeof state;
    expect(topTitles(saved)).toEqual(['墨手', '刀疤客', '一派高手']);
    expect(titleBonusTotals(saved)).toEqual({ attack: 4, defense: 4, hitBonus: .01, evasion: 0 });
    expect(setEquippedTitles(state, ['title_ink_hand', 'title_ink_hand'])).toBe(false);
    expect(setEquippedTitles(state, ['title_spar_60'])).toBe(false);
    expect(setEquippedTitles(state, ['title_ink_hand', 'title_blade_scar', 'title_master', 'title_top4'])).toBe(false);
    expect(setEquippedTitles(state, [])).toBe(true);
    expect(equippedTitles(JSON.parse(JSON.stringify(state)))).toEqual([]);
  });

  it('checks stage clears, breakthroughs and diverse arts at their actual thresholds', () => {
    const state = createNewLife({ seed: 8 });
    const found = (id: string) => allTitles(state).some(title => title.id === id);
    state.character.flags.spar_stage = 10;
    state.character.cultivation.tier = 5;
    syncTitles(state);
    expect(found('title_spar_10')).toBe(false);
    expect(found('title_open_meridians')).toBe(false);
    state.character.flags.spar_stage = 11;
    state.character.cultivation.tier = 6;
    syncTitles(state);
    expect(found('title_spar_10')).toBe(true);
    expect(found('title_open_meridians')).toBe(true);
    expect(found('title_spar_30')).toBe(false);

    const arts = Object.values(SKILL_DEFS);
    const loadout = ['external', 'internal', 'qinggong'].map(kind => arts.find(art => art.kind === kind)!.id);
    state.character.skills = loadout;
    for (const id of loadout) state.character.skillRanks[id] = MARTIAL_RANKS.length - 1;
    state.character.skillRanks[loadout[2]]--;
    syncTitles(state);
    expect(found('title_three_disciplines')).toBe(false);
    state.character.skillRanks[loadout[2]]++;
    syncTitles(state);
    expect(found('title_three_disciplines')).toBe(true);
    expect(found('title_five_masteries')).toBe(false);
    expect(titleCollection(state).find(title => title.id === 'title_spar_30')?.requirement).toBe('通過演武台第 30 關');
  });

  it('does not grant or equip the old solo crown without multiplayer verification', () => {
    const state = createNewLife({ seed: 9 });
    state.character.martial = 999;
    syncTitles(state);
    expect(allTitles(state).some(title => title.label === '天下第一')).toBe(false);
    state.character.flags.titles = 'title_number_one,title_ink_hand';
    state.character.flags.equipped_titles = 'title_number_one,title_ink_hand';
    expect(topTitles(state)).toEqual(['墨手']);
    expect(setEquippedTitles(state, ['title_number_one'])).toBe(false);
    state.character.flags.online_rank_one_verified = true;
    expect(topTitles(state)).toEqual(['天下第一', '墨手']);
  });

  it('test_titles_tierColorClass_maps_every_tier_1_to_5', () => {
    for (let tier = 1; tier <= 5; tier++) {
      expect(titleTierColorClass(tier)).toBe(TITLE_TIER_COLOR_CLASS[tier]);
    }
    // unknown tier falls back to tier 1's class rather than throwing
    expect(titleTierColorClass(99)).toBe(TITLE_TIER_COLOR_CLASS[1]);
  });
});
