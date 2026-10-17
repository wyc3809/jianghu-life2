import { describe, expect, it } from 'vitest';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { equippedMartialArts, martialSlots, setMartialSlot } from '../core/life/martialLoadout';
import { buildPlayerFighter, getPlayerMoves, getPlayerInternalModeOptions, setCombatInternalMode, playerCombatTurn, startCombat } from '../core/life/combat';
import { autoBattleRotation } from '../core/life/volumes';
import { snapshotContestantFromLife } from '../core/life/huashan';
import { sparArtOrder } from '../src/spar/artCycle';
import { sparHeroBreakdown } from '../core/life/sparDuel';
import { lifeGameStateSchema, type LifeGameState } from '../interfaces/lifeEngine';
import { artVolumeMoves } from '../data/skills/volumes';
import { getSkillDef, SKILL_DEFS, SYSTEM_MOVES, BASIC_STRIKE } from '../data/skills/catalog';
import { primarySchoolOfSkill } from '../data/redesign/schools';
import { useLifeStore } from '../src/store/lifeStore';
import { useAncestryStore } from '../src/store/ancestryStore';
import { emptyAncestry } from '../core/life/ancestry';

const arts = ['art_river_fist', 'art_stone_palm', 'art_rain_sword', 'art_iron_body', 'qg_broken_bridge'];
function life() {
  const s = createNewLife({ seed: 42, skipCoach: true });
  s.phase = 'playing'; s.pending = null;
  s.character.skills = [...arts, 'art_thunder_blade'];
  s.character.equippedArts = [null, null, null, null, null];
  return s;
}

