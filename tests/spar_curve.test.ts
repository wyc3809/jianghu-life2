import { describe, expect, it } from 'vitest';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { SparDuel, sparHeroStats, sparRand, sparStageFoes } from '../core/life/sparDuel';

import type { LifeGameState } from '../interfaces/lifeEngine';

function lifeAtTier(tier: number, volumes = 1): LifeGameState {
  initRng(42);
  const s = createNewLife({ seed: 42, skipCoach: true });
  const c = s.character;
  // 只計突破成長（同 scripts/balance/auditBalance.mts 一樣）
  for (let t = 1; t <= tier; t++) {
    c.martial += 6 + t * 2;
    c.maxHealth += 16 + t * 5;
  }
  c.health = c.maxHealth;
  c.cultivation = { tier, xp: 0, reserve: 0 };
  c.skills = ['art_river_fist'];
  c.equippedArts = ['art_river_fist', null, null, null, null];
  c.volumes = { art_river_fist: Array.from({ length: volumes }, (_, i) => i + 1) };
  return s;
}

function clearsStage(state: LifeGameState, stage: number, seed = 42): boolean {
  const d = new SparDuel(sparHeroStats(state), stage, sparRand(seed, stage));
  for (let turn = 0; turn < 20000; turn++) {
    if (d.rounds.phase === 'hero') {
      const move = d.rounds.beginMove(state.character)!;
      d.rounds.commitHeroMove();
      if (d.heroStrike(move.power,move.move,move.artId).killed && d.advance().stageCleared) return true;
    } else {
      if (d.foeStrike().heroDown) return false;
      d.rounds.commitFoeMove();
    }
  }
  return false;
}

/** 連續推關，同一關連輸 3 次就當撞牆 */
function wallStage(hero: LifeGameState): number {
  let stage = 1;
  let fails = 0;
  let tries = 0;
  while (stage < 300 && fails < 3) {
    if (clearsStage(hero, stage, 42 + tries++)) {
      stage++;
      fails = 0;
    } else fails++;
  }
  return stage;
}

describe('演武完整回合難度曲線（第38項）', () => {
  it('test_spar_curve_new_character_clears_stage_one', () => {
    expect(clearsStage(lifeAtTier(0), 1)).toBe(true);
  });

  it('test_spar_curve_every_tier_pushes_further', () => {
    const walls = [0, 2, 4, 8, 14].map((t) => wallStage(lifeAtTier(t)));
    for (let i = 1; i < walls.length; i++) expect(walls[i]!).toBeGreaterThan(walls[i - 1]!);
    // 候選目標：頂境只用卷一仍能推至30關以上，但不再沿用舊35關保底。
    expect(walls.at(-1)!).toBeGreaterThanOrEqual(30);
    expect(walls.at(-1)!).toBeLessThanOrEqual(40);
  });

  it('test_spar_curve_boss_hit_never_takes_most_of_hp_at_wall', () => {
    for (const tier of [0, 4, 8, 14]) {
      const hero = lifeAtTier(tier);
      const boss = sparStageFoes(wallStage(hero)).at(-1)!;
      // 撞牆時首領一擊都唔超過主角氣血 20%（舊曲線頂境約 242%＝一擊倒地）
      expect(boss.atk / hero.character.maxHealth).toBeLessThan(0.2);
    }
  });

  it('test_spar_curve_三招及七招_同境界可推得更遠', () => {
    const walls = [1, 3, 7].map(n => wallStage(lifeAtTier(4, n)));
    expect(walls[1]).toBeGreaterThan(walls[0]!);
    expect(walls[2]).toBeGreaterThan(walls[1]!);
  });

  it('test_spar_curve_same_seed_same_result', () => {
    const hero = lifeAtTier(4);
    const run = () => {
      const d = new SparDuel(sparHeroStats(hero), 10, sparRand(7, 10));
      return Array.from({ length: 30 }, () => d.heroStrike().dmg);
    };
    expect(run()).toEqual(run());
  });
});
