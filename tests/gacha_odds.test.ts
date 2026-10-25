import { describe, expect, it } from 'vitest';
import { emptyAncestry } from '@core/life/ancestry';
import { setWish } from '@core/life/gacha';
import { gachaBaseOdds } from '@core/life/gachaOdds';
import { activeSchoolGachaPool } from '@core/life/schoolGachaPools';

describe('抽取機率說明', () => {
  it('test_gacha_odds_無心願_每抽珍本為百分之一點二且不改帳戶', () => {
    const meta = emptyAncestry();
    const before = structuredClone(meta);
    expect(gachaBaseOdds(meta, 'zhenben')).toEqual({ art: .2, pages: .8, premium: .012, wish: 0 });
    expect(meta).toEqual(before);
  });
  it('test_gacha_odds_江湖心願_計入隨機抽中同一武學', () => {
    const meta = emptyAncestry();
    const pool = activeSchoolGachaPool(meta, 'jianghu');
    setWish(meta, 'jianghu', pool.free[0]!);
    expect(gachaBaseOdds(meta, 'jianghu').wish).toBeCloseTo(.2 * (.025 + .975 / pool.free.length));
    expect(gachaBaseOdds(meta, 'jianghu').premium).toBe(0);
  });
  it('test_gacha_odds_珍本心願_包含直接心願與其餘珍本', () => {
    const meta = emptyAncestry();
    const pool = activeSchoolGachaPool(meta, 'zhenben');
    setWish(meta, 'zhenben', pool.premium[0]!);
    expect(gachaBaseOdds(meta, 'zhenben').premium).toBeCloseTo(.0167);
    expect(gachaBaseOdds(meta, 'zhenben').wish).toBeCloseTo(.2 * (.025 + .975 * .06 / pool.premium.length));
  });
  it('test_gacha_odds_舊無效心願_不計心願機率', () => {
    const meta = emptyAncestry();
    meta.gacha = { pulls: 0, banners: { jianghu: { wish: 'missing', total: 0, sinceWish: 39 } } };
    expect(gachaBaseOdds(meta, 'jianghu').wish).toBe(0);
  });
});
