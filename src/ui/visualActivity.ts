import { highlightCoversPage, watchHighlightVisibility } from './highlightVisibility';

/** 視覺循環共用前景／遮蔽／減少動態判斷；不觸碰遊戲時間或獎勵。 */
export function watchVisualActivity(onChange: (active: boolean) => void, options: {
  element?: Element; covered?: boolean; reduced?: boolean; dialogs?: boolean;
} = {}): () => void {
  let intersecting = true, disposed = false, previous: boolean | undefined;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    if (disposed) return;
    const reduced = motion.matches || document.documentElement.dataset.inkMotion === 'reduce';
    const active = !document.hidden && intersecting && !(options.covered && highlightCoversPage())
      && !(options.reduced && reduced) && !(options.dialogs && document.querySelector('dialog[open]'));
    if (active !== previous) { previous = active; onChange(active); }
  };
  const io = options.element && typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => { intersecting = Boolean(entry?.isIntersecting); update(); }) : null;
  if (options.element) io?.observe(options.element);
  const settings = new MutationObserver(update);
  settings.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ink-motion'] });
  if (options.dialogs) settings.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
  const unwatch = watchHighlightVisibility(update);
  motion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
  return () => {
    disposed = true;
    io?.disconnect(); settings.disconnect(); unwatch();
    motion.removeEventListener('change', update); document.removeEventListener('visibilitychange', update);
  };
}

/** 停止時取消RAF，恢復首幀dt為0；背景停留不會變成補播或粒子暴衝。 */
export function createVisualLoop(draw: (now: number, dt: number) => void, clock = {
  request: (callback: FrameRequestCallback) => requestAnimationFrame(callback),
  cancel: (id: number) => cancelAnimationFrame(id),
}) {
  let active = false, disposed = false, raf = 0, last: number | null = null;
  const frame = (now: number) => {
    raf = 0;
    if (!active) return;
    const dt = last === null ? 0 : Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now; draw(now, dt);
    if (active) raf = clock.request(frame);
  };
  return {
    setActive(value: boolean) {
      if (disposed || value === active) return;
      active = value; last = null;
      if (active) raf = clock.request(frame);
      else { clock.cancel(raf); raf = 0; }
    },
    dispose() { disposed = true; active = false; clock.cancel(raf); raf = 0; last = null; },
  };
}

/** 前景閒時預載一次；離場取消排程，背景回來後才繼續，不拖慢開局。 */
export function scheduleVisualPreload(load: () => void): () => void {
  let id: number | null = null, finished = false, disposed = false;
  const idle = 'requestIdleCallback' in window;
  const cancel = () => {
    if (id === null) return;
    if (idle) window.cancelIdleCallback(id); else window.clearTimeout(id);
    id = null;
  };
  const unwatch = watchVisualActivity(active => {
    if (!active) { cancel(); return; }
    if (finished || id !== null) return;
    const run = () => {
      id = null;
      if (disposed || document.hidden) return;
      finished = true; load();
    };
    id = idle ? window.requestIdleCallback(run, { timeout: 2000 }) : window.setTimeout(run, 500);
  });
  return () => { disposed = true; cancel(); unwatch(); };
}
