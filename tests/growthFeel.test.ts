import { describe, expect, it } from 'vitest';
import { PRACTICE_ACTIONS, performPracticeAction } from '../core/life/actions';
import { tryAdvanceSkill } from '../core/life/flavor';
import { skillAdvanceHint } from '../core/life/martialRanks';
import { hasRankUpContent, isRankUpStoryLine, RANK_UP_MARKER } from '../core/life/playerText';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('growth feel: practice menu access without a sect', () => {
  it('exposes train_martial/train_internal/temper_body on the main practice menu', () => {
    const ids = PRACTICE_ACTIONS.map((a) => a.id);
    expect(ids).toContain('train_martial');
    expect(ids).toContain('train_internal');
    expect(ids).toContain('temper_body');
  });

  it('performPracticeAction runs train_martial without a sectId and raises martial', () => {
    initRng(1);
    const state = createNewLife(1);
    const before = state.character.martial;
    const before_left = state.practiceActionsLeft;
    const logs = performPracticeAction(state, 'train_martial');
    expect(state.character.martial).toBeGreaterThan(before);
    expect(state.practiceActionsLeft).toBe((before_left ?? 3) - 1);
    expect(logs.some((l) => /武學＋/.test(l))).toBe(true);
  });

  it('performPracticeAction runs temper_body without a sectId and raises max health', () => {
    initRng(2);
    const state = createNewLife(2);
    const before = state.character.maxHealth;
    performPracticeAction(state, 'temper_body');
    expect(state.character.maxHealth).toBeGreaterThan(before);
  });
});

describe('growth feel: rank-up marker', () => {
  it('tryAdvanceSkill marks rite text with RANK_UP_MARKER when it crosses the threshold', () => {
    initRng(3);
    const state = createNewLife(3);
    const skillId = state.character.skills[0] ?? '基礎吐納';
    state.character.skillRanks = { [skillId]: 0 };
    state.character.skillProgress = { [skillId]: 0 };
    state.character.skillAdvanceNeed = { [skillId]: 1 };
    const result = tryAdvanceSkill(state, skillId, 'combat');
    expect(result).not.toBeNull();
    expect(result!.startsWith(RANK_UP_MARKER)).toBe(true);
    expect(isRankUpStoryLine(result!)).toBe(true);
    expect(hasRankUpContent([result!])).toBe(true);
    expect(state.character.skillRanks[skillId]).toBe(1);
  });

  it('tryAdvanceSkill returns null (no marker) when progress has not reached the threshold', () => {
    initRng(4);
    const state = createNewLife(4);
    const skillId = state.character.skills[0] ?? '基礎吐納';
    state.character.skillRanks = { [skillId]: 0 };
    state.character.skillProgress = { [skillId]: 0 };
    state.character.skillAdvanceNeed = { [skillId]: 1000 };
    const result = tryAdvanceSkill(state, skillId, 'practice');
    expect(result).toBeNull();
  });
});

describe('growth feel: skillAdvanceHint', () => {
  it('reports mastery text at max rank', () => {
    const hint = skillAdvanceHint({ skillRanks: { foo: 3 } }, 'foo');
    expect(hint).toContain('神乎其技');
  });

  it('reports an early-days hint when no advance-need has been rolled yet', () => {
    const hint = skillAdvanceHint({ skillRanks: { foo: 0 } }, 'foo');
    expect(hint).toContain('尚早');
  });

  it('reports a percentage toward the next rank once advance-need is known', () => {
    const hint = skillAdvanceHint(
      { skillRanks: { foo: 0 }, skillProgress: { foo: 5 }, skillAdvanceNeed: { foo: 10 } },
      'foo',
    );
    expect(hint).toContain('50%');
    expect(hint).toContain('駕輕就熟');
  });
});
