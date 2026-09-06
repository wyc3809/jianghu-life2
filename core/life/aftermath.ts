import type { LifeGameState } from '@interfaces/lifeEngine';
import { syncRngFromState, snapshotRng } from './gameState';
import { recordGrudgeFromDisposition, tickGrudgeBook } from './grudgeBook';

export const BLOOD_FOE = 'aftermath_blood_foe';
export const PENDING_REVENGE = 'pending_revenge_foe';
export const PENDING_BLOOD = 'pending_blood_foe';

/**
 * 戰後處置：恩怨入簿，後續暗中排期（不另行告知）。
 * 文本只落一句「待續」（尚有後續）或「完滿」（此事已了）。
 * chainEnd 為 true 時（舊怨／血債系列的最終一戰），恩怨到此為止，一律「完滿」。
 */
export function recordDispositionAftermath(
  state: LifeGameState,
  disposition: 'kill' | 'release' | 'stun' | 'cripple',
  foeName: string,
  chainEnd = false,
): string[] {
  const c = state.character;
  syncRngFromState(state);
  if (disposition === 'kill') {
    // 留名供舊事重提（legacy 主題用）；不再設風聲旗標
    c.flags[BLOOD_FOE] = foeName;
  } else if (disposition === 'stun' || disposition === 'cripple') {
    c.flags['aftermath_stun_soft'] = (Number(c.flags['aftermath_stun_soft'] ?? 0) || 0) + 1;
  }
  const followUp = chainEnd ? false : recordGrudgeFromDisposition(state, disposition, foeName);
  snapshotRng(state);
  return [followUp ? '【待續】' : '【完滿】'];
}

/**
 * 每月暗中推進恩怨簿：到期者或再啟戰端（只寫 pending 旗標，由 startMonth 開戰），
 * 或悄無聲息地了結。全程不落文字——玩家只在事發時見到結果。
 */
export function tickAftermath(state: LifeGameState): void {
  if (!state.character.alive) return;
  syncRngFromState(state);
  tickGrudgeBook(state);
  snapshotRng(state);
}
