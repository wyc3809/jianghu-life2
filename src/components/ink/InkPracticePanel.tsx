import type { LifeGameState } from '@interfaces/lifeEngine';
import { PRACTICE_ACTIONS, SECT_INNER_ACTIONS, SECT_DEFS, ART_DEFS, fineForgeCost, practiceBlockReason, fullHealCost, sectDonateCost, type PracticeAction, type PracticeActionId } from '@core/life/actions';
import { dailyPracticeLeft, DAILY_PRACTICE_EXHAUSTED, DAILY_PRACTICE_LIMIT } from '@core/life/dailyPractice';
import { natureGateHint } from '@core/life/nature';
import { describeSectProgress } from '@core/life/sectStanding';
import { artProficiency, ART_MASTERY_THRESHOLD } from '@core/life/arts';
import type { InkAiAssetId } from '../../ui/inkAiCatalog';
import { motifBadgeIconUrl } from '../../ui/inkIcons';
import { InkBadge } from './InkBadge';

export type PracticeView = 'main' | 'sect' | 'arts';

const PRACTICE_ICON: Partial<Record<PracticeActionId, InkAiAssetId>> = {
  train_martial: 'motif-sword',
  train_internal: 'motif-scroll',
  drink_wine: 'motif-wine-banner',
  seek_child: 'motif-lantern',
  designate_heir: 'motif-jade',
  equip_best: 'motif-sword',
  forge_fine: 'motif-sword',
  heal_full: 'motif-lantern',
};

/** 有價錢嘅項目顯示實際費用（審計 B4） */
function actionHint(act: PracticeAction, state: LifeGameState): string {
  const c = state.character;
  if (act.id === 'heal_full') return `費銀${fullHealCost(c)}兩，氣血回滿`;
  if (act.id === 'forge_fine') return `費銀${fineForgeCost(state)}兩，境界越高越易出好兵器`;
  if (act.id === 'sect_donate') {
    return `費銀${sectDonateCost(c)}兩，必得晉升。每日一次`;
  }
  return act.hint;
}

function actionBlockHint(reason: string | null): string | null {
  return reason === DAILY_PRACTICE_EXHAUSTED ? null : reason;
}

function RowIcon({ icon, label }: { icon?: InkAiAssetId; label: string }) {
  return <InkBadge src={motifBadgeIconUrl(icon)} label={label} size={64} className="ink-row-badge" />;
}

type Props = {
  state: LifeGameState;
  view: PracticeView;
  onView: (v: PracticeView) => void;
  day: string;
  busy: boolean;
  onPractice: (actionId: PracticeActionId, opts?: { sectId?: string; artId?: string }) => void;
};

