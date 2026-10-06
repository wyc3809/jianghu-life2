import { describe, expect, it } from 'vitest';
import { gachaHighlight } from '../src/fx/highlight/fromGame';

const r = (id: string, o: Partial<{ isNew: boolean; isWish: boolean; isPremium: boolean }> = {}) => ({
  id,
  isNew: false,
  isWish: false,
  isPremium: false,
  ...o,
});
const jade = { free: 120, paidTest: 0 };

describe('gachaHighlight（抽卡用武學令演出）', () => {
  it('test_empty_results_returns_null', () => {
    expect(gachaHighlight([], (id) => id, () => undefined, jade)).toBeNull();
  });

  it('test_wish_hit_is_top_grade_and_titled', () => {
    const cfg = gachaHighlight([r('a', { isNew: true }), r('b', { isWish: true, isNew: true })], (id) => id, () => undefined, jade)!;
    expect(cfg.subject).toBe('token');
    expect(cfg.targetGrade).toBe(5);
    expect(cfg.revealTitle).toBe('心願得償');
  });

  it('test_duplicate_pulls_get_unique_card_ids', () => {
    const cfg = gachaHighlight([r('a'), r('a'), r('a')], (id) => id, () => undefined, jade)!;
    expect(new Set(cfg.rewards.map((c) => c.id)).size).toBe(3);
    expect(cfg.revealTitle).toBe('書頁盈篋');
    expect(cfg.targetGrade).toBe(1);
  });
});
