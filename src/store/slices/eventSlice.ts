import { produce } from 'immer';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  applyChoice,
  clearDanglingPending,
  lookupEvent,
  resolvePendingEvent,
} from '@core/life/eventEngine';
import { performPracticeAction, practiceActionLabel, type PracticeActionId } from '@core/life/actions';
import { buildLifeSummary } from '@core/life/summary';
import {
  displayChoiceText,
  sanitizePlayerLine,
  sanitizePlayerLines,
  partitionStoryAndDeltas,
  hasLearnSkillContent,
  hasRankUpContent,
} from '@core/life/playerText';
import { pushChronicle } from '@core/life/chronicle';
import { resolveArcVisitLater } from '@core/life/arcs';
import { EVENT_ACTION_POINT_COST, hasEnoughActionPoints, spendActionPoints } from '@core/life/actionPoints';
import { track } from '../../telemetry/events';
import type { LifeStore } from '../lifeStore';

export function createEventSlice(
  set: (partial: Partial<LifeStore>) => void,
  get: () => LifeStore,
  save: (state: LifeGameState, immediate?: boolean) => void,
): Pick<LifeStore, 'choose' | 'dismissEvent' | 'practice'> {
  return {
    choose: (choiceId: string) => {
      const { state } = get();
      if (!state?.pending || state.pendingCombat) return;
      if (!hasEnoughActionPoints(state, EVENT_ACTION_POINT_COST)) return;
      const event = resolvePendingEvent(state) ?? lookupEvent(state.pending.eventId);
      if (!event) {
        const next = produce(state, (draft) => {
          clearDanglingPending(draft);
        });
        void save(next);
        set({ state: next });
        return;
      }
      const choice = event.choices.find((c) => c.id === choiceId);

      let resultLogs: string[] = [];
      let resultFeedback = '';
      let resultDeltas: string[] = [];
      let died = false;

      const next = produce(state, (draft) => {
        if (!draft.character.flags.coach_chose) draft.character.flags.coach_chose = true;
        spendActionPoints(draft, EVENT_ACTION_POINT_COST);
        const r = applyChoice(draft, event, choiceId);
        resultLogs = r.logs;
        resultFeedback = r.feedback;
        resultDeltas = r.deltas;
        died = r.died;
      });

      const startedCombat = Boolean(next.pendingCombat);
      const allLines = [...resultLogs, ...resultDeltas];
      track('choice_made', { eventId: event.id, choiceId });
      if (died || next.phase === 'summary') {
        track('life_death', { cause: String(next.character.flags.death_cause ?? '') });
      }
      if (startedCombat) track('combat_start', { title: next.pendingCombat?.title ?? '' });
      void save(next);
      set({
        state: next,
        sealText:
          died || next.phase === 'summary'
            ? '終'
            : startedCombat
              ? '戰'
              : hasLearnSkillContent(allLines)
                ? '武'
                : '定',
        flashLines: [],
        lastResult: startedCombat
          ? null
          : {
              title: event.title,
              choiceText: displayChoiceText(choice?.text, choiceId),
              feedback: sanitizePlayerLine(resultFeedback) || resultFeedback,
              deltas: sanitizePlayerLines(resultDeltas),
            },
      });
    },

    dismissEvent: () => {
      const { state } = get();
      if (!state?.pending || state.pendingCombat) return;
      let feedback = '';
      let title = '';
      const next = produce(state, (draft) => {
        const eventId = draft.pending!.eventId;
        title = resolvePendingEvent(draft)?.title ?? lookupEvent(eventId)?.title ?? '機緣';
        const arcDelay =
          eventId.startsWith('arc_visit_') && draft.lifeArc
            ? resolveArcVisitLater(draft)
            : [];
        draft.pending = null;
        feedback = arcDelay[0] ?? '你選擇暫避鋒芒，此事輕輕揭過。';
        pushChronicle(draft, [`「${title}」`, feedback]);
      });
      void save(next);
      set({
        state: next,
        sealText: '定',
        lastResult: {
          title,
          choiceText: '暫避鋒芒',
          feedback,
          deltas: [],
        },
      });
    },

    practice: (actionId: PracticeActionId, opts?: { sectId?: string; artId?: string }) => {
      const { state } = get();
      if (!state || state.phase !== 'playing' || !state.character.alive) return;
      let logs: string[] = [];
      const next = produce(state, (draft) => {
        if (!draft.character.flags.coach_practiced) draft.character.flags.coach_practiced = true;
        logs = performPracticeAction(draft, actionId, opts);
        if (!draft.character.alive) {
          draft.phase = 'summary';
          draft.summaryText = buildLifeSummary(draft);
        }
      });
      void save(next);
      const label = practiceActionLabel(actionId, opts);
      const startedCombat = Boolean(next.pendingCombat);
      const parted = partitionStoryAndDeltas(logs);
      set({
        state: next,
        sealText:
          next.phase === 'summary'
            ? '終'
            : startedCombat
              ? '戰'
              : hasRankUpContent(logs)
                ? '晉'
                : hasLearnSkillContent(logs)
                  ? '武'
                  : '煉',
        flashLines: [],
        lastResult: startedCombat
          ? null
          : {
              title: '修煉',
              choiceText: label,
              feedback: parted.story || sanitizePlayerLine(logs[0] ?? '事畢。'),
              deltas: parted.deltas,
            },
      });
    },
  };
}
