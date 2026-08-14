import { useCallback, useEffect, useRef, useState } from 'react';
import type { InkCombatFx } from '@core/life/combatInkFx';
import type { MoveStance } from '@core/life/moveStance';
import { shouldReduceInkMotion } from './sceneVariants';

const FX_LIFE_MS = 420;
const STANCE_LIFE_MS = 400;
const SHOCK_MS = 100;

export function useInkCombatFxQueue() {
  const [fx, setFx] = useState<InkCombatFx[]>([]);
  const [stanceBrush, setStanceBrush] = useState<MoveStance | null>(null);
  const [shock, setShock] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
    };
  }, []);

  const pushFx = useCallback((items: InkCombatFx[], opts?: { shock?: boolean; stance?: MoveStance }) => {
    if (!items.length && !opts?.stance && !opts?.shock) return;
    const reduce = shouldReduceInkMotion();
    if (items.length) {
      setFx((prev) => [...prev, ...items].slice(-6));
      const life = reduce ? 900 : FX_LIFE_MS;
      const ids = new Set(items.map((i) => i.id));
      const t = window.setTimeout(() => {
        setFx((prev) => prev.filter((f) => !ids.has(f.id)));
      }, life);
      timers.current.push(t);
    }
    if (opts?.stance) {
      setStanceBrush(opts.stance);
      const t = window.setTimeout(() => setStanceBrush(null), reduce ? 0 : STANCE_LIFE_MS);
      timers.current.push(t);
    }
    if (opts?.shock && !reduce) {
      setShock(true);
      const t = window.setTimeout(() => setShock(false), SHOCK_MS);
      timers.current.push(t);
    }
  }, []);

  const clearFx = useCallback(() => {
    setFx([]);
    setStanceBrush(null);
    setShock(false);
  }, []);

  return { fx, stanceBrush, shock, pushFx, clearFx };
}

/** 血條墨滲：記錄上一檔寬度作 ghost */
export function useInkBarGhost(pct: number, active: boolean) {
  const [ghost, setGhost] = useState(pct);
  const [showGhost, setShowGhost] = useState(false);
  const prev = useRef(pct);

  useEffect(() => {
    if (!active) {
      prev.current = pct;
      setGhost(pct);
      setShowGhost(false);
      return;
    }
    if (pct < prev.current - 0.15) {
      setGhost(prev.current);
      setShowGhost(true);
      const t = window.setTimeout(() => setShowGhost(false), shouldReduceInkMotion() ? 0 : 560);
      prev.current = pct;
      return () => window.clearTimeout(t);
    }
    prev.current = pct;
    return undefined;
  }, [pct, active]);

  return { ghostPct: ghost, showGhost };
}

export function InkCombatFxLayer({
  items,
  stanceBrush,
}: {
  items: InkCombatFx[];
  stanceBrush: MoveStance | null;
}) {
  return (
    <div className="ink-combat-fx-layer" aria-hidden>
      {stanceBrush && (
        <span className={`ink-combat-brush ink-combat-brush--${stanceBrush}`} />
      )}
      {items.map((f) => (
        <span
          key={f.id}
          className={`ink-combat-fx ink-combat-fx--${f.kind} ink-combat-fx--${f.side}${
            f.stance ? ` ink-combat-fx--stance-${f.stance}` : ''
          }`}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}

export function InkBarWithGhost({
  pct,
  fillClass,
  active,
}: {
  pct: number;
  fillClass: string;
  active: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const { ghostPct, showGhost } = useInkBarGhost(clamped, active);
  return (
    <div className="ink-bar">
      {showGhost && (
        <div
          className={`ink-bar-fill ink-bar-fill--ghost ${fillClass}`.trim()}
          style={{ width: `${ghostPct}%` }}
          aria-hidden
        />
      )}
      <div
        className={`ink-bar-fill ink-bar-fill--live ${fillClass}`.trim()}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
