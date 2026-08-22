import { describe, expect, it } from 'vitest';
import { narrateCombat, narratePractice, narrateSocial } from '../core/life/sceneCopy';

describe('scene copy flavor-line selection', () => {
  it('test_sceneCopy_narrateSocial_deterministic_across_repeated_calls', () => {
    // Regression: narrateSocial/narrateCombat/narratePractice are only ever
    // called at module-load time (choiceEnrich.ts building the static
    // JINYONG_SPECIAL_EVENTS/ENRICHED_CATALOG-style arrays), before any
    // initRng(seed) call has run. They used to pick a flavor line via the
    // shared getRng(), which falls back to a Date.now()-seeded RNG when
    // uninitialized — non-deterministic across process runs, violating the
    // project's seeded-RNG-only rule and making replay/tests unreliable.
    // The picker must now be a pure function of (kind, act).
    const first = narrateSocial('mixed', '交還密件');
    for (let i = 0; i < 20; i += 1) {
      expect(narrateSocial('mixed', '交還密件')).toBe(first);
    }
  });

  it('test_sceneCopy_pickers_vary_by_kind_and_act', () => {
    // Different acts (or kinds) should not all collapse onto the same line —
    // a hash-collision bug would show up as everything picking pool index 0.
    const a = narrateSocial('mixed', '交還密件');
    const b = narrateSocial('mixed', '拆讀再決');
    const c = narrateSocial('ill', '交還密件');
    expect(new Set([a, b, c]).size).toBeGreaterThan(1);
  });

  it('test_sceneCopy_narrateCombat_and_narratePractice_are_also_deterministic', () => {
    const combat = narrateCombat('ill', '拔劍應戰');
    const practice = narratePractice('fair', '苦練不止');
    for (let i = 0; i < 10; i += 1) {
      expect(narrateCombat('ill', '拔劍應戰')).toBe(combat);
      expect(narratePractice('fair', '苦練不止')).toBe(practice);
    }
  });
});
