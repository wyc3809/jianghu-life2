import { describe, expect, it } from 'vitest';
import { applyLearnMartialArt, tryAdvanceSkill } from '../core/life/flavor';
import { syncTitles } from '../core/life/titles';
import { MOMENT_QUEUE_CAP, newlyLearnedMoments, pushMoment, shiftMoment } from '../core/life/moments';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { initRng } from '../core/random';

function fresh(seed: number) {
  initRng(seed);
  const state = createNewLife(seed);
  state.moments = [];
  return state;
}

describe('moments queue (特效時刻)', () => {
  it('learning a new martial art queues a learn moment; relearning does not', () => {
    const state = fresh(21);
    const known = state.character.skills[0]!;
    applyLearnMartialArt(state, known);
    expect(state.moments).toEqual([]);

    applyLearnMartialArt(state, 'moment_test_art', '驚鴻劍');
    expect(state.moments).toHaveLength(1);
    expect(state.moments![0]).toMatchObject({ kind: 'learn', name: '驚鴻劍' });
  });

  it('a skill rank-up retains its result text and skips the reveal queue', () => {
    const state = fresh(22);
    const skillId = state.character.skills[0]!;
    state.character.skillRanks = { [skillId]: 0 };
    state.character.skillProgress = { [skillId]: 0 };
    state.character.skillAdvanceNeed = { [skillId]: 1 };
    const result = tryAdvanceSkill(state, skillId, 'combat');
    expect(state.character.skillRanks[skillId]).toBe(1);
    expect(result).toContain('駕輕就熟');
    expect(state.moments).toEqual([]);
  });

  it('clears old queued rank reveals while keeping learned arts', () => {
    const state = fresh(26);
    const learn = { kind: 'learn', name: '裂石殘掌' } as const;
    state.moments = [{ kind: 'rank', name: '裂石殘掌', rank: 1, rankName: '駕輕就熟' }, learn];
    expect(migrateLifeState(state).moments).toEqual([learn]);
  });

  it('lets the current reward play ahead of unrelated reveals without removing them', () => {
    const previous = fresh(27);
    const earlier = { kind: 'learn', name: '岸柳劍' } as const;
    previous.moments = [earlier];
    const next = { ...previous, moments: [earlier] as NonNullable<typeof previous.moments> };
    applyLearnMartialArt(next, 'moment_new_reward', '岸柳劍');
    const learn = newlyLearnedMoments(previous, next);
    expect(learn).toHaveLength(1);
    expect(learn[0]).toBe(next.moments[1]);
    expect(shiftMoment(next, next.moments.indexOf(learn[0]))).toBe(learn[0]);
    expect(next.moments).toEqual([earlier]);
  });

  it('gaining a title queues a title moment', () => {
    const state = fresh(23);
    state.character.stats.monthsLived = 1;
    syncTitles(state);
    const m = state.moments!.find((x) => x.kind === 'title');
    expect(m).toMatchObject({ kind: 'title', label: '初入門徑', tier: 1 });
    // 同一稱號唔會重複入隊
    syncTitles(state);
    expect(state.moments!.filter((x) => x.kind === 'title')).toHaveLength(1);
  });

  it('caps the queue and shifts in order', () => {
    const state = fresh(24);
    for (let i = 0; i < MOMENT_QUEUE_CAP + 3; i++) pushMoment(state, { kind: 'title', label: `號${i}`, tier: 1 });
    expect(state.moments).toHaveLength(MOMENT_QUEUE_CAP);
    // 保留最新嘅
    expect(state.moments!.at(-1)).toMatchObject({
      label: `號${MOMENT_QUEUE_CAP + 2}`,
    });
    const first = state.moments![0];
    expect(shiftMoment(state)).toEqual(first);
    expect(state.moments).toHaveLength(MOMENT_QUEUE_CAP - 1);
  });

  it('shiftMoment on a legacy save without a queue returns null', () => {
    const state = fresh(25);
    delete state.moments;
    expect(shiftMoment(state)).toBeNull();
  });
});
