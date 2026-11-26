import type { SparOpening, SparWeakness } from '@data/foes/sparWeaknesses';
import { canonicalSkillId, getSkillDef, type CombatMoveDef } from '@data/skills/catalog';
import { resolveMoveStance } from './moveStance';

export function sparWeaknessIsOpen(weakness: SparWeakness, hpRatio: number, charging: boolean): boolean {
  return (!weakness.when || (weakness.when === 'wounded' ? hpRatio <= 0.5 : charging));
}

function matches(opening: SparOpening, move: CombatMoveDef, artId: string | undefined): boolean {
  switch (opening.kind) {
    case 'weapon': {
      const art = artId ? getSkillDef(artId) : undefined;
      return art?.kind === 'external' && (art.weaponKind ?? 'unarmed') === opening.weapon;
    }
    case 'pierce': return (move.pierce ?? 0) > 0;
    case 'multiHit': return (move.multiHit ?? 1) > 1;
    case 'heavy': return move.power >= 1.45;
    case 'feint': return resolveMoveStance(move) === 'xu';
    case 'blind': return (move.applyBlind ?? 0) > 0;
    case 'defenseBreak': return (move.defenseBreak ?? 0) > 0;
    case 'stun': return (move.stunChance ?? 0) > 0;
    case 'drain': return (move.qiDrain ?? 0) > 0;
  }
}

export function sparWeaknessDamageMult(weakness: SparWeakness, move: CombatMoveDef, artId: string | undefined): number {
  const preferredArt = artId && 'art' in weakness && canonicalSkillId(artId) === weakness.art;
  if (weakness.kind === 'bleed') return preferredArt ? 1.25 : 1;
  if (weakness.kind === 'art') {
    if (preferredArt) return 1.5;
    return matches(weakness.fallback, move, artId) ? 1.2 : 1;
  }
  return matches(weakness, move, artId) ? 1.35 : 1;
}
