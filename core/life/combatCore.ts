import type { SeededRng } from '@core/random';
import {
  BASIC_STRIKE,
  GUARD_STANCE,
  CHARGE_STANCE,
  FLEE_MOVE,
  type CombatMoveDef,
  isRecoverySupportMove,
} from '@data/skills/catalog';
import type { CombatFighterState } from '@interfaces/lifeEngine';

export type CombatFighter = CombatFighterState;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function effectiveDefense(f: CombatFighter): number {
  return Math.max(0, f.defense + f.defenseMod);
}

export function tickStatus(f: CombatFighter): string[] {
  const lines: string[] = [];
  if (f.bleedTurns > 0 && f.bleedDamage > 0) {
    f.hp = clamp(f.hp - f.bleedDamage, 0, f.maxHp);
    f.bleedTurns -= 1;
    lines.push(`${f.name}血流不止，失去 ${f.bleedDamage} 點氣血。`);
    if (f.bleedTurns <= 0) f.bleedDamage = 0;
  }
  if (f.defenseMod < 0) {
    f.defenseMod = Math.min(0, f.defenseMod + 1);
  }
  return lines;
}

export function tickRegen(f: CombatFighter): void {
  f.qi = clamp(f.qi + f.qiRegen, 0, f.maxQi);
}

export function resolveOneHit(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: SeededRng,
  hitIndex: number,
  totalHits: number,
  powerMult = 1,
  extraHit = 0,
): string[] {
  const lines: string[] = [];
  const hitChance = clamp(
    0.62 +
      attacker.hitBonus +
      (move.hitBonus ?? 0) +
      extraHit -
      (defender.evasion ?? 0) -
      defender.blind -
      hitIndex * 0.04,
    0.12,
    0.95,
  );
  if (!rng.chance(hitChance)) {
    const qing =
      defender.isPlayer && (defender.evasion ?? 0) >= 0.05 ? '，借輕功錯開半寸' : '';
    lines.push(
      totalHits > 1
        ? `${attacker.name}一式「${move.name}」第${hitIndex + 1}擊——偏了。${defender.name}閃過${qing}。`
        : `${attacker.name}一式「${move.name}」——偏了。${defender.name}閃過${qing}。`,
    );
    return lines;
  }

  const pierce = clamp((move.pierce ?? 0) + (attacker.gearPierce ?? 0), 0, 0.85);
  const def = effectiveDefense(defender) * (1 - pierce);
  // 護體軟上限：防禦越高減傷比例越大，但永遠減唔盡（趨近但唔到 100%）
  const defenseMitigation = def / (def + 100);
  // 等級壓制：攻擊方武學明顯高於防守方時額外增傷，每差 10 點 +3%，最高 +30%
  const martialDiff = Math.max(0, (attacker.martial ?? 0) - (defender.martial ?? 0));
  const levelBonus = Math.min(0.3, Math.floor(martialDiff / 10) * 0.03);
  // 亂數波動：傷害 × (0.9 ~ 1.1)，取代舊有嘅加減幾點浮動
  const jitter = 0.9 + rng.nextFloat() * 0.2;
  const raw = attacker.attack * move.power * powerMult * (1 + levelBonus) * jitter;
  const mitigated = Math.max(3, Math.round(raw * (1 - defenseMitigation)));
  defender.hp = clamp(defender.hp - mitigated, 0, defender.maxHp);
  const hitLabel = mitigated >= 22 ? '重創' : '命中';
  lines.push(
    totalHits > 1
      ? `${attacker.name}一式「${move.name}」第${hitIndex + 1}擊——${hitLabel}。${defender.name}氣血 −${mitigated}。`
      : `${attacker.name}一式「${move.name}」——${hitLabel}。${defender.name}氣血 −${mitigated}。`,
  );

  const stealRate = (move.lifesteal ?? 0) + (attacker.gearLifesteal ?? 0);
  if (stealRate > 0) {
    const steal = Math.max(1, Math.round(mitigated * stealRate * (0.85 + powerMult * 0.15)));
    attacker.hp = clamp(attacker.hp + steal, 0, attacker.maxHp);
    lines.push(`${attacker.name}借力回氣，回復 ${steal} 點氣血。`);
  }

  if (defender.reflect > 0 && mitigated > 0) {
    const back = Math.max(1, Math.round(mitigated * defender.reflect));
    attacker.hp = clamp(attacker.hp - back, 0, attacker.maxHp);
    lines.push(`${defender.name}硬功反震，${attacker.name}受到 ${back} 點反震。`);
  }

  return lines;
}

export function applyRecoveryEffects(
  fighter: CombatFighter,
  move: CombatMoveDef,
  powerMult = 1,
  /** 純調息招：不要求命中 */
  force = false,
): string[] {
  const lines: string[] = [];
  const scale = 0.9 + powerMult * 0.1;

  if (move.qiSelf) {
    const gain = Math.round(move.qiSelf * scale);
    fighter.qi = clamp(fighter.qi + gain, 0, fighter.maxQi);
    lines.push(`${fighter.name}運功調息，內力回復 ${gain}。`);
  }
  if (move.healSelf && (force || (move.power ?? 0) <= 0)) {
    const heal = Math.round(move.healSelf * scale);
    fighter.hp = clamp(fighter.hp + heal, 0, fighter.maxHp);
    lines.push(`${fighter.name}順勢止血，氣血回復 ${heal}。`);
  }
  if (move.staminaSelf && fighter.stamina !== undefined && fighter.maxStamina !== undefined) {
    const gain = Math.round(move.staminaSelf * scale);
    fighter.stamina = clamp(fighter.stamina + gain, 0, fighter.maxStamina);
    lines.push(`${fighter.name}養神片刻，體力回復 ${gain}。`);
  }
  return lines;
}

