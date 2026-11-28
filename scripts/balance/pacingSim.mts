/**
 * 玩家節奏模擬（2026-11-27）：按現實時間逐日推進，估「玩幾耐去到邊度」。
 * 全部用遊戲真實核心：修為／突破、每月事件及自動交手、演武台 SparDuel＋SparRounds、
 * 演武熟練、日常三項、成長引導、帳戶結算、江湖秘笈抽卡、書頁換卷／升階、學武學及裝備。
 *
 * 三種玩家（每日上線分鐘、每日幾節）：輕度 20／1、一般 60／3、重度 180／4。
 * 假設：
 *   - 上線期間演武台一直自動打；同一關同一種子結果固定，輸咗就要等變強先再過（即撞牆）。
 *   - 事件：上線時間約四成用嚟處理事件，每件約 35 秒，受疲勞度（每 6 秒回 1，事件扣 5）限制。
 *   - 演武每次出招約 1.6 秒、敵人還擊約 1 秒、換敵約 2 秒（估算，唔係逐幀量度）。
 *   - 日常揀演武、行走江湖、收取所得三項；每日修煉 3 次苦練外功；收成每節一次。
 *   - 抽卡只抽江湖秘笈（免費玉石）；夠 600 抽十連，唔夠 60 就單抽。冇計付費、華山、多人、門派會武、奇遇。
 *   - 生死戰一律推辭；事件揀第一個非逃避選項。
 * 用法：DAYS=60 npx vite-node scripts/balance/pacingSim.mts
 */
import { initRng } from '../../core/random';
import { createNewLife } from '../../core/life/gameState';
import { startMonth, applyChoice, resolvePendingEvent, lookupEvent } from '../../core/life/eventEngine';
import { runAutoCombat } from '../../core/life/autoCombat';
import { resolveCombatDisposition, declineLifeOrDeath } from '../../core/life/combat';
import { tickCultivation, canAttemptBreakthrough, attemptCultivationBreakthrough } from '../../core/life/cultivation';
import { tickActionPoints } from '../../core/life/actionPoints';
import { performPracticeAction } from '../../core/life/actions';
import { accrueIdleSilver, harvestIdleSilver } from '../../core/life/idleHarvest';
import { SparDuel, sparHeroStats, sparRand, sparStageFoes, sparSavedStage, sparStageClearXp, sparStageReward } from '../../core/life/sparDuel';
import { settleSparTraining } from '../../core/life/sparTraining';
import { addCultivationXp } from '../../core/life/cultivation';
import { addJadePending } from '../../core/life/jadePending';
import { emptyAncestry } from '../../core/life/ancestry';
import { settleLifeIntoAccount } from '../../core/life/accountSettle';
import { selectDailyTask, claimDailyTask, claimGrowthGuide, GROWTH_GUIDES } from '../../core/life/accountEconomy';
import { pull, exchangePages, upgradeManual, manualUpgradeCost } from '../../core/life/gacha';
import { collectionVolumes, ownedVolumes } from '../../core/life/volumes';
import { martialSlots, setMartialSlot, supportMartialSlots, INTERNAL_ART_SLOT, QINGGONG_ART_SLOT } from '../../core/life/martialLoadout';
import { combatRating } from '../../core/life/combatRating';
import { getSkillDef } from '../../data/skills/catalog';
import { JADE_PER_SPAR_SCENE } from '../../data/redesign/testParams';
import type { LifeGameState } from '../../interfaces/lifeEngine';
import { SPAR_STAGE_TIME_LIMIT_SEC } from '../../data/redesign/cultivationPacing';
import { currentCultivationTier } from '../../core/life/cultivation';
import type { AncestryMeta } from '../../interfaces/ancestry';

const DAYS = Number(process.env.DAYS ?? 60);
const PROFILES = [
  { id: 'light', name: '輕度', minutes: 20, sessions: 1 },
  { id: 'normal', name: '一般', minutes: 60, sessions: 3 },
  { id: 'heavy', name: '重度', minutes: 180, sessions: 4 },
] as const;
const SEED = Number(process.env.SEED ?? 42);
const START = Date.UTC(2026, 10, 1, 1); // 香港早上九時
const HERO_MOVE_SEC = 1.6, FOE_MOVE_SEC = 1.0, NEXT_FOE_SEC = 2.0, EVENT_SEC = 35;

let simNow = START;
const realNow = Date.now;
Date.now = () => simNow;

function settle(meta: AncestryMeta, s: LifeGameState) { settleLifeIntoAccount(meta, s); }

