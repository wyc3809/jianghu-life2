import type { LifeGameState } from '@interfaces/lifeEngine';

/**
 * 行動力池：處理事件會即時扣減，隨真實時間緩慢回復——避免玩家可以不停狂㩒
 * 事件選項。同修為（cultivation.ts）一樣行實時 tick，唔靠遊戲內月結。
 */

export const ACTION_POINT_MAX = 100;
export const EVENT_ACTION_POINT_COST = 5;
/** 回復速度：每 10 分鐘回 5 點（即扣一次事件代價後約 10 分鐘回滿） */
const ACTION_POINT_REGEN_PER_SEC = 5 / 600;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function hasEnoughActionPoints(state: LifeGameState, cost = EVENT_ACTION_POINT_COST): boolean {
  return (state.character.actionPoints ?? 0) >= cost;
}

export function spendActionPoints(state: LifeGameState, amount: number): void {
  const c = state.character;
  c.actionPoints = clamp((c.actionPoints ?? 0) - amount, 0, ACTION_POINT_MAX);
}

/** 純算術、deterministic：唔碰 RNG，同 tickCultivation 一齊喺同一個 real-time ticker 調用 */
export function tickActionPoints(state: LifeGameState, deltaSeconds: number): void {
  if (deltaSeconds <= 0) return;
  if (!state.character.alive || state.phase !== 'playing') return;
  const c = state.character;
  c.actionPoints = clamp((c.actionPoints ?? 0) + ACTION_POINT_REGEN_PER_SEC * deltaSeconds, 0, ACTION_POINT_MAX);
}
