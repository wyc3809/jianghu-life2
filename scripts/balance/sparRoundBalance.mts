/** 固定人物／種子比較難度；舊版用既有量測出手比，候選版按完整回合真實結算。 */
import fs from 'node:fs';
import { createNewLife } from '../../core/life/gameState';
import { SparDuel, sparHeroStats, sparRand, sparStageFoes } from '../../core/life/sparDuel';
import type { LifeGameState } from '../../interfaces/lifeEngine';

const mode = process.env.SPAR_BALANCE_MODE ?? 'candidate';
const output = process.env.SPAR_BALANCE_OUT ?? 'production/qa/evidence/redesign/spar-rounds/balance-after.json';
function life(seed: number, tier: number, count: number): LifeGameState {
  const s = createNewLife({ seed, skipCoach: true });
  const c = s.character;
  c.skills = ['art_river_fist'];
  c.equippedArts = ['art_river_fist', null, null, null, null];
  c.supportArts = { internal: null, qinggong: null };
  c.volumes = { art_river_fist: Array.from({ length: count }, (_, i) => i + 1) };
  for (let t = 1; t <= tier; t++) { c.martial += 6 + t * 2; c.maxHealth += 16 + t * 5; }
  c.health = c.maxHealth;
  c.cultivation = { tier, xp: 0, reserve: 0 };
  return s;
}
function fight(s: LifeGameState, stage: number, seed: number) {
  const duel = new SparDuel(sparHeroStats(s), stage, sparRand(seed, stage));
  let hits = 0, counters = 0, rounds = 0, acc = 0;
  const roundsState = (duel as unknown as { rounds?: { phase: string; beginMove(c: typeof s.character): {power:number}|null; commitHeroMove(): boolean; commitFoeMove(): boolean } }).rounds;
  for (let tick = 0; tick < 5000; tick++) {
    if (mode === 'before') {
      const hit = duel.heroStrike(); hits++;
      if (hit.killed) { if (duel.advance().stageCleared) return { won: true, hits, counters, rounds }; continue; }
      acc += 1 / (duel.foe?.boss ? 1.9 : 2.5);
      while (acc >= 1) { acc--; counters++; if (duel.foeStrike().heroDown) return { won: false, hits, counters, rounds }; }
    } else {
      if (!roundsState) throw Error('需要候選版SparRounds');
      if (roundsState.phase === 'hero') {
        const move = roundsState.beginMove(s.character);
        if (!move || !roundsState.commitHeroMove()) throw Error('回合沒有可用招式');
        const hit = duel.heroStrike(move.power); hits++;
        if (hit.killed && duel.advance().stageCleared) return { won: true, hits, counters, rounds };
      } else {
        counters++; rounds++;
        if (duel.foeStrike().heroDown) return { won: false, hits, counters, rounds };
        roundsState.commitFoeMove();
      }
    }
  }
  return { won: false, hits, counters, rounds, timeout: true };
}
const cases = [];
for (const tier of [0, 2, 4, 8, 14]) for (const count of [1, 3, 7]) {
  const s = life(42, tier, count);
  let wall = 1;
  while (wall < 100 && fight(s, wall, 42).won) wall++;
  const probes = [...new Set([1, 3, 5, 10, 20, 35, Math.max(1, wall - 1), wall])].sort((a,b)=>a-b);
  cases.push({ tier, volumes: count, hero: sparHeroStats(s), firstLossSeed42: wall,
    stages: probes.map(stage => { const runs = Array.from({ length: 32 }, (_, i) => fight(s, stage, i + 1));
      return { stage, winRate: runs.filter(r=>r.won).length / runs.length, meanHeroHits: runs.reduce((n,r)=>n+r.hits,0)/runs.length,
        meanCounters: runs.reduce((n,r)=>n+r.counters,0)/runs.length, bossHitFraction: sparStageFoes(stage).at(-1)!.atk / s.character.maxHealth }; }) });
}
const starters = Array.from({length:64},(_,i)=>fight(life(i+1,0,1),1,i+1));
const result = { mode, seed42Character: true, independentCombatSeeds: 32, starterSeeds: 64,
  starterStage1WinRate: starters.filter(r=>r.won).length/starters.length,
  baselineCadenceNote: mode==='before' ? '沿用舊曲線測試的實測出手比2.5／1.9；不是本次逐幀瀏覽器量測' : '已學招式全出後敵人還擊一次，真實SparDuel與SparRounds結算', cases };
fs.mkdirSync(output.slice(0,output.lastIndexOf('/')), {recursive:true});
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({mode,starterStage1WinRate:result.starterStage1WinRate,walls:cases.map(c=>({tier:c.tier,volumes:c.volumes,wall:c.firstLossSeed42}))}));