/** 演武一場：回傳勝負、擊倒人數、用時（秒） */
function sparFight(s: LifeGameState, stage: number) {
  const duel = new SparDuel(sparHeroStats(s), stage, sparRand(s.seed, stage));
  const rounds = (duel as unknown as { rounds?: { phase: string; beginMove(c: LifeGameState['character']): { power: number } | null; commitHeroMove(): boolean; commitFoeMove(): boolean } }).rounds!;
  let sec = 0, kills = 0;
  for (let tick = 0; tick < 6000; tick++) {
    if (sec > SPAR_STAGE_TIME_LIMIT_SEC) return { won: false, kills, sec };
    if (rounds.phase === 'hero') {
      const move = rounds.beginMove(s.character);
      if (!move || !rounds.commitHeroMove()) return { won: false, kills, sec };
      sec += HERO_MOVE_SEC;
      const hit = duel.heroStrike(move.power);
      if (hit.killed) { kills++; sec += NEXT_FOE_SEC; if (duel.advance().stageCleared) return { won: true, kills, sec }; }
    } else {
      sec += FOE_MOVE_SEC;
      if (duel.foeStrike().heroDown) return { won: false, kills, sec };
      rounds.commitFoeMove();
    }
  }
  return { won: false, kills, sec };
}

function learnAndEquip(meta: AncestryMeta, s: LifeGameState) {
  const c = s.character;
  for (const id of Object.keys(meta.manuals ?? {})) {
    if (c.skills.includes(id) || !getSkillDef(id)) continue;
    const vols = collectionVolumes(meta, id);
    if (vols.length) c.volumes = { ...c.volumes, [id]: vols };
    c.skills.push(id);
    c.skillRanks = { ...(c.skillRanks ?? {}), [id]: c.skillRanks?.[id] ?? 0 };
    c.skillProgress = { ...(c.skillProgress ?? {}), [id]: c.skillProgress?.[id] ?? 0 };
  }
  settle(meta, s);
  const externals = c.skills.filter((id) => getSkillDef(id)?.kind === 'external')
    .sort((a, b) => ownedVolumes(c, b).length - ownedVolumes(c, a).length || (getSkillDef(b)?.premium ? 1 : 0) - (getSkillDef(a)?.premium ? 1 : 0));
  const want = externals.slice(0, 5);
  const now = martialSlots(c);
  want.forEach((id, i) => { if (now[i] !== id) setMartialSlot(s, i, id); });
  const support = supportMartialSlots(c);
  const firstOf = (kind: string) => c.skills.find((id) => getSkillDef(id)?.kind === kind);
  if (!support.internal && firstOf('internal')) setMartialSlot(s, INTERNAL_ART_SLOT, firstOf('internal')!);
  if (!support.qinggong && firstOf('qinggong')) setMartialSlot(s, QINGGONG_ART_SLOT, firstOf('qinggong')!);
}

function spendJadeAndPages(meta: AncestryMeta, s: LifeGameState, stats: { pulls: number }) {
  for (;;) {
    const jade = (meta.jade?.free ?? 0);
    const n = jade >= 600 ? 10 : jade >= 60 ? 1 : 0;
    if (!n) break;
    if (!pull(meta, 'jianghu', n)) break;
    stats.pulls += n;
  }
  learnAndEquip(meta, s);
  // 書頁：先為主外功補缺卷，冇缺就升階
  const main = martialSlots(s.character)[0];
  for (let guard = 0; guard < 20 && main; guard++) {
    const missing = Array.from({ length: 7 }, (_, i) => i + 1).find((v) => !collectionVolumes(meta, main).includes(v));
    if (missing && (meta.pages ?? 0) >= 200 && exchangePages(meta, main, missing)) continue;
    const cost = manualUpgradeCost(meta, main);
    if (!missing && cost !== null && (meta.pages ?? 0) >= cost && upgradeManual(meta, main)) continue;
    break;
  }
  learnAndEquip(meta, s);
}

function runEvent(s: LifeGameState, stats: { events: number; wins: number; seen: Set<string> }) {
  s.pending = null;
  startMonth(s);
  if (s.pending) {
    const ev = resolvePendingEvent(s) ?? lookupEvent(s.pending.eventId);
    if (!ev) { s.pending = null; return; }
    const ch = ev.choices.find((c) => !/flee|逃/.test(c.id)) ?? ev.choices[0]!;
    try { applyChoice(s, ev, ch.id); } catch { s.pending = null; }
    stats.events++;
    stats.seen.add(ev.id.replace(/_\d+$/, ''));
  }
  if (s.pendingCombat) {
    if (s.pendingCombat.lifeOrDeath && !s.pendingCombat.riskConfirmed) { declineLifeOrDeath(s); return; }
    const before = s.character.stats.combatsWon;
    runAutoCombat(s);
    if (s.pendingCombat?.phase === 'resolve') resolveCombatDisposition(s, 'release');
    if (s.pendingCombat) s.pendingCombat = null;
    if (s.character.stats.combatsWon > before) stats.wins++;
  }
}

