/** 第26項B：用生成墨暈位圖揭幕，唔畫SVG／程序墨形。 */
import { useEffect, useRef } from 'react';
import { loadSparImage } from '../../spar/engine';
import { inkBattleReveal, motionReduced } from '../../ui/inkMotion';

const base = import.meta.env.BASE_URL || '/';
type Props = { ready: boolean; reduceMotion: boolean; onEntered: () => void };

/** 只做畫面遮罩；揭幕完成由呼叫方解除戰報播放暫停。 */
export function InkBattleEntrance({ ready, reduceMotion, onEntered }: Props) {
  const quiet = reduceMotion || motionReduced();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callback = useRef(onEntered);
  callback.current = onEntered;
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.closest<HTMLElement>('.ink-unified-battle');
    if (!canvas || !root || !ready) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { root.style.opacity = '1'; callback.current(); return; }
    let cancelled = false;
    let stop: (() => void) | undefined;
    let progress = 0;
    const observer = new ResizeObserver(() => resize());
    let paper: HTMLImageElement | null = null;
    let bloom: HTMLImageElement | null = null;
    const draw = (p: number) => {
      progress = p;
      canvas.dataset.progress = p.toFixed(3);
      const width = root.clientWidth, height = root.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const fadeOnly = quiet || !paper || !bloom;
      ctx.save();
      ctx.globalAlpha = fadeOnly ? 1 - p : 1;
      // 紙紋位圖本身有透明邊，先鋪實色紙底，確保揭幕前全屏遮實。
      ctx.fillStyle = '#f3ede2';
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha *= .18;
      if (paper) ctx.drawImage(paper, 0, 0, width, height);
      ctx.restore();
      if (fadeOnly) return;
      const opening = Math.max(0, (p - .25) / .75);
      const eased = Math.pow(opening, 1.35);
      const size = p < .25 ? 4 + 24 * Math.pow(p / .25, 2) : 28 + Math.hypot(width, height) * 3.2 * eased;
      // 只合成可見位圖範圍，避免放大墨池產生超出螢幕嘅巨大中間圖。
      const place = (s: number) => {
        const left = (width - s) / 2, top = (height - s) / 2;
        const x = Math.max(0, left), y = Math.max(0, top);
        const w = Math.min(width, left + s) - x, h = Math.min(height, top + s) - y;
        if (w <= 0 || h <= 0) return;
        const k = bloom!.naturalWidth / s;
        ctx.drawImage(bloom!, (x - left) * k, (y - top) * k, w * k, h * k, x, y, w, h);
      };
      ctx.save();
      ctx.globalAlpha = opening > 0 ? .28 : p / .25 * .75;
      place(size * 1.045);
      if (opening > 0) {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-out';
        place(size);
      }
      ctx.restore();
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(root.clientWidth * dpr);
      canvas.height = Math.round(root.clientHeight * dpr);
      draw(progress);
    };
    observer.observe(root);
    const watchdog = setTimeout(() => {
      if (cancelled) return;
      stop?.(); root.style.opacity = '1'; callback.current();
    }, 4000);
    void Promise.all([
      loadSparImage(`${base}ink/ui/splash-paper.webp`).catch(() => null),
      quiet ? Promise.resolve(null) : loadSparImage(`${base}ink/art/battle-preview/ink-bloom.webp`).catch(() => null),
    ]).then(([paperImage, bloomImage]) => {
      if (cancelled) return;
      paper = paperImage; bloom = bloomImage;
      resize();
      canvas.dataset.phase = 'revealing';
      stop = inkBattleReveal(root, draw, () => {
        clearTimeout(watchdog);
        if (!cancelled) callback.current();
      }, quiet || !paper || !bloom);
    });
    return () => { cancelled = true; stop?.(); clearTimeout(watchdog); observer.disconnect(); };
  }, [ready, quiet]);
  return <canvas className="ink-battle-entrance" ref={canvasRef} data-phase="waiting" data-progress="0" aria-hidden="true" />;
}
