import { useEffect, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  calculateCultivationRate,
  currentCultivationTier,
  isCultivationCapped,
} from '@core/life/cultivation';
import { useStillMode, usePrefersReducedMotion } from '../../hooks/useStillMode';
import { barOffset } from './inkStillClass';

const RING_LEN = 100;

type Props = {
  state: LifeGameState;
  onAdvance: () => void;
  disabled: boolean;
};

/** 分卷列中心大圓：修為環形進度（藍色、持續流轉）包住「過一月」按鈕 */
export function InkCultivationHud({ state, onAdvance, disabled }: Props) {
  const committedXp = state.character.cultivation.xp;
  const rate = calculateCultivationRate(state).total;
  const tier = currentCultivationTier(state);
  const capped = isCultivationCapped(state);
  const still = useStillMode();
  const reduceMotion = usePrefersReducedMotion();

  const [displayXp, setDisplayXp] = useState(committedXp);
  const baseRef = useRef({ xp: committedXp, at: 0 });
  const rafRef = useRef<number | null>(null);
  const [glow, setGlow] = useState(false);
  const prevTierRef = useRef(tier.level);

  useEffect(() => {
    baseRef.current = { xp: committedXp, at: performance.now() };
    setDisplayXp(committedXp);
  }, [committedXp]);

  useEffect(() => {
    if (still || capped || rate <= 0) return;
    // 減少動態效果：每秒更新一次數字（唔停止累積，只係少啲跳動）
    const throttleMs = reduceMotion ? 1000 : 0;
    let lastPaint = 0;
    function frame(now: number) {
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

  return (
    <button
      type="button"
      className={`ink-nav-center${glow ? ' ink-nav-center--glow' : ''}`}
      onClick={onAdvance}
      disabled={disabled}
      aria-label={`翻過一頁．過一月（${tier.name}．${Math.floor(shownXp).toLocaleString('zh-Hant')}）`}
    >
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
      <span className="ink-nav-center-tier">{tier.name}</span>
      <span className="ink-nav-center-action">{capped ? '可突破' : '過一月'}</span>
      {capped && <span className="ink-nav-center-capped-dot" aria-hidden />}
    </button>
  );
}
