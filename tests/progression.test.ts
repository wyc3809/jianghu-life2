import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { calculateProgress } from '../core/life/progression';
import { initRng } from '../core/random';

describe('calculateProgress', () => {
  it('normalizes martial/reputation/wealth into 0-100 bars matching raw stats', () => {
    initRng(1);
    const state = createNewLife(1);
    state.character.martial = 150;
    state.character.reputation = 50;
    state.character.money = 250;

    const progress = calculateProgress(state);
    const martial = progress.bars.find((b) => b.key === 'martial')!;
    const reputation = progress.bars.find((b) => b.key === 'reputation')!;
    const wealth = progress.bars.find((b) => b.key === 'wealth')!;

    expect(martial.raw).toBe(150);
    expect(martial.percent).toBe(50);
    expect(reputation.raw).toBe(50);
    expect(reputation.percent).toBe(25);
    expect(wealth.raw).toBe(250);
    expect(wealth.percent).toBe(50);
  });

  it('clamps percent at 100 even when raw stats exceed the soft cap', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.martial = 9000;
    state.character.reputation = 9000;
    state.character.money = 9000;

    const progress = calculateProgress(state);
    for (const bar of progress.bars) {
      expect(bar.percent).toBe(100);
    }
  });

  it('returns null sect progress when the character has not joined a sect', () => {
    initRng(3);
    const state = createNewLife(3);
    state.character.sectId = null;

    const progress = calculateProgress(state);
    expect(progress.sect).toBeNull();
  });

  it('reports sect standing progress and the next rank label when in a sect', () => {
    initRng(4);
    const state = createNewLife(4);
    state.character.sectId = 'some_sect';
    state.character.sectStanding = 1;

    const progress = calculateProgress(state);
    expect(progress.sect).not.toBeNull();
    expect(progress.sect!.standing).toBe(1);
    expect(progress.sect!.nextLabel).not.toBeNull();
    expect(progress.sect!.percent).toBeGreaterThan(0);
    expect(progress.sect!.percent).toBeLessThan(100);
  });

  it('reports no next label at max sect standing', () => {
    initRng(5);
    const state = createNewLife(5);
    state.character.sectId = 'some_sect';
    state.character.sectStanding = 3;

    const progress = calculateProgress(state);
    expect(progress.sect!.nextLabel).toBeNull();
    expect(progress.sect!.percent).toBe(100);
  });
});
