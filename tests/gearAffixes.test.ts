import { describe, expect, it } from 'vitest';
import { getGearDef } from '../data/equipment/catalog';
import {
  displayGearName,
  formatAffixDisplay,
  gearMagicPrefix,
  listGearAffixes,
  RARITY_SHORT,
} from '../data/equipment/affixes';

describe('Diablo-style gear affixes', () => {
  it('splits base stats and named magic affixes', () => {
    const sword = getGearDef('old-sword')!;
    const lines = listGearAffixes(sword);
    expect(lines.some((l) => l.tier === 'base' && l.text.includes('威＋'))).toBe(true);
    expect(lines.some((l) => l.tier === 'magic' && l.name === '準心')).toBe(true);
    expect(RARITY_SHORT[sword.rarity]).toBe('凡');
  });

  it('adds a legendary line carrying the real special-effect name for epic/mythic/divine gear', () => {
    const epic = getGearDef('inkrain-sword')!;
    const lines = listGearAffixes(epic);
    expect(lines.filter((l) => l.tier === 'magic').length).toBeGreaterThanOrEqual(2);
    expect(epic.special?.name).toBe('劍雨驟至');
    expect(lines.some((l) => l.tier === 'legendary' && l.name === '劍雨驟至')).toBe(true);
    expect(formatAffixDisplay(lines.find((l) => l.tier === 'legendary')!)).toContain('劍雨驟至');
  });

  it('prefixes fine/rare names; keeps unique epic names bare', () => {
    const fine = getGearDef('iron-blade')!;
    expect(gearMagicPrefix(fine)).toBe('破甲');
    expect(displayGearName(fine)).toBe('破甲·精鋼刀');

    const common = getGearDef('old-sword')!;
    expect(displayGearName(common)).toBe('舊鐵劍');

    const epic = getGearDef('inkrain-sword')!;
    expect(displayGearName(epic)).toBe('墨雨劍');
  });
});