describe('五格自由武學', () => {
  it('test_loadout_cross_school_and_same_type_can_fill_five_but_not_six', () => {
    const s = life();
    arts.forEach((id, slot) => expect(setMartialSlot(s, slot, id)).toBe(true));
    expect(new Set(arts.map(id => primarySchoolOfSkill(getSkillDef(id)))).size).toBeGreaterThan(1);
    expect(arts.filter(id => getSkillDef(id)?.kind === 'external').length).toBeGreaterThan(1);
    expect(equippedMartialArts(s.character)).toEqual(arts);
    expect(setMartialSlot(s, 5, 'art_thunder_blade')).toBe(false);
    expect(equippedMartialArts(s.character)).toEqual(arts);
  });
  it('test_loadout_all_five_same_type_is_allowed_without_school_gate', () => {
    const s = life();
    const internals = Object.values(SKILL_DEFS).filter(d => d.kind === 'internal').slice(0, 5).map(d => d.id);
    s.character.skills = internals;
    internals.forEach((id, slot) => expect(setMartialSlot(s, slot, id)).toBe(true));
    expect(equippedMartialArts(s.character)).toEqual(internals);
    expect(autoBattleRotation(s.character)).toEqual([]);
  });
  it('test_loadout_duplicate_unknown_and_invalid_slot_leave_state_unchanged', () => {
    const s = life(); setMartialSlot(s, 0, arts[0]!);
    const before = JSON.stringify(s);
    for (const [slot, id] of [[1, arts[0]], [-1, arts[1]], [1.5, arts[1]], [4, 'unknown']] as const) {
      expect(setMartialSlot(s, slot, id!)).toBe(false);
      expect(JSON.stringify(s)).toBe(before);
    }
  });
  it('test_loadout_replace_and_unload_preserve_collection_ranks_and_volumes', () => {
    const s = life(); s.character.skillRanks[arts[0]!] = 3; s.character.volumes = { [arts[0]!]: [1, 3, 7] };
    setMartialSlot(s, 0, arts[0]!); setMartialSlot(s, 0, arts[1]!); setMartialSlot(s, 0, null);
    expect(equippedMartialArts(s.character)).toEqual([]);
    expect(s.character.skills).toContain(arts[0]);
    expect(s.character.skillRanks[arts[0]!]).toBe(3);
    expect(s.character.volumes[arts[0]!]).toEqual([1, 3, 7]);
  });
  it('test_loadout_old_save_preserves_explicit_mains_then_fills_only_five_and_roundtrips', () => {
    const s = life(); delete s.character.equippedArts;
    s.character.mainArts = { external: 'art_rain_sword', internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
    const originalSkills = [...s.character.skills];
    const migrated = migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(s))) as LifeGameState);
    expect(equippedMartialArts(migrated.character)).toEqual(['art_rain_sword', 'art_iron_body', 'qg_broken_bridge', 'art_river_fist', 'art_stone_palm']);
    expect(migrated.character.skills).toEqual(originalSkills);
    setMartialSlot(migrated, 2, null);
    const restored = migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(migrated))) as LifeGameState);
    expect(martialSlots(restored.character)).toEqual(martialSlots(migrated.character));
    expect(martialSlots(restored.character)[2]).toBe(null);
  });
  it('test_loadout_old_default_mains_survive_when_inner_art_was_learned_late', () => {
    const s = life(); delete s.character.equippedArts;
    s.character.skills = ['art_river_fist', 'art_stone_palm', 'art_rain_sword', 'art_thunder_blade', 'art_moon_sword', 'art_iron_body', 'qg_broken_bridge'];
    const migrated = migrateLifeState(s);
    expect(equippedMartialArts(migrated.character).slice(0, 3)).toEqual(['art_river_fist', 'art_iron_body', 'qg_broken_bridge']);
    expect(equippedMartialArts(migrated.character)).toHaveLength(5);
  });
  it('test_loadout_normalizes_duplicate_legacy_aliases_and_never_refills_empty_slots', () => {
    const s = life(); s.character.skills.push('skill_sword_basic', 'art_moon_sword');
    s.character.equippedArts = ['art_river_fist', 'art_river_fist', 'unknown', null, null];
    expect(martialSlots(s.character)).toEqual(['art_river_fist', null, null, null, null]);
    s.character.equippedArts = ['skill_sword_basic', 'art_moon_sword'];
    expect(equippedMartialArts(s.character)).toEqual(['skill_sword_basic']);
    s.character.equippedArts = [];
    expect(equippedMartialArts(s.character)).toEqual([]);
  });
  it('test_loadout_only_equipped_passives_moves_and_rotation_enter_combat', () => {
    const s = life();
    const before = buildPlayerFighter(s);
    expect(getPlayerMoves(s)).toEqual([BASIC_STRIKE, ...SYSTEM_MOVES]);
    expect(getPlayerInternalModeOptions(s)[0]?.id).toBe('basic');
    setMartialSlot(s, 0, 'art_iron_body');
    expect(buildPlayerFighter(s).defense).toBeGreaterThan(before.defense);
    expect(getPlayerInternalModeOptions(s)[0]?.name).toBe('鐵布衫');
    setMartialSlot(s, 1, 'art_stone_palm'); setMartialSlot(s, 2, 'art_river_fist');
    expect(getPlayerMoves(s).filter(m => m.id !== BASIC_STRIKE.id && !SYSTEM_MOVES.some(sys => sys.id === m.id)).map(m => m.id)).toEqual(['art_stone_palm', 'art_river_fist'].map(id => getSkillDef(id)!.move!.id));
    expect(autoBattleRotation(s.character)).toEqual(['art_stone_palm', 'art_river_fist']);
    expect(sparArtOrder(s.character)).toEqual(['art_stone_palm', 'art_river_fist']);
    expect(snapshotContestantFromLife(s).skills).toEqual(['art_iron_body', 'art_stone_palm', 'art_river_fist']);
    setMartialSlot(s, 0, null);
    expect(buildPlayerFighter(s).defense).toBe(before.defense);
  });
  it('test_loadout_unequipped_seven_volume_move_cannot_bypass_selection', () => {
    const s = life(); s.character.volumes = { art_river_fist: [1, 2] };
    startCombat(s, { source: 'event', title: '試招', foeName: '木人', foePower: 'normal' });
    expect(setCombatInternalMode(s, 'guixi')).toEqual(['請先裝備對應的內功武學。']);
    expect(s.pendingCombat!.player.internalMode).toBeFalsy();
    for (const move of artVolumeMoves('art_river_fist').slice(0, 2)) {
      const logs = playerCombatTurn(s, move.id);
      expect(logs.join('')).not.toContain(`一式「${move.name}」`);
      expect(s.pendingCombat!.usedExternalSkillIds).not.toContain('art_river_fist');
    }
  });
  it('test_loadout_spar_recovery_only_comes_from_equipped_arts', () => {
    const s = life();
    const heal = Object.values(SKILL_DEFS).find(d => (d.move?.lifesteal ?? 0) > 0)!;
    s.character.skills.push(heal.id);
    expect(sparHeroBreakdown(s).lifesteal.fromSkills).toBe(0);
    setMartialSlot(s, 0, heal.id);
    expect(sparHeroBreakdown(s).lifesteal.fromSkills).toBe(heal.move!.lifesteal);
  });
  it('test_loadout_store_learns_only_after_valid_explicit_slot_and_blocks_replay', () => {
    const s = life(); s.character.skills = ['art_river_fist'];
    const meta = emptyAncestry(); meta.manuals = { art_stone_palm: { stars: 2, copies: 3, vols: [2, 5] } };
    useAncestryStore.setState({ meta }); useLifeStore.setState({ state: s, combatReplay: null });
    expect(useLifeStore.getState().setMartialSlot(5, 'art_stone_palm')).toBe(false);
    expect(useLifeStore.getState().state!.character.skills).not.toContain('art_stone_palm');
    expect(useLifeStore.getState().setMartialSlot(3, 'art_stone_palm')).toBe(true);
    const c = useLifeStore.getState().state!.character;
    expect(martialSlots(c)[3]).toBe('art_stone_palm');
    expect(c.volumes!.art_stone_palm).toEqual([2, 5]);
    expect(c.manualStars!.art_stone_palm).toBe(2);
    expect(useAncestryStore.getState().meta).toEqual(meta);
    useLifeStore.setState({ combatReplay: {} as never });
    expect(useLifeStore.getState().setMartialSlot(3, null)).toBe(false);
    useLifeStore.setState({ combatReplay: null });
  });
});
