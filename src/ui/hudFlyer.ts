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
