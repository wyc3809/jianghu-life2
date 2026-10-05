import { GEAR_CATALOG } from '../data/equipment/catalog';
import { describe, expect, it } from 'vitest';
import { createNewLife, syncRngFromState } from '../core/life/gameState';
import { initRng } from '../core/random';
import {
  canHaveChild,
  designateHeir,
  getHeirName,
  previewInheritanceMoney,
  seekChild,
} from '../core/life/family';
import { applyLegacyToCharacter, extractLegacy } from '../core/life/legacy';
import { buildLifeSummary } from '../core/life/summary';
import { recordDeath } from '../core/life/death';

function withLover(seed: number) {
  initRng(seed);
  const state = createNewLife({ seed, skipCoach: true });
  syncRngFromState(state);
  state.character.age = 24;
  state.character.money = 80;
  state.character.loverId = 'lover_candidate';
  state.npcs.lover_candidate = {
    id: 'lover_candidate',
    name: '阿絮',
    gender: 'female',
    role: 'lover',
    affinity: 80,
    memories: [],
    alive: true,
  };
  state.character.monthsSinceLastBirth = 99;
  return state;
}

describe('childbirth and inheritance', () => {
  it('seek_child can birth with lover and sets heir + family_legacy', () => {
    let born = false;
    for (let s = 1; s <= 40; s += 1) {
      const state = withLover(s);
      expect(canHaveChild(state).ok).toBe(true);
      const lines = seekChild(state);
      if (state.character.childrenCount > 0) {
        born = true;
        expect(lines.join('')).toMatch(/求子|添丁|子|女/);
        expect(getHeirName(state)).toBeTruthy();
        expect(state.character.flags.family_legacy).toBe(true);
        break;
      }
    }
    expect(born).toBe(true);
  });

  it('designateHeir rotates successor', () => {
    const state = withLover(2);
    state.character.childrenCount = 2;
    state.character.family.childrenNames = ['甲童', '乙童'];
    state.character.flags.heir_name = '甲童';
    designateHeir(state, '乙童');
    expect(getHeirName(state)).toBe('乙童');
  });

  it('death with children carries estate into next life', () => {
    const prev = withLover(8);
    const surname = prev.character.name.trim()[0]!;
    const heir = `${surname}小江湖`;
    prev.character.childrenCount = 1;
    prev.character.family.childrenNames = [heir];
    prev.character.flags.heir_name = heir;
    prev.character.flags.family_legacy = true;
    prev.character.money = 100;
    prev.character.stats.wealthPeak = 200;
    recordDeath(prev, '病榻燈殘。');
    prev.phase = 'summary';
    prev.summaryText = buildLifeSummary(prev);
    expect(prev.summaryText).toMatch(/繼承人|小江湖/);
    expect(prev.summaryText).toMatch(/家族銀庫/);

    const legacy = extractLegacy(prev);
    expect(legacy.hadChildren).toBe(true);
    expect(legacy.heirName).toBe(heir);
    expect(legacy.familyLegacy).toBe(true);
    expect(legacy.inheritedMoney).toBe(previewInheritanceMoney(prev));
    // 家族銀庫全數傳後人（agreed-design §1）
    expect(legacy.inheritedMoney).toBe(100);

    const next = createNewLife({ seed: 99, skipCoach: true, legacy });
    expect(next.character.flags.born_with_family_legacy).toBe(true);
    expect(next.character.money).toBeGreaterThanOrEqual(100);
    expect(next.lifeLog.some((l) => /血脈|銀庫|小江湖/.test(l))).toBe(true);
    applyLegacyToCharacter(createNewLife({ seed: 100, skipCoach: true }), legacy);
  });

  it('test_death_without_children_passes_to_collateral_heir_with_full_vault', () => {
    const prev = createNewLife({ seed: 3, skipCoach: true });
    prev.character.childrenCount = 0;
    prev.character.family.childrenNames = [];
    prev.character.money = 1234;
    recordDeath(prev, '客死異鄉。');
    prev.phase = 'summary';

    const legacy = extractLegacy(prev);
    expect(legacy.hadChildren).toBe(false);
    expect(legacy.heirName).toBeUndefined();
    expect(legacy.collateral).toBe(true);
    expect(legacy.familyLegacy).toBe(true);
    expect(legacy.inheritedMoney).toBe(1234);

    const next = createNewLife({ seed: 4, skipCoach: true, legacy });
    expect(next.character.money).toBeGreaterThanOrEqual(1234);
    expect(next.lifeLog.some((l) => /銀庫.*1,234/.test(l))).toBe(true);
    expect(next.character.flags.legacy_collateral).toBe(true);
    expect(next.character.name[0]).toBe(prev.character.name[0]);
    expect(next.lifeLog.some((l) => /旁支/.test(l))).toBe(true);
  });

  it('test_family_gear_store_carries_all_gear_and_loadout', () => {
    const prev = createNewLife({ seed: 5, skipCoach: true });
    const ids = GEAR_CATALOG.map((g) => g.id).slice(0, 3);
    prev.character.gear = [ids[0]!, ids[1]!];
    prev.character.equipment = { weapon: ids[2]!, armor: null, accessory: null };
    recordDeath(prev, '壽終。');
    prev.phase = 'summary';
    const legacy = extractLegacy(prev);
    expect(new Set(legacy.inheritedGear)).toEqual(new Set(ids));
    const next = createNewLife({ seed: 6, skipCoach: true, legacy });
    for (const id of ids) expect(next.character.gear).toContain(id);
    expect(next.character.equipment.weapon).toBe(ids[2]);
  });
});

describe('succession card lines', () => {
  it('test_succession_lines_pick_inheritance_lines_only', async () => {
    const { successionLines } = await import('../src/store/slices/progressionSlice');
    const lines = successionLines([
      '【18年1月·千燈鎮】某甲辭別父母，踏上江湖。',
      '前世「高秋水」享年 61，此為第 2 世入江湖。',
      '前世「高秋水」無嗣，族中旁支由你「高承影」承祧，家族成果一樣傳落嚟。',
      '家族銀庫：前人積蓄 1,234 兩全數承接。',
      '家族裝備庫：承接 3 件裝備，照前人配搭穿戴。',
      '族譜上仍寫着故鄉「千燈鎮」。',
    ]);
    expect(lines).toHaveLength(4);
    expect(lines.some((l) => l.includes('族譜上'))).toBe(false);
  });
});
