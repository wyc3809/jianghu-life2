import { describe, expect, it } from 'vitest';
import { choicePickKey, pickSwipeChoices } from '../core/life/choicePick';

const three = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('choice pick (事件二選一)', () => {
  it('test_two_or_fewer_choices_unchanged', () => {
    expect(pickSwipeChoices([{ id: 'a' }, { id: 'b' }], 'k')).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(pickSwipeChoices([{ id: 'a' }], 'k')).toEqual([{ id: 'a' }]);
  });

  it('test_three_choices_pick_two_in_original_order_and_stable_for_same_key', () => {
    const key = choicePickKey(42, 'ev_x', 18, 3);
    const a = pickSwipeChoices(three, key);
    expect(a).toHaveLength(2);
    expect(three.indexOf(a[0]!)).toBeLessThan(three.indexOf(a[1]!));
    // 同一次事件重新載入：同一對
    expect(pickSwipeChoices(three, key).map((c) => c.id)).toEqual(a.map((c) => c.id));
  });

  it('test_different_months_can_pick_different_pairs', () => {
    const pairs = new Set<string>();
    for (let m = 1; m <= 12; m++) {
      pairs.add(pickSwipeChoices(three, choicePickKey(7, 'ev_y', 20, m)).map((c) => c.id).join(','));
    }
    expect(pairs.size).toBeGreaterThan(1);
  });

  it('test_gated_choice_always_kept', () => {
    const withGate = [{ id: 'a' }, { id: 'b' }, { id: 'c', requirements: { minAttr: { wuXing: 8 } } }];
    for (let m = 1; m <= 12; m++) {
      const ids = pickSwipeChoices(withGate, choicePickKey(3, 'ev_z', 30, m)).map((c) => c.id);
      expect(ids).toContain('c');
    }
  });
});
