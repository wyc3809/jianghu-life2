/**
 * 距離系統：戰鬥雙方可拉近／拉開，影響招式可用性同傷害倍率。
 */
import type { CombatMoveDef } from '@data/skills/catalog';
import { combatMoveRole } from '@data/skills/catalog';

export type CombatDistance = 'close' | 'mid' | 'far';

export const DISTANCE_LABEL: Record<CombatDistance, string> = {
  close: '近身',
  mid: '中距',
  far: '遠距',
};

/**
 * 招式預設射程（未在招式上明示 range 時推斷）。
 * 招式名／id 嘅兵器提示（拳掌／劍刃／暗器等）比機制分類（combatMoveRole）
 * 更能反映實際交手距離，所以先按名稱推斷，機制分類只做最後備援。
 */
export function inferMoveRange(move: CombatMoveDef): CombatDistance | 'any' {
  if (move.range) return move.range;
  if (move.id === 'basic_strike') return 'any';
  if (/palm|fist|拳|掌/.test(move.id) || /palm|fist|拳|掌/.test(move.name)) return 'close';
  if (/sword|blade|劍|刀/.test(move.id) || /劍|刀/.test(move.name)) return 'mid';
  if (/hidden|dart|needle|暗器|針/.test(move.id) || /暗器|針/.test(move.name)) return 'far';
  if (/qi_blast|palm_wind|風/.test(move.id)) return 'far';
  const role = combatMoveRole(move);
  if (role === '守' || role === '蓄' || role === '遁' || role === '巧') return 'any';
  if (role === '耗') return 'far';
  if (role === '連' || role === '破' || role === '殺' || role === '控') return 'mid';
  return 'any';
}

/** 檢查招式在當前距離是否可用（close/far 招式喺 mid 都可用，但打折） */
export function isMoveAvailableAtDistance(move: CombatMoveDef, distance: CombatDistance): boolean {
  const range = inferMoveRange(move);
  if (range === 'any' || range === distance) return true;
  if (range === 'close' && distance === 'mid') return true;
  if (range === 'far' && distance === 'mid') return true;
  return false;
}

/** 距離對傷害的影響倍率 */
export function distanceDamageMult(move: CombatMoveDef, distance: CombatDistance): number {
  const range = inferMoveRange(move);
  if (range === 'any') return 1;
  if (range === distance) {
    if (distance === 'close') {
      const role = combatMoveRole(move);
      if (role === '普' || move.id.includes('palm') || move.id.includes('fist')) return 1.2;
    }
    if (distance === 'far') {
      const role = combatMoveRole(move);
      if (role === '耗' || move.id.includes('hidden') || move.id.includes('dart')) return 1.3;
    }
    return 1;
  }
  if ((range === 'close' && distance === 'mid') || (range === 'far' && distance === 'mid')) return 0.85;
  if (range === 'close' && distance === 'far') return 0.5;
  if (range === 'far' && distance === 'close') return 0.4;
  return 1;
}

/** 改變距離：近身／拉開各推移一檔（close ↔ mid ↔ far） */
export function changeDistance(current: CombatDistance, direction: 'close' | 'far'): CombatDistance {
  if (direction === 'close') return current === 'far' ? 'mid' : 'close';
  return current === 'close' ? 'mid' : 'far';
}
