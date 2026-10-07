import { produce } from 'immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  playerCombatTurn,
  getPlayerMoves,
  resolveCombatDisposition,
  setCombatInternalMode,
  confirmLifeOrDeath,
  declineLifeOrDeath,
  type CombatFoeDisposition,
} from '@core/life/combat';
import { buildLifeSummary } from '@core/life/summary';
import { runAutoCombat, type AutoCombatResult } from '@core/life/autoCombat';
import {
  displayChoiceText,
  sanitizePlayerLine,
  sanitizePlayerLines,
  partitionStoryAndDeltas,
  hasLearnSkillContent,
  hasRankUpContent,
} from '@core/life/playerText';
import { BASIC_STRIKE } from '@data/skills/catalog';
import { schedulePersist } from '../persistSchedule';
import type { LifeStore } from '../lifeStore';

export function createCombatSlice(
  set: (partial: Partial<LifeStore>) => void,
  get: () => LifeStore,
  save: (state: LifeGameState, immediate?: boolean) => void,
): Pick<
  LifeStore,
  | 'combatMove'
  | 'combatAuto'
  | 'combatAutoCommit'
  | 'combatSetInternalMode'
  | 'combatResolveFoe'
  | 'combatConfirmRisk'
  | 'combatDeclineRisk'
> {
  /** 出招（或者自動戰鬥）之後：更新狀態、印章、結果頁 */
  const applyCombatStep = (state: LifeGameState, next: LifeGameState, logs: string[], moveName: string) => {
    const combat = next.pendingCombat;
    const resolving = combat?.phase === 'resolve';
    const fled = logs.some((l) => /逃離成功/.test(l));
    const ended = !combat;
    const endedParted = ended && !resolving ? partitionStoryAndDeltas(logs) : null;
    set({
      state: next,
      sealText:
        next.phase === 'summary'
          ? '終'
          : resolving
            ? '勝'
            : fled
              ? '遁'
              : ended
                ? logs.some((l) => /敗於|力竭/.test(l))
                  ? '敗'
                  : hasRankUpContent(logs)
                    ? '晉'
                    : hasLearnSkillContent(logs)
                      ? '武'
                      : '勝'
                : null,
      flashLines: ended || resolving ? [] : logs.slice(0, 5),
      lastResult:
        ended && !resolving
          ? {
              title: state.pendingCombat!.title,
              choiceText: moveName,
              feedback: sanitizePlayerLine(
                endedParted?.story ||
                  logs.find((l) => /戰勝|敗於|力竭|逃離/.test(l)) ||
                  logs[logs.length - 1] ||
                  '交手結束。',
              ),
              deltas: sanitizePlayerLines(endedParted?.deltas ?? []),
            }
          : get().lastResult,
    });
    schedulePersist(next, { immediate: ended || resolving || fled });
  };

  return {
    combatConfirmRisk: () => {
      const { state } = get();
      if (!state?.pendingCombat) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = confirmLifeOrDeath(draft);
      });
      if (!logs.length) return;
      set({ state: next, flashLines: logs });
      schedulePersist(next, { immediate: true });
    },

    combatDeclineRisk: () => {
      const { state } = get();
      if (!state?.pendingCombat) return;
      const title = state.pendingCombat.title;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = declineLifeOrDeath(draft);
      });
      if (!logs.length) return;
      set({
        state: next,
        sealText: '遁',
        flashLines: [],
        lastResult: {
          title,
          choiceText: '退避',
          feedback: sanitizePlayerLine(logs[0] ?? '你暫且退避。'),
          deltas: [],
        },
      });
      schedulePersist(next, { immediate: true });
    },

    combatMove: (moveId: string) => {
      const { state } = get();
      if (!state?.pendingCombat || state.pendingCombat.phase !== 'player') return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = playerCombatTurn(draft, moveId);
      });
      const moveName =
        getPlayerMoves(state).find((m) => m.id === moveId)?.name ??
        (moveId === BASIC_STRIKE.id ? BASIC_STRIKE.name : displayChoiceText(moveId));
      applyCombatStep(state, next, logs, moveName);
    },

    combatAuto: () => {
      const { state } = get();
      if (!state?.pendingCombat || state.pendingCombat.phase !== 'player' || get().combatReplay) return;
      let result: AutoCombatResult | null = null;
      const next = produce(state, (draft) => {
        result = runAutoCombat(draft);
      });
      if (!result) return;
      const { lines, ...replay } = result as AutoCombatResult;
      // 演出完先套用結果（combatAutoCommit）；中途唔改 state，畫面先可以逐招扣血
      set({ combatReplay: { replay, next, logs: lines } });
    },

    combatAutoCommit: () => {
      const { state, combatReplay } = get();
      if (!state || !combatReplay) return;
      set({ combatReplay: null });
      applyCombatStep(state, combatReplay.next, combatReplay.logs, '自動交手');
    },

    combatSetInternalMode: (modeId: string | null) => {
      const { state } = get();
      if (!state?.pendingCombat || state.pendingCombat.phase !== 'player') return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = setCombatInternalMode(draft, modeId);
      });
      set({
        state: next,
        flashLines: logs,
      });
      schedulePersist(next, { immediate: false });
    },

    combatResolveFoe: (disposition: CombatFoeDisposition) => {
      const { state } = get();
      if (!state?.pendingCombat || state.pendingCombat.phase !== 'resolve') return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = resolveCombatDisposition(draft, disposition);
        if (!draft.character.alive && draft.phase !== 'summary') {
          draft.phase = 'summary';
          draft.summaryText = buildLifeSummary(draft);
        }
      });
      void save(next);
      const labels: Record<CombatFoeDisposition, string> = {
        kill: '殺死',
        release: '放走',
        stun: '擊暈',
        cripple: '廢武功',
      };
      const resolveParted = partitionStoryAndDeltas(logs);
      set({
        state: next,
        sealText: next.phase === 'summary' ? '終' : hasLearnSkillContent(logs) ? '武' : '定',
        flashLines: [],
        lastResult: {
          title: state.pendingCombat.title,
          choiceText: labels[disposition],
          feedback: sanitizePlayerLine(resolveParted.story || logs.join('\n\n')),
          deltas: sanitizePlayerLines(resolveParted.deltas),
        },
      });
    },
  };
}
