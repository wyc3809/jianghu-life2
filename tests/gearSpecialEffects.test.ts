import { describe, expect, it } from 'vitest';
import {
  GEAR_CATALOG,
  RARITY_COLOR_CLASS,
  formatGearSpecialLine,
  getGearDef,
  hasSpecialEffect,
  rarityLabel,
} from '../data/equipment/catalog';
import { applyGearSpecialOnHit, tryGearRevive } from '../core/life/gearSpecialEffects';
import { SeededRng } from '../core/random';
import type { CombatFighterState } from '../interfaces/lifeEngine';

function fighter(overrides: Partial<CombatFighterState> = {}): CombatFighterState {
  return {
    name: '我',
    hp: 100,
    maxHp: 100,
    qi: 50,
    maxQi: 50,
    attack: 20,
    defense: 5,
    hitBonus: 0,
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

describe('gear rarity: 6-tier white<green<blue<purple<orange<red', () => {
  it('defines exactly 6 rarities with labels and colour classes', () => {
    const order: Array<keyof typeof rarityLabel> = ['common', 'fine', 'rare', 'epic', 'mythic', 'divine'];
    for (const r of order) {
      expect(rarityLabel[r]).toBeTruthy();
      expect(RARITY_COLOR_CLASS[r]).toBeTruthy();
    }
  });

  it('mythic gear exists and sits between epic and divine in the catalog', () => {
    const mythicItems = GEAR_CATALOG.filter((g) => g.rarity === 'mythic');
    expect(mythicItems.length).toBeGreaterThanOrEqual(2);
  });
});

describe('gear special effects: epic/mythic/divine only', () => {
  it('marks epic, mythic and divine gear as having a special effect (when defined)', () => {
    const epic = getGearDef('inkrain-sword')!;
    const mythic = getGearDef('phoenix-blood-blade')!;
    const divine = getGearDef('divine-silk-armor')!;
    expect(hasSpecialEffect(epic)).toBe(true);
    expect(hasSpecialEffect(mythic)).toBe(true);
    expect(hasSpecialEffect(divine)).toBe(true);
    expect(formatGearSpecialLine(epic)).toContain(epic.special!.name);
  });

  it('does not apply to common/fine/rare gear even if a special field were present', () => {
    const common = getGearDef('old-sword')!;
    expect(hasSpecialEffect(common)).toBe(false);
    expect(formatGearSpecialLine(common)).toBe('');
  });
});

describe('gearSpecialEffects: applyGearSpecialOnHit', () => {
  it('burst: deals extra damage when the roll succeeds', () => {
    const attacker = fighter({
      attack: 20,
      gearSpecials: [{ kind: 'burst', name: '測試爆發', description: '測試', chance: 1, power: 0.5 }],
    });
    const defender = fighter({ hp: 100, maxHp: 100 });
    const rng = new SeededRng(1);
    const lines = applyGearSpecialOnHit(attacker, defender, rng);
    expect(defender.hp).toBe(90); // 100 - round(20*0.5)
    expect(lines.some((l) => l.includes('測試爆發'))).toBe(true);
  });

  it('burst: never triggers when chance is 0', () => {
    const attacker = fighter({
      gearSpecials: [{ kind: 'burst', name: '測試爆發', description: '測試', chance: 0, power: 0.5 }],
    });
    const defender = fighter({ hp: 100, maxHp: 100 });
    const rng = new SeededRng(2);
    const lines = applyGearSpecialOnHit(attacker, defender, rng);
    expect(defender.hp).toBe(100);
    expect(lines).toEqual([]);
  });

  it('stun_proc: stuns the defender when the roll succeeds', () => {
    const attacker = fighter({
      gearSpecials: [{ kind: 'stun_proc', name: '測試定身', description: '測試', chance: 1 }],
    });
    const defender = fighter({ stun: 0 });
    const rng = new SeededRng(3);
    const lines = applyGearSpecialOnHit(attacker, defender, rng);
    expect(defender.stun).toBeGreaterThanOrEqual(1);
    expect(lines.some((l) => l.includes('測試定身'))).toBe(true);
  });

  it('does nothing when the fighter has no gear specials', () => {
    const attacker = fighter();
    const defender = fighter();
    const rng = new SeededRng(4);
    expect(applyGearSpecialOnHit(attacker, defender, rng)).toEqual([]);
  });
});

describe('gearSpecialEffects: tryGearRevive', () => {
  it('revives once at a fraction of maxHp when equipped and hp has hit 0', () => {
    const f = fighter({
      hp: 0,
      maxHp: 200,
      gearSpecials: [{ kind: 'revive', name: '測試護體', description: '測試', power: 0.3 }],
    });
    const lines = tryGearRevive(f);
    expect(f.hp).toBe(60); // round(200 * 0.3)
    expect(f.usedGearRevive).toBe(true);
    expect(lines.some((l) => l.includes('測試護體'))).toBe(true);
  });

  it('does not revive twice in the same combat', () => {
    const f = fighter({
      hp: 0,
      maxHp: 200,
      usedGearRevive: true,
      gearSpecials: [{ kind: 'revive', name: '測試護體', description: '測試', power: 0.3 }],
    });
    expect(tryGearRevive(f)).toEqual([]);
    expect(f.hp).toBe(0);
  });

  it('does nothing when hp is still above 0', () => {
    const f = fighter({
      hp: 5,
      maxHp: 200,
      gearSpecials: [{ kind: 'revive', name: '測試護體', description: '測試', power: 0.3 }],
    });
    expect(tryGearRevive(f)).toEqual([]);
  });

  it('does nothing without a revive-kind special', () => {
    const f = fighter({
      hp: 0,
      maxHp: 200,
      gearSpecials: [{ kind: 'burst', name: '測試爆發', description: '測試', chance: 1, power: 0.5 }],
    });
    expect(tryGearRevive(f)).toEqual([]);
    expect(f.hp).toBe(0);
  });
});
