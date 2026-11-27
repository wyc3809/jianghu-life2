/**
 * 特效時刻佇列：學新武學、稱號晉升、受傷／醫殘喺遊戲邏輯發生嗰刻入隊，
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

export type LearnMoment = Extract<LifeMoment, { kind: 'learn' }>;

/** 只選本次結算新加入的習得演出，並保留實際佇列項目供確認。 */
export function newlyLearnedMoments(previous: LifeGameState, next: LifeGameState): LearnMoment[] {
  return (next.moments ?? []).filter((moment): moment is LearnMoment =>
    moment.kind === 'learn' && !previous.moments?.includes(moment));
}

/** 取出已播放時刻；預設取佇列最早項目。 */
export function shiftMoment(state: LifeGameState, index = 0): LifeMoment | null {
  if (!state.moments?.[index]) return null;
  return state.moments.splice(index, 1)[0] ?? null;
}
