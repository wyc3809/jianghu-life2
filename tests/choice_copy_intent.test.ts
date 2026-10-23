import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { applyChoice } from '../core/life/eventEngine';
import { RANDOM_PACK_EVENTS } from '../core/life/packAdapter';

/** 只遮去玩家可見文字，所有數值、旗標名稱、RNG及結構均須相同。 */
function withoutCopy(value: unknown): unknown {
  if (typeof value === 'string') return /[\u3400-\u9fff]/.test(value) ? '__COPY__' : value;
  if (Array.isArray(value)) return value.map(withoutCopy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withoutCopy(v)]));
  return value;
}

describe('選項顯示文字與既有玩法語意分離', () => {
  it('test_copy_三百個選項改名_心性關路數值旗標及RNG均沿用舊語意', () => {
    let checked = 0;
    for (const event of RANDOM_PACK_EVENTS) {
      for (const choice of event.choices) {
        expect(choice.mechanicsText).toBeTruthy();
        const before = createNewLife(42);
        before.character.flags.newbie_done = true;
        const after = structuredClone(before);
        const oldLabels = { ...event, choices: event.choices.map(c => ({ ...c, text: c.mechanicsText!, mechanicsText: undefined })) };
        const oldResult = applyChoice(before, oldLabels, choice.id);
        const newResult = applyChoice(after, event, choice.id);
        expect(withoutCopy(newResult), `${event.id}:${choice.id}`).toEqual(withoutCopy(oldResult));
        expect(after.rngState).toBe(before.rngState);
        checked += 1;
      }
    }
    expect(checked).toBe(300);
  });
});
