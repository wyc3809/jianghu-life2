/**
 * 壽元線：唔係精確嘅剩餘壽命計算（人生本身就無定數），淨係按
 * core/life/monthly.ts 嘅老衰／天年機率斷點（65 歲起額外衰弱、
 * 72 歲後 (age-70)/160 機率老死）校準嘅「感覺」曲線，俾玩家喺
 * 頂欄見到一條會慢慢見底嘅線，帶出「歲月不留人」嘅壓力感。
 *
 * 分段線性：0–65 緩降（100→70）、65–72 加快（70→50）、
 * 72–85 明顯見底（50→0），呼應交手/事件節奏，唔追求統計精確。
 */

const FRAILTY_AGE = 65;
const MORTALITY_AGE = 72;
const ENDGAME_AGE = 85;

function clampPct(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x)));
}

/** 剩餘壽元百分比（0-100），隨年齡遞減，越後段跌得越快 */
export function lifespanRemainingPercent(age: number): number {
  if (age <= 0) return 100;
  if (age <= FRAILTY_AGE) {
    return clampPct(100 - (age / FRAILTY_AGE) * 30);
  }
  if (age <= MORTALITY_AGE) {
    return clampPct(70 - ((age - FRAILTY_AGE) / (MORTALITY_AGE - FRAILTY_AGE)) * 20);
  }
  if (age >= ENDGAME_AGE) return 0;
  return clampPct(50 - ((age - MORTALITY_AGE) / (ENDGAME_AGE - MORTALITY_AGE)) * 50);
}

/** 是否已入「歲月催人」嘅警示區（UI 轉暖色提示） */
export function isLifespanUrgent(age: number): boolean {
  return age >= FRAILTY_AGE;
}
