/**
 * Monte Carlo audit: run the real event engine (startMonth + applyChoice)
 * across many seeded lives, actually resolving each event with a random
 * eligible choice so flags/attributes/relationships evolve like real play.
 * Records every event id actually surfaced to the player, then diffs against
 * the full known event catalog to find anything that can never be drawn.
 * Also cross-checks every martial-arts skill id against `learnSkill` effects
 * (and raw pack JSON) to find skills no event can ever grant.
 *
 * Combat is not simulated (auto-cleared) — this audits event *draw*
 * coverage, not combat outcomes.
 */
import { writeFileSync } from 'fs';
import { createNewLife } from '../core/life/gameState';
import { startMonth, applyChoice, resolvePendingEvent } from '../core/life/eventEngine';
import { meetsRequirements } from '../core/life/requirements';
import { ORDINARY_EVENTS } from '../data/events/ordinary';
import { EVENT_CATALOG } from '../data/events/catalog';
import { SECRET_ART_EVENTS } from '../data/events/secretArts';
import { BOSS_ENCOUNTER_EVENTS } from '../data/events/bossEncounters';
import { PRACTICE_WANDER_EVENTS } from '../data/events/practiceWander';
import { JIANGHU_EXTRA_EVENTS } from '../data/events/jianghuExtra100';
import { ROAD_ENCOUNTER_EVENTS } from '../data/events/roadEncounters';
import { JINYONG_SPECIAL_EVENTS, JINYONG_ORDINARY_EVENTS } from '../data/events/jinyongTropes';
import { PLAYABILITY_EVENTS } from '../data/events/playabilityPack';
import { getPackLibrary } from '../core/life/jianghuEventRepository';
import { MARTIAL_CATALOG_RAW } from '../data/content/packs';
import type { LifeGameState } from '../interfaces/lifeEngine';

type EventLike = {
  id: string;
  title: string;
  tags?: string[];
  choices?: Array<{ id: string; requirements?: unknown; outcomes?: Array<{ effects?: Array<{ type?: string; skillId?: string }> }> }>;
};

const groups: Array<[string, EventLike[]]> = [
  ['ordinary', ORDINARY_EVENTS as EventLike[]],
  ['catalog', EVENT_CATALOG as EventLike[]],
  ['jianghuExtra100', JIANGHU_EXTRA_EVENTS as EventLike[]],
  ['jinyongSpecial', JINYONG_SPECIAL_EVENTS as EventLike[]],
  ['jinyongOrdinary', JINYONG_ORDINARY_EVENTS as EventLike[]],
  ['secretArts', SECRET_ART_EVENTS as EventLike[]],
  ['practiceWander', PRACTICE_WANDER_EVENTS as EventLike[]],
  ['roadEncounters', ROAD_ENCOUNTER_EVENTS as EventLike[]],
  ['bossEncounters', BOSS_ENCOUNTER_EVENTS as EventLike[]],
  ['playabilityPack', PLAYABILITY_EVENTS as EventLike[]],
];

const packEvents = getPackLibrary().events as unknown as EventLike[];
groups.push(['pack', packEvents]);

const allIds = new Map<string, { group: string; title: string }>();
for (const [group, events] of groups) {
  for (const e of events) {
    if (!allIds.has(e.id)) allIds.set(e.id, { group, title: e.title });
  }
}

// --- static reachability check for learnSkill ---
const skillGranted = new Set<string>();
for (const [, events] of groups) {
  for (const e of events) {
    for (const ch of e.choices ?? []) {
      for (const o of ch.outcomes ?? []) {
        for (const eff of o.effects ?? []) {
          if (eff?.type === 'learnSkill' && eff.skillId) skillGranted.add(eff.skillId);
        }
      }
    }
  }
}
const packRaw = JSON.stringify(packEvents);
const allSkills = ((MARTIAL_CATALOG_RAW as { skills?: Array<{ id: string; name: string }> }).skills ?? []).map((s) => ({
  id: s.id,
  name: s.name,
}));
for (const s of allSkills) {
  if (packRaw.includes(`"${s.id}"`)) skillGranted.add(s.id);
}
const ungrantedSkills = allSkills.filter((s) => !skillGranted.has(s.id));

