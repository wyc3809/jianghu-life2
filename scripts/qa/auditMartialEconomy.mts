/** 以真實純核心審視經濟；隔離帳戶，不存檔、不連線、不改參數。 */
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { emptyAncestry } from '../../core/life/ancestry';
import { createNewLife } from '../../core/life/gameState';
import { pull, setWish, exchangePages, grantTestPaidJade, FREE_POOL, PREMIUM_POOL } from '../../core/life/gacha';
import { gachaBaseOdds } from '../../core/life/gachaOdds';
import { SCHOOL_GACHA_POOLS } from '../../core/life/schoolGachaPools';
import { collectionVolumes } from '../../core/life/volumes';
import { sparRoundMoves } from '../../core/life/sparRounds';
import { sparHeroStats } from '../../core/life/sparDuel';
import { buildPlayerFighter } from '../../core/life/combat';
import { snapshotContestantFromLife } from '../../core/life/huashan';
import { calculateCultivationRate } from '../../core/life/cultivation';
import { SKILL_DEFS, getSkillDef } from '../../data/skills/catalog';
import { hasVolumes } from '../../data/skills/volumes';
import { simulateOnlineBattle } from '../../core/online/combat';
import * as P from '../../data/redesign/testParams';

const out = process.env.MARTIAL_AUDIT_OUT ?? 'production/qa/evidence/redesign/martial-economy';
mkdirSync(out, { recursive: true });
const quantiles = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { mean: values.reduce((a, b) => a + b, 0) / values.length,
    p50: sorted[Math.floor(sorted.length * .5)], p90: sorted[Math.floor(sorted.length * .9)] };
};
const rates = SCHOOL_GACHA_POOLS.map((pool, index) => {
  const m = emptyAncestry();
  m.jade = { free: 6e6, paidTest: 6e6 };
  m.gacha = { pulls: index * 100003, banners: {} };
  // 指定本冊，無心願與有心願分別計算。
  m.gacha.selection = { [pool.banner]: pool.id };
  const noWish = gachaBaseOdds(m, pool.banner);
  const target = (pool.banner === 'zhenben' ? pool.premium : pool.free)[0]!;
  setWish(m, pool.banner, target);
  const odds = gachaBaseOdds(m, pool.banner);
  const results = pull(m, pool.banner, 10000)!;
  return { id: pool.id, free: pool.free.length, premium: pool.premium.length, target,
    noWish, withWish: odds, sequentialPulls: results.length,
    observed: { art: results.filter(r => r.kind !== 'pages').length,
      premium: results.filter(r => r.isPremium).length, wish: results.filter(r => r.isWish).length },
    expectedWishWait: (1 - (1 - odds.wish) ** P.GACHA_WISH_PITY) / odds.wish };
});

const tenRuns = [];
for (let i = 0; i < 1000; i++) {
  const m = emptyAncestry(); m.jade = { free: 600, paidTest: 0 };
  m.gacha = { pulls: i * 4099, banners: {} };
  const results = pull(m, 'jianghu', 10)!;
  tenRuns.push(results.filter(r => r.kind !== 'pages').length);
}

const completion = [];
for (const banner of ['jianghu', 'zhenben'] as const) {
  const pool = SCHOOL_GACHA_POOLS.find(p => p.banner === banner && (banner === 'zhenben' ? p.premium : p.free).some(hasVolumes))!;
  const target = (banner === 'zhenben' ? pool.premium : pool.free).find(hasVolumes)!;
  const samples: number[] = [], first: number[] = [];
  let censored = 0;
  for (let i = 0; i < 300; i++) {
    const m = emptyAncestry(); m.jade = { free: 12e6, paidTest: 12e6 };
    m.gacha = { pulls: i * 4099, banners: {}, selection: { [banner]: pool.id } };
    setWish(m, banner, target);
    for (let n = 1; n <= 2000; n++) {
      pull(m, banner, 1);
      if (m.manuals?.[target] && first.length === i) first.push(n);
      if (collectionVolumes(m, target).length === 7) { samples.push(n); break; }
      if (n === 2000) censored++;
    }
  }
  completion.push({ banner, pool: pool.id, target, accounts: 300, cap: 2000, censored,
    firstTarget: quantiles(first), allSeven: quantiles(samples),
    note: '固定抽數位移樣本；並非獨立隨機玩家。完整七卷指收藏，不把學習贈卷一計入。' });
}

