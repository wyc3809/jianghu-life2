/**
 * 三主修＋流派協同（design/agreed-design-2026-10.md §3；規則同數值見 data/redesign/schools.ts）。
 * 招式（external）／內功（internal）／身法（qinggong）各主修一門；
 * 主修武學＋穿戴裝備嘅流派計數：2＝小成、3＝大成。純函數、唔用 RNG。
 */
import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import { getSkillDef, type SkillKind } from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import {
  SCHOOLS,
  schoolOfGear,
  schoolsOfSkill,
  type SchoolBonus,
  type SchoolDef,
  type SchoolId,
} from '@data/redesign/schools';

export const MAIN_ART_KINDS: SkillKind[] = ['external', 'internal', 'qinggong'];
export const MAIN_ART_LABEL: Record<SkillKind, string> = { external: '招式', internal: '內功', qinggong: '身法' };

export type MainArts = Partial<Record<SkillKind, string>>;

/** 已學、屬呢一類嘅武學 */
export function learnedArtsOfKind(c: LifeCharacter, kind: SkillKind): string[] {
  return c.skills.filter((id) => getSkillDef(id)?.kind === kind);
}

/**
 * 而家嘅主修：玩家揀過就用揀嗰門；未揀（或已唔識）就預設第一門學識嘅，
 * 咁舊存檔／新角色一開始都有主修，唔會因為冇揀而蝕。
 */
export function mainArts(c: LifeCharacter): MainArts {
  const out: MainArts = {};
  for (const kind of MAIN_ART_KINDS) {
    const picked = c.mainArts?.[kind];
    const learned = learnedArtsOfKind(c, kind);
    out[kind] = picked && learned.includes(picked) ? picked : learned[0];
  }
  return out;
}

/** 揀主修（要已學、類別啱）；回傳係咪有改 */
export function setMainArt(state: LifeGameState, kind: SkillKind, skillId: string): boolean {
  const c = state.character;
  if (getSkillDef(skillId)?.kind !== kind || !c.skills.includes(skillId)) return false;
  c.mainArts = { ...(c.mainArts ?? {}), [kind]: skillId };
  return true;
}

export interface SchoolTally {
  school: SchoolDef;
  /** 計咗幾多門（武學＋裝備） */
  count: number;
  /** 邊啲主修武學 id 計入 */
  arts: string[];
  /** 邊件裝備 id 計入 */
  gear: string | null;
  level: 'none' | 'minor' | 'major';
}

/** 每個流派而家計到幾多門（由多到少） */
export function schoolTally(c: LifeCharacter): SchoolTally[] {
  const mains = mainArts(c);
  const eq = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const rows = SCHOOLS.map((school) => {
    const arts = MAIN_ART_KINDS.map((k) => mains[k]).filter(
      (id): id is string => Boolean(id) && schoolsOfSkill(getSkillDef(id!)).includes(school.id),
    );
    const gear =
      [eq.weapon, eq.armor, eq.accessory].find((id) => id && schoolOfGear(getGearDef(id)) === school.id) ?? null;
    const count = Math.min(3, arts.length + (gear ? 1 : 0));
    const level: SchoolTally['level'] = count >= 3 ? 'major' : count >= 2 ? 'minor' : 'none';
    return { school, count, arts, gear, level };
  });
  return rows.sort((a, b) => b.count - a.count);
}

/** 生效中嘅流派加成總和 */
export function schoolBonusTotal(c: LifeCharacter): Required<SchoolBonus> {
  const total: Required<SchoolBonus> = {
    bleedChance: 0,
    lifesteal: 0,
    hitBonus: 0,
    attackPct: 0,
    pierce: 0,
    stunChance: 0,
    defensePct: 0,
    reflect: 0,
    evasion: 0,
  };
  for (const t of schoolTally(c)) {
    if (t.level === 'none') continue;
    const b = t.level === 'major' ? t.school.major : t.school.minor;
    for (const k of Object.keys(b) as (keyof SchoolBonus)[]) total[k] += b[k] ?? 0;
  }
  return total;
}

/** 介面用：加成講人話 */
export function describeSchoolBonus(b: SchoolBonus): string {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const parts: string[] = [];
  if (b.bleedChance) parts.push(`出血＋${pct(b.bleedChance)}`);
  if (b.lifesteal) parts.push(`吸血＋${pct(b.lifesteal)}`);
  if (b.hitBonus) parts.push(`命中＋${pct(b.hitBonus)}`);
  if (b.attackPct) parts.push(`攻擊＋${pct(b.attackPct)}`);
  if (b.pierce) parts.push(`破防＋${pct(b.pierce)}`);
  if (b.stunChance) parts.push(`暈敵＋${pct(b.stunChance)}`);
  if (b.defensePct) parts.push(`防禦＋${pct(b.defensePct)}`);
  if (b.reflect) parts.push(`反震＋${pct(b.reflect)}`);
  if (b.evasion) parts.push(`閃避＋${pct(b.evasion)}`);
  return parts.join('、');
}

export type { SchoolId };
