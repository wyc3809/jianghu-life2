import { describe, expect, it } from 'vitest';
import { playerCombatTurn, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('combat death tuning', () => {
  it('normal fight losses never kill — health floors at 1', () => {
    for (let seed = 1; seed <= 10; seed++) {
      initRng(seed);
      const state = createNewLife(seed);
      startCombat(state, { source: 'event', title: '試', foeName: '山賊', foePower: 'normal' });
      state.pendingCombat!.player.hp = 0;
      playerCombatTurn(state, 'basic_strike');
      expect(state.character.alive).toBe(true);
      expect(state.character.health).toBeGreaterThanOrEqual(1);
      expect(state.phase).not.toBe('summary');
    }
  });

  it('boss fight losses carry a bounded death chance, not a guaranteed kill', () => {
    let deaths = 0;
    let survivals = 0;
    for (let seed = 1; seed <= 60; seed++) {
      initRng(seed);
      const state = createNewLife(seed);
      startCombat(state, { source: 'event', title: '試', foeName: '寨主', foePower: 'boss' });
      state.pendingCombat!.player.hp = 0;
      playerCombatTurn(state, 'basic_strike');
      if (state.character.alive) survivals++;
      else deaths++;
    }
    expect(deaths).toBeGreaterThan(0);
    expect(survivals).toBeGreaterThan(0);
    // 30% 死亡率設計：60 個種子唔應該接近全死或全生
    expect(deaths).toBeLessThan(40);
    expect(survivals).toBeGreaterThan(20);
  });
});
