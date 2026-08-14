/**
 * 交手水墨特效：由 HP／內力差分與戰報句推導短命旁註。
 * 視覺約束見 design/gdd/combat-ink-fx.md · STYLE-BIBLE
 */
import type { PendingCombat } from '@interfaces/lifeEngine';
import type { MoveStance } from './moveStance';
import { MOVE_STANCE_LABEL } from './moveStance';
import { classifyBeat } from './combatPresentation';

export type InkCombatFxKind =
  | 'hp'
  | 'qi'
  | 'miss'
  | 'crit'
  | 'guard'
  | 'heal'
  | 'move'
  | 'danger';

export type InkCombatFxSide = 'player' | 'foe' | 'center';

export type InkCombatFx = {
  id: string;
  kind: InkCombatFxKind;
  text: string;
  side: InkCombatFxSide;
  stance?: MoveStance;
};

export type CombatVitalsSnap = {
  playerHp: number;
  playerQi: number;
  foeHp: number;
  turn: number;
  logLen: number;
};

export function snapCombatVitals(combat: PendingCombat): CombatVitalsSnap {
  return {
    playerHp: combat.player.hp,
    playerQi: combat.player.qi,
    foeHp: combat.foe.hp,
    turn: combat.turn,
    logLen: combat.log.length,
  };
}

function roundDelta(n: number): number {
  const r = Math.round(Math.abs(n));
  return r < 1 && Math.abs(n) > 0.05 ? 1 : r;
}

let fxSeq = 0;
function nextId(prefix: string): string {
  fxSeq += 1;
  return `${prefix}-${fxSeq}-${Date.now()}`;
}

/** 自 vitals 差分＋最近戰報句產生本回合特效（上限 4，免牆） */
export function buildCombatInkFx(opts: {
  prev: CombatVitalsSnap | null;
  next: PendingCombat;
  moveName?: string;
  stance?: MoveStance;
}): InkCombatFx[] {
  const { prev, next, moveName, stance } = opts;
  const out: InkCombatFx[] = [];

  if (moveName) {
    out.push({
      id: nextId('move'),
      kind: 'move',
      text: stance ? `${MOVE_STANCE_LABEL[stance]}·${moveName}` : moveName,
      side: 'center',
      stance,
    });
  }

  if (!prev) return out.slice(0, 4);

  const foeDmg = prev.foeHp - next.foe.hp;
  const playerDmg = prev.playerHp - next.player.hp;
  const qiLost = prev.playerQi - next.player.qi;
  const qiGain = next.player.qi - prev.playerQi;

  const recent = next.log.slice(prev.logLen);
  const kinds = recent.map(classifyBeat);
  const hasCrit = kinds.includes('crit');
  const hasMiss = kinds.includes('miss');
  const hasHeal = kinds.includes('heal');
  const hasGuard = recent.some((l) => /架|格|擋|守中|卸力|收招/.test(l));

  if (foeDmg > 0.05) {
    out.push({
      id: nextId('foe-hp'),
      kind: hasCrit ? 'crit' : 'hp',
      text: hasCrit ? `危 · 氣血 −${roundDelta(foeDmg)}` : `氣血 −${roundDelta(foeDmg)}`,
      side: 'foe',
      stance,
    });
  } else if (hasMiss && moveName) {
    out.push({
      id: nextId('miss'),
      kind: 'miss',
      text: '落空',
      side: 'foe',
      stance,
    });
  }

  if (playerDmg > 0.05) {
    const severe = playerDmg / Math.max(1, next.player.maxHp) >= 0.18 || hasCrit;
    out.push({
      id: nextId('pl-hp'),
      kind: severe ? 'danger' : 'hp',
      text: severe ? `傷 · 氣血 −${roundDelta(playerDmg)}` : `氣血 −${roundDelta(playerDmg)}`,
      side: 'player',
    });
  }

  if (qiLost > 0.05) {
    out.push({
      id: nextId('qi'),
      kind: 'qi',
      text: `內力 −${roundDelta(qiLost)}`,
      side: 'player',
    });
  } else if (qiGain > 0.05 || hasHeal) {
    out.push({
      id: nextId('heal'),
      kind: 'heal',
      text: qiGain > 0.05 ? `息 · 內力 ＋${roundDelta(qiGain)}` : '息',
      side: 'player',
    });
  }

  if (hasGuard && !out.some((f) => f.kind === 'guard')) {
    out.push({
      id: nextId('guard'),
      kind: 'guard',
      text: '架住',
      side: 'center',
      stance: stance ?? 'jia',
    });
  }

  // 同屏最多 4 條；招名優先保留
  const move = out.filter((f) => f.kind === 'move');
  const rest = out.filter((f) => f.kind !== 'move');
  return [...move, ...rest].slice(0, 4);
}

export function combatFxNeedsShock(fx: InkCombatFx[]): boolean {
  return fx.some((f) => f.kind === 'crit' || f.kind === 'danger');
}
