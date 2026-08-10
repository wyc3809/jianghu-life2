import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import {
  buildGenealogy,
  formatGenealogyText,
  sealGenealogyForLegacy,
  clanSurnameOf,
} from '../core/life/genealogy';
import { extractLegacy, applyLegacyToCharacter } from '../core/life/legacy';
import { recordDeath } from '../core/life/death';
import { chineseSurnameOf } from '../core/ids';
import { seekChild } from '../core/life/family';

describe('genealogy 族譜', () => {
  it('lists parents self and children with heir mark', () => {
    const state = createNewLife({ seed: 21, skipCoach: true });
    const surname = chineseSurnameOf(state.character.name);
    state.character.family.childrenNames = [`${surname}青禾`, `${surname}墨白`];
    state.character.childrenCount = 2;
    state.character.flags.heir_name = `${surname}青禾`;
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

    const book = buildGenealogy(state);
    expect(book.entries.some((e) => e.title === '父')).toBe(true);
    expect(book.entries.some((e) => e.title === '母')).toBe(true);
    expect(book.entries.some((e) => e.self && e.name === state.character.name)).toBe(true);
    expect(book.entries.some((e) => e.title === '眷屬' && e.name === '阿絮')).toBe(true);
    expect(book.entries.filter((e) => e.generation === '子嗣')).toHaveLength(2);
    expect(book.entries.find((e) => e.name === `${surname}青禾`)?.heir).toBe(true);

    const text = formatGenealogyText(state).join('\n');
    expect(text).toMatch(/族譜/);
    expect(text).toMatch(/青禾/);
  });

  it('keeps the same surname across parents self and children', () => {
    const state = createNewLife({ seed: 88, name: '蔣潤天', skipCoach: true });
    expect(chineseSurnameOf(state.character.name)).toBe('蔣');
    expect(chineseSurnameOf(state.character.family.fatherName!)).toBe('蔣');
    expect(chineseSurnameOf(state.character.family.motherName!)).toBe('蔣');
    expect(clanSurnameOf(state)).toBe('蔣');

    // force mismatch then open 族譜 → 應對齊
    state.character.family.fatherName = '王聽雨';
    state.character.family.motherName = '李如雪';
    state.character.family.childrenNames = ['青禾', '張墨白'];
    state.character.childrenCount = 2;
    state.character.flags.heir_name = '青禾';
    const book = buildGenealogy(state);
    const blood = book.entries.filter((e) =>
      ['父', '母', '本人', '子', '女', '子女'].includes(e.title),
    );
    for (const row of blood) {
      expect(chineseSurnameOf(row.name)).toBe('蔣');
    }
    // 眷屬保持外姓
    state.character.loverId = 'lover_x';
    state.npcs.lover_x = {
      id: 'lover_x',
      name: '沈阿絮',
      gender: 'female',
      role: 'lover',
      affinity: 70,
      memories: [],
      alive: true,
    };
    const withLover = buildGenealogy(state);
    expect(withLover.entries.find((e) => e.title === '眷屬')?.name).toBe('沈阿絮');
  });

  it('newborn children inherit the clan surname', () => {
    const state = createNewLife({ seed: 91, name: '蔣問天', skipCoach: true });
    state.character.age = 22;
    state.character.money = 100;
    state.character.loverId = 'lover_y';
    state.npcs.lover_y = {
      id: 'lover_y',
      name: '陸如雪',
      gender: 'female',
      role: 'lover',
      affinity: 80,
      memories: [],
      alive: true,
    };
    state.character.monthsSinceLastBirth = 99;
    let got = false;
    for (let i = 0; i < 12 && !got; i++) {
      state.character.money = 100;
      state.character.monthsSinceLastBirth = 99;
      seekChild(state);
      if ((state.character.family.childrenNames?.length ?? 0) > 0) got = true;
    }
    expect(got).toBe(true);
    for (const n of state.character.family.childrenNames ?? []) {
      expect(chineseSurnameOf(n)).toBe('蔣');
    }
  });

  it('seals chronicle into next life via legacy', () => {
    const prev = createNewLife({ seed: 22, skipCoach: true });
    prev.character.age = 40;
    prev.character.family.childrenNames = [
      `${chineseSurnameOf(prev.character.name)}傳兒`,
    ];
    prev.character.childrenCount = 1;
    prev.character.flags.heir_name = prev.character.family.childrenNames[0];
    recordDeath(prev, '燈殘。');
    const sealed = sealGenealogyForLegacy(prev);
    expect(sealed.some((l) => l.includes(prev.character.name))).toBe(true);

    const legacy = extractLegacy(prev);
    expect(legacy.genealogyChronicle?.length).toBeGreaterThan(0);

    const next = createNewLife({ seed: 23, skipCoach: true });
    applyLegacyToCharacter(next, legacy);
    const book = buildGenealogy(next);
    expect(book.chronicle.length).toBeGreaterThan(0);
    expect(book.entries.some((e) => e.generation === '先祖')).toBe(true);
    const surname = chineseSurnameOf(String(legacy.ancestorName));
    const blood = book.entries.filter((e) =>
      ['父', '母', '本人', '前世'].includes(e.title),
    );
    for (const row of blood) {
      expect(chineseSurnameOf(row.name)).toBe(surname);
    }
  });
});
