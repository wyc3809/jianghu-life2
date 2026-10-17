import { describe, expect, it } from 'vitest';
import { emptyAncestry, parseAncestry } from '../core/life/ancestry';
import { addFreeJade, bannerState, FREE_POOL, PREMIUM_POOL, pull, selectSchoolGachaPool, setWish, wishPool } from '../core/life/gacha';
import { activeSchoolGachaPool, schoolGachaPools, SCHOOL_GACHA_POOLS, schoolPoolForArt } from '../core/life/schoolGachaPools';
import { MARTIAL_SCHOOL_GROUPS } from '../data/redesign/martialSchools';
import { primarySchoolOfSkill, schoolsOfSkill, SCHOOLS } from '../data/redesign/schools';
import { SKILL_DEFS, getSkillDef, canonicalSkillId } from '../data/skills/catalog';
import { GACHA_COST_PER_PULL, GACHA_WISH_PITY, SCHOOL_GACHA_POOL_MIN, SCHOOL_GACHA_POOL_MAX } from '../data/redesign/testParams';
import MARTIAL_RAW from '../content/martial/catalog.json';

describe('六流派小卡池與舊收藏相容', () => {
  it('test_school_legacy_names_resolve_to_the_same_primary_school', () => {
    const aliases = MARTIAL_RAW.skills.filter(raw => 'legacyAliasOf' in raw && raw.legacyAliasOf);
    expect(aliases.length).toBeGreaterThan(0);
    for (const alias of aliases) {
      const target = (alias as { legacyAliasOf: string }).legacyAliasOf;
      expect(canonicalSkillId(alias.id)).toBe(target);
      expect(primarySchoolOfSkill(getSkillDef(alias.id))).toBe(primarySchoolOfSkill(getSkillDef(target)));
      expect(primarySchoolOfSkill(getSkillDef(alias.id))).toBeDefined();
    }
  });
  it('test_school_catalog_update_moves_existing_wish_to_matching_book_without_losing_pity', () => {
    const m = emptyAncestry();
    const old = schoolGachaPools('jianghu')[0]!;
    const wish = FREE_POOL.find(id => !old.free.includes(id))!;
    m.gacha = { pulls: 39, selection: { jianghu: old.id }, banners: { jianghu: { wish, sinceWish: 39, total: 39 } } };
    const expected = primarySchoolOfSkill(getSkillDef(wish));
    expect(activeSchoolGachaPool(m, 'jianghu').free).toContain(wish);
    expect(activeSchoolGachaPool(m, 'jianghu').school).toBe(expected);
    addFreeJade(m, GACHA_COST_PER_PULL);
    expect(pull(m, 'jianghu', 1)![0]!.id).toBe(wish);
    expect(m.gacha.banners.jianghu!.sinceWish).toBe(0);
    expect(selectSchoolGachaPool(m, 'jianghu', old.id)).toBe(true);
    expect(activeSchoolGachaPool(m, 'jianghu').id).toBe(old.id);
  });
  it('test_school_all_canonical_arts_have_one_primary_and_matching_affinity', () => {
    const ids = Object.values(MARTIAL_SCHOOL_GROUPS).flat();
    expect(ids).toHaveLength(Object.keys(SKILL_DEFS).length);
    expect(new Set(ids)).toEqual(new Set(Object.keys(SKILL_DEFS)));
    for (const def of Object.values(SKILL_DEFS)) expect(schoolsOfSkill(def)).toContain(primarySchoolOfSkill(def));
    expect(primarySchoolOfSkill(SKILL_DEFS.sl_luohan_fist)).toBe('jingang');
    expect(primarySchoolOfSkill(SKILL_DEFS.td_open_blade)).toBe('pojia');
  });
  it('test_school_all_arts_remain_reachable_and_each_pack_is_small_same_school', () => {
    const free = new Set<string>(), premium = new Set<string>();
    for (const pool of SCHOOL_GACHA_POOLS) {
      expect(pool.arts.length).toBeGreaterThanOrEqual(SCHOOL_GACHA_POOL_MIN);
      expect(pool.arts.length).toBeLessThanOrEqual(SCHOOL_GACHA_POOL_MAX);
      expect(new Set(pool.arts).size).toBe(pool.arts.length);
      for (const id of pool.arts) expect(schoolsOfSkill(getSkillDef(id))).toContain(pool.school);
      for (const id of pool.free) { expect(getSkillDef(id)?.premium).not.toBe(true); free.add(id); }
      for (const id of pool.premium) { expect(pool.banner).toBe('zhenben'); expect(getSkillDef(id)?.premium).toBe(true); premium.add(id); }
    }
    expect(free).toEqual(new Set(FREE_POOL));
    expect(premium).toEqual(new Set(PREMIUM_POOL));
  });
  it('test_school_draws_stay_in_selected_pack_with_unchanged_cost_and_rng', () => {
    for (const pool of SCHOOL_GACHA_POOLS) {
      const m = emptyAncestry(); m.jade = { free: 0, paidTest: GACHA_COST_PER_PULL * 100 };
      expect(selectSchoolGachaPool(m, pool.banner, pool.id)).toBe(true);
      const clone = structuredClone(m), results = pull(m, pool.banner, 100)!;
      expect(results.every(r => pool.arts.includes(r.id))).toBe(true);
      expect(pull(clone, pool.banner, 100)).toEqual(results);
      expect(m.jade?.paidTest).toBe(0);
    }
  });
  it('test_school_switch_keeps_pity_and_reselects_in_pack_wish', () => {
    const m = emptyAncestry(); addFreeJade(m, GACHA_COST_PER_PULL * 2);
    setWish(m, 'jianghu', FREE_POOL[0]!); pull(m, 'jianghu', 2);
    const b = bannerState(m, 'jianghu'); b.sinceWish = GACHA_WISH_PITY - 1;
    const original = activeSchoolGachaPool(m, 'jianghu');
    const next = schoolGachaPools('jianghu').find(p => !p.free.includes(b.wish!) && p.school !== original.school)!;
    expect(selectSchoolGachaPool(m, 'jianghu', next.id)).toBe(true);
    expect(b.sinceWish).toBe(39); expect(b.wish).toBeUndefined();
    setWish(m, 'jianghu', next.free[0]!); addFreeJade(m, GACHA_COST_PER_PULL);
    expect(pull(m, 'jianghu', 1)![0]!.id).toBe(next.free[0]);
    expect(b.sinceWish).toBe(0);
  });
  it('test_school_legacy_save_finds_old_wish_without_clearing_pity_or_manuals', () => {
    const m = emptyAncestry();
    m.gacha = { pulls: 38, banners: { zhenben: { wish: PREMIUM_POOL.at(-1), sinceWish: 39, total: 38 } } };
    m.manuals = { [FREE_POOL[1]!]: { stars: 2, copies: 3, vols: [1, 6] } };
    m.jade = { free: 19, paidTest: GACHA_COST_PER_PULL };
    const old = JSON.stringify(m), restored = parseAncestry(old);
    const pool = activeSchoolGachaPool(restored, 'zhenben');
    expect(pool.premium).toContain(PREMIUM_POOL.at(-1));
    expect(JSON.stringify(m)).toBe(old);
    expect(pull(restored, 'zhenben', 1)![0]!.id).toBe(PREMIUM_POOL.at(-1));
    expect(restored.manuals![FREE_POOL[1]!]).toEqual(m.manuals![FREE_POOL[1]!]);
    const roundtrip = parseAncestry(JSON.stringify(restored));
    expect(roundtrip.gacha).toEqual(restored.gacha);
    expect(roundtrip.jade).toEqual(restored.jade);
  });
  it('test_school_invalid_switch_and_insufficient_currency_do_not_change_selection_or_pity', () => {
    const m = emptyAncestry();
    const snapshot = JSON.stringify(m);
    expect(selectSchoolGachaPool(m, 'jianghu', schoolGachaPools('zhenben')[0]!.id)).toBe(false);
    expect(selectSchoolGachaPool(m, 'jianghu', 'missing')).toBe(false);
    expect(JSON.stringify(m)).toBe(snapshot);
    m.jade = { free: 600, paidTest: 0 };
    const selection = activeSchoolGachaPool(m, 'jianghu').id;
    expect(pull(m, 'zhenben', 1)).toBeNull();
    expect(m.jade.free).toBe(600);
    expect(activeSchoolGachaPool(m, 'jianghu').id).toBe(selection);
  });
  it('test_school_wish_lists_match_preview_and_currency_restrictions', () => {
    for (const school of SCHOOLS) for (const banner of ['jianghu', 'zhenben'] as const) {
      const m = emptyAncestry(), pool = schoolGachaPools(banner, school.id)[0]!;
      selectSchoolGachaPool(m, banner, pool.id);
      expect(wishPool(banner, m)).toEqual(banner === 'zhenben' ? pool.premium : pool.free);
      expect(schoolPoolForArt(banner, wishPool(banner, m)[0]!)?.arts).toContain(wishPool(banner, m)[0]);
    }
  });
});
