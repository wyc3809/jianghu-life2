/**
 * 演武台主角出招輪替（第 25 項）：已學外功（有招式嗰啲）逐套輪住用，主修外功行先。
 * 每套外功有自己嘅專屬動畫（src/fx/art/recipes.ts）；未有編排嘅照用原本揮擊。
 * 純演出：演武傷害照 sparHeroStats 計，唔會因為輪到邊套而改變。
 */
import type { LifeCharacter } from '@interfaces/lifeEngine';
import { getSkillDef } from '@data/skills/catalog';
import { mainArts } from '@core/life/schools';

/** 已學外功（主修排第一，其餘按學識次序） */
export function sparArtOrder(c: LifeCharacter): string[] {
  const ext = c.skills.filter((id) => {
    const d = getSkillDef(id);
    return d?.kind === 'external' && Boolean(d.move);
  });
  const main = mainArts(c).external;
  return main && ext.includes(main) ? [main, ...ext.filter((id) => id !== main)] : ext;
}

/** 第 n 招（由 0 起）用邊套；冇外功就 null（照用原本揮擊） */
export function sparArtAt(c: LifeCharacter, n: number): string | null {
  const order = sparArtOrder(c);
  return order.length ? order[((n % order.length) + order.length) % order.length]! : null;
}
