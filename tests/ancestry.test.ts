import { describe, expect, it } from 'vitest';
import {
  applyAncestry,
  buySecondSlot,
  buyTalent,
  computeMeritGain,
  emptyAncestry,
  parseAncestry,
  recordLife,
  talentCost,
  toggleFamilyArt,
  unlockArt,
} from '../core/life/ancestry';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { ART_UNLOCK_COST, MERIT_CAP_PER_LIFE, SECOND_SLOT_COST, TALENT_STEP } from '../data/ancestry/tuning';

function endedLife(seed = 5) {
  initRng(seed);
  const s = createNewLife(seed);
  s.phase = 'summary';
  return s;
}

describe('ancestral merit (design/gdd/ancestral-merit.md)', () => {
  it('test_ancestry_gain_follows_formula', () => {
    const s = endedLife();
    const c = s.character;
    c.age = 60;
    c.martial = 80;
    c.reputation = 50;
    c.cultivation = { xp: 0, tier: 7 };
    c.childrenCount = 1;
    const g = computeMeritGain(s);
    const titles = g.parts.find((p) => p.label === '稱號')?.value ?? 0;
    expect(g.total).toBe(6 + 4 + 2 + 6 + titles + 2);
  });

  it('test_ancestry_gain_is_capped', () => {
    const s = endedLife();
    Object.assign(s.character, { age: 300, martial: 5000, reputation: 5000 });
    expect(computeMeritGain(s).total).toBe(MERIT_CAP_PER_LIFE);
  });

  it('test_ancestry_record_life_only_once_and_logs_arts', () => {
    const s = endedLife();
    s.character.age = 40;
    const meta = emptyAncestry();
    const first = recordLife(meta, s);
    const second = recordLife(meta, s);
    expect(first.total).toBeGreaterThan(0);
    expect(second.total).toBe(0);
    expect(meta.points).toBe(first.total);
    expect(meta.artsSeen).toEqual(expect.arrayContaining(s.character.skills));
  });

  it('test_ancestry_talent_costs_and_refuses_when_poor', () => {
    const meta = emptyAncestry();
    expect([0, 1, 2, 3, 4].map(talentCost)).toEqual([3, 5, 7, 9, 11]);
    meta.points = 7;
    expect(buyTalent(meta, 'genGu')).toBe(true);
    expect(buyTalent(meta, 'genGu')).toBe(false); // 需要 5，得 4
    expect(meta.points).toBe(4);
    expect(meta.talents.genGu).toBe(1);
    meta.points = 999;
    for (let i = 0; i < 10; i++) buyTalent(meta, 'genGu');
    expect(meta.talents.genGu).toBe(5);
  });

  it('test_ancestry_unlock_and_slots', () => {
    const meta = emptyAncestry();
    meta.artsSeen = ['a1', 'a2'];
    meta.points = ART_UNLOCK_COST * 2 + SECOND_SLOT_COST;
    expect(unlockArt(meta, 'not_seen')).toBe(false);
    expect(unlockArt(meta, 'a1')).toBe(true);
    expect(unlockArt(meta, 'a2')).toBe(true);
    expect(toggleFamilyArt(meta, 'a1')).toBe(true);
    expect(toggleFamilyArt(meta, 'a2')).toBe(false); // 得一格
    expect(buySecondSlot(meta)).toBe(true);
    expect(toggleFamilyArt(meta, 'a2')).toBe(true);
    expect(meta.familyArts).toEqual(['a1', 'a2']);
    expect(meta.points).toBe(0);
  });

  it('test_ancestry_apply_is_deterministic_and_adds_arts_without_moment', () => {
    const s0 = endedLife(9);
    const art = s0.character.skills[0]!;
    const meta = emptyAncestry();
    meta.talents.wuXing = 2;
    meta.artsSeen = [art];
    meta.unlockedArts = [art];
    meta.familyArts = [art];
    const make = () => createNewLife({ seed: 77, ancestry: meta });
    const a = make();
    const b = make();
    expect(a.character.attributes).toEqual(b.character.attributes);
    const plain = createNewLife({ seed: 77 });
    expect(a.character.attributes.wuXing).toBe(Math.min(100, plain.character.attributes.wuXing + 2 * TALENT_STEP));
    expect(a.character.skills).toContain(art);
    expect((a.moments ?? []).some((m) => m.kind === 'learn')).toBe(false);
    expect(a.lifeLog.some((l) => l.includes('祖蔭'))).toBe(true);
  });

  it('test_ancestry_parse_bad_data_is_empty', () => {
    expect(parseAncestry('{"points":"lots"}')).toEqual(emptyAncestry());
    expect(parseAncestry('not json')).toEqual(emptyAncestry());
    expect(parseAncestry(null)).toEqual(emptyAncestry());
  });

  it('test_ancestry_apply_skips_unknown_art', () => {
    const meta = emptyAncestry();
    meta.unlockedArts = ['ghost_art'];
    meta.familyArts = ['ghost_art'];
    initRng(3);
    const s = createNewLife(3);
    const before = [...s.character.skills];
    applyAncestry(s, meta);
    expect(s.character.skills).toEqual(before);
  });
});
