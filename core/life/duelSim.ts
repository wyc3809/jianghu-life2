import { createRng } from '@core/random';
import { appearanceOf } from '@interfaces/appearance';
import { sumInternalPassives, sumEvasionBonus } from '@data/skills/catalog';
import { gearTotals, ensureGear, sumGearCombatBonuses, equippedDefs } from './equipment';
import type { CombatFighterState, LifeCharacter, WuxiaAttribute, CombatReplay, CombatReplayHit, ContestantBuild } from '@interfaces/lifeEngine';
import { normalizeVolumes } from '@data/skills/volumes';
import { internalQiRegen, resolveMartialTurn } from './martialTurn';
export type ContestFighter = CombatFighterState;

function fakeCharacter(loadout: ContestantBuild): LifeCharacter {
  const attrs = { ...loadout.attributes };
  const c: LifeCharacter = {
    name: loadout.name,
    gender: 'male' as const,
    appearance: loadout.appearance,
    age: loadout.age ?? 28,
    alive: true,
    health: loadout.maxHealth,
    maxHealth: loadout.maxHealth,
    money: 0,
    reputation: loadout.reputation ?? 0,
    martial: loadout.martial,
    qi: loadout.maxQi,
    maxQi: loadout.maxQi,
    actionPoints: 100,
    birthplace: '',
    location: '',
    conditions: [],
    attributes: attrs,
    nature: { xia: 0, xie: 0, kuang: 0, e: 0 },
    skills: [...loadout.skills],
    skillRanks: { ...loadout.skillRanks },
    manualStars: { ...loadout.manualStars },
    volumes: Object.fromEntries((loadout.autoArts ?? (loadout.autoArt ? [{id:loadout.autoArt,vols:loadout.autoVols ?? [1]}] : [])).map(a => [a.id,a.vols])),
    skillProgress: {},
    skillAdvanceNeed: {},
    gear: [...(loadout.gear ?? [])],
    equipment: { ...loadout.equipment },
    sectId: null,
    sectStanding: 0,
    loverId: null,
    childrenCount: 0,
    childrenMax: 1,
    monthsSinceLastBirth: 99,
    flags: {},
    family: {},
    stats: {
      yearsLived: 0,
      monthsLived: 0,
      eventsSeen: 0,
      combats: 0,
      combatsWon: 0,
      lovers: 0,
      wealthPeak: 0,
    },
    cultivation: { xp: 0, tier: 0 },
  };
  ensureGear(c);
  return c;
}

export function buildContestantFighter(loadout: ContestantBuild, isPlayerSide = false): ContestFighter {
  const c = fakeCharacter(loadout);
  const gear = gearTotals(c);
  const gearCombat = sumGearCombatBonuses(c);
  const passive = sumInternalPassives(c.skills, c.skillRanks ?? {}, c.manualStars);
  const evasion = sumEvasionBonus(c.skills, c.skillRanks ?? {}, c.manualStars) + c.attributes.danShi / 500;
  const maxHp = c.maxHealth + (loadout.capsIncludeGear ? 0 : gear.maxHpBonus) + (passive.maxHp ?? 0);
  const maxQi = c.maxQi + (loadout.capsIncludeGear ? 0 : gear.maxQiBonus) + (passive.maxQi ?? 0);
  return {
    name: loadout.name,
    appearance: appearanceOf(c),
    hp: maxHp,
    maxHp,
    qi: maxQi,
    maxQi,
    attack:
      12 +
      Math.floor(c.martial / 4) +
      gear.attack +
      gear.martialBonus +
      (passive.attack ?? 0),
    defense: 6 + Math.floor(c.attributes.genGu / 12) + gear.defense + (passive.defense ?? 0),
    hitBonus: 0.05 + c.attributes.danShi / 400 + (passive.hitBonus ?? 0) + gearCombat.hitBonus,
    evasion: Math.min(0.45, evasion + gearCombat.evasion),
    qiRegen: internalQiRegen(c).flat,
    qiRegenPercent: internalQiRegen(c).percent,
    gearSpecials: equippedDefs(c).flatMap(d => d.special ? [d.special] : []),
    blind: 0,
    isPlayer: isPlayerSide,
    stun: 0,
    bleedDamage: 0,
    bleedTurns: 0,
    defenseMod: 0,
    reflect: Math.min(0.35, (passive.reflect ?? 0) + gearCombat.reflect),
    chargeBonus: 0,
    martial: c.martial,
    gearPierce: gearCombat.pierce,
    gearLifesteal: gearCombat.lifesteal,
    gearBleedChance: gearCombat.bleedChance,
  };
}

export interface ContestDuelResult {
  winnerId: string;
  loserId: string;
  log: string[];
  draw: boolean;
  /** 自動戰鬥演出（玩家視角；冇玩家嘅場就以 a 方做「玩家」） */
  replay: CombatReplay;
}

