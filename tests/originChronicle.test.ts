import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { displayGearName } from '../core/life/equipment';
import { applyLegacyToCharacter } from '../core/life/legacy';
import { buildLegacyScriptEvent } from '../core/life/lifeVariance';
import { ORIGIN_EVENTS, resolveOriginPicks } from '../core/life/originChronicle';

describe('origin chronicle + no english gear names', () => {
  it('resolveOriginPicks shapes theme and bonuses from three pages', () => {
    const result = resolveOriginPicks([
      { eventId: 'origin_alley', choiceId: 'chase' },
      { eventId: 'origin_guest', choiceId: 'learn' },
      { eventId: 'origin_vow', choiceId: 'vow_master' },
    ]);
    expect(result.lifeTheme).toBe('master');
    expect((result.attributes.wuXing ?? 0) + (result.attributes.genGu ?? 0)).toBeGreaterThan(0);
    expect(result.chronicle).toHaveLength(ORIGIN_EVENTS.length);
  });

  it('applies origin bonuses into starting attributes and nature', () => {
    const base = createNewLife({ seed: 101, skipCoach: true });
    const withOrigin = createNewLife({
      seed: 101,
      skipCoach: true,
      lifeTheme: 'revenge',
      originBonuses: {
        attributes: { danShi: 5 },
        nature: { kuang: 4 },
        chronicle: ['【少時·試】膽識開。'],
      },
    });
    expect(withOrigin.character.attributes.danShi).toBe(base.character.attributes.danShi + 5);
    expect(withOrigin.character.nature.kuang).toBe(base.character.nature.kuang + 4);
    expect(withOrigin.lifeLog.some((l) => l.includes('少時'))).toBe(true);
    expect(withOrigin.character.flags.life_theme).toBe('revenge');
  });

  it('displayGearName never returns english catalog ids', () => {
    expect(displayGearName('old-sword')).toBe('舊鐵劍');
    expect(displayGearName('plain-robe')).toBe('青布衣');
    expect(displayGearName('舊鐵劍')).toBe('舊鐵劍');
  });

  it('legacy gear dream event body uses Chinese name', () => {
    const next = createNewLife({ seed: 56, skipCoach: true });
    next.character.flags.born_with_gear_dream = 'old-sword';
    next.character.flags.legacy_script_gear = true;
    next.character.flags.legacy_script_rival = false;
    next.character.flags.legacy_script_friend = false;
    next.character.flags.legacy_script_theme = false;
    delete next.character.flags.born_with_rival_hint;
    delete next.character.flags.born_with_friend_hint;
    delete next.character.flags.legacy_theme_echo;
    const ev = buildLegacyScriptEvent(next);
    expect(ev?.id).toBe('legacy_script_gear');
    expect(ev?.body ?? '').toContain('舊鐵劍');
    expect(ev?.body ?? '').not.toMatch(/old-sword/);
  });

  it('applyLegacy stores Chinese gear dream', () => {
    const state = createNewLife({ seed: 70, skipCoach: true });
    applyLegacyToCharacter(state, {
      generation: 1,
      ancestorName: '王長風',
      ancestorAge: 40,
      ancestorMartial: 20,
      ancestorReputation: 10,
      ancestorWealthPeak: 100,
      familyLegacy: false,
      teacherLegacy: false,
      gearHint: 'old-sword',
    });
    expect(String(state.character.flags.born_with_gear_dream)).toBe('舊鐵劍');
  });
});
