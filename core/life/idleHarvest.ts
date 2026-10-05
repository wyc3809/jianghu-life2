/**
 * 掛機收成（design/agreed-design-2026-10.md §4、§5）：銀兩喺線上同離線都慢慢累積，
 * 最多存 48 小時嘅量，玩家撳「收成」先入銀兩。速率屬測試參數（data/redesign/testParams.ts）。
 * 純算術、唔用 RNG。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  TEST_IDLE_SILVER_BASE_PER_HOUR,
  TEST_IDLE_SILVER_PER_STAGE_PER_HOUR,
} from '@data/redesign/testParams';
import { sparSavedStage } from './sparDuel';

/** 同離線修為一樣：最多計 48 小時 */
export const IDLE_HARVEST_CAP_HOURS = 48;

/** 每小時掛機銀兩 */
export function idleSilverPerHour(state: LifeGameState): number {
  return TEST_IDLE_SILVER_BASE_PER_HOUR + TEST_IDLE_SILVER_PER_STAGE_PER_HOUR * sparSavedStage(state);
}

/** 待收成上限（48 小時嘅量） */
export function idleSilverCap(state: LifeGameState): number {
  return Math.floor(idleSilverPerHour(state) * IDLE_HARVEST_CAP_HOURS);
}

/** 待收成（有小數，顯示時取整） */
export function idleSilverPending(state: LifeGameState): number {
  const v = Number(state.character.flags.idle_silver ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/** 累積一段時間（秒）；返回今次加咗幾多 */
export function accrueIdleSilver(state: LifeGameState, seconds: number): number {
  if (!(seconds > 0) || !state.character.alive || state.phase !== 'playing') return 0;
  const before = idleSilverPending(state);
  const after = Math.min(idleSilverCap(state), before + (idleSilverPerHour(state) * seconds) / 3600);
  state.character.flags.idle_silver = Math.max(before, after);
  return Math.max(0, after - before);
}

/** 收成：整數部份入銀兩，小數留低；返回收咗幾多 */
export function harvestIdleSilver(state: LifeGameState): number {
  const pending = idleSilverPending(state);
  const amount = Math.floor(pending);
  if (amount <= 0) return 0;
  const c = state.character;
  c.money += amount;
  c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
  c.flags.idle_silver = pending - amount;
  return amount;
}
