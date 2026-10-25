/** 交手、論劍及多人共用的整門連招、換門、調息及回內規則。 */
import type { LifeCharacter, CombatFighterState } from '@interfaces/lifeEngine';
import { BASIC_STRIKE, REST_QI_MOVE, getSkillDef, sumInternalPassives, type CombatMoveDef } from '@data/skills/catalog';
import { artVolumeMoves } from '@data/skills/volumes';
import { MANUAL_STAR_BONUS } from '@data/redesign/testParams';
import { INTERNAL_PERCENT_REGEN, MEDITATE_QI_RATIO } from '@data/redesign/martialEconomyParams';
import { autoBattleRotation, ownedVolumes } from './volumes';
import { equippedMartialArts, supportMartialSlots } from './martialLoadout';
import { rankPowerMult } from './martialRanks';
import { clamp, tickStatus, tickRegen, consumeStun, resolveStrike } from './combatCore';
import type { SeededRng } from '@core/random';
import { getGearDef } from '@data/equipment/catalog';
import { weaponSynergyForLoadout } from './weaponMastery';
import { applyGearSpecialOnHit, tryGearRevive } from './gearSpecialEffects';

export interface MartialTurnMove { skillId?: string; vol?: number; move: CombatMoveDef }
export interface MartialTurnPlan { kind: 'art' | 'meditate' | 'basic'; cost: number; moves: MartialTurnMove[] }

/** 已裝備內功的回內；百分比內功取代該門固定回內，避免重複加同一效果。 */
export function internalQiRegen(c: LifeCharacter): { flat: number; percent: number } {
  const id = supportMartialSlots(c).internal;
  const percent = id ? INTERNAL_PERCENT_REGEN[id] ?? 0 : 0;
  const scale = id ? rankPowerMult(c.skillRanks[id] ?? 0) * (1 + (c.manualStars?.[id] ?? 0) * MANUAL_STAR_BONUS) : 1;
  return { flat: percent ? 0 : sumInternalPassives(equippedMartialArts(c), c.skillRanks, c.manualStars).qiRegen ?? 0, percent: percent * scale };
}

/** 每門起手成本沿用該門卷一數值，不隨已學卷數或段數增長。 */
export function martialTurnPlan(c: LifeCharacter, qi: number, round: number, maxQi: number): MartialTurnPlan {
  const rotation = autoBattleRotation(c);
  for (let step = 0; step < rotation.length; step++) {
    const id = rotation[(Math.max(1, round) - 1 + step) % rotation.length]!;
    const cost = getSkillDef(id)?.move?.qiCost ?? 0;
    if (qi + 1e-8 < cost) continue;
    const stars = 1 + (c.manualStars?.[id] ?? 0) * MANUAL_STAR_BONUS;
    return { kind: 'art', cost, moves: ownedVolumes(c,id).map(vol => ({ skillId: id, vol,
      move: { ...artVolumeMoves(id)[vol - 1]!, qiCost: 0, power: artVolumeMoves(id)[vol - 1]!.power * stars } })) };
  }
  if (!rotation.length) return { kind: 'basic', cost: 0, moves: [{ move: BASIC_STRIKE }] };
  return { kind: 'meditate', cost: 0, moves: [{ move: { ...REST_QI_MOVE, name: '調息', qiCost: 0, qiSelf: maxQi * MEDITATE_QI_RATIO } }] };
}

/** 一次正常行動；快照已決定，演出／跳過不得再呼叫發獎。 */
export function resolveMartialTurn(actor: CombatFighterState, target: CombatFighterState, c: LifeCharacter, round: number, rng: SeededRng) {
  const lines = tickStatus(actor);
  const hits: { moveName: string; skillId?: string; vol?: number; damage: number; actorHp: number; targetHp: number }[] = [];
  tickRegen(actor);
  if (actor.hp <= 0) {
    lines.push(...tryGearRevive(actor));
    if(actor.hp<=0){hits.push({moveName:'流血',damage:0,actorHp:actor.hp,targetHp:target.hp});return {lines,hits};}
  }
  if (consumeStun(actor)) {
    lines.push(`${actor.name}穴道受制，暫停一次行動。`);
    hits.push({ moveName: '穴道受制', damage: 0, actorHp: actor.hp, targetHp: target.hp });
    return { lines, hits };
  }
  const plan = martialTurnPlan(c, actor.qi, round, actor.maxQi);
  actor.qi = clamp(actor.qi - plan.cost, 0, actor.maxQi);
  for (const item of plan.moves) {
    if (actor.hp <= 0 || target.hp <= 0) break;
    const before = target.hp;
    const def = item.skillId ? getSkillDef(item.skillId) : undefined;
    const weapon = c.equipment.weapon ? getGearDef(c.equipment.weapon) : undefined;
    const synergy = def?.weaponKind ? weaponSynergyForLoadout(weapon?.weaponKind, def.weaponKind, 0) : { power: 1, hit: 0 };
    lines.push(...resolveStrike(actor, target, item.move, rng, (item.skillId ? rankPowerMult(c.skillRanks[item.skillId] ?? 0) : 1) * synergy.power, synergy.hit));
    if (target.hp < before) lines.push(...applyGearSpecialOnHit(actor, target, rng));
    if (actor.hp <= 0) lines.push(...tryGearRevive(actor));
    if (target.hp <= 0) lines.push(...tryGearRevive(target));
    hits.push({ moveName: item.move.name, skillId: item.skillId, vol: item.vol,
      damage: Math.max(0, before - target.hp), actorHp: actor.hp, targetHp: target.hp });
  }
  actor.stunProtected = false;
  return { lines, hits };
}
