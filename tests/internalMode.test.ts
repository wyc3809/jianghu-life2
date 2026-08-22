import { describe, expect, it } from 'vitest';
import {
  BASIC_INTERNAL_MODE_ID,
  INTERNAL_MODES,
  applySnakeVenom,
  getInternalMode,
  modeAttackMult,
  modeDamageTakenMult,
  modeDefenseMult,
  modeEvasionBonus,
  modeLifestealBonus,
  modeReflectBonus,
  resolveInternalModeOptions,
  tickInternalMode,
} from '../core/life/internalMode';
import { getRng, initRng } from '../core/random';
import type { CombatFighterState } from '../interfaces/lifeEngine';
import {
  getPlayerInternalModeOptions,
  playerCombatTurn,
  setCombatInternalMode,
  startCombat,
} from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';

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

describe('internalMode: pure lookups', () => {
  it('returns null for no mode / unknown id', () => {
    expect(getInternalMode(null)).toBeNull();
    expect(getInternalMode(undefined)).toBeNull();
    expect(getInternalMode('not_a_mode')).toBeNull();
  });

  it('returns neutral defaults when no mode is active', () => {
    expect(modeAttackMult(null)).toBe(1);
    expect(modeDefenseMult(null)).toBe(1);
    expect(modeEvasionBonus(null)).toBe(0);
    expect(modeDamageTakenMult(null)).toBe(1);
    expect(modeLifestealBonus(null)).toBe(0);
    expect(modeReflectBonus(null)).toBe(0);
  });

  it('guixi (龜息) trades attack for defense and reduced damage taken', () => {
    expect(modeAttackMult('guixi')).toBeLessThan(1);
    expect(modeDefenseMult('guixi')).toBeGreaterThan(1);
    expect(modeDamageTakenMult('guixi')).toBeLessThan(1);
  });

  it('huxiao (虎嘯) boosts attack and lifesteal at the cost of taking more damage', () => {
    expect(modeAttackMult('huxiao')).toBeGreaterThan(1);
    expect(modeLifestealBonus('huxiao')).toBeGreaterThan(0);
    expect(modeDamageTakenMult('huxiao')).toBeGreaterThan(1);
  });

  it('hexian (鶴翔) grants evasion', () => {
    expect(modeEvasionBonus('hexian')).toBeGreaterThan(0);
  });

  it('registers exactly the four documented modes', () => {
    expect(INTERNAL_MODES.map((m) => m.id).sort()).toEqual(['guixi', 'hexian', 'huxiao', 'shepan']);
  });
});

describe('internalMode: resolveInternalModeOptions (角色實際習得嘅內功)', () => {
  it('shows a single 基本內功 option (no effect) when only the baseline breath is learned', () => {
    const options = resolveInternalModeOptions(['基礎吐納', 'art_river_fist']);
    expect(options).toHaveLength(1);
    expect(options[0]!.id).toBe(BASIC_INTERNAL_MODE_ID);
    expect(options[0]!.name).toBe('基本內功');
    expect(options[0]!.qiCostPerTurn).toBe(0);
    expect(options[0]!.effects).toEqual({});
  });

  it('also falls back to 基本內功 for an empty skill list', () => {
    const options = resolveInternalModeOptions([]);
    expect(options).toEqual([expect.objectContaining({ id: BASIC_INTERNAL_MODE_ID })]);
  });

  it('surfaces a learned defense-leaning internal art (鐵布衫) under the guixi effect profile, with its real name', () => {
    const options = resolveInternalModeOptions(['基礎吐納', 'art_iron_body']);
    expect(options).toHaveLength(1);
    expect(options[0]!.id).toBe('guixi');
    expect(options[0]!.name).toBe('鐵布衫');
    // 效果數值沿用 guixi 範本，唔會因為改名而變
    expect(options[0]!.effects).toEqual(getInternalMode('guixi')!.effects);
  });

  it('surfaces a learned attack-leaning internal art (虎嘯內勁) under the huxiao effect profile, with its real name', () => {
    const options = resolveInternalModeOptions(['基礎吐納', 'art_tiger_breath']);
    expect(options).toHaveLength(1);
    expect(options[0]!.id).toBe('huxiao');
    expect(options[0]!.name).toBe('虎嘯內勁');
  });

  it('lists multiple options when the character learned arts spanning different archetypes', () => {
    const options = resolveInternalModeOptions(['基礎吐納', 'art_iron_body', 'art_tiger_breath']);
    const ids = options.map((o) => o.id).sort();
    expect(ids).toEqual(['guixi', 'huxiao']);
    expect(options.find((o) => o.id === 'guixi')?.name).toBe('鐵布衫');
    expect(options.find((o) => o.id === 'huxiao')?.name).toBe('虎嘯內勁');
  });

  it('picks the strongest matching art when several learned skills map to the same archetype', () => {
    // sl_iron_shirt（防14／血50／反12%）比 art_iron_body（防12／血40／反8%）更強，理應勝出
    const options = resolveInternalModeOptions(['基礎吐納', 'art_iron_body', 'sl_iron_shirt']);
    const guixiOpt = options.find((o) => o.id === 'guixi');
    expect(guixiOpt?.name).toBe('鐵布衫功');
  });
});

