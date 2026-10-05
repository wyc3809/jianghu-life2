import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { mainArts, schoolBonusTotal, schoolTally, setMainArt } from '../core/life/schools';
import { buildPlayerFighter } from '../core/life/combat';
import { SKILL_DEFS } from '../data/skills/catalog';
import { schoolsOfSkill } from '../data/redesign/schools';

const pick = (kind: string, school: string, not: string[] = []) =>
  Object.values(SKILL_DEFS).find(
    (d) => d.kind === kind && schoolsOfSkill(d).includes(school as never) && !not.includes(d.id),
  )!.id;

describe('main arts + schools (agreed-design §3)', () => {
  it('test_main_art_defaults_to_first_learned_and_can_be_changed', () => {
    initRng(1);
    const s = createNewLife({ seed: 1, skipCoach: true });
    const ext = s.character.skills.find((id) => SKILL_DEFS[id]?.kind === 'external');
    expect(mainArts(s.character).external).toBe(ext);
    const other = pick('external', 'pojia', s.character.skills);
    expect(setMainArt(s, 'external', other)).toBe(false); // 未學唔揀得
    s.character.skills.push(other);
    expect(setMainArt(s, 'external', other)).toBe(true);
    expect(mainArts(s.character).external).toBe(other);
    expect(setMainArt(s, 'internal', other)).toBe(false); // 類別唔啱
  });

  it('test_two_same_school_is_minor_three_is_major_gear_counts_as_one', () => {
    initRng(2);
    const s = createNewLife({ seed: 2, skipCoach: true });
    const c = s.character;
    const ext = pick('external', 'pojia');
    const int = pick('internal', 'pojia');
    c.skills.push(ext, int);
    setMainArt(s, 'external', ext);
    setMainArt(s, 'internal', int);
    c.equipment = { weapon: 'old-sword', armor: null, accessory: null };
    const minor = schoolTally(c).find((t) => t.school.id === 'pojia')!;
    expect(minor.level).toBe('minor');
    c.gear.push('iron-blade');
    c.equipment.weapon = 'iron-blade'; // 精鋼刀：破甲
    const major = schoolTally(c).find((t) => t.school.id === 'pojia')!;
    expect(major.level).toBe('major');
    expect(major.gear).toBe('iron-blade');
  });

  it('test_school_bonus_reaches_combat_fighter', () => {
    initRng(3);
    const s = createNewLife({ seed: 3, skipCoach: true });
    const c = s.character;
    c.equipment = { weapon: null, armor: null, accessory: null };
    const before = buildPlayerFighter(s).gearPierce ?? 0;
    const ext = pick('external', 'pojia');
    const int = pick('internal', 'pojia');
    c.skills.push(ext, int);
    setMainArt(s, 'external', ext);
    setMainArt(s, 'internal', int);
    expect(schoolBonusTotal(c).pierce).toBeGreaterThan(0);
    expect(buildPlayerFighter(s).gearPierce ?? 0).toBeGreaterThan(before);
  });
});
