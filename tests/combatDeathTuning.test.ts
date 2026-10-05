import { describe, expect, it } from 'vitest';
import {
  confirmLifeOrDeath,
  declineLifeOrDeath,
  needsLifeOrDeathConfirm,
  playerCombatTurn,
  startCombat,
} from '../core/life/combat';
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

  it('test_boss_fight_loss_without_life_or_death_mark_never_kills', () => {
    for (let seed = 1; seed <= 60; seed++) {
      initRng(seed);
      const state = createNewLife(seed);
      startCombat(state, { source: 'event', title: '試', foeName: '寨主', foePower: 'boss' });
      state.pendingCombat!.player.hp = 0;
      playerCombatTurn(state, 'basic_strike');
      expect(state.character.alive).toBe(true);
      expect(state.character.health).toBeGreaterThanOrEqual(1);
    }
  });

  it('test_life_or_death_fight_needs_confirmation_before_any_move', () => {
    initRng(3);
    const state = createNewLife(3);
    startCombat(state, { source: 'event', title: '試', foeName: '寨主', foePower: 'boss', lifeOrDeath: true });
    expect(needsLifeOrDeathConfirm(state.pendingCombat)).toBe(true);
    const hpBefore = state.pendingCombat!.foe.hp;
    const lines = playerCombatTurn(state, 'basic_strike');
    expect(lines.join('')).toContain('先確認應戰');
    expect(state.pendingCombat!.foe.hp).toBe(hpBefore);
    expect(state.pendingCombat!.turn).toBe(1);
  });

  it('test_life_or_death_decline_ends_fight_alive_without_combat', () => {
    initRng(4);
    const state = createNewLife(4);
    const combats = state.character.stats.combats;
    startCombat(state, { source: 'event', title: '試', foeName: '寨主', foePower: 'boss', lifeOrDeath: true });
    declineLifeOrDeath(state);
    expect(state.pendingCombat).toBeNull();
    expect(state.character.alive).toBe(true);
    expect(state.character.stats.combats).toBe(combats);
  });

  it('test_confirmed_life_or_death_loss_kills', () => {
    initRng(5);
    const state = createNewLife(5);
    startCombat(state, { source: 'event', title: '試', foeName: '寨主', foePower: 'boss', lifeOrDeath: true });
    confirmLifeOrDeath(state);
    expect(needsLifeOrDeathConfirm(state.pendingCombat)).toBe(false);
    state.pendingCombat!.player.hp = 0;
    playerCombatTurn(state, 'basic_strike');
    expect(state.character.alive).toBe(false);
    expect(state.phase).toBe('summary');
  });
});