/** 回傳真實逐招落點；調息、受控同樣留下可讀行動。 */
function executeAutoTurn(actor: ContestFighter, target: ContestFighter, c: LifeCharacter, rng: ReturnType<typeof createRng>, side: 'player' | 'foe', _hp: () => {playerHp:number;foeHp:number}, round: number) {
  const action = resolveMartialTurn(actor,target,c,round,rng);
  const hits: CombatReplayHit[] = action.hits.map(h => ({side,moveName:h.moveName,skillId:h.skillId,vol:h.vol,damage:h.damage,
    playerHp:side === 'player' ? h.actorHp : h.targetHp, foeHp:side === 'player' ? h.targetHp : h.actorHp}));
  return {lines:action.lines,hits};
}

export function simulateContestDuel(opts: {
  title: string;
  a: ContestantBuild;
  b: ContestantBuild;
  seed: number;
  maxTurns?: number;
  aIsPlayer?: boolean;
}): ContestDuelResult {
  const rng = createRng(opts.seed >>> 0);
  const maxTurns = opts.maxTurns ?? 36;
  const aF = buildContestantFighter(opts.a, Boolean(opts.aIsPlayer));
  const bF = buildContestantFighter(opts.b, false);
  const characterA = fakeCharacter(opts.a), characterB = fakeCharacter(opts.b);
  const log: string[] = [`【${opts.title}】`, `${opts.a.name} 對 ${opts.b.name}，劍拔弩張。`];
  // 演出用「玩家」方：玩家喺 b 就對調
  const playerIsB = opts.aIsPlayer === false && Boolean(opts.b.isPlayer);
  const pF = playerIsB ? bF : aF;
  const fF = playerIsB ? aF : bF;
  const pB = playerIsB ? opts.b : opts.a;
  const hp = () => ({ playerHp: Math.max(0, Math.round(pF.hp)), foeHp: Math.max(0, Math.round(fF.hp)) });
  const replay: CombatReplay = {
    title: opts.title,
    playerName: pF.name,
    foeName: fF.name,
    playerAppearance: pF.appearance ? { ...pF.appearance } : undefined,
    foeAppearance: fF.appearance ? { ...fF.appearance } : undefined,
    playerMaxHp: pF.maxHp,
    foeMaxHp: fF.maxHp,
    startPlayerHp: pF.hp,
    startFoeHp: fF.hp,
    ...(pB.autoArt
      ? {
          artId: pB.autoArt,
          vols: normalizeVolumes(pB.autoVols ?? [1]),
          arts: (pB.autoArts ?? []).map((a) => ({ id: a.id, vols: normalizeVolumes(a.vols) })),
        }
      : {}),
    rounds: [],
    outcome: 'ended',
  };
  const sideOf = (isA: boolean): 'player' | 'foe' => (isA !== playerIsB ? 'player' : 'foe');

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    const hits: CombatReplayHit[] = [];
    if (aF.hp > 0 && bF.hp > 0) {
      const t = executeAutoTurn(aF, bF, characterA, rng, sideOf(true), hp, turn);
      log.push(...t.lines);
      hits.push(...t.hits);
    }
    if (bF.hp > 0 && aF.hp > 0) {
      const t = executeAutoTurn(bF, aF, characterB, rng, sideOf(false), hp, turn);
      log.push(...t.lines);
      hits.push(...t.hits);
    }
    replay.rounds.push({ round: turn, hits });
    if (bF.hp <= 0 || aF.hp <= 0) break;
  }

  let draw = false;
  let winnerId: string;
  let loserId: string;
  if (aF.hp > 0 && bF.hp > 0) {
    draw = true;
    if (aF.hp / aF.maxHp >= bF.hp / bF.maxHp) {
      winnerId = opts.a.id;
      loserId = opts.b.id;
      log.push('時限已至，裁判以氣血成色判你稍佔上風。');
    } else {
      winnerId = opts.b.id;
      loserId = opts.a.id;
      log.push('時限已至，裁判以氣血成色判對手稍佔上風。');
    }
  } else if (bF.hp <= 0) {
    winnerId = opts.a.id;
    loserId = opts.b.id;
    log.push(`${opts.b.name}氣竭敗北。`);
  } else {
    winnerId = opts.b.id;
    loserId = opts.a.id;
    log.push(`${opts.a.name}氣竭敗北。`);
  }

  const playerId = playerIsB ? opts.b.id : opts.a.id;
  replay.outcome = winnerId === playerId ? 'won' : 'lost';
  return { winnerId, loserId, log, draw, replay };
}

export function defaultAttributes(martial: number): Record<WuxiaAttribute, number> {
  const base = 40 + Math.floor(martial / 3);
  return {
    genGu: base + 4,
    wuXing: base,
    fuYuan: base - 2,
    meiLi: base - 4,
    danShi: base + 2,
  };
}
