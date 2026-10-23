import { describe, expect, it } from 'vitest';
import { SeededRng } from '../core/random';
import { createNewLife, advanceYear, migrateLifeState, syncRngFromState, snapshotRng } from '../core/life/gameState';
import { startMonth, fullCatalog, listEligibleEvents, getEventById } from '../core/life/eventEngine';
import { simulateMonthBody } from '../core/life/monthly';
import { meetsRequirements } from '../core/life/requirements';
import { canEnterHuashan, HUASHAN_MIN_MARTIAL } from '../core/life/huashan';
import { canFoundSect, FOUND_SECT_MIN_MARTIAL, FOUND_SECT_MIN_REPUTATION, FOUND_SECT_COST } from '../core/life/foundedSect';
import { canHaveChild } from '../core/life/family';
import { computeMeritGain } from '../core/life/ancestry';
import { lifeScore, liveBoardEntry } from '../core/life/leaderboardScore';
import { listAchievementStatus, achievementProgress, syncAchievements, readAchievementIds } from '../core/life/achievements';
import { allTitles, syncTitles, titleBonusTotals } from '../core/life/titles';
import { rollForgeResult } from '../data/equipment/catalog';
import { lifeGameStateSchema } from '../interfaces/lifeEngine';
import { pushChronicle } from '../core/life/chronicle';
import { buildLifeSummary } from '../core/life/summary';
import { snapshotLifeForGenealogy } from '../core/life/genealogy';
import { filterPackByConditions } from '../core/life/jianghuEventRepository';

function fresh(age = 16) {
  const state = createNewLife({ seed: 42, name: '沈雲舟', skipCoach: true });
  state.pending = null;
  state.character.flags.newbie_done = true;
  state.character.age = age;
  return state;
}

