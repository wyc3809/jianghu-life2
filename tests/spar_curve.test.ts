import { describe, expect, it } from 'vitest';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { SparDuel, sparHeroStats, sparRand, sparStageFoes, type SparHeroStats } from '../core/life/sparDuel';

/** 實測演武節奏：普通敵人每 2.5 下主角出手先還一下；首領每 1.9 下（2026-10-14 瀏覽器量度） */
const RATIO = { normal: 2.5, boss: 1.9 };

function heroAtTier(tier: number): SparHeroStats {
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
  return sparHeroStats(s);
}

function clearsStage(hero: SparHeroStats, stage: number, seed = 42): boolean {
  const d = new SparDuel(hero, stage, sparRand(seed, stage));
  let acc = 0;
  for (let turn = 0; turn < 20000; turn++) {
    if (d.heroStrike().killed) {
      if (d.advance().stageCleared) return true;
      continue;
    }
    acc += 1 / (d.foe?.boss ? RATIO.boss : RATIO.normal);
    while (acc >= 1) {
      acc -= 1;
      if (d.foeStrike().heroDown) return false;
    }
  }
  return false;
}

/** 連續推關，同一關連輸 3 次就當撞牆 */
function wallStage(hero: SparHeroStats): number {
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

describe('演武難度曲線（2026-10-14）', () => {
  it('test_spar_curve_new_character_clears_stage_one', () => {
    expect(clearsStage(heroAtTier(0), 1)).toBe(true);
  });

  it('test_spar_curve_every_tier_pushes_further', () => {
    const walls = [0, 2, 4, 8, 14].map((t) => wallStage(heroAtTier(t)));
    for (let i = 1; i < walls.length; i++) expect(walls[i]!).toBeGreaterThan(walls[i - 1]!);
    // 頂境唔再卡喺 20 幾關（舊曲線約第 27 關）
    expect(walls.at(-1)!).toBeGreaterThanOrEqual(35);
  });

  it('test_spar_curve_boss_hit_never_takes_most_of_hp_at_wall', () => {
    for (const tier of [0, 4, 8, 14]) {
      const hero = heroAtTier(tier);
      const boss = sparStageFoes(wallStage(hero)).at(-1)!;
      // 撞牆時首領一擊都唔超過主角氣血 20%（舊曲線頂境約 242%＝一擊倒地）
      expect(boss.atk / hero.maxHp).toBeLessThan(0.2);
    }
  });

  it('test_spar_curve_same_seed_same_result', () => {
    const hero = heroAtTier(4);
    const run = () => {
      const d = new SparDuel(hero, 10, sparRand(7, 10));
      return Array.from({ length: 30 }, () => d.heroStrike().dmg);
    };
    expect(run()).toEqual(run());
  });
});
