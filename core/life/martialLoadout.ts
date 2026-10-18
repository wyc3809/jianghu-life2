/** 五門外功＋內功／身法各一門；全部都可以跨流派裝備。 */
import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import { canonicalSkillId, getSkillDef } from '@data/skills/catalog';
import { MARTIAL_LOADOUT_LIMIT } from '@data/redesign/testParams';

export const INTERNAL_ART_SLOT = MARTIAL_LOADOUT_LIMIT;
export const QINGGONG_ART_SLOT = MARTIAL_LOADOUT_LIMIT + 1;
export type SupportArts = { internal: string | null; qinggong: string | null };

/** 內功同身法唔佔外功五格；兼容舊三主修及上一版混合五格原型。 */
export function supportMartialSlots(c: LifeCharacter): SupportArts {
  const out: SupportArts = { internal: null, qinggong: null };
  for (const kind of ['internal', 'qinggong'] as const) {
    let id: string | null | undefined;
    if (c.supportArts !== undefined) id = c.supportArts[kind];
    else if (c.equippedArts !== undefined) id = c.equippedArts.find(id => id && getSkillDef(id)?.kind === kind);
    else {
      const main = c.mainArts?.[kind];
      id = main && c.skills.includes(main) && getSkillDef(main)?.kind === kind
        ? main : c.skills.find(id => getSkillDef(id)?.kind === kind);
    }
    out[kind] = id && c.skills.includes(id) && getSkillDef(id)?.kind === kind ? id : null;
  }
  return out;
}

/** 外功五格；混合五格原型遷移時抽出外功，保留已學同支援武學。 */
export function martialSlots(c: LifeCharacter): (string | null)[] {
  const legacy = c.equippedArts === undefined;
  const mixed = c.supportArts === undefined && c.equippedArts?.some(id => id && getSkillDef(id)?.kind !== 'external');
  const main = c.mainArts?.external;
  const source = legacy
    ? [main && c.skills.includes(main) && getSkillDef(main)?.kind === 'external' ? main : undefined, ...c.skills]
    : mixed ? c.equippedArts!.filter(id => id && getSkillDef(id)?.kind === 'external') : c.equippedArts!;
  const slots: (string | null)[] = [];
  const seen = new Set<string>();
  for (const id of source) {
    const key = id ? canonicalSkillId(id) : '';
    const valid = Boolean(id && getSkillDef(id)?.kind === 'external' && c.skills.includes(id) && !seen.has(key));
    if (valid) { slots.push(id!); seen.add(key); }
    else if (!legacy) slots.push(null);
    if (slots.length === MARTIAL_LOADOUT_LIMIT) break;
  }
  return [...slots, ...Array<string | null>(MARTIAL_LOADOUT_LIMIT - slots.length).fill(null)];
}

/** 實戰讀取五格外功，加獨立內功及身法，唔計未裝備收藏。 */
export function equippedMartialArts(c: LifeCharacter): string[] {
  const support = supportMartialSlots(c);
  return [...martialSlots(c), support.internal, support.qinggong].filter((id): id is string => id !== null);
}

/** 0–4為外功，5為內功，6為身法；由玩家指定欄位，唔自動替換。 */
export function setMartialSlot(state: LifeGameState, slot: number, id: string | null): boolean {
  if (!Number.isInteger(slot) || slot < 0 || slot > QINGGONG_ART_SLOT) return false;
  const c = state.character;
  const slots = martialSlots(c);
  const support = supportMartialSlots(c);
  const kind = slot === INTERNAL_ART_SLOT ? 'internal' : slot === QINGGONG_ART_SLOT ? 'qinggong' : 'external';
  const current = kind === 'external' ? slots[slot] : support[kind];
  if (current === id) return false;
  if (id !== null) {
    if (getSkillDef(id)?.kind !== kind || !c.skills.includes(id)) return false;
    if (kind === 'external' && slots.some((old, i) => i !== slot && old && canonicalSkillId(old) === canonicalSkillId(id))) return false;
  }
  if (kind === 'external') slots[slot] = id;
  else support[kind] = id;
  c.equippedArts = slots;
  c.supportArts = support;
  return true;
}
