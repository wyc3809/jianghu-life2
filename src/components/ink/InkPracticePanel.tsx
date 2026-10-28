import type { LifeGameState } from '@interfaces/lifeEngine';
import { PRACTICE_ACTIONS, SECT_INNER_ACTIONS, SECT_DEFS, ART_DEFS, fineForgeCost, practiceBlockReason, fullHealCost, sectDonateCost, type PracticeAction, type PracticeActionId } from '@core/life/actions';
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
  const blocked=practiceBlockReason(state,act.id);
  if(blocked)return blocked;
  if (act.id === 'heal_full') return `費銀${fullHealCost(c)}兩，氣血回滿`;
  if (act.id === 'forge_fine') return `費銀${fineForgeCost(state)}兩，境界越高越易出好兵器`;
  if (act.id === 'sect_donate') {
    return Number(c.flags.sect_donate_month ?? -1) === c.stats.monthsLived ? '本月已捐' : `費銀${sectDonateCost(c)}兩，必得晉升；每月一次`;
  }
  return act.hint;
}

function RowIcon({ icon, label }: { icon?: InkAiAssetId; label: string }) {
  return <InkBadge src={motifBadgeIconUrl(icon)} label={label} size={64} className="ink-row-badge" />;
}

type Props = {
  state: LifeGameState;
  view: PracticeView;
  onView: (v: PracticeView) => void;
  practiceLeft: number;
  busy: boolean;
  onPractice: (actionId: PracticeActionId, opts?: { sectId?: string; artId?: string }) => void;
};

export function InkPracticePanel({ state, view, onView, practiceLeft, busy, onPractice }: Props) {
  const c = state.character;
  const sect = c.sectId ? state.sects[c.sectId] : null;

  return (
    <section key="practice" className="ink-panel ink-practice ink-tab-pane">
      {view === 'main' && (
        <>
          <h3>修煉</h3>
          <p className="ink-note">
            本月可修煉 {practiceLeft}/3 次。苦練、運功與淬體可累積成長；不合條件的操作不扣次數。
          </p>
          <div className="ink-practice-grid">
            <button
              type="button"
              className="ink-practice-btn ink-practice-btn--sect ink-practice-btn--icon"
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
            {PRACTICE_ACTIONS.map((act) => (
              <button
                key={act.id}
                type="button"
                className="ink-practice-btn ink-practice-btn--icon"
                disabled={busy || Boolean(practiceBlockReason(state,act.id))}
                onClick={() => {
                  onPractice(act.id);
                }}
              >
                <RowIcon icon={PRACTICE_ICON[act.id]} label={act.label} />
                <span className="ink-practice-btn-text">
                  <strong>{act.label}</strong>
                  <span>{actionHint(act, state)}</span>
                </span>
              </button>
            ))}
          </div>
          {practiceLeft <= 0 && (
            <p className="ink-note ink-note--warn">本月修煉已盡，按下方圓鈕過一月。</p>
          )}
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
          {!sect ? (
            <>
              <p className="ink-note">各門派有不同的入門條件，符合條件後可拜師。</p>
              <div className="ink-practice-grid">
                {SECT_DEFS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ink-practice-btn"
                    disabled={busy || Boolean(practiceBlockReason(state,'join_sect',{sectId:s.id}))}
                    onClick={() => {
                      onPractice('join_sect', { sectId: s.id });
                      onView('main');
                    }}
                  >
                    <strong>{s.name}</strong>
                    <span>
                      {practiceBlockReason(state,'join_sect',{sectId:s.id}) ?? s.hint}
                      {natureGateHint(s.natureGate) ? ` · ${natureGateHint(s.natureGate)}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="ink-note">完成門派差事、比武或靜修可提升門派地位，逐步解鎖四套門派武學。</p>
              <ul className="ink-skill-list ink-sect-progress">
                {describeSectProgress(state).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="ink-practice-grid">
                {SECT_INNER_ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    className="ink-practice-btn"
                    disabled={busy || Boolean(practiceBlockReason(state,act.id))}
                    onClick={() => {
                      onPractice(act.id);
                    }}
                  >
                    <strong>{act.label}</strong>
                    <span>{actionHint(act, state)}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="ink-practice-btn"
                  disabled={busy}
                  onClick={() => {
                    onPractice('sect_leave');
                    onView('main');
                  }}
                >
                  <strong>離開門派</strong>
                  <span>割席而去，山門內外兩不相干</span>
                </button>
              </div>
            </>
          )}
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
          <p className="ink-note">
            琴棋書畫、佛道邪學可提供不同加成；熟練度達 {ART_MASTERY_THRESHOLD} 可悟對應武功。
          </p>
          <div className="ink-practice-grid">
            {ART_DEFS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="ink-practice-btn"
                disabled={busy}
                onClick={() => {
                  onPractice('study_art', { artId: a.id });
                }}
              >
                <strong>{a.name}</strong>
                <span>
                  {a.hint} · 熟練度 {artProficiency(state, a.id)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="ink-note">披掛與武學詳情，請至「人物」分頁點入查看。</p>
    </section>
  );
}
