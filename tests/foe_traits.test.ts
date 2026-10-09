import { describe, expect, it } from 'vitest';
import { FOE_REGIONS, FOE_BY_NAME, lookForFoeName } from '../data/foes/roster';
import { FOE_TRAITS, type FoeTraitId } from '../data/foes/traits';
import {
  newTraitState,
  resolveFoeIdentity,
  traitAttackMult,
  traitEnraged,
  traitNextIsCharged,
  traitOnFoeDealt,
  traitOnFoeHit,
} from '../core/life/foeTraits';
import { SparDuel, sparEliteCount, sparMinionCount, sparStageFoes, type SparHeroStats } from '../core/life/sparDuel';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { startCombat } from '../core/life/combat';
import { runAutoCombat } from '../core/life/autoCombat';

const HERO: SparHeroStats = { maxHp: 1000, atk: 100, critRate: 0, critMul: 2, lifesteal: 0, clearHeal: 0, guard: 0 };
const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe('敵人圖鑑（data/foes/roster.ts）', () => {
  it('test_six_regions_each_with_minions_two_elites_and_boss', () => {
    expect(FOE_REGIONS).toHaveLength(6);
    for (const r of FOE_REGIONS) {
      expect(r.minions.length).toBeGreaterThanOrEqual(2);
      expect(r.elites).toHaveLength(2);
      expect(r.boss.tier).toBe('boss');
      expect(r.elites.every((e) => e.tier === 'elite')).toBe(true);
      expect(r.minions.every((m) => m.tier === 'minion')).toBe(true);
    }
  });

  it('test_every_boss_has_a_different_trait', () => {
    const traits = FOE_REGIONS.map((r) => r.trait);
    expect(new Set(traits).size).toBe(6);
    expect(new Set(traits)).toEqual(new Set(Object.keys(FOE_TRAITS) as FoeTraitId[]));
  });

  it('test_names_are_unique_and_lookup_works', () => {
    const all = FOE_REGIONS.flatMap((r) => [...r.minions, ...r.elites, r.boss]);
    expect(new Set(all.map((f) => f.name)).size).toBe(all.length);
    expect(FOE_BY_NAME.get('赤髮寨主')!.region.trait).toBe('charge');
    expect(lookForFoeName('赤髮寨主')).toBe('chifa');
    expect(lookForFoeName('雙鉤客')).toBe('gouke');
  });

  it('test_elite_trait_is_weaker_than_boss', () => {
    for (const t of Object.values(FOE_TRAITS)) {
      expect(t.elite.value).toBeLessThan(t.boss.value);
      if (t.id === 'charge') expect(t.elite.every!).toBeGreaterThan(t.boss.every!);
    }
  });
});

describe('特性計算（core/life/foeTraits.ts）', () => {
  it('test_minion_has_no_trait_effect', () => {
    const s = newTraitState('guard', 'minion');
    expect(traitOnFoeHit(s, 100)).toEqual({ dmg: 100, reflect: 0, fx: [] });
    expect(traitAttackMult(s, 0.1).mult).toBe(1);
  });

  it('test_guard_cuts_damage_boss_more_than_elite', () => {
    expect(traitOnFoeHit(newTraitState('guard', 'boss'), 100).dmg).toBe(70);
    expect(traitOnFoeHit(newTraitState('guard', 'elite'), 100).dmg).toBe(85);
  });

  it('test_thorns_reflects_part_of_damage', () => {
    expect(traitOnFoeHit(newTraitState('thorns', 'boss'), 100).reflect).toBe(20);
    expect(traitOnFoeHit(newTraitState('thorns', 'elite'), 100).reflect).toBe(10);
  });

  it('test_charge_every_third_strike_for_boss_fourth_for_elite', () => {
    const boss = newTraitState('charge', 'boss');
    const bm = [1, 2, 3, 4, 5, 6].map(() => traitAttackMult(boss, 1).mult);
    expect(bm).toEqual([1, 1, 2.2, 1, 1, 2.2]);
    const elite = newTraitState('charge', 'elite');
    expect(traitNextIsCharged(elite)).toBe(false);
    const em = [1, 2, 3, 4].map(() => traitAttackMult(elite, 1).mult);
    expect(em).toEqual([1, 1, 1, 1.6]);
  });

  it('test_enrage_only_below_half_hp', () => {
    const s = newTraitState('enrage', 'boss');
    expect(traitEnraged(s, 0.6)).toBe(false);
    expect(traitAttackMult(s, 0.6).mult).toBe(1);
    expect(traitAttackMult(s, 0.5).mult).toBeCloseTo(1.6);
    expect(traitAttackMult(newTraitState('enrage', 'elite'), 0.3).mult).toBeCloseTo(1.3);
  });

  it('test_drain_heals_and_combo_follows_up_by_chance', () => {
    expect(traitOnFoeDealt(newTraitState('drain', 'boss'), 100, () => 0).heal).toBe(35);
    expect(traitOnFoeDealt(newTraitState('drain', 'elite'), 100, () => 0).heal).toBe(18);
    expect(traitOnFoeDealt(newTraitState('combo', 'boss'), 100, () => 0.3).followUp).toBeGreaterThan(0);
    expect(traitOnFoeDealt(newTraitState('combo', 'elite'), 100, () => 0.3).followUp).toBe(0);
  });

  it('test_identity_from_roster_or_foe_power', () => {
    expect(resolveFoeIdentity('鬼面頭陀', 'normal')).toMatchObject({ tier: 'boss', trait: 'thorns' });
    expect(resolveFoeIdentity('影門血姬', undefined)).toMatchObject({ tier: 'elite', trait: 'drain' });
    expect(resolveFoeIdentity('市井潑皮', 'boss').trait).toBeUndefined();
    expect(resolveFoeIdentity('血刀老祖', 'boss')).toMatchObject({ tier: 'boss', trait: 'drain' });
    expect(resolveFoeIdentity('過路書生', 'normal')).toEqual({ tier: 'minion' });
  });
});

