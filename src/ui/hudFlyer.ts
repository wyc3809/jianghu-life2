/**
 * 數字飛入：數值增加時，墨點由玩家最後撳嘅位置（冇就畫面中間）沿弧線飛入頂欄目標，到咗目標跳一下。
 * 用 Web Animations API（主包唔帶 GSAP）；減少動態時唔飛，只由數字自己滾。
 */
import { shouldReduceInkMotion } from '../components/ink/sceneVariants';

let lastPoint: { x: number; y: number } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      lastPoint = { x: e.clientX, y: e.clientY };
    },
    { capture: true, passive: true },
  );
}

/** 飛幾粒墨點去 target；回傳大概幾耐飛完（ms） */
export function flyInkDots(
  target: HTMLElement | null,
  count: number,
  tone: 'ink' | 'cinnabar' | 'gold' = 'gold',
): number {
  if (!target || shouldReduceInkMotion() || typeof document === 'undefined') return 0;
  const to = target.getBoundingClientRect();
  const from = lastPoint ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
  const tx = to.left + to.width / 2;
  const ty = to.top + to.height / 2;
  const n = Math.max(1, Math.min(8, count));
  const dur = 620;
  const stagger = 55;
  for (let i = 0; i < n; i++) {
    const dot = document.createElement('span');
    dot.className = `ink-hud-flyer ink-hud-flyer--${tone}`;
    document.body.appendChild(dot);
    const sx = from.x + (i - n / 2) * 7;
    const sy = from.y + ((i * 37) % 17) - 8;
    // 弧線：中段向外拋再收入（控制點喺起點同目標之間偏上）
    const mx = (sx + tx) / 2 + (i % 2 ? 1 : -1) * 40;
    const my = Math.min(sy, ty) - 60;
    const anim = dot.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(0.4)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy - 14}px) scale(1.1)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.55)`, opacity: 0.9 },
      ],
      { duration: dur, delay: i * stagger, easing: 'cubic-bezier(0.5, 0, 0.75, 0.6)', fill: 'both' },
    );
    anim.onfinish = () => {
      dot.remove();
      target.animate([{ transform: 'scale(1.22)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], {
        duration: 260,
        easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)',
      });
    };
  }
  return dur + (n - 1) * stagger;
}

/**
 * 墨字飛入：喺 from（視窗座標）彈起一串墨字（例如「+3 修為」），再沿曲線飛落 target，
 * 到位時 target 跳一下。減少動態：唔飛，淨係原地淡出。回傳幾耐飛完（ms）。
 */
export function flyInkText(
  from: { x: number; y: number },
  target: HTMLElement | null,
  text: string,
  opts: { riseMs?: number; flyMs?: number; tone?: 'ink' | 'cinnabar' } = {},
): number {
  if (typeof document === 'undefined') return 0;
  const rise = opts.riseMs ?? 350;
  const fly = opts.flyMs ?? 700;
  const el = document.createElement('span');
  el.className = `ink-fly-text${opts.tone === 'cinnabar' ? ' ink-fly-text--cinnabar' : ''}`;
  el.textContent = text;
  document.body.appendChild(el);
  const sx = from.x;
  const sy = from.y;
  if (!target || shouldReduceInkMotion()) {
    const a = el.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%)`, opacity: 0 },
        { transform: `translate(${sx}px, ${sy - 18}px) translate(-50%, -50%)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${sx}px, ${sy - 24}px) translate(-50%, -50%)`, opacity: 0 },
      ],
      { duration: 900, fill: 'both' },
    );
    a.onfinish = () => el.remove();
    return 900;
  }
  const to = target.getBoundingClientRect();
  const tx = to.left + to.width / 2;
  const ty = to.top + to.height / 2;
  const total = rise + fly;
  const up = rise / total;
  // 彈起（放大、落墨）→ 停一停 → 沿弧線飛向目標（縮細）
  const mx = (sx + tx) / 2 + (tx > sx ? -30 : 30);
  const my = Math.min(sy, ty) - 40;
  const anim = el.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(0.6)`, opacity: 0, filter: 'blur(4px)' },
      { transform: `translate(${sx}px, ${sy - 30}px) translate(-50%, -50%) scale(1.12)`, opacity: 1, filter: 'blur(0px)', offset: up * 0.6 },
      { transform: `translate(${sx}px, ${sy - 34}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: up },
      { transform: `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(0.85)`, opacity: 1, offset: up + (1 - up) * 0.5 },
      { transform: `translate(${tx}px, ${ty}px) translate(-50%, -50%) scale(0.5)`, opacity: 0.2 },
    ],
    { duration: total, easing: 'cubic-bezier(0.45, 0, 0.6, 1)', fill: 'both' },
  );
  anim.onfinish = () => {
    el.remove();
    target.animate([{ transform: 'scale(1.22)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], {
      duration: 280,
      easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)',
    });
  };
  return total;
}
