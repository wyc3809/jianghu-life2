import { describe, expect, it } from 'vitest';
import { PRACTICE_ACTIONS, applyPracticeOutcome } from '../core/life/actions';
import { allTitles, syncTitles } from '../core/life/titles';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('飲酒系統：把酒買醉', () => {
  it('exposes drink_wine on the main practice menu', () => {
    const ids = PRACTICE_ACTIONS.map((a) => a.id);
    expect(ids).toContain('drink_wine');
  });

  it('costs health and increments the cumulative drink counter each time', () => {
    initRng(1);
    const state = createNewLife(1);
    const before = state.character.health;
    applyPracticeOutcome(state, 'drink_wine');
    expect(state.character.health).toBeLessThan(before);
    expect(Number(state.character.flags.wineDrunkCount)).toBe(1);

    applyPracticeOutcome(state, 'drink_wine');
    expect(Number(state.character.flags.wineDrunkCount)).toBe(2);
  });

  it('never drops health below 1 even after many drinks', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.health = 3;
    for (let i = 0; i < 10; i++) {
      applyPracticeOutcome(state, 'drink_wine');
    }
    expect(state.character.health).toBeGreaterThanOrEqual(1);
  });

  it('learns 醉八仙拳 once the drink count reaches 20, and not before or twice', () => {
    initRng(3);
    const state = createNewLife(3);
    for (let i = 0; i < 19; i++) {
      applyPracticeOutcome(state, 'drink_wine');
    }
    expect(state.character.skills).not.toContain('art_drunken_fist');

    const logs = applyPracticeOutcome(state, 'drink_wine');
    expect(state.character.skills).toContain('art_drunken_fist');
    expect(logs.some((l) => l.includes('醉八仙拳'))).toBe(true);

    const skillCountAfterLearning = state.character.skills.length;
    applyPracticeOutcome(state, 'drink_wine');
    // 學過就唔會再學一次（skills 唔會出現重複）
    expect(state.character.skills.length).toBe(skillCountAfterLearning);
    expect(state.character.skills.filter((id) => id === 'art_drunken_fist')).toHaveLength(1);
  });

  it('unlocks 微醺客/酒中客/醉八仙 titles at the respective drink-count thresholds', () => {
    initRng(4);
    const state = createNewLife(4);
    for (let i = 0; i < 5; i++) applyPracticeOutcome(state, 'drink_wine');
    syncTitles(state);
    expect(allTitles(state).some((t) => t.id === 'title_tipsy')).toBe(true);
    expect(allTitles(state).some((t) => t.id === 'title_wine_lover')).toBe(false);

    for (let i = 0; i < 15; i++) applyPracticeOutcome(state, 'drink_wine'); // 累計 20
    syncTitles(state);
    expect(allTitles(state).some((t) => t.id === 'title_wine_lover')).toBe(true);
    expect(allTitles(state).some((t) => t.id === 'title_drunken_immortal')).toBe(false);

    for (let i = 0; i < 40; i++) applyPracticeOutcome(state, 'drink_wine'); // 累計 60
    syncTitles(state);
    expect(allTitles(state).some((t) => t.id === 'title_drunken_immortal')).toBe(true);
  });
});
