import { useAncestryStore } from '../ancestryStore';
import { BREAKTHROUGH_FIRST_JADE, BREAKTHROUGH_JADE_STEP } from '@data/redesign/martialEconomyParams';
import { settleSparTraining } from '@core/life/sparTraining';
import { accrueIdleSilver, harvestIdleSilver } from '@core/life/idleHarvest';
import { addJadePending } from '@core/life/jadePending';
import { JADE_PER_SPAR_SCENE } from '@data/redesign/testParams';
import { produce } from 'immer';
import { shiftMoment } from '@core/life/moments';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createNewLife, migrateLifeState, syncRngFromState, type CreateLifeOptions } from '@core/life/gameState';
import {
  clearDanglingPending,
  resolvePendingEvent,
  startMonth,
} from '@core/life/eventEngine';
import { loadLifeSave } from '@core/life/saveIndexedDb';
import { installPersistLifecycle } from '../persistSchedule';
import {
  startHuashanBracket,
  dismissHuashanReport,
  clearCompletedHuashan,
  runPlayerHuashanDuel,
} from '@core/life/huashan';
import {
  foundSect as foundSectAction,
  recruitDisciple as recruitDiscipleAction,
  teachDisciple as teachDiscipleAction,
} from '@core/life/foundedSect';
import { extractLegacy } from '@core/life/legacy';
import { loadAncestry } from '../ancestryMeta';
import { sanitizePlayerLine, sanitizePlayerLines } from '@core/life/playerText';
import {
  applyOfflineCultivation,
  attemptCultivationBreakthrough,
  grantSparCultivation,
  tickCultivation as tickCultivationCore,
  type BreakthroughResult,
} from '@core/life/cultivation';
import { hasEnoughActionPoints, tickActionPoints } from '@core/life/actionPoints';
import { track } from '../../telemetry/events';
import { sparStageClearXp, sparStageReward } from '@core/life/sparDuel';
import { canRetire, retireLife, RETIRE_CAUSE } from '@core/life/retire';
import { addCultivationXp } from '@core/life/cultivation';
import type { LifeStore } from '../lifeStore';

/** 由新一世開局年譜抽出接班相關嘅句（前世、承祧／血脈、銀庫、裝備庫、祖蔭） */
export function successionLines(lifeLog: string[]): string[] {
  return lifeLog.filter((l) => /^前世「|承祧|血脈未斷|家族銀庫|家族裝備庫|^祖蔭：/.test(l));
}

export function createProgressionSlice(
  set: (partial: Partial<LifeStore>) => void,
  get: () => LifeStore,
  save: (state: LifeGameState, immediate?: boolean) => void,
): Pick<
  LifeStore,
  | 'bootstrap'
  | 'beginCreate'
  | 'cancelCreate'
  | 'newLife'
  | 'reincarnate'
  | 'continueLife'
  | 'advanceMonth'
  | 'advanceYear'
  | 'retire'
  | 'dismissCoach'
  | 'ackMoment'
  | 'clearResult'
  | 'setTab'
  | 'setDebugOpen'
  | 'importState'
  | 'clearSeal'
  | 'huashanStart'
  | 'huashanFight'
  | 'huashanDismissReport'
  | 'huashanClose'
  | 'foundSect'
  | 'recruitDisciple'
  | 'teachDisciple'
  | 'tickCultivation'
  | 'sparStrike'
  | 'sparFoeDefeated'
  | 'sparStageClear'
  | 'sparSetStage'
  | 'sparSyncHealth'
  | 'attemptBreakthrough'
  | 'clearBreakthroughResult'
  | 'clearOfflineGain'
  | 'clearSuccession'
  | 'harvestIdle'
