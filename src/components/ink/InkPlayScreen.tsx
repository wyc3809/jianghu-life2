import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { natureKeys, natureLabels } from '@interfaces/lifeEngine';
import { useLifeStore } from '../../store/lifeStore';
import { resolvePendingEvent } from '@core/life/eventEngine';
import { hasEnoughActionPoints } from '@core/life/actionPoints';
import { seasonLabel } from '@core/life/monthly';
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
import { InkGearCompareModal } from './InkGearCompareModal';
import { InkGlyphText } from './InkGlyphText';
import { titleTierColorClass, topTitle, topTitles } from '@core/life/titles';
import { JIANGHU_RANK_START, jianghuRank } from '@core/life/jianghuRank';
import { jianghuPrestige, jianghuPrestigeTier } from '@core/life/jianghuPrestige';
import { InkCultivationHud } from './InkCultivationHud';
import { InkBrushBar } from './InkBrush';
import { InkOfflineGainModal } from './InkOfflineGainModal';
import { useCultivationTicker } from '../../hooks/useCultivationTicker';
import {
  isLearnSkillDeltaLine,
  isLearnSkillStoryLine,
  isRankUpStoryLine,
  LEARN_SKILL_MARKER,
  RANK_UP_MARKER,
} from '@core/life/playerText';
import { ensureNature, dominantNature, natureSummary } from '@core/life/nature';
import { coachCopy, nextCoachStep } from '@core/life/tutorial';
import { track } from '../../telemetry/events';
import { seasonToInk, placeToInk, isInkNight, shouldReduceInkMotion } from './sceneVariants';
import { InkScrollBackdrop, InkSealStamp, InkResultSeal, InkStaticSeal, InkAiWashLayer } from './InkDecor';
import { inkAiUrl } from '../../ui/inkAiCatalog';
import { InkHuashanPanel } from './InkHuashanPanel';
import { InkSectFounderPanel } from './InkSectFounderPanel';
import { InkPersonPanel, type PersonView } from './InkPersonPanel';
import { InkEventPanel } from './InkEventPanel';
import { InkCombatPanel } from './InkCombatPanel';
import { InkBossIntro } from './InkBossIntro';
import { InkBreakthroughModal } from './InkBreakthroughModal';
import { InkMomentFx } from './InkMomentFx';
import { InkPracticePanel, type PracticeView } from './InkPracticePanel';
import { InkSparStage } from './InkSparStage';
import { LifeDebugPanel } from '../LifeDebugPanel';
import { useAncestryStore } from '../../store/ancestryStore';
import { InkAncestryPanel } from './InkAncestryPanel';
import { flyInkDots } from '../../ui/hudFlyer';
import { parseDelta, splitFeedback, type ResultNotice } from '../../ui/resultFormat';

