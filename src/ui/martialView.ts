import type { LifeCharacter } from '@interfaces/lifeEngine';
import type { AncestryMeta } from '@interfaces/ancestry';
import { canonicalSkillId, formatSkillEffects, getSkillDef } from '@data/skills/catalog';
import { artVolumeMoves, VOLUME_NUMERALS } from '@data/skills/volumes';
import { ownedVolumes, collectionVolumes } from '@core/life/volumes';
import { martialSlots, supportMartialSlots, INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '@core/life/martialLoadout';
import { rankName, skillAdvancePercent, skillAdvanceHint } from '@core/life/martialRanks';

/** 欄位類型沿用五門外功與兩個獨立支援欄位，不增設欄位。 */
export function martialSlotKind(slot: number) {
  return slot === INTERNAL_ART_SLOT ? 'internal' : slot === QINGGONG_ART_SLOT ? 'qinggong' : 'external';
}

/** 讀取此套配搭的欄位，不遷移或寫回舊存檔。 */
export function martialSlotArt(c: LifeCharacter, slot: number): string | null {
  const kind = martialSlotKind(slot);
  return kind === 'external' ? martialSlots(c)[slot] ?? null : supportMartialSlots(c)[kind];
}

/** 當代已學與家族已得分開顯示；演出品階不當作永久珍本身份。 */
export function martialArtView(c: LifeCharacter, meta: AncestryMeta, id: string) {
  const def = getSkillDef(id);
  if (!def) return null;
  const learned = c.skills.includes(id), used = ownedVolumes(c, id), stored = collectionVolumes(meta, id);
  return {
    id, def, learned, premium: def.premium === true,
    rank: learned ? rankName(c.skillRanks[id] ?? 0) : '尚未習得',
    progress: learned ? skillAdvancePercent(c, id) : null,
    hint: learned ? skillAdvanceHint(c, id) : '確認裝備後習得，不消耗書頁。',
    stars: meta.manuals?.[id]?.stars ?? c.manualStars?.[id] ?? 0,
    cost: def.kind === 'external' ? def.move?.qiCost ?? 0 : 0,
    effects: formatSkillEffects(id) || '尚無詳載',
    volumes: artVolumeMoves(id).map((move, index) => ({
      number: index + 1, numeral: VOLUME_NUMERALS[index]!, name: move.name,
      status: used.includes(index + 1) ? '已學' : stored.includes(index + 1) ? '已得' : '未得',
    })),
    usable: used.length,
    collected: new Set([...used, ...stored]).size,
  };
}

/** 只列真已學／真收藏且類型相符的武學；同一武學的舊別名只列一次。 */
export function martialCandidates(c: LifeCharacter, meta: AncestryMeta, slot: number, rarity: 'all' | 'ordinary' | 'premium' = 'all') {
  const seen = new Set<string>(), kind = martialSlotKind(slot);
  const slots = [...martialSlots(c), supportMartialSlots(c).internal, supportMartialSlots(c).qinggong];
  return [...c.skills, ...Object.keys(meta.manuals ?? {})].flatMap(id => {
    const view = martialArtView(c, meta, id), key = canonicalSkillId(id);
    if (!view || view.def.kind !== kind || seen.has(key)) return [];
    seen.add(key);
    if (rarity !== 'all' && view.premium !== (rarity === 'premium')) return [];
    const occupied = slots.findIndex(other => other && canonicalSkillId(other) === key);
    return [{ ...view, occupied, blocked: occupied >= 0 && occupied !== slot }];
  }).sort((a, b) => Number(b.learned) - Number(a.learned) || a.def.name.localeCompare(b.def.name, 'zh-Hant') || a.id.localeCompare(b.id));
}
