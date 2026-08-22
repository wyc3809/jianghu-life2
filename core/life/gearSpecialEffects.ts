/**
 * 紫（epic）以上裝備嘅獨特效果——戰鬥中實際觸發嘅邏輯。
 * 資料定義見 data/equipment/catalog.ts 嘅 GearSpecialEffect；呢度只按 kind 分派。
 */
import type { CombatFighterState, CombatGearSpecial } from '@interfaces/lifeEngine';
import type { SeededRng } from '@core/random';

/** 命中後觸發嘅裝備特效（burst／stun_proc）；revive 唔喺呢度處理，見 tryGearRevive */
export function applyGearSpecialOnHit(
  attacker: CombatFighterState,
  defender: CombatFighterState,
  rng: SeededRng,
): string[] {
  const lines: string[] = [];
  const specials = attacker.gearSpecials ?? [];
  for (const special of specials) {
    if (special.kind === 'burst') {
      if (!rng.chance(special.chance ?? 0)) continue;
      const extra = Math.max(1, Math.round(attacker.attack * (special.power ?? 0.5)));
      defender.hp = Math.max(0, defender.hp - extra);
      lines.push(`${attacker.name}「${special.name}」發動，追加 ${extra} 點傷害！`);
    } else if (special.kind === 'stun_proc') {
      if (!rng.chance(special.chance ?? 0)) continue;
      defender.stun = Math.max(defender.stun, 1);
      lines.push(`${attacker.name}「${special.name}」發動，${defender.name}穴道一滯！`);
    }
  }
  return lines;
}

/** 氣血跌至 0 時檢查有冇未用過嘅復活特效（一場戰鬥限一次） */
export function tryGearRevive(fighter: CombatFighterState): string[] {
  if (fighter.hp > 0 || fighter.usedGearRevive) return [];
  const revive = (fighter.gearSpecials ?? []).find(
    (s): s is CombatGearSpecial & { kind: 'revive' } => s.kind === 'revive',
  );
  if (!revive) return [];
  fighter.usedGearRevive = true;
  fighter.hp = Math.max(1, Math.round(fighter.maxHp * (revive.power ?? 0.3)));
  return [`${fighter.name}「${revive.name}」發動，於氣血將盡之際保住一命！`];
}
