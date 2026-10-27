import { useEffect } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';
import { highlightCoversPage } from '../../ui/highlightVisibility';
import { appendTapInk, createTapInk, isInkTap, TAP_INK, tapInkPose, type TapInkBurst } from '../../fx/ambient/tapInk';
import './tap-ink.css';

/** 點按專用畫布：只在短暫落墨時繪製，原生dialog亦可呈現，不攔截任何操作。 */
export function InkTapFx({ paused = false }: { paused?: boolean }) {
  useEffect(() => {
    if (paused) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = document.createElement('canvas');
    canvas.className = 'ink-tap-fx';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sprites = Object.fromEntries(['core', 'wash', 'speck'].map(key => {
      const image = new Image();
      image.src = inkArtUrl(`art/fx/tap-${key}.webp`);
      void image.decode().catch(() => {});
      return [key, image];
    })) as Record<'core' | 'wash' | 'speck', HTMLImageElement>;
    let press: { id: number; x: number; y: number; at: number; control: Element } | null = null;
    let bursts: TapInkBurst[] = [];
    let raf = 0, lastTap = -Infinity, seed = 91;
    let width = 0, height = 0;

    const clear = () => {
      cancelAnimationFrame(raf); raf = 0; press = null; bursts = [];
      ctx.clearRect(0, 0, width, height);
      canvas.remove();
    };
    const eligible = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const control = target.closest('button,a[href],summary,[role="button"],[role="tab"]');
      if (!control || !control.closest('.scroll-shell,dialog,.ink-bottom-dock,.ink-task-bar') || control.closest('[disabled],[aria-disabled="true"],[inert]')) return null;
      return control;
    };
    const blocked = () => motion.matches || document.hidden || highlightCoversPage();
    const onDown = (e: PointerEvent) => {
      press = null;
      if (blocked() || !e.isPrimary || e.button !== 0) return;
      const control = eligible(e.target);
      if (control) press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), control };
    };
    const onMove = (e: PointerEvent) => {
      if (press?.id === e.pointerId && !isInkTap(e.clientX - press.x, e.clientY - press.y, 0)) press = null;
    };
    const frame = (now: number) => {
      raf = 0;
      if (blocked() || !canvas.isConnected || canvas.parentElement instanceof HTMLDialogElement && !canvas.parentElement.open) { clear(); return; }
      // 只清除落墨附近，連點移除最舊墨跡時另作一次全清。
      for (const b of bursts) ctx.clearRect(b.x - TAP_INK.radius, b.y - TAP_INK.radius, TAP_INK.radius * 2, TAP_INK.radius * 2);
      bursts = bursts.filter(b => now - b.started < TAP_INK.durationMs);
      for (const b of bursts) for (const p of b.particles) {
        const pose = tapInkPose(p, now - b.started), image = sprites[p.sprite];
        if (!pose || !image.complete || !image.naturalWidth) continue;
        ctx.save(); ctx.globalAlpha = pose.alpha;
        ctx.translate(b.x + pose.x, b.y + pose.y); ctx.rotate(p.rotation);
        ctx.drawImage(image, -pose.size / 2, -pose.size / 2, pose.size, pose.size);
        ctx.restore();
      }
      if (bursts.length) raf = requestAnimationFrame(frame);
      else canvas.remove();
    };
    const onUp = (e: PointerEvent) => {
      const down = press; press = null;
      const now = performance.now();
      if (!down || down.id !== e.pointerId || blocked() || eligible(e.target) !== down.control ||
        !isInkTap(e.clientX - down.x, e.clientY - down.y, now - down.at) || now - lastTap < TAP_INK.cooldownMs) return;
      if (!Object.values(sprites).every(image => image.complete && image.naturalWidth > 0)) return;
      const host = down.control.closest('dialog[open]') ?? document.body;
      if (canvas.parentElement !== host) { clear(); host.append(canvas); }
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (rect.width !== width || rect.height !== height) {
        width = rect.width; height = rect.height; bursts = [];
        canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, width, height);
      bursts = appendTapInk(bursts, createTapInk(e.clientX - rect.left, e.clientY - rect.top, now, seed++));
      lastTap = now;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const cancelPress = () => { press = null; };
    const events = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: cancelPress };
    for (const [name, handler] of Object.entries(events)) window.addEventListener(name, handler as EventListener, { capture: true, passive: true });
    window.addEventListener('scroll', cancelPress, { capture: true, passive: true });
    window.addEventListener('resize', clear, { passive: true });
    document.addEventListener('visibilitychange', clear);
    motion.addEventListener('change', clear);
    return () => {
      clear();
      for (const [name, handler] of Object.entries(events)) window.removeEventListener(name, handler as EventListener, true);
      window.removeEventListener('scroll', cancelPress, true);
      window.removeEventListener('resize', clear);
      document.removeEventListener('visibilitychange', clear);
      motion.removeEventListener('change', clear);
    };
  }, [paused]);
  return null;
}
