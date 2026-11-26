/** 固定種子重跑演武、突破及免費秘笈，估算上線時間同現實日數。 */
import { writeFileSync } from 'node:fs';
import { createNewLife } from '../../core/life/gameState';
import { addCultivationXp, applyOfflineCultivation, attemptCultivationBreakthrough, canAttemptBreakthrough, grantSparCultivation, tickCultivation } from '../../core/life/cultivation';
import { SPAR_CAMPAIGN_END, SparDuel, sparHeroStats, sparRand, sparSceneFor, sparStageClearXp, sparStageFoes, sparStageReward } from '../../core/life/sparDuel';
import { settleSparTraining } from '../../core/life/sparTraining';
import { emptyAncestry } from '../../core/life/ancestry';
import { fineForgeCost, performPracticeAction } from '../../core/life/actions';
import { bestOwnedGear, equipGear, recomputeCapBonuses } from '../../core/life/equipment';
import { accrueIdleSilver, harvestIdleSilver } from '../../core/life/idleHarvest';
import { addFreeJade, exchangePages, pull, setWish, selectSchoolGachaPool } from '../../core/life/gacha';
import { activeSchoolGachaPool, schoolGachaPools } from '../../core/life/schoolGachaPools';
import { collectionVolumes, grantVolume, ownedVolumes } from '../../core/life/volumes';
import { getSkillDef, sumInternalPassives } from '../../data/skills/catalog';
import { BREAKTHROUGH_FIRST_JADE, BREAKTHROUGH_JADE_STEP } from '../../data/redesign/martialEconomyParams';
import { GACHA_COST_PER_PULL, JADE_PER_SPAR_SCENE } from '../../data/redesign/testParams';
import { choreoForArt } from '../../src/fx/art/recipes';
import { SPAR_CLIPS } from '../../src/spar/rig';
import { FOE_TRAITS } from '../../data/foes/traits';
import type { LifeGameState } from '../../interfaces/lifeEngine';

const daySeconds = 24 * 60 * 60;
const checkpoints = [10, 30, 60, 100, 140, 180, 220, 260];
const accounts = [
  { label: '輕量', minutes: 15, library: false, forge: false, sessions: 1 },
  { label: '日常', minutes: 45, library: true, forge: false, sessions: 1 },
  { label: '積極', minutes: 120, library: true, forge: true, sessions: 2 },
] as const;
const days = [1, 3, 7, 14, 30, 60, 90, 120];
const seeds = Array.from({ length: 12 }, (_, i) => 42 + i * 1337);
const goalArt = 'art_river_fist';

function fight(state: LifeGameState, stage: number, attempt: number, deadline: number) {
  const duel = new SparDuel(sparHeroStats(state), stage, sparRand(state.seed ^ Math.imul(attempt, 0x3a57), stage));
  let seconds = 1;
  let champion = false;
  const advance = () => {
    settleSparTraining(state, [...duel.usedArtIds]);
    seconds += SPAR_CLIPS['enemy-death']!.dur + .9;
    return duel.advance().stageCleared;
  };
  for (let turn = 0; turn < 5000 && seconds < deadline; turn += 1) {
    if (duel.foe?.boss && !champion) { champion = true; seconds += 1.2; }
    if (duel.rounds.phase === 'hero') {
      if (duel.skipStunnedHero()) { seconds += .65; continue; }
      const move = duel.rounds.beginMove(state.character);
      if (!move || !duel.rounds.commitHeroMove()) throw new Error('演武回合缺少招式');
      const recipe = choreoForArt(move.artId);
      seconds += (recipe?.dur ?? SPAR_CLIPS.attack!.dur) + .35;
      const hit = duel.heroStrike(move.power, move.move, move.artId);
      if (hit.dmg > 0) grantSparCultivation(state);
      if (hit.killed && advance()) return { won: true, seconds };
    } else {
      if (duel.skipStunnedFoe()) {
        duel.rounds.commitFoeMove();
        seconds += .65;
        if (duel.foeHp <= 0 && advance()) return { won: true, seconds };
        continue;
      }
      const tempo = duel.foe?.attackTempo ?? 1;
      seconds += .18 + .55 / tempo;
      duel.rounds.commitFoeMove();
      const hit = duel.foeStrike();
      if (hit.heroDown) return { won: false, seconds: seconds + 1.6 };
      if (hit.foeKilled && advance()) return { won: true, seconds };
    }
  }
  return { won: false, seconds: Math.min(deadline, seconds) };
}