const out: Record<string, unknown[]> = {};
const levelLog: Record<string, Record<string, number>> = {};
for (const prof of PROFILES.filter((p) => !process.env.PROFILE || p.id === process.env.PROFILE)) {
  simNow = START;
  initRng(SEED);
  const s = createNewLife({ seed: SEED, skipCoach: true });
  s.pending = null;
  Object.assign(s.character.flags, { newbie_done: true, coach_done: true, newbie_trial_won: true });
  const meta = emptyAncestry();
  const stats = { pulls: 0, events: 0, wins: 0, sparSec: 0, wallDays: 0, seen: new Set<string>(), lastFightSec: 0 };
  const rows: unknown[] = [];
  const onlineSec = prof.minutes * 60 / prof.sessions;
  const gapSec = (86400 - prof.minutes * 60) / prof.sessions;
  settle(meta, s);
  const levels: Record<string, number> = {};
  const markLevel = () => { const t = currentCultivationTier(s); const k = `${t.level}.${t.stage ?? 0}`; if (!(k in levels)) levels[k] = (simNow - START) / 3600000; };
  markLevel();
  for (let day = 1; day <= DAYS && s.character.alive && s.phase === 'playing'; day++) {
    let hitWall = false;
    for (let sess = 0; sess < prof.sessions; sess++) {
      // 離線
      simNow += gapSec * 1000;
      tickCultivation(s, Math.min(gapSec, 48 * 3600));
      tickActionPoints(s, gapSec);
      accrueIdleSilver(s, Math.min(gapSec, 48 * 3600));
      // 上線：日常按香港凌晨四時換日，每節開始揀、完結領
      for (const id of ['spar', 'months', 'harvest'] as const) selectDailyTask(meta, id);
      harvestIdleSilver(s);
      while (canAttemptBreakthrough(s)) { attemptCultivationBreakthrough(s); markLevel(); }
      settle(meta, s);
      for (const g of GROWTH_GUIDES) claimGrowthGuide(meta, s, g.id);
      spendJadeAndPages(meta, s, stats);
      if (sess === 0) for (let i = 0; i < 3; i++) performPracticeAction(s, 'train_martial');
      // 事件：上線時間四成，受疲勞限制
      const eventBudget = Math.floor(onlineSec * 0.4 / EVENT_SEC);
      for (let i = 0; i < eventBudget && s.character.alive; i++) {
        if ((s.character.actionPoints ?? 0) < 5) { tickActionPoints(s, EVENT_SEC); continue; }
        s.character.actionPoints -= 5;
        runEvent(s, stats);
        tickActionPoints(s, EVENT_SEC);
      }
      // 演武：整節上線時間都喺度打
      let budget = onlineSec;
      while (budget > 0 && s.character.alive) {
        const stage = sparSavedStage(s);
        const r = sparFight(s, stage);
        budget -= r.sec; stats.sparSec += r.sec; stats.lastFightSec = Math.round(r.sec);
        const used = martialSlots(s.character).filter(Boolean) as string[];
        for (let k = 0; k < r.kills; k++) settleSparTraining(s, used);
        if (!r.won) { hitWall = true; break; }
        const c = s.character;
        c.money += sparStageReward(stage).silver;
        addCultivationXp(s, sparStageClearXp(s, stage));
        if (stage % 10 === 0 && Number(c.flags.spar_jade_stage ?? 0) < stage) { c.flags.spar_jade_stage = stage; addJadePending(s, JADE_PER_SPAR_SCENE); }
        c.flags.spar_stage = stage + 1;
      }
      tickCultivation(s, onlineSec);
      while (canAttemptBreakthrough(s)) { attemptCultivationBreakthrough(s); markLevel(); }
      settle(meta, s);
      simNow += onlineSec * 1000;
      for (const id of ['spar', 'months', 'harvest'] as const) claimDailyTask(meta, id);
      settle(meta, s);
    }
    spendJadeAndPages(meta, s, stats);
    if (hitWall) stats.wallDays++;
    const c = s.character, ext = martialSlots(c).filter(Boolean) as string[];
    if ([1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 180].includes(day) || day === DAYS) rows.push({
      day, tier: c.cultivation.tier, spar: sparSavedStage(s) - 1, rating: combatRating(s),
      martial: c.martial, hp: c.maxHealth, months: c.stats.monthsLived, events: stats.events, wins: stats.wins,
      pulls: stats.pulls, arts: c.skills.length, mainVols: ext[0] ? ownedVolumes(c, ext[0]).length : 0,
      equipped: ext.length, pages: meta.pages ?? 0, silver: c.money, wallDays: stats.wallDays,
      sparMinPerDay: Math.round(stats.sparSec / 60 / day), distinct: stats.seen.size, lastFightSec: stats.lastFightSec,
    });
  }
  out[prof.name] = rows;
  levelLog[prof.name] = levels;
}
Date.now = realNow;
console.log(JSON.stringify({ rows: out, levels: levelLog }));
