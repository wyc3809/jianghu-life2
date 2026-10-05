import type { LifeGameState } from '@interfaces/lifeEngine';
import { currentGoal, type GoalAction } from '@core/life/goals';
import { effectiveCultivationRate } from '@core/life/cultivation';
import { sparSavedStage, sparStageReward } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';

type Props = {
  state: LifeGameState;
  onAction: (action: GoalAction) => void;
  busy?: boolean;
};

/**
 * 主畫面「當前目標」＋「掛機收益」（design/agreed-design-2026-10.md §5）。
 * 放喺演武台下面；演武台本身唔郁。
 */
export function InkHomeGoals({ state, onAction, busy }: Props) {
  const goal = currentGoal(state);
  const rate = effectiveCultivationRate(state);
  const stage = sparSavedStage(state);
  const reward = sparStageReward(stage);
  const pct = goal.progress ? Math.min(100, (goal.progress.cur / Math.max(1, goal.progress.max)) * 100) : 0;
  return (
    <section className="ink-home-goals" aria-label="當前目標與掛機收益">
      <div className="ink-goal">
        <div className="ink-goal-text">
          <p className="ink-goal-kicker">{goal.kicker}</p>
          <p className="ink-goal-title">{goal.title}</p>
          <p className="ink-goal-detail">{goal.detail}</p>
          {goal.progress && (
            <div className="ink-goal-progress">
              <InkBrushBar pct={pct} tone="ink" />
              <span>
                {goal.progress.cur.toLocaleString('zh-Hant')} / {goal.progress.max.toLocaleString('zh-Hant')}
              </span>
            </div>
          )}
        </div>
        {goal.action && (
          <button
            type="button"
            className="ink-goal-btn"
            disabled={busy}
            onClick={() => onAction(goal.action!)}
          >
            {goal.actionLabel}
          </button>
        )}
      </div>
      <dl className="ink-idle">
        <div>
          <dt>掛機修為</dt>
          <dd>＋{rate.toFixed(2)}／秒</dd>
        </div>
        <div>
          <dt>演武每關</dt>
          <dd>
            銀兩＋{reward.silver} · 修為＋{reward.xp}
          </dd>
        </div>
        <div>
          <dt>離線</dt>
          <dd>最多計 48 小時</dd>
        </div>
      </dl>
    </section>
  );
}
