/**
 * 祖蔭傳承（design/gdd/ancestral-merit.md）：一世完結結算祖蔭點，
 * 花喺天賦加點同家傳武學；開新一世時套用。純函數、唔用 RNG。
 */
import type { LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys, wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { ancestryMetaSchema, type AncestryMeta } from '@interfaces/ancestry';
import {
  ART_UNLOCK_COST,
  MERIT_CAP_PER_LIFE,
  SECOND_SLOT_COST,
  TALENT_BASE_COST,
  TALENT_COST_STEP,
  TALENT_MAX_LEVEL,
  TALENT_STEP,
} from '@data/ancestry/tuning';
import { getSkillDef } from '@data/skills/catalog';
import { allTitles } from './titles';

export function emptyAncestry(): AncestryMeta {
  return {
    version: 1,
    points: 0,
    earnedTotal: 0,
    lives: 0,
    talents: { genGu: 0, wuXing: 0, fuYuan: 0, meiLi: 0, danShi: 0 },
    artsSeen: [],
    unlockedArts: [],
    familyArts: [],
    familySlots: 1,
  };
}

/** 讀入（JSON 字串或物件）；唔啱格式一律當空白 */
export function parseAncestry(raw: unknown): AncestryMeta {
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const r = ancestryMetaSchema.safeParse(obj);
    if (!r.success) return emptyAncestry();
    return {
      ...emptyAncestry(),
      ...r.data,
      talents: { ...emptyAncestry().talents, ...r.data.talents },
    } as AncestryMeta;
  } catch {
    return emptyAncestry();
  }
}

export interface MeritGain {
  total: number;
  parts: { label: string; value: number }[];
}

/** §4：一世人值幾多祖蔭 */
export function computeMeritGain(state: LifeGameState): MeritGain {
  const c = state.character;
  const parts = [
    { label: '壽數', value: Math.floor(Math.max(0, c.age) / 10) },
    { label: '武學', value: Math.floor(Math.max(0, c.martial) / 20) },
    { label: '名望', value: Math.floor(Math.max(0, c.reputation) / 25) },
    // 15 境縮放返舊 7 境嘅分值（頂境 12 分）
    { label: '境界', value: Math.round((12 * Math.max(0, Math.floor(c.cultivation?.tier ?? 0))) / 14) },
    { label: '稱號', value: allTitles(state).length },
    { label: '血脈', value: (c.childrenCount ?? 0) > 0 ? 2 : 0 },
  ].filter((p) => p.value > 0);
  const raw = parts.reduce((s, p) => s + p.value, 0);
  return { total: Math.min(MERIT_CAP_PER_LIFE, raw), parts };
}

/** 結算一世（只一次，靠角色 flag 防重複）；記低學過嘅武學 */
export function recordLife(meta: AncestryMeta, state: LifeGameState): MeritGain {
  const c = state.character;
  if (c.flags.ancestry_awarded) return { total: 0, parts: [] };
  const gain = computeMeritGain(state);
  c.flags.ancestry_awarded = true;
  meta.points += gain.total;
  meta.earnedTotal += gain.total;
  meta.lives += 1;
  for (const id of c.skills) {
    if (getSkillDef(id) && !meta.artsSeen.includes(id)) meta.artsSeen.push(id);
  }
  return gain;
}

/** 由 level 升去 level+1 嘅成本 */
export function talentCost(level: number): number {
  return TALENT_BASE_COST + level * TALENT_COST_STEP;
}

export function buyTalent(meta: AncestryMeta, attr: WuxiaAttribute): boolean {
  const lv = meta.talents[attr] ?? 0;
  if (lv >= TALENT_MAX_LEVEL) return false;
  const cost = talentCost(lv);
  if (meta.points < cost) return false;
  meta.points -= cost;
  meta.talents[attr] = lv + 1;
  return true;
}

export function unlockArt(meta: AncestryMeta, skillId: string): boolean {
  if (!meta.artsSeen.includes(skillId) || meta.unlockedArts.includes(skillId)) return false;
  if (meta.points < ART_UNLOCK_COST) return false;
  meta.points -= ART_UNLOCK_COST;
  meta.unlockedArts.push(skillId);
  return true;
}

export function buySecondSlot(meta: AncestryMeta): boolean {
  if (meta.familySlots >= 2 || meta.points < SECOND_SLOT_COST) return false;
  meta.points -= SECOND_SLOT_COST;
  meta.familySlots = 2;
  return true;
}

/** 揀／取消家傳；格滿時揀唔入（回傳係咪有改） */
export function toggleFamilyArt(meta: AncestryMeta, skillId: string): boolean {
  const i = meta.familyArts.indexOf(skillId);
  if (i >= 0) {
    meta.familyArts.splice(i, 1);
    return true;
  }
  if (!meta.unlockedArts.includes(skillId) || meta.familyArts.length >= meta.familySlots) return false;
  meta.familyArts.push(skillId);
  return true;
}

/** 開新一世：天賦加屬性、家傳武學直接識（階位 0，唔入特效時刻）；回傳年譜行 */
export function applyAncestry(state: LifeGameState, meta: AncestryMeta): string[] {
  const c = state.character;
  const bits: string[] = [];
  for (const k of wuxiaAttributeKeys) {
    const add = (meta.talents[k] ?? 0) * TALENT_STEP;
    if (!add) continue;
    c.attributes[k] = Math.min(100, (c.attributes[k] ?? 0) + add);
    bits.push(`${wuxiaAttributeLabels[k]}＋${add}`);
  }
  const arts = meta.familyArts
    .filter((id) => meta.unlockedArts.includes(id) && getSkillDef(id))
    .slice(0, meta.familySlots);
  const names: string[] = [];
  for (const id of arts) {
    if (!c.skills.includes(id)) c.skills.push(id);
    c.skillRanks = { ...(c.skillRanks ?? {}), [id]: c.skillRanks?.[id] ?? 0 };
    c.skillProgress = { ...(c.skillProgress ?? {}), [id]: c.skillProgress?.[id] ?? 0 };
    names.push(`「${getSkillDef(id)!.name}」`);
  }
  if (names.length) bits.push(`家傳${names.join('、')}`);
  return bits.length ? [`祖蔭：${bits.join('、')}。`] : [];
}
