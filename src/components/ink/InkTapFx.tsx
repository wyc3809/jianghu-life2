import { useEffect } from 'react';
import { inkArtUrl } from '../../ui/inkAssets';
import { highlightCoversPage } from '../../ui/highlightVisibility';
import { watchVisualActivity } from '../../ui/visualActivity';
import { appendTapInk, cancelTapInk, createTapInk, isInkTap, TAP_INK, tapInkPose, type TapInkBurst } from '../../fx/ambient/tapInk';
import './tap-ink.css';

/** 按下即落墨，拖動只取消當次；共用單一短時位圖畫布，不攔操作。 */
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
    let press: { id: number; x: number; y: number; burst: TapInkBurst } | null = null;
    let bursts: TapInkBurst[] = [];
    let raf = 0, lastTap = -Infinity, seed = 91;
    let width = 0, height = 0;
    const clear = () => {
      cancelAnimationFrame(raf); raf = 0; press = null; bursts = [];
      ctx.clearRect(0, 0, width, height); canvas.remove();
    };
    const eligible = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      const control = target.closest('button,a[href],summary,[role="button"],[role="tab"]');
      if (!control || !control.closest('.scroll-shell,dialog,.ink-bottom-dock,.ink-task-bar') || control.closest('[disabled],[aria-disabled="true"],[inert]')) return null;
      return control;
    };
    const blocked = () => motion.matches || document.documentElement.dataset.inkMotion === 'reduce' || document.hidden || highlightCoversPage();
    const frame = (now: number) => {
      raf = 0;
      if (blocked() || !canvas.isConnected || canvas.parentElement instanceof HTMLDialogElement && !canvas.parentElement.open) { clear(); return; }
      for (const b of bursts) ctx.clearRect(b.x - TAP_INK.radius, b.y - TAP_INK.radius, TAP_INK.radius * 2, TAP_INK.radius * 2);
      bursts = bursts.filter(b => now - b.started < TAP_INK.durationMs);
      for (const b of bursts) for (const particle of b.particles) {
        const pose = tapInkPose(particle, now - b.started), image = sprites[particle.sprite];
        if (!pose || !image.complete || !image.naturalWidth) continue;
        ctx.save(); ctx.globalAlpha = pose.alpha;
        ctx.translate(b.x + pose.x, b.y + pose.y); ctx.rotate(particle.rotation);
        ctx.drawImage(image, -pose.size / 2, -pose.size / 2, pose.size, pose.size);
        ctx.restore();
      }
      if (bursts.length) raf = requestAnimationFrame(frame);
      else canvas.remove();
    };
    const paintNow = (now: number) => {
      cancelAnimationFrame(raf); raf = 0;
      ctx.clearRect(0, 0, width, height);
      frame(now);
    };
    const emit = (control: Element, x: number, y: number): TapInkBurst | null => {
      const now = performance.now();
      if (blocked() || now - lastTap < TAP_INK.cooldownMs || !sprites.core.complete || !sprites.core.naturalWidth) return null;
      const host = control.closest('dialog[open]') ?? document.body;
      if (canvas.parentElement !== host) { clear(); host.append(canvas); }
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (rect.width !== width || rect.height !== height || canvas.width !== Math.round(rect.width * dpr)) {
        width = rect.width; height = rect.height; bursts = [];
        canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const burst = createTapInk(x - rect.left, y - rect.top, now, seed++);
      bursts = appendTapInk(bursts, burst); lastTap = now;
      paintNow(now);
      return burst;
    };
    const cancelPress = () => {
      if (!press) return;
      bursts = cancelTapInk(bursts, press.burst); press = null;
      if (bursts.length) paintNow(performance.now()); else clear();
    };
    const onDown = (e: PointerEvent) => {
      if (blocked() || !e.isPrimary || e.button !== 0) return;
      cancelPress();
      const control = eligible(e.target);
      const burst = control ? emit(control, e.clientX, e.clientY) : null;
      if (burst) press = { id: e.pointerId, x: e.clientX, y: e.clientY, burst };
    };
    const onMove = (e: PointerEvent) => {
      if (press?.id === e.pointerId && !isInkTap(e.clientX - press.x, e.clientY - press.y, 0)) cancelPress();
    };
    const onUp = (e: PointerEvent) => { if (press?.id === e.pointerId) press = null; };
    const onCancel = (e: PointerEvent) => { if (press?.id === e.pointerId) cancelPress(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
      const control = eligible(e.target);
      if (control) { const rect = control.getBoundingClientRect(); emit(control, rect.left + rect.width / 2, rect.top + rect.height / 2); }
    };
    const events = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onCancel, keydown: onKey };
    for (const [name, handler] of Object.entries(events)) window.addEventListener(name, handler as EventListener, { capture: true, passive: true });
    window.addEventListener('scroll', clear, { capture: true, passive: true });
    window.addEventListener('resize', clear, { passive: true });
    window.addEventListener('blur', clear);
    const unwatch = watchVisualActivity(active => { if (!active) clear(); }, { covered: true, reduced: true });
    return () => {
      clear(); unwatch();
      for (const [name, handler] of Object.entries(events)) window.removeEventListener(name, handler as EventListener, true);
      window.removeEventListener('scroll', clear, true); window.removeEventListener('resize', clear); window.removeEventListener('blur', clear);
    };
  }, [paused]);
  return null;
}
