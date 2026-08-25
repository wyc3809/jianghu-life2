import { produce } from 'immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createNewLife, migrateLifeState, syncRngFromState, type CreateLifeOptions } from '@core/life/gameState';
import {
  clearDanglingPending,
  resolvePendingEvent,
  startMonth,
} from '@core/life/eventEngine';
import { clearLifeSave, loadLifeSave } from '@core/life/saveIndexedDb';
import {
  flushPersist,
  installPersistLifecycle,
  setPersistFlushHook,
} from '../persistSchedule';
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
import { sanitizePlayerLine, sanitizePlayerLines } from '@core/life/playerText';
import {
  applyOfflineCultivation,
  attemptCultivationBreakthrough,
  tickCultivation as tickCultivationCore,
} from '@core/life/cultivation';
import { track } from '../../telemetry/events';
import type { LifeStore } from '../lifeStore';

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
  | 'dismissCoach'
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
  | 'attemptBreakthrough'
  | 'clearOfflineGain'
> {
  return {
    bootstrap: async () => {
      if (get().bootstrapped) return;
      setPersistFlushHook((savedAt) => {
        set({ saveLabel: new Date(savedAt).toLocaleString('zh-TW') });
      });
      installPersistLifecycle();
      set({ bootstrapped: true });
    },

    beginCreate: () => set({ creating: true }),
    cancelCreate: () => set({ creating: false }),

    newLife: (opts?: CreateLifeOptions | number) => {
      const state = createNewLife(opts);
      void save(state);
      track('life_create', {
        seed: state.seed,
        hasLegacy: Boolean(typeof opts === 'object' && opts && 'legacy' in opts && opts.legacy),
      });
      set({
        state,
        creating: false,
        saveLabel: new Date().toLocaleString('zh-TW'),
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
      if (!legacy.hadChildren) {
        track('life_end_no_heir', { generation: legacy.generation });
        flushPersist();
        void clearLifeSave();
        set({
          state: null,
          creating: true,
          saveLabel: null,
          sealText: null,
          flashLines: [],
          lastResult: null,
        });
        return;
      }
      track('life_reincarnate', {
        generation: legacy.generation,
        family: legacy.familyLegacy,
        teacher: legacy.teacherLegacy,
      });
      get().newLife({ legacy });
    },

    continueLife: async () => {
      const loaded = await loadLifeSave();
      if (!loaded) return false;
      const state = migrateLifeState(loaded.state);
      syncRngFromState(state);
      track('life_resume', { age: state.character.age });
      const elapsedMs = Date.now() - loaded.savedAt;
      const offline = applyOfflineCultivation(state, elapsedMs);
      if (offline.gainedXp > 0) {
        track('cultivation_offline_gain', {
          gainedXp: Math.round(offline.gainedXp),
          countedSeconds: Math.round(offline.countedSeconds),
        });
        void save(state);
      }
      set({
        state,
        creating: false,
        saveLabel: new Date(loaded.savedAt).toLocaleString('zh-TW'),
        sealText: null,
        flashLines: [],
        lastResult: null,
        offlineGainXp: offline.gainedXp > 0 ? Math.round(offline.gainedXp) : null,
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
      if (get().lastResult) set({ lastResult: null });
      const next = produce(current, (draft) => {
        if (!draft.character.flags.coach_flipped) draft.character.flags.coach_flipped = true;
        startMonth(draft);
      });
      if (next.phase === 'summary') {
        track('life_death', { cause: String(next.character.flags.death_cause ?? '') });
      } else {
        track('month_advance', { month: next.month, age: next.character.age });
      }
      void save(next);
      set({
        state: next,
        sealText: next.phase === 'summary' ? '終' : '月',
        flashLines: [],
      });
    },

    advanceYear: () => get().advanceMonth(),

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
      });
      save(next, false);
      set({ state: next });
    },

    attemptBreakthrough: () => {
      const { state } = get();
      if (!state) return;
      let success = false;
      let lines: string[] = [];
      const next = produce(state, (draft) => {
        const result = attemptCultivationBreakthrough(draft);
        success = result.success;
        lines = result.lines;
      });
      void save(next);
      track('cultivation_breakthrough', { success });
      set({
        state: next,
        sealText: success ? '晉' : '傷',
        flashLines: [],
        lastResult: {
          title: success ? '突破關口' : '走火入魔',
          choiceText: '閉關突破',
          feedback: sanitizePlayerLine(lines.join('\n')),
          deltas: [],
        },
      });
    },

    clearOfflineGain: () => set({ offlineGainXp: null }),
  };
}
