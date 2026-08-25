import { useEffect, useRef } from 'react';

/** 每幾秒將呢段時間嘅修為累積寫入 store（真正落實嘅權威數值，存檔照常 work） */
const COMMIT_INTERVAL_MS = 3000;

export function useCultivationTicker(active: boolean, onTick: (deltaSeconds: number) => void): void {
  const lastRef = useRef<number>(0);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    lastRef.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const deltaSeconds = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (deltaSeconds > 0) onTickRef.current(deltaSeconds);
    }, COMMIT_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active]);
}
