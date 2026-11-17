/**
 * 門派會武本屆榮銜（2026-11-16 連動檢視 L5）：
 * 會武總覽入面本屆十名代表係伺服器鎖定嘅，客戶端讀到自己席次就：
 *   - 記低本屆榮銜（門派、可穿職位服地位、到期時間＝下次換屆），制服資格會讀埋（interfaces/costumes.ts）
 *   - 排一次本屆俸祿玉石入帳戶獎勵佇列（每屆一次，帳戶結算防重覆）
 * 純函數，唔碰 RNG。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import { sectWarSeatJade, sectWarSeatStanding } from '@data/redesign/sectWarTestParams';
import { queueAccountReward } from './accountEconomy';

export interface SectWarSeat {
  term: number;
  sectId: string;
  /** 本屆席次 1–10 */
  rank: number;
  /** 下次換屆時間（ms），榮銜到呢刻失效 */
  until: number;
}

/** 寫入本屆榮銜並排俸祿；同一屆再叫唔會重覆派。回傳有冇改動 */
export function applySectWarSeat(state: LifeGameState, seat: SectWarSeat): boolean {
  const c = state.character;
  if (!c.alive || c.sectId !== seat.sectId) return false;
  if (!(seat.rank >= 1 && seat.rank <= 10) || !Number.isSafeInteger(seat.term)) return false;
  const standing = sectWarSeatStanding(seat.rank);
  const before = JSON.stringify([c.flags.sect_war_sect, c.flags.sect_war_standing, c.flags.sect_war_until, c.flags.account_reward_queue]);
  c.flags.sect_war_sect = seat.sectId;
  c.flags.sect_war_standing = standing;
  c.flags.sect_war_until = seat.until;
  queueAccountReward(state, `sectwar:${seat.term}`, sectWarSeatJade(seat.rank));
  return before !== JSON.stringify([c.flags.sect_war_sect, c.flags.sect_war_standing, c.flags.sect_war_until, c.flags.account_reward_queue]);
}