/** 共用拜師同門務。江湖地圖同修煉用同一套條件、操作同職位資料。 */
export function InkSectMembership({ state, day, busy, onPractice, onAffiliationChange }: Pick<Props, 'state' | 'day' | 'busy' | 'onPractice'> & {
  onAffiliationChange?: () => void;
}) {
  const sectId = state.character.sectId;
  const sect = sectId ? state.sects[sectId] : null;
  const quota = <p className="ink-note">今日修煉餘 {dailyPracticeLeft(state, day)}／{DAILY_PRACTICE_LIMIT} 次 · 每日香港時間 04:00 重置</p>;
  const leaveReason = sect ? practiceBlockReason(state, 'sect_leave', undefined, day) : null;
  return !sect ? (
    <>
      {quota}
      <p className="ink-note">各門派有不同的入門條件，符合條件後可拜師。</p>
      <div className="ink-practice-grid">
        {SECT_DEFS.map(s => {
          const reason = practiceBlockReason(state, 'join_sect', { sectId: s.id }, day);
          const gate = natureGateHint(s.natureGate);
          return <button
            key={s.id}
            type="button"
            className="ink-practice-btn"
            disabled={busy || Boolean(reason)}
            onClick={() => {
              onPractice('join_sect', { sectId: s.id });
              onAffiliationChange?.();
            }}
          >
            <strong>{s.name}</strong>
            <span>{actionBlockHint(reason) ?? [s.hint, gate].filter(Boolean).join(' · ')}</span>
          </button>;
        })}
      </div>
    </>
  ) : (
    <>
      {quota}
      <p className="ink-note">完成門派差事、比武或靜修可提升門派地位，逐步解鎖四套門派武學。</p>
      <ul className="ink-skill-list ink-sect-progress">
        {describeSectProgress(state).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="ink-practice-grid">
        {SECT_INNER_ACTIONS.map(act => {
          const blocked = practiceBlockReason(state, act.id, undefined, day);
          return <button
            key={act.id}
            type="button"
            className="ink-practice-btn"
            disabled={busy || Boolean(blocked)}
            onClick={() => {
              onPractice(act.id);
            }}
          >
            <strong>{act.label}</strong>
            <span>{actionBlockHint(blocked) ?? actionHint(act, state)}</span>
          </button>;
        })}
        <button
          type="button"
          className="ink-practice-btn"
          disabled={busy || Boolean(leaveReason)}
          onClick={() => {
            onPractice('sect_leave');
            onAffiliationChange?.();
          }}
        >
          <strong>離開門派</strong>
          <span>{actionBlockHint(leaveReason) ?? '割席而去，山門內外兩不相干'}</span>
        </button>
      </div>
    </>
  );
}

export function InkPracticePanel({ state, view, onView, day, busy, onPractice }: Props) {
  const c = state.character;
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const quota = <p className="ink-note">今日修煉餘 {dailyPracticeLeft(state, day)}／{DAILY_PRACTICE_LIMIT} 次 · 每日香港時間 04:00 重置</p>;

  return (
    <section key="practice" className="ink-panel ink-practice ink-tab-pane">
      {view === 'main' && (
        <>
          <h3>修煉</h3>
          {quota}
          <div className="ink-practice-grid">
            <button
              type="button"
              className="ink-practice-btn ink-practice-btn--sect ink-practice-btn--icon"
              aria-label="門派"
              disabled={busy}
              onClick={() => {
                onView('sect');
              }}
            >
              <RowIcon icon="motif-mountain-gate" label="門派" />
              <span className="ink-practice-btn-text">
                <strong>門派</strong>
                <span>{sect ? `${sect.name} · 進入門中` : '尚未入派 · 擇門拜師'}</span>
              </span>
            </button>
            <button
              type="button"
              className="ink-practice-btn ink-practice-btn--sect ink-practice-btn--icon"
              aria-label="修習雅藝"
              disabled={busy}
              onClick={() => {
                onView('arts');
              }}
            >
              <RowIcon icon="motif-scroll" label="修習雅藝" />
              <span className="ink-practice-btn-text">
                <strong>修習雅藝</strong>
                <span>琴棋書畫、佛道邪學，各憑機緣</span>
              </span>
            </button>
            {PRACTICE_ACTIONS.map(act => {
              const blocked = practiceBlockReason(state, act.id, undefined, day);
              const hint = actionBlockHint(blocked) ?? actionHint(act, state);
              return <button
                key={act.id}
                type="button"
                className="ink-practice-btn ink-practice-btn--icon"
                aria-label={`${act.label}：${hint}`}
                disabled={busy || Boolean(blocked)}
                onClick={() => {
                  onPractice(act.id);
                }}
              >
                <RowIcon icon={PRACTICE_ICON[act.id]} label={act.label} />
                <span className="ink-practice-btn-text">
                  <strong>{act.label}</strong>
                  <span>{hint}</span>
                </span>
              </button>;
            })}
          </div>
        </>
      )}

      {view === 'sect' && (
        <>
          <div className="ink-sect-head">
            <h3>{sect ? sect.name : '擇門拜師'}</h3>
            <button type="button" className="ink-btn ink-btn--quiet" onClick={() => onView('main')}>
              返回
            </button>
          </div>
          <InkSectMembership state={state} day={day} busy={busy} onPractice={onPractice} onAffiliationChange={() => onView('main')} />
        </>
      )}

      {view === 'arts' && (
        <>
          <div className="ink-sect-head">
            <h3>修習雅藝</h3>
            <button type="button" className="ink-btn ink-btn--quiet" onClick={() => onView('main')}>
              返回
            </button>
          </div>
          {quota}
          <p className="ink-note">
            琴棋書畫、佛道邪學可提供不同加成；熟練度達 {ART_MASTERY_THRESHOLD} 可悟對應武功。
          </p>
          <div className="ink-practice-grid">
            {ART_DEFS.map(a => {
              const blocked = practiceBlockReason(state, 'study_art', { artId: a.id }, day);
              return <button
                key={a.id}
                type="button"
                className="ink-practice-btn"
                disabled={busy || Boolean(blocked)}
                onClick={() => {
                  onPractice('study_art', { artId: a.id });
                }}
              >
                <strong>{a.name}</strong>
                <span>
                  {actionBlockHint(blocked) ?? `${a.hint} · 熟練度 ${artProficiency(state, a.id)}`}
                </span>
              </button>;
            })}
          </div>
        </>
      )}

    </section>
  );
}
