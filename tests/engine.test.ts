import { describe, expect, it } from 'vitest';
import { initRng, SeededRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { startMonth } from '../core/life/eventEngine';

describe('SeededRng', () => {
  it('is deterministic for same seed', () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });
});

describe('life engine', () => {
  it('creates a new life with seed', () => {
    initRng(12345);
    const state = createNewLife({ seed: 12345 });
    expect(state.character.name).toBeTruthy();
    expect(state.character.age).toBeGreaterThanOrEqual(0);
    expect(state.phase).toBe('playing');
  });

  it('advances month without crashing', () => {
    initRng(7);
    const state = createNewLife({ seed: 7 });
    const beforeMonth = state.month;
    startMonth(state);
    expect(state.month).toBe(beforeMonth + 1);
  });
});
