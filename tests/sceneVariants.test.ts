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
});
