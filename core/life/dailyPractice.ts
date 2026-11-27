import type { LifeGameState } from '@interfaces/lifeEngine';
import { economyDay } from './economyDay';

export const DAILY_PRACTICE_LIMIT = 5;
const LEGACY_MONTHLY_LIMIT = 3;
export const DAILY_PRACTICE_EXHAUSTED = '今日修煉次數已用完，香港時間凌晨 4 點重置。';

export function dailyPracticeLeft(state: LifeGameState, day = economyDay()): number {
  if (state.practiceActionDay && day > state.practiceActionDay) return DAILY_PRACTICE_LIMIT;
  return Math.max(0, Math.min(DAILY_PRACTICE_LIMIT, Math.floor(state.practiceActionsLeft ?? DAILY_PRACTICE_LIMIT)));
}

export function spendDailyPractice(state: LifeGameState, day: string): void {
  state.practiceActionsLeft = dailyPracticeLeft(state, day) - 1;
  if (!state.practiceActionDay || day > state.practiceActionDay) state.practiceActionDay = day;
}

/** 首次讀取舊檔時，把已用的本月次數計入存檔當日。 */
export function migrateDailyPractice(state: LifeGameState, day: string): void {
  if (state.practiceActionDay) return;
  const oldLeft = Math.max(0, Math.min(LEGACY_MONTHLY_LIMIT, Math.floor(state.practiceActionsLeft ?? LEGACY_MONTHLY_LIMIT)));
  const oldUsed = LEGACY_MONTHLY_LIMIT - oldLeft;
  state.practiceActionsLeft = DAILY_PRACTICE_LIMIT - oldUsed;
  if (oldUsed) state.practiceActionDay = day;
}
