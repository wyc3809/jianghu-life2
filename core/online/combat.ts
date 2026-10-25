import type { CombatReplay, CombatReplayHit, LifeCharacter } from '@interfaces/lifeEngine';
import { createRng } from '@core/random';
import { createNewLife } from '@core/life/gameState';
import { buildPlayerFighter } from '@core/life/combat';
import { resolveMartialTurn } from '@core/life/martialTurn';
import { characterForPreset } from '@core/life/loadoutPresets';
import { autoBattleRotation, ownedVolumes } from '@core/life/volumes';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';

/** 同規則雙方自動逐招；只改戰鬥快照，唔調用人生傷亡／勝利發獎流程。 */
export function simulateOnlineBattle(a: LifeCharacter, b: LifeCharacter, seed: number) {
  const states = [a, b].map((character, i) => {
    const state = createNewLife({ seed: 42 + i, name: character.name, skipCoach: true });
    state.character = characterForPreset(structuredClone(character), 'duel');
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
      const action = resolveMartialTurn(actor, other, states[i]!.character, round, rng);
      for (const hit of action.hits) hits.push({ side: i === 0 ? 'player' : 'foe', moveName: hit.moveName,
        skillId: hit.skillId, vol: hit.vol, damage: hit.damage,
        playerHp: first.hp, foeHp: second.hp,
      });
      // 每招落點保留自己及對手當時氣血，唔把整回合最終值重複填入。
      const start = hits.length - action.hits.length;
      action.hits.forEach((hit, k) => { hits[start+k].playerHp = i === 0 ? hit.actorHp : hit.targetHp; hits[start+k].foeHp = i === 0 ? hit.targetHp : hit.actorHp; });
    }
    replay.rounds.push({ round, hits });
  }
  const winner = first.hp <= 0 && second.hp > 0 ? 1 : second.hp <= 0 && first.hp > 0 ? 0 : null;
  const forCharacter = (c: LifeCharacter) => {
    const arts = autoBattleRotation(c).map(id => ({ id, vols: ownedVolumes(c, id) }));
    return { arts, artId: arts[0]?.id, vols: arts[0]?.vols };
  };
  const forward: CombatReplay = { ...replay, ...forCharacter(states[0]!.character), outcome: winner === 0 ? 'won' : winner === 1 ? 'lost' : 'ended' };
  const reverse: CombatReplay = { ...replay, ...forCharacter(states[1]!.character), playerName: b.name, foeName: a.name,
    playerMaxHp: second.maxHp, foeMaxHp: first.maxHp, startPlayerHp: second.maxHp, startFoeHp: first.maxHp,
    outcome: winner === 1 ? 'won' : winner === 0 ? 'lost' : 'ended',
    rounds: replay.rounds.map(r => ({ ...r, hits: r.hits.map(h => ({ ...h,
      side: h.side === 'player' ? 'foe' : 'player', playerHp: h.foeHp, foeHp: h.playerHp })) })),
  };
  return { winner, forward, reverse };
}
