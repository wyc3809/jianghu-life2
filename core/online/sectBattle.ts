import { createRng, type SeededRng } from '../random';
import type { CombatFighterState, LifeCharacter } from '@interfaces/lifeEngine';
import type { SectBattleEntrant, SectBattleEvent, SectBattleFigure, SectBattleFrame, SectBattleReplay, SectBattleSide } from '@interfaces/sectBattle';
import { SECT_BATTLE_TEST as P } from '@data/redesign/sectBattleTestParams';
import { getGearDef } from '@data/equipment/catalog';
import { getSkillDef } from '@data/skills/catalog';
import { buildPlayerFighter } from '../life/combat';
import { characterForPreset } from '../life/loadoutPresets';
import { martialTurnPlan, type MartialTurnPlan } from '../life/martialTurn';
import { clamp, consumeStun, resolveStrike, tickRegen, tickStatus } from '../life/combatCore';
import { applyGearSpecialOnHit, tryGearRevive } from '../life/gearSpecialEffects';
import { rankPowerMult } from '../life/martialRanks';
import { weaponSynergyForLoadout } from '../life/weaponMastery';

interface Unit {
  id: string; side: SectBattleSide; rank: number; c: LifeCharacter; f: CombatFighterState;
  x: number; y: number; face: number; target: string | null; art: string;
  ready: number; turn: number; hurtAt: number; downAt: number | null; moving: boolean;
  cast: { plan: MartialTurnPlan; index: number; next: number; started: number; target: string } | null;
}
const dist = (a: Unit, b: Unit) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.2);
const ranged = (id: string) => /needle|dart|bow/.test(id);
const splash = (id: string) => /palm|fist/.test(id);

/** 全部真人快照必須唯一，兩派各十席；缺席處理未定，不用虛構NPC補位。 */
export function validateSectBattleRoster(roster: readonly SectBattleEntrant[]): void {
  if (roster.length !== P.teamSize * 2 || new Set(roster.map(u => u.id)).size !== roster.length) throw new Error('兩派須各有十名不同代表。');
  for (const side of [0, 1]) {
    const seats = roster.filter(u => u.side === side);
    if (seats.length !== P.teamSize || new Set(seats.map(u => u.rank)).size !== P.teamSize
      || seats.some(u => !Number.isInteger(u.rank) || u.rank < 1 || u.rank > P.teamSize)) throw new Error('代表席位須由一至十且不重複。');
  }
  if (roster.some(u => !u.id || !u.state.character.alive || u.state.phase !== 'playing')) throw new Error('代表人物狀態無效。');
}

function makeUnits(roster: readonly SectBattleEntrant[]): Unit[] {
  return [...roster].sort((a, b) => a.side - b.side || a.rank - b.rank).map(input => {
    const state = structuredClone(input.state);
    state.character = characterForPreset(state.character, 'duel');
    const c = state.character, f = buildPlayerFighter(state), row = (input.rank - 1) % 5, column = Math.floor((input.rank - 1) / 5);
    const art = martialTurnPlan(c, f.qi, 1, f.maxQi).moves[0]?.skillId ?? 'art_river_fist';
    return { id: input.id, side: input.side, rank: input.rank, c, f,
      x: input.side === 0 ? 100 + column * 140 : 900 - column * 140,
      y: 94 + row * 104 + column * 18, face: input.side === 0 ? 1 : -1,
      target: null, art, ready: .35 + input.rank * .045, turn: 0, hurtAt: -99,
      downAt: null, moving: false, cast: null };
  });
}

function chooseTarget(actor: Unit, units: Unit[]): Unit | null {
  let best: Unit | null = null, score = Infinity;
  for (const enemy of units) {
    if (enemy.side === actor.side || enemy.f.hp <= 0) continue;
    const focus = units.filter(u => u.side === actor.side && u.f.hp > 0 && u.target === enemy.id && u !== actor).length;
    const value = dist(actor, enemy) + focus * 26;
    if (value < score) { score = value; best = enemy; }
  }
  return best;
}

