import type { LifeCharacter, LifeGameState, MartialPreset } from '@interfaces/lifeEngine';
import { getSkillDef, canonicalSkillId, sumInternalPassives } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { martialSlots, supportMartialSlots, setMartialSlot, equippedMartialArts } from './martialLoadout';
import { gearTotals } from './equipment';
import { torsoHpFactor } from './injuryMath';

export type PresetKind = 'normal' | 'duel';

/** 讀取普通配搭；回傳獨立欄位，唔共用可變陣列。 */
export function normalPreset(c: LifeCharacter): MartialPreset {
  const support = supportMartialSlots(c);
  return { external: martialSlots(c), ...support, equipment: { ...c.equipment } };
}

/** 舊檔只初始化一次；其後普通／對戰互不覆蓋。 */
export function ensureCombatPreset(c: LifeCharacter): void {
  c.combatLoadout ??= normalPreset(c);
}

/** 所有欄位仍要符合現有持有物及類型；失效欄位置空，唔自動換裝。 */
export function duelPreset(c: LifeCharacter): MartialPreset {
  const p = c.combatLoadout ?? normalPreset(c), seen = new Set<string>();
  const valid = (id: string | null, kind: string) => id && c.skills.includes(id) && getSkillDef(id)?.kind === kind ? id : null;
  const external = Array.from({ length: 5 }, (_, i) => {
    const id = valid(p.external[i] ?? null, 'external'), key = id ? canonicalSkillId(id) : '';
    if (!id || seen.has(key)) return null;
    seen.add(key); return id;
  });
  const equipment = { ...p.equipment };
  for (const slot of ['weapon', 'armor', 'accessory'] as const) {
    const id = equipment[slot];
    if (id && (!c.gear.includes(id) || getGearDef(id)?.slot !== slot)) equipment[slot] = null;
  }
  return { external, internal: valid(p.internal, 'internal'), qinggong: valid(p.qinggong, 'qinggong'), equipment };
}

/** 只建立對戰快照，校正裝備上限差額，唔改本體或額外補血／回內。 */
export function characterForPreset(c: LifeCharacter, kind: PresetKind): LifeCharacter {
  if (kind === 'normal') return c;
  const p = duelPreset(c), view: LifeCharacter = { ...c, flags: { ...c.flags }, equippedArts: [...p.external],
    supportArts: { internal: p.internal, qinggong: p.qinggong }, equipment: { ...p.equipment }, combatLoadout: undefined };
  const before = gearTotals(c), after = gearTotals(view);
  const a = sumInternalPassives(equippedMartialArts(c), c.skillRanks, c.manualStars);
  const b = sumInternalPassives(equippedMartialArts(view), view.skillRanks, view.manualStars);
  const hpDelta = c.flags.caps_include_internal ? (b.maxHp ?? 0)-(a.maxHp ?? 0) : 0;
  const qiDelta = c.flags.caps_include_internal ? (b.maxQi ?? 0)-(a.maxQi ?? 0) : 0;
  const factor = torsoHpFactor(c);
  view.maxHealth = Math.max(1, Math.round(c.maxHealth + (after.maxHpBonus - before.maxHpBonus + hpDelta) * factor));
  view.maxQi = Math.max(1, c.maxQi + after.maxQiBonus - before.maxQiBonus + qiDelta);
  view.health = Math.min(view.health, view.maxHealth); view.qi = Math.min(view.qi, view.maxQi);
  return view;
}

/** 玩家指定普通或對戰欄位；唔變更另一套。 */
export function setPresetMartialSlot(state: LifeGameState, slot: number, id: string | null, kind: PresetKind): boolean {
  const c = state.character;
  ensureCombatPreset(c);
  if (kind === 'normal') return setMartialSlot(state, slot, id);
  const character = characterForPreset(c, 'duel');
  if (!setMartialSlot({ ...state, character }, slot, id)) return false;
  c.combatLoadout = normalPreset(character);
  c.flags.duel_loadout_saved = true;
  return true;
}

/** 對戰裝備只引用已持有物品，不回寫普通氣血／內力。 */
export function setDuelGear(c: LifeCharacter, id: string): boolean {
  const def = getGearDef(id);
  if (!def || !c.gear.includes(id)) return false;
  ensureCombatPreset(c);
  if (c.combatLoadout!.equipment[def.slot] === id) return false;
  c.combatLoadout!.equipment[def.slot] = id;
  c.flags.duel_loadout_saved = true;
  return true;
}
