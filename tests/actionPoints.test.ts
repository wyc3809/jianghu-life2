import { describe, expect, it } from 'vitest';
import {
  ACTION_POINT_MAX,
  EVENT_ACTION_POINT_COST,
  hasEnoughActionPoints,
  spendActionPoints,
  tickActionPoints,
} from '../core/life/actionPoints';
import { createNewLife } from '../core/life/gameState';
import { applyChoice, resolvePendingEvent, startMonth } from '../core/life/eventEngine';
import { initRng } from '../core/random';

describe('actionPoints: 行動力池（事件節流）', () => {
  it('new characters start with a full action point pool', () => {
    initRng(1);
    const state = createNewLife(1);
    expect(state.character.actionPoints).toBe(ACTION_POINT_MAX);
    expect(hasEnoughActionPoints(state)).toBe(true);
  });

  it('spendActionPoints floors at 0 and never goes negative', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.actionPoints = 3;
    spendActionPoints(state, EVENT_ACTION_POINT_COST);
    expect(state.character.actionPoints).toBe(0);
    expect(hasEnoughActionPoints(state)).toBe(false);
  });

  it('tickActionPoints regenerates over real time but never exceeds the max', () => {
    initRng(3);
    const state = createNewLife(3);
    state.character.actionPoints = 0;
    tickActionPoints(state, 30);
    expect(state.character.actionPoints).toBeGreaterThan(0);
    tickActionPoints(state, 10_000);
    expect(state.character.actionPoints).toBe(ACTION_POINT_MAX);
  });

  it('tickActionPoints does nothing once the character has died', () => {
    initRng(4);
    const state = createNewLife(4);
    state.character.actionPoints = 0;
    state.character.alive = false;
    tickActionPoints(state, 60);
    expect(state.character.actionPoints).toBe(0);
  });

  it('applyChoice still resolves normally regardless of action points (gating lives in the store choose() action)', () => {
    initRng(5);
    const state = createNewLife(5);
    state.character.actionPoints = 0;
    for (let i = 0; i < 24 && !state.pending; i += 1) {
      state.pending = null;
      startMonth(state);
    }
    if (state.pending) {
      const event = resolvePendingEvent(state);
      if (event && event.choices[0]) {
        expect(() => applyChoice(state, event, event.choices[0]!.id)).not.toThrow();
      }
    }
  });
});