describe('internalMode: tickInternalMode upkeep', () => {
  it('deducts the qi upkeep cost each tick while a mode is active', () => {
    initRng(1);
    const f = fighter({ internalMode: 'huxiao', qi: 50 });
    tickInternalMode(f, getRng());
    expect(f.qi).toBe(50 - 8); // huxiao qiCostPerTurn = 8
  });

  it('cancels the mode when qi runs short, with a narrative line', () => {
    initRng(2);
    const f = fighter({ internalMode: 'huxiao', qi: 2 });
    const lines = tickInternalMode(f, getRng());
    expect(f.internalMode).toBeNull();
    expect(lines.some((l) => l.includes('中斷'))).toBe(true);
  });

  it('is a no-op when no mode is active', () => {
    initRng(3);
    const f = fighter({ internalMode: null, qi: 50 });
    const lines = tickInternalMode(f, getRng());
    expect(lines).toEqual([]);
    expect(f.qi).toBe(50);
  });

  it('is a no-op for the 基本內功 (basic) placeholder mode — no qi cost, no narrative line', () => {
    initRng(3);
    const f = fighter({ internalMode: BASIC_INTERNAL_MODE_ID, qi: 50 });
    const lines = tickInternalMode(f, getRng());
    expect(lines).toEqual([]);
    expect(f.qi).toBe(50);
    expect(f.internalMode).toBe(BASIC_INTERNAL_MODE_ID);
  });
});

describe('internalMode: applySnakeVenom', () => {
  it('does nothing outside shepan mode', () => {
    const attacker = fighter({ internalMode: 'huxiao' });
    const defender = fighter();
    expect(applySnakeVenom(attacker, defender)).toEqual([]);
    expect(attacker.venomStacks).toBeUndefined();
  });

  it('accumulates stacks and explodes with poison damage at 5 stacks', () => {
    const attacker = fighter({ internalMode: 'shepan', attack: 50 });
    const defender = fighter({ hp: 200, maxHp: 200 });
    for (let i = 0; i < 4; i++) {
      applySnakeVenom(attacker, defender);
    }
    expect(attacker.venomStacks).toBe(4);
    expect(defender.hp).toBe(200);

    const explodeLines = applySnakeVenom(attacker, defender);
    expect(attacker.venomStacks).toBe(0);
    expect(defender.hp).toBeLessThan(200);
    expect(explodeLines.some((l) => l.includes('劇毒蝕骨'))).toBe(true);
  });
});

describe('internalMode: integrated into combat', () => {
  it('setCombatInternalMode switches mode without consuming a turn, and rejects unknown ids', () => {
    initRng(4);
    const state = createNewLife(4);
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    const turnBefore = state.pendingCombat!.turn;

    const lines = setCombatInternalMode(state, 'huxiao');
    expect(state.pendingCombat!.player.internalMode).toBe('huxiao');
    expect(state.pendingCombat!.turn).toBe(turnBefore);
    expect(lines.some((l) => l.includes('虎嘯'))).toBe(true);

    const badLines = setCombatInternalMode(state, 'no_such_mode');
    expect(badLines[0]).toContain('未知');
    expect(state.pendingCombat!.player.internalMode).toBe('huxiao');

    const clearLines = setCombatInternalMode(state, null);
    expect(state.pendingCombat!.player.internalMode).toBeNull();
    expect(clearLines.some((l) => l.includes('卸下'))).toBe(true);
  });

  it('getPlayerInternalModeOptions shows 基本內功 for a fresh character, and the real skill name once one is learned', () => {
    initRng(6);
    const state = createNewLife(6);
    expect(getPlayerInternalModeOptions(state)).toEqual([
      expect.objectContaining({ id: BASIC_INTERNAL_MODE_ID, name: '基本內功' }),
    ]);

    state.character.skills.push('art_iron_body');
    const options = getPlayerInternalModeOptions(state);
    expect(options).toEqual([expect.objectContaining({ id: 'guixi', name: '鐵布衫' })]);

    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    const lines = setCombatInternalMode(state, 'guixi');
    expect(lines.some((l) => l.includes('鐵布衫'))).toBe(true);
    expect(state.pendingCombat!.player.internalMode).toBe('guixi');
  });

  it('playerCombatTurn deducts the qi upkeep while a mode stays active', () => {
    initRng(5);
    const state = createNewLife(5);
    state.character.martial = 200;
    state.character.maxHealth = 500;
    state.character.health = 500;
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    // huxiao 冇 qiRegenBonus，淨消耗最易驗證（guixi 因為有 qiRegenBonus 反而可能淨回氣）
    setCombatInternalMode(state, 'huxiao'); // qiCostPerTurn = 8
    const qiBefore = state.pendingCombat!.player.qi;
    playerCombatTurn(state, 'basic_strike');
    if (state.pendingCombat) {
      expect(state.pendingCombat.player.qi).toBeLessThanOrEqual(qiBefore - 8);
    }
  });
});
