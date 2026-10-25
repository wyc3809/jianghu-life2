/**
 * 歸隱傳位（2026-10-25 審計 C2）：取消老死之後，「死亡 → 總結 → 傳承」好難去到。
 * 玩家可以喺第 RETIRE_MIN_TIER 境起自願歸隱；「金盆洗手」事件唔限境界。
 * 結算同死亡完全一樣（傳承點、家傳武學、銀庫、裝備庫照現有規則），只係死因寫歸隱。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import { RETIRE_MIN_TIER } from '@data/redesign/testParams';
import { recordDeath } from './death';
import { buildLifeSummary } from './summary';
import { pushChronicle } from './chronicle';

export const RETIRE_CAUSE = '金盆洗手，歸隱山林。';

/** 而家可唔可以主動歸隱；唔得就講原因（介面顯示） */
export function canRetire(state: LifeGameState): { ok: boolean; reason?: string } {
  if (!state.character.alive || state.phase !== 'playing') return { ok: false, reason: '此生已了。' };
  if (state.pending || state.pendingCombat) return { ok: false, reason: '眼前尚有未了之事。' };
  if ((state.character.cultivation?.tier ?? 0) < RETIRE_MIN_TIER) return { ok: false, reason: `修為須達第 ${RETIRE_MIN_TIER} 境方可歸隱。` };
  return { ok: true };
}

/** 結束今世、入總結頁；之後由「後人接班」照常傳承。force＝事件觸發，唔睇境界門檻 */
export function retireLife(state: LifeGameState, force = false): boolean {
  if (!force && !canRetire(state).ok) return false;
  if (!state.character.alive || state.phase !== 'playing') return false;
  state.character.flags.retired = true;
  recordDeath(state, RETIRE_CAUSE);
  state.phase = 'summary';
  state.summaryText = buildLifeSummary(state);
  pushChronicle(state, [RETIRE_CAUSE]);
  return true;
}
