import { describe, expect, it } from 'vitest';
import { resolveOneHit } from '../core/life/combatCore';
import { createRng } from '../core/random';
import type { CombatFighterState } from '../interfaces/lifeEngine';
import type { CombatMoveDef } from '../data/skills/catalog';

function fighter(overrides: Partial<CombatFighterState> = {}): CombatFighterState {
  return {
    name: '甲',
    hp: 500,
    maxHp: 500,
    qi: 100,
    maxQi: 100,
    attack: 50,
    defense: 0,
    hitBonus: 1, // 幾乎必中，方便量度傷害數值
    evasion: 0,
    qiRegen: 0,
    blind: 0,
    isPlayer: true,
    stun: 0,
    bleedDamage: 0,
    bleedTurns: 0,
    defenseMod: 0,
    reflect: 0,
    chargeBonus: 0,
    ...overrides,
  };
}

const MOVE: CombatMoveDef = { id: 'test_move', name: '測試招', qiCost: 0, power: 1, description: '' };

/** 用遞增種子試到命中為止（hitBonus=1 令命中率極高，通常首試即中） */
function damageDealt(attacker: CombatFighterState, defender: CombatFighterState, seedStart = 1): number {
  for (let seed = seedStart; seed < seedStart + 20; seed++) {
    const d = { ...defender, hp: defender.maxHp };
    const rng = createRng(seed);
    const lines = resolveOneHit({ ...attacker }, d, MOVE, rng, 0, 1);
    if (!lines.some((l) => l.includes('偏了'))) {
      return defender.maxHp - d.hp;
    }
  }
  throw new Error('未能喺 20 個種子內命中，測試設置有誤');
}

describe('damage rebalance: soft-capped defense mitigation', () => {
  it('higher defense yields strictly less damage but never fully to zero', () => {
    const attacker = fighter();
    const dmgNoDef = damageDealt(attacker, fighter({ defense: 0 }));
    const dmgSomeDef = damageDealt(attacker, fighter({ defense: 200 }));
    const dmgHugeDef = damageDealt(attacker, fighter({ defense: 5000 }));

    expect(dmgSomeDef).toBeLessThan(dmgNoDef);
    expect(dmgHugeDef).toBeLessThan(dmgSomeDef);
    // 軟上限：即使防禦極高，最低傷害地板都係 3
    expect(dmgHugeDef).toBeGreaterThanOrEqual(3);
  });

  it('defense mitigation approaches but never reaches 100% (def/(def+100) never hits 1)', () => {
    const attacker = fighter();
    const dmg = damageDealt(attacker, fighter({ defense: 1_000_000 }));
    expect(dmg).toBeGreaterThanOrEqual(3);
  });
});

describe('damage rebalance: level suppression', () => {
  it('an attacker with much higher martial deals more damage than an even match', () => {
    const evenAttacker = fighter({ martial: 50 });
    const evenDefender = fighter({ martial: 50, defense: 30 });
    const dmgEven = damageDealt(evenAttacker, evenDefender);

    const strongerAttacker = fighter({ martial: 150 });
    const dmgSuppressed = damageDealt(strongerAttacker, evenDefender);

    expect(dmgSuppressed).toBeGreaterThan(dmgEven);
  });

  it('the level-suppression bonus caps at 30% regardless of how large the gap grows', () => {
    const defender = fighter({ martial: 0, defense: 30 });
    const dmgAt100Diff = damageDealt(fighter({ martial: 100 }), defender);
    const dmgAt500Diff = damageDealt(fighter({ martial: 500 }), defender);
    // 差距100已經封頂30%，再拉大差距唔應該再加傷（同一組種子下應該相等）
    expect(dmgAt500Diff).toBe(dmgAt100Diff);
  });

  it('treats missing martial as 0 on both sides (no crash, no bonus)', () => {
    const attacker = fighter();
    delete (attacker as { martial?: number }).martial;
    const defender = fighter({ defense: 20 });
    delete (defender as { martial?: number }).martial;
    expect(() => damageDealt(attacker, defender)).not.toThrow();
  });
});

describe('damage rebalance: random jitter (0.9x - 1.1x)', () => {
  it('produces varying damage across different seeds for identical inputs', () => {
    const attacker = fighter();
    const defender = fighter({ defense: 30 });
    const samples = new Set<number>();
    for (let seed = 1; seed <= 15; seed++) {
      samples.add(damageDealt(attacker, defender, seed * 100));
    }
    // 亂數波動應該令唔同種子產生至少幾個唔同嘅傷害數值，而非永遠一個固定數
    expect(samples.size).toBeGreaterThan(1);
  });
});
