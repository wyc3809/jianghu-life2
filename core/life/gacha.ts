/**
 * 玉石・抽卡・心願保底・重複秘笈（design/agreed-design-2026-10.md §3.1、§3.2）。
 *
 * 兩個卡池：
 *   - 江湖秘笈（jianghu）：免費／付費玉石都用得（先扣免費），只出一般江湖武學或書頁。
 *   - 珍本奇功（zhenben）：只限付費玉石，可出19門珍本奇功、一般江湖武學或書頁。
 * 非保底抽取：20%武功、80%書頁；武功命中後沿用原有心願／珍本權重。
 * 免費玉石永遠抽唔到珍本奇功；書頁兌換亦只限免費池（唔可以繞過）。
 * 心願保底：每池揀一門心願，連續 GACHA_WISH_PITY 抽未出，下一抽必出；換代、換心願都保留進度。
 *
 * 全部係改 AncestryMeta（帳戶層、跨世）嘅純函數；抽卡用自己嘅種子 RNG，唔郁人生模擬 RNG。
 */
import type { AncestryMeta } from '@interfaces/ancestry';
import { getSkillDef, SKILL_DEFS } from '@data/skills/catalog';
import { VOLUME_COUNT, hasVolumes } from '@data/skills/volumes';
import { addCollectionVolume } from './volumes';
import { createRng } from '@core/random';
import { activeSchoolGachaPool, schoolGachaPools, schoolPoolForArt } from './schoolGachaPools';
import {
  GACHA_COST_PER_PULL,
  GACHA_ART_RATE,
  GACHA_PAGES_PER_PULL,
  GACHA_PREMIUM_RATE,
  GACHA_WISH_PITY,
  GACHA_WISH_RATE,
  MANUAL_MAX_STARS,
  PAGES_PER_DUPLICATE,
  PAGES_PER_EXCHANGE,
  TEST_PAID_JADE_GRANT,
} from '@data/redesign/testParams';

export type BannerId = 'jianghu' | 'zhenben';

export const BANNERS: Record<BannerId, { name: string; blurb: string; paidOnly: boolean }> = {
  jianghu: { name: '江湖秘笈', blurb: '可使用免費及付費測試玉石 · 江湖武學／書頁', paidOnly: false },
  zhenben: { name: '珍本奇功', blurb: '只限付費玉石 · 可出19門珍本奇功／書頁', paidOnly: true },
};

/** 免費池：所有唔係珍本嘅武學（約 80%） */
export const FREE_POOL: string[] = Object.values(SKILL_DEFS)
  .filter((d) => !d.premium)
  .map((d) => d.id);
/** 珍本奇功（約 20%）：只限付費抽卡或在線奇遇 */
export const PREMIUM_POOL: string[] = Object.values(SKILL_DEFS)
  .filter((d) => d.premium)
  .map((d) => d.id);

export function isPremiumArt(id: string): boolean {
  return Boolean(getSkillDef(id)?.premium);
}

/** 傳入帳戶時只列本冊心願；冇帳戶嘅舊呼叫保留全池合法性查詢。 */
export function wishPool(banner: BannerId, meta?: AncestryMeta): string[] {
  if (meta) {
    const pool = activeSchoolGachaPool(meta, banner);
    return banner === 'zhenben' ? pool.premium : pool.free;
  }
  return banner === 'zhenben' ? PREMIUM_POOL : FREE_POOL;
}

function ensure(meta: AncestryMeta): Required<Pick<AncestryMeta, 'jade' | 'gacha' | 'manuals' | 'pages'>> {
  meta.jade ??= { free: 0, paidTest: 0 };
  meta.gacha ??= { pulls: 0, banners: {} };
  meta.manuals ??= {};
  meta.pages ??= 0;
  return meta as Required<Pick<AncestryMeta, 'jade' | 'gacha' | 'manuals' | 'pages'>>;
}

export function bannerState(meta: AncestryMeta, banner: BannerId): { wish?: string; sinceWish: number; total: number } {
  const g = ensure(meta).gacha;
  g.banners[banner] ??= { sinceWish: 0, total: 0 };
  return g.banners[banner]!;
}

/** 揀心願（要喺呢個池範圍入面）；保底進度保留 */
export function setWish(meta: AncestryMeta, banner: BannerId, artId: string): boolean {
  if (!wishPool(banner).includes(artId)) return false;
  if (!wishPool(banner, meta).includes(artId)) {
    const pool = schoolPoolForArt(banner, artId);
    if (!pool || !selectSchoolGachaPool(meta, banner, pool.id)) return false;
  }
  bannerState(meta, banner).wish = artId;
  return true;
}

/** 換流派／小冊只換出貨範圍；心願不在新冊就待重選，保底抽數照保留。 */
export function selectSchoolGachaPool(meta: AncestryMeta, banner: BannerId, poolId: string): boolean {
  const pool = schoolGachaPools(banner).find(pool => pool.id === poolId);
  if (!pool) return false;
  const m = ensure(meta);
  m.gacha.selection ??= {};
  m.gacha.selection[banner] = pool.id;
  const b = bannerState(meta, banner);
  if (b.wish && !(banner === 'zhenben' ? pool.premium : pool.free).includes(b.wish)) delete b.wish;
  return true;
}

/** 呢個池而家用得幾多玉石 */
export function spendableJade(meta: AncestryMeta, banner: BannerId): number {
  const j = ensure(meta).jade;
  return BANNERS[banner].paidOnly ? j.paidTest : j.free + j.paidTest;
}

