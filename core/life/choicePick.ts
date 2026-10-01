/**
 * 事件二選一：每個事件出現時最多只顯示兩個選項（左掃甲、右掃乙）。
 *
 * - 合資格選項 ≤ 2：照原樣。
 * - 多過 2：用「存檔種子＋事件＋年月」做雜湊抽兩個——同一次事件重新載入都係同一對，
 *   唔會 reroll；下次再遇到同一事件（唔同年月）就可能抽到另一對。
 * - 有條件先解鎖嘅選項（requirements）優先入選：玩家練出嚟嘅路唔會被抽走。
 * - 抽中嘅兩個保持原本次序（甲喺前、乙喺後）。
 *
 * 用雜湊而唔用 getRng()：唔好推進模擬 RNG，免得改咗事件結果嘅隨機序列。
 */

/** FNV-1a 32 位雜湊 */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface PickableChoice {
  id: string;
  requirements?: unknown;
}

/** 抽選 key：同一次事件（年月）固定 */
export function choicePickKey(seed: number, eventId: string, year: number, month: number | undefined): string {
  return `${seed}|${eventId}|${year}|${month ?? 0}`;
}

export const SWIPE_CHOICE_COUNT = 2;

export function pickSwipeChoices<T extends PickableChoice>(choices: readonly T[], key: string): T[] {
  if (choices.length <= SWIPE_CHOICE_COUNT) return [...choices];
  const hasReq = (c: T) =>
    typeof c.requirements === 'object' && c.requirements !== null && Object.keys(c.requirements).length > 0;
  const ranked = choices
    .map((c, i) => ({ c, i, gated: hasReq(c), h: hash32(`${key}|${c.id}`) }))
    .sort((a, b) => Number(b.gated) - Number(a.gated) || a.h - b.h);
  return ranked
    .slice(0, SWIPE_CHOICE_COUNT)
    .sort((a, b) => a.i - b.i)
    .map((r) => r.c);
}
