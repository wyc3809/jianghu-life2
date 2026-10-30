import { useEffect, useRef } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { coachHintFlag, type CoachHint } from '@core/life/coachHints';
import { useLifeStore } from '../store/lifeStore';

/** 本次展示保持到離場或步驟改變；已讀旗標立即保存，重新進入不再展示。 */
export function useOnceCoach(state: LifeGameState, hint: CoachHint | null): boolean {
  const markSeen = useLifeStore(s => s.markCoachSeen);
  const seen = hint ? state.character.flags[coachHintFlag(hint)] : false;
  const visit = useRef<{ seed: number; hint: CoachHint } | null>(null);
  if (!hint || state.character.flags.coach_done) visit.current = null;
  else if (visit.current?.seed !== state.seed || visit.current.hint !== hint) {
    visit.current = seen ? null : { seed: state.seed, hint };
  }
  const visible = Boolean(visit.current);
  useEffect(() => { if (visible && hint && !seen) markSeen(hint); }, [visible, hint, markSeen, seen, state.seed]);
  return visible;
}
