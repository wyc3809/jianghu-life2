import { useEffect, useRef, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  calculateCultivationRate,
  currentCultivationTier,
  isCultivationCapped,
} from '@core/life/cultivation';
import { useStillMode, usePrefersReducedMotion } from '../../hooks/useStillMode';

/** 頂欄跳動嘅修為數字：唔靠撳嘢，開住遊戲都會郁 */
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

  const shownXp = still ? committedXp : displayXp;

  return (
    <div className="ink-cultivation-hud">
      <span className="ink-cultivation-tier">{tier.name}</span>
      <span className="ink-cultivation-xp">{Math.floor(shownXp).toLocaleString('zh-Hant')}</span>
      {capped && <span className="ink-cultivation-capped-tag">可突破</span>}
    </div>
  );
}