export function applyOnHitEffects(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: SeededRng,
  anyHit: boolean,
  powerMult = 1,
): string[] {
  const lines: string[] = [];
  if (!anyHit) return lines;

  if (move.healSelf && (move.power ?? 0) > 0) {
    const heal = Math.round(move.healSelf * (0.9 + powerMult * 0.1));
    attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
    lines.push(`${attacker.name}順勢調息，氣血回復 ${heal}。`);
  }
  if (move.qiSelf && (move.power ?? 0) > 0) {
    const gain = Math.round(move.qiSelf * (0.9 + powerMult * 0.1));
    attacker.qi = clamp(attacker.qi + gain, 0, attacker.maxQi);
    lines.push(`${attacker.name}借勢回息，內力回復 ${gain}。`);
  }
  if (
    move.staminaSelf &&
    (move.power ?? 0) > 0 &&
    attacker.stamina !== undefined &&
    attacker.maxStamina !== undefined
  ) {
    const gain = Math.round(move.staminaSelf * (0.9 + powerMult * 0.1));
    attacker.stamina = clamp(attacker.stamina + gain, 0, attacker.maxStamina);
    lines.push(`${attacker.name}身法一緩，體力回復 ${gain}。`);
  }
  if (move.applyBlind) {
    defender.blind = Math.max(defender.blind, move.applyBlind);
    lines.push(`${defender.name}眼前一花，招式顯得滯澀。`);
  }
  if (move.qiDrain) {
    const drain = Math.round(move.qiDrain * powerMult);
    defender.qi = clamp(defender.qi - drain, 0, defender.maxQi);
    lines.push(`${defender.name}內息被擾，散去 ${drain}。`);
  }
  if (move.defenseBreak) {
    const brk = Math.round(move.defenseBreak * (0.85 + powerMult * 0.15));
    defender.defenseMod -= brk;
    lines.push(`${defender.name}架勢散亂，防禦暫降。`);
  }
  if (move.bleedChance && rng.chance(move.bleedChance)) {
    const dmg = Math.round((move.bleedDamage ?? 5) * powerMult);
    const turns = move.bleedTurns ?? 2;
    defender.bleedDamage = Math.max(defender.bleedDamage, dmg);
    defender.bleedTurns = Math.max(defender.bleedTurns, turns);
    lines.push(`${defender.name}被劃出血線，一時難止。`);
  } else if ((attacker.gearBleedChance ?? 0) > 0 && rng.chance(attacker.gearBleedChance!)) {
    const dmg = Math.round(5 * powerMult);
    defender.bleedDamage = Math.max(defender.bleedDamage, dmg);
    defender.bleedTurns = Math.max(defender.bleedTurns, 2);
    lines.push(`${defender.name}兵刃帶血，傷口難合。`);
  }
  if (move.stunChance && rng.chance(Math.min(0.55, move.stunChance * (0.9 + powerMult * 0.1)))) {
    defender.stun = Math.max(defender.stun, 1);
    lines.push(`${defender.name}穴道一滯，動作遲了半拍！`);
  }
  return lines;
}

/** 共用攻擊結算（互動戰／論劍自動戰皆走此路徑；rng 由呼叫端注入） */
export function resolveStrike(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: SeededRng,
  powerMult = 1,
  extraHit = 0,
  /** 虛實架相克倍率：克 1.25／被克 0.75／平常 1 */
  stanceMult = 1,
): string[] {
  const lines: string[] = [];
  if (move.id === GUARD_STANCE.id || move.id === CHARGE_STANCE.id || move.id === FLEE_MOVE.id) {
    return lines;
  }
  if (isRecoverySupportMove(move)) {
    if (attacker.qi < move.qiCost) {
      lines.push(`${attacker.name}內息不足，無法使出「${move.name}」。`);
      return lines;
    }
    attacker.qi -= move.qiCost;
    lines.push(...applyRecoveryEffects(attacker, move, powerMult, true));
    return lines;
  }
  if (attacker.qi < move.qiCost) {
    lines.push(`${attacker.name}內息不足，無法使出「${move.name}」，改為普通攻擊。`);
    return resolveStrike(attacker, defender, BASIC_STRIKE, rng, 1, extraHit, stanceMult);
  }
  attacker.qi -= move.qiCost;
  defender.blind = Math.max(0, defender.blind * 0.35);

  let charge = 1;
  if (attacker.chargeBonus > 0) {
    charge = 1 + attacker.chargeBonus;
    attacker.chargeBonus = 0;
    lines.push(`${attacker.name}蓄勢已久，這一擊沉猛異常！`);
  }

  const hits = Math.max(1, move.multiHit ?? 1);
  const mult = powerMult * charge * stanceMult;
  let anyHit = false;
  for (let i = 0; i < hits; i++) {
    const before = defender.hp;
    lines.push(...resolveOneHit(attacker, defender, move, rng, i, hits, mult, extraHit));
    if (defender.hp < before) anyHit = true;
    if (defender.hp <= 0) break;
  }
  lines.push(...applyOnHitEffects(attacker, defender, move, rng, anyHit, mult));
  return lines;
}
