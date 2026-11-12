import { useEffect, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  effectiveCultivationRate,
  canAttemptBreakthrough,
  currentCultivationTier,
  isCultivationCapped,
} from '@core/life/cultivation';
import { useStillMode, usePrefersReducedMotion } from '../../hooks/useStillMode';
import { InkBrushBar } from './InkBrush';
import { InkBadge } from './InkBadge';
import { inkIconUrl } from '../../ui/inkIcons';
import { watchVisualActivity } from '../../ui/visualActivity';
import { createRng } from '../../fx/ambient/particles';

/** 墨跡粒子：修為入賬時由數字中心向外擴散 */
type XpParticle = {
  id: number;
  /** 終點偏移（px） */
  dx: number;
  dy: number;
  /** 直徑 px */
  size: number;
  /** 動畫時長 ms（0.8–1.2s） */
  dur: number;
  delay: number;
};

function spawnXpParticles(seed: number): XpParticle[] {
  const random = createRng(seed);
  // 8–12 粒，向外擴散＋輕微隨機偏移（UI 層隨機，唔入遊戲邏輯）
  const count = 8 + Math.floor(random() * 5);
  const stamp = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const dist = 24 + random() * 30;
    return {
      id: stamp + i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 6,
      size: 4 + random() * 7,
      dur: 800 + random() * 400,
      delay: random() * 120,
    };
  });
}

/** easeOutExpo：數字由舊值滾到新值 */
function easeOutExpo(p: number): number {
  return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
}

type Props = {
  state: LifeGameState;
  onAdvance: () => void;
  onBreakthrough: () => void;
  disabled: boolean;
  /** 氣力（疲勞度）見底：禁止翻頁，提示歇息 */
  exhausted?: boolean;
};

