/**
 * 演武台主角出招輪替（第 25 項）：已裝備外功（有招式嗰啲）按欄位逐套輪住用。
 * 每套外功有自己嘅專屬動畫（src/fx/art/recipes.ts）；未有編排嘅照用原本揮擊。
 * 此檔只讀取招式次序；實際回合與招式威力由core/life/sparRounds結算。
 */
import type { LifeCharacter } from '@interfaces/lifeEngine';
import { getSkillDef } from '@data/skills/catalog';
import { equippedMartialArts } from '@core/life/martialLoadout';
import { sparRoundMoves } from '@core/life/sparRounds';

/** 已裝備外功（按欄位次序） */
export function sparArtOrder(c: LifeCharacter): string[] {
  return equippedMartialArts(c).filter((id) => {
    const d = getSkillDef(id);
    return d?.kind === 'external' && Boolean(d.move);
  });
}

/** 第 n 招（由 0 起）用邊套；冇外功就 null（照用原本揮擊） */
export function sparArtAt(c: LifeCharacter, n: number): string | null {
  const order = sparArtOrder(c);
  return order.length ? order[((n % order.length) + order.length) % order.length]! : null;
}

/** 第n次起手依每門外功的完整已學卷次排列；回合交接由SparRounds處理。 */
export function sparMoveAt(c: LifeCharacter, n: number): { artId: string; volume?: number; moveName?: string } | null {
  const moves = sparArtOrder(c).flatMap((_, round) => sparRoundMoves(c, round));
  const move = moves[Math.max(0, Math.floor(n)) % moves.length];
  return move?.artId ? { artId: move.artId, volume: move.volume, moveName: move.moveName } : null;
}
