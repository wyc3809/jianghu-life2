import { describe, expect, it } from 'vitest';
import {
  PRESTIGE_TIERS,
  gainJianghuPrestige,
  gainPrestigeForCombatWin,
  jianghuPrestige,
  jianghuPrestigeTier,
  nextPrestigeTier,
} from '../core/life/jianghuPrestige';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('jianghu prestige', () => {
  it('starts every new life at 0, tier 初窺門徑', () => {
    initRng(1);
    const state = createNewLife(1);
    expect(jianghuPrestige(state)).toBe(0);
    expect(jianghuPrestigeTier(0)).toBe('初窺門徑');
  });

  it('gainJianghuPrestige only ever increases the score, never decreases it', () => {
    initRng(2);
    const state = createNewLife(2);
    gainJianghuPrestige(state, 30);
    expect(jianghuPrestige(state)).toBe(30);
    expect(gainJianghuPrestige(state, 0)).toEqual([]);
    expect(gainJianghuPrestige(state, -50)).toEqual([]);
    expect(jianghuPrestige(state)).toBe(30);
  });

  it('reports a tier-crossing narrative line only when a new tier is reached', () => {
    initRng(3);
    const state = createNewLife(3);
    const smallGain = gainJianghuPrestige(state, 5);
    expect(smallGain).toEqual([]);

    const crossing = gainJianghuPrestige(state, 40);
    expect(jianghuPrestige(state)).toBe(45);
    expect(crossing).toHaveLength(1);
    expect(crossing[0]).toContain('初出茅廬');
  });

  it('nextPrestigeTier returns the next threshold, or null at the top tier', () => {
    const top = PRESTIGE_TIERS[PRESTIGE_TIERS.length - 1]!;
    expect(nextPrestigeTier(0)?.label).toBe(PRESTIGE_TIERS[1]!.label);
    expect(nextPrestigeTier(top.min)).toBeNull();
  });

  it('gainPrestigeForCombatWin scales with foe power, boss winning the most', () => {
    initRng(4);
    const weak = createNewLife(4);
    const normal = createNewLife(4);
    const boss = createNewLife(4);
    gainPrestigeForCombatWin(weak, 'weak');
    gainPrestigeForCombatWin(normal, 'normal');
    gainPrestigeForCombatWin(boss, 'boss');
    expect(jianghuPrestige(weak)).toBeLessThan(jianghuPrestige(normal));
    expect(jianghuPrestige(normal)).toBeLessThan(jianghuPrestige(boss));
  });
});