/** 分卷列中心菱形牌章：保留修為進度及「過一月」／「突破」行為 */
export function InkCultivationHud({ state, onAdvance, onBreakthrough, disabled, exhausted = false }: Props) {
  const committedXp = state.character.cultivation.xp;
  const rate = effectiveCultivationRate(state);
  const tier = currentCultivationTier(state);
  const capped = isCultivationCapped(state);
  const canBreak = canAttemptBreakthrough(state);
  const still = useStillMode();
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [visualActive, setVisualActive] = useState(false);
  useEffect(() => watchVisualActivity(setVisualActive, {
    element: rootRef.current ?? undefined, covered: true, dialogs: true,
  }), []);

  const [displayXp, setDisplayXp] = useState(committedXp);
  const baseRef = useRef({ xp: committedXp, at: performance.now() });
  const rollRef = useRef<number | null>(null);
  const rollingRef = useRef(false);
  const displayXpRef = useRef(committedXp);
  const [glow, setGlow] = useState(false);
  const [xpPop, setXpPop] = useState(false);
  const [particles, setParticles] = useState<XpParticle[]>([]);
  const prevTierRef = useRef(tier.level);
  const prevCommittedRef = useRef(committedXp);

  useEffect(() => {
    displayXpRef.current = displayXp;
  });

  // 修為入賬：數字由舊值滾到新值（0.6s easeOutExpo）
  useEffect(() => {
    const from = displayXpRef.current;
    const to = committedXp;
    const now = performance.now();
    if (rollRef.current !== null) cancelAnimationFrame(rollRef.current);
    if (still || reduceMotion || !visualActive || Math.abs(to - from) < 0.5) {
      rollingRef.current = false;
      baseRef.current = { xp: to, at: now };
      setDisplayXp(to);
      return;
    }
    rollingRef.current = true;
    const startedAt = now;
    const step = (t: number) => {
      const p = Math.min(1, (t - startedAt) / 600);
      const v = from + (to - from) * easeOutExpo(p);
      displayXpRef.current = v;
      setDisplayXp(v);
      if (p < 1) {
        rollRef.current = requestAnimationFrame(step);
      } else {
        rollingRef.current = false;
        baseRef.current = { xp: to, at: performance.now() };
      }
    };
    rollRef.current = requestAnimationFrame(step);
    return () => {
      if (rollRef.current !== null) cancelAnimationFrame(rollRef.current);
    };
  }, [committedXp, still, reduceMotion, visualActive, rate]);

  useEffect(() => {
    if (still || capped || rate <= 0 || !visualActive) return;
    // 數字每100ms已足夠；減少動態每秒一次。隱藏／彈窗遮住時不輪詢。
    // 真修為仍由useCultivationTicker入帳，呢度只作有上限嘅視覺預估。
    const timer = window.setInterval(() => {
      if (rollingRef.current) return;
      const elapsedSec = Math.max(0, (performance.now() - baseRef.current.at) / 1000);
      setDisplayXp(Math.min(tier.cap, baseRef.current.xp + rate * elapsedSec));
    }, reduceMotion ? 1000 : 100);
    return () => window.clearInterval(timer);
  }, [rate, capped, still, reduceMotion, visualActive, tier.cap]);

  // 修為入賬（事件回饋／閉關所得）時數字跳一跳＋墨跡粒子擴散
  useEffect(() => {
    if (still || reduceMotion || !visualActive) {
      prevCommittedRef.current = committedXp;
      setXpPop(false); setParticles([]); return;
    }
    if (prevCommittedRef.current === committedXp) return;
    const increased = committedXp > prevCommittedRef.current;
    prevCommittedRef.current = committedXp;
    if (!increased) return;
    setXpPop(true);
    setParticles(spawnXpParticles(state.seed + Math.floor(committedXp)));
    const timer = window.setTimeout(() => setXpPop(false), 650);
    const clearTimer = window.setTimeout(() => setParticles([]), 1400);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [committedXp, still, reduceMotion, visualActive, state.seed]);

  // 境界躍升時墨光一閃
  useEffect(() => {
    if (still || reduceMotion || !visualActive) {
      prevTierRef.current = tier.level;
      setGlow(false); return;
    }
    if (prevTierRef.current === tier.level) return;
    prevTierRef.current = tier.level;
    setGlow(true);
    const timer = window.setTimeout(() => setGlow(false), 900);
    return () => window.clearTimeout(timer);
  }, [tier.level, still, reduceMotion, visualActive]);

  const shownXp = Math.min(tier.cap, still || !visualActive ? committedXp : displayXp);
  const shownPct = Number.isFinite(tier.cap)
    ? Math.max(0, Math.min(100, (shownXp / tier.cap) * 100))
    : 100;

  const isBreakthroughReady = capped && canBreak;
  const blockedByExhaustion = exhausted && !isBreakthroughReady;

  return (
    <span ref={rootRef} className="ink-nav-center-wrap">
      <span
        className={`ink-nav-center-xp${xpPop ? ' ink-nav-center-xp--pop' : ''}`}
        aria-label={`修為 ${Math.floor(committedXp).toLocaleString('zh-Hant')}`}
      >
        <span aria-hidden="true">修為 {Math.floor(shownXp).toLocaleString('zh-Hant')}</span>
        {particles.map((p) => (
          <span
            key={p.id}
            className="ink-xp-particle"
            aria-hidden
            style={{
              ['--dx' as string]: `${p.dx.toFixed(1)}px`,
              ['--dy' as string]: `${p.dy.toFixed(1)}px`,
              ['--sz' as string]: `${p.size.toFixed(1)}px`,
              ['--dur' as string]: `${p.dur}ms`,
              ['--delay' as string]: `${p.delay.toFixed(0)}ms`,
            }}
          />
        ))}
      </span>
      <button
        type="button"
        className={`ink-nav-center ink-nav-center--badge${glow ? ' ink-nav-center--glow' : ''}${isBreakthroughReady ? ' ink-nav-center--capped' : ''}${blockedByExhaustion ? ' ink-nav-center--exhausted' : ''}`}
        onClick={isBreakthroughReady ? onBreakthrough : onAdvance}
        disabled={isBreakthroughReady ? false : disabled}
        aria-label={
          isBreakthroughReady
            ? `修為已滿．突破（${tier.name}）`
            : blockedByExhaustion
              ? '過勞未歇，調息片刻先好翻頁'
              : `翻過一頁．過一月（${tier.name}．${Math.floor(shownXp).toLocaleString('zh-Hant')}）`
        }
      >
        <InkBadge src={inkIconUrl(isBreakthroughReady ? 'censer' : 'scroll', 80)}
          label={isBreakthroughReady ? '突破' : '過一月'} size={80}
          tone={isBreakthroughReady ? 'red' : 'brown'} className="ink-month-badge" />
        <InkBrushBar className="ink-month-progress" pct={shownPct}
          tone={isBreakthroughReady ? 'cinnabar' : 'ink'} />
        <span className="ink-nav-center-tier">{blockedByExhaustion ? '氣力不繼' : tier.name}</span>
      </button>
    </span>
  );
}
