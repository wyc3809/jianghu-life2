/**
 * 部位傷勢嘅純讀取函數（無副作用、無 RNG），畀戰鬥、裝備上限、修煉讀懲罰。
 * 獨立成檔，避免 equipment.ts ↔ injuries.ts 循環引用。
 */
import type { InjuryPart, LifeCharacter, LifeInjury } from '@interfaces/lifeEngine';
import { ARM_PENALTY, HEAD_PENALTY, LEG_EVASION, LEG_STAMINA, TORSO_PENALTY } from '@data/injuries/tuning';

/** 角色某部位嘅傷（每部位最多一條） */
export function injuryAt(c: Pick<LifeCharacter, 'injuries'>, part: InjuryPart): LifeInjury | undefined {
  return c.injuries?.find((x) => x.part === part);
}

/** 手臂傷：攻擊倍率（1＝無傷） */
export function armAttackFactor(c: Pick<LifeCharacter, 'injuries'>): number {
  const inj = injuryAt(c, 'arm');
  return inj ? 1 - ARM_PENALTY[inj.tier] : 1;
}

/** 軀幹傷：氣血上限倍率 */
export function torsoHpFactor(c: Pick<LifeCharacter, 'injuries'>): number {
  const inj = injuryAt(c, 'torso');
  return inj ? 1 - TORSO_PENALTY[inj.tier] : 1;
}

/** 頭部傷：修煉／領悟進度倍率 */
export function headProgressFactor(c: Pick<LifeCharacter, 'injuries'>): number {
  const inj = injuryAt(c, 'head');
  return inj ? 1 - HEAD_PENALTY[inj.tier] : 1;
}

/** 腿腳傷：閃避扣減（絕對值） */
export function legEvasionPenalty(c: Pick<LifeCharacter, 'injuries'>): number {
  const inj = injuryAt(c, 'leg');
  return inj ? LEG_EVASION[inj.tier] : 0;
}

/** 腿腳傷：每月精力扣減 */
export function legStaminaDrain(c: Pick<LifeCharacter, 'injuries'>): number {
  const inj = injuryAt(c, 'leg');
  return inj ? LEG_STAMINA[inj.tier] : 0;
}

/** 傷勢對能力嘅一句說明（人物欄用） */
export function injuryEffectText(inj: LifeInjury): string {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  switch (inj.part) {
    case 'head':
      return `修煉進度 −${pct(HEAD_PENALTY[inj.tier])}`;
    case 'torso':
      return `氣血上限 −${pct(TORSO_PENALTY[inj.tier])}`;
    case 'arm':
      return `出手 −${pct(ARM_PENALTY[inj.tier])}`;
    case 'leg':
      return `閃避 −${pct(LEG_EVASION[inj.tier])}・每月精力 −${LEG_STAMINA[inj.tier]}`;
  }
}
