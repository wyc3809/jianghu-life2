/**
 * 演武台 v4 畫面（純元件：外觀由 look 傳入，唔讀 store）。
 * InkSparStage 包住佢接遊戲狀態；示範頁 ?fx=spar 直接傳 look 試睇。
 *
 * 高度填滿父層（鎮居頁標題同底部選單之間嘅空位）；捲出畫面就暫停。
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { SPAR_FX } from '@data/spar/tuning';
import { playSparHit, playSparSwing } from '../../audio/inkAudio';
import { flyInkText } from '../../ui/hudFlyer';
import { SparDirector } from './director';
import { reachFor, type SparLook } from './look';
import { SparRenderer } from './renderer';

export interface SparViewProps {
  look: SparLook;
  reduceMotion?: boolean;
  /** 每擊命中叫一次；回傳實際入賬修為（>0 先飛字） */
  onStrike?: () => number;
  /** 浮層（季節・地點名、狀態標籤） */
  children?: ReactNode;
  /** 示範頁：每加 1 下一個敵人變頭目 */
  bossSignal?: number;
  /** 修為字飛去邊度（CSS selector）；冇就原地淡出 */
  xpTarget?: string;
}

function fmtGain(g: number): string {
  return Math.abs(g - Math.round(g)) < 1e-6 ? String(Math.round(g)) : g.toFixed(1);
}

export function SparView({ look, reduceMotion = false, onStrike, children, bossSignal = 0, xpTarget = '.ink-nav-center-xp' }: SparViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const directorRef = useRef<SparDirector | null>(null);
  const rendererRef = useRef<SparRenderer | null>(null);
  const strikeRef = useRef(onStrike);
  strikeRef.current = onStrike;

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const renderer = new SparRenderer(canvas, look, { reduceMotion });
    const director = new SparDirector({
      onSwing: (clip) => {
        renderer.onSwing(director, clip);
        playSparSwing(clip === 'ultimate');
      },
      onHit: (hit) => {
        const pt = renderer.onHit(hit);
        playSparHit(hit.clip === 'ultimate' ? 'ultimate' : hit.boss ? 'boss' : 'minion');
        const gained = strikeRef.current?.() ?? 0;
        if (gained > 0) {
          const rect = canvas.getBoundingClientRect();
          flyInkText({ x: rect.left + pt.x, y: rect.top + pt.y }, document.querySelector<HTMLElement>(xpTarget), `+${fmtGain(gained)} 修為`, {
            riseMs: SPAR_FX.floaterRiseSec * 1000,
            flyMs: SPAR_FX.floaterFlySec * 1000,
            tone: hit.boss ? 'cinnabar' : 'ink',
          });
        }
      },
    });
    director.setFlags({ limp: look.limp, armHurt: look.armHurt, reach: reachFor(look.weapon) });
    directorRef.current = director;
    rendererRef.current = renderer;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      renderer.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2.5));
      director.setViewport(renderer.widthDesign());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = 0;
    let visible = true;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      // 減少動態：慢啲行（0.6 倍速），冇飄落物、墨點減少
      director.update(reduceMotion ? dt * 0.6 : dt);
      renderer.render(director, dt);
      if (visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver((entries) => {
      const v = entries[0]?.isIntersecting ?? true;
      if (v && !visible) {
        visible = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!v) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(wrap);

    const onDown = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (renderer.hitTestEnemy(director, ev.clientX - r.left, ev.clientY - r.top)) director.tapEnemy();
    };
    canvas.addEventListener('pointerdown', onDown);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      directorRef.current = null;
      rendererRef.current = null;
    };
    // 外觀變化由下面 effect 處理，唔使重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    rendererRef.current?.setLook(look);
    directorRef.current?.setFlags({ limp: look.limp, armHurt: look.armHurt, reach: reachFor(look.weapon) });
  }, [look]);

  useEffect(() => {
    if (bossSignal) directorRef.current?.forceBoss();
  }, [bossSignal]);

  return (
    <div className="ink-spar-stage ink-spar-stage--v4" ref={wrapRef} aria-label="切磋演武：撳敵人即刻出手">
      <canvas ref={canvasRef} className="ink-spar-canvas" />
      {children}
    </div>
  );
}
