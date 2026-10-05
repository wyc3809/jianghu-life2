import type { LifeGameState } from '@interfaces/lifeEngine';
import { currentGoal, type GoalAction } from '@core/life/goals';
import { effectiveCultivationRate } from '@core/life/cultivation';
import { sparSavedStage, sparStageReward } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';
import { idleSilverCap, idleSilverPending, idleSilverPerHour } from '@core/life/idleHarvest';

type Props = {
  state: LifeGameState;
  onAction: (action: GoalAction) => void;
  /** 撳「收成」 */
  onHarvest: () => void;
  busy?: boolean;
};

/**
 * 主畫面「當前目標」＋「掛機收益」（design/agreed-design-2026-10.md §5）。
 * 放喺演武台下面；演武台本身唔郁。
 */
export function InkHomeGoals({ state, onAction, onHarvest, busy }: Props) {
  const goal = currentGoal(state);
  const rate = effectiveCultivationRate(state);
  const stage = sparSavedStage(state);
  const reward = sparStageReward(stage);
  const pending = Math.floor(idleSilverPending(state));
  const cap = idleSilverCap(state);
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
      <div className="ink-idle-row">
        <dl className="ink-idle">
          <div>
            <dt>掛機修為</dt>
            <dd>＋{rate.toFixed(2)}／秒</dd>
          </div>
          <div>
            <dt>掛機銀兩</dt>
            <dd>＋{idleSilverPerHour(state).toFixed(1)}／時</dd>
          </div>
          <div>
            <dt>演武每關</dt>
            <dd>
              銀＋{reward.silver} · 修＋{reward.xp}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          className={`ink-harvest${pending >= cap ? ' is-full' : ''}`}
          disabled={busy || pending < 1}
          onClick={onHarvest}
          aria-label={`收成銀兩 ${pending}`}
        >
          <span className="ink-harvest-label">收成</span>
          <span className="ink-harvest-num">
            {pending.toLocaleString('zh-Hant')}
            <small>／{cap.toLocaleString('zh-Hant')}</small>
          </span>
        </button>
      </div>
    </section>
  );
}
