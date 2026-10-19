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

describe('gachaHighlight（抽卡秘笈啟封，只呈現已結算結果）', () => {
  it('test_empty_results_returns_null', () => {
    expect(gachaHighlight([], (id) => id, () => undefined, jade)).toBeNull();
  });

  it('test_wish_hit_is_top_grade_and_titled', () => {
    const cfg = gachaHighlight([r('a', { isNew: true }), r('b', { isWish: true, isNew: true })], (id) => id, () => undefined, jade)!;
    expect(cfg.subject).toBe('codex');
    expect(cfg.targetGrade).toBe(5);
    expect(cfg.revealTitle).toBe('心願得償');
  });

  it('test_duplicate_pulls_get_unique_card_ids', () => {
    const cfg = gachaHighlight([r('a'), r('a'), r('a')], (id) => id, () => undefined, jade)!;
    expect(new Set(cfg.rewards.map((c) => c.id)).size).toBe(3);
    expect(cfg.revealTitle).toBe('藏本增益');
    expect(cfg.targetGrade).toBe(1);
  });

  it('test_一般心願命中_保留江湖身份唔冒充珍本', () => {
    const cfg = gachaHighlight([r('a', { isWish: true })], id => id, () => '', jade)!;
    expect(cfg.targetGrade).toBe(5);
    expect(cfg.rewards[0].identityLabel).toBe('江湖 · 重複 · 心願');
    expect(cfg.rewards[0].isPremium).toBe(false);
  });

  it('test_十連重複含不同卷_順序卷數及入帳資料保持原樣', () => {
    const results = Array.from({ length: 10 }, (_, i) => ({ ...r('a', { isPremium: i === 4, isNew: i === 4 }), vol: i % 7 + 1 }));
    const before = structuredClone({ results, jade });
    const cfg = gachaHighlight(results, () => '長河拳', () => '既有武學', jade)!;
    expect(cfg.rewards).toHaveLength(10);
    expect(cfg.rewards[0].name).toBe('長河拳·卷一');
    expect(cfg.rewards[7].name).toBe('長河拳·卷一');
    expect(cfg.rewards[4].identityLabel).toBe('珍本 · 新得');
    expect(cfg.rewards.every(card => card.flyTo === undefined && card.amount === undefined)).toBe(true);
    expect({ results, jade }).toEqual(before);
  });
});
