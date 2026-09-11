import { useEffect, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  calculateCultivationRate,
  canAttemptBreakthrough,
  currentCultivationTier,
  isCultivationCapped,
} from '@core/life/cultivation';
import { useStillMode, usePrefersReducedMotion } from '../../hooks/useStillMode';
import { barOffset } from './inkStillClass';

const RING_LEN = 100;

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

function spawnXpParticles(): XpParticle[] {
  // 8–12 粒，向外擴散＋輕微隨機偏移（UI 層隨機，唔入遊戲邏輯）
  const count = 8 + Math.floor(Math.random() * 5);
  const stamp = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 30;
    return {
      id: stamp + i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 6,
      size: 4 + Math.random() * 7,
      dur: 800 + Math.random() * 400,
      delay: Math.random() * 120,
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

/** 分卷列中心大圓：修為環形進度（藍色、持續流轉）包住「過一月」按鈕；修為滿咗就變做「突破」按鈕 */
export function InkCultivationHud({ state, onAdvance, onBreakthrough, disabled, exhausted = false }: Props) {
  const committedXp = state.character.cultivation.xp;
  const rate = calculateCultivationRate(state).total;
  const tier = currentCultivationTier(state);
  const capped = isCultivationCapped(state);
  const canBreak = canAttemptBreakthrough(state);
  const still = useStillMode();
  const reduceMotion = usePrefersReducedMotion();

  const [displayXp, setDisplayXp] = useState(committedXp);
  const baseRef = useRef({ xp: committedXp, at: 0 });
  const rafRef = useRef<number | null>(null);
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
    if (still || reduceMotion || Math.abs(to - from) < 0.5) {
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
  }, [committedXp, still, reduceMotion]);

  useEffect(() => {
    if (still || capped || rate <= 0) return;
    // 減少動態效果：每秒更新一次數字（唔停止累積，只係少啲跳動）
    const throttleMs = reduceMotion ? 1000 : 0;
    let lastPaint = 0;
    function frame(now: number) {
      if (rollingRef.current) {
        // 滾動動畫期間交由滾動器更新
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      if (throttleMs === 0 || now - lastPaint >= throttleMs) {
        lastPaint = now;
        const elapsedSec = (now - baseRef.current.at) / 1000;
        setDisplayXp(baseRef.current.xp + rate * elapsedSec);
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [rate, capped, still, reduceMotion]);

  // 修為入賬（事件回饋／閉關所得）時數字跳一跳＋墨跡粒子擴散
  useEffect(() => {
    if (prevCommittedRef.current === committedXp) return;
    const increased = committedXp > prevCommittedRef.current;
    prevCommittedRef.current = committedXp;
    if (!increased || still || reduceMotion) return;
    setXpPop(true);
    setParticles(spawnXpParticles());
    const timer = window.setTimeout(() => setXpPop(false), 650);
    const clearTimer = window.setTimeout(() => setParticles([]), 1400);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [committedXp, still, reduceMotion]);

  // 境界躍升時墨光一閃
  useEffect(() => {
    if (prevTierRef.current === tier.level) return;
    prevTierRef.current = tier.level;
    if (still || reduceMotion) return;
    setGlow(true);
    const timer = window.setTimeout(() => setGlow(false), 900);
    return () => window.clearTimeout(timer);
  }, [tier.level, still, reduceMotion]);

  const shownXp = still ? committedXp : displayXp;
  const shownPct = Number.isFinite(tier.cap)
    ? Math.max(0, Math.min(100, (shownXp / tier.cap) * 100))
    : 100;
  const ringOff = barOffset(RING_LEN, shownPct, 100);

  const isBreakthroughReady = capped && canBreak;
  const blockedByExhaustion = exhausted && !isBreakthroughReady;

  return (
    <span className="ink-nav-center-wrap">
      <span
        className={`ink-nav-center-xp${xpPop ? ' ink-nav-center-xp--pop' : ''}`}
        aria-live="polite"
      >
        修為 {Math.floor(shownXp).toLocaleString('zh-Hant')}
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
        className={`ink-nav-center${glow ? ' ink-nav-center--glow' : ''}${isBreakthroughReady ? ' ink-nav-center--capped' : ''}${blockedByExhaustion ? ' ink-nav-center--exhausted' : ''}`}
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
        <span className="ink-nav-center-inkring" aria-hidden>
          <svg viewBox="0 0 90 90" focusable="false">
            <circle className="inkring-a" cx="45" cy="45" r="41" pathLength={258} />
            <circle className="inkring-b" cx="45" cy="45" r="41" pathLength={257} />
          </svg>
        </span>
        {xpPop && <span className="ink-nav-center-ripple" aria-hidden />}
        <svg className="ink-nav-center-ring" viewBox="0 0 64 64" aria-hidden focusable="false">
          <circle className="ink-nav-center-ring-track" cx="32" cy="32" r="28" pathLength={RING_LEN} />
          <circle
            className="ink-nav-center-ring-fill"
            cx="32"
            cy="32"
            r="28"
            pathLength={RING_LEN}
            style={{ ['--len' as string]: RING_LEN, ['--off' as string]: ringOff }}
          />
          {!capped && <circle className="ink-nav-center-ring-flow" cx="32" cy="32" r="28" pathLength={RING_LEN} />}
        </svg>
        <span className="ink-nav-center-tier">{blockedByExhaustion ? '氣力不繼' : tier.name}</span>
        <span className="ink-nav-center-action">{isBreakthroughReady ? '突破' : '過一月'}</span>
      </button>
    </span>
  );
}
