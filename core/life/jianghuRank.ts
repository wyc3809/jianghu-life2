import type { LifeGameState, PendingCombat } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';

/** 江湖排名：開局第 99999 位，隨交手勝負即時升跌（勝升敗跌，數字越細代表名次越前） */
export const JIANGHU_RANK_START = 99999;

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
 * 核心：直接調整排名數字（delta 為正＝退步，為負＝進步），clamp 喺 [1, 99999]。
 * 只喺跨檔次或單次波幅夠大時先回敘事行，避免小幅波動洗版。
 */
export function nudgeJianghuRank(state: LifeGameState, delta: number): string[] {
  if (!delta) return [];
  const prev = jianghuRank(state);
  const next = Math.max(1, Math.min(JIANGHU_RANK_START, Math.round(prev + delta)));
  if (next === prev) return [];
  state.character.flags.jianghu_rank = next;
  const prevTier = jianghuRankTier(prev);
  const nextTier = jianghuRankTier(next);
  const verb = next < prev ? '躍升' : '跌落';
  if (nextTier !== prevTier) {
    return [`江湖排名${verb}至第 ${next} 位——${nextTier}。`];
  }
  if (Math.abs(delta) >= 500) {
    return [`江湖排名${verb}至第 ${next} 位。`];
  }
  return [];
}

function foePowerScale(foePower: PendingCombat['foePower'] | undefined): number {
  if (foePower === 'weak') return 0.5;
  if (foePower === 'strong') return 1.8;
  return 1; // normal / undefined
}

/**
 * 一般交手（路遇／師門比武／江湖遇敵）：贏升輸跌；頭目戰波動幅度大得多，
 * 呼應「贏到重要比試會大幅上升」的要求。
 */
export function applyCombatOutcomeRank(
  state: LifeGameState,
  won: boolean,
  foePower: PendingCombat['foePower'] | undefined,
): string[] {
  const rng = getRng();
  const isBoss = foePower === 'boss';
  const delta = won
    ? isBoss
      ? -rng.nextInt(2000, 5000)
      : -Math.round(rng.nextInt(40, 90) * foePowerScale(foePower))
    : isBoss
      ? rng.nextInt(200, 500)
      : Math.round(rng.nextInt(20, 60) * foePowerScale(foePower));
  return nudgeJianghuRank(state, delta);
}

/**
 * 華山論劍名次：冠軍／亞軍／四強大幅躍升；未入四強反倒略為跌落
 * （論劍係江湖矚目大比試，名次唔夠好都算一種「輸」）。
 */
export function applyHuashanPlacementRank(state: LifeGameState, placement: number): string[] {
  const rng = getRng();
  let delta: number;
  if (placement === 1) delta = -rng.nextInt(6000, 10000);
  else if (placement === 2) delta = -rng.nextInt(2500, 4000);
  else if (placement <= 4) delta = -rng.nextInt(800, 1500);
  else delta = rng.nextInt(100, 300);
  return nudgeJianghuRank(state, delta);
}

/**
 * 成就類一次性推進（新稱號／開宗立派／收徒出師）：唔係持續按數值背景重算，
 * 只喺達成當刻俾一截固定加成，避免同「勝負驅動」嘅設計矛盾。
 */
export function applyAchievementRankBonus(state: LifeGameState, points: number): string[] {
  if (points <= 0) return [];
  return nudgeJianghuRank(state, -points);
}

/** 論劍名次記錄生平最佳（數字越細代表名次越前），供其他系統參考（如稱號判定） */
export function recordHuashanPlacement(state: LifeGameState, placement: number): void {
  const c = state.character;
  const best = Number(c.flags.jianghu_best_huashan_placement ?? Number.POSITIVE_INFINITY);
  if (placement < best) c.flags.jianghu_best_huashan_placement = placement;
}
