import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { natureKeys, natureLabels } from '@interfaces/lifeEngine';
import { useLifeStore } from '../../store/lifeStore';
import { resolvePendingEvent } from '@core/life/eventEngine';
import { getLifeStageLabel } from '@core/life/stages';
import { seasonLabel } from '@core/life/monthly';
import { overallMartialLabel } from '@core/life/flavor';
import { jianghuHints } from '@core/life/jianghuHints';
import { meetsRequirements } from '@core/life/requirements';
import {
  playInkSeal,
  playInkWin,
  playInkLose,
  playInkPageFlip,
  playInkBlade,
  isInkAudioMuted,
  toggleInkAudioMuted,
} from '../../audio/inkAudio';
import { InkSettingsPanel, type TextScale } from './InkSettingsPanel';
import { topTitles } from '@core/life/titles';
import {
  isLearnSkillDeltaLine,
  isLearnSkillStoryLine,
  isRankUpStoryLine,
  LEARN_SKILL_MARKER,
  RANK_UP_MARKER,
} from '@core/life/playerText';
import { ensureNature, dominantNature, natureSummary } from '@core/life/nature';
import { coachCopy, nextCoachStep } from '@core/life/tutorial';
import { lifeArcStatusLine } from '@core/life/arcs';
import { getAftermathStatus } from '@core/life/combatPresentation';
import { track } from '../../telemetry/events';
import { seasonToInk, placeToInk, isInkNight, shouldReduceInkMotion } from './sceneVariants';
import { InkScrollBackdrop, InkSealStamp, InkResultSeal, InkStaticSeal, InkAiWashLayer } from './InkDecor';
import { INK_SVG } from '../../ui/inkAssets';
import { inkAiUrl } from '../../ui/inkAiCatalog';
import { InkHuashanPanel } from './InkHuashanPanel';
import { InkPersonPanel, type PersonView } from './InkPersonPanel';
import { InkEventPanel } from './InkEventPanel';
import { InkCombatPanel } from './InkCombatPanel';
import { InkPracticePanel, type PracticeView } from './InkPracticePanel';
import { LifeDebugPanel } from '../LifeDebugPanel';

type Props = {
  state: LifeGameState;
};

