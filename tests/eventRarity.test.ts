import { describe, expect, it } from 'vitest';
import {
  EVENT_RARITY_LABEL,
  rarityForOrdinaryEvent,
  rarityForSpecialEvent,
} from '../core/life/eventRarity';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { startMonth } from '../core/life/eventEngine';

describe('event rarity: pure derivation helpers', () => {
  it('rarityForOrdinaryEvent falls back to white at the default weight (10)', () => {
    expect(rarityForOrdinaryEvent(undefined)).toBe('white');
    expect(rarityForOrdinaryEvent(10)).toBe('white');
    expect(rarityForOrdinaryEvent(20)).toBe('white');
  });

  it('rarityForOrdinaryEvent promotes to blue when weight is curator-marked rarer (<=5)', () => {
    expect(rarityForOrdinaryEvent(5)).toBe('blue');
    expect(rarityForOrdinaryEvent(3)).toBe('blue');
    expect(rarityForOrdinaryEvent(1)).toBe('blue');
  });

  it('rarityForSpecialEvent reserves gold for boss picks, purple for the rest', () => {
    expect(rarityForSpecialEvent(true)).toBe('gold');
    expect(rarityForSpecialEvent(false)).toBe('purple');
  });

  it('exposes a display label for every rarity tier', () => {
    expect(EVENT_RARITY_LABEL.white).toBeTruthy();
    expect(EVENT_RARITY_LABEL.blue).toBeTruthy();
    expect(EVENT_RARITY_LABEL.purple).toBeTruthy();
    expect(EVENT_RARITY_LABEL.gold).toBeTruthy();
  });
});

describe('event rarity: attached to state.pending by the event engine', () => {
  it('every event drawn by startMonth carries a rarity tier consistent with its kind', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      initRng(seed);
      let state = createNewLife(seed);
      state = startMonth(state);
      if (!state.pending) continue;
      expect(['white', 'blue', 'purple', 'gold']).toContain(state.pending.rarity);
      if (state.pending.kind === 'special' && state.pending.rarity !== 'gold') {
        expect(state.pending.rarity).toBe('purple');
      }
    }
  });
});
