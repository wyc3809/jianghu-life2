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

describe('書頁及混合結果演出只讀入帳資料', () => {
  const pageResult = { kind: 'pages' as const, id: 'manual-pages' as const, pages: 5, isNew: false as const, isWish: false as const, isPremium: false as const };
  it('test_單抽書頁_顯示碎片真數量不假裝新武功或珍本', () => {
    const noSkill = () => { throw new Error('書頁不可查武學名稱／說明'); };
    const cfg = gachaHighlight([pageResult], noSkill, noSkill, jade)!;
    expect(cfg.revealTitle).toBe('書頁入帳'); expect(cfg.targetGrade).toBe(0);
    expect(cfg.revealSub).toContain('書頁＋5'); expect(cfg.revealSub).not.toContain('1 卷秘笈');
    expect(cfg.rewards[0]).toMatchObject({ name: '書頁', rewardKind: 'pages', amount: 5, grade: 0, isNew: false, isPremium: false, isWish: false });
    expect(cfg.rewards[0].identityLabel).toBe('秘笈碎片 · 已入帳5頁');
    expect(cfg.rewards[0].flyTo).toBeUndefined(); expect(cfg.claimLabel).toBe('完成');
  });
  it('test_十連全書頁_十份卡唯一身份總數真實且無武功新得', () => {
    const cfg = gachaHighlight(Array.from({ length: 10 }, () => ({ ...pageResult })), id => id, () => '', jade)!;
    expect(cfg.rewards).toHaveLength(10); expect(new Set(cfg.rewards.map(c => c.id)).size).toBe(10);
    expect(cfg.revealSub).toBe('書頁＋50 · 已加入帳戶');
    expect(cfg.rewards.reduce((n, c) => n + (c.amount ?? 0), 0)).toBe(50);
  });
  it('test_混合心願與書頁_保留順序稀有度卷數及原始結果不變', () => {
    const results = [pageResult, { ...r('a', { isNew: true, isWish: true }), vol: 6 }, pageResult];
    const before = structuredClone({ results, jade });
    const cfg = gachaHighlight(results, () => '長河拳', () => '既有武學', jade)!;
    expect(cfg.revealTitle).toBe('心願得償'); expect(cfg.targetGrade).toBe(5);
    expect(cfg.revealSub).toContain('書頁＋10'); expect(cfg.rewards.map(c => c.rewardKind)).toEqual(['pages', 'art', 'pages']);
    expect(cfg.rewards[1].name).toBe('長河拳·卷六'); expect(cfg.rewards[1].isPremium).toBe(false);
    expect(cfg.rewards[1].identityLabel).toBe('江湖 · 新得 · 心願');
    expect({ results, jade }).toEqual(before);
  });
});
