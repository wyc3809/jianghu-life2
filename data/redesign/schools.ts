/**
 * 流派（design/agreed-design-2026-10.md §3；玩家揀「6 派・按武學特性」，2026-10-05）。
 * 招式／內功／身法各主修一門；主修武學帶嘅特性自然歸入流派，可跨門派。
 * 同一流派：2 門＝小成、3 門＝大成；穿戴中嘅裝備如屬同一流派，當多 1 門。
 * 冇放入主修嘅武學照用，只係唔計流派。
 *
 * ⚠ 歸派規則同加成數值係**測試參數**（md：流派分類、加成、平衡數值未定），玩家睇圖後可改。
 *   加成只用喺回合制交手（其他戰鬥），**唔影響演武台**。
 */
import type { SkillDef } from '@data/skills/catalog';
import type { GearDef } from '@data/equipment/catalog';

export type SchoolId = 'xueren' | 'lianhuan' | 'pojia' | 'zhidi' | 'jingang' | 'qingling';

export interface SchoolBonus {
  /** 出血機率（加落裝備出血） */
  bleedChance?: number;
  lifesteal?: number;
  hitBonus?: number;
  /** 攻擊倍率加成（0.1＝＋10%） */
  attackPct?: number;
  pierce?: number;
  /** 每擊暈眩機率 */
  stunChance?: number;
  /** 防禦倍率加成 */
  defensePct?: number;
  reflect?: number;
  evasion?: number;
}

export interface SchoolDef {
  id: SchoolId;
  name: string;
  /** 一句講清楚呢派點打 */
  blurb: string;
  /** 小成（2 門） */
  minor: SchoolBonus;
  /** 大成（3 門） */
  major: SchoolBonus;
}

export const SCHOOLS: SchoolDef[] = [
  {
    id: 'xueren',
    name: '血刃',
    blurb: '見血封喉，以傷養傷',
    minor: { bleedChance: 0.08, lifesteal: 0.04 },
    major: { bleedChance: 0.16, lifesteal: 0.08 },
  },
  {
    id: 'lianhuan',
    name: '連環',
    blurb: '招招相連，快過對手',
    minor: { hitBonus: 0.05, attackPct: 0.05 },
    major: { hitBonus: 0.1, attackPct: 0.12 },
  },
  {
    id: 'pojia',
    name: '破甲',
    blurb: '專破硬殼，首領剋星',
    minor: { pierce: 0.1 },
    major: { pierce: 0.2, attackPct: 0.05 },
  },
  {
    id: 'zhidi',
    name: '制敵',
    blurb: '點穴封脈，叫敵出不得手',
    minor: { stunChance: 0.08 },
    major: { stunChance: 0.15, hitBonus: 0.05 },
  },
  {
    id: 'jingang',
    name: '金剛',
    blurb: '銅皮鐵骨，以守為攻',
    minor: { defensePct: 0.15, reflect: 0.05 },
    major: { defensePct: 0.3, reflect: 0.1 },
  },
  {
    id: 'qingling',
    name: '輕靈',
    blurb: '身似飄絮，避實擊虛',
    minor: { evasion: 0.05 },
    major: { evasion: 0.1, hitBonus: 0.05 },
  },
];

/** 武學歸派（可屬多派）：按招式／被動特性 */
export function schoolsOfSkill(def: SkillDef | undefined): SchoolId[] {
  if (!def) return [];
  const out = new Set<SchoolId>();
  const m = def.move;
  const p = def.passive ?? {};
  if (def.kind === 'external' && m) {
    if ((m.bleedChance ?? 0) > 0 || (m.lifesteal ?? 0) > 0) out.add('xueren');
    if ((m.multiHit ?? 0) > 1) out.add('lianhuan');
    if ((m.pierce ?? 0) > 0 || (m.defenseBreak ?? 0) > 0) out.add('pojia');
    if ((m.stunChance ?? 0) > 0 || (m.applyBlind ?? 0) > 0 || (m.qiDrain ?? 0) > 0) out.add('zhidi');
    if ((m.healSelf ?? 0) > 0) out.add('jingang');
    if (!out.size && (m.hitBonus ?? 0) > 0) out.add('qingling');
  } else {
    if ((p.attack ?? 0) > 0) {
      out.add('xueren');
      out.add('pojia');
    }
    if ((p.defense ?? 0) > 0 || (p.reflect ?? 0) > 0 || (p.maxHp ?? 0) > 0) out.add('jingang');
    if ((p.maxQi ?? 0) > 0) out.add('zhidi');
    if ((p.qiRegen ?? 0) > 0) out.add('lianhuan');
    if ((p.evasionBonus ?? 0) > 0) out.add('qingling');
    if ((p.hitBonus ?? 0) > 0) {
      out.add('lianhuan');
      if (def.kind === 'qinggong') out.add('pojia');
    }
  }
  return [...out];
}

/** 裝備流派（最多一派）：按裝備特效 */
export function schoolOfGear(def: GearDef | undefined): SchoolId | null {
  if (!def) return null;
  const cb = def.combat ?? {};
  if (def.special?.kind === 'stun_proc') return 'zhidi';
  if ((cb.bleedChance ?? 0) > 0 || (cb.lifesteal ?? 0) > 0) return 'xueren';
  if ((cb.pierce ?? 0) > 0) return 'pojia';
  if ((cb.reflect ?? 0) > 0) return 'jingang';
  if ((cb.evasion ?? 0) > 0) return 'qingling';
  if ((cb.hitBonus ?? 0) > 0) return 'lianhuan';
  return null;
}
