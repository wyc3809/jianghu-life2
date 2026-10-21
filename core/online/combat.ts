import type { CombatReplay, CombatReplayHit, LifeCharacter } from '@interfaces/lifeEngine';
import { createRng } from '@core/random';
import { createNewLife } from '@core/life/gameState';
import { buildPlayerFighter } from '@core/life/combat';
import { resolveStrike, tickStatus } from '@core/life/combatCore';
import { autoBattleMoves, autoBattleRotation, ownedVolumes } from '@core/life/volumes';
import { BASIC_STRIKE } from '@data/skills/catalog';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';

/** 同規則雙方自動逐招；只改戰鬥快照，唔調用人生傷亡／勝利發獎流程。 */
export function simulateOnlineBattle(a: LifeCharacter, b: LifeCharacter, seed: number) {
  const states = [a, b].map((character, i) => {
    const state = createNewLife({ seed: 42 + i, name: character.name, skipCoach: true });
    state.character = structuredClone(character);
    state.character.qi = state.character.maxQi;
    return state;
  });
  const fighters = states.map(state => buildPlayerFighter(state));
  const first = fighters[0]!, second = fighters[1]!;
  const rng = createRng(seed);
  const replay: CombatReplay = {
    title: '江湖切磋', playerName: a.name, foeName: b.name,
    playerMaxHp: first.maxHp, foeMaxHp: second.maxHp,
    startPlayerHp: first.hp, startFoeHp: second.hp, rounds: [], outcome: 'ended',
  };
  const startingSide = rng.chance(.5) ? 0 : 1;
  for (let round = 1; round <= ONLINE_TEST.maxRounds && first.hp > 0 && second.hp > 0; round++) {
    const hits: CombatReplayHit[] = [];
    for (const i of [startingSide, 1 - startingSide]) {
      const actor = fighters[i]!, other = fighters[1 - i]!;
      if (actor.hp <= 0 || other.hp <= 0) break;
      const beforeTick = actor.hp;
      tickStatus(actor);
      if (actor.hp < beforeTick) hits.push({ side: i === 0 ? 'foe' : 'player', moveName: '餘勁發作',
        damage: beforeTick - actor.hp, playerHp: first.hp, foeHp: second.hp });
      if (actor.hp <= 0) break;
      if (actor.stun > 0) { actor.stun--; continue; }
      const moves = autoBattleMoves(states[i]!, round).filter(item => item.move.qiCost <= actor.qi);
      for (const item of [...moves, { move: BASIC_STRIKE, skillId: undefined, vol: undefined }]) {
        if (item.move.qiCost > actor.qi) continue;
        const hp = other.hp;
        resolveStrike(actor, other, item.move, rng);
        hits.push({ side: i === 0 ? 'player' : 'foe', moveName: item.move.name,
          skillId: item.skillId, vol: item.vol, damage: Math.max(0, hp - other.hp),
          playerHp: first.hp, foeHp: second.hp });
        if (actor.hp <= 0 || other.hp <= 0) break;
      }
    }
    replay.rounds.push({ round, hits });
  }
  const winner = first.hp <= 0 && second.hp > 0 ? 1 : second.hp <= 0 && first.hp > 0 ? 0 : null;
  const forCharacter = (c: LifeCharacter) => {
    const arts = autoBattleRotation(c).map(id => ({ id, vols: ownedVolumes(c, id) }));
    return { arts, artId: arts[0]?.id, vols: arts[0]?.vols };
  };
  const forward: CombatReplay = { ...replay, ...forCharacter(a), outcome: winner === 0 ? 'won' : winner === 1 ? 'lost' : 'ended' };
  const reverse: CombatReplay = { ...replay, ...forCharacter(b), playerName: b.name, foeName: a.name,
    playerMaxHp: second.maxHp, foeMaxHp: first.maxHp, startPlayerHp: second.maxHp, startFoeHp: first.maxHp,
    outcome: winner === 1 ? 'won' : winner === 0 ? 'lost' : 'ended',
    rounds: replay.rounds.map(r => ({ ...r, hits: r.hits.map(h => ({ ...h,
      side: h.side === 'player' ? 'foe' : 'player', playerHp: h.foeHp, foeHp: h.playerHp })) })),
  };
  return { winner, forward, reverse };
}
