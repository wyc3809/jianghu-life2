/**
 * 內功運轉模式：戰鬥中可主動切換嘅內功狀態，每回合消耗真氣維持。
 */
import type { CombatFighterState } from '@interfaces/lifeEngine';
import type { SeededRng } from '@core/random';

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

export function getInternalMode(id: string | null | undefined): InternalModeDef | null {
  if (!id) return null;
  return INTERNAL_MODES.find((m) => m.id === id) ?? null;
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
  if (!mode) return lines;
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
