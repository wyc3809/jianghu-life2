import type { LifeGameState } from '@interfaces/lifeEngine';
import { PRACTICE_ACTIONS, SECT_INNER_ACTIONS, SECT_DEFS, type PracticeActionId } from '@core/life/actions';
import { natureGateHint } from '@core/life/nature';
import { practiceLearningHints } from '@core/life/jianghuHints';
import { describeSectProgress } from '@core/life/sectStanding';
import { inkAiUrl, type InkAiAssetId } from '../../ui/inkAiCatalog';

export type PracticeView = 'main' | 'sect';

const PRACTICE_ICON: Partial<Record<PracticeActionId, InkAiAssetId>> = {
  train_martial: 'motif-sword',
  train_internal: 'motif-scroll',
  inquire_rumors: 'motif-umbrella',
  drink_wine: 'motif-wine-banner',
  seek_child: 'motif-lantern',
  designate_heir: 'motif-jade',
  equip_best: 'motif-sword',
};

function RowIcon({ icon }: { icon?: InkAiAssetId }) {
  return icon ? (
    <img className="ink-row-icon" src={inkAiUrl(icon)} alt="" aria-hidden decoding="async" />
  ) : (
    <span className="ink-row-dot" aria-hidden />
  );
}

type Props = {
  state: LifeGameState;
  view: PracticeView;
  onView: (v: PracticeView) => void;
  practiceLeft: number;
  busy: boolean;
  onPractice: (actionId: PracticeActionId, opts?: { sectId?: string }) => void;
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
            本月可煉 {practiceLeft}/3 次。多問風聲，翻頁易逢奇人；苦練、鑄兵、尋訪，亦在歲月裡。
          </p>
          {practiceLearningHints(state).map((h) => (
            <p key={h} className="ink-note ink-hint-learn">
              {h}
            </p>
          ))}
          <div className="ink-practice-grid">
            <button
              type="button"
              className="ink-practice-btn ink-practice-btn--sect ink-practice-btn--icon"
              disabled={busy}
              onClick={() => {
                onView('sect');
              }}
            >
              <RowIcon icon="motif-mountain-gate" />
              <span className="ink-practice-btn-text">
                <strong>門派</strong>
                <span>{sect ? `${sect.name} · 進入門中` : '尚未入派 · 擇門拜師'}</span>
              </span>
            </button>
            {PRACTICE_ACTIONS.map((act) => (
              <button
                key={act.id}
                type="button"
                className="ink-practice-btn ink-practice-btn--icon"
                disabled={busy}
                onClick={() => {
                  onPractice(act.id);
                }}
              >
                <RowIcon icon={PRACTICE_ICON[act.id]} />
                <span className="ink-practice-btn-text">
                  <strong>{act.label}</strong>
                  <span>{act.hint}</span>
                </span>
              </button>
            ))}
          </div>
          {practiceLeft <= 0 && (
            <p className="ink-note ink-note--warn">本月修煉已盡，請回「鎮居」翻過一頁。</p>
          )}
        </>
      )}

      {view === 'sect' && (
        <>
          <div className="ink-sect-head">
            <h3>{sect ? sect.name : '擇門拜師'}</h3>
            <button type="button" className="ink-btn ink-btn--quiet" onClick={() => onView('main')}>
              回門
            </button>
          </div>
          {!sect ? (
            <>
              <p className="ink-note">各派門風不同，拜入與否，看你當下根基與來意。</p>
              <div className="ink-practice-grid">
                {SECT_DEFS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ink-practice-btn"
                    disabled={busy}
                    onClick={() => {
                      onPractice('join_sect', { sectId: s.id });
                      onView('main');
                    }}
                  >
                    <strong>{s.name}</strong>
                    <span>
                      {s.hint}
                      {natureGateHint(s.natureGate) ? ` · ${natureGateHint(s.natureGate)}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="ink-note">既入師門，差事、比武、靜修皆可磨礪身心；地位提升可傳四套門中武學。</p>
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
                    disabled={busy}
                    onClick={() => {
                      onPractice(act.id);
                    }}
                  >
                    <strong>{act.label}</strong>
                    <span>{act.hint}</span>
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

      <p className="ink-note">披掛與武學詳情，請至「人物」分頁點入查看。</p>
    </section>
  );
}
