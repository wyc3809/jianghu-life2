import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { BreakthroughResult } from '@core/life/cultivation';
import { useStillMode, useSkipJsAnimation } from '../../hooks/useStillMode';
import { stillClassName } from './inkStillClass';
import { inkAiUrl } from '../../ui/inkAiCatalog';
import styles from './InkBreakthroughModal.module.css';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  decay: number;
  accent: boolean;
};

/** 突破動畫：成功＝金墨升騰，失敗＝赤墨崩散（canvas 粒子，純裝飾） */
function useBreakthroughBurst(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  skip: boolean,
  success: boolean,
) {
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
    const cy = h * 0.5;
    const parts: Particle[] = Array.from({ length: 72 }, () => {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * (success ? 6 : 8) + 2;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: success ? Math.sin(a) * sp - 3.4 : Math.sin(a) * sp,
        r: Math.random() * 3.4 + 1.1,
        life: 1,
        decay: Math.random() * 0.016 + 0.01,
        accent: Math.random() < 0.3,
      };
    });

    function paint() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (p.life <= 0) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.r * p.life, 0.4), 0, Math.PI * 2);
        ctx.fillStyle = success
          ? p.accent
            ? `rgba(212,168,83,${p.life * 0.9})`
            : `rgba(179,52,42,${p.life * 0.7})`
          : p.accent
            ? `rgba(90,84,74,${p.life * 0.8})`
            : `rgba(179,52,42,${p.life * 0.75})`;
        ctx.fill();
      }
    }

    function step() {
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += success ? -0.02 : 0.14;
        p.vx *= 0.98;
        p.life -= p.decay;
      }
    }

    if (skip) {
      for (let i = 0; i < 130; i++) step();
      paint();
      return () => window.removeEventListener('resize', size);
    }

    function tick() {
      if (!alive) return;
      step();
      paint();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    };
  }, [canvasRef, skip, success]);
}

type Props = {
  result: BreakthroughResult;
  onClose: () => void;
};

/** 修為突破：成功躍境／失敗走火入魔嘅專屬彈窗＋升級動畫 */
export function InkBreakthroughModal({ result, onClose }: Props) {
  const still = useStillMode();
  const skipJs = useSkipJsAnimation();
  const burstRef = useRef<HTMLCanvasElement>(null);
  useBreakthroughBurst(burstRef, skipJs, result.success);
  const cls = (base: string, stillCls?: string) => stillClassName(base, stillCls, still);

  return createPortal(
    <div
      className={`${styles.root} ${result.success ? styles.rootSuccess : styles.rootFail}`}
      role="dialog"
      aria-modal="true"
      aria-label={result.success ? '突破關口' : '走火入魔'}
      onClick={onClose}
    >
      <div className={styles.grain} aria-hidden />
      <canvas ref={burstRef} className={styles.burst} aria-hidden />
      <div className={styles.stage}>
        <div className={`${styles.body}${result.success ? '' : ` ${cls(styles.shake, styles.shakeStill)}`}`}>
          <div className={cls(styles.seal, styles.sealStill)}>
            <img src={inkAiUrl('seal-cinnabar-fate')} alt="" aria-hidden decoding="async" />
            <span>{result.success ? '晉' : '傷'}</span>
          </div>
          <p className={styles.headline}>{result.success ? '打通任督二脈' : '走火入魔'}</p>
          <div className={cls(styles.tierWrap, styles.tierWrapStill)}>
            <span className={styles.tierOld}>{result.oldTierName}</span>
            {result.success && result.newTierName && (
              <>
                <span className={styles.tierArrow} aria-hidden>
                  →
                </span>
                <span className={styles.tierNew}>{result.newTierName}</span>
              </>
            )}
          </div>
          <ul className={styles.deltas}>
            {result.success ? (
              <>
                {typeof result.martialGain === 'number' && <li>武學＋{result.martialGain}</li>}
                <li>氣血上限、內力上限同步提升</li>
              </>
            ) : (
              <>
                {typeof result.hpLoss === 'number' && <li>氣血－{result.hpLoss}</li>}
                {typeof result.qiLoss === 'number' && <li>內力－{result.qiLoss}</li>}
                <li>落下內傷，需再修煉方可重闖此關</li>
              </>
            )}
          </ul>
          <button type="button" className={styles.ack} onClick={onClose}>
            {result.success ? '合十 · 繼續前路' : '知曉 · 再圖後計'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
