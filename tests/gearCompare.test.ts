import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { grantGear, resolveGearCompare } from '../core/life/equipment';

describe('新裝備彈窗：獲得裝備時詢問是否換上', () => {
  it('grantGear sets pendingGearCompare for a genuinely new item', () => {
    initRng(1);
    const state = createNewLife(1);
    expect(state.pendingGearCompare).toBeFalsy();
    grantGear(state, 'inkrain-sword');
    expect(state.pendingGearCompare).toEqual({ gearId: 'inkrain-sword' });
  });

  it('does not re-trigger the popup when granting an item already owned', () => {
    initRng(2);
    const state = createNewLife(2);
    grantGear(state, 'inkrain-sword');
    state.pendingGearCompare = null; // 玩家已經處理過
    grantGear(state, 'inkrain-sword'); // 重複獲贈同一件（已擁有）
    expect(state.pendingGearCompare).toBeNull();
  });

  it('resolveGearCompare("equip") equips the new item and clears the pending flag', () => {
    initRng(3);
    const state = createNewLife(3);
    grantGear(state, 'inkrain-sword');
    const msg = resolveGearCompare(state, 'equip');
    expect(state.character.equipment.weapon).toBe('inkrain-sword');
    expect(state.pendingGearCompare).toBeNull();
    expect(msg).toContain('已裝備');
  });

  it('resolveGearCompare("keep") leaves the equipped slot untouched and clears the pending flag', () => {
    initRng(4);
    const state = createNewLife(4);
    const equippedBefore = state.character.equipment.weapon;
    grantGear(state, 'inkrain-sword');
    const msg = resolveGearCompare(state, 'keep');
    expect(state.character.equipment.weapon).toBe(equippedBefore);
    expect(state.character.gear).toContain('inkrain-sword'); // 仍留喺行囊
    expect(state.pendingGearCompare).toBeNull();
    expect(msg).toContain('收入行囊');
  });

  it('resolveGearCompare is a safe no-op when nothing is pending', () => {
    initRng(5);
    const state = createNewLife(5);
    expect(resolveGearCompare(state, 'equip')).toBe('');
  });
});
