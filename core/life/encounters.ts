/**
 * 在線奇遇（design/agreed-design-2026-10.md §3.3；玩家決定見 data/redesign/encounters.ts）。
 * 流程：在線到時 → 彈出奇遇（offer）→ 玩家揀第一個決定（開路線、開始計 1–3 日）→
 * 期限內用遊戲進度完成考驗 → 領傳承（珍本奇功入家族收藏）；過期乜都冇。
 * 記喺帳戶（AncestryMeta.encounter），跨世進度照計。純函數；時間同 RNG 由外面傳入。
 */
import type { AncestryMeta, EncounterState } from '@interfaces/ancestry';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createRng } from '@core/random';
import { VOLUME_COUNT, hasVolumes } from '@data/skills/volumes';
import { addCollectionVolume, collectionVolumes } from './volumes';
import {
  ENCOUNTERS,
  ENCOUNTER_FIRST_DELAY_MINUTES,
  ENCOUNTER_GAP_MAX_HOURS,
  ENCOUNTER_GAP_MIN_HOURS,
  ENCOUNTER_OFFER_HOURS,
  type EncounterRoute,
  type EncounterTemplate,
  type TrialKind,
} from '@data/redesign/encounters';

const HOUR = 3_600_000;

export function encounterTemplate(id: string | undefined): EncounterTemplate | undefined {
  return ENCOUNTERS.find((t) => t.id === id);
}

export function encounterRoute(tpl: string | undefined, route: string | undefined): EncounterRoute | undefined {
  return encounterTemplate(tpl)?.routes.find((r) => r.id === route);
}

function lifeKey(state: LifeGameState): string {
  const c = state.character;
  return `${state.seed}:${c.flags.legacy_generation ?? 1}:${c.name}`;
}

/** 考驗計數（每代各自由 0 計，跨代靠 carried 累積） */
export function trialValue(state: LifeGameState, kind: TrialKind): number {
  const c = state.character;
  switch (kind) {
    case 'months':
      return c.stats.monthsLived ?? 0;
    case 'harvest':
      return Number(c.flags.harvest_total ?? 0);
    case 'stages':
      return Number(c.flags.spar_stage ?? 1);
    case 'wins':
      return c.stats.combatsWon ?? 0;
  }
}

function ensure(meta: AncestryMeta, now: number): EncounterState {
  meta.encounter ??= { nextAt: now + ENCOUNTER_FIRST_DELAY_MINUTES * 60_000, seq: 0, done: 0, expired: 0 };
  return meta.encounter;
}

function scheduleNext(e: EncounterState, now: number): void {
  const rng = createRng(0x51ed270b ^ ((e.seq + 7) * 40503));
  const hours = ENCOUNTER_GAP_MIN_HOURS + rng.nextFloat() * (ENCOUNTER_GAP_MAX_HOURS - ENCOUNTER_GAP_MIN_HOURS);
  e.nextAt = now + hours * HOUR;
}

export type EncounterTick = 'none' | 'offered' | 'offer_lapsed' | 'progress' | 'completed' | 'expired';

/**
 * 喺線上定時叫（只有開住遊戲先會叫，所以只會喺在線時彈）。
 * 返回今次發生咗乜；meta 會被修改。
 */
export function tickEncounter(meta: AncestryMeta, state: LifeGameState | null, now: number): EncounterTick {
  const e = ensure(meta, now);
  if (e.offer) {
    if (now > e.offer.at + ENCOUNTER_OFFER_HOURS * HOUR) {
      e.offer = undefined;
      scheduleNext(e, now);
      return 'offer_lapsed';
    }
    return 'none';
  }
  if (e.active) {
    const route = encounterRoute(e.active.tpl, e.active.route);
    if (!route) {
      e.active = undefined;
      scheduleNext(e, now);
      return 'none';
    }
    const before = e.active.progress;
    if (state && route.trial === 'harvest') {
      // 賺銀兩：身上銀兩每次增加都計（演武、收成、事件、交手…）；使錢唔扣；換代唔計遺產
      const key = lifeKey(state);
      const money = state.character.money ?? 0;
      if (key !== e.active.base.lifeKey || e.active.lastMoney === undefined) {
        e.active.base = { lifeKey: key, value: 0 };
      } else if (money > e.active.lastMoney) {
        e.active.progress = Math.min(route.target, e.active.progress + (money - e.active.lastMoney));
      }
      e.active.lastMoney = money;
    } else if (state) {
      const key = lifeKey(state);
      const v = trialValue(state, route.trial);
      if (key !== e.active.base.lifeKey) {
        // 換咗代：之前嘅進度保留，新一代由而家起計
        e.active.carried = e.active.progress;
        e.active.base = { lifeKey: key, value: v };
      }
      e.active.progress = Math.min(route.target, e.active.carried + Math.max(0, v - e.active.base.value));
    }
    if (e.active.progress >= route.target) return before < route.target ? 'completed' : 'none';
    if (now > e.active.deadline) {
      e.last = { tpl: e.active.tpl, result: 'expired', at: now };
      e.active = undefined;
      e.expired += 1;
      scheduleNext(e, now);
      return 'expired';
    }
    return e.active.progress !== before ? 'progress' : 'none';
  }
  if (now >= e.nextAt && state && state.phase === 'playing') {
    const recent = new Set([e.last?.tpl]);
    const pool = ENCOUNTERS.filter((t) => !recent.has(t.id));
    const rng = createRng(0x2545f491 ^ ((e.seq + 1) * 2654435761));
    e.seq += 1;
    e.offer = { tpl: rng.pick(pool.length ? pool : ENCOUNTERS).id, at: now };
    return 'offered';
  }
  return 'none';
}

