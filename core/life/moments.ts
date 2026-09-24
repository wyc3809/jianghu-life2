/**
 * 特效時刻佇列：學新武學、武學升階、稱號晉升、受傷／醫殘喺遊戲邏輯發生嗰刻入隊，
 * UI（InkMomentFx）逐個播放全屏儀式，播完 shiftMoment 移除。
 * 放喺存檔入面：關咗遊戲再開，未播嘅時刻仍然會播。
 */
import type { LifeGameState, LifeMoment } from '@interfaces/lifeEngine';

/** 最多保留幾個未播時刻（一次過爆出嚟太多會變煩；超出就捨棄最舊） */
export const MOMENT_QUEUE_CAP = 4;

export function pushMoment(state: LifeGameState, moment: LifeMoment): void {
  const q = state.moments ?? [];
  q.push(moment);
  while (q.length > MOMENT_QUEUE_CAP) {
    // 超出上限：先丟最舊嘅輕傷（最唔重要），冇先丟最舊
    const light = q.findIndex((m) => m.kind === 'injury' && m.tier === 'light');
    q.splice(light >= 0 ? light : 0, 1);
  }
  state.moments = q;
}

/** 取出最早一個待播時刻；冇就回 null */
export function shiftMoment(state: LifeGameState): LifeMoment | null {
  if (!state.moments?.length) return null;
  const [first, ...rest] = state.moments;
  state.moments = rest;
  return first ?? null;
}
