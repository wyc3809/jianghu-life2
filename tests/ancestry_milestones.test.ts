import { describe, expect, it } from 'vitest';
import { claimFamilyMilestones, emptyAncestry, parseAncestry } from '../core/life/ancestry';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { FAMILY_MILESTONES } from '../data/ancestry/milestones';

describe('family milestones → 祖蔭 (agreed-design §4)', () => {
  it('test_milestone_grants_merit_once_only', () => {
    initRng(1);
    const meta = emptyAncestry();
    const state = createNewLife({ seed: 1, skipCoach: true });
    state.character.childrenCount = 1;
    const first = claimFamilyMilestones(meta, state);
    const merit = FAMILY_MILESTONES.find((m) => m.id === 'fm_first_child')!.merit;
    expect(first.map((m) => m.id)).toContain('fm_first_child');
    expect(meta.points).toBe(merit);
    // 同一個里程碑再達成（例如下一世又有子女）唔會再領
    const again = claimFamilyMilestones(meta, state);
    expect(again).toHaveLength(0);
    expect(meta.points).toBe(merit);
  });

  it('test_nothing_claimed_for_fresh_life', () => {
    initRng(2);
    const meta = emptyAncestry();
    const state = createNewLife({ seed: 2, skipCoach: true });
    state.character.money = 0;
    expect(claimFamilyMilestones(meta, state)).toHaveLength(0);
    expect(meta.points).toBe(0);
  });

  it('test_old_meta_without_milestones_parses', () => {
    const old = { ...emptyAncestry() } as Record<string, unknown>;
    delete old.milestones;
    const meta = parseAncestry(JSON.stringify(old));
    expect(meta.milestones).toEqual([]);
  });

  it('test_boss_win_and_generation_milestones', () => {
    initRng(3);
    const meta = emptyAncestry();
    const state = createNewLife({ seed: 3, skipCoach: true });
    state.character.flags.boss_wins = 1;
    state.character.flags.legacy_generation = 3;
    const ids = claimFamilyMilestones(meta, state).map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(['fm_boss', 'fm_gen3']));
    expect(ids).not.toContain('fm_gen5');
  });
});
