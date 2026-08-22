import { describe, expect, it } from 'vitest';
import {
  canFoundSect,
  canRecruitDisciple,
  foundSect,
  foundedSectScore,
  recruitDisciple,
  teachDisciple,
  tickFoundedSect,
  FOUND_SECT_COST,
  FOUND_SECT_MIN_AGE,
  FOUND_SECT_MIN_MARTIAL,
  FOUND_SECT_MIN_REPUTATION,
  RECRUIT_COST,
} from '../core/life/foundedSect';
import { allTitles, syncTitles } from '../core/life/titles';
import { computeJianghuScore } from '../core/life/jianghuRank';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import type { LifeGameState } from '../interfaces/lifeEngine';

function qualifyFounder(state: LifeGameState): void {
  state.character.age = FOUND_SECT_MIN_AGE;
  state.character.martial = FOUND_SECT_MIN_MARTIAL;
  state.character.reputation = FOUND_SECT_MIN_REPUTATION;
  state.character.money = FOUND_SECT_COST + 500;
  state.character.sectId = null;
}

describe('foundedSect: gating', () => {
  it('blocks founding below age/martial/reputation/money thresholds', () => {
    initRng(1);
    const state = createNewLife(1);
    expect(canFoundSect(state).ok).toBe(false);
  });

  it('blocks founding while still a member of an existing sect', () => {
    initRng(2);
    const state = createNewLife(2);
    qualifyFounder(state);
    state.character.sectId = 'some_sect';
    expect(canFoundSect(state).ok).toBe(false);
  });

  it('allows founding once every threshold is met', () => {
    initRng(3);
    const state = createNewLife(3);
    qualifyFounder(state);
    expect(canFoundSect(state).ok).toBe(true);
  });

  it('blocks founding a second sect', () => {
    initRng(4);
    const state = createNewLife(4);
    qualifyFounder(state);
    foundSect(state, '測試門');
    expect(canFoundSect(state).ok).toBe(false);
  });
});

describe('foundedSect: founding and recruiting', () => {
  it('foundSect deducts cost and creates the sect record', () => {
    initRng(5);
    const state = createNewLife(5);
    qualifyFounder(state);
    const before = state.character.money;
    const logs = foundSect(state, '青雲門');
    expect(state.foundedSect).toBeTruthy();
    expect(state.foundedSect?.name).toBe('青雲門');
    expect(state.foundedSect?.disciples).toEqual([]);
    expect(state.character.money).toBe(before - FOUND_SECT_COST);
    expect(logs.some((l) => l.includes('青雲門'))).toBe(true);
  });

  it('falls back to a default name when none given', () => {
    initRng(6);
    const state = createNewLife(6);
    qualifyFounder(state);
    foundSect(state, '   ');
    expect(state.foundedSect?.name).toBe(`${state.character.name}門`);
  });

  it('recruitDisciple adds a disciple with a skill drawn from the player and deducts cost', () => {
    initRng(7);
    const state = createNewLife(7);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    const before = state.character.money;
    const logs = recruitDisciple(state);
    const sect = state.foundedSect!;
    expect(sect.disciples.length).toBe(1);
    const d = sect.disciples[0]!;
    expect(state.character.skills).toContain(d.skillId);
    expect(d.status).toBe('training');
    expect(d.rank).toBe(0);
    expect(state.character.money).toBe(before - RECRUIT_COST);
    expect(logs.some((l) => l.includes(d.name))).toBe(true);
  });

  it('refuses to recruit beyond the sect capacity', () => {
    initRng(8);
    const state = createNewLife(8);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    const sect = state.foundedSect!;
    for (let i = 0; i < sect.maxDisciples; i++) recruitDisciple(state);
    expect(canRecruitDisciple(state).ok).toBe(false);
  });
});

describe('foundedSect: teaching, advancing, graduating', () => {
  it('teachDisciple guarantees forward progress', () => {
    initRng(9);
    const state = createNewLife(9);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    recruitDisciple(state);
    const d = state.foundedSect!.disciples[0]!;
    d.advanceNeed = 1000; // 確保今次教導唔會觸發升階，只驗證進度增加
    teachDisciple(state, d.id);
    expect(d.progress).toBeGreaterThan(0);
  });

  it('advancing a disciple through all ranks marks them graduated and grants fame + reputation', () => {
    initRng(10);
    const state = createNewLife(10);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    recruitDisciple(state);
    const d = state.foundedSect!.disciples[0]!;
    const repBefore = state.character.reputation;

    // 強制逐階推到出師，避免依賴隨機進度
    for (let rank = 0; rank < 3; rank++) {
      d.advanceNeed = 0.01;
      teachDisciple(state, d.id);
    }
    expect(d.status).toBe('graduated');
    expect(d.rank).toBe(3);
    expect(state.foundedSect!.fame).toBeGreaterThan(0);
    expect(state.character.reputation).toBeGreaterThan(repBefore);
  });

  it('teachDisciple is a no-op once a disciple has graduated or left', () => {
    initRng(11);
    const state = createNewLife(11);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    recruitDisciple(state);
    const d = state.foundedSect!.disciples[0]!;
    d.status = 'graduated';
    const logs = teachDisciple(state, d.id);
    expect(logs[0]).toContain('不在門下');
  });
});

describe('foundedSect: monthly tick', () => {
  it('drops a disciple to "left" once loyalty bottoms out', () => {
    initRng(12);
    const state = createNewLife(12);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    recruitDisciple(state);
    const d = state.foundedSect!.disciples[0]!;
    d.loyalty = 0;
    // 忠誠帶隨機浮動（±），非單調下跌；重複月度同步直到觸發離門
    let logs: string[] = [];
    for (let i = 0; i < 60 && d.status === 'training'; i++) {
      d.loyalty = 0;
      logs = tickFoundedSect(state);
    }
    expect(d.status).toBe('left');
    expect(logs.some((l) => l.includes(d.name))).toBe(true);
  });

  it('does nothing when no sect has been founded', () => {
    initRng(13);
    const state = createNewLife(13);
    expect(tickFoundedSect(state)).toEqual([]);
  });
});

describe('foundedSect: ranking + title integration', () => {
  it('foundedSectScore reflects fame and graduated disciple count', () => {
    initRng(14);
    const state = createNewLife(14);
    expect(foundedSectScore(state)).toBe(0);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    state.foundedSect!.fame = 10;
    const scoreBefore = foundedSectScore(state);
    recruitDisciple(state);
    state.foundedSect!.disciples[0]!.status = 'graduated';
    expect(foundedSectScore(state)).toBeGreaterThan(scoreBefore);
  });

  it('founding and graduating disciples raises the overall jianghu score', () => {
    initRng(15);
    const state = createNewLife(15);
    const before = computeJianghuScore(state);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    state.foundedSect!.fame = 20;
    expect(computeJianghuScore(state)).toBeGreaterThan(before);
  });

  it('grants 開山祖師 once founded, and 桃李滿門 once 3 disciples graduate', () => {
    initRng(16);
    const state = createNewLife(16);
    qualifyFounder(state);
    foundSect(state, '青雲門');
    syncTitles(state);
    let labels = allTitles(state).map((t) => t.label);
    expect(labels).toContain('開山祖師');
    expect(labels).not.toContain('桃李滿門');

    for (let i = 0; i < 3; i++) {
      recruitDisciple(state);
    }
    for (const d of state.foundedSect!.disciples) {
      d.status = 'graduated';
    }
    syncTitles(state);
    labels = allTitles(state).map((t) => t.label);
    expect(labels).toContain('桃李滿門');
  });
});
