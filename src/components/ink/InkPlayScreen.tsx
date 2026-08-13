import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { natureKeys, natureLabels } from '@interfaces/lifeEngine';
import { useLifeStore } from '../../store/lifeStore';
import { resolvePendingEvent } from '@core/life/eventEngine';
import { getLifeStageLabel } from '@core/life/stages';
import { seasonLabel } from '@core/life/monthly';
import { PRACTICE_ACTIONS, SECT_INNER_ACTIONS, SECT_DEFS } from '@core/life/actions';
import { getGearDef, WEAPON_KIND_LABEL } from '@data/equipment/catalog';
import { MOVE_STANCE_LABEL, resolveMoveStance } from '@core/life/moveStance';
import { overallMartialLabel } from '@core/life/flavor';
import { jianghuHints, practiceLearningHints } from '@core/life/jianghuHints';
import { meetsRequirements } from '@core/life/requirements';
import { GUARD_STANCE, CHARGE_STANCE } from '@data/skills/catalog';
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
import { titleLabels } from '@core/life/titles';
import { classifyBeat, summarizeExchange } from '@core/life/combatPresentation';
import { isLearnSkillDeltaLine, isLearnSkillStoryLine, LEARN_SKILL_MARKER } from '@core/life/playerText';
import { describeSectProgress } from '@core/life/sectStanding';
import { ensureNature, dominantNature, natureGateHint, natureSummary } from '@core/life/nature';
import { getPlayerMoves } from '@core/life/combat';
import {
  COMBAT_TECHNIQUE_ROLES,
  combatMoveRole,
  formatCombatMoveCompact,
  getSkillDef,
  isCombatActionMove,
  type CombatMoveRole,
} from '@data/skills/catalog';
import { rankPowerMult } from '@core/life/martialRanks';
import { displayChoiceText } from '@core/life/playerText';
import { coachCopy, nextCoachStep } from '@core/life/tutorial';
import { lifeArcStatusLine } from '@core/life/arcs';
import { getAftermathStatus, styleForCombat } from '@core/life/combatPresentation';
import { foeStyleLabel } from '@core/life/foeAi';
import { track } from '../../telemetry/events';
import { seasonToInk, placeToInk, isInkNight, shouldReduceInkMotion } from './sceneVariants';
import { InkScrollBackdrop, InkSealStamp, InkResultSeal, InkEventBanner, InkStaticSeal, InkAiWashLayer } from './InkDecor';
import { eventBannerSvg, INK_SVG } from '../../ui/inkAssets';
import { pickAiEventBanner, aiEventBannerUrl, inkAiUrl } from '../../ui/inkAiCatalog';
import { InkHuashanPanel } from './InkHuashanPanel';
import { InkPersonPanel, type PersonView } from './InkPersonPanel';
import { LifeDebugPanel } from '../LifeDebugPanel';

type Props = {
  state: LifeGameState;
};

/** 血條下「最新戰況」：取自己／敵人各最近一條主動作（最多兩條） */
function recentExchangeBeats(log: string[], playerName: string, foeName: string): string[] {
  let playerIdx = -1;
  let foeIdx = -1;
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const line = log[i]!;
    if (line.startsWith('【')) continue;
    const isAction =
      line.includes('「') ||
      /收招守中|蓄勢待發|抽身|使不出來|截住去路|動作遲滯|氣息陡變/.test(line);
    if (!isAction) continue;
    if (playerIdx < 0 && (line.startsWith(playerName) || line.startsWith('你'))) {
      playerIdx = i;
    } else if (foeIdx < 0 && line.startsWith(foeName)) {
      foeIdx = i;
    }
    if (playerIdx >= 0 && foeIdx >= 0) break;
  }
  const idxs = [playerIdx, foeIdx].filter((i) => i >= 0).sort((a, b) => a - b);
  if (idxs.length) return idxs.map((i) => log[i]!);
  return log.filter((l) => !l.startsWith('【')).slice(-2);
}


