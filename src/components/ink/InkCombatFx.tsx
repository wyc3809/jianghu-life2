import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CombatShockLevel, InkCombatFx } from '@core/life/combatInkFx';
import type { MoveStance } from '@core/life/moveStance';
import { shouldReduceInkMotion } from './sceneVariants';

const FX_LIFE_MS = 1600;
const STANCE_LIFE_MS = 700;
/** 打擊停頓＋震：同 CSS inkHitStop 時長對齊（輕 0.22s／重 0.34s） */
const SHOCK_MS: Record<CombatShockLevel, number> = { light: 240, heavy: 360 };

export function useInkCombatFxQueue() {
  const [fx, setFx] = useState<InkCombatFx[]>([]);
  const [stanceBrush, setStanceBrush] = useState<MoveStance | null>(null);
  const [shock, setShock] = useState<CombatShockLevel | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
    };
  }, []);

  const pushFx = useCallback((items: InkCombatFx[], opts?: { shock?: CombatShockLevel | null; stance?: MoveStance }) => {
    if (!items.length && !opts?.stance && !opts?.shock) return;
    const reduce = shouldReduceInkMotion();
    if (items.length) {
      setFx((prev) => [...prev, ...items].slice(-6));
      const life = reduce ? 1200 : FX_LIFE_MS;
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
      setShock(opts.shock);
      const t = window.setTimeout(() => setShock(null), SHOCK_MS[opts.shock]);
      timers.current.push(t);
    }
  }, []);

  const clearFx = useCallback(() => {
    setFx([]);
    setStanceBrush(null);
    setShock(null);
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

/** 劍氣（實）／掌風（虛）／架擋（架）水墨粒子：沿筆勢散開嘅細滴，唔靠美術素材 */
const STANCE_PARTICLES: Record<MoveStance, Array<{ top: string; left: string; delay: number; scale: number }>> = {
  shi: [
    { top: '28%', left: '20%', delay: 0, scale: 1 },
    { top: '32%', left: '37%', delay: 0.05, scale: 0.8 },
    { top: '30%', left: '54%', delay: 0.1, scale: 0.65 },
    { top: '35%', left: '70%', delay: 0.16, scale: 0.5 },
  ],
  xu: [
    { top: '18%', left: '30%', delay: 0, scale: 1 },
    { top: '26%', left: '48%', delay: 0.08, scale: 0.85 },
    { top: '20%', left: '64%', delay: 0.14, scale: 0.7 },
    { top: '30%', left: '18%', delay: 0.05, scale: 0.6 },
  ],
  jia: [
    { top: '40%', left: '18%', delay: 0, scale: 0.9 },
    { top: '42%', left: '48%', delay: 0.06, scale: 0.9 },
    { top: '40%', left: '78%', delay: 0.12, scale: 0.9 },
  ],
};

export function InkCombatFxLayer({
  items,
  stanceBrush,
}: {
  items: InkCombatFx[];
  stanceBrush: MoveStance | null;
}) {
  const crit = items.find((f) => f.kind === 'crit');
  // 敵／我兩側數字由 InkSideFx 掛喺各自血條行；呢層淨係畫中間嘅招式名同筆勢
  const center = items.filter((f) => f.side === 'center');
  return (
    <div className="ink-combat-fx-layer" aria-hidden>
      {/* 暴擊：朱砂一斬掃過（key＝特效 id，每次暴擊重播） */}
      {crit && <span key={`slash-${crit.id}`} className="ink-combat-slash" />}
      {stanceBrush && (
        <>
          <span className={`ink-combat-brush ink-combat-brush--${stanceBrush}`} />
          {STANCE_PARTICLES[stanceBrush].map((p, i) => (
            <span
              key={`particle-${i}`}
              className={`ink-combat-particle ink-combat-particle--${stanceBrush}`}
              style={
                {
                  top: p.top,
                  left: p.left,
                  ['--particle-delay' as string]: `${p.delay}s`,
                  ['--particle-scale' as string]: String(p.scale),
                } as CSSProperties
              }
            />
          ))}
        </>
      )}
      {center.map((f) => (
        <InkFxLabel key={f.id} f={f} />
      ))}
    </div>
  );
}

function InkFxLabel({ f }: { f: InkCombatFx }) {
  return (
    <span
      className={`ink-combat-fx ink-combat-fx--${f.kind} ink-combat-fx--${f.side}${
        f.stance ? ` ink-combat-fx--stance-${f.stance}` : ''
      }`}
    >
      {f.text}
    </span>
  );
}

/** 敵／我傷害數字：掛喺該方血條行（父層需 position:relative），唔再用固定高度定位 */
export function InkSideFx({ items, side }: { items: InkCombatFx[]; side: 'foe' | 'player' }) {
  const mine = items.filter((f) => f.side === side);
  if (!mine.length) return null;
  return (
    <span className="ink-combat-side-fx" aria-hidden>
      <span className="ink-combat-side-fx__row">
        {mine.map((f) => (
          <InkFxLabel key={f.id} f={f} />
        ))}
      </span>
    </span>
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
  /** 扣血：喺血條新尾端濺一點朱砂（內力條唔濺；.ink-bar 有 overflow:hidden，墨點放外層） */
  const splashable = !fillClass.includes('qi');
  const bar = (
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
  if (!splashable) return bar;
  return (
    <div className="ink-bar-wrap">
      {bar}
      {showGhost && <span className="ink-bar-splash" style={{ left: `${clamped}%` }} aria-hidden />}
    </div>
  );
}
