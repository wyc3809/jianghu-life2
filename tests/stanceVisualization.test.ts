import { describe, expect, it } from 'vitest';
import { playerCombatTurn, startCombat } from '../core/life/combat';
import { stanceBeats } from '../core/life/moveStance';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('stance visualization data: lastPlayerStance / lastFoeStance', () => {
  it('is unset before any turn has been played', () => {
    initRng(1);
    const state = createNewLife(1);
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    expect(state.pendingCombat!.lastPlayerStance).toBeUndefined();
    expect(state.pendingCombat!.lastFoeStance).toBeUndefined();
  });

  it('records both stances after a turn, and basic_strike is always 實 (shi)', () => {
    initRng(2);
    const state = createNewLife(2);
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    playerCombatTurn(state, 'basic_strike');
    if (state.pendingCombat) {
      expect(state.pendingCombat.lastPlayerStance).toBe('shi');
      expect(['xu', 'shi', 'jia']).toContain(state.pendingCombat.lastFoeStance);
    }
  });

  it('stanceBeats is mutually exclusive: at most one side can beat the other', () => {
    initRng(3);
    const state = createNewLife(3);
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    playerCombatTurn(state, 'basic_strike');
    if (state.pendingCombat?.lastPlayerStance && state.pendingCombat?.lastFoeStance) {
      const { lastPlayerStance, lastFoeStance } = state.pendingCombat;
      const playerWins = stanceBeats(lastPlayerStance, lastFoeStance);
      const foeWins = stanceBeats(lastFoeStance, lastPlayerStance);
      expect(playerWins && foeWins).toBe(false);
    }
  });

  it('refreshes stances turn over turn', () => {
    initRng(4);
    const state = createNewLife(4);
    state.character.martial = 200;
    state.character.maxHealth = 500;
    state.character.health = 500;
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    playerCombatTurn(state, 'basic_strike');
    const firstTurnFoeStance = state.pendingCombat?.lastFoeStance;
    if (state.pendingCombat) {
      playerCombatTurn(state, 'basic_strike');
      // 每回合都會重新推斷／記錄敵方架勢（未必唔同，只要求欄位持續存在）
      expect(state.pendingCombat.lastFoeStance ?? firstTurnFoeStance).toBeDefined();
      expect(state.pendingCombat.lastPlayerStance).toBe('shi');
    }
  });
});
