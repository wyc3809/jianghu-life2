/**
 * 免費玉石「待入帳」：人生入面賺到嘅免費玉石先記喺角色（純函數、可存檔），
 * 再由帳戶層（src/store/ancestryStore.ts）搬入 AncestryMeta.jade.free。
 * 咁 core 唔使知帳戶，玉石亦唔會因為人生重開而唔見。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';

export function jadePending(state: LifeGameState): number {
  const v = Number(state.character.flags.jade_pending ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export function addJadePending(state: LifeGameState, amount: number): void {
  if (!(amount > 0)) return;
  state.character.flags.jade_pending = jadePending(state) + Math.floor(amount);
}

/** 搬走（返回搬咗幾多，角色歸零） */
export function takeJadePending(state: LifeGameState): number {
  const v = jadePending(state);
  if (v > 0) state.character.flags.jade_pending = 0;
  return v;
}
