import { describe, expect, it } from 'vitest';
import { BASIC_STRIKE, type CombatMoveDef } from '../data/skills/catalog';
import {
  COMBO_PATTERNS,
  checkCombo,
  moveCategory,
  pushComboHistory,
} from '../core/life/comboSystem';
import { playerCombatTurn, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

function move(overrides: Partial<CombatMoveDef>): CombatMoveDef {
  return { id: 'test_move', name: '測試招', qiCost: 0, power: 1, description: '', ...overrides };
}

describe('comboSystem: moveCategory', () => {
  it('classifies basic strike as strike category', () => {
    expect(moveCategory(BASIC_STRIKE)).toBe('strike');
  });

  it('classifies a multi-hit move as combo category', () => {
    expect(moveCategory(move({ multiHit: 2 }))).toBe('combo');
  });

  it('classifies a piercing move as break category', () => {
    expect(moveCategory(move({ pierce: 0.3 }))).toBe('break');
  });

  it('classifies a stunning move as control category', () => {
    expect(moveCategory(move({ stunChance: 0.3 }))).toBe('control');
  });
});

describe('comboSystem: pushComboHistory', () => {
  it('keeps only the most recent maxLen entries, FIFO', () => {
    let history: string[] = [];
    history = pushComboHistory(history, 'a');
    history = pushComboHistory(history, 'b');
    history = pushComboHistory(history, 'c');
    history = pushComboHistory(history, 'd');
    expect(history).toEqual(['b', 'c', 'd']);
  });
});

describe('comboSystem: checkCombo', () => {
  it('returns null when history is shorter than every pattern', () => {
    expect(checkCombo([BASIC_STRIKE])).toBeNull();
  });

  it('matches 連環快打 on three consecutive strike-category moves', () => {
    const result = checkCombo([BASIC_STRIKE, BASIC_STRIKE, BASIC_STRIKE]);
    expect(result?.pattern.id).toBe('lianhuan_kuaida');
  });

  it('matches a stance-sequence pattern (梯雲縱突襲: xu then shi)', () => {
    const xuMove = move({ id: 'xu_move', stance: 'xu' });
    const shiMove = move({ id: 'shi_move', stance: 'shi' });
    const result = checkCombo([xuMove, shiMove]);
    expect(result?.pattern.id).toBe('tiyun_zong_tuxi');
  });

  it('does not match when the sequence breaks the pattern', () => {
    const jiaMove = move({ id: 'jia_move', stance: 'jia' });
    const result = checkCombo([jiaMove, jiaMove], COMBO_PATTERNS.filter((p) => p.id === 'lianhuan_kuaida'));
    expect(result).toBeNull();
  });
});

describe('comboSystem: integrated into playerCombatTurn', () => {
  it('triggers 連環快打 on the third consecutive basic strike and resets history afterwards', () => {
    initRng(42);
    const state = createNewLife(42);
    state.character.martial = 200;
    state.character.maxHealth = 500;
    state.character.health = 500;
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    // 確保過程唔會暈眩打斷連招偵測
    state.pendingCombat!.player.stun = 0;

    let triggeredAt = -1;
    for (let turn = 1; turn <= 3 && state.pendingCombat; turn++) {
      state.pendingCombat.player.stun = 0;
      const logs = playerCombatTurn(state, 'basic_strike');
      if (logs.some((l) => l.includes('連環快打'))) triggeredAt = turn;
    }

    expect(triggeredAt).toBe(3);
    // 觸發後歷史清空，防止無限疊加
    if (state.pendingCombat) {
      expect(state.pendingCombat.moveHistory).toEqual([]);
    }
  });
});
