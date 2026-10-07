/**
 * 外功七卷：角色同家族收藏兩邊嘅卷號管理（data/skills/volumes.ts 定義七卷招式）。
 * 角色學識一門外功＝有卷一；其餘卷靠抽卡／奇遇（入家族收藏，再同步落今世角色）。
 */
import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import type { AncestryMeta } from '@interfaces/ancestry';
import { getSkillDef, type CombatMoveDef } from '@data/skills/catalog';
import { VOLUME_COUNT, artVolumeMoves, hasVolumes, normalizeVolumes } from '@data/skills/volumes';
import { MANUAL_STAR_BONUS } from '@data/redesign/testParams';
import { mainArts } from './schools';

const ALL_VOLUMES = Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1);

/** 角色已得嘅卷（學識咗就一定有卷一） */
export function ownedVolumes(c: LifeCharacter, skillId: string): number[] {
  if (!hasVolumes(skillId) || !c.skills.includes(skillId)) return [];
  return normalizeVolumes([1, ...(c.volumes?.[skillId] ?? [])]);
}

/** 角色加卷；返回係咪新卷 */
export function grantVolume(c: LifeCharacter, skillId: string, vol: number): boolean {
  if (!hasVolumes(skillId)) return false;
  const cur = normalizeVolumes(c.volumes?.[skillId]);
  if (cur.includes(vol)) return false;
  c.volumes = { ...(c.volumes ?? {}), [skillId]: normalizeVolumes([...cur, vol]) };
  return true;
}

/** 家族收藏入面某門外功收咗邊幾卷（舊記錄冇 vols＝當年係成本入藏＝七卷齊） */
export function collectionVolumes(meta: AncestryMeta, skillId: string): number[] {
  const e = meta.manuals?.[skillId];
  if (!e || !hasVolumes(skillId)) return [];
  return e.vols ? normalizeVolumes(e.vols) : ALL_VOLUMES;
}

/** 家族收藏加卷；返回係咪新卷（重複就當重複本） */
export function addCollectionVolume(meta: AncestryMeta, skillId: string, vol: number): boolean {
  meta.manuals ??= {};
  const e = meta.manuals[skillId];
  if (!e) {
    meta.manuals[skillId] = { stars: 0, copies: 0, vols: [vol] };
    return true;
  }
  const have = collectionVolumes(meta, skillId);
  if (have.includes(vol)) {
    e.copies += 1;
    return false;
  }
  e.vols = normalizeVolumes([...have, vol]);
  return true;
}

/** 將家族收藏嘅卷同步落今世角色已學嘅外功；返回有冇變 */
export function syncCollectionVolumes(c: LifeCharacter, meta: AncestryMeta): boolean {
  let changed = false;
  for (const id of c.skills) {
    for (const v of collectionVolumes(meta, id)) if (v > 1 && grantVolume(c, id, v)) changed = true;
  }
  return changed;
}

/** 自動戰鬥用邊門外功：主修外功，冇就第一門有招嘅外功 */
export function autoBattleArt(c: LifeCharacter): string | null {
  const main = mainArts(c).external;
  if (main && hasVolumes(main) && c.skills.includes(main)) return main;
  return c.skills.find((id) => hasVolumes(id)) ?? null;
}

/** 自動戰鬥每回合出嘅招（已得嘅卷，按卷序；秘笈升階照加） */
export function autoBattleMoves(state: LifeGameState): { skillId: string; vol: number; move: CombatMoveDef }[] {
  const c = state.character;
  const art = autoBattleArt(c);
  if (!art) return [];
  const stars = c.manualStars?.[art] ?? 0;
  const moves = artVolumeMoves(art);
  return ownedVolumes(c, art).map((vol) => {
    const m = moves[vol - 1]!;
    return { skillId: art, vol, move: stars ? { ...m, power: m.power * (1 + MANUAL_STAR_BONUS * stars) } : m };
  });
}

/** 介面用：外功名＋已得卷數 */
export function volumeSummary(c: LifeCharacter, skillId: string): string {
  const def = getSkillDef(skillId);
  const n = ownedVolumes(c, skillId).length;
  return `${def?.name ?? skillId} ${n}／${VOLUME_COUNT} 卷`;
}