describe('取消角色年齡', () => {
  it('test_age_跨年與過年_曆法統計推進但舊歲數不增長', () => {
    const state = fresh(101);
    state.month = 12;
    const year = state.year;
    startMonth(state);
    expect([state.year, state.month, state.character.age]).toEqual([year + 1, 1, 101]);
    advanceYear(state);
    expect([state.year, state.character.age]).toEqual([year + 2, 101]);
  });

  it('test_age_高齡舊存檔過月_不衰弱或自然老死', () => {
    const young = fresh(16), old = fresh(200);
    for (let i = 0; i < 240; i++) {
      syncRngFromState(young); simulateMonthBody(young); snapshotRng(young);
      syncRngFromState(old); simulateMonthBody(old); snapshotRng(old);
      expect(old.character.health).toBe(young.character.health);
      expect(old.character.actionPoints).toBe(young.character.actionPoints);
      expect(old.character.money).toBe(young.character.money);
      expect(old.character.alive).toBe(true);
    }
    expect(computeMeritGain(old)).toEqual(computeMeritGain(young));
  });

  it('test_age_事件與百則事件包_不再有年齡門檻或權重差異', () => {
    const young = fresh(1), old = fresh(200);
    expect(meetsRequirements(young, { minAge: 80, maxAge: 0 })).toBe(true);
    expect(meetsRequirements(young, { minAge: 80, minMartial: 9999 })).toBe(false);
    const eligible = (s: ReturnType<typeof fresh>) => listEligibleEvents(fullCatalog(), s).map(e => e.id);
    expect(eligible(old)).toEqual(eligible(young));
    expect(filterPackByConditions(old).map(e => e.id)).toEqual(filterPackByConditions(young).map(e => e.id));
    for (const id of ['life_birth', 'childhood_play', 'fatal_illness']) expect(eligible(old)).not.toContain(id);
    for (const id of ['life_birth', 'childhood_play', 'fatal_illness']) expect(getEventById(fullCatalog(), id)).toBeDefined();
    startMonth(young); startMonth(old);
    expect(old.pending).toEqual(young.pending);
    expect(old.rngState).toBe(young.rngState);
  });

  it('test_age_論劍開宗與家庭_只按其餘真實條件判定', () => {
    for (const age of [1, 16, 200]) {
      const state = fresh(age);
      state.character.martial = Math.max(HUASHAN_MIN_MARTIAL, FOUND_SECT_MIN_MARTIAL);
      state.character.reputation = FOUND_SECT_MIN_REPUTATION;
      state.character.money = FOUND_SECT_COST;
      expect(canEnterHuashan(state).ok).toBe(true);
      expect(canFoundSect(state).ok).toBe(true);
      expect(canHaveChild(state).ok).toBe(false);
      state.character.loverId = 'qa-lover';
      state.character.childrenCount = 0;
      state.character.childrenMax = 2;
      state.character.monthsSinceLastBirth = 99;
      expect(canHaveChild(state).ok).toBe(true);
      state.character.monthsSinceLastBirth = 0;
      expect(canHaveChild(state).ok).toBe(false);
      state.character.martial = 0;
      expect(canEnterHuashan(state).ok).toBe(false);
      expect(canFoundSect(state).ok).toBe(false);
    }
  });

  it('test_age_鍛造_同武學同種子的結果不受舊年齡影響', () => {
    const results = (age: number) => {
      const rng = new SeededRng(42);
      return Array.from({ length: 200 }, () => rollForgeResult(rng, { age, martial: 40 }));
    };
    expect(results(1)).toEqual(results(200));
  });

  it('test_age_祖蔭及榜單_歲數不再加分且協定欄位中立', () => {
    const young = fresh(16), old = fresh(200);
    expect(computeMeritGain(young)).toEqual(computeMeritGain(old));
    expect(lifeScore(young)).toBe(lifeScore(old));
    expect(liveBoardEntry(old).age).toBe(0);
    expect(computeMeritGain(old).parts.some(p => p.label === '壽數')).toBe(false);
  });

  it('test_age_舊成就與稱號_停止新增而已取得紀錄及加成保留', () => {
    const state = fresh(200);
    syncAchievements(state); syncTitles(state);
    for (const id of ['ach_elder', 'ach_age_80']) expect(readAchievementIds(state)).not.toContain(id);
    expect(listAchievementStatus(state).some(a => ['ach_elder', 'ach_age_80'].includes(a.id))).toBe(false);
    expect(achievementProgress(state).total).toBe(38);
    state.character.flags.achievements = 'ach_elder,ach_age_80';
    state.character.flags.titles = 'title_elder';
    syncAchievements(state); syncTitles(state);
    expect(readAchievementIds(state)).toEqual(expect.arrayContaining(['ach_elder', 'ach_age_80']));
    expect(achievementProgress(state).total).toBe(40);
    expect(allTitles(state).some(t => t.id === 'title_elder')).toBe(true);
    expect(titleBonusTotals(state).defense).toBeGreaterThanOrEqual(3);
  });

  it('test_age_舊存檔來回_收藏以外人物資料與已領祖蔭旗標保留', () => {
    const original = fresh(92);
    original.character.flags.ancestry_awarded = true;
    const roundtrip = migrateLifeState(lifeGameStateSchema.parse(JSON.parse(JSON.stringify(original))));
    expect(roundtrip.character.age).toBe(92);
    expect(roundtrip.character.skills).toEqual(original.character.skills);
    expect(roundtrip.character.equipment).toEqual(original.character.equipment);
    expect(roundtrip.character.flags.ancestry_awarded).toBe(true);
    startMonth(roundtrip);
    expect(roundtrip.character.age).toBe(92);
  });

  it('test_age_新年譜族譜及總結_不再顯示歲數或壽命階段', () => {
    const state = fresh(92);
    state.lifeLog = [];
    pushChronicle(state, ['採藥歸來。']);
    expect(state.lifeLog[0]).toMatch(/【\d+年\d+月】採藥歸來。/);
    expect([state.lifeLog[0], snapshotLifeForGenealogy(state), buildLifeSummary(state)].join('\n')).not.toMatch(/歲|享年|遲暮|老年/);
  });
});