// --- Monte Carlo draw simulation (real engine, choices actually applied) ---
const LIVES = Number(process.argv[2] ?? 300);
const MAX_MONTHS = Number(process.argv[3] ?? 12 * 70); // up to ~age 86
const drawn = new Map<string, number>();
let totalMonths = 0;
let totalDraws = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

for (let life = 0; life < LIVES; life++) {
  let state: LifeGameState = createNewLife({ seed: 1000 + life });
  for (let m = 0; m < MAX_MONTHS; m++) {
    if (!state.character.alive || state.phase !== 'playing') break;
    state = startMonth(state);
    totalMonths++;
    if (state.pendingCombat) {
      // combat resolution is out of scope for this audit — skip past it
      state.pendingCombat = null;
      continue;
    }
    if (!state.pending) continue;
    const ev = resolvePendingEvent(state);
    if (!ev) {
      state.pending = null;
      continue;
    }
    drawn.set(ev.id, (drawn.get(ev.id) ?? 0) + 1);
    totalDraws++;
    const eligible = ev.choices.filter((c) => meetsRequirements(state, c.requirements));
    if (!eligible.length) {
      state.pending = null;
      continue;
    }
    const choice = pickRandom(eligible);
    const result = applyChoice(state, ev, choice.id);
    state = result.state;
    if (state.pendingCombat) state.pendingCombat = null;
    if (state.pending) state.pending = null; // safety net against any leftover pending
  }
}

const neverDrawn = [...allIds.entries()].filter(([id]) => !drawn.has(id));

const report: string[] = [];
report.push(`# 事件抽取模擬報告\n`);
report.push(
  `模擬 ${LIVES} 條人生 × 最多 ${MAX_MONTHS} 個月（實際跑了 ${totalMonths} 個 startMonth，共揭示 ${totalDraws} 次事件）。每次事件用隨機一個合資格選項真的 applyChoice，讓旗標／屬性／人物關係跟真實遊玩一樣演變；戰鬥不模擬（直接清空 pendingCombat 略過）。\n`,
);
report.push(`目錄事件總數：${allIds.size}；模擬期間曾被抽到：${drawn.size}；從未抽到：${neverDrawn.length}\n`);
report.push(`## 從未在模擬中被抽到的事件（${neverDrawn.length}）\n`);
if (!neverDrawn.length) report.push(`（無——所有目錄事件都至少被抽到一次）\n`);
for (const [id, info] of neverDrawn) {
  report.push(`- \`${id}\`（${info.group}）${info.title}`);
}
report.push(`\n## 抽取次數最少的 20 個「有抽到」事件\n`);
const sortedDrawn = [...allIds.entries()]
  .filter(([id]) => drawn.has(id))
  .map(([id, info]) => ({ id, ...info, count: drawn.get(id) ?? 0 }))
  .sort((a, b) => a.count - b.count)
  .slice(0, 20);
for (const s of sortedDrawn) {
  report.push(`- ${s.count}x \`${s.id}\`（${s.group}）${s.title}`);
}
report.push(`\n## 武學技能（共 ${allSkills.length}），事件效果／pack 原始資料中完全找不到授予來源的（${ungrantedSkills.length}）\n`);
if (!ungrantedSkills.length) report.push(`（無——所有技能都至少能在某個事件效果或 pack JSON 中找到）\n`);
for (const s of ungrantedSkills) {
  report.push(`- \`${s.id}\` ${s.name}`);
}

const out = report.join('\n');
writeFileSync('production/qa/event-draw-audit.md', out, 'utf8');
console.log(out);