function startTurn(u: Unit, target: Unit, now: number): void {
  tickStatus(u.f); tickRegen(u.f);
  if (u.f.hp <= 0) { tryGearRevive(u.f); if (u.f.hp <= 0) return; }
  if (consumeStun(u.f)) { u.ready = now + .8; u.hurtAt = now; return; }
  const plan = martialTurnPlan(u.c, u.f.qi, ++u.turn, u.f.maxQi);
  u.f.qi = clamp(u.f.qi - plan.cost, 0, u.f.maxQi);
  u.art = plan.moves[0]?.skillId ?? u.art;
  u.cast = { plan, index: 0, next: now + P.windup, started: now, target: target.id };
}

function strike(u: Unit, target: Unit, move: MartialTurnPlan['moves'][number], now: number, rng: SeededRng, secondary: boolean): SectBattleEvent {
  const before = target.f.hp, def = move.skillId ? getSkillDef(move.skillId) : undefined;
  const weapon = u.c.equipment.weapon ? getGearDef(u.c.equipment.weapon) : undefined;
  const synergy = def?.weaponKind ? weaponSynergyForLoadout(weapon?.weaponKind, def.weaponKind, 0) : { power: 1, hit: 0 };
  // 成本已在整門起手扣一次；每卷沿用既有命中、熟練、裝備、控制與回復計算。
  resolveStrike(u.f, target.f, move.move, rng,
    (move.skillId ? rankPowerMult(u.c.skillRanks[move.skillId] ?? 0) : 1) * synergy.power * (secondary ? P.splashPower : 1), synergy.hit);
  if (target.f.hp < before) applyGearSpecialOnHit(u.f, target.f, rng);
  if (u.f.hp <= 0) tryGearRevive(u.f);
  if (target.f.hp <= 0) tryGearRevive(target.f);
  const damage = Math.max(0, before - target.f.hp);
  if (damage > 0) {
    target.hurtAt = now;
    const direction = Math.sign(target.x - u.x) || u.face;
    target.x = clamp(target.x + direction * Math.min(P.knockbackMax, P.knockbackBase + damage / P.knockbackDamageDivisor), 48, P.width - 48);
  }
  return { at: now, actor: u.id, target: target.id, skillId: move.skillId ?? u.art, vol: move.vol,
    name: move.move.name, damage, splash: secondary, x: target.x, y: target.y };
}

