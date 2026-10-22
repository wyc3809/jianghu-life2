import { describe, expect, it } from 'vitest';
import { emptyAncestry, parseAncestry } from '../core/life/ancestry';
import { bannerState, FREE_POOL, PREMIUM_POOL, pull, setWish, type BannerId } from '../core/life/gacha';
import { GACHA_ART_RATE, GACHA_COST_PER_PULL, GACHA_PAGES_PER_PULL, GACHA_WISH_PITY } from '../data/redesign/testParams';
import { getRng, initRng } from '../core/random';

function funded(n = 100) {
  const meta = emptyAncestry();
  meta.jade = { free: GACHA_COST_PER_PULL * n, paidTest: GACHA_COST_PER_PULL * n };
  return meta;
}

describe('抽卡二成武功／八成書頁', () => {
  it('test_gacha_固定非保底樣本_武功約兩成書頁約八成及數量真入帳', () => {
    const m = funded(20000); m.pages = 7;
    const results = pull(m, 'jianghu', 20000)!;
    const arts = results.filter(r => r.kind === 'art'), pages = results.filter(r => r.kind === 'pages');
    expect(GACHA_ART_RATE).toBe(.2);
    expect(arts.length / results.length).toBeGreaterThan(.19);
    expect(arts.length / results.length).toBeLessThan(.21);
    expect(pages.length + arts.length).toBe(20000);
    expect(m.pages).toBe(7 + pages.length * GACHA_PAGES_PER_PULL);
    expect(results.every(r => !r.isPremium)).toBe(true);
    expect(m.jade!.free).toBe(0);
  });

  it('test_gacha_書頁結果_不新增假武功或卷數並推進心願保底', () => {
    let m = funded(); setWish(m, 'jianghu', FREE_POOL[0]!);
    // 喺固定抽序找一個書頁結果，唔將RNG實作寫入測試。
    for (let i = 0; i < 50; i++) {
      const candidate = structuredClone(m); candidate.gacha!.pulls = i;
      if (pull(structuredClone(candidate), 'jianghu', 1)![0]!.kind === 'pages') { m = candidate; break; }
    }
    const before = structuredClone(m);
    const [result] = pull(m, 'jianghu', 1)!;
    expect(result).toEqual({ kind: 'pages', id: 'manual-pages', pages: GACHA_PAGES_PER_PULL, isNew: false, isPremium: false, isWish: false });
    expect(m.manuals).toEqual(before.manuals);
    expect(m.pages).toBe((before.pages ?? 0) + GACHA_PAGES_PER_PULL);
    expect(bannerState(m, 'jianghu').sinceWish).toBe(bannerState(before, 'jianghu').sinceWish + 1);
    expect(bannerState(m, 'jianghu').total).toBe(bannerState(before, 'jianghu').total + 1);
    expect(m.gacha!.pulls).toBe(before.gacha!.pulls + 1);
  });

  it.each(['jianghu', 'zhenben'] as const)('test_gacha_%s第40抽_必出真心願而非書頁', banner => {
    const m = funded(); const id = banner === 'jianghu' ? FREE_POOL[0]! : PREMIUM_POOL[0]!;
    setWish(m, banner, id); bannerState(m, banner).sinceWish = GACHA_WISH_PITY - 1;
    const pagesBefore = m.pages;
    const [result] = pull(m, banner, 1)!;
    expect(result.kind).toBe('art'); expect(result.id).toBe(id); expect(result.isWish).toBe(true);
    expect(result.isPremium).toBe(banner === 'zhenben');
    expect(bannerState(m, banner).sinceWish).toBe(0); expect(m.pages).toBe(pagesBefore);
  });

  it.each(['jianghu', 'zhenben'] as const)('test_gacha_%s十連與十次單抽_結果帳目保底同一抽序', (banner: BannerId) => {
    const batch = funded(), singles = structuredClone(batch);
    const id = banner === 'jianghu' ? FREE_POOL[0]! : PREMIUM_POOL[0]!;
    setWish(batch, banner, id); setWish(singles, banner, id);
    bannerState(batch, banner).sinceWish = 35; bannerState(singles, banner).sinceWish = 35;
    const results = pull(batch, banner, 10)!;
    const sequential = Array.from({ length: 10 }, () => pull(singles, banner, 1)![0]!);
    expect(results).toEqual(sequential); expect(batch).toEqual(singles);
    expect(results.some(r => r.isWish)).toBe(true);
  });

  it('test_gacha_舊收藏與書頁存檔往返_沿用原值及全球事件隨機流', () => {
    const m = funded(); m.pages = 73; m.manuals = { [FREE_POOL[0]!]: { stars: 2, copies: 3, vols: [1, 6] } };
    const restored = parseAncestry(JSON.parse(JSON.stringify(m)));
    expect(restored.pages).toBe(73); expect(restored.manuals).toEqual(m.manuals);
    initRng(42); const rngBefore = getRng().getState();
    const copy = structuredClone(restored); const results = pull(restored, 'jianghu', 10);
    expect(pull(copy, 'jianghu', 10)).toEqual(results); expect(copy).toEqual(restored);
    expect(getRng().getState()).toBe(rngBefore);
    expect(parseAncestry(JSON.parse(JSON.stringify(restored)))).toEqual(restored);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('test_gacha_非法抽數%s_不扣款不派獎不推保底', n => {
    const m = funded(), before = structuredClone(m);
    expect(pull(m, 'jianghu', n)).toBeNull(); expect(m).toEqual(before);
  });
});