export function InkPlayScreen({ state }: Props) {
  const choose = useLifeStore((s) => s.choose);
  const dismissEvent = useLifeStore((s) => s.dismissEvent);
  const dismissCoach = useLifeStore((s) => s.dismissCoach);
  const advanceMonth = useLifeStore((s) => s.advanceMonth);
  const reincarnate = useLifeStore((s) => s.reincarnate);
  const practice = useLifeStore((s) => s.practice);
  const combatMove = useLifeStore((s) => s.combatMove);
  const combatResolveFoe = useLifeStore((s) => s.combatResolveFoe);
  const clearResult = useLifeStore((s) => s.clearResult);
  const lastResult = useLifeStore((s) => s.lastResult);
  const saveLabel = useLifeStore((s) => s.saveLabel);
  const debugOpen = useLifeStore((s) => s.debugOpen);
  const setDebugOpen = useLifeStore((s) => s.setDebugOpen);
  const setTab = useLifeStore((s) => s.setTab);
  const huashanStart = useLifeStore((s) => s.huashanStart);
  const huashanFight = useLifeStore((s) => s.huashanFight);
  const huashanDismissReport = useLifeStore((s) => s.huashanDismissReport);
  const huashanClose = useLifeStore((s) => s.huashanClose);
  const equipOwned = useLifeStore((s) => s.equipOwned);
  const sealText = useLifeStore((s) => s.sealText);
  const flashLines = useLifeStore((s) => s.flashLines);
  const clearSeal = useLifeStore((s) => s.clearSeal);
  const [practiceView, setPracticeView] = useState<PracticeView>('main');
  const [personView, setPersonView] = useState<PersonView>('main');
  const [chronicleOpen, setChronicleOpen] = useState(() => (state.character.stats.monthsLived ?? 0) < 3);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() => isInkAudioMuted());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(() => {
    try {
      return localStorage.getItem('ink_reduce_motion') === '1';
    } catch {
      return false;
    }
  });
  const [monthTurning, setMonthTurning] = useState(false);
  const [choicesReady, setChoicesReady] = useState(false);
  /** 結果匣：先經過，點擊後再揭消長 */
  const [resultDeltasReady, setResultDeltasReady] = useState(false);
  const prevYearMonth = useRef<string | null>(null);
  const [textScale, setTextScale] = useState<TextScale>(() => {
    try {
      const v = Number(localStorage.getItem('ink_text_scale') ?? '1');
      return v === 1.15 || v === 1.3 ? v : 1;
    } catch {
      return 1;
    }
  });
  const resultAckRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!sealText) return;
    if (sealText === '月') playInkPageFlip();
    else if (sealText === '勝' || sealText === '武' || sealText === '晉') playInkWin();
    else if (sealText === '敗' || sealText === '終') playInkLose();
    else if (sealText === '戰') playInkBlade();
    else playInkSeal();
    const t = window.setTimeout(() => clearSeal(), 920);
    return () => window.clearTimeout(t);
  }, [sealText, clearSeal]);

  useEffect(() => {
    try {
      localStorage.setItem('ink_text_scale', String(textScale));
    } catch {
      /* ignore */
    }
  }, [textScale]);

  useEffect(() => {
    document.documentElement.dataset.inkMotion = reduceMotion ? 'reduce' : 'full';
    try {
      localStorage.setItem('ink_reduce_motion', reduceMotion ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [reduceMotion]);

  useEffect(() => {
    const ym = `${state.year}-${state.month ?? 1}`;
    if (prevYearMonth.current === null) {
      prevYearMonth.current = ym;
      return;
    }
    if (prevYearMonth.current === ym) return;
    prevYearMonth.current = ym;
    if (shouldReduceInkMotion()) return;
    setMonthTurning(true);
    const t = window.setTimeout(() => setMonthTurning(false), 400);
    return () => window.clearTimeout(t);
  }, [state.year, state.month]);

  useEffect(() => {
    if ((state.tab ?? 'home') !== 'practice') setPracticeView('main');
    if ((state.tab ?? 'home') !== 'person') setPersonView('main');
  }, [state.tab]);

  const c = state.character;
  const month = state.month ?? 1;
  const pendingEvent = resolvePendingEvent(state);
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const hasHeir = (c.childrenCount ?? 0) > 0;
  const stage = getLifeStageLabel(state);
  const hpPct = Math.max(0, Math.min(100, (c.health / Math.max(1, c.maxHealth)) * 100));
  const qiPct = Math.max(0, Math.min(100, ((c.qi ?? 0) / Math.max(1, c.maxQi ?? 1)) * 100));
  const tab = state.tab ?? 'home';
  const useNightWash = isInkNight({
    title: pendingEvent?.title,
    body: pendingEvent?.body,
    tags: pendingEvent?.tags,
    pendingKind: state.pending?.kind,
    omen: Boolean(state.pending?.kind === 'special' || c.flags.rumor_boost),
  });
  const showResult = Boolean(lastResult) && state.phase === 'playing' && !state.pendingCombat;
  const combat = state.pendingCombat ?? null;

  const practiceLeft = state.practiceActionsLeft ?? 3;
  const busy = Boolean(state.pending) || Boolean(combat) || showResult || !c.alive;
  const practiceBusy = busy || practiceLeft <= 0;
  const onPracticeTab = tab === 'practice';
  const onHomeTab = tab === 'home';
  const canAdvanceMonth =
    state.phase === 'playing' &&
    !state.pending &&
    !combat &&
    c.alive &&
    !showResult &&
    onHomeTab;
  const nature = ensureNature(c);
  const dominant = dominantNature(c);
  /** 有待決事件時進入專注版面，避免選項被頂欄／年譜擠出可視區 */
  const eventFocus =
    state.phase === 'playing' && Boolean(pendingEvent) && !showResult && !combat;
  /** 交手中隱藏全局氣血條，避免與戰鬥血條重複 */
  const showVitalsBars = !combat && !eventFocus && (tab === 'home' || tab === 'person');
  const showStatStrip = !combat && !eventFocus;
  const homeHints = onHomeTab && !eventFocus ? jianghuHints(state) : [];
  const resultKind = lastResult?.title === '修煉' ? 'practice' : 'month';

  useEffect(() => {
    if (!showResult) {
      setResultDeltasReady(false);
      return;
    }
    setResultDeltasReady(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearResult();
    };
    window.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() => resultAckRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showResult, lastResult?.title, lastResult?.feedback, clearResult]);

  useEffect(() => {
    if (eventFocus && tab !== 'home') setTab('home');
  }, [eventFocus, tab, setTab]);

  useEffect(() => {
    if (!eventFocus || !pendingEvent) {
      setChoicesReady(false);
      return;
    }
    if (shouldReduceInkMotion()) {
      setChoicesReady(true);
      return;
    }
    setChoicesReady(false);
    const t = window.setTimeout(() => setChoicesReady(true), 420);
    return () => window.clearTimeout(t);
  }, [eventFocus, pendingEvent?.id]);

  useEffect(() => {
    // 交手時強制離開分卷內容，避免人物／修煉面板疊在戰鬥上
    if (combat && (tab === 'person' || tab === 'practice' || tab === 'jianghu')) {
      setTab('home');
    }
  }, [combat, tab, setTab]);

  const choiceCap = pendingEvent?.tags?.includes('arc') ? 4 : 3;
  const eligibleChoices =
    pendingEvent?.choices
      .filter((ch) => meetsRequirements(state, ch.requirements))
      .slice(0, choiceCap) ?? [];
  const coachStep = nextCoachStep(c.flags);
  const coach = coachCopy(coachStep);
  const showCoach =
    onHomeTab &&
    !combat &&
    !eventFocus &&
    !showResult &&
    state.phase === 'playing' &&
    Boolean(coach) &&
    !c.flags.coach_done;

  const aftermath = getAftermathStatus(state);
  const arcLine = lifeArcStatusLine(state);
  const inkSeason = seasonToInk(month);
  const inkPlace = placeToInk(c.location);

  const nicknames = topTitles(state);
  const sceneBits = [
    'scroll-shell',
    'scroll-shell--play',
    'ink-enter',
    `ink-scene--${inkSeason}`,
    `ink-scene--${inkPlace}`,
    useNightWash ? 'ink-scene--night' : '',
    state.pending?.kind === 'special' || c.flags.rumor_boost ? 'ink-scene--omen' : '',
    combat ? 'scroll-shell--combat' : '',
    eventFocus ? 'scroll-shell--event' : '',
    monthTurning ? 'ink-month-turn' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={sceneBits}
      data-text-scale={textScale === 1 ? undefined : String(textScale)}
      style={
        textScale !== 1
          ? ({
              ['--fs-body' as string]: `${textScale}rem`,
              ['--fs-caption' as string]: `${0.82 * textScale}rem`,
              ['--fs-label' as string]: `${0.8 * textScale}rem`,
            } as CSSProperties)
          : undefined
      }
    >
      {useNightWash && (
        <InkAiWashLayer
          className="ink-ai-wash ink-ai-wash--play"
          src={inkAiUrl('backdrop-night-mountains')}
        />
      )}
      <InkScrollBackdrop
        variant="play"
        quiet={Boolean(combat)}
        season={inkSeason}
        place={inkPlace}
        omen={Boolean(state.pending?.kind === 'special')}
        night={useNightWash}
      />
      {sealText && <InkSealStamp text={sealText} onDone={clearSeal} />}

      <header className="ink-status">
        <div className="ink-identity">
          <p className="ink-status-kicker">
            第{state.year}年 · {seasonLabel(month)}
          </p>
          <h2 className="ink-name">{c.name}</h2>
          <p className="ink-meta">
            {c.age}歲 · {stage}
            {c.location ? ` · ${c.location}` : ''}
            {sect ? ` · ${sect.name}` : ''}
            {nicknames.length ? ` · ${nicknames.join('·')}` : ''}
          </p>
        </div>
        <div className="ink-status-actions">
          <button
            type="button"
            className="ink-icon-btn ink-icon-btn--wide"
            onClick={() => setSettingsOpen(true)}
            title="設定"
            aria-label="開啟設定"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
          >
            設定
          </button>
          {import.meta.env.DEV && (
            <button
              type="button"
              className="ink-icon-btn"
              onClick={() => {
                setDebugOpen(!debugOpen);
              }}
              title="除錯"
            >
              墨
            </button>
          )}
        </div>
      </header>

      {showStatStrip && (
        <section className="ink-vitals" aria-label={showVitalsBars ? '氣血內力' : '江湖概況'}>
          {showVitalsBars && (
            <div className="ink-vitals-meters">
              <div className="ink-meter">
                <div className="ink-vitals-label">
                  <span>氣血</span>
                  <span>
                    {Math.round(c.health)}/{c.maxHealth}
                  </span>
                </div>
                <div
                  className="ink-bar ink-bar--life"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={c.maxHealth}
                  aria-valuenow={Math.round(c.health)}
                  aria-label="氣血"
                >
                  <div className="ink-bar-fill ink-bar-fill--live" style={{ width: `${hpPct}%` }} />
                </div>
              </div>
              <div className="ink-meter">
                <div className="ink-vitals-label">
                  <span>內力</span>
                  <span>
                    {Math.round(c.qi ?? 0)}/{c.maxQi ?? 0}
                  </span>
                </div>
                <div
                  className="ink-bar ink-bar--qi"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={c.maxQi ?? 0}
                  aria-valuenow={Math.round(c.qi ?? 0)}
                  aria-label="內力"
                >
                  <div className="ink-bar-fill ink-bar-fill--qi ink-bar-fill--live" style={{ width: `${qiPct}%` }} />
                </div>
              </div>
            </div>
          )}
          <span
            className="ink-vitals-rule"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: INK_SVG.fadeLine }}
          />
          <ul className="ink-stat-row">
            <li className="ink-stat-pill">
              <img className="ink-stat-motif" src={inkAiUrl('motif-jade')} alt="" decoding="async" />
              <span>銀兩 {c.money}</span>
            </li>
            <li className="ink-stat-pill">
              <img className="ink-stat-motif" src={inkAiUrl('motif-scroll')} alt="" decoding="async" />
              <span>名望 {c.reputation}</span>
            </li>
            <li className="ink-stat-pill">
              <img className="ink-stat-motif" src={inkAiUrl('motif-sword')} alt="" decoding="async" />
              <span>
                武學 {c.martial}·{overallMartialLabel(c)}
              </span>
            </li>
            <li className="ink-stat-pill">
              <img className="ink-stat-motif" src={inkAiUrl('motif-lantern')} alt="" decoding="async" />
              <span>疲勞 {c.fatigue ?? 0}</span>
            </li>
          </ul>
          {(c.conditions?.length ?? 0) > 0 && (
            <div className="ink-chips">
              {c.conditions.map((cond) => (
                <span key={cond.id} className="ink-chip">
                  {cond.name}·{cond.monthsLeft}月
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <InkSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        textScale={textScale}
        onTextScale={(scale) => {
          setTextScale(scale);
          track('a11y_text_scale', { scale });
        }}
        audioMuted={audioMuted}
        onToggleAudio={() => {
          const next = toggleInkAudioMuted();
          setAudioMuted(next);
          track('audio_mute_toggle', { muted: next });
        }}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={() => {
          setReduceMotion((v) => {
            const next = !v;
            track('a11y_reduce_motion', { reduce: next });
            return next;
          });
        }}
      />

      {!eventFocus && !combat && saveLabel && (
        <p className="ink-save" title={`上次落筆：${saveLabel}`}>
          墨跡已存
        </p>
      )}
      {!eventFocus && arcLine && state.phase === 'playing' && !combat && (
        <p className="ink-arc-chip" aria-label="因緣">{arcLine}</p>
      )}
      {!eventFocus && aftermath && state.phase === 'playing' && !combat && (
        <p className={`ink-aftermath-chip ink-aftermath-chip--${aftermath.kind}`} aria-label="餘波">
          {aftermath.text}
        </p>
      )}

      {!combat && !eventFocus && (
        <nav className="ink-tabs" aria-label="分卷">
          {(
            [
              ['home', '鎮居'],
              ['person', '人物'],
              ['jianghu', '江湖'],
              ['practice', '修煉'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'ink-tab ink-tab--active' : 'ink-tab'}
              onClick={() => {
                setTab(id);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      <div className="ink-play-body">

      {/* 待決事件：專注版面，選項固定在可視區底部 */}
      {eventFocus && pendingEvent && (
        <InkEventPanel
          state={state}
          pendingEvent={pendingEvent}
          choicesReady={choicesReady}
          eligibleChoices={eligibleChoices}
          onChoose={choose}
          onDismiss={dismissEvent}
        />
      )}

      {/* 鎮居首屏：翻頁優先於儀表與年譜（無待決事件時） */}
      {onHomeTab && !combat && !eventFocus && (
        <div key={`${state.year}-${month}`} className="ink-home-focus ink-scroll-flip">
          <figure className="ink-home-tableau">
            <img
              className="ink-home-tableau-img"
              src={inkAiUrl('backdrop-town-scroll')}
              alt=""
              aria-hidden
              decoding="async"
            />
            <span className="ink-home-tableau-mist" aria-hidden />
            <figcaption className="ink-home-tableau-caption">
              <span>
                {seasonLabel(month)} · {state.year}年{month}月
              </span>
              <strong>{c.location || '千燈鎮'}</strong>
            </figcaption>
          </figure>

          {showCoach && coach && (
            <section className="ink-coach" aria-live="polite">
              <h3>{coach.title}</h3>
              <p>{coach.body}</p>
              <button type="button" className="ink-btn ink-btn--ghost" onClick={() => dismissCoach()}>
                已知曉
              </button>
            </section>
          )}

          {flashLines.length > 0 && state.phase === 'playing' && !showResult && (
            <section className="ink-flash" aria-live="polite">
              {flashLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          )}

          {canAdvanceMonth && (
            <button
              type="button"
              className="ink-btn ink-btn--primary ink-btn--year ink-btn--pulse"
              onClick={() => {
                advanceMonth();
              }}
            >
              翻過一頁 · 過一月
            </button>
          )}

          {homeHints.length > 0 && (
            <section className="ink-world" aria-label="近日傳聞">
              <p className="ink-note">{homeHints[0]}</p>
              {homeHints.length > 1 && (
                <button
                  type="button"
                  className="ink-btn ink-btn--quiet ink-toggle-quiet"
                  onClick={() => {
                    setHintsOpen((v) => !v);
                  }}
                >
                  {hintsOpen ? '收起傳聞' : `更多傳聞（${homeHints.length - 1}）`}
                </button>
              )}
              {hintsOpen &&
                homeHints.slice(1).map((h) => (
                  <p key={h} className="ink-note">
                    {h}
                  </p>
                ))}
            </section>
          )}
        </div>
      )}

      {tab === 'jianghu' && !combat && !eventFocus && (
        <section key="jianghu" className="ink-panel ink-world-panel ink-tab-pane" aria-label="心性">
          <h3>心性</h3>
          <p className="ink-note ink-nature-line">
            {natureKeys.map((k, i) => (
              <span
                key={k}
                className={`ink-nature-chip ink-nature--${k}${k === dominant ? ' ink-nature--dominant' : ''}`}
              >
                {i > 0 ? ' ' : ''}
                {natureLabels[k]}
                {nature[k]}
                {k === dominant ? '◆' : ''}
              </span>
            ))}
          </p>
          <p className="ink-note">{natureSummary(c)}</p>
        </section>
      )}

      {tab === 'jianghu' && !combat && !eventFocus && (
        <InkHuashanPanel
          state={state}
          onStart={huashanStart}
          onFight={huashanFight}
          onDismissReport={huashanDismissReport}
          onCloseTournament={huashanClose}
        />
      )}

      {tab === 'person' && !combat && !eventFocus && (
        <InkPersonPanel
          state={state}
          view={personView}
          onView={setPersonView}
          busy={busy}
          onEquip={equipOwned}
          onEquipBest={() => {
            practice('equip_best');
          }}
        />
      )}

      {tab === 'practice' && !combat && !eventFocus && (
        <InkPracticePanel
          state={state}
          view={practiceView}
          onView={setPracticeView}
          practiceLeft={practiceLeft}
          busy={practiceBusy}
          onPractice={practice}
        />
      )}

      {combat && state.phase === 'playing' && (
        <InkCombatPanel state={state} combat={combat} onMove={combatMove} onResolveFoe={combatResolveFoe} />
      )}

      {showResult &&
        lastResult &&
        createPortal(
          <div className="ink-modal" role="dialog" aria-modal="true" aria-label="結果">
            <div
              className={`ink-modal-card ink-result ink-result--staged${
                lastResult.deltas.some(isLearnSkillDeltaLine) ? ' ink-result--learn-skill' : ''
              }${
                lastResult.deltas.length > 0 && !resultDeltasReady ? ' ink-result--await-deltas' : ''
              }${
                lastResult.deltas.length > 0 && resultDeltasReady ? ' ink-result--deltas-open' : ''
              }`}
            >
              <img
                className="ink-result-wash"
                src={inkAiUrl('backdrop-result-mist')}
                alt=""
                aria-hidden
                decoding="async"
              />
              {(resultDeltasReady || lastResult.deltas.length === 0) && (
                <InkResultSeal
                  text={
                    isRankUpStoryLine(lastResult.feedback)
                      ? '晉'
                      : resultKind === 'practice'
                        ? '修'
                        : lastResult.title === '整裝'
                          ? '裝'
                          : lastResult.deltas.some(isLearnSkillDeltaLine)
                            ? '武'
                            : '定'
                  }
                />
              )}
              <p className="ink-event-year">
                {isRankUpStoryLine(lastResult.feedback)
                  ? '階位精進'
                  : resultKind === 'practice'
                    ? '修煉已定'
                    : lastResult.title === '整裝'
                      ? '披掛已定'
                      : lastResult.deltas.some(isLearnSkillDeltaLine)
                        ? '武學入懷'
                        : '本月際遇'}
              </p>
              <h3>{lastResult.title}</h3>
              <p className="ink-result-choice">你選擇：{lastResult.choiceText}</p>
              <div className="ink-result-story">
                <p className="ink-result-story-label">經過</p>
                {lastResult.feedback.split(/\n\n+/).map((para, i) => (
                  <p
                    key={`${i}-${para.slice(0, 12)}`}
                    className={`ink-event-body${
                      isLearnSkillStoryLine(para) || isRankUpStoryLine(para) ? ' ink-event-body--learn-skill' : ''
                    }`}
                  >
                    {para.replace(LEARN_SKILL_MARKER, '').replace(RANK_UP_MARKER, '')}
                  </p>
                ))}
              </div>
              {lastResult.deltas.length > 0 && resultDeltasReady && (
                <div className="ink-result-deltas">
                  <p className="ink-result-delta-label">
                    {lastResult.deltas.some(isLearnSkillDeltaLine) ? '新學武學' : '此番消長'}
                  </p>
                  <ul className="ink-delta-board" aria-label="此番消長">
                    {lastResult.deltas.map((d, i) => {
                      const learn = isLearnSkillDeltaLine(d);
                      const longNote = !learn && d.length > 18 && !/[+＋\-－−↑↓]/.test(d);
                      const tone = learn
                        ? 'learn'
                        : /[+＋↑]/.test(d)
                          ? 'up'
                          : /[-－−↓]/.test(d)
                            ? 'down'
                            : longNote
                              ? 'note'
                              : 'flat';
                      return (
                        <li
                          key={`${i}-${d}`}
                          className={`ink-delta-row ink-delta-row--${tone}`}
                          style={{ ['--i' as string]: i }}
                        >
                          <span className="ink-delta-row-text">{d}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <button
                type="button"
                className="ink-btn ink-btn--primary ink-btn--ack"
                ref={resultAckRef}
                onClick={() => {
                  if (lastResult.deltas.length > 0 && !resultDeltasReady) {
                    setResultDeltasReady(true);
                    return;
                  }
                  clearResult();
                }}
              >
                {lastResult.deltas.length > 0 && !resultDeltasReady
                  ? '接著 · 見消長'
                  : '已知曉 · 掩卷'}
              </button>
            </div>
          </div>,
          document.body,
        )}

      {flashLines.length > 0 &&
        state.phase === 'playing' &&
        !pendingEvent &&
        !showResult &&
        !combat &&
        !onHomeTab &&
        !onPracticeTab && (
        <section className="ink-flash" aria-live="polite">
          {flashLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      )}

      {state.phase === 'summary' && (
        <section className="ink-panel ink-epitaph">
          <h3>掩卷</h3>
          <pre className="ink-epitaph-text">{state.summaryText}</pre>
          <InkStaticSeal text="終" className="ink-seal-static--end" />
          <button type="button" className="ink-btn ink-btn--primary" onClick={() => reincarnate()}>
            {hasHeir ? '轉世再入江湖' : '重新選角'}
          </button>
          <p className="ink-note ink-note--center">
            {hasHeir ? (
              <>
                前世武學餘韻
                {c.flags.family_legacy || c.flags.legacy_teacher
                  ? `與${[c.flags.family_legacy ? '族規' : '', c.flags.legacy_teacher ? '傳功' : ''].filter(Boolean).join('、')}`
                  : ''}
                將淡淡帶入來世。
              </>
            ) : (
              '這一世沒有子女，下一世會重新開始，不帶任何前世的東西。'
            )}
          </p>
        </section>
      )}

      {onPracticeTab && !combat && !showResult && !eventFocus && (
        <p className="ink-note ink-note--center">修煉不催歲月——請回「鎮居」翻過一頁。</p>
      )}
      {(tab === 'person' || tab === 'jianghu') && !combat && !showResult && !eventFocus && (
        <p className="ink-note ink-note--center">請回「鎮居」翻頁、覽年譜。</p>
      )}

      {onHomeTab && !combat && !eventFocus && (
        <section className={`ink-panel ink-chronicle${chronicleOpen ? ' ink-chronicle--open' : ''}`}>
          <button
            type="button"
            className="ink-chronicle-toggle"
            onClick={() => {
              setChronicleOpen((v) => !v);
            }}
            aria-expanded={chronicleOpen}
          >
            <h3>年譜</h3>
            <span>{chronicleOpen ? '掩上' : `展開（${Math.min(14, state.lifeLog.length)}）`}</span>
          </button>
          {chronicleOpen && (
            <ul className="ink-log">
              {state.lifeLog.slice(0, 14).map((line, i) => (
                <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}
      </div>

      {debugOpen && <LifeDebugPanel state={state} />}
    </div>
  );
}
