import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStillMode } from '../../hooks/useStillMode';
import styles from './InkIntroScreen.module.css';

type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number };

/** 進場：浮游墨粒（canvas 粒子，純裝飾，唔影響任何遊戲數值） */
function useInkMotes(canvasRef: React.RefObject<HTMLCanvasElement | null>, still: boolean) {
  useEffect(() => {
    if (still) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    let w = 0;
    let h = 0;
    let motes: Mote[] = [];
    let raf = 0;
    let alive = true;

    function size() {
      if (!cv) return;
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
      motes = Array.from({ length: window.innerWidth < 640 ? 22 : 38 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.5,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -Math.random() * 0.2 - 0.04,
        a: Math.random() * 0.13 + 0.04,
      }));
    }
    size();
    window.addEventListener('resize', size);

    function tick() {
      if (!alive || !ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -8) {
          m.y = h + 8;
          m.x = Math.random() * w;
        }
        if (m.x < -8) m.x = w + 8;
        if (m.x > w + 8) m.x = -8;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(22,19,15,${m.a})`;
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
  }, [canvasRef, still]);
}

/**
 * 開場畫面：原畫全幅 + 墨拭揭示 + 浮游墨粒 + 逐字題名。
 * 移植自水墨武俠 UI 套件 index.html #scene-intro。
 * 觸發時機：玩家按「開卷」開新遊戲時（見 App.tsx）。
 */
export function InkIntroScreen({ onEnter }: { onEnter: () => void }) {
  const still = useStillMode();
  const motesRef = useRef<HTMLCanvasElement>(null);
  useInkMotes(motesRef, still);

  const cls = (base: string, stillCls?: string) => `${base}${still && stillCls ? ` ${stillCls}` : ''}`;

  return createPortal(
    <div
      className={styles.root}
      role="button"
      tabIndex={0}
      aria-label="點擊入世，進入江湖一生"
      onClick={onEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEnter();
      }}
    >
      <div className={styles.grain} aria-hidden />
      <div className={cls(styles.art, styles.artStill)} aria-hidden />
      <div className={styles.veil} aria-hidden />
      <canvas ref={motesRef} className={styles.motes} aria-hidden />
      <div className={styles.block}>
        <h1 className={styles.title} aria-label="江湖一生">
          {['江', '湖', '一', '生'].map((ch, i) => (
            <span key={i} className={cls(styles.ch, styles.chStill)}>
              {ch}
            </span>
          ))}
        </h1>
        <div className={cls(styles.seal, styles.sealStill)}>
          始
          <span className={cls(styles.splat, styles.splatStill)} />
        </div>
        <p className={cls(styles.sub, styles.subStill)}>一 卷 人 生 · 半 盞 江 湖</p>
      </div>
      <div className={cls(styles.hint, styles.hintStill)}>
        點 擊 入 世
        <div className={styles.line} />
      </div>
    </div>,
    document.body,
  );
}
