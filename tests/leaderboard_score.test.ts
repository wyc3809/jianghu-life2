import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import {
  BOARD_NAME_MAX,
  boardName,
  lifeKey,
  lifeScore,
  lifeScoreEntry,
  liveBoardEntry,
} from '../core/life/leaderboardScore';

function fresh(seed: number) {
  initRng(seed);
  return createNewLife(seed);
}

describe('leaderboard score (排行榜數值)', () => {
  it('test_live_entry_reads_rank_and_cultivation', () => {
    const s = fresh(1);
    s.character.flags.jianghu_rank = 420;
    s.character.cultivation = { xp: 1234.7, tier: 5 };
    const e = liveBoardEntry(s);
    expect(e.jianghu_rank).toBe(420);
    expect(e.cult_tier).toBe(5);
    expect(e.cult_xp).toBe(1234);
  });

  it('test_life_score_grows_with_age_and_achievements', () => {
    const s = fresh(2);
    const before = lifeScore(s);
    s.character.age = 70;
    s.character.flags.achievements = 'ach_first_blood,ach_elder';
    expect(lifeScore(s)).toBeGreaterThan(before);
  });

  it('test_board_name_trimmed_and_capped', () => {
    const s = fresh(3);
    s.character.name = `  ${'劍'.repeat(40)}  `;
    expect([...boardName(s)]).toHaveLength(BOARD_NAME_MAX);
    s.character.name = '   ';
    expect(boardName(s)).toBe('無名氏');
  });

  it('test_life_key_stable_per_life', () => {
    const s = fresh(4);
    expect(lifeKey(s)).toBe(lifeKey(structuredClone(s)));
    expect(lifeScoreEntry(s).life_key).toBe(lifeKey(s));
  });
});
