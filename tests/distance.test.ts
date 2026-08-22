import { describe, expect, it } from 'vitest';
import { BASIC_STRIKE, type CombatMoveDef } from '../data/skills/catalog';
import {
  changeDistance,
  distanceDamageMult,
  inferMoveRange,
  isMoveAvailableAtDistance,
} from '../core/life/distance';
import { playerCombatTurn, setCombatDistance, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

function move(overrides: Partial<CombatMoveDef>): CombatMoveDef {
  return { id: 'test_move', name: '測試招', qiCost: 0, power: 1, description: '', ...overrides };
}

describe('distance: inferMoveRange', () => {
  it('treats basic strike as usable at any distance', () => {
    expect(inferMoveRange(BASIC_STRIKE)).toBe('any');
  });

  it('respects an explicit range field over inference', () => {
    expect(inferMoveRange(move({ range: 'far' }))).toBe('far');
  });

  it('infers close range for palm/fist-named moves', () => {
    expect(inferMoveRange(move({ id: 'iron_palm_strike' }))).toBe('close');
  });

  it('infers far range for hidden-weapon-named moves', () => {
    expect(inferMoveRange(move({ id: 'hidden_dart_throw' }))).toBe('far');
  });
});

describe('distance: isMoveAvailableAtDistance', () => {
  it('an "any" range move is always available', () => {
    expect(isMoveAvailableAtDistance(BASIC_STRIKE, 'close')).toBe(true);
    expect(isMoveAvailableAtDistance(BASIC_STRIKE, 'far')).toBe(true);
  });

  it('a close-range move works at close and mid, not far', () => {
    const m = move({ range: 'close' });
    expect(isMoveAvailableAtDistance(m, 'close')).toBe(true);
    expect(isMoveAvailableAtDistance(m, 'mid')).toBe(true);
    expect(isMoveAvailableAtDistance(m, 'far')).toBe(false);
  });

  it('a far-range move works at far and mid, not close', () => {
    const m = move({ range: 'far' });
    expect(isMoveAvailableAtDistance(m, 'far')).toBe(true);
    expect(isMoveAvailableAtDistance(m, 'mid')).toBe(true);
    expect(isMoveAvailableAtDistance(m, 'close')).toBe(false);
  });
});

describe('distance: distanceDamageMult', () => {
  it('gives no penalty for an any-range move regardless of distance', () => {
    expect(distanceDamageMult(BASIC_STRIKE, 'close')).toBe(1);
    expect(distanceDamageMult(BASIC_STRIKE, 'far')).toBe(1);
  });

  it('penalizes a close-range move fought at far range', () => {
    const m = move({ range: 'close' });
    expect(distanceDamageMult(m, 'far')).toBeLessThan(1);
  });

  it('penalizes a far-range move fought at close range', () => {
    const m = move({ range: 'far' });
    expect(distanceDamageMult(m, 'close')).toBeLessThan(1);
  });
});

describe('distance: changeDistance', () => {
  it('steps close <-> mid <-> far one notch at a time', () => {
    expect(changeDistance('mid', 'close')).toBe('close');
    expect(changeDistance('close', 'far')).toBe('mid');
    expect(changeDistance('mid', 'far')).toBe('far');
    expect(changeDistance('far', 'close')).toBe('mid');
  });

  it('is a no-op at the boundary in the same direction', () => {
    expect(changeDistance('close', 'close')).toBe('close');
    expect(changeDistance('far', 'far')).toBe('far');
  });
});

describe('distance: integrated into combat', () => {
  it('setCombatDistance adjusts combat.distance without consuming a turn', () => {
    initRng(1);
    const state = createNewLife(1);
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    expect(state.pendingCombat!.distance ?? 'mid').toBe('mid');
    const turnBefore = state.pendingCombat!.turn;

    setCombatDistance(state, 'close');
    expect(state.pendingCombat!.distance).toBe('close');
    expect(state.pendingCombat!.turn).toBe(turnBefore);
  });

  it('a real close-range skill (裂石掌, palm-named) is blocked when fought at far distance', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.martial = 200;
    state.character.maxHealth = 500;
    state.character.health = 500;
    state.character.qi = 200;
    state.character.maxQi = 200;
    state.character.skills = [...state.character.skills, 'art_stone_palm'];
    state.character.skillRanks = { ...state.character.skillRanks, art_stone_palm: 0 };
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    setCombatDistance(state, 'far');
    setCombatDistance(state, 'far'); // 中距 -> 遠距 -> 遠距（已到底）
    expect(state.pendingCombat!.distance).toBe('far');

    const logs = playerCombatTurn(state, 'mv_stone_palm');
    expect(logs.some((l) => l.includes('使不出來'))).toBe(true);
    // 招式落空並無實際結算：交手仍然進行中
    expect(state.pendingCombat).toBeTruthy();
  });

  it('basic_strike (any range) always goes through regardless of distance', () => {
    initRng(3);
    const state = createNewLife(3);
    state.character.martial = 200;
    state.character.maxHealth = 500;
    state.character.health = 500;
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    setCombatDistance(state, 'far');
    setCombatDistance(state, 'far');

    const logs = playerCombatTurn(state, 'basic_strike');
    expect(logs.some((l) => l.includes('使不出來'))).toBe(false);
  });
});
