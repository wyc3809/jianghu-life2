import { playInkTap } from '../audio/inkAudio';

const PRESS_SEL = 'button,[role="button"],[role="tab"],summary,a[href],.ink-btn,.ink-choice,.ink-tab';
const PRESSED = 'is-pressed';

function findPressable(el: EventTarget | null): HTMLElement | null {
  if (!(el instanceof Element)) return null;
  const hit = el.closest(PRESS_SEL);
  if (!(hit instanceof HTMLElement) || hit.closest('[disabled],[aria-disabled="true"],[inert]')) return null;
  return hit;
}

/** 共用按壓回饋；捲動／離場即取消，保留原生點擊與鍵盤行為，不截取手勢或重發指令。 */
export function installPressFeedback(): () => void {
  if (typeof document === 'undefined') return () => {};
  let current: HTMLElement | null = null;
  let pointerId: number | null = null;
  let origin = { x: 0, y: 0 };
  const clear = () => {
    current?.classList.remove(PRESSED);
    current = null;
    pointerId = null;
  };
  const onDown = (e: PointerEvent) => {
    if ((e.button != null && e.button !== 0) || e.isPrimary === false) return;
    clear();
    const target = findPressable(e.target);
    if (!target) return;
    current = target;
    pointerId = e.pointerId;
    origin = { x: e.clientX, y: e.clientY };
    target.classList.add(PRESSED);
    playInkTap();
  };
  const onMove = (e: PointerEvent) => {
    if (pointerId === e.pointerId && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) clear();
  };
  const onUp = (e: PointerEvent) => {
    if (pointerId != null && e.pointerId !== pointerId) return;
    clear();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
    const target = findPressable(e.target);
    if (!target) return;
    clear(); current = target; target.classList.add(PRESSED);
    playInkTap();
  };
  const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') clear(); };
  const events = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onUp,
    keydown: onKeyDown, keyup: onKeyUp, scroll: clear, visibilitychange: clear };
  for (const [name, handler] of Object.entries(events)) document.addEventListener(name, handler as EventListener, { capture: true, passive: true });
  window.addEventListener('blur', clear);
  return () => {
    clear();
    for (const [name, handler] of Object.entries(events)) document.removeEventListener(name, handler as EventListener, {capture:true});
    window.removeEventListener('blur', clear);
  };
}