/** 多人同一時間軸、自由尋敵／轉火；只產生不可變戰報，不入帳、不改玩家或全域RNG。 */
export function simulateSectBattle(roster: readonly SectBattleEntrant[], seed: number): SectBattleReplay {
  validateSectBattleRoster(roster);
  const units = makeUnits(roster), rng = createRng(seed), frames: SectBattleFrame[] = [], events: SectBattleEvent[] = [];
  const order = units.map((_, i) => ({ i, value: rng.nextFloat() })).sort((a, b) => a.value - b.value).map(v => v.i);
  const living = () => [units.filter(u => u.side === 0 && u.f.hp > 0).length, units.filter(u => u.side === 1 && u.f.hp > 0).length] as [number, number];
  const capture = (now: number) => {
    const figures: SectBattleFigure[] = units.map(u => ({ id: u.id, side: u.side, rank: u.rank, name: u.c.name, artId: u.art,
      x: u.x, y: u.y, face: u.face, hp: u.f.hp, maxHp: u.f.maxHp, qi: u.f.qi, maxQi: u.f.maxQi, target: u.target,
      pose: u.f.hp <= 0 ? 'down' : now - u.hurtAt < P.hurtSeconds ? 'hurt' : u.cast ? 'attack' : u.moving ? 'walk' : 'idle',
      poseAt: u.f.hp <= 0 ? u.downAt ?? now : now - u.hurtAt < P.hurtSeconds ? u.hurtAt : u.cast?.started ?? 0 }));
    frames.push({ at: now, figures });
  };
  capture(0);
  let duration = 0;
  for (let tick = 1; tick <= P.maxSeconds / P.tick; tick++) {
    const now = Number((tick * P.tick).toFixed(3)); duration = now;
    // 先以同一幀的位置計算全部移動，避免先處理的一方獲額外速度。
    const moves = new Map<string, { x: number; y: number }>();
    for (const u of units) {
      u.moving = false;
      if (u.f.hp <= 0 || u.cast) continue;
      const target = chooseTarget(u, units); u.target = target?.id ?? null;
      if (!target) continue;
      u.face = Math.sign(target.x - u.x) || u.face;
      const reach = ranged(u.art) ? P.rangedReach : P.reach;
      let dx = 0, dy = 0;
      const angle = Math.atan2(u.y - target.y, u.x - target.x) + (ranged(u.art) ? 0 : (u.rank % 2 ? P.flankAngle : -P.flankAngle));
      const orbit = reach * (ranged(u.art) ? .82 : .66);
      const goal = { x: target.x + Math.cos(angle) * orbit, y: target.y + Math.sin(angle) * orbit };
      const goalDistance = Math.hypot(goal.x - u.x, goal.y - u.y);
      if (goalDistance > 12) {
        dx = (goal.x - u.x) / goalDistance * P.speed * P.tick;
        dy = (goal.y - u.y) / goalDistance * P.speed * P.tick;
      }
      for (const other of units) {
        if (other === u || other.f.hp <= 0) continue;
        const x = u.x - other.x, y = u.y - other.y, gap = Math.hypot(x, y);
        if (gap < P.separation && gap > .01) { const push = (P.separation - gap) * .1; dx += x / gap * push; dy += y / gap * push; }
      }
      moves.set(u.id, { x: clamp(u.x + dx, 48, P.width - 48), y: clamp(u.y + dy, 65, P.depth - 40) });
    }
    for (const u of units) { const move = moves.get(u.id); if (move) { u.moving = Math.hypot(move.x - u.x, move.y - u.y) > .3; u.x = move.x; u.y = move.y; } }
    for (const index of order) {
      const u = units[index];
      if (u.f.hp <= 0) { u.cast = null; u.downAt ??= now; continue; }
      const target = units.find(other => other.id === (u.cast?.target ?? u.target));
      if (!target || target.f.hp <= 0) { if (u.cast) { u.cast = null; u.ready = now + P.recovery; u.f.stunProtected = false; } continue; }
      if (!u.cast) {
        if (now >= u.ready && dist(u, target) <= (ranged(u.art) ? P.rangedReach : P.reach)) startTurn(u, target, now);
        continue;
      }
      const cast = u.cast;
      if (now + 1e-8 < cast.next) continue;
      const move = cast.plan.moves[cast.index];
      if (move) {
        u.cast.started = now - P.windup;
        if (dist(u, target) <= (ranged(u.art) ? P.rangedReach : P.reach) * 1.25 || cast.plan.kind === 'meditate') {
          events.push(strike(u, target, move, now, rng, false));
          // 僅原型：拳掌高卷的小範圍波及有獨立測試參數，不影響正式一對一。
          if (splash(u.art) && (move.vol ?? 0) >= 3 && u.f.hp > 0) {
            const extras = units.filter(v => v !== target && v.side !== u.side && v.f.hp > 0
              && dist(v, target) < P.splashRadius && (v.x - u.x) * u.face >= -24).sort((a, b) => dist(a, target) - dist(b, target)).slice(0, P.maxSplash);
            for (const extra of extras) { if (u.f.hp <= 0) break; events.push(strike(u, extra, move, now, rng, true)); }
          }
        } else {
          events.push({ at: now, actor: u.id, target: target.id, skillId: move.skillId ?? u.art, vol: move.vol,
            name: `${move.move.name} · 未命中`, damage: 0, splash: false, miss: true, x: target.x, y: target.y });
        }
        cast.index++; cast.next = now + P.segmentGap;
      }
      if (cast.index >= cast.plan.moves.length || u.f.hp <= 0 || target.f.hp <= 0) {
        u.cast = null; u.ready = now + P.recovery; u.f.stunProtected = false;
      }
    }
    for (const u of units) if (u.f.hp <= 0) { u.downAt ??= now; u.cast = null; }
    capture(now);
    const counts = living();
    if (counts[0] === 0 || counts[1] === 0) break;
  }
  const remaining = living();
  const winner = remaining[0] > 0 && remaining[1] === 0 ? 0 : remaining[1] > 0 && remaining[0] === 0 ? 1 : null;
  return { seed, duration, winner, frames, events, remaining };
}
