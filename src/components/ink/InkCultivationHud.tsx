import { useEffect, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  calculateCultivationRate,
  currentCultivationTier,
  isCultivationCapped,
} from '@core/life/cultivation';
import { useStillMode, usePrefersReducedMotion } from '../../hooks/useStillMode';
import { inkAiUrl } from '../../ui/inkAiCatalog';
import { barOffset } from './inkStillClass';

const RING_LEN = 100;

/** 頂欄跳動嘅修為數字：唔靠撳嘢，開住遊戲都會郁；配合環形進度＋墨光閃動 */
export function InkCultivationHud({ state }: { state: LifeGameState }) {
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
    <div className={`ink-cultivation-hud${capped ? ' ink-cultivation-hud--capped' : ''}${glow ? ' ink-cultivation-hud--glow' : ''}`}>
      <span className="ink-cultivation-badge">
        <svg className="ink-cultivation-ring" viewBox="0 0 32 32" aria-hidden focusable="false">
          <circle className="ink-cultivation-ring-track" cx="16" cy="16" r="14" pathLength={RING_LEN} />
          <circle
            className="ink-cultivation-ring-fill"
            cx="16"
            cy="16"
            r="14"
            pathLength={RING_LEN}
            style={{ ['--len' as string]: RING_LEN, ['--off' as string]: ringOff }}
          />
        </svg>
        <img className="ink-cultivation-motif" src={inkAiUrl('motif-scroll')} alt="" aria-hidden decoding="async" />
      </span>
      <span className="ink-cultivation-text">
        <span className="ink-cultivation-tier">{tier.name}</span>
        <span className="ink-cultivation-xp">{Math.floor(shownXp).toLocaleString('zh-Hant')}</span>
      </span>
      {capped && <span className="ink-cultivation-capped-tag">可突破</span>}
    </div>
  );
}
