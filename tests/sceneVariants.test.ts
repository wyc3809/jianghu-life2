import { describe, expect, it } from 'vitest';
import { isInkNight, seasonToInk, sceneClassNames, placeToInk } from '../src/components/ink/sceneVariants';
import type { LifeGameState } from '../interfaces/lifeEngine';

function bareState(partial?: Partial<LifeGameState>): LifeGameState {
  return {
    seed: 't',
    year: 1,
    month: 3,
    phase: 'playing',
    character: {
      id: 'p',
      name: '試',
      age: 16,
      alive: true,
      location: '小鎮',
      flags: {},
      stats: { monthsLived: 1 },
      health: 100,
      maxHealth: 100,
      qi: 50,
      maxQi: 50,
      skills: [],
      equipment: { weapon: null, armor: null, accessory: null },
    },
    sects: {},
    lifeLog: [],
    ...partial,
  } as LifeGameState;
}

describe('sceneVariants paper atmosphere', () => {
  it('maps months to seasons', () => {
    expect(seasonToInk(1)).toBe('winter');
    expect(seasonToInk(3)).toBe('spring');
    expect(seasonToInk(6)).toBe('summer');
    expect(seasonToInk(9)).toBe('autumn');
    expect(seasonToInk(12)).toBe('winter');
  });

  it('detects night from copy and special pending', () => {
    expect(isInkNight({ title: '白日閒逛' })).toBe(false);
    expect(isInkNight({ title: '夜雨投店' })).toBe(true);
    expect(isInkNight({ tags: ['night'] })).toBe(true);
    expect(isInkNight({ pendingKind: 'special' })).toBe(true);
  });

  it('builds scene class names with night and omen', () => {
    const cls = sceneClassNames(
      bareState({
        month: 3,
        pending: { kind: 'special', eventId: 'e1' } as LifeGameState['pending'],
        character: {
          ...bareState().character,
          location: '華山腳下',
          flags: { rumor_boost: true },
        },
      }),
      { eventTitle: '奇遇' },
    );
    expect(cls).toContain('ink-scene--spring');
    expect(cls).toContain('ink-scene--mountain');
    expect(cls).toContain('ink-scene--night');
    expect(cls).toContain('ink-scene--omen');
    expect(placeToInk('官道')).toBe('wild');
  });

  it('classifies cliff/valley/bamboo-style locations for procedural scene variety', () => {
    expect(placeToInk('懸崖')).toBe('mountain');
    expect(placeToInk('藥谷')).toBe('mountain');
    expect(placeToInk('竹林')).toBe('wild');
    expect(placeToInk('古劍塚')).toBe('wild');
    expect(placeToInk('廢寺殘垣')).toBe('wild');
    expect(placeToInk('鏢局碼頭')).toBe('river');
    expect(placeToInk('溪畔')).toBe('river');
  });

  it('places former travel destinations (old saves) into a non-default scene bucket', () => {
    // 「打聽傳聞」擇路已刪（2026-10-14），但舊存檔嘅所在地可能仲係呢啲地名
    for (const name of ['古劍塚', '鏢局碼頭', '夜宴山莊', '藥谷溪畔', '廢寺殘垣']) {
      expect(placeToInk(name)).not.toBe('town');
    }
  });
});
