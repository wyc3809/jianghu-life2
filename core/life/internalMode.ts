/**
 * 內功運轉模式：戰鬥中可主動切換嘅內功狀態，每回合消耗真氣維持。
 *
 * 底層仍以 guixi／huxiao／hexian／shepan 四套效果範本運作（數值不變）；
 * 但顯示畀玩家嘅選項改為按角色實際習得嘅內功武學動態匹配——
 * 顯示真實功法名，範本只決定其戰鬥效果應歸邊種風格。
 * 冇習得任何專精內功者，只得「基本內功」一項，冇特別效果。
 */
import type { CombatFighterState } from '@interfaces/lifeEngine';
import type { SeededRng } from '@core/random';
import { getSkillDef, type InternalPassive } from '@data/skills/catalog';

export interface InternalModeDef {
  id: string;
  name: string;
  description: string;
  /** 每回合維持消耗真氣 */
  qiCostPerTurn: number;
  effects: {
    attackMult?: number;
    defenseMult?: number;
    evasionBonus?: number;
    qiRegenBonus?: number;
    reflectBonus?: number;
    lifestealBonus?: number;
    damageTakenMult?: number;
  };
}

export const INTERNAL_MODES: InternalModeDef[] = [
  {
    id: 'guixi',
    name: '龜息',
    description: '氣沉丹田，護體如龜殼，攻勢減緩',
    qiCostPerTurn: 4,
    effects: { defenseMult: 1.5, damageTakenMult: 0.6, qiRegenBonus: 0.5, attackMult: 0.7 },
  },
  {
    id: 'huxiao',
    name: '虎嘯',
    description: '真氣爆發，勢如猛虎，消耗加劇',
    qiCostPerTurn: 8,
    effects: { attackMult: 1.4, lifestealBonus: 0.15, damageTakenMult: 1.15 },
  },
  {
    id: 'hexian',
    name: '鶴翔',
    description: '身輕如鶴，閃轉騰挪，招式更靈動',
    qiCostPerTurn: 5,
    effects: { evasionBonus: 0.15, qiRegenBonus: 0.2 },
  },
  {
    id: 'shepan',
    name: '蛇盤',
    description: '陰勁纏繞，每次出手疊加劇毒，五重而爆',
    qiCostPerTurn: 6,
    effects: { attackMult: 0.9, lifestealBonus: 0.1 },
  },
];

/** 未習得任何專精內功時嘅預設選項：id 特殊，冇效果、冇耗損 */
export const BASIC_INTERNAL_MODE_ID = 'basic';

export const BASIC_INTERNAL_MODE: InternalModeDef = {
  id: BASIC_INTERNAL_MODE_ID,
  name: '基本內功',
  description: '尚未習得專精內功心法，僅得基礎吐納打底，運轉並無特別效果。',
  qiCostPerTurn: 0,
  effects: {},
};

const ALL_MODE_DEFS: InternalModeDef[] = [...INTERNAL_MODES, BASIC_INTERNAL_MODE];

/** 基礎／佔位內功 id：唔計入「已習得專精內功」判斷 */
const BASELINE_INTERNAL_SKILL_IDS = new Set(['基礎吐納', 'skill_breath', 'skill_internal']);

export function getInternalMode(id: string | null | undefined): InternalModeDef | null {
  if (!id) return null;
  return ALL_MODE_DEFS.find((m) => m.id === id) ?? null;
}