/** 經過超過幾多字就先摺起（約四行） */
const RESULT_STORY_CLAMP_CHARS = 72;
import { useRollingNumber } from '../../hooks/useRollingNumber';
import { HighlightFxLazy, canUseWebGL, prefetchHighlight } from '../../fx/highlight';
import { breakthroughHighlight, momentHighlight } from '../../fx/highlight/fromGame';

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
  const combatSetInternalMode = useLifeStore((s) => s.combatSetInternalMode);
  const combatResolveFoe = useLifeStore((s) => s.combatResolveFoe);
  const resolveGearCompare = useLifeStore((s) => s.resolveGearCompare);
  const clearResult = useLifeStore((s) => s.clearResult);
  const lastResult = useLifeStore((s) => s.lastResult);
  const debugOpen = useLifeStore((s) => s.debugOpen);
  const setDebugOpen = useLifeStore((s) => s.setDebugOpen);
  const setTab = useLifeStore((s) => s.setTab);
  const huashanStart = useLifeStore((s) => s.huashanStart);
  const huashanFight = useLifeStore((s) => s.huashanFight);
  const huashanDismissReport = useLifeStore((s) => s.huashanDismissReport);
  const huashanClose = useLifeStore((s) => s.huashanClose);
  const foundSect = useLifeStore((s) => s.foundSect);
  const recruitDisciple = useLifeStore((s) => s.recruitDisciple);
  const teachDisciple = useLifeStore((s) => s.teachDisciple);
  const equipOwned = useLifeStore((s) => s.equipOwned);
  const sealText = useLifeStore((s) => s.sealText);
  const flashLines = useLifeStore((s) => s.flashLines);
  const clearSeal = useLifeStore((s) => s.clearSeal);
  const tickCultivation = useLifeStore((s) => s.tickCultivation);
  const attemptBreakthrough = useLifeStore((s) => s.attemptBreakthrough);
  const breakthroughResult = useLifeStore((s) => s.breakthroughResult);
  const clearBreakthroughResult = useLifeStore((s) => s.clearBreakthroughResult);
  const ackMoment = useLifeStore((s) => s.ackMoment);
  const offlineGain = useLifeStore((s) => s.offlineGain);
  const clearOfflineGain = useLifeStore((s) => s.clearOfflineGain);
  const [practiceView, setPracticeView] = useState<PracticeView>('main');
  const [personView, setPersonView] = useState<PersonView>('main');
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
  /** Boss 動畫：記低已播過邊個 combat.id，避免同一場交手 re-render 時重播 */
  const [bossIntroShownFor, setBossIntroShownFor] = useState<string | null>(null);
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
    else if (sealText === '勝' || sealText === '武' || sealText === '晉' || sealText === '宗' || sealText === '收' || sealText === '教') playInkWin();
    else if (sealText === '敗' || sealText === '終') playInkLose();
    else if (sealText === '戰') playInkBlade();
    else playInkSeal();
    // 保險：正常由 InkSealStamp onAnimationEnd 清；呢度只係後備，要長過 --motion-ritual（1.2s）
    const t = window.setTimeout(() => clearSeal(), 1300);
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
    // 同 CSS 翻頁動畫（--motion-slow 0.7s）對齊，略長少少等佢播完
    const t = window.setTimeout(() => setMonthTurning(false), 760);
    return () => window.clearTimeout(t);
  }, [state.year, state.month]);

  useEffect(() => {
    if ((state.tab ?? 'home') !== 'practice') setPracticeView('main');
    if ((state.tab ?? 'home') !== 'person') setPersonView('main');
  }, [state.tab]);

  const c = state.character;
  useCultivationTicker(state.phase === 'playing' && c.alive, tickCultivation);
  const month = state.month ?? 1;
  const pendingEvent = resolvePendingEvent(state);
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const hasHeir = (c.childrenCount ?? 0) > 0;
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
  const showBossIntro = Boolean(
    combat && combat.foePower === 'boss' && bossIntroShownFor !== combat.id,
  );

  const practiceLeft = state.practiceActionsLeft ?? 3;
  const busy = Boolean(state.pending) || Boolean(combat) || showResult || !c.alive;
  const practiceBusy = busy || practiceLeft <= 0;
  const onPracticeTab = tab === 'practice';
  const onHomeTab = tab === 'home';
  const enoughActionPoints = hasEnoughActionPoints(state);
  const canAdvanceMonthGlobal =
    state.phase === 'playing' && !state.pending && !combat && c.alive && !showResult && enoughActionPoints;
  const nature = ensureNature(c);
  const dominant = dominantNature(c);
  /** 有待決事件時進入專注版面，避免選項被頂欄／年譜擠出可視區 */
  const eventFocus =
    state.phase === 'playing' && Boolean(pendingEvent) && !showResult && !combat;
  /** 交手中隱藏全局氣血條，避免與戰鬥血條重複 */
  // 有重傷／傷殘：名字旁朱砂點（撳入人物欄）
  const worstInjury = (c.injuries ?? []).reduce<'heavy' | 'crippled' | null>(
    (w, x) => (x.tier === 'crippled' ? 'crippled' : x.tier === 'heavy' && w !== 'crippled' ? 'heavy' : w),
    null,
  );
  const woundLabel = worstInjury === 'crippled' ? '傷殘' : worstInjury === 'heavy' ? '重傷' : null;
  // 高光時刻（3D）：學武／升階／新裝備／突破成功；冇 WebGL 就退返水墨特效
  const headMoment = state.moments?.[0];
  const momentKey = headMoment ? JSON.stringify(headMoment) : '';
  const momentFx = useMemo(
    () => (headMoment && canUseWebGL() ? momentHighlight(state, headMoment) : null),
    // 只喺換咗時刻先重算（播放中遊戲狀態變都唔好重設演出）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [momentKey],
  );
  const breakthroughFx = useMemo(
    () => (breakthroughResult && canUseWebGL() ? breakthroughHighlight(state, breakthroughResult) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [breakthroughResult],
  );
  useEffect(() => {
    if (state.phase !== 'playing' || !canUseWebGL()) return;
    // 開局後閒時預載 Three.js／GSAP，真正要播時唔使等
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(prefetchHighlight);
    else window.setTimeout(prefetchHighlight, 3000);
  }, [state.phase]);

  // 數字飛入：銀兩／威望增加時墨點飛入頂欄，飛到先滾數字
  const moneyChipRef = useRef<HTMLSpanElement>(null);
  const prestigeRef = useRef<HTMLElement>(null);
  const moneyNow = Math.round(c.money ?? 0);
  const prestigeNow = jianghuPrestige(state);
  const prevMoney = useRef(moneyNow);
  const prevPrestige = useRef(prestigeNow);
  const moneyDelay = useRef(0);
  const prestigeDelay = useRef(0);
  useEffect(() => {
    const dm = moneyNow - prevMoney.current;
    const dp = prestigeNow - prevPrestige.current;
    prevMoney.current = moneyNow;
    prevPrestige.current = prestigeNow;
    moneyDelay.current = 0;
    prestigeDelay.current = 0;
    if (combat || (dm <= 0 && dp <= 0)) return;
    // 喺數字滾動 effect 之前寫好延遲（同一輪 effect，順序按宣告）
    moneyDelay.current = dm > 0 ? flyInkDots(moneyChipRef.current, Math.ceil(dm / 10), 'gold') * 0.8 : 0;
    prestigeDelay.current = dp > 0 ? flyInkDots(prestigeRef.current, Math.ceil(dp / 20), 'cinnabar') * 0.8 : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moneyNow, prestigeNow]);
  const moneyShown = useRollingNumber(moneyNow, { delayRef: moneyDelay });
  const prestigeShown = useRollingNumber(prestigeNow, { delayRef: prestigeDelay });

  // 祖蔭：人生到總結就結算一次（角色 flag 防重複）
  const ancestryAward = useAncestryStore((s) => s.award);
  const ancestryPoints = useAncestryStore((s) => s.meta.points);
  const awardCurrentLife = useAncestryStore((s) => s.awardCurrentLife);
  const ancestryOpen = useAncestryStore((s) => s.panelOpen);
  const setAncestryOpen = useAncestryStore((s) => s.setPanelOpen);
  useEffect(() => {
    if (state.phase === 'summary') awardCurrentLife();
  }, [state.phase, awardCurrentLife]);

  // 結果彈窗：故事同系統訊息分開、長文先摺起
  const [resultStoryOpen, setResultStoryOpen] = useState(false);
  const resultStory = useMemo(() => {
    const paras: { text: string; learn: boolean }[] = [];
    const notices: ResultNotice[] = [];
    for (const raw of (lastResult?.feedback ?? '').split(/\n\n+/)) {
      const learn = isLearnSkillStoryLine(raw) || isRankUpStoryLine(raw);
      const split = splitFeedback(raw.replace(LEARN_SKILL_MARKER, '').replace(RANK_UP_MARKER, ''));
      notices.push(...split.notices);
      for (const text of split.story) paras.push({ text, learn });
    }
    const chars = paras.reduce((n, p) => n + p.text.length, 0);
    return { paras, notices, long: chars > RESULT_STORY_CLAMP_CHARS };
  }, [lastResult]);
  useEffect(() => setResultStoryOpen(false), [lastResult]);

  const showVitalsBars = !combat && !eventFocus && (tab === 'home' || tab === 'person');
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
    // 選項必須即時可點：唔好再用 opacity:0 + pointer-events:none 閘住，
    // 否則玩家會以為「點不到選項」。動畫只做視覺，唔擋互動。
    if (!eventFocus || !pendingEvent) {
      setChoicesReady(false);
      return;
    }
    setChoicesReady(true);
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

  const inkSeason = seasonToInk(month);
  const inkPlace = placeToInk(c.location);

  const leadTitle = topTitle(state);
  /** 頭銜已喺全名右邊顯示，呢度只補列第二、三名，避免重複 */
  const nicknames = topTitles(state).slice(1);
  const rank = jianghuRank(state);
  const prestige = jianghuPrestige(state);
  const prestigeTierLabel = jianghuPrestigeTier(prestige);
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
    /* 底部分卷導航顯示時：預留空間（條件同下方 <nav className="ink-tabs"> 一致） */
    !combat && !eventFocus ? 'scroll-shell--has-tabs' : '',
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

      {offlineGain !== null && (
        <InkOfflineGainModal gain={offlineGain} onClose={clearOfflineGain} />
      )}

      <header className="ink-status ink-status--bare-top">
        <div className="ink-status-row">
          <div className="ink-identity">
            <p className="ink-status-kicker">
              第{state.year}年 · {seasonLabel(month)}
            </p>
            <h2 className="ink-name">
              {c.name}
              {woundLabel && !combat && (
                <button
                  type="button"
                  className="ink-name-wound"
                  aria-label={`身有${woundLabel}，查看傷勢`}
                  title={woundLabel}
                  onClick={() => {
                    setTab('person');
                    setPersonView('main');
                  }}
                />
              )}
              {leadTitle && (
                <span className={`ink-name-title ${titleTierColorClass(leadTitle.tier)}`}>
                  {leadTitle.label}
                </span>
              )}
            </h2>
            <p className="ink-meta">
              {c.age}歲
              {c.location ? ` · ${c.location}` : ''}
              {sect ? ` · ${sect.name}` : ''}
              {nicknames.length ? ` · ${nicknames.join('·')}` : ''}
            </p>
          </div>
          {showVitalsBars && (
            <div className="ink-vitals-meters ink-vitals-meters--bare" aria-label="氣血內力">
              <div className="ink-meter">
                <div className="ink-vitals-label">
                  <span>氣血</span>
                  <span>
                    {Math.round(c.health)}/{c.maxHealth}
                  </span>
                </div>
                <div
                  className="ink-meter-bar"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={c.maxHealth}
                  aria-valuenow={Math.round(c.health)}
                  aria-label="氣血"
                >
                  <InkBrushBar pct={hpPct} tone="cinnabar" />
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
                  className="ink-meter-bar"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={c.maxQi ?? 0}
                  aria-valuenow={Math.round(c.qi ?? 0)}
                  aria-label="內力"
                >
                  <InkBrushBar pct={qiPct} tone="ink" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ink-status-metaline">
          <span ref={moneyChipRef} className="ink-money-chip" aria-label={`銀両 ${Math.round(c.money ?? 0)}`}>
            <img className="ink-label-img" src={`${import.meta.env.BASE_URL || '/'}ink/ui/label-yinliang.webp`} alt="" aria-hidden draggable={false} />
            <InkGlyphText text={moneyShown.toLocaleString('zh-Hant')} height={14} />
          </span>
          <div
            className="ink-ap-meter"
            role="meter"
            aria-label="疲勞度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(100 - (c.actionPoints ?? 0))}
          >
            <img className="ink-label-img ink-label-img--ap" src={`${import.meta.env.BASE_URL || '/'}ink/ui/label-pilao.webp`} alt="疲勞度" draggable={false} />
            <InkGlyphText text={`${Math.round(100 - (c.actionPoints ?? 0))}/100`} height={13} className="ink-ap-meter-value" />
          </div>
          <span className="ink-metaline-prestige">
            威望 <b ref={prestigeRef}>{prestigeShown}</b> · {prestigeTierLabel} · {rank >= JIANGHU_RANK_START ? '未列名' : `第${rank}位`}
          </span>
          <div className="ink-status-buttons">
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

      <div className="ink-play-body">

      {/* 待決事件：專注版面，選項固定在可視區底部 */}
      {eventFocus && pendingEvent && (
        <InkEventPanel
          key={`${pendingEvent.id}-${state.year}-${month}`}
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
          {/* 演武台直接用地圖 banner 嘅鎮景長卷做背景，季節・地點名浮喺動畫入面，唔再分開兩張圖 */}
          <div className="ink-home-scene">
            <InkSparStage
              reduceMotion={reduceMotion}
              background="town"
              overlay={
                <p className="ink-spar-caption">
                  <span>
                    {seasonLabel(month)} · {state.year}年{month}月
                  </span>
                  <strong>{c.location || '千燈鎮'}</strong>
                </p>
              }
            />
          </div>

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

      {tab === 'jianghu' && !combat && !eventFocus && (
        <InkSectFounderPanel
          state={state}
          onFound={foundSect}
          onRecruit={recruitDisciple}
          onTeach={teachDisciple}
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
          onBreakthrough={attemptBreakthrough}
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

      {combat && state.phase === 'playing' && showBossIntro && (
        <InkBossIntro
          foeName={combat.foe.name}
          hp={combat.foe.hp}
          maxHp={combat.foe.maxHp}
          onDone={() => setBossIntroShownFor(combat.id)}
        />
      )}

      {combat && state.phase === 'playing' && !showBossIntro && (
        <InkCombatPanel
          state={state}
          combat={combat}
          onMove={combatMove}
          onResolveFoe={combatResolveFoe}
          onSetInternalMode={combatSetInternalMode}
        />
      )}

      {breakthroughResult &&
        (breakthroughFx ? (
          <Suspense fallback={null}>
            <HighlightFxLazy config={breakthroughFx} onDone={clearBreakthroughResult} />
          </Suspense>
        ) : (
          <InkBreakthroughModal result={breakthroughResult} onClose={clearBreakthroughResult} />
        ))}

      {/* 特效時刻：等戰鬥、結果匣、落印、突破都完咗先播；新裝備（寶箱）排喺換裝詢問之前 */}
      {headMoment &&
        state.phase === 'playing' &&
        !combat &&
        !showResult &&
        !sealText &&
        !breakthroughResult &&
        (!state.pendingGearCompare || headMoment.kind === 'loot') &&
        (momentFx ? (
          <Suspense fallback={null}>
            <HighlightFxLazy key={momentKey} config={momentFx} onDone={ackMoment} />
          </Suspense>
        ) : (
          <InkMomentFx key={momentKey} moment={headMoment} onDone={ackMoment} sectId={state.character.sectId} />
        ))}

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
              {lastResult.choiceText && (
                <p className="ink-result-choice">
                  <span className="ink-result-choice-tag">所擇</span>
                  {lastResult.choiceText}
                </p>
              )}
              <div
                className={`ink-result-story${resultStory.long && !resultStoryOpen ? ' ink-result-story--clamped' : ''}`}
              >
                {resultStory.paras.map((para, i) => (
                  <p
                    key={`${i}-${para.text.slice(0, 12)}`}
                    className={`ink-event-body${para.learn ? ' ink-event-body--learn-skill' : ''}`}
                  >
                    {para.text}
                  </p>
                ))}
              </div>
              {resultStory.long && (
                <button
                  type="button"
                  className="ink-result-more"
                  aria-expanded={resultStoryOpen}
                  onClick={() => setResultStoryOpen((v) => !v)}
                >
                  {resultStoryOpen ? '收起' : '展開全文'}
                </button>
              )}
              {resultStory.notices.length > 0 && (
                <ul className="ink-result-notices" aria-label="江湖記事">
                  {resultStory.notices.map((n, i) => (
                    <li key={`${n.label}-${n.text}-${i}`} className="ink-result-notice">
                      <b>{n.label}</b>
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
              {lastResult.deltas.length > 0 && resultDeltasReady && (
                <div className="ink-result-deltas">
                  <p className="ink-result-delta-label">
                    {lastResult.deltas.some(isLearnSkillDeltaLine) ? '新學武學' : '此番消長'}
                  </p>
                  <ul className="ink-delta-chips" aria-label="此番消長">
                    {lastResult.deltas.map((d, i) => {
                      if (isLearnSkillDeltaLine(d)) {
                        return (
                          <li key={`${i}-${d}`} className="ink-delta-chip ink-delta-chip--learn" style={{ ['--i' as string]: i }}>
                            {d.replace(LEARN_SKILL_MARKER, '')}
                          </li>
                        );
                      }
                      const chip = parseDelta(d);
                      return (
                        <li
                          key={`${i}-${d}`}
                          className={`ink-delta-chip ink-delta-chip--${chip.tone}`}
                          style={{ ['--i' as string]: i }}
                          title={chip.note}
                        >
                          <span className="ink-delta-chip-label">{chip.label}</span>
                          {chip.value && <span className="ink-delta-chip-value">{chip.value}</span>}
                          {chip.note && <span className="ink-delta-chip-note">{chip.note}</span>}
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

      {!combat && !eventFocus && !showResult && state.pendingGearCompare && headMoment?.kind !== 'loot' && (
        <InkGearCompareModal
          state={state}
          onEquip={() => resolveGearCompare('equip')}
          onKeep={() => resolveGearCompare('keep')}
        />
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

      {ancestryOpen && <InkAncestryPanel onClose={() => setAncestryOpen(false)} />}

      {state.phase === 'summary' && (
        <section className="ink-panel ink-epitaph">
          <h3>掩卷</h3>
          <pre className="ink-epitaph-text">{state.summaryText}</pre>
          <InkStaticSeal text="終" className="ink-seal-static--end" />
          {ancestryAward && ancestryAward.total > 0 && (
            <p className="ink-ancestry-summary">
              祖蔭 <b>＋{ancestryAward.total}</b>
              <br />
              {ancestryAward.parts.map((p) => `${p.label} ${p.value}`).join(' · ')}
            </p>
          )}
          <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setAncestryOpen(true)}>
            入祖祠 · 祖蔭 {ancestryPoints} 點
          </button>
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
              '這一世沒有子女，血脈不傳；祖蔭仍在，下一世照樣受用。'
            )}
          </p>
        </section>
      )}

      {onPracticeTab && !combat && !showResult && !eventFocus && (
        <p className="ink-note ink-note--center">修煉不催歲月——按下方圓鈕過一月。</p>
      )}
      {(tab === 'person' || tab === 'jianghu') && !combat && !showResult && !eventFocus && (
        <p className="ink-note ink-note--center">按下方圓鈕即可過一月。</p>
      )}

      </div>

      {!combat && !eventFocus && (
        <nav className="ink-tabs" aria-label="分卷">
          {(
            [
              ['home', '鎮居'],
              ['person', '人物'],
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
              <span className="ink-tab-label">{label}</span>
              <img
                className="ink-tab-icon"
                src={`${import.meta.env.BASE_URL || '/'}ink/icons/tab-${id}.webp`}
                alt=""
                aria-hidden
                decoding="async"
              />
            </button>
          ))}
          <InkCultivationHud
            state={state}
            disabled={!canAdvanceMonthGlobal}
            exhausted={!enoughActionPoints}
            onAdvance={() => {
              advanceMonth();
              setTab('home');
            }}
            onBreakthrough={() => {
              attemptBreakthrough();
              setTab('home');
            }}
          />
          {(
            [
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
              <span className="ink-tab-label">{label}</span>
              <img
                className="ink-tab-icon"
                src={`${import.meta.env.BASE_URL || '/'}ink/icons/tab-${id}.webp`}
                alt=""
                aria-hidden
                decoding="async"
              />
            </button>
          ))}
        </nav>
      )}

      {debugOpen && <LifeDebugPanel state={state} />}
    </div>
  );
}
