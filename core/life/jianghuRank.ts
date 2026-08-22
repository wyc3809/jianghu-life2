import type { LifeGameState } from '@interfaces/lifeEngine';
import { allTitles } from './titles';

/** 江湖排名：開局第 99999 位，隨聲望／武學／稱號／論劍名次爬升 */
export const JIANGHU_RANK_START = 99999;

/** 只計最強 3 個稱號（同 topTitles 一致），每階 tier 值 40 分 */
function titleScore(state: LifeGameState): number {
  return allTitles(state)
    .slice(0, 3)
    .reduce((sum, t) => sum + t.tier * 40, 0);
}

/** 論劍名次：只計生平最佳一次（冠軍＞亞軍＞四強＞其他），非逐次累加，避免無限刷分 */
function huashanScore(state: LifeGameState): number {
  const best = Number(state.character.flags.jianghu_best_huashan_placement ?? 0);
  if (!best) return 0;
  if (best === 1) return 6000;
  if (best === 2) return 3000;
  if (best <= 4) return 1200;
  return 400;
}

export function computeJianghuScore(state: LifeGameState): number {
  const c = state.character;
  return c.martial * 4 + Math.max(0, c.reputation) * 3 + titleScore(state) + huashanScore(state);
}

/**
 * 分數轉排名：指數衰減。普通角色多止步萬位上下，頂尖高手（高武學＋高名望＋
 * 論劍奪冠）可躋身百位甚至十位內，但幾乎無法真正做到「第一位」——
 * 呼應「天下第一」始終是傳說而非常態的武俠基調。
 */
const RANK_DECAY_K = 6000;

export function scoreToRank(score: number): number {
  const decay = Math.exp(-Math.max(0, score) / RANK_DECAY_K);
  const rank = Math.round(JIANGHU_RANK_START * decay);
  return Math.max(1, Math.min(JIANGHU_RANK_START, rank));
}

export function jianghuRank(state: LifeGameState): number {
  const stored = Number(state.character.flags.jianghu_rank ?? JIANGHU_RANK_START);
  return Number.isFinite(stored) && stored > 0 ? stored : JIANGHU_RANK_START;
}

export function jianghuRankTier(rank: number): string {
  if (rank <= 10) return '天下絕頂';
  if (rank <= 100) return '一流高手';
  if (rank <= 1000) return '嶄露頭角';
  if (rank <= 10000) return '略有薄名';
  return '江湖新丁';
}

/**
 * 每月同步：排名只升不跌（生平最佳名次不會平白倒退）。
 * 回傳排名躍升「檔次」時的敘事行；同檔次內的小幅進步不刷屏。
 */
export function syncJianghuRank(state: LifeGameState): string[] {
  const c = state.character;
  const prevRank = jianghuRank(state);
  const nextRank = scoreToRank(computeJianghuScore(state));
  if (nextRank >= prevRank) return [];
  c.flags.jianghu_rank = nextRank;
  const prevTier = jianghuRankTier(prevRank);
  const nextTier = jianghuRankTier(nextRank);
  if (nextTier === prevTier) return [];
  return [`江湖排名躍升至第 ${nextRank} 位——${nextTier}。`];
}

/** 論劍名次記錄生平最佳（數字越細代表名次越前），供 huashan.ts 於賽後呼叫 */
export function recordHuashanPlacement(state: LifeGameState, placement: number): void {
  const c = state.character;
  const best = Number(c.flags.jianghu_best_huashan_placement ?? Number.POSITIVE_INFINITY);
  if (placement < best) c.flags.jianghu_best_huashan_placement = placement;
}
