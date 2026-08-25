import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSkipJsAnimation, useStillMode } from '../../hooks/useStillMode';

const FLASH_MS = 1100;

/** 「金」際遇專屬特別演出：金光一閃 + 印字，強化「呢舖抽中大獎」嘅感覺 */
export function InkFortuneFlash({ onDone }: { onDone: () => void }) {
  const skipJs = useSkipJsAnimation();
  const still = useStillMode();

  useEffect(() => {
    if (skipJs) return;
    const t = window.setTimeout(onDone, FLASH_MS);
    return () => window.clearTimeout(t);
  }, [skipJs, onDone]);

  return createPortal(
    <div
      className={`ink-fortune-flash${still ? ' ink-fortune-flash--still' : ''}`}
      role="status"
      aria-live="polite"
      onClick={onDone}
    >
      <div className="ink-fortune-flash-burst" aria-hidden />
      <p className="ink-fortune-flash-text">天賜奇緣</p>
    </div>,
    document.body,
  );
}