> {
  return {
    bootstrap: async () => {
      if (get().bootstrapped) return;
      installPersistLifecycle();
      set({ bootstrapped: true });
    },

    beginCreate: () => set({ creating: true }),
    cancelCreate: () => set({ creating: false }),

    newLife: (opts?: CreateLifeOptions | number) => {
      // 帳戶祖蔭（天賦＋家傳武學）每一世都套用
      const base: CreateLifeOptions = typeof opts === 'number' ? { seed: opts } : (opts ?? {});
      const state = createNewLife({ ...base, ancestry: base.ancestry ?? loadAncestry() });
      void save(state);
      track('life_create', {
        seed: state.seed,
        hasLegacy: Boolean(typeof opts === 'object' && opts && 'legacy' in opts && opts.legacy),
      });
      set({
        state,
        creating: false,
        sealText: '生',
        flashLines: [],
        lastResult: null,
      });
    },

    reincarnate: () => {
      const prev = get().state;
      if (!prev || prev.phase !== 'summary') {
        get().newLife();
        return;
      }
      const legacy = extractLegacy(prev);
      // 無子女都唔會斷：由旁支承祧（design/agreed-design-2026-10.md §1）
      track('life_reincarnate', {
        generation: legacy.generation,
        family: legacy.familyLegacy,
        teacher: legacy.teacherLegacy,
        collateral: Boolean(legacy.collateral),
      });
      get().newLife({ legacy });
      const born = get().state;
      const lines = born ? successionLines(born.lifeLog) : [];
      set({ succession: lines.length ? lines : null });
    },

    continueLife: async () => {
      const loaded = await loadLifeSave();
      if (!loaded) return false;
      const state = migrateLifeState(loaded.state);
      syncRngFromState(state);
      track('life_resume', { year: state.year });
      const elapsedMs = Date.now() - loaded.savedAt;
      const offline = applyOfflineCultivation(state, elapsedMs);
      // 掛機銀兩：同修為一樣最多計 48 小時，入「待收成」
      const offlineSilver = accrueIdleSilver(state, offline.countedSeconds);
      if (offline.gainedXp > 0 || offlineSilver >= 1) {
        track('cultivation_offline_gain', {
          gainedXp: Math.round(offline.gainedXp),
          countedSeconds: Math.round(offline.countedSeconds),
        });
        void save(state);
      }
      set({
        state,
        creating: false,
        sealText: null,
        flashLines: [],
        lastResult: null,
        offlineGain:
          offline.gainedXp > 0 || offlineSilver >= 1
            ? {
                silver: Math.floor(offlineSilver),
                xp: Math.round(offline.gainedXp),
                countedMs: Math.round(offline.countedSeconds * 1000),
                timeCapped: offline.timeCapped,
                tierCapped: offline.tierCapped,
                reserveXp: Math.round(offline.reserveGained),
                reserveCapped: offline.reserveCapped,
              }
            : null,
      });
      return true;
    },

    advanceMonth: () => {
      const { state } = get();
      if (!state || state.pendingCombat || state.phase !== 'playing' || !state.character.alive) return;
      if (state.pending && !resolvePendingEvent(state)) {
        const fixed = produce(state, (draft) => {
          clearDanglingPending(draft);
        });
        void save(fixed);
        set({ state: fixed });
      }
      const current = get().state;
      if (!current || current.pending || current.pendingCombat) return;
      // 氣力（疲勞度）見底唔准翻頁——歇息回氣先好繼續
      if (!hasEnoughActionPoints(current)) return;
      if (get().lastResult) set({ lastResult: null });
      const next = produce(current, (draft) => {
        if (!draft.character.flags.coach_flipped) draft.character.flags.coach_flipped = true;
        startMonth(draft);
      });
      if (next.phase === 'summary') {
        track('life_death', { cause: String(next.character.flags.death_cause ?? '') });
      } else {
        track('month_advance', { month: next.month, year: next.year });
      }
      void save(next);
      set({
        state: next,
        sealText: next.phase === 'summary' ? '終' : '月',
        flashLines: [],
      });
    },

    advanceYear: () => get().advanceMonth(),

    retire: () => {
      const { state } = get();
      if (!state || !canRetire(state).ok) return;
      const next = produce(state, (draft) => {
        retireLife(draft);
      });
      track('life_death', { cause: RETIRE_CAUSE });
      void save(next);
      set({ state: next, sealText: '終', flashLines: [] });
    },

    ackMoment: () => {
      const { state } = get();
      if (!state?.moments?.length) return;
      const next = produce(state, (draft) => {
        shiftMoment(draft);
      });
      void save(next);
      set({ state: next });
    },

    dismissCoach: () => {
      const { state } = get();
      if (!state) return;
      const next = produce(state, (draft) => {
        draft.character.flags.coach_done = true;
      });
      track('coach_dismiss');
      void save(next);
      set({ state: next });
    },

    clearResult: () => set({ lastResult: null, flashLines: [] }),

    setTab: (tab) => {
      const { state } = get();
      if (!state) return;
      set({ state: { ...state, tab } });
    },

    setDebugOpen: (open: boolean) => set({ debugOpen: open }),

    importState: (state: LifeGameState) => {
      const migrated = migrateLifeState(state);
      void save(migrated);
      set({ state: migrated });
    },

    clearSeal: () => set({ sealText: null }),

    huashanStart: () => {
      const { state } = get();
      if (!state) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = startHuashanBracket(draft);
      });
      void save(next);
      set({
        state: next,
        sealText: '劍',
        flashLines: [],
        lastResult: {
          title: '華山論劍',
          choiceText: '持帖報名',
          feedback: sanitizePlayerLine(logs.join('\n')),
          deltas: [],
        },
      });
    },

    huashanFight: () => {
      const { state } = get();
      if (!state?.huashan) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = runPlayerHuashanDuel(draft);
      });
      const won = /晉級|冠軍|告捷/.test(logs.join(''));
      const lost = /止步|敗北/.test(logs.join(''));
      void save(next);
      set({
        state: next,
        sealText: next.huashan?.status === 'completed' ? (won && !lost ? '勝' : '敗') : won ? '勝' : lost ? '敗' : '劍',
        flashLines: [],
        lastResult: {
          title: '華山論劍',
          choiceText: '赴戰',
          feedback: sanitizePlayerLine(logs.slice(-6).join('\n')),
          deltas: sanitizePlayerLines(
            logs.filter((l) => /^名望|^銀兩|^武學|冠軍|四強/.test(l)),
          ),
        },
      });
    },

    huashanDismissReport: () => {
      const { state } = get();
      if (!state) return;
      const next = produce(state, (draft) => {
        dismissHuashanReport(draft);
      });
      void save(next);
      set({ state: next });
    },

    huashanClose: () => {
      const { state } = get();
      if (!state) return;
      const next = produce(state, (draft) => {
        clearCompletedHuashan(draft);
      });
      void save(next);
      set({ state: next });
    },

    foundSect: (sectName: string) => {
      const { state } = get();
      if (!state) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = foundSectAction(draft, sectName);
      });
      void save(next);
      set({
        state: next,
        sealText: next.foundedSect ? '宗' : null,
        flashLines: [],
        lastResult: {
          title: '開宗立派',
          choiceText: '開山立派',
          feedback: sanitizePlayerLine(logs.join('\n')),
          deltas: [],
        },
      });
    },

    recruitDisciple: () => {
      const { state } = get();
      if (!state) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = recruitDiscipleAction(draft);
      });
      void save(next);
      set({
        state: next,
        sealText: '收',
        flashLines: [],
        lastResult: {
          title: '收徒',
          choiceText: '收徒入門',
          feedback: sanitizePlayerLine(logs.join('\n')),
          deltas: [],
        },
      });
    },

    teachDisciple: (discipleId: string) => {
      const { state } = get();
      if (!state) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = teachDiscipleAction(draft, discipleId);
      });
      void save(next);
      set({
        state: next,
        sealText: '教',
        flashLines: [],
        lastResult: {
          title: '指導弟子',
          choiceText: '親自指點',
          feedback: sanitizePlayerLine(logs.join('\n')),
          deltas: [],
        },
      });
    },

    tickCultivation: (deltaSeconds: number) => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return;
      const next = produce(state, (draft) => {
        tickCultivationCore(draft, deltaSeconds);
        tickActionPoints(draft, deltaSeconds);
        accrueIdleSilver(draft, deltaSeconds);
      });
      save(next, false);
      set({ state: next });
    },

    sparFoeDefeated: usedArts => {
      const state=get().state;
      if(!state||state.phase!=='playing'||!state.character.alive)return;
      const next=produce(state,draft=>{settleSparTraining(draft,usedArts);});
      save(next,false);set({state:next});
    },
    sparStrike: () => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return 0;
      let gained = 0;
      const next = produce(state, (draft) => {
        gained = grantSparCultivation(draft);
      });
      if (gained > 0) {
        save(next, false);
        set({ state: next });
      }
      return gained;
    },

    sparStageClear: (clearedStage: number) => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return { silver: 0, xp: 0 };
      const reward = sparStageReward(clearedStage);
      let xp = 0;
      const next = produce(state, (draft) => {
        const c = draft.character;
        c.money += reward.silver;
        const g = addCultivationXp(draft, sparStageClearXp(draft, clearedStage));
        xp = g.toXp + g.toReserve;
        // 演武台每過 10 關（換場景）送免費玉石；每代各自計
        if (clearedStage % 10 === 0 && Number(c.flags.spar_jade_stage ?? 0) < clearedStage) {
          c.flags.spar_jade_stage = clearedStage;
          addJadePending(draft, JADE_PER_SPAR_SCENE);
        }
        c.flags.spar_stage = clearedStage + 1;
      });
      save(next, false);
      set({ state: next });
      track('spar_stage_clear', { stage: clearedStage });
      return { silver: reward.silver, xp };
    },

    sparSyncHealth: (health: number) => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive || state.pendingCombat || !Number.isFinite(health)) return;
      const nextHealth = Math.max(1, Math.min(state.character.maxHealth, Math.round(health)));
      if (nextHealth === state.character.health) return;
      const next = produce(state, (draft) => { draft.character.health = nextHealth; });
      save(next, false);
      set({ state: next });
    },

    sparSetStage: (stage: number) => {
      const { state } = get();
      if (!state) return;
      const next = produce(state, (draft) => {
        draft.character.flags.spar_stage = Math.max(1, Math.floor(stage));
      });
      save(next, false);
      set({ state: next });
    },

    attemptBreakthrough: () => {
      let { state } = get();
      if (!state) return;
      useAncestryStore.getState().checkMilestones();
      state=get().state!;
      const highestBefore = useAncestryStore.getState().meta.economy?.highestTier ?? state.character.cultivation.tier;
      let result: BreakthroughResult = { success: false, lines: [], oldTierName: '' };
      const next = produce(state, (draft) => {
        result = attemptCultivationBreakthrough(draft);
      });
      void save(next);
      track('cultivation_breakthrough', { success: result.success });
      set({
        state: next,
        flashLines: [],
        breakthroughResult: null,
      });
      useAncestryStore.getState().checkMilestones();
      const highestAfter = useAncestryStore.getState().meta.economy?.highestTier ?? highestBefore;
      if(result.success) {
        result.jadeGain = 0;
        for(let tier=highestBefore+1;tier<=highestAfter;tier++)result.jadeGain += BREAKTHROUGH_FIRST_JADE + (tier-1)*BREAKTHROUGH_JADE_STEP;
        if(result.jadeGain)result.lines.push(`首次境界獎勵：免費玉石＋${result.jadeGain}。`);
      }
      set({breakthroughResult:result});
    },

    clearBreakthroughResult: () => set({ breakthroughResult: null }),

    clearOfflineGain: () => set({ offlineGain: null }),
    clearSuccession: () => set({ succession: null }),
    harvestIdle: () => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return 0;
      let got = 0;
      const next = produce(state, (draft) => {
        got = harvestIdleSilver(draft);
      });
      if (got <= 0) return 0;
      save(next);
      set({ state: next });
      return got;
    },
  };
}
