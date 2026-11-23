import { playInkTap } from '../audio/inkAudio';
import { inkControlPress, type InkPressResponse } from './inkMotion';

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
  let response: InkPressResponse | null = null;
  const responses = new Set<InkPressResponse>();
  let pointerId: number | null = null;
  let origin = { x: 0, y: 0 };
  const clear = () => {
    if (current && pointerId !== null) {
      try { if (current.hasPointerCapture?.(pointerId)) current.releasePointerCapture(pointerId); } catch { /* 指針可能已由瀏覽器取消 */ }
    }
    response?.cancel(); response = null;
    current?.classList.remove(PRESSED);
    current = null;
    pointerId = null;
  };
  const begin = (target: HTMLElement) => {
    let feedback: InkPressResponse | null = null, settled = false;
    feedback = inkControlPress(target, () => { settled = true; if (feedback) responses.delete(feedback); });
    response = feedback; if (!settled) responses.add(feedback);
  };
  const release = () => {
    current?.classList.remove(PRESSED); response?.release();
    response = null; current = null; pointerId = null;
  };
  const onDown = (e: PointerEvent) => {
    if ((e.button != null && e.button !== 0) || e.isPrimary === false) return;
    clear();
    const target = findPressable(e.target);
    if (!target || target.matches('[data-ink-stationary]')) return;
    current = target;
    pointerId = e.pointerId;
    origin = { x: e.clientX, y: e.clientY };
    target.classList.add(PRESSED);
    // 縮放只改外觀；保留原生按下目標，邊位按壓亦可放手確認。拖動即解除。
    try { target.setPointerCapture?.(e.pointerId); } catch { /* 已取消的指針不重建 */ }
    begin(target);
  };
  const onMove = (e: PointerEvent) => {
    if (pointerId === e.pointerId && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) clear();
  };
  const onUp = (e: PointerEvent) => {
    if (pointerId != null && e.pointerId !== pointerId) return;
    if (current && findPressable(e.target) === current) release(); else clear();
  };
  const onCancel = (e: PointerEvent) => { if (pointerId == null || e.pointerId === pointerId) clear(); };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
    const target = findPressable(e.target);
    if (!target || target.matches('[data-ink-stationary]')) return;
    clear(); current = target; target.classList.add(PRESSED);
    begin(target);
  };
  const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') release(); };
  const onClick = (e: MouseEvent) => {
    const target = findPressable(e.target);
    if (target) playInkTap(target.matches('.ink-btn--primary,.ink-equipment-confirm,.ink-martial-confirm,.ink-codex-pulls button,.ink-nav-center') ? 'firm' : 'light');
  };
  const cancelAll = () => { clear(); for (const feedback of [...responses]) feedback.cancel(); responses.clear(); };
  const events = { pointerdown: onDown, pointermove: onMove, pointerup: onUp, pointercancel: onCancel, click: onClick,
    keydown: onKeyDown, keyup: onKeyUp, scroll: cancelAll, visibilitychange: cancelAll };
  for (const [name, handler] of Object.entries(events)) document.addEventListener(name, handler as EventListener, { capture: true, passive: true });
  window.addEventListener('blur', cancelAll);
  return () => {
    cancelAll();
    for (const [name, handler] of Object.entries(events)) document.removeEventListener(name, handler as EventListener, {capture:true});
    window.removeEventListener('blur', cancelAll);
  };
}
