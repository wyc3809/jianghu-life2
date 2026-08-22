import { describe, expect, it } from 'vitest';
import {
  JIANGHU_RANK_START,
  applyAchievementRankBonus,
  applyCombatOutcomeRank,
  applyHuashanPlacementRank,
  jianghuRank,
  jianghuRankTier,
  nudgeJianghuRank,
  recordHuashanPlacement,
} from '../core/life/jianghuRank';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('jianghu rank', () => {
  it('starts every new life at rank 99999', () => {
    initRng(1);
    const state = createNewLife(1);
    expect(jianghuRank(state)).toBe(JIANGHU_RANK_START);
  });

  it('nudgeJianghuRank clamps to [1, 99999] and reports a tier-crossing line', () => {
    initRng(2);
    const state = createNewLife(2);
    const lines = nudgeJianghuRank(state, -99998);
    expect(jianghuRank(state)).toBe(1);
    expect(lines.some((l) => l.includes('躍升'))).toBe(true);

    // 已經頂到 1，繼續加大改善冇再行
    const before = jianghuRank(state);
    nudgeJianghuRank(state, -500);
    expect(jianghuRank(state)).toBe(before);
  });

  it('worsening the rank number reports a "跌落" line on tier change', () => {
    initRng(3);
    const state = createNewLife(3);
    nudgeJianghuRank(state, -95000); // 推到低位先
    const lines = nudgeJianghuRank(state, 90000); // 推返上去，跨檔次
    expect(lines.some((l) => l.includes('跌落'))).toBe(true);
  });
});

describe('jianghu rank: combat outcomes drive rank up/down', () => {
  it('winning a normal fight improves rank (lower number)', () => {
    initRng(4);
    const state = createNewLife(4);
    const before = jianghuRank(state);
    applyCombatOutcomeRank(state, true, 'normal');
    expect(jianghuRank(state)).toBeLessThan(before);
  });

  it('losing a normal fight worsens rank (higher number)', () => {
    initRng(5);
    const state = createNewLife(5);
    // 開局已經係最差排名（99999），要先靠贏拉開少少距離，先驗證輸會令個位數字變大
    applyCombatOutcomeRank(state, true, 'strong');
    const before = jianghuRank(state);
    applyCombatOutcomeRank(state, false, 'normal');
    expect(jianghuRank(state)).toBeGreaterThan(before);
  });

  it('winning a boss fight swings rank far more than an ordinary win', () => {
    initRng(6);
    const stateBoss = createNewLife(6);
    const stateNormal = createNewLife(6);
    applyCombatOutcomeRank(stateBoss, true, 'boss');
    applyCombatOutcomeRank(stateNormal, true, 'normal');
    const bossGain = JIANGHU_RANK_START - jianghuRank(stateBoss);
    const normalGain = JIANGHU_RANK_START - jianghuRank(stateNormal);
    expect(bossGain).toBeGreaterThan(normalGain * 5);
  });

  it('losing a boss fight worsens rank more than losing an ordinary fight', () => {
    initRng(7);
    const stateBoss = createNewLife(7);
    const stateNormal = createNewLife(7);
    // 兩邊都先靠贏拉開排名距離，等出面仲有下跌空間
    applyCombatOutcomeRank(stateBoss, true, 'boss');
    applyCombatOutcomeRank(stateNormal, true, 'boss');
    const rankBeforeBoss = jianghuRank(stateBoss);
    const rankBeforeNormal = jianghuRank(stateNormal);
    applyCombatOutcomeRank(stateBoss, false, 'boss');
    applyCombatOutcomeRank(stateNormal, false, 'normal');
    const bossLoss = jianghuRank(stateBoss) - rankBeforeBoss;
    const normalLoss = jianghuRank(stateNormal) - rankBeforeNormal;
    expect(bossLoss).toBeGreaterThan(normalLoss);
  });
});

describe('jianghu rank: huashan placement drives large swings', () => {
  it('champion placement grants the single biggest jump', () => {
    initRng(8);
    const champion = createNewLife(8);
    const runnerUp = createNewLife(8);
    const top4 = createNewLife(8);
    const eliminated = createNewLife(8);
    applyHuashanPlacementRank(champion, 1);
    applyHuashanPlacementRank(runnerUp, 2);
    applyHuashanPlacementRank(top4, 4);
    applyHuashanPlacementRank(eliminated, 8);

    const gain = (s: typeof champion) => JIANGHU_RANK_START - jianghuRank(s);
    expect(gain(champion)).toBeGreaterThan(gain(runnerUp));
    expect(gain(runnerUp)).toBeGreaterThan(gain(top4));
    // 未入四強：唔算贏得注目大比，排名反倒略跌
    expect(jianghuRank(eliminated)).toBeGreaterThan(JIANGHU_RANK_START - 1);
  });

  it('recordHuashanPlacement tracks the best-ever placement regardless of later results', () => {
    initRng(9);
    const state = createNewLife(9);
    recordHuashanPlacement(state, 1);
    recordHuashanPlacement(state, 8);
    expect(Number(state.character.flags.jianghu_best_huashan_placement)).toBe(1);
  });
});

describe('jianghu rank: one-time achievement bonuses', () => {
  it('applyAchievementRankBonus only ever improves rank, never worsens it', () => {
    initRng(10);
    const state = createNewLife(10);
    const before = jianghuRank(state);
    applyAchievementRankBonus(state, 300);
    expect(jianghuRank(state)).toBeLessThan(before);
    expect(applyAchievementRankBonus(state, 0)).toEqual([]);
    expect(applyAchievementRankBonus(state, -50)).toEqual([]);
  });
});

describe('jianghuRankTier', () => {
  it('labels the expected boundaries', () => {
    expect(jianghuRankTier(1)).toBe('天下絕頂');
    expect(jianghuRankTier(100)).toBe('一流高手');
    expect(jianghuRankTier(1000)).toBe('嶄露頭角');
    expect(jianghuRankTier(10000)).toBe('略有薄名');
    expect(jianghuRankTier(99999)).toBe('江湖新丁');
  });
});
