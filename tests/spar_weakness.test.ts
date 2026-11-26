import { describe, expect, it } from 'vitest';
import { SparDuel, sparStageFoes, type SparHeroStats } from '../core/life/sparDuel';
import { SKILL_DEFS, type CombatMoveDef } from '../data/skills/catalog';
import { volumeMove } from '../data/skills/volumes';
import { SPAR_BOSS_WEAKNESSES } from '../data/foes/sparWeaknesses';
import { sparWeaknessDamageMult } from '../core/life/sparWeakness';

const hero: SparHeroStats = { maxHp: 1e6, atk: 1000, critRate: 0, critMul: 2, lifesteal: 0, killHeal: 0, guard: 0 };
const move: CombatMoveDef = { id: 'spar_test_move', name: '試招', power: 1, qiCost: 0, description: '' };

function faceGuardian(stage: number, gearBleedChance = 0, random = .5): SparDuel {
  const duel = new SparDuel({ ...hero, gearBleedChance }, stage, () => random);
  while (!duel.foe?.boss) {
    duel.foeHp = 0;
    duel.advance();
  }
  return duel;
}

describe('演武章末破綻', () => {
  it('test_spar_weakness_each_main_chapter_has_distinct_rule_only_on_final_boss', () => {
    const signatures = new Set<string>();
    const clues = new Set<string>();
    for (let stage = 1; stage <= 280; stage++) {
      const foes = sparStageFoes(stage);
      const weakFoes = foes.filter(foe => foe.weakness);
      if (stage > 260 || stage % 10 !== 0) {
        expect(weakFoes).toHaveLength(0);
        continue;
      }
      expect(weakFoes).toEqual(foes.slice(-1));
      const { clue, ...rules } = weakFoes[0]!.weakness!;
      signatures.add(JSON.stringify(rules));
      clues.add(clue);
    }
    expect(signatures.size).toBe(26);
    expect(clues.size).toBe(26);
  });

  it('test_spar_weakness_catalog_has_a_non_premium_match_for_each_rule', () => {
    const externalArts = Object.values(SKILL_DEFS).filter(art => art.kind === 'external' && !art.premium);
    for (const weakness of Object.values(SPAR_BOSS_WEAKNESSES)) {
      if (!weakness) continue;
      const matches = externalArts.some(art => Array.from({ length: 7 }, (_, i) => volumeMove(art.id, i + 1)).some(vol =>
        vol && (weakness.kind === 'bleed' ? (vol.bleedChance ?? 0) > 0 : sparWeaknessDamageMult(weakness, vol, art.id) > 1),
      ));
      expect(matches, weakness.clue).toBe(true);
    }
  });

  it('test_spar_weakness_named_art_beats_a_related_art_and_normal_strike', () => {
    const hit = (id: string) => faceGuardian(70).heroStrike(1, move, id).dmg;
    expect(hit('art_thunder_blade')).toBeGreaterThan(hit('art_hook_silk'));
    expect(hit('art_hook_silk')).toBeGreaterThan(hit('art_river_fist'));
  });

  it('test_spar_weakness_heavy_hit_only_exploits_charging_window', () => {
    const duel = faceGuardian(20);
    const heavy = { ...move, power: 2 };
    const before = duel.heroStrike(2, heavy).dmg;
    for (let i = 0; i < 6 && !duel.foeCharging; i++) duel.foeStrike();
    expect(duel.foeCharging).toBe(true);
    expect(duel.heroStrike(2, heavy).dmg).toBeGreaterThan(before);
  });

  it('test_spar_weakness_boosts_bleed_ticks_and_allows_a_bleeding_finish', () => {
    const bloody = { ...move, bleedChance: 1, bleedTurns: 2, bleedDamage: 5 };
    const normal = faceGuardian(29);
    normal.heroStrike(1, bloody);
    expect(normal.foeStrike().bleed).toBe(5);

    const duel = faceGuardian(30);
    duel.heroStrike(1, bloody);
    expect(duel.foeStrike().bleed).toBeGreaterThan(5);
    duel.foeHp = 6;
    expect(duel.foeStrike()).toMatchObject({ bleed: 6, dmg: 0, foeKilled: true });
    expect(duel.advance().stageCleared).toBe(true);
  });

  it('test_spar_weakness_old_wound_reopens_below_half_from_gear_bleed', () => {
    const duel = faceGuardian(90, .9);
    duel.heroStrike(1, move);
    expect(duel.foeStrike().bleed).toBe(5);
    duel.foeHp = Math.floor(duel.foe!.maxHp / 2);
    expect(duel.foeStrike().bleed).toBeGreaterThan(5);
    expect(duel.foeStrike().bleed).toBe(0);
  });

  it('test_spar_weakness_stunned_boss_takes_bleed_once_and_no_stale_tick_after_advance', () => {
    const duel = faceGuardian(30, 0, .1);
    duel.heroStrike(1, { ...move, bleedChance: 1, bleedDamage: 5, bleedTurns: 1, stunChance: 1 });
    const previousHp = duel.foeHp;
    expect(duel.skipStunnedFoe()).toBe(true);
    expect(previousHp - duel.foeHp).toBeGreaterThan(5);
    expect(duel.foeStrike().bleed).toBe(0);
    duel.foeHp = 0;
    expect(duel.advance().stageCleared).toBe(true);
    expect(duel.foeStrike().bleed).toBe(0);
  });
});