export interface ArtPullResult {
  /** 舊演出資料冇kind仍視為武功；新結果會明示。 */
  kind?: 'art';
  id: string;
  /** 外功：抽中第幾卷（1–7）；內功／輕功冇 */
  vol?: number;
  isNew: boolean;
  isWish: boolean;
  isPremium: boolean;
}

export interface PagesPullResult {
  kind: 'pages';
  id: 'manual-pages';
  pages: number;
  vol?: never;
  isNew: false;
  isWish: false;
  isPremium: false;
}

export type PullResult = ArtPullResult | PagesPullResult;

/** 抽 n 次；玉石唔夠就一次都唔抽，返回 null */
export function pull(meta: AncestryMeta, banner: BannerId, n: number): PullResult[] | null {
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  const m = ensure(meta);
  const cost = GACHA_COST_PER_PULL * n;
  if (spendableJade(meta, banner) < cost) return null;
  // 扣玉石：江湖池先扣免費；珍本池只扣付費
  if (BANNERS[banner].paidOnly) m.jade.paidTest -= cost;
  else {
    const fromFree = Math.min(m.jade.free, cost);
    m.jade.free -= fromFree;
    m.jade.paidTest -= cost - fromFree;
  }
  const b = bannerState(meta, banner);
  const pool = activeSchoolGachaPool(meta, banner);
  m.gacha.selection ??= {};
  m.gacha.selection[banner] = pool.id;
  const out: PullResult[] = [];
  for (let i = 0; i < n; i++) {
    const rng = createRng(0x9e3779b1 ^ (m.gacha.pulls + 1) * 2654435761);
    // 派武功／書頁用獨立種子流；武功種類／七卷仍沿用原有抽取流。
    const rewardRng = createRng(0x85ebca6b ^ (m.gacha.pulls + 1) * 2654435761);
    m.gacha.pulls += 1;
    b.total += 1;
    let id: string;
    const wish = b.wish && wishPool(banner, meta).includes(b.wish) ? b.wish : undefined;
    const guaranteedWish = Boolean(wish) && b.sinceWish + 1 >= GACHA_WISH_PITY;
    if (!guaranteedWish && !rewardRng.chance(GACHA_ART_RATE)) {
      m.pages += GACHA_PAGES_PER_PULL;
      b.sinceWish += 1;
      out.push({ kind: 'pages', id: 'manual-pages', pages: GACHA_PAGES_PER_PULL, isNew: false, isWish: false, isPremium: false });
      continue;
    }
    if (wish && (guaranteedWish || rng.chance(GACHA_WISH_RATE))) {
      id = wish;
    } else if (banner === 'zhenben' && rng.chance(GACHA_PREMIUM_RATE)) {
      id = rng.pick(pool.premium);
    } else {
      id = rng.pick(pool.free);
    }
    const isWish = Boolean(wish) && id === wish;
    // 提前抽中心願：保底歸零；未中：累積
    b.sinceWish = isWish ? 0 : b.sinceWish + 1;
    if (hasVolumes(id)) {
      // 外功逐卷出：隨機一卷；已有呢卷＝重複本
      const vol = rng.nextInt(1, VOLUME_COUNT);
      const isNew = addCollectionVolume(meta, id, vol);
      out.push({ kind: 'art', id, vol, isNew, isWish, isPremium: isPremiumArt(id) });
      continue;
    }
    const owned = m.manuals[id];
    if (owned) owned.copies += 1;
    else m.manuals[id] = { stars: 0, copies: 0 };
    out.push({ kind: 'art', id, isNew: !owned, isWish, isPremium: isPremiumArt(id) });
  }
  return out;
}

/** 重複本升階（最多 MANUAL_MAX_STARS） */
export function upgradeManual(meta: AncestryMeta, id: string): boolean {
  const e = ensure(meta).manuals[id];
  if (!e || e.copies < 1 || e.stars >= MANUAL_MAX_STARS) return false;
  e.copies -= 1;
  e.stars += 1;
  return true;
}

/** 重複本轉書頁 */
export function pulpManual(meta: AncestryMeta, id: string): boolean {
  const m = ensure(meta);
  const e = m.manuals[id];
  if (!e || e.copies < 1) return false;
  e.copies -= 1;
  m.pages += PAGES_PER_DUPLICATE;
  return true;
}

/** 書頁換一門免費池武學（換唔到珍本奇功） */
export function exchangePages(meta: AncestryMeta, id: string): boolean {
  const m = ensure(meta);
  if (!FREE_POOL.includes(id) || m.pages < PAGES_PER_EXCHANGE) return false;
  m.pages -= PAGES_PER_EXCHANGE;
  const e = m.manuals[id];
  if (e) e.copies += 1;
  else m.manuals[id] = { stars: 0, copies: 0 };
  return true;
}

/** 測試版：領付費玉石測試額度（唔係真錢，分開記帳） */
export function grantTestPaidJade(meta: AncestryMeta): number {
  ensure(meta).jade.paidTest += TEST_PAID_JADE_GRANT;
  return TEST_PAID_JADE_GRANT;
}

/** 免費玉石入帳 */
export function addFreeJade(meta: AncestryMeta, amount: number): void {
  if (!(amount > 0)) return;
  ensure(meta).jade.free += Math.floor(amount);
}

/** 秘笈升階數（畀角色鏡像用） */
export function manualStarMap(meta: AncestryMeta): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, e] of Object.entries(meta.manuals ?? {})) if (e.stars > 0) out[id] = e.stars;
  return out;
}
