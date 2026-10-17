/** 第26項：隔離畫面原型用嘅真引擎戰報；唔寫存檔／唔派獎勵。 */
import type { CombatReplay } from '@interfaces/lifeEngine';
import { createNewLife } from '@core/life/gameState';
import { startCombat } from '@core/life/combat';
import { runAutoCombat } from '@core/life/autoCombat';
import { SparDuel, sparHeroStats, sparRand } from '@core/life/sparDuel';
import { ownedVolumes } from '@core/life/volumes';
import { createRng, withRng } from '@core/random';
import { sparArtAt, sparArtOrder } from '../spar/artCycle';
import { artVolumeMoves } from '@data/skills/volumes';

export type BattlePreviewKind = 'spar' | 'event' | 'event-boss';

/** 戰報計算用獨立seed及複製角色，原型嘅數字只作排版／播放驗收。 */
export function makeBattlePreview(kind: BattlePreviewKind): CombatReplay {
  return withRng(createRng(42), () => {
    const state = createNewLife({ seed: 42, name: '黃問天', skipCoach: true });
    const c = state.character;
    c.maxHealth = 261; c.health = 261;
    c.maxQi = 360; c.qi = 360;
    c.skills = ['art_river_fist', 'art_rain_sword', 'art_thunder_blade'];
    c.skillRanks = Object.fromEntries(c.skills.map(id => [id, 1]));
    c.mainArts = { external: 'art_river_fist' };
    c.equippedArts = [...c.skills];
    c.volumes = { art_river_fist: [1, 6], art_rain_sword: [1, 3], art_thunder_blade: [1, 2] };
    if (kind !== 'spar') {
      startCombat(state, { source: 'event', title: kind === 'event-boss' ? '江湖首領 · 黑風寨' : '鏢旗告急',
        foeName: kind === 'event-boss' ? '鎮上惡霸' : '黑衣刀客', foePower: kind === 'event-boss' ? 'boss' : 'strong', lifeOrDeath: false });
      const result = runAutoCombat(state);
      if (!result) throw new Error('原型戰報未建立');
      return result;
    }
    const duel = new SparDuel(sparHeroStats(state), 2, sparRand(42, 2));
    // 首領戰檢視用checkpoint：只跳過前面小兵，原型唔係通關／平衡示範。
    while (duel.foe && !duel.foe.boss) { duel.foeHp = 0; duel.ensureLiveFoe(); }
    duel.heroHp = 150;
    const foe = duel.foe!;
    const replay: CombatReplay = {
      title: '演武台 · 第 2 關', playerName: c.name, foeName: foe.name,
      playerMaxHp: duel.hero.maxHp, startPlayerHp: duel.heroHp,
      foeMaxHp: foe.maxHp, startFoeHp: duel.foeHp,
      foeBoss: true, foeTier: foe.tier, foeTrait: foe.trait,
      artId: c.mainArts.external, vols: ownedVolumes(c, c.mainArts.external!),
      arts: sparArtOrder(c).map(id => ({ id, vols: ownedVolumes(c, id) })), rounds: [], outcome: 'ended',
    };
    for (let round = 1; round <= 40; round++) {
      const art = sparArtAt(c, round - 1)!;
      const volume = ownedVolumes(c, art)[0]!;
      const hit = duel.heroStrike();
      const hits: CombatReplay['rounds'][number]['hits'] = [{ side: 'player', skillId: art, vol: volume,
        moveName: artVolumeMoves(art)[volume - 1]!.name, damage: hit.dmg, playerHp: duel.heroHp, foeHp: duel.foeHp, traitFx: hit.fx }];
      replay.rounds.push({ round, hits });
      if (hit.killed) { replay.outcome = 'won'; break; }
      const reply = duel.foeStrike();
      hits.push({ side: 'foe', moveName: foe.name + ' · 還擊', damage: reply.dmg,
        playerHp: duel.heroHp, foeHp: duel.foeHp, traitFx: reply.fx });
      if (reply.heroDown) { replay.outcome = 'lost'; break; }
    }
    return replay;
  });
}
