import { describe, expect, it } from 'vitest';
import { breakthroughHighlight, momentHighlight } from '../src/fx/highlight/fromGame';
import { GRADES } from '../src/fx/highlight/grades';
import { createNewLife } from '../core/life/gameState';
import { grantGear } from '../core/life/equipment';
import { GEAR_CATALOG } from '../data/equipment/catalog';
import { initRng } from '../core/random';

function fresh() {
  initRng(31);
  const s = createNewLife(31);
  s.moments = [];
  return s;
}

describe('highlight fx mapping (高光時刻)', () => {
  it('test_highlight_new_gear_queues_loot_moment_with_rarity_grade', () => {
    const state = fresh();
    const divine = GEAR_CATALOG.find((g) => g.rarity === 'divine')!;
    grantGear(state, divine.id);
    expect(state.moments).toEqual([{ kind: 'loot', gearId: divine.id }]);
    const cfg = momentHighlight(state, state.moments![0]!)!;
    expect(cfg.subject).toBe('chest');
    expect(cfg.targetGrade).toBe(5);
    expect(cfg.rewards[0]).toMatchObject({ name: divine.name, grade: 5, isNew: true });
    // 再得同一件唔再入隊
    grantGear(state, divine.id);
    expect(state.moments).toHaveLength(1);
  });

  it('test_highlight_martial_rank_maps_to_token_grades', () => {
    const state = fresh();
    expect(momentHighlight(state, { kind: 'learn', name: '驚鴻劍' })).toMatchObject({
      subject: 'token',
      targetGrade: 1,
    });
    const grades = [1, 2, 3].map(
      (rank) => momentHighlight(state, { kind: 'rank', name: '驚鴻劍', rank, rankName: 'x' })!.targetGrade,
    );
    expect(grades).toEqual([2, 3, 5]);
  });

  it('test_highlight_titles_and_injuries_keep_ink_effect', () => {
    const state = fresh();
    expect(momentHighlight(state, { kind: 'title', label: '初入門徑', tier: 1 })).toBeNull();
    expect(momentHighlight(state, { kind: 'injury', part: 'arm', tier: 'heavy' })).toBeNull();
  });

  it('test_highlight_breakthrough_success_only_and_free_jade_flies', () => {
    const state = fresh();
    state.character.flags.jianghu_prestige = 300;
    expect(breakthroughHighlight(state, { success: false, lines: [], oldTierName: 'a' })).toBeNull();
    const cfg = breakthroughHighlight(state, {
      success: true,
      lines: [],
      oldTierName: 'a',
      newTierName: 'b',
      newTierLevel: 14,
      hpGain: 10,
      qiGain: 20,
      martialGain: 5,
      jadeGain: 140,
    }, 300)!;
    expect(cfg.subject).toBe('cauldron');
    expect(cfg.targetGrade).toBe(5);
    expect(cfg.balances.gem.value).toBe(160);
    expect(cfg.rewards.find((r) => r.flyTo === 'gem')).toMatchObject({ amount: 140 });
  });

  it('test_highlight_grades_have_increasing_power', () => {
    const p = [0, 1, 2, 3, 4, 5].map((g) => GRADES[g as 0].power);
    expect([...p].sort((a, b) => a - b)).toEqual(p);
  });
});

describe('武學令結果身份', () => {
  it('test_highlight_一般武學升至頂階_不標成珍本且映射不改人物', async () => {
    const {getSkillDef}=await import('../data/skills/catalog');
    const state=fresh();state.character.skills=['art_river_fist'];
    const before=structuredClone(state),name=getSkillDef('art_river_fist')!.name;
    const config=momentHighlight(state,{kind:'rank',name,rank:3,rankName:'神乎其技'})!;
    expect(config.targetGrade).toBe(5);
    expect(config.rewards[0]!.identityLabel).toBe('江湖 · 神乎其技');
    expect(config.rewards[0]!.isPremium).not.toBe(true);
    expect(config.claimLabel).toBe('完成');expect(state).toEqual(before);
  });
  it('test_highlight_珍本新習得_沿用真名稱與永久身份', async () => {
    const {SKILL_DEFS}=await import('../data/skills/catalog');
    const def=Object.values(SKILL_DEFS).find(d=>d.premium)!;
    const state=fresh();state.character.skills=[def.id];
    const config=momentHighlight(state,{kind:'learn',name:def.name})!;
    expect(config.targetGrade).toBe(1);expect(config.rewards[0]!.isPremium).toBe(true);
    expect(config.rewards[0]!.identityLabel).toBe('珍本 · 新習得');
    expect(config.rewards[0]!.name).toBe(def.name);
  });
});
