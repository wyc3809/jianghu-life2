import { describe, expect, it } from 'vitest';
import { ART_DEFS, applyPracticeOutcome, performPracticeAction } from '../core/life/actions';
import { ART_MASTERY_THRESHOLD, artProficiency, meetsTaohuaCultureGate } from '../core/life/arts';
import { allTitles, syncTitles } from '../core/life/titles';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { getEventById, fullCatalog } from '../core/life/eventEngine';
import { meetsRequirements } from '../core/life/requirements';

describe('雅藝系統：琴棋書畫佛道邪學', () => {
  it('exposes all 7 arts', () => {
    const ids = ART_DEFS.map((a) => a.id);
    expect(ids).toEqual(['guqin', 'weiqi', 'poetry', 'painting', 'buddhism', 'daoism', 'darkArts']);
  });

  it('increments proficiency each time studied', () => {
    initRng(10);
    const state = createNewLife(10);
    expect(artProficiency(state, 'guqin')).toBe(0);
    applyPracticeOutcome(state, 'study_art', { artId: 'guqin' });
    expect(artProficiency(state, 'guqin')).toBe(1);
    applyPracticeOutcome(state, 'study_art', { artId: 'guqin' });
    expect(artProficiency(state, 'guqin')).toBe(2);
    // 其他雅藝獨立計數
    expect(artProficiency(state, 'weiqi')).toBe(0);
  });

  it('learns the mastery skill once proficiency reaches the threshold, and not twice', () => {
    initRng(11);
    const state = createNewLife(11);
    for (let i = 0; i < ART_MASTERY_THRESHOLD - 1; i++) {
      applyPracticeOutcome(state, 'study_art', { artId: 'darkArts' });
    }
    expect(state.character.skills).not.toContain('art_heretic_scripture');

    const logs = applyPracticeOutcome(state, 'study_art', { artId: 'darkArts' });
    expect(state.character.skills).toContain('art_heretic_scripture');
    expect(logs.some((l) => l.includes('天魔邪功'))).toBe(true);

    const countAfter = state.character.skills.length;
    applyPracticeOutcome(state, 'study_art', { artId: 'darkArts' });
    expect(state.character.skills.length).toBe(countAfter);
    expect(state.character.skills.filter((id) => id === 'art_heretic_scripture')).toHaveLength(1);
  });

  it('unlocks the matching mastery title once threshold is reached', () => {
    initRng(12);
    const state = createNewLife(12);
    for (let i = 0; i < ART_MASTERY_THRESHOLD; i++) {
      applyPracticeOutcome(state, 'study_art', { artId: 'poetry' });
    }
    syncTitles(state);
    expect(allTitles(state).some((t) => t.id === 'title_art_poetry')).toBe(true);
  });
});

describe('桃花島：琴棋詩書畫熟練度總和門檻', () => {
  it('blocks entry below the culture-arts threshold', () => {
    initRng(13);
    const state = createNewLife(13);
    state.character.martial = 40;
    state.character.nature = { xia: 0, xie: 30, kuang: 0, e: 20 };
    expect(meetsTaohuaCultureGate(state)).toBe(false);
    const logs = performPracticeAction(state, 'join_sect', { sectId: 'sect_taohua' });
    expect(state.character.sectId).toBeNull();
    expect(logs.some((l) => l.includes('琴棋書畫尚未通透'))).toBe(true);
  });

  it('allows entry once the four classic arts sum to the threshold', () => {
    initRng(14);
    const state = createNewLife(14);
    state.character.martial = 40;
    state.character.nature = { xia: 0, xie: 30, kuang: 0, e: 20 };
    for (const artId of ['guqin', 'weiqi', 'poetry', 'painting'] as const) {
      for (let i = 0; i < 15; i++) applyPracticeOutcome(state, 'study_art', { artId });
    }
    expect(meetsTaohuaCultureGate(state)).toBe(true);

    let joined = false;
    for (let i = 0; i < 30 && !joined; i++) {
      state.practiceActionsLeft = 3;
      state.character.sectId = null;
      performPracticeAction(state, 'join_sect', { sectId: 'sect_taohua' });
      joined = !!state.character.sectId;
    }
    expect(joined).toBe(true);
    expect(state.character.sectId).toBe('sect_taohua');
  });
});

describe('無根門：需奇遇方可入門，入門即斷塵緣', () => {
  it('blocks entry without the wugenInvited flag', () => {
    initRng(15);
    const state = createNewLife(15);
    state.character.martial = 40;
    state.character.nature = { xia: 0, xie: 10, kuang: 0, e: 30 };
    const logs = performPracticeAction(state, 'join_sect', { sectId: 'sect_wugen' });
    expect(state.character.sectId).toBeNull();
    expect(logs.some((l) => l.includes('尋不著無根門'))).toBe(true);
  });

  it('allows entry once invited, and marks the character as severed from romance/family', () => {
    initRng(16);
    const state = createNewLife(16);
    state.character.martial = 40;
    state.character.nature = { xia: 0, xie: 10, kuang: 0, e: 30 };
    state.character.flags.wugenInvited = true;
    state.character.gender = 'male';

    let joined = false;
    for (let i = 0; i < 30 && !joined; i++) {
      state.practiceActionsLeft = 3;
      state.character.sectId = null;
      performPracticeAction(state, 'join_sect', { sectId: 'sect_wugen' });
      joined = !!state.character.sectId;
    }
    expect(joined).toBe(true);
    expect(state.character.flags.wugenSevered).toBe(true);
    expect(state.character.flags.isEunuch).toBe(true);

    const seekLogs = performPracticeAction(state, 'seek_child', {});
    expect(seekLogs.some((l) => l.includes('斷絕塵根'))).toBe(true);

    const loveMeet = getEventById(fullCatalog(), 'love_meet')!;
    expect(meetsRequirements(state, loveMeet.requirements, loveMeet.id)).toBe(false);
  });

  it('does not mark female characters as eunuchs, but still severs romance/family', () => {
    initRng(17);
    const state = createNewLife(17);
    state.character.martial = 40;
    state.character.nature = { xia: 0, xie: 10, kuang: 0, e: 30 };
    state.character.flags.wugenInvited = true;
    state.character.gender = 'female';

    let joined = false;
    for (let i = 0; i < 30 && !joined; i++) {
      state.practiceActionsLeft = 3;
      state.character.sectId = null;
      performPracticeAction(state, 'join_sect', { sectId: 'sect_wugen' });
      joined = !!state.character.sectId;
    }
    expect(joined).toBe(true);
    expect(state.character.flags.wugenSevered).toBe(true);
    expect(state.character.flags.isEunuch).toBeUndefined();
  });
});
