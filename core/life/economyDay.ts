const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_OFFSET_MS = 4 * 60 * 60 * 1000;

/** 香港時間每日凌晨四時換日。 */
export function economyDay(now = Date.now()): string {
  return new Date(now + RESET_OFFSET_MS).toISOString().slice(0, 10);
}

export function untilEconomyDayReset(now: number): number {
  return DAY_MS - ((now + RESET_OFFSET_MS) % DAY_MS);
}