const external = FREE_POOL.find(hasVolumes)!;
const fresh = emptyAncestry(); fresh.pages = P.PAGES_PER_EXCHANGE;
assert(exchangePages(fresh, external));
const freshVolumes = collectionVolumes(fresh, external);
assert.equal(freshVolumes.length, 7);
const partial = emptyAncestry(); partial.pages = P.PAGES_PER_EXCHANGE;
partial.manuals = { [external]: { stars: 0, copies: 0, vols: [2] } };
exchangePages(partial, external);
assert.deepEqual(collectionVolumes(partial, external), [2]);

const state = createNewLife({ seed: 42, skipCoach: true, name: '審核少俠' });
state.character.skills = ['art_river_fist', 'art_iron_body', 'qg_broken_bridge'];
state.character.equippedArts = ['art_river_fist', null, null, null, null];
state.character.supportArts = { internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
state.character.skillRanks = Object.fromEntries(state.character.skills.map(id => [id, 0]));
state.character.manualStars = {};
const base = structuredClone(state);
const trained = structuredClone(base);
trained.character.skillRanks = Object.fromEntries(state.character.skills.map(id => [id, 3]));
const starred = structuredClone(base);
starred.character.manualStars = Object.fromEntries(state.character.skills.map(id => [id, 3]));
const withVolumes = [1, 3, 7].map(count => {
  const s = structuredClone(base);
  s.character.volumes = { art_river_fist: Array.from({ length: count }, (_, i) => i + 1) };
  const moves = sparRoundMoves(s.character, 0);
  return { count, moves: moves.map(m => m.moveName), summedPower: moves.reduce((n, m) => n + m.power, 0) };
});
const modes = [base, trained, starred].map((s, i) => ({ type: ['base', 'rank3', 'stars3'][i],
  spar: sparHeroStats(s), sparRoundPower: sparRoundMoves(s.character, 0).reduce((n, m) => n + m.power, 0),
  event: buildPlayerFighter(s), huashanSnapshot: snapshotContestantFromLife(s) }));
assert.deepEqual(modes[0]!.spar, modes[1]!.spar);
assert.deepEqual(modes[0]!.huashanSnapshot, modes[2]!.huashanSnapshot);
const unequipped = structuredClone(base);
unequipped.character.skills.push(...FREE_POOL.filter(id => !unequipped.character.skills.includes(id)).slice(0, 10));
const testJade = emptyAncestry(); grantTestPaidJade(testJade); grantTestPaidJade(testJade);
const battle = simulateOnlineBattle(base.character, structuredClone(base.character), 42);
const externalRank = structuredClone(base.character);
externalRank.skillRanks!['art_river_fist'] = 3;
const rankIgnoredOnline = Array.from({ length: 16 }, (_, seed) => {
  const ordinary = simulateOnlineBattle(base.character, base.character, seed);
  const ranked = simulateOnlineBattle(externalRank, base.character, seed);
  return JSON.stringify(ordinary) === JSON.stringify(ranked);
});
assert(rankIgnoredOnline.every(Boolean));

// 每派各一門一般／珍本、三卷、同基礎數值、無兵器；這是差異篩查，不是最強配搭榜。
const profiles = SCHOOL_GACHA_POOLS.filter(p => p.banner === 'zhenben').flatMap(pool =>
  ['ordinary', 'premium'].map(rarity => {
    const arts = (rarity === 'premium' ? pool.premium : FREE_POOL.filter(id => SCHOOL_GACHA_POOLS.some(p => p.school === pool.school && p.banner === 'jianghu' && p.arts.includes(id))))
      .filter(hasVolumes).sort((a, b) => (getSkillDef(b)?.move?.power ?? 0) - (getSkillDef(a)?.move?.power ?? 0));
    const id = arts[0]!;
    const c = structuredClone(base.character);
    c.name = `${pool.school}-${rarity}`; c.martial = 40; c.maxHealth = 400; c.health = 400; c.maxQi = 200; c.qi = 200;
    c.gear = []; c.equipment = { weapon: null, armor: null, accessory: null };
    c.skills = [id, 'art_iron_body', 'qg_broken_bridge'];
    c.equippedArts = [id, null, null, null, null];
    c.supportArts = { internal: 'art_iron_body', qinggong: 'qg_broken_bridge' };
    c.skillRanks = Object.fromEntries(c.skills.map(s => [s, 0])); c.manualStars = {};
    c.volumes = { [id]: [1, 2, 3] };
    return { key: c.name, art: id, character: c };
  }));
const matchups = profiles.flatMap(a => profiles.filter(b => b.key !== a.key).map(b => {
  const results = Array.from({ length: 16 }, (_, seed) => simulateOnlineBattle(a.character, b.character, seed));
  return { a: a.key, b: b.key, fights: 16, aWins: results.filter(r => r.winner === 0).length,
    bWins: results.filter(r => r.winner === 1).length, draws: results.filter(r => r.winner === null).length,
    meanRounds: results.reduce((n, r) => n + r.forward.rounds.length, 0) / results.length };
}));

const catalogue = Object.values(SKILL_DEFS).map(d => ({ id: d.id, name: d.name, kind: d.kind, premium: !!d.premium,
  poolIds: SCHOOL_GACHA_POOLS.filter(p => p.arts.includes(d.id)).map(p => p.id), move: d.move, passive: d.passive }));
assert(catalogue.every(d => d.poolIds.length > 0));
const report = { version: 'EA0.90.0', changedEconomy: false, dataSource: 'production core and catalogue; isolated in-memory accounts',
  sampling: 'Exact rule formulas assume uniform PRNG. Empirical samples use deterministic, spaced global pull counters; no IID/player retention claims.',
  constants: Object.fromEntries(Object.entries(P).filter(([k]) => /GACHA|JADE|MANUAL|PAGES/.test(k))),
  counts: { ordinary: FREE_POOL.length, premium: PREMIUM_POOL.length, pools: rates.length, catalogue: catalogue.length },
  rates, tenPulls: { accounts: tenRuns.length, noWish: true, noArt: tenRuns.filter(n => n === 0).length,
    formulaNoArt: (1 - P.GACHA_ART_RATE) ** 10, arts: quantiles(tenRuns) }, completion,
  exchange: { external, firstPurchaseVolumes: freshVolumes, existingPartialVolumes: collectionVolumes(partial, external),
    existingCopies: partial.manuals![external]!.copies, uiBlocksExisting: true },
  growth: { withVolumes, modes, additionalUnequippedLearnedSkills: 10,
    cultivationBase: calculateCultivationRate(base), cultivationWithMoreKnown: calculateCultivationRate(unequipped) },
  onlineFirstRound: battle.forward.rounds[0], externalRankIgnoredOnline: rankIgnoredOnline,
  matchups: { seedsPerOrderedPair: 16, totalFights: matchups.length * 16,
    profiles: profiles.map(({ key, art }) => ({ key, art })), results: matchups,
    limitation: '三卷、相同內功身法、無兵器、每派按基礎威力選一門；非全配搭、非玩家勝率、非服務端驗證。' },
  testGrantAfterTwoClaims: testJade.jade,
  catalogue };
writeFileSync(`${out}/audit.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ counts: report.counts, ten: report.tenPulls, completion, exchange: report.exchange, volume: withVolumes, testJade: testJade.jade }, null, 2));
