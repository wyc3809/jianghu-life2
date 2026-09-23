import { describe, expect, it, beforeEach } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { practiceActionLabel } from '../core/life/actions';

describe('修煉結果卡中文標籤（Debug 英文回歸）', () => {
  beforeEach(() => {
    initRng(42);
  });

  it('邪學結果唔再顯示 study_art', () => {
    // 對應畫面「你選擇：…」——store 用 practiceActionLabel
    expect(practiceActionLabel('study_art', { artId: 'darkArts' })).toBe('修習邪學');
    expect(practiceActionLabel('study_art', { artId: 'darkArts' })).not.toContain('study_art');
  });

  it('所有常見修煉 id 都有中文、無 ASCII snake_case', () => {
    const ids = [
      'train_martial',
      'train_internal',
      'temper_body',
      'inquire_rumors',
      'drink_wine',
      'heal',
      'equip_best',
      'study_art',
      'join_sect',
      'sect_duty',
      'sect_leave',
      'forge',
      'seek_master',
    ] as const;
    for (const id of ids) {
      const label = practiceActionLabel(id, id === 'study_art' ? { artId: 'guqin' } : undefined);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/_/);
      expect(label).not.toMatch(/^[a-z]+$/i);
    }
  });

  it('createNewLife 可正常 study_art darkArts', () => {
    const state = createNewLife(7);
    expect(state.character.alive).toBe(true);
    expect(practiceActionLabel('study_art', { artId: 'darkArts' })).toBe('修習邪學');
  });
});