type PracticeView = 'main' | 'sect';
type CombatRoleFilter = 'all' | CombatMoveRole;

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
  const [combatRoleFilter, setCombatRoleFilter] = useState<CombatRoleFilter>('all');
  const [combatLogOpen, setCombatLogOpen] = useState(false);
  const [combatFiltersOpen, setCombatFiltersOpen] = useState(false);
  const [combatActionsOpen, setCombatActionsOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(() => (state.character.stats.monthsLived ?? 0) < 3);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [expandedMoveId, setExpandedMoveId] = useState<string | null>(null);
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
  const prevYearMonth = useRef<string | null>(null);
  const [textScale, setTextScale] = useState<TextScale>(() => {
    try {
      const v = Number(localStorage.getItem('ink_text_scale') ?? '1');
      return v === 1.15 || v === 1.3 ? v : 1;
    } catch {
      return 1;
    }
  });
  const combatBeatRef = useRef<HTMLDivElement | null>(null);
  const resultAckRef = useRef<HTMLButtonElement | null>(null);
  const lastCombatTurn = useRef<number | null>(null);

  useEffect(() => {
    if (!sealText) return;
    if (sealText === '月') playInkPageFlip();
    else if (sealText === '勝' || sealText === '武') playInkWin();
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

  useEffect(() => {
    setCombatRoleFilter('all');
    setCombatLogOpen(false);
    setCombatFiltersOpen(false);
    setCombatActionsOpen(false);
    setExpandedMoveId(null);
  }, [state.pendingCombat?.id]);

  useEffect(() => {
    if (!state.pendingCombat?.log?.length) return;
    window.requestAnimationFrame(() => {
      combatBeatRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });
  }, [state.pendingCombat?.log?.length]);

  const c = state.character;
  const month = state.month ?? 1;
  const pendingEvent = resolvePendingEvent(state);
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const stage = getLifeStageLabel(state);
  const hpPct = Math.max(0, Math.min(100, (c.health / Math.max(1, c.maxHealth)) * 100));
  const qiPct = Math.max(0, Math.min(100, ((c.qi ?? 0) / Math.max(1, c.maxQi ?? 1)) * 100));
  const tab = state.tab ?? 'home';
  const isPack = (pendingEvent?.tags ?? []).includes('pack');
  const displayTitle = isPack ? '江湖偶遇' : pendingEvent?.title;
  const bannerKind =
    pendingEvent != null
      ? pickAiEventBanner({
          title: pendingEvent.title,
          body: pendingEvent.body,
          tags: pendingEvent.tags,
        })
      : 'none';
  const eventBannerSrc = pendingEvent != null ? aiEventBannerUrl(bannerKind) : null;
  /** AI 橫幅優先；若無匹配則回退舊 SVG 橋／雨店 */
  const eventBannerMarkup =
    eventBannerSrc == null && pendingEvent != null
      ? eventBannerSvg(
          bannerKind === 'rain-inn' ? 'rain-inn' : bannerKind === 'bridge-mist' ? 'bridge' : 'none',
        )
      : null;
  const useNightWash = isInkNight({
    title: pendingEvent?.title,
    body: pendingEvent?.body,
    tags: pendingEvent?.tags,
    pendingKind: state.pending?.kind,
    omen: Boolean(state.pending?.kind === 'special' || c.flags.rumor_boost),
  });
  const equipment = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const showResult = Boolean(lastResult) && state.phase === 'playing' && !state.pendingCombat;
  const combat = state.pendingCombat ?? null;

  useEffect(() => {
    if (!combat) {
      lastCombatTurn.current = null;
      return;
    }
    if (lastCombatTurn.current !== null && lastCombatTurn.current !== combat.turn) {
      playInkBlade();
    }
    lastCombatTurn.current = combat.turn;
  }, [combat, combat?.turn]);

  const practiceLeft = state.practiceActionsLeft ?? 3;
  const busy = Boolean(state.pending) || Boolean(combat) || showResult || !c.alive;
  const practiceBusy = busy || practiceLeft <= 0;
  const moves = combat ? getPlayerMoves(state) : [];
  const techniqueMoves = moves.filter((mv) => !isCombatActionMove(mv.id));
  const actionMoves = moves.filter((mv) => isCombatActionMove(mv.id));
  const equippedWeapon = equipment.weapon ? getGearDef(equipment.weapon) : undefined;
  const sortedTechniques = [...techniqueMoves].sort((a, b) => {
    const skillOf = (moveId: string) => c.skills.find((id) => getSkillDef(id)?.move?.id === moveId);
    const score = (mv: (typeof techniqueMoves)[number]) => {
      const short = combat ? combat.player.qi < mv.qiCost : true;
      const sid = skillOf(mv.id);
      const def = sid ? getSkillDef(sid) : undefined;
      const match = Boolean(def?.weaponKind && equippedWeapon?.weaponKind === def.weaponKind);
      let s = 0;
      if (!short) s += 100;
      if (match) s += 40;
      if (mv.id === 'basic_strike') s += 10;
      s += (mv.power ?? 0) * 5;
      return s;
    };
    return score(b) - score(a);
  });
  const visibleTechniques =
    combatRoleFilter === 'all'
      ? sortedTechniques
      : sortedTechniques.filter((mv) => combatMoveRole(mv) === combatRoleFilter);
  const roleCounts = COMBAT_TECHNIQUE_ROLES.reduce(
    (acc, role) => {
      acc[role] = techniqueMoves.filter((mv) => combatMoveRole(mv) === role).length;
      return acc;
    },
    {} as Record<CombatMoveRole, number>,
  );
  const latestBeats =
    combat?.log?.length
      ? recentExchangeBeats(combat.log, combat.player.name, combat.foe.name)
      : [];
  const exchangeHint = summarizeExchange(latestBeats);
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
    if (!showResult) return;
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
  }, [showResult, clearResult]);

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
  const combatStyle = combat ? styleForCombat(combat) : null;
  const eventBodyParas = pendingEvent?.body
    ? pendingEvent.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  const nicknames = titleLabels(state);
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
        <div>
          <h2 className="ink-name">{c.name}</h2>
          <p className="ink-meta">
            {c.age} 歲 · {stage} · {state.year}年{month}月（{seasonLabel(month)}）
            {c.location ? ` · ${c.location}` : ''}
            {sect ? ` · ${sect.name}` : ''}
            {nicknames.length ? ` · ${nicknames.slice(0, 2).join('·')}` : ''}
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

      {!eventFocus && !combat && saveLabel && <p className="ink-save">已落筆 {saveLabel}</p>}
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
        <section className="ink-panel ink-event ink-event--focus" aria-label="待決之事">
          <div className="ink-event-scroll">
            {(eventBannerSrc || eventBannerMarkup) && (
              <InkEventBanner src={eventBannerSrc} markup={eventBannerMarkup ?? undefined} />
            )}
            <p className="ink-event-year">
              {state.year}年{month}月 · {c.age}歲
              {state.pending?.kind === 'special' ? ' · 奇遇' : ''}
              {arcLine ? ` · ${arcLine.replace(/^因緣/, '')}` : ''}
            </p>
            <h3 className="ink-write-in">{displayTitle}</h3>
            {eventBodyParas.map((para, i) => (
              <p
                key={`${pendingEvent.id}-p${i}`}
                className="ink-event-body ink-write-in"
                style={{ ['--i' as string]: i }}
              >
                {para}
              </p>
            ))}
          </div>
          <div
            className={`ink-choice-list ink-choice-list--dock${choicesReady ? ' ink-choice-list--reveal' : ' ink-choice-list--await'}`}
            aria-hidden={!choicesReady}
          >
            {eligibleChoices.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                className="ink-choice"
                style={{ ['--i' as string]: i }}
                disabled={!choicesReady}
                onClick={() => {
                  choose(ch.id);
                }}
              >
                <span className="ink-choice-mark">{['甲', '乙', '丙', '丁'][i] ?? '註'}</span>
                {displayChoiceText(ch.text, ch.id)}
              </button>
            ))}
            {eligibleChoices.length === 0 && (
              <button
                type="button"
                className="ink-choice"
                disabled={!choicesReady}
                onClick={() => dismissEvent()}
              >
                <span className="ink-choice-mark">避</span>
                暫避鋒芒（此刻無可行之選）
              </button>
            )}
          </div>
        </section>
      )}

      {/* 鎮居首屏：翻頁優先於儀表與年譜（無待決事件時） */}
      {onHomeTab && !combat && !eventFocus && (
        <div key={`${state.year}-${month}`} className="ink-home-focus ink-scroll-flip">
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
        <section key="practice" className="ink-panel ink-practice ink-tab-pane">
          {practiceView === 'main' && (
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
                  className="ink-practice-btn ink-practice-btn--sect"
                  disabled={practiceBusy}
                  onClick={() => {
                    setPracticeView('sect');
                  }}
                >
                  <strong>門派</strong>
                  <span>{sect ? `${sect.name} · 進入門中` : '尚未入派 · 擇門拜師'}</span>
                </button>
                {PRACTICE_ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    className="ink-practice-btn"
                    disabled={practiceBusy}
                    onClick={() => {
                      practice(act.id);
                    }}
                  >
                    <strong>{act.label}</strong>
                    <span>{act.hint}</span>
                  </button>
                ))}
              </div>
              {practiceLeft <= 0 && (
                <p className="ink-note ink-note--warn">本月修煉已盡，請回「鎮居」翻過一頁。</p>
              )}
            </>
          )}

          {practiceView === 'sect' && (
            <>
              <div className="ink-sect-head">
                <h3>{sect ? sect.name : '擇門拜師'}</h3>
                <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setPracticeView('main')}>
                  回門
                </button>
              </div>
              {!sect ? (
                <>
                  <p className="ink-note">各派門風不同，拜入與否，全看當下機緣。</p>
                  <div className="ink-practice-grid">
                    {SECT_DEFS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="ink-practice-btn"
                        disabled={practiceBusy}
                        onClick={() => {
                          practice('join_sect', { sectId: s.id });
                          setPracticeView('main');
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
                        disabled={practiceBusy}
                        onClick={() => {
                          practice(act.id);
                        }}
                      >
                        <strong>{act.label}</strong>
                        <span>{act.hint}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ink-practice-btn"
                      disabled={practiceBusy}
                      onClick={() => {
                        practice('sect_leave');
                        setPracticeView('main');
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
      )}

      {combat && state.phase === 'playing' && (
        <section className="ink-panel ink-combat ink-combat--focus" aria-live="polite">
          <div className="ink-combat-head">
            <p className="ink-event-year">
              第 {combat.turn} 回合 · {combat.title}
              {combatStyle ? ` · ${foeStyleLabel(combatStyle)}` : ''}
              {' · '}實克虛 · 架克實 · 虛克架
            </p>
            <h3>交手 · {combat.foe.name}</h3>
            <div className="ink-combat-bars">
              <div>
                <div className="ink-vitals-label">
                  <span>{combat.foe.name}</span>
                  <span>
                    氣血 {Math.round(combat.foe.hp)}/{combat.foe.maxHp}
                  </span>
                </div>
                <div className="ink-bar">
                  <div
                    className="ink-bar-fill ink-bar-fill--foe ink-bar-fill--live"
                    style={{
                      width: `${Math.max(0, Math.min(100, (combat.foe.hp / combat.foe.maxHp) * 100))}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="ink-vitals-label">
                  <span>{combat.player.name}</span>
                  <span>
                    氣血 {Math.round(combat.player.hp)}/{combat.player.maxHp} · 內力{' '}
                    {Math.round(combat.player.qi)}/{combat.player.maxQi}
                  </span>
                </div>
                <div className="ink-bar">
                  <div
                    className="ink-bar-fill ink-bar-fill--live"
                    style={{
                      width: `${Math.max(0, Math.min(100, (combat.player.hp / combat.player.maxHp) * 100))}%`,
                    }}
                  />
                </div>
                <div className="ink-bar ink-bar--qi">
                  <div
                    className="ink-bar-fill ink-bar-fill--qi ink-bar-fill--live"
                    style={{
                      width: `${Math.max(0, Math.min(100, (combat.player.qi / Math.max(1, combat.player.maxQi)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {latestBeats.length > 0 && (
              <div
                ref={combatBeatRef}
                key={`${combat.turn}-${latestBeats.map((b) => b.slice(0, 12)).join('|')}`}
                className="ink-combat-beat"
                aria-live="polite"
              >
                {exchangeHint && <p className="ink-combat-beat-hint">{exchangeHint}</p>}
                {latestBeats.map((beat, i) => {
                  const kind = classifyBeat(beat);
                  return (
                    <p
                      key={`${i}-${beat.slice(0, 16)}`}
                      className={`ink-combat-beat-line ink-combat-beat-line--${kind}`}
                    >
                      {beat}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ink-combat-scroll">
            <button
              type="button"
              className="ink-combat-log-toggle"
              onClick={() => {
                setCombatLogOpen((v) => !v);
              }}
            >
              {combatLogOpen ? '收起紀要' : `交手紀要（${combat.log.length}）`}
            </button>
            {combatLogOpen && (
              <ul className="ink-combat-log">
                {combat.log.slice(-20).map((line, i) => (
                  <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
                ))}
              </ul>
            )}

            {combat.phase === 'resolve' ? (
              <>
                <p className="ink-note">勝負已分——如何處置落敗之人，亦會留在心性裡。</p>
                <div className="ink-choice-list ink-combat-resolve">
                  {(
                    [
                      ['kill', '殺', '殺死', '永絕後患，得修為；戾氣難消', dominant === 'xia' ? '俠心較重，下手需自問' : ''],
                      ['release', '放', '放走', '留其一命，寬恕在胸', dominant === 'e' ? '惡念未消，放人亦是克制' : ''],
                      ['stun', '暈', '擊暈', '點穴制住，不傷性命', '戰利或略薄，心性較穩'],
                    ] as const
                  ).map(([id, mark, label, hint, extra], i) => (
                    <button
                      key={id}
                      type="button"
                      className="ink-choice"
                      style={{ ['--i' as string]: i }}
                      onClick={() => {
                        combatResolveFoe(id);
                      }}
                    >
                      <span className="ink-choice-mark">{mark}</span>
                      <span className="ink-combat-move">
                        <strong>{label}</strong>
                        <em>
                          {hint}
                          {extra ? ` · ${extra}` : ''}
                        </em>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ink-combat-log-toggle"
                  onClick={() => {
                    setCombatFiltersOpen((v) => !v);
                  }}
                >
                  {combatFiltersOpen ? '收起擇勢' : '擇勢觀招'}
                </button>
                {combatFiltersOpen && (
                  <>
                    <p className="ink-note">按路數分覽；兵刃相合、內息充足者居前。</p>
                    <div className="ink-combat-filters" role="tablist" aria-label="擇勢觀招">
                      <button
                        type="button"
                        className={`ink-combat-filter${combatRoleFilter === 'all' ? ' ink-combat-filter--on' : ''}`}
                        onClick={() => {
                          setCombatRoleFilter('all');
                        }}
                      >
                        全部 {techniqueMoves.length}
                      </button>
                      {COMBAT_TECHNIQUE_ROLES.filter((role) => (roleCounts[role] ?? 0) > 0).map((role) => (
                        <button
                          key={role}
                          type="button"
                          className={`ink-combat-filter${combatRoleFilter === role ? ' ink-combat-filter--on' : ''}`}
                          onClick={() => {
                            setCombatRoleFilter(role);
                          }}
                        >
                          {role} {roleCounts[role]}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="ink-combat-group-label">招式</p>
                <div className="ink-choice-list ink-combat-moves">
                  {visibleTechniques.map((mv, i) => {
                    const short = combat.player.qi < mv.qiCost;
                    const ownerSkill = c.skills.find((id) => getSkillDef(id)?.move?.id === mv.id);
                    const rank = ownerSkill ? (c.skillRanks?.[ownerSkill] ?? 0) : 0;
                    const effPower = mv.power * (ownerSkill ? rankPowerMult(rank) : 1);
                    const role = combatMoveRole(mv);
                    const stance = resolveMoveStance(mv);
                    const def = ownerSkill ? getSkillDef(ownerSkill) : undefined;
                    const matched = Boolean(
                      def?.weaponKind && equippedWeapon?.weaponKind === def.weaponKind,
                    );
                    const expanded = expandedMoveId === mv.id;
                    return (
                      <div key={mv.id} className="ink-combat-move-row">
                        <button
                          type="button"
                          className={`ink-choice ink-choice--compact ink-choice--stance-${stance}${matched ? ' ink-choice--match' : ''}`}
                          disabled={combat.phase !== 'player' || short}
                          style={{ ['--i' as string]: i }}
                          onClick={() => {
                            combatMove(mv.id);
                          }}
                        >
                          <span className="ink-choice-mark" title={`屬性${MOVE_STANCE_LABEL[stance]} · ${role}`}>
                            {MOVE_STANCE_LABEL[stance]}
                          </span>
                          <span className="ink-combat-move">
                            <strong>
                              {mv.name}
                              {matched ? ' · 兵刃契' : ''}
                              {short ? ' · 內息不足' : ''}
                            </strong>
                            <em className="ink-combat-move-meta">{formatCombatMoveCompact(mv, effPower)}</em>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="ink-combat-detail-btn"
                          aria-expanded={expanded}
                          onClick={() => {
                            setExpandedMoveId(expanded ? null : mv.id);
                          }}
                        >
                          {expanded ? '收' : '詳'}
                        </button>
                        {expanded && (
                          <p className="ink-combat-move-detail">
                            {mv.description}
                            {ownerSkill && rank > 0 ? ' · 階位加持' : ''}
                            {def?.weaponKind
                              ? ` · 宜${WEAPON_KIND_LABEL[def.weaponKind] ?? def.weaponKind}`
                              : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {visibleTechniques.length === 0 && (
                    <p className="ink-note">此路暫無招式，可回「全部」再觀。</p>
                  )}
                </div>

                <div className="ink-combat-actions">
                  <button
                    type="button"
                    className="ink-combat-log-toggle"
                    aria-expanded={combatActionsOpen}
                    onClick={() => {
                      setCombatActionsOpen((v) => !v);
                    }}
                  >
                    {combatActionsOpen ? '收起行動' : '行動（守／蓄／遁）'}
                  </button>
                  {combatActionsOpen && (
                    <div className="ink-combat-action-bar">
                      {actionMoves.map((mv) => {
                        const short = combat.player.qi < mv.qiCost;
                        const mark =
                          mv.id === GUARD_STANCE.id ? '守' : mv.id === CHARGE_STANCE.id ? '蓄' : '遁';
                        const stance = resolveMoveStance(mv);
                        return (
                          <button
                            key={mv.id}
                            type="button"
                            className={`ink-combat-action ink-choice--stance-${stance}`}
                            disabled={combat.phase !== 'player' || short}
                            title={`${mv.description} · ${MOVE_STANCE_LABEL[stance]}`}
                            onClick={() => {
                              combatMove(mv.id);
                            }}
                          >
                            <strong>
                              {MOVE_STANCE_LABEL[stance]}·{mark} {mv.name}
                            </strong>
                            <span>
                              {mv.id === GUARD_STANCE.id
                                ? '架 · 回息守中'
                                : mv.id === CHARGE_STANCE.id
                                  ? `虛 · 耗${mv.qiCost} · 下一擊加威`
                                  : '虛 · 伺機離場'}
                              {short ? ' · 不足' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {showResult &&
        lastResult &&
        createPortal(
          <div className="ink-modal" role="dialog" aria-modal="true" aria-label="結果">
            <div
              className={`ink-modal-card ink-result ink-result--staged${lastResult.deltas.some(isLearnSkillDeltaLine) ? ' ink-result--learn-skill' : ''}`}
            >
              <InkResultSeal
                text={
                  resultKind === 'practice'
                    ? '修'
                    : lastResult.title === '整裝'
                      ? '裝'
                      : lastResult.deltas.some(isLearnSkillDeltaLine)
                        ? '武'
                        : '定'
                }
              />
              <p className="ink-event-year">
                {resultKind === 'practice'
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
                    className={`ink-event-body${isLearnSkillStoryLine(para) ? ' ink-event-body--learn-skill' : ''}`}
                  >
                    {para.replace(LEARN_SKILL_MARKER, '')}
                  </p>
                ))}
              </div>
              {lastResult.deltas.length > 0 && (
                <div className="ink-result-deltas">
                  <p className="ink-result-delta-label">
                    {lastResult.deltas.some(isLearnSkillDeltaLine) ? '新學武學' : '此番消長'}
                  </p>
                  <ul className="ink-delta-board" aria-label="此番消長">
                    {lastResult.deltas.map((d, i) => {
                      const learn = isLearnSkillDeltaLine(d);
                      const tone = learn
                        ? 'learn'
                        : /[+\uFF0B]/.test(d)
                          ? 'up'
                          : /[-－\u2212]/.test(d)
                            ? 'down'
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
                  clearResult();
                }}
              >
                已知曉 · 掩卷
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
            轉世再入江湖
          </button>
          <p className="ink-note ink-note--center">
            前世武學餘韻
            {c.flags.family_legacy || c.flags.legacy_teacher
              ? `與${[c.flags.family_legacy ? '族規' : '', c.flags.legacy_teacher ? '傳功' : ''].filter(Boolean).join('、')}`
              : ''}
            將淡淡帶入來世。
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
