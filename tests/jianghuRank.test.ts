import { describe, expect, it } from 'vitest';
import {
  JIANGHU_RANK_START,
  computeJianghuScore,
  jianghuRank,
  jianghuRankTier,
  recordHuashanPlacement,
  scoreToRank,
  syncJianghuRank,
} from '../core/life/jianghuRank';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('jianghu rank', () => {
  it('starts every new life at rank 99999', () => {
    initRng(1);
    const state = createNewLife(1);
    expect(jianghuRank(state)).toBe(JIANGHU_RANK_START);
  });

  it('scoreToRank is monotonically non-increasing as score rises, bounded to [1, 99999]', () => {
    expect(scoreToRank(0)).toBe(JIANGHU_RANK_START);
    const mid = scoreToRank(3000);
    const high = scoreToRank(20000);
    expect(mid).toBeLessThan(JIANGHU_RANK_START);
    expect(high).toBeLessThan(mid);
    expect(high).toBeGreaterThanOrEqual(1);
  });

  it('syncJianghuRank drops rank once martial/reputation raise the score enough to cross a tier', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.martial = 3000;
    state.character.reputation = 3000;
    const lines = syncJianghuRank(state);
    expect(jianghuRank(state)).toBeLessThan(JIANGHU_RANK_START);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain('江湖排名躍升');
  });

  it('rank never regresses even if the underlying score later drops', () => {
    initRng(3);
    const state = createNewLife(3);
    state.character.martial = 90;
    state.character.reputation = 150;
    syncJianghuRank(state);
    const bestRank = jianghuRank(state);
    state.character.martial = 5;
    state.character.reputation = 0;
    syncJianghuRank(state);
    expect(jianghuRank(state)).toBe(bestRank);
  });

  it('huashan championship grants a large one-time score bonus that persists as best-ever', () => {
    initRng(4);
    const state = createNewLife(4);
    const before = computeJianghuScore(state);
    recordHuashanPlacement(state, 1);
    const afterChampion = computeJianghuScore(state);
    expect(afterChampion).toBeGreaterThan(before);

    // 生平最佳名次不因之後名次較差而倒退
    recordHuashanPlacement(state, 8);
    const afterLaterLoss = computeJianghuScore(state);
    expect(afterLaterLoss).toBe(afterChampion);
  });

  it('jianghuRankTier labels the expected boundaries', () => {
    expect(jianghuRankTier(1)).toBe('天下絕頂');
    expect(jianghuRankTier(100)).toBe('一流高手');
    expect(jianghuRankTier(1000)).toBe('嶄露頭角');
    expect(jianghuRankTier(10000)).toBe('略有薄名');
    expect(jianghuRankTier(99999)).toBe('江湖新丁');
  });
});
