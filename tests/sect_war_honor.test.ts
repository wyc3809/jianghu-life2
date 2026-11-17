/** 門派會武本屆榮銜：職位服資格同每屆俸祿（2026-11-16 連動檢視 L5）。 */
import { describe, expect, it } from 'vitest';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { applySectWarSeat } from '../core/life/sectWarHonor';
import { settleAccountEconomy } from '../core/life/accountEconomy';
import { emptyAncestry } from '../core/life/ancestry';
import { canWearCostume, effectiveSectStanding } from '../interfaces/costumes';
import { appearanceOf } from '../interfaces/appearance';
import { SECT_WAR_WEEKLY_JADE, sectWarSeatJade, sectWarSeatStanding } from '../data/redesign/sectWarTestParams';
import type { LifeGameState } from '../interfaces/lifeEngine';

const NOW = Date.UTC(2026, 10, 17, 4);
const UNTIL = NOW + 3 * 86400_000;

function member(standing = 1): LifeGameState {
  initRng(7);
  const s = createNewLife({ seed: 7, skipCoach: true });
  s.character.sectId = 'sect_qingyun';
  s.character.sectStanding = standing;
  return s;
}

describe('會武席次 → 職位服地位及俸祿', () => {
  it('test_sect_war_seat_maps_to_matching_rank', () => {
    expect([1, 2, 3, 4, 6, 7, 10].map(sectWarSeatStanding)).toEqual([7, 6, 6, 4, 4, 3, 3]);
    expect([1, 3, 6, 10].map(sectWarSeatJade)).toEqual([
      SECT_WAR_WEEKLY_JADE.master, SECT_WAR_WEEKLY_JADE.elder, SECT_WAR_WEEKLY_JADE.deacon, SECT_WAR_WEEKLY_JADE.delegate,
    ]);
    expect(SECT_WAR_WEEKLY_JADE).toEqual({ master: 180, elder: 120, deacon: 90, delegate: 60 });
  });

  it('test_master_seat_unlocks_master_uniform_until_next_term', () => {
    const s = member(1);
    expect(canWearCostume(s.character, 'uniform-qingyun-7', NOW)).toBe(false);
    applySectWarSeat(s, { term: 100, sectId: 'sect_qingyun', rank: 1, until: UNTIL });
    expect(effectiveSectStanding(s.character, NOW)).toBe(7);
    expect(canWearCostume(s.character, 'uniform-qingyun-7', NOW)).toBe(true);
    expect(canWearCostume(s.character, 'uniform-qingyun-7', UNTIL + 1)).toBe(false);
    expect(canWearCostume(s.character, 'uniform-qingyun-1', UNTIL + 1)).toBe(true);
  });

  it('test_honor_never_lowers_single_player_standing', () => {
    const s = member(6);
    applySectWarSeat(s, { term: 100, sectId: 'sect_qingyun', rank: 10, until: UNTIL });
    expect(effectiveSectStanding(s.character, NOW)).toBe(6);
  });

  it('test_honor_void_after_leaving_sect_and_outfit_falls_back', () => {
    const s = member(1);
    applySectWarSeat(s, { term: 100, sectId: 'sect_qingyun', rank: 1, until: UNTIL });
    s.character.appearance = { head: 'bamboo', outfit: 'cloak', tone: 'ink', costume: 'uniform-qingyun-7', fashion: 'fashion-night' };
    s.character.sectId = 'sect_emei';
    expect(canWearCostume(s.character, 'uniform-qingyun-7', NOW)).toBe(false);
    expect(appearanceOf(s.character).costume).toBe('fashion-night');
  });

  it('test_seat_for_other_sect_is_ignored', () => {
    const s = member(1);
    expect(applySectWarSeat(s, { term: 100, sectId: 'sect_emei', rank: 1, until: UNTIL })).toBe(false);
    expect(s.character.flags.sect_war_standing).toBeUndefined();
  });

  it('test_weekly_jade_paid_once_per_term', () => {
    const s = member(1);
    const meta = emptyAncestry();
    settleAccountEconomy(meta, s, NOW);
    applySectWarSeat(s, { term: 100, sectId: 'sect_qingyun', rank: 2, until: UNTIL });
    expect(settleAccountEconomy(meta, s, NOW)).toBe(120);
    applySectWarSeat(s, { term: 100, sectId: 'sect_qingyun', rank: 2, until: UNTIL });
    expect(settleAccountEconomy(meta, s, NOW)).toBe(0);
    applySectWarSeat(s, { term: 101, sectId: 'sect_qingyun', rank: 1, until: UNTIL + 7 * 86400_000 });
    expect(settleAccountEconomy(meta, s, NOW)).toBe(180);
  });
});
