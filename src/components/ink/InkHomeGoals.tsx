import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { currentGoal, type GoalAction } from '@core/life/goals';
import { effectiveCultivationRate } from '@core/life/cultivation';
import { sparSavedStage, sparStageReward } from '@core/life/sparDuel';
import { InkBrushBar } from './InkBrush';
import { InkIcon } from './InkIcon';
import { idleSilverCap, idleSilverPending, idleSilverPerHour } from '@core/life/idleHarvest';

type Props = {
  state: LifeGameState;
  onAction: (action: GoalAction) => void;
  /** 撳「收成」 */
  onHarvest: () => void;
  busy?: boolean;
  section?: 'task' | 'harvest';
};

/**
 * 主畫面「當前目標」＋「掛機收益」（design/agreed-design-2026-10.md §5）。
 * 收益放喺演武台上方；目標喺演武台下方，詳情可展開。
 */
export function InkHomeGoals({ state, onAction, onHarvest, busy, section }: Props) {
  const goal = currentGoal(state);
  const rate = effectiveCultivationRate(state);
  const stage = sparSavedStage(state);
  const reward = sparStageReward(stage);
  const pending = Math.floor(idleSilverPending(state));
  const cap = idleSilverCap(state);
  const pct = goal.progress ? Math.min(100, (goal.progress.cur / Math.max(1, goal.progress.max)) * 100) : 0;
  const content = (
    <section className="ink-home-goals" aria-label="當前目標與掛機收益">
      {section !== 'harvest' && <div className="ink-goal ink-task-bar" aria-label="任務欄">
        <div className="ink-task-main">
          <details className="ink-task-details" key={goal.id}>
            <summary aria-label={`任務詳情：${goal.title}`}>
              <InkIcon name="scroll" size={44} label="任務" className="ink-task-icon" />
              <span className="ink-task-heading">
                <span className="ink-goal-kicker">{goal.kicker}</span>
                <span className="ink-goal-title">{goal.title}</span>
              </span>
              <span className="ink-task-chevron" aria-hidden>⌃</span>
            </summary>
            <div className="ink-task-popover">
              <p className="ink-task-full-title">{goal.title}</p>
              <p className="ink-goal-detail">{goal.detail}</p>
            </div>
          </details>
          {goal.progress && (
            <div className="ink-goal-progress">
              <InkBrushBar pct={pct} tone="ink" />
              <span>{goal.progress.cur.toLocaleString('zh-Hant')} / {goal.progress.max.toLocaleString('zh-Hant')}</span>
            </div>
          )}
        </div>
        {goal.action && (
          <button type="button" className="ink-goal-btn" disabled={busy}
            onClick={() => onAction(goal.action!)}>
            {goal.actionLabel}
          </button>
        )}
      </div>}
      {section !== 'task' && <div className="ink-idle-row">
        <dl className="ink-idle">
          <div>
            <dt><InkIcon name="censer" size={18} />掛機修為</dt>
            <dd>＋{rate.toFixed(2)}／秒</dd>
          </div>
          <div>
            <dt><InkIcon name="silver" size={18} />掛機銀兩</dt>
            <dd>＋{idleSilverPerHour(state).toFixed(1)}／時</dd>
          </div>
          <div>
            <dt><InkIcon name="swords" size={18} />演武每關</dt>
            <dd>
              <span>銀＋{reward.silver}</span><span>修＋{reward.xp}</span>
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
      </div>}
    </section>
  );
  return section === 'task'
    ? createPortal(<div className="ink-home-focus ink-task-dock">{content}</div>, document.body)
    : content;
}
