/**
 * 環境特效畫布（玩家 2026-10-10：「場景會動」＋「墨韻粒子」）。
 *
 * - `mode="scene"`：疊喺主畫面演武台上面——兩層流雲＋季節粒子（春花瓣、夏雨絲、秋落葉、冬雪）。
 * - `mode="ink"`：全畫面——左右邊墨點飄升、墨暈開，點擊任何位置濺墨。
 *
 * 只畫位圖（`public/ink/art/fx/`，`scripts/art/build_ink_fx.py`），唔用 SVG；
 * 粒子邏輯喺 `src/fx/ambient/particles.ts`。唔攔截點擊（pointer-events: none）；
 * 系統設定「減少動態」時唔畫。
 */
import { useEffect, useRef } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';
import { AMBIENT_TUNING, type AmbientSeason } from '../../fx/ambient/tuning';
import {
  createRng,
  mistOffset,
  particleAlpha,
  particleSize,
  spawnInkMote,
  spawnSeasonParticle,
  spawnSplash,
  stepParticles,
  type Particle,
  type ParticleKind,
} from '../../fx/ambient/particles';

const SPRITE_FILES: Record<ParticleKind | 'mist', string> = {
  petal: 'petal',
  rain: 'rain',
  leaf: 'leaf',
  snow: 'snow',
  inkDot: 'ink-dot',
  bloom: 'ink-bloom',
  splash: 'ink-splash',
  mist: 'mist',
};

const spriteCache = new Map<string, HTMLImageElement>();
function sprite(key: keyof typeof SPRITE_FILES): HTMLImageElement {
  let img = spriteCache.get(key);
  if (!img) {
    img = new Image();
    img.src = inkArtUrl(`art/fx/${SPRITE_FILES[key]}.webp`);
    spriteCache.set(key, img);
  }
  return img;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export interface InkAmbientFxProps {
  mode: 'scene' | 'ink';
  season?: AmbientSeason;
  /** 停低（例如交手、事件時）：清空畫布，唔再推進 */
  paused?: boolean;
  className?: string;
}

export function InkAmbientFx({ mode, season = 'spring', paused = false, className }: InkAmbientFxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rng = createRng(mode === 'scene' ? 7 : 11);
    let w = 0;
    let h = 0;
    let parts: Particle[] = [];
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let lastSplash = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const target = mode === 'scene' ? AMBIENT_TUNING.season[season].count : AMBIENT_TUNING.ink.count;
    const spawn = (scatter: boolean) =>
      mode === 'scene' ? spawnSeasonParticle(season, w, h, rng, scatter) : spawnInkMote(w, h, rng);
    for (let i = 0; i < target; i++) parts.push(spawn(true));

    const onDown = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSplash < AMBIENT_TUNING.splash.cooldownMs) return;
      lastSplash = now;
      const r = canvas.getBoundingClientRect();
      parts.push(...spawnSplash(e.clientX - r.left, e.clientY - r.top, rng));
    };
    if (mode === 'ink') window.addEventListener('pointerdown', onDown, { passive: true });

    const draw = (p: Particle) => {
      const img = sprite(p.kind);
      if (!img.complete || img.naturalWidth === 0) return;
      const a = particleAlpha(p, p.kind === 'splash' ? 0.06 : 0.2);
      if (a <= 0) return;
      const s = particleSize(p);
      ctx.globalAlpha = a;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // 花瓣、落葉：用壓扁模擬喺空中翻
      if (p.kind === 'petal' || p.kind === 'leaf') ctx.scale(1, 0.55 + 0.45 * Math.cos(p.phase + p.age * 2.2));
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
      ctx.restore();
    };

    const drawMist = () => {
      const img = sprite('mist');
      if (!img.complete || img.naturalWidth === 0) return;
      AMBIENT_TUNING.mist.layers.forEach((L, i) => {
        const bh = h * L.h;
        const bw = (img.naturalWidth / img.naturalHeight) * bh;
        const off = mistOffset(i, t, bw);
        ctx.globalAlpha = L.alpha;
        for (let x = -off; x < w; x += bw) ctx.drawImage(img, x, h * L.y - bh / 2, bw, bh);
      });
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      parts = stepParticles(parts, dt, w, h);
      let alive = 0;
      for (const p of parts) if (!p.burst) alive++;
      for (let i = alive; i < target; i++) parts.push(spawn(false));
      ctx.clearRect(0, 0, w, h);
      if (mode === 'scene') drawMist();
      for (const p of parts) draw(p);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      if (mode === 'ink') window.removeEventListener('pointerdown', onDown);
      ctx.clearRect(0, 0, w, h);
    };
  }, [mode, season, paused]);

  return <canvas ref={canvasRef} className={`ink-ambient ink-ambient--${mode}${className ? ` ${className}` : ''}`} aria-hidden="true" />;
}
