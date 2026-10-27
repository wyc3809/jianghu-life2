import type { LifeCharacter } from '@interfaces/lifeEngine';
import { getGearDef, type GearDef, type GearRarity, type GearSlot } from '@data/equipment/catalog';
import { combatPowerScore, previewEquipDelta } from '@core/life/equipment';
import { inkArtUrl } from './inkAssets';

export const EQUIPMENT_SLOTS: GearSlot[] = ['weapon', 'armor', 'accessory'];
export const EQUIPMENT_LABEL: Record<GearSlot, string> = { weapon: '武器', armor: '護甲', accessory: '飾品' };
export const EQUIPMENT_RARITIES: GearRarity[] = ['common', 'fine', 'rare', 'epic', 'mythic', 'divine'];
export type EquipmentSort = 'power' | 'rarity' | 'name';

/** 單件裝備戰意沿用現有公式；影子配搭不寫入人物、資源或存檔。 */
export function equipmentPiecePower(c: LifeCharacter, def: GearDef): number {
  return combatPowerScore({ ...c, gear: [...(c.gear ?? [])], equipment: { weapon: null, armor: null, accessory: null, [def.slot]: def.id } });
}

/** 只列真持有且類型相符的裝備；篩選與排序不回寫人物或存檔。 */
export function equipmentCandidates(c: LifeCharacter, slot: GearSlot, rarity: GearRarity | 'all', sort: EquipmentSort): GearDef[] {
  const snapshot: LifeCharacter = { ...c, gear: [...(c.gear ?? [])], equipment: { ...(c.equipment ?? { weapon: null, armor: null, accessory: null }) } };
  return [...new Set(c.gear ?? [])].map(getGearDef)
    .filter((d): d is GearDef => Boolean(d && d.slot === slot && (rarity === 'all' || d.rarity === rarity)))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'zh-Hant') || a.id.localeCompare(b.id);
      if (sort === 'rarity') {
        const delta = EQUIPMENT_RARITIES.indexOf(b.rarity) - EQUIPMENT_RARITIES.indexOf(a.rarity);
        if (delta) return delta;
      }
      return (previewEquipDelta(snapshot, b.id)?.powerAfter ?? 0) - (previewEquipDelta(snapshot, a.id)?.powerAfter ?? 0) || a.id.localeCompare(b.id);
    });
}

/** 同類物品沿用同一器物圖；名稱、品階及全部詞綴始終來自真實裝備。 */
export function equipmentArtUrl(def?: GearDef | null, slot: GearSlot = 'weapon'): string {
  const kind = def?.slot === 'weapon' ? def.weaponKind ?? 'sword' : def?.slot ?? slot;
  return inkArtUrl(`art/person/gear-${kind === 'weapon' ? 'sword' : kind}.webp`);
}

/** 比較候選與目前底材；不隱藏負差值，完整詞綴另外保留。 */
export function equipmentStatRows(current?: GearDef | null, selected?: GearDef | null) {
  const stats = [['攻擊', 'attack'], ['防禦', 'defense'], ['氣血', 'maxHpBonus'], ['內力', 'maxQiBonus'], ['武學', 'martialBonus']] as const;
  return stats.filter(([, key]) => (current?.[key] ?? 0) !== 0 || (selected?.[key] ?? 0) !== 0)
    .map(([label, key]) => ({ label, before: current?.[key] ?? 0, after: selected?.[key] ?? 0, delta: (selected?.[key] ?? 0) - (current?.[key] ?? 0) }));
}