function run(seed: number, account: typeof accounts[number]) {
  const state = createNewLife({ seed, skipCoach: true });
  const c = state.character;
  // 比較同一門外功由卷一起步；其他武學只從實際秘笈抽取取得。
  if (!c.skills.includes(goalArt)) c.skills.push(goalArt);
  grantVolume(c, goalArt, 1);
  c.equippedArts = [goalArt, null, null, null];
  const meta = emptyAncestry();
  const pool = schoolGachaPools('jianghu').find(x => x.arts.includes(goalArt));
  if (!pool) throw new Error('長河拳卡池缺失');
  selectSchoolGachaPool(meta, 'jianghu', pool.id);
  setWish(meta, 'jianghu', goalArt);

  let stage = 1, active = 0, attempt = 0;
  const daily: Record<number, number> = {};
  const reached: Record<number, { day: number; activeHours: number; tier: number }> = {};
  const budget = account.minutes * 60 / account.sessions;
  const interval = daySeconds / account.sessions;
  const learnOwned = () => {
    if (!account.library) return;
    if (!activeSchoolGachaPool(meta, 'jianghu').arts.includes(goalArt)) throw new Error('抽取卡池不符');
    for (let i = 0; i < 150 && (meta.jade?.free ?? 0) >= GACHA_COST_PER_PULL; i += 1) {
      if (!pull(meta, 'jianghu', 1)) break;
    }
    for (let vol = 2; vol <= 7; vol += 1) {
      if (!ownedVolumes(c, goalArt).includes(vol) && !collectionVolumes(meta, goalArt).includes(vol)) exchangePages(meta, goalArt, vol);
    }
    for (const id of Object.keys(meta.manuals ?? {})) {
      if (!c.skills.includes(id)) c.skills.push(id);
      for (const vol of collectionVolumes(meta, id)) grantVolume(c, id, vol);
    }
    for (const kind of ['internal', 'qinggong'] as const) {
      const skills = c.skills.filter(id => getSkillDef(id)?.kind === kind);
      const weight = (id: string) => {
        const effect = sumInternalPassives([id], c.skillRanks, c.manualStars);
        return (effect.defense ?? 0) + (effect.attack ?? 0) + (effect.maxHp ?? 0) * .5 + (effect.reflect ?? 0) * 100;
      };
      skills.sort((a, b) => weight(b) - weight(a));
      c.supportArts = { ...c.supportArts, [kind]: skills[0] ?? null };
    }
    recomputeCapBonuses(c);
  };
  for (let day = 1; day <= days.at(-1)!; day += 1) {
    for (let session = 0; session < account.sessions && stage <= SPAR_CAMPAIGN_END; session += 1) {
      if (day > 1 || session > 0) {
        applyOfflineCultivation(state, (interval - budget) * 1000);
        accrueIdleSilver(state, interval - budget);
      }
      let used = 0, consecutiveLosses = 0;
      if (account.forge && c.cultivation.tier >= 12 && (state.practiceActionsLeft ?? 0) > 0) {
        harvestIdleSilver(state);
        if (c.money >= fineForgeCost(state)) {
          performPracticeAction(state, 'forge_fine');
          for (const slot of ['weapon', 'armor', 'accessory'] as const) {
            const gear = bestOwnedGear(c, slot);
            if (gear) equipGear(state, gear.id);
          }
          state.pendingGearCompare = null;
          used += 20;
        }
      }
      while (used + 8 < budget && stage <= SPAR_CAMPAIGN_END) {
        if (canAttemptBreakthrough(state)) {
          const result = attemptCultivationBreakthrough(state);
          used += 8;
          if (result.success) {
            const tier = c.cultivation.tier;
            addFreeJade(meta, BREAKTHROUGH_FIRST_JADE + (tier - 1) * BREAKTHROUGH_JADE_STEP);
            learnOwned();
            consecutiveLosses = 0;
          }
        }
        const battle = fight(state, stage, attempt++, budget - used);
        tickCultivation(state, battle.seconds);
        used += battle.seconds;
        if (!battle.won) {
          if (++consecutiveLosses >= 3) break;
          continue;
        }
        consecutiveLosses = 0;
        c.money += sparStageReward(stage).silver;
        addCultivationXp(state, sparStageClearXp(state, stage));
        c.flags.spar_stage = stage + 1;
        if (stage % 10 === 0) {
          addFreeJade(meta, JADE_PER_SPAR_SCENE);
          learnOwned();
        }
        if (checkpoints.includes(stage)) reached[stage] = {
          day: Number((day - 1 + (session * interval + used) / daySeconds).toFixed(3)),
          activeHours: Number(((active + used) / 3600).toFixed(2)),
          tier: c.cultivation.tier,
        };
        stage += 1;
      }
      active += used;
      if (stage <= SPAR_CAMPAIGN_END) {
        tickCultivation(state, Math.max(0, budget - used));
        accrueIdleSilver(state, budget);
      }
    }
    if (days.includes(day)) daily[day] = stage - 1;
  }
  return { seed, daily, reached, finalTier: c.cultivation.tier, volumes: ownedVolumes(c, goalArt), equipment: c.equipment };
}

