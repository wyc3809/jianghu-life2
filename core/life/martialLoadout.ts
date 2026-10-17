/** 五門實戰武學：欄位自由配搭，流派同武學類型都唔係裝備門檻。 */
import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import { canonicalSkillId, getSkillDef } from '@data/skills/catalog';
import { MARTIAL_LOADOUT_LIMIT } from '@data/redesign/testParams';

/** 正規化五格；舊存檔保留原主修，剩餘欄位按原已學次序補入，唔改收藏。 */
export function martialSlots(c: LifeCharacter): (string | null)[] {
  const legacy = c.equippedArts === undefined;
  const source = legacy
    ? [...(['external', 'internal', 'qinggong'] as const).map(kind => {
        const picked = c.mainArts?.[kind];
        return picked && c.skills.includes(picked) && getSkillDef(picked)?.kind === kind
          ? picked : c.skills.find(id => getSkillDef(id)?.kind === kind);
      }), ...c.skills]
    : c.equippedArts!;
  const slots: (string | null)[] = [];
  const seen = new Set<string>();
  for (const id of source) {
    const key = id ? canonicalSkillId(id) : '';
    const valid = Boolean(id && getSkillDef(id) && c.skills.includes(id) && !seen.has(key));
    if (valid) { slots.push(id!); seen.add(key); }
    else if (!legacy) slots.push(null);
    if (slots.length === MARTIAL_LOADOUT_LIMIT) break;
  }
  return [...slots, ...Array<string | null>(MARTIAL_LOADOUT_LIMIT - slots.length).fill(null)];
}

/** 只有裝備中嘅武學參與出招、被動同流派協同，排列依欄位次序。 */
export function equippedMartialArts(c: LifeCharacter): string[] {
  return martialSlots(c).filter((id): id is string => id !== null);
}

/** 指定一格裝備或卸下；唔自動擠走其他欄位、唔接受未學或重複武學。 */
export function setMartialSlot(state: LifeGameState, slot: number, id: string | null): boolean {
  if (!Number.isInteger(slot) || slot < 0 || slot >= MARTIAL_LOADOUT_LIMIT) return false;
  const c = state.character;
  const slots = martialSlots(c);
  if (slots[slot] === id) return false;
  if (id !== null) {
    if (!getSkillDef(id) || !c.skills.includes(id)) return false;
    if (slots.some((old, i) => i !== slot && old && canonicalSkillId(old) === canonicalSkillId(id))) return false;
  }
  slots[slot] = id;
  c.equippedArts = slots;
  return true;
}
