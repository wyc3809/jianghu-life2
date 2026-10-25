import type { AncestryMeta } from '@interfaces/ancestry';
import { GACHA_ART_RATE, GACHA_PREMIUM_RATE, GACHA_WISH_RATE } from '@data/redesign/testParams';
import { activeSchoolGachaPool } from './schoolGachaPools';
import type { BannerId } from './gacha';

/** 本冊未觸發保底時的每抽機率；純讀取，不建立帳戶或推進抽數。 */
export function gachaBaseOdds(meta: AncestryMeta, banner: BannerId) {
  const pool = activeSchoolGachaPool(meta, banner);
  const targetPool = banner === 'zhenben' ? pool.premium : pool.free;
  const wish = meta.gacha?.banners[banner]?.wish;
  const hasWish = Boolean(wish && targetPool.includes(wish));
  const directWish = hasWish ? GACHA_WISH_RATE : 0;
  const premium = banner === 'zhenben'
    ? GACHA_ART_RATE * (directWish + (1 - directWish) * GACHA_PREMIUM_RATE) : 0;
  const wishRate = hasWish
    ? GACHA_ART_RATE * (directWish + (1 - directWish) * (banner === 'zhenben' ? GACHA_PREMIUM_RATE : 1) / targetPool.length) : 0;
  return { art: GACHA_ART_RATE, pages: 1 - GACHA_ART_RATE, premium, wish: wishRate };
}
