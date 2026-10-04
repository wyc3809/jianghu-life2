import type { LifeGameState } from '@interfaces/lifeEngine';
import { computeMeritGain } from './ancestry';
import { achievementProgress } from './achievements';
import { jianghuRank } from './jianghuRank';

/**
 * 排行榜數值（純函數，唔碰 RNG）：雲端上傳前喺度統一計，UI 同測試共用。
 * - 現世榜：江湖排名（越細越前）、修為境界（境界高先，同境比修為）
 * - 一生榜：一生總結分＝祖蔭公式未封頂合計 ×10 ＋ 已解鎖成就 ×5
 *   （沿用 design/gdd/ancestral-merit.md 嘅「壽數／武學／名望／境界／稱號／血脈」，唔另起爐灶）
 */

export const LIFE_SCORE_MERIT_WEIGHT = 10;
export const LIFE_SCORE_ACHIEVEMENT_WEIGHT = 5;
export const BOARD_NAME_MAX = 24;

export function lifeScore(state: LifeGameState): number {
  const merit = computeMeritGain(state).parts.reduce((s, p) => s + p.value, 0);
  const ach = achievementProgress(state).unlocked;
  return merit * LIFE_SCORE_MERIT_WEIGHT + ach * LIFE_SCORE_ACHIEVEMENT_WEIGHT;
}

/** 榜上名號：角色名，去頭尾空白、截長 */
export function boardName(state: LifeGameState): string {
  const raw = (state.character.name ?? '').trim() || '無名氏';
  return [...raw].slice(0, BOARD_NAME_MAX).join('');
}

export interface LiveBoardEntry {
  name: string;
  jianghu_rank: number;
  cult_tier: number;
  cult_xp: number;
  age: number;
}

export function liveBoardEntry(state: LifeGameState): LiveBoardEntry {
  const c = state.character;
  return {
    name: boardName(state),
    jianghu_rank: Math.max(1, Math.min(99999, Math.round(jianghuRank(state)))),
    cult_tier: Math.max(0, Math.min(14, Math.floor(c.cultivation?.tier ?? 0))),
    cult_xp: Math.max(0, Math.floor(c.cultivation?.xp ?? 0)),
    age: Math.max(0, Math.min(200, Math.floor(c.age))),
  };
}

/** 一世嘅唯一 key：同一世重複上傳只記一次 */
export function lifeKey(state: LifeGameState): string {
  const gen = Number(state.character.flags.legacy_generation ?? 1) || 1;
  return `${state.seed}:${gen}`.slice(0, 64);
}

export interface LifeScoreEntry {
  life_key: string;
  name: string;
  score: number;
  age: number;
  cult_tier: number;
}

export function lifeScoreEntry(state: LifeGameState): LifeScoreEntry {
  const live = liveBoardEntry(state);
  return {
    life_key: lifeKey(state),
    name: live.name,
    score: Math.max(0, Math.min(100000, lifeScore(state))),
    age: live.age,
    cult_tier: live.cult_tier,
  };
}