const q = (values: number[], p: number) => values.sort((a, b) => a - b)[Math.floor((values.length - 1) * p)];
const result = accounts.map(account => {
  const runs = seeds.map(seed => run(seed, account));
  return {
    account,
    progression: days.map(day => {
      const stages = runs.map(r => r.daily[day]!);
      return { day, low: q(stages, .25), median: q(stages, .5), high: q(stages, .75) };
    }),
    checkpoints: checkpoints.map(stage => {
      const hits = runs.flatMap(r => r.reached[stage] ? [r.reached[stage]!] : []);
      return {
        stage, reached: hits.length, medianElapsedDays: q(hits.map(h => h.day), .5) ?? null,
        medianBattleHours: q(hits.map(h => h.activeHours), .5) ?? null,
      };
    }),
    runs,
  };
});
const out = {
  seeds,
  note: '真戰鬥及修為結算；時長按出招編排、倒地、進場估算。角色由長河拳一卷起步。輕量組保留一卷，另外兩組用突破與過關玉石抽卷、兌換書頁。積極組亦用已賺取銀兩及原有三次修煉額度鑄器。三次敗退後結束當節推關，餘下時間計上線掛機修為。',
  chapters: Array.from({ length: SPAR_CAMPAIGN_END / 10 }, (_, i) => {
    const end = (i + 1) * 10;
    const boss = sparStageFoes(end).at(-1)!;
    return { start: end - 9, end, place: sparSceneFor(end).place, boss: boss.name, hp: boss.maxHp, attack: boss.atk };
  }),
  profiles: result,
};
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + '\n');
if (process.argv[3]) {
  const columns = ['關數', '地區', '主題', '小兵出場順序', '精英出場順序及特性', '守關敵人', '守關特性', '敵人數', '關主氣血', '關主基礎攻擊'];
  const rows = Array.from({ length: SPAR_CAMPAIGN_END }, (_, i) => {
    const stage = i + 1;
    const scene = sparSceneFor(stage);
    const foes = sparStageFoes(stage);
    const boss = foes.at(-1)!;
    const trait = (f: typeof boss) => f.trait ? FOE_TRAITS[f.trait].name : '';
    return [stage, scene.place, scene.theme.name,
      foes.filter(f => f.tier === 'minion').map(f => f.name).join(' → '),
      foes.filter(f => f.tier === 'elite').map(f => `${f.name}（${trait(f)}）`).join(' → '),
      boss.name, trait(boss), foes.length, boss.maxHp, boss.atk];
  });
  const csv = [columns, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  writeFileSync(process.argv[3], '\uFEFF' + csv + '\n');
}
console.log(JSON.stringify(result.map(({ runs, ...summary }) => summary), null, 2));