/** 玩家揀第一個決定：開路線，限期由而家開始計（離線照計） */
export function chooseEncounterRoute(meta: AncestryMeta, state: LifeGameState, routeId: string, now: number): boolean {
  const e = ensure(meta, now);
  if (!e.offer) return false;
  const route = encounterRoute(e.offer.tpl, routeId);
  if (!route) return false;
  e.active = {
    tpl: e.offer.tpl,
    route: route.id,
    startAt: now,
    deadline: now + route.days * 24 * HOUR,
    carried: 0,
    base: { lifeKey: lifeKey(state), value: trialValue(state, route.trial) },
    progress: 0,
    ...(route.trial === 'harvest' ? { lastMoney: state.character.money ?? 0 } : {}),
  };
  e.offer = undefined;
  return true;
}

/** 放棄未揀嘅奇遇（當過咗） */
export function dismissEncounterOffer(meta: AncestryMeta, now: number): void {
  const e = ensure(meta, now);
  if (!e.offer) return;
  e.offer = undefined;
  scheduleNext(e, now);
}

/** 考驗完成：領傳承（珍本奇功入家族收藏，優先未有嘅）；返回武學 id */
export function claimEncounter(meta: AncestryMeta, now: number): string | null {
  const e = ensure(meta, now);
  const a = e.active;
  const tpl = encounterTemplate(a?.tpl);
  const route = encounterRoute(a?.tpl, a?.route);
  if (!a || !tpl || !route || a.progress < route.target) return null;
  meta.manuals ??= {};
  const fresh = tpl.rewards.filter((id) => !meta.manuals![id]);
  const pickFrom = fresh.length ? fresh : tpl.rewards;
  const rng = createRng(0x1b873593 ^ ((e.seq + 3) * 31));
  const reward = pickFrom[rng.nextInt(0, pickFrom.length - 1)]!;
  let vol: number | undefined;
  if (hasVolumes(reward)) {
    // 外功逐卷出：優先未有嘅卷
    const have = new Set(meta.manuals[reward] ? collectionVolumes(meta, reward) : []);
    const missing = Array.from({ length: VOLUME_COUNT }, (_, i) => i + 1).filter((v) => !have.has(v));
    vol = missing.length ? missing[rng.nextInt(0, missing.length - 1)]! : rng.nextInt(1, VOLUME_COUNT);
    addCollectionVolume(meta, reward, vol);
  } else {
    const owned = meta.manuals[reward];
    if (owned) owned.copies += 1;
    else meta.manuals[reward] = { stars: 0, copies: 0 };
  }
  e.last = { tpl: a.tpl, result: 'done', reward, ...(vol ? { vol } : {}), at: now };
  e.active = undefined;
  e.done += 1;
  scheduleNext(e, now);
  return reward;
}

/** 介面用：剩幾耐（ms） */
export function encounterTimeLeft(meta: AncestryMeta, now: number): number {
  const e = meta.encounter;
  if (e?.active) return Math.max(0, e.active.deadline - now);
  if (e?.offer) return Math.max(0, e.offer.at + ENCOUNTER_OFFER_HOURS * HOUR - now);
  return 0;
}

export function formatTimeLeft(ms: number): string {
  const h = Math.floor(ms / HOUR);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d} 日 ${h % 24} 個鐘`;
  if (h >= 1) return `${h} 個鐘`;
  return `${Math.max(1, Math.ceil(ms / 60_000))} 分鐘`;
}
