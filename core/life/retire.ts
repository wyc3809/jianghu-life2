/**
 * 歸隱（2026-10-25 審計 C2 加入）：結束今世、入一生總結。「金盆洗手」事件唔限境界。
 * 2026-11-15 第 80 項暫停傳承之後：人物頁「歸隱傳位」入口已撤，歸隱唔再帶任何傳承；
 * store 嘅 retire 同 canRetire 留畀日後恢復傳承時用（見 design/audits/feature-links-ea0116.md L2、L3）。
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

/** 結束今世、入總結頁（傳承暫停期間唔帶任何傳承）。force＝事件觸發，唔睇境界門檻 */
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
