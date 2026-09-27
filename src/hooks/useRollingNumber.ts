import { useEffect, useRef, useState } from 'react';
import { shouldReduceInkMotion } from '../components/ink/sceneVariants';

/**
 * 數字滾動：target 變咗就由舊值滾去新值（delay 之後開始，配合墨點飛到先滾）。
 * 減少動態時即刻跳去終值。
 */
export function useRollingNumber(
  target: number,
  opts: { duration?: number; delay?: number; delayRef?: { current: number } } = {},
): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const { duration = 600, delay = 0, delayRef } = opts;
  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;
    if (shouldReduceInkMotion()) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        const e = 1 - Math.pow(1 - t, 3);
        const v = Math.round(from + (target - from) * e);
        shownRef.current = v;
        setShown(v);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delayRef?.current ?? delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      // 中途被打斷：下次由而家顯示緊嘅值起滾（shownRef 已經跟住每幀更新）
    };
    // delayRef 由上層喺同一輪 effect 先寫好（墨點飛幾耐），唔入 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, delay]);
  return shown;
}
