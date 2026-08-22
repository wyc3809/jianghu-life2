import { describe, expect, it } from 'vitest';
import {
  BASIC_STRIKE,
  GUARD_STANCE,
  REST_HEAL_MOVE,
  REST_QI_MOVE,
  effectiveMoveCooldown,
  type CombatMoveDef,
} from '../data/skills/catalog';

function move(overrides: Partial<CombatMoveDef> = {}): CombatMoveDef {
  return {
    id: 'test_move',
    name: '測試招式',
    qiCost: 10,
    power: 1,
    description: '測試',
    ...overrides,
  };
}

describe('招式CD：按總威力評分分為 1~5 回合', () => {
  it('basic_strike and action moves are never gated by the weight-score logic', () => {
    expect(effectiveMoveCooldown(BASIC_STRIKE)).toBe(0);
    expect(effectiveMoveCooldown(GUARD_STANCE)).toBe(0);
    // 行動類仍照目錄手動 cooldown
    expect(effectiveMoveCooldown(REST_QI_MOVE)).toBe(REST_QI_MOVE.cooldown);
    expect(effectiveMoveCooldown(REST_HEAL_MOVE)).toBe(REST_HEAL_MOVE.cooldown);
  });

  it('a zero-power utility move (no attack) is never gated even outside the action-move list', () => {
    expect(effectiveMoveCooldown(move({ power: 0 }))).toBe(0);
  });

  it('a light plain strike lands in the lowest tier (CD1)', () => {
    expect(effectiveMoveCooldown(move({ power: 1.1 }))).toBe(1);
  });

  it('a moderately loaded strike (higher power + pierce) lands in a mid tier', () => {
    // power 1.5 + pierce 8% ≈ 長河崩拳，份量分落喺 CD2
    const cd = effectiveMoveCooldown(move({ power: 1.5, pierce: 0.08 }));
    expect(cd).toBeGreaterThanOrEqual(2);
    expect(cd).toBeLessThanOrEqual(3);
  });

  it('a heavily loaded multi-effect strike lands in the top tier (CD5)', () => {
    // 仿「千機連射」：低單擊威能但連擊、破防、控制、流血齊全，總份量最重
    const heavy = move({
      power: 0.7,
      multiHit: 4,
      pierce: 0.15,
      stunChance: 0.22,
      bleedChance: 0.25,
      bleedDamage: 5,
      bleedTurns: 2,
    });
    expect(effectiveMoveCooldown(heavy)).toBe(5);
  });

  it('cooldown tiers are monotonic: strictly heavier moves never get a shorter CD', () => {
    const light = move({ power: 1.0 });
    const heavier = move({ power: 1.0, pierce: 0.3, stunChance: 0.3 });
    expect(effectiveMoveCooldown(heavier)).toBeGreaterThanOrEqual(effectiveMoveCooldown(light));
  });

  it('CD always resolves to an integer between 0 and 5 for any attack move', () => {
    const samples = [
      move({ power: 0.7, multiHit: 3, bleedChance: 0.4, bleedDamage: 8, bleedTurns: 3, qiDrain: 10 }),
      move({ power: 2.15, pierce: 0.15, bleedChance: 0.4, bleedDamage: 8, bleedTurns: 2 }),
      move({ power: 1.7, pierce: 0.18, stunChance: 0.15, bleedChance: 0.45, bleedDamage: 10, bleedTurns: 3, lifesteal: 0.28 }),
    ];
    for (const m of samples) {
      const cd = effectiveMoveCooldown(m);
      expect(Number.isInteger(cd)).toBe(true);
      expect(cd).toBeGreaterThanOrEqual(0);
      expect(cd).toBeLessThanOrEqual(5);
    }
  });
});
