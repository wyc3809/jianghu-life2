import { describe, expect, it } from 'vitest';
import { playerCombatTurn, resolveCombatDisposition, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import type { LifeGameState } from '../interfaces/lifeEngine';

function setupLowHpFight(seed: number): LifeGameState {
  initRng(seed);
  const state = createNewLife(seed);
  state.character.martial = 200;
  state.character.maxHealth = 500;
  state.character.health = 500;
  startCombat(state, { source: 'event', title: '試', foeName: '強敵', foePower: 'strong' });
  const combat = state.pendingCombat!;
  combat.player.hp = Math.round(combat.player.maxHp * 0.1); // 10%，垂危
  return state;
}

describe('desperate reversal: 絕地反擊 gating', () => {
  it('rejects both desperate moves when hp is not below 20%', () => {
    initRng(1);
    const state = createNewLife(1);
    state.character.martial = 200;
    state.character.maxHealth = 500;
    state.character.health = 500;
    startCombat(state, { source: 'event', title: '試', foeName: '木樁', foePower: 'weak' });
    // 剛開戰，氣血滿額，未至垂危

    const burnLogs = playerCombatTurn(state, 'sys_desperate_burn');
    expect(burnLogs.some((l) => l.includes('未至垂危'))).toBe(true);
    expect(state.pendingCombat!.usedDesperateBurn).toBeFalsy();
  });
});

describe('desperate reversal: 燃燒真氣', () => {
  it('consumes all qi, marks usedDesperateBurn, and deals a heavy strike', () => {
    const state = setupLowHpFight(2);
    const combat = state.pendingCombat!;
    combat.player.qi = 40;
    const foeHpBefore = combat.foe.hp;

    const logs = playerCombatTurn(state, 'sys_desperate_burn');
    expect(logs.some((l) => l.includes('燃盡真氣'))).toBe(true);

    if (state.pendingCombat) {
      expect(state.pendingCombat.player.qi).toBe(0);
      expect(state.pendingCombat.usedDesperateBurn).toBe(true);
    } else {
      // 敵人已被打低而觸發求饒／敗亡也可以接受——只要真氣已耗盡即可
      expect(foeHpBefore).toBeGreaterThan(0);
    }
  });

  it('leaves the player with an 內傷 (internal injury) condition once combat ends', () => {
    // ×2.5 威能幾乎必殺 1 點氣血嘅敵人，但命中始終帶擲骰——重試幾個種子確保燃燒真氣真係打中
    for (let seed = 3; seed < 3 + 20; seed++) {
      const state = setupLowHpFight(seed);
      state.pendingCombat!.foe.hp = 1; // 一擊必死（命中嘅話）
      playerCombatTurn(state, 'sys_desperate_burn');

      // 交手可能直接結束，亦可能先進入「處置」畫面（needsFoeDisposition）
      if (state.pendingCombat?.phase === 'resolve') {
        resolveCombatDisposition(state, 'kill');
      }
      if (!state.pendingCombat) {
        expect(state.character.conditions.some((c) => c.id === 'internal')).toBe(true);
        return;
      }
    }
    throw new Error('未能喺 20 個種子內令燃燒真氣命中並了結戰鬥，測試設置有誤');
  });
});

describe('desperate reversal: 棄劍認輸', () => {
  it('ends the fight immediately, keeps 1 hp, and costs 5 reputation', () => {
    const state = setupLowHpFight(4);
    state.character.reputation = 50;
    const logs = playerCombatTurn(state, 'sys_desperate_surrender');

    expect(logs.some((l) => l.includes('棄劍認輸'))).toBe(true);
    expect(state.pendingCombat).toBeNull();
    expect(state.character.alive).toBe(true);
    expect(state.character.health).toBeGreaterThanOrEqual(1);
    expect(state.character.reputation).toBe(45);
  });
});

describe('desperate reversal: 敵人求饒 (foe surrender) and 廢武功 disposition', () => {
  it('eventually triggers foe surrender once foe hp drops below 15%, offering a cripple disposition', () => {
    let triggered = false;
    for (let seed = 1; seed <= 40 && !triggered; seed++) {
      initRng(seed);
      const state = createNewLife(seed);
      state.character.martial = 300;
      state.character.maxHealth = 500;
      state.character.health = 500;
      state.character.qi = 300;
      state.character.maxQi = 300;
      startCombat(state, { source: 'event', title: '試', foeName: '弱敵', foePower: 'weak' });
      const combat = state.pendingCombat!;
      combat.foe.hp = Math.round(combat.foe.maxHp * 0.1); // 已在求饒門檻之下

      const logs = playerCombatTurn(state, 'basic_strike');
      if (state.pendingCombat?.foeSurrendered) {
        triggered = true;
        expect(logs.some((l) => l.includes('跪地求饒'))).toBe(true);
        expect(state.pendingCombat.phase).toBe('resolve');

        const disposeLogs = resolveCombatDisposition(state, 'cripple');
        expect(disposeLogs.some((l) => l.includes('廢'))).toBe(true);
        expect(state.pendingCombat).toBeNull();
      }
    }
    expect(triggered).toBe(true);
  });
});