/** 按內功被動嘅屬性傾向，歸類去邊套效果範本（guixi 防／huxiao 攻／hexian 靈／shepan 陰毒兜底） */
function classifyInternalPassive(passive: InternalPassive): InternalModeDef['id'] {
  const defenseScore = (passive.defense ?? 0) * 2 + (passive.maxHp ?? 0) * 0.3 + (passive.reflect ?? 0) * 40;
  const attackScore = (passive.attack ?? 0) * 3;
  const agileScore = (passive.evasionBonus ?? 0) * 200 + (passive.hitBonus ?? 0) * 80;
  const scores: [string, number][] = [
    ['guixi', defenseScore],
    ['huxiao', attackScore],
    ['hexian', agileScore],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  if (scores[0]![1] <= 0) return 'shepan';
  return scores[0]![0]!;
}

/** 粗略估算內功被動嘅「份量」，同一範本有多個候選時取最強一門 */
function passiveMagnitude(p: InternalPassive): number {
  return (
    (p.attack ?? 0) +
    (p.defense ?? 0) +
    (p.maxHp ?? 0) * 0.1 +
    (p.maxQi ?? 0) * 0.1 +
    (p.qiRegen ?? 0) +
    (p.hitBonus ?? 0) * 100 +
    (p.reflect ?? 0) * 100 +
    (p.evasionBonus ?? 0) * 100
  );
}

/**
 * 按角色實際習得嘅內功武學，解析出可運轉嘅內功選項（顯示真實功法名）。
 * 冇任何專精內功（只得基礎吐納一類）時，回傳單一「基本內功」選項。
 */
export function resolveInternalModeOptions(skillIds: string[]): InternalModeDef[] {
  const bestByArchetype = new Map<
    string,
    { name: string; description: string; magnitude: number }
  >();
  for (const id of skillIds) {
    if (BASELINE_INTERNAL_SKILL_IDS.has(id)) continue;
    const def = getSkillDef(id);
    if (!def || def.kind !== 'internal' || !def.passive) continue;
    const archetype = classifyInternalPassive(def.passive);
    const magnitude = passiveMagnitude(def.passive);
    const existing = bestByArchetype.get(archetype);
    if (!existing || magnitude > existing.magnitude) {
      bestByArchetype.set(archetype, {
        name: def.name,
        description: def.flavor ?? `運起「${def.name}」心法。`,
        magnitude,
      });
    }
  }
  if (bestByArchetype.size === 0) return [BASIC_INTERNAL_MODE];
  const options: InternalModeDef[] = [];
  for (const template of INTERNAL_MODES) {
    const match = bestByArchetype.get(template.id);
    if (!match) continue;
    options.push({ ...template, name: match.name, description: match.description });
  }
  return options;
}

export function modeAttackMult(modeId: string | null | undefined): number {
  return getInternalMode(modeId)?.effects.attackMult ?? 1;
}

export function modeDefenseMult(modeId: string | null | undefined): number {
  return getInternalMode(modeId)?.effects.defenseMult ?? 1;
}

export function modeEvasionBonus(modeId: string | null | undefined): number {
  return getInternalMode(modeId)?.effects.evasionBonus ?? 0;
}

export function modeDamageTakenMult(modeId: string | null | undefined): number {
  return getInternalMode(modeId)?.effects.damageTakenMult ?? 1;
}

export function modeLifestealBonus(modeId: string | null | undefined): number {
  return getInternalMode(modeId)?.effects.lifestealBonus ?? 0;
}

export function modeReflectBonus(modeId: string | null | undefined): number {
  return getInternalMode(modeId)?.effects.reflectBonus ?? 0;
}

/** 回合開始時扣除模式維持費；真氣不足時運轉中斷 */
export function tickInternalMode(fighter: CombatFighterState, rng: SeededRng): string[] {
  const lines: string[] = [];
  const mode = getInternalMode(fighter.internalMode);
  if (!mode || mode.qiCostPerTurn <= 0) return lines;
  if (fighter.qi < mode.qiCostPerTurn) {
    lines.push(`${fighter.name} 內息不足以維持「${mode.name}」，運轉中斷。`);
    fighter.internalMode = null;
    return lines;
  }
  fighter.qi -= mode.qiCostPerTurn;
  const qiGainBonus = mode.effects.qiRegenBonus ? Math.round(mode.effects.qiRegenBonus * 10) : 0;
  if (qiGainBonus > 0) {
    fighter.qi = Math.min(fighter.maxQi, fighter.qi + qiGainBonus);
  }
  lines.push(`${fighter.name}「${mode.name}」運轉中，內力 −${mode.qiCostPerTurn}。`);
  void rng;
  return lines;
}

/** 蛇盤疊毒：每次出手加一層，五層爆發劇毒傷害 */
export function applySnakeVenom(
  attacker: CombatFighterState,
  defender: CombatFighterState,
): string[] {
  const lines: string[] = [];
  if (attacker.internalMode !== 'shepan') return lines;
  const stacks = (attacker.venomStacks ?? 0) + 1;
  if (stacks >= 5) {
    const poisonDmg = Math.max(1, Math.round(attacker.attack * 0.8));
    defender.hp = Math.max(0, defender.hp - poisonDmg);
    lines.push(`${attacker.name}蛇盤陰勁爆發，劇毒蝕骨！${defender.name}氣血 −${poisonDmg}。`);
    attacker.venomStacks = 0;
  } else {
    attacker.venomStacks = stacks;
    lines.push(`${attacker.name}陰勁纏繞，毒勢漸深（${stacks}/5）。`);
  }
  return lines;
}
