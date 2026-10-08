import { Suspense, useState } from 'react';
import type { CombatReplay } from '@interfaces/lifeEngine';
import { DuelFxLazy, canUseWebGL, prefersReducedMotion } from '../../fx/highlight';
import { InkAutoBattle } from './InkAutoBattle';

type Props = {
  replay: CombatReplay;
  onDone: () => void;
  reduceMotion?: boolean;
};

/**
 * 自動交手演出入口：有 WebGL 又冇揀減少動態 → 高光級打鬥演出（src/fx/highlight/duel，Three.js＋GSAP）；
 * 否則（或者 3D 素材載唔到）→ 演武台 2D 演出（InkAutoBattle）。
 */
export function InkAutoBattleView({ replay, onDone, reduceMotion = false }: Props) {
  const [fallback, setFallback] = useState(() => reduceMotion || prefersReducedMotion() || !canUseWebGL());
  if (fallback) return <InkAutoBattle replay={replay} onDone={onDone} reduceMotion={reduceMotion} />;
  return (
    <Suspense fallback={null}>
      <DuelFxLazy replay={replay} onDone={onDone} onFail={() => setFallback(true)} />
    </Suspense>
  );
}
