import { produce } from 'immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  playerCombatTurn,
  getPlayerMoves,
  resolveCombatDisposition,
  setCombatInternalMode,
  type CombatFoeDisposition,
} from '@core/life/combat';
import { buildLifeSummary } from '@core/life/summary';
import {
  displayChoiceText,
  sanitizePlayerLine,
  sanitizePlayerLines,
  partitionStoryAndDeltas,
  hasLearnSkillContent,
} from '@core/life/playerText';
import { BASIC_STRIKE } from '@data/skills/catalog';
import { schedulePersist } from '../persistSchedule';
import type { LifeStore } from '../lifeStore';

export function createCombatSlice(
  set: (partial: Partial<LifeStore>) => void,
  get: () => LifeStore,
  save: (state: LifeGameState, immediate?: boolean) => void,
): Pick<LifeStore, 'combatMove' | 'combatSetInternalMode' | 'combatResolveFoe'> {
  return {
    combatMove: (moveId: string) => {
      const { state } = get();
      if (!state?.pendingCombat || state.pendingCombat.phase !== 'player') return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        logs = playerCombatTurn(draft, moveId);
      });
      const combat = next.pendingCombat;
      const resolving = combat?.phase === 'resolve';
      const fled = logs.some((l) => /逃離成功/.test(l));
      const ended = !combat;
      const moveName =
        getPlayerMoves(state).find((m) => m.id === moveId)?.name ??
        (moveId === BASIC_STRIKE.id ? BASIC_STRIKE.name : displayChoiceText(moveId));
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
