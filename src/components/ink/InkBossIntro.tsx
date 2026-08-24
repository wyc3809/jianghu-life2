import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStillMode, useSkipJsAnimation } from '../../hooks/useStillMode';
import { stillClassName, barOffset } from './inkStillClass';
import styles from './InkBossIntro.module.css';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  decay: number;
  red: boolean;
};

/** Boss 現身：墨色迸濺（canvas 粒子，純裝飾） */
function useInkBurst(canvasRef: React.RefObject<HTMLCanvasElement | null>, skip: boolean) {
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let alive = true;

    function size() {
      if (!cv) return;
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
    }
    size();
    window.addEventListener('resize', size);

    const cx = w / 2;
    const cy = h * 0.72;
    let parts: Particle[] = Array.from({ length: 64 }, () => {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 8 + 2.5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        r: Math.random() * 3.6 + 1.2,
        life: 1,
        decay: Math.random() * 0.02 + 0.012,
        red: Math.random() < 0.2,
      };
    });

    if (skip) {
      for (let i = 0; i < 120; i++) {
        for (const p of parts) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12;
          p.vx *= 0.985;
          p.life -= p.decay;
        }
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (p.life <= 0) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.r * p.life, 0.4), 0, Math.PI * 2);
        ctx.fillStyle = p.red ? `rgba(179,52,42,${p.life * 0.85})` : `rgba(227,218,196,${p.life * 0.5})`;
        ctx.fill();
      }
      return () => window.removeEventListener('resize', size);
    }

    function tick() {
      if (!alive || !ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (p.life <= 0) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.985;
        p.life -= p.decay;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.r * p.life, 0.4), 0, Math.PI * 2);
        ctx.fillStyle = p.red ? `rgba(179,52,42,${p.life * 0.85})` : `rgba(227,218,196,${p.life * 0.5})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    };
  }, [canvasRef, skip]);
}

type Props = {
  /** 敵人名（如「血刀老祖」） */
  foeName: string;
  hp: number;
  maxHp: number;
  onDone: () => void;
};

const HP_BAR_LEN = 508;

/**
 * Boss 動畫：黑紙反墨 + 原畫立繪 + 猩紅一斬。
 * 移植自水墨武俠 UI 套件 index.html #scene-boss。
 * 觸發時機：進入首領交手前播一次（見 InkPlayScreen.tsx）。
 */
export function InkBossIntro({ foeName, hp, maxHp, onDone }: Props) {
  const still = useStillMode();
  const skipJs = useSkipJsAnimation();
  const burstRef = useRef<HTMLCanvasElement>(null);
  useInkBurst(burstRef, skipJs);

  useEffect(() => {
    if (skipJs) return;
    const t = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipJs]);

  const cls = (base: string, stillCls?: string) => stillClassName(base, stillCls, still);
  const off = barOffset(HP_BAR_LEN, hp, maxHp);

  return createPortal(
    <div className={styles.root} role="button" tabIndex={0} aria-label="強敵現身，點擊繼續" onClick={onDone}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.stage}>
        <div className={cls(styles.shake, styles.shakeStill)}>
          <p className={cls(styles.warn, styles.warnStill)}>強 敵 現 身</p>
          <img className={cls(styles.art, styles.artStill)} src="/art/art-boss.png" alt={foeName} />
          <svg className={cls(styles.slash, styles.slashStill)} viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path style={{ ['--len' as string]: 1200 }} strokeWidth={9} d="M40 660 L 960 400" />
          </svg>
          <div className={styles.name}>
            <div className={cls(styles.kanji, styles.kanjiStill)}>{foeName}</div>
          </div>
          <div className={cls(styles.seal, styles.sealStill)}>凶</div>
          <div className={cls(styles.bar, styles.barStill)}>
            <div className={styles.barLbl}>
              <span>氣 血</span>
              <span>
                {Math.max(0, Math.round(hp))} / {Math.round(maxHp)}
              </span>
            </div>
            <svg viewBox="0 0 520 22" preserveAspectRatio="none">
              <path className={styles.rail} d="M6 11 H 514" />
              <path
                className={cls(styles.fill, styles.fillStill)}
                style={{ ['--len' as string]: HP_BAR_LEN, ['--off' as string]: off }}
                d="M6 11 H 514"
              />
            </svg>
          </div>
        </div>
      </div>
      <canvas ref={burstRef} className={styles.burst} aria-hidden />
    </div>,
    document.body,
  );
}