describe('演武台特性（core/life/sparDuel.ts）', () => {
  it('test_stage_has_elites_with_region_trait_before_boss', () => {
    const stage = 17; // 山道第 7 關：兩個精英
    const foes = sparStageFoes(stage);
    const n = sparMinionCount(stage);
    expect(sparEliteCount(stage)).toBe(2);
    expect(foes.slice(0, n).every((f) => f.trait === undefined)).toBe(true);
    expect(foes.slice(n, -1).every((f) => f.tier === 'elite' && f.trait === 'charge')).toBe(true);
    expect(foes.at(-1)).toMatchObject({ tier: 'boss', trait: 'charge', name: '赤髮寨主' });
  });

  it('test_town_boss_guard_reduces_spar_damage', () => {
    const d = new SparDuel({ ...HERO, atk: 1e9 }, 1, seq([0.9, 0.5]));
    while (!d.foe!.boss) {
      d.heroStrike();
      d.advance();
    }
    d.hero = { ...HERO, atk: 100 };
    const hit = d.heroStrike();
    expect(hit.dmg).toBe(70);
    expect(hit.fx).toEqual([{ kind: 'guard', value: 30 }]);
  });

  it('test_thorns_never_kills_hero_in_spar', () => {
    const d = new SparDuel({ ...HERO, atk: 1e9 }, 41, seq([0.9, 0.5])); // 山門
    while (!d.foe!.boss) {
      d.heroStrike();
      d.advance();
    }
    d.hero = { ...HERO, atk: 500 };
    d.heroHp = 5;
    const hit = d.heroStrike();
    expect(hit.reflect).toBe(4);
    expect(d.heroHp).toBe(1);
  });

  it('test_snapshot_shows_charge_telegraph', () => {
    const d = new SparDuel({ ...HERO, atk: 1e9 }, 11, seq([0.9, 0.5])); // 山道
    while (!d.foe!.boss) {
      d.heroStrike();
      d.advance();
    }
    d.foeStrike();
    expect(d.snapshot().foeCharging).toBe(false);
    d.foeStrike();
    expect(d.snapshot().foeCharging).toBe(true);
    const big = d.foeStrike();
    expect(big.fx.some((f) => f.kind === 'charge')).toBe(true);
  });
});

describe('事件交手特性（core/life/combat.ts＋autoCombat）', () => {
  function bossFight(foeName: string, seed = 21) {
    initRng(seed);
    const s = createNewLife({ seed, skipCoach: true });
    s.character.health = s.character.maxHealth = 5000;
    startCombat(s, { source: 'event', title: '試招', foeName, foePower: 'boss', rewardOnWin: {}, rewardOnLose: {} });
    return s;
  }

  it('test_event_boss_gets_trait_and_opening_line', () => {
    const s = bossFight('鎮上惡霸');
    expect(s.pendingCombat).toMatchObject({ foeTier: 'boss', foeTrait: 'guard', foeTitle: '鐵肚金剛' });
    expect(s.pendingCombat!.log.some((l) => l.includes('鐵布衫'))).toBe(true);
  });

  it('test_auto_combat_replay_carries_trait_fx', () => {
    const r = runAutoCombat(bossFight('鎮上惡霸'))!;
    expect(r.foeTrait).toBe('guard');
    const fx = r.rounds.flatMap((x) => x.hits).flatMap((h) => h.traitFx ?? []);
    expect(fx.some((f) => f.kind === 'guard')).toBe(true);
    const foeFx = r.rounds.flatMap((x) => x.hits).filter((h) => h.side === 'foe').flatMap((h) => h.traitFx ?? []);
    expect(foeFx.some((f) => f.kind === 'guard')).toBe(false);
  });

  it('test_auto_combat_with_traits_is_deterministic', () => {
    for (const name of ['赤髮寨主', '影門門主', '鐵面影魁', '鬼面頭陀', '黑風寨主']) {
      const a = runAutoCombat(bossFight(name, 33))!;
      const b = runAutoCombat(bossFight(name, 33))!;
      expect(JSON.stringify(a.rounds)).toBe(JSON.stringify(b.rounds));
    }
  });
});
