import { describe, expect, it } from 'vitest';
import { fullCatalog } from '../core/life/eventEngine';
import { meetsRequirements } from '../core/life/requirements';
import { allTitles, syncTitles } from '../core/life/titles';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('nature-gated story arcs (正邪值深化)', () => {
  it('registers the three nature arc events in the full catalog', () => {
    const ids = fullCatalog().map((e) => e.id);
    expect(ids).toContain('nature_arc_xia_relief');
    expect(ids).toContain('nature_arc_e_underworld');
    expect(ids).toContain('nature_arc_kuang_challenge');
  });

  it('gates each arc behind its nature threshold, not just age', () => {
    initRng(1);
    const state = createNewLife(1);
    state.character.age = 30;
    const catalog = fullCatalog();
    const xia = catalog.find((e) => e.id === 'nature_arc_xia_relief')!;
    const e = catalog.find((e) => e.id === 'nature_arc_e_underworld')!;
    const kuang = catalog.find((e) => e.id === 'nature_arc_kuang_challenge')!;

    // 低心性：三線都未解鎖
    expect(meetsRequirements(state, xia.requirements)).toBe(false);
    expect(meetsRequirements(state, e.requirements)).toBe(false);
    expect(meetsRequirements(state, kuang.requirements)).toBe(false);

    // 拉高俠值先至解鎖俠線，唔會連帶解鎖其他線
    state.character.nature = { xia: 60, xie: 0, kuang: 0, e: 0 };
    expect(meetsRequirements(state, xia.requirements)).toBe(true);
    expect(meetsRequirements(state, e.requirements)).toBe(false);
    expect(meetsRequirements(state, kuang.requirements)).toBe(false);
  });

  it('grants distinct titles once each arc flag is set', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.flags.nature_arc_xia_hero = true;
    syncTitles(state);
    let titles = allTitles(state).map((t) => t.label);
    expect(titles).toContain('急公好義');
    expect(titles).not.toContain('黑道梟雄');
    expect(titles).not.toContain('瘋魔狂徒');

    state.character.flags.nature_arc_e_underworld = true;
    state.character.flags.nature_arc_kuang_done = true;
    syncTitles(state);
    titles = allTitles(state).map((t) => t.label);
    expect(titles).toContain('黑道梟雄');
    expect(titles).toContain('瘋魔狂徒');
  });
});
