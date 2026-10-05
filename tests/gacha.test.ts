import { describe, expect, it } from 'vitest';
import { emptyAncestry } from '../core/life/ancestry';
import {
  FREE_POOL,
  PREMIUM_POOL,
  addFreeJade,
  bannerState,
  exchangePages,
  grantTestPaidJade,
  pull,
  pulpManual,
  setWish,
  upgradeManual,
} from '../core/life/gacha';
import { settleLifeIntoAccount } from '../core/life/accountSettle';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { addJadePending } from '../core/life/jadePending';
import {
  GACHA_COST_PER_PULL,
  GACHA_WISH_PITY,
  MANUAL_MAX_STARS,
  PAGES_PER_DUPLICATE,
  PAGES_PER_EXCHANGE,
} from '../data/redesign/testParams';
import { getSkillDef } from '../data/skills/catalog';

describe('jade + gacha (agreed-design §3.1 §3.2)', () => {
  it('test_premium_pool_is_19_new_arts_about_20_percent', () => {
    expect(PREMIUM_POOL).toHaveLength(19);
    const ratio = PREMIUM_POOL.length / (PREMIUM_POOL.length + FREE_POOL.length);
    expect(ratio).toBeGreaterThan(0.15);
    expect(ratio).toBeLessThan(0.25);
    for (const id of PREMIUM_POOL) expect(getSkillDef(id)?.sectId).toBeUndefined();
  });

  it('test_free_jade_never_draws_premium_and_paid_only_banner_rejects_free_jade', () => {
    const m = emptyAncestry();
    addFreeJade(m, GACHA_COST_PER_PULL * 200);
    const res = pull(m, 'jianghu', 200)!;
    expect(res.every((r) => !r.isPremium)).toBe(true);
    addFreeJade(m, GACHA_COST_PER_PULL * 10);
    expect(pull(m, 'zhenben', 1)).toBeNull(); // 只有免費玉石，抽唔到珍本池
  });

  it('test_jade_spent_free_first_and_balances_separate', () => {
    const m = emptyAncestry();
    addFreeJade(m, 100);
    grantTestPaidJade(m);
    const paidBefore = m.jade!.paidTest;
    pull(m, 'jianghu', 2);
    expect(m.jade!.free).toBe(0);
    expect(m.jade!.paidTest).toBe(paidBefore - (GACHA_COST_PER_PULL * 2 - 100));
  });

  it('test_wish_pity_guarantees_wish_within_40_pulls_and_progress_survives_wish_change', () => {
    const m = emptyAncestry();
    grantTestPaidJade(m);
    grantTestPaidJade(m);
    const wish = PREMIUM_POOL[0]!;
    expect(setWish(m, 'zhenben', FREE_POOL[0]!)).toBe(false); // 心願要喺池內
    setWish(m, 'zhenben', wish);
    const res = pull(m, 'zhenben', GACHA_WISH_PITY)!;
    expect(res.some((r) => r.id === wish)).toBe(true);
    // 換心願：保底進度保留
    const before = bannerState(m, 'zhenben').sinceWish;
    setWish(m, 'zhenben', PREMIUM_POOL[1]!);
    expect(bannerState(m, 'zhenben').sinceWish).toBe(before);
  });

  it('test_duplicate_upgrade_cap_and_pages_exchange_free_pool_only', () => {
    const m = emptyAncestry();
    m.manuals = { [FREE_POOL[0]!]: { stars: 0, copies: 5 } };
    for (let i = 0; i < MANUAL_MAX_STARS; i++) expect(upgradeManual(m, FREE_POOL[0]!)).toBe(true);
    expect(upgradeManual(m, FREE_POOL[0]!)).toBe(false);
    expect(pulpManual(m, FREE_POOL[0]!)).toBe(true);
    expect(m.pages).toBe(PAGES_PER_DUPLICATE);
    m.pages = PAGES_PER_EXCHANGE;
    expect(exchangePages(m, PREMIUM_POOL[0]!)).toBe(false);
    expect(exchangePages(m, FREE_POOL[3]!)).toBe(true);
    expect(m.pages).toBe(0);
  });

  it('test_life_pending_jade_moves_to_account_once', () => {
    initRng(1);
    const s = createNewLife({ seed: 1, skipCoach: true });
    const m = emptyAncestry();
    addJadePending(s, 33);
    const r = settleLifeIntoAccount(m, s);
    expect(r.jade).toBeGreaterThanOrEqual(33);
    const free = m.jade!.free;
    settleLifeIntoAccount(m, s);
    expect(m.jade!.free).toBe(free);
  });

  it('test_manual_stars_mirror_to_character', () => {
    initRng(2);
    const s = createNewLife({ seed: 2, skipCoach: true });
    const m = emptyAncestry();
    m.manuals = { [s.character.skills[0]!]: { stars: 2, copies: 0 } };
    settleLifeIntoAccount(m, s);
    expect(s.character.manualStars?.[s.character.skills[0]!]).toBe(2);
  });
});
