/**
 * 水墨動效工具（anime.js v4）：全遊戲 DOM 動畫共用一套節奏同緩動，
 * 唔好喺組件各自亂寫 keyframes。canvas（演武台角色）仍由 src/spar/engine.ts 自己播。
 *
 * - 只 import 用到嘅函數（tree-shake 後約十幾 KB）
 * - 減少動態（系統設定）時全部直接跳到終點，唔播
 * - 所有函數對 null / 已卸載元素安全
 *
 * 設計見 docs/architecture/adr-004-anime-js-ui-motion.md。
 */
import { animate, splitText, stagger, type JSAnimation } from 'animejs';

/** 節奏（毫秒）：同 CSS --motion-* 對齊 */
export const INK_MS = { quick: 220, base: 420, slow: 640, ritual: 1100 } as const;

/** 緩動：落筆（回彈少少）、蓋印（彈性）、墨散（慢收） */
export const INK_EASE = {
  brush: 'outBack(1.4)',
  stamp: 'outElastic(1, .55)',
  settle: 'outExpo',
  soft: 'outQuad',
} as const;

type El = Element | null | undefined;
type Els = El | ArrayLike<Element> | null | undefined;

export function motionReduced(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

function list(t: Els): Element[] {
  if (!t) return [];
  if (t instanceof Element) return [t];
  return Array.from(t as ArrayLike<Element>).filter(Boolean);
}

/** 受擊／扣血：左右震幾下 */
export function inkShake(target: El, px = 4, duration: number = 320): JSAnimation | null {
  if (!target || motionReduced()) return null;
  return animate(target, {
    x: [0, -px, px, -px * 0.6, px * 0.4, 0],
    duration,
    ease: INK_EASE.soft,
  });
}

/** 一組元素落筆式錯開出場（列表、格仔、按鈕） */
export function inkPopIn(targets: Els, opts: { delay?: number; step?: number; y?: number } = {}): JSAnimation | null {
  const els = list(targets);
  if (!els.length || motionReduced()) return null;
  return animate(els, {
    opacity: [0, 1],
    y: [opts.y ?? 12, 0],
    scale: [0.95, 1],
    delay: stagger(opts.step ?? 45, { start: opts.delay ?? 0 }),
    duration: INK_MS.base,
    ease: INK_EASE.brush,
  });
}

/** 題字：逐隻字由模糊墨點凝聚出嚟 */
export function inkRevealChars(target: El, opts: { delay?: number; step?: number } = {}): (() => void) | null {
  if (!target || motionReduced()) return null;
  const splitter = splitText(target as HTMLElement, { chars: true });
  animate(splitter.chars, {
    opacity: [0, 1],
    y: ['0.5em', '0em'],
    scale: [1.35, 1],
    filter: ['blur(5px)', 'blur(0px)'],
    delay: stagger(opts.step ?? 70, { start: opts.delay ?? 0 }),
    duration: INK_MS.slow,
    ease: INK_EASE.brush,
  });
  return () => splitter.revert();
}

/** 蓋印：由大縮落、彈一彈 */
export function inkStamp(target: El, delay = 0): JSAnimation | null {
  if (!target || motionReduced()) return null;
  return animate(target, {
    scale: [1.7, 1],
    rotate: [-10, -3],
    opacity: [0, 1],
    delay,
    duration: INK_MS.slow,
    ease: INK_EASE.stamp,
  });
}

/** 數字由 from 滾到 to（format 自定，例如 k/m 簡寫） */
export function inkCountTo(
  target: El,
  from: number,
  to: number,
  format: (n: number) => string = (n) => Math.round(n).toLocaleString('en-US'),
  duration: number = INK_MS.slow,
): JSAnimation | null {
  if (!target) return null;
  if (motionReduced() || from === to) {
    target.textContent = format(to);
    return null;
  }
  const o = { v: from };
  return animate(o, {
    v: to,
    duration,
    ease: INK_EASE.settle,
    onUpdate: () => {
      target.textContent = format(o.v);
    },
  });
}

/** 紙張翻入：過月、換頁 */
export function inkPageIn(target: El): JSAnimation | null {
  if (!target || motionReduced()) return null;
  return animate(target, {
    opacity: [0, 1],
    y: [14, 0],
    rotateX: [-16, 0],
    duration: INK_MS.slow,
    ease: INK_EASE.brush,
  });
}

/** 卡由墨點展開：事件卡入場 */
export function inkCardIn(target: El): JSAnimation | null {
  if (!target || motionReduced()) return null;
  return animate(target, {
    opacity: [0, 1],
    scale: [0.82, 1],
    rotate: [-3, 0],
    filter: ['blur(6px)', 'blur(0px)'],
    duration: INK_MS.slow,
    ease: INK_EASE.brush,
  });
}

/** 導航圖示：跳一跳、擺一擺 */
export function inkHop(target: El): JSAnimation | null {
  if (!target || motionReduced()) return null;
  return animate(target, {
    y: [0, -7, 0],
    rotate: [0, -8, 0],
    scale: [1, 1.14, 1],
    duration: INK_MS.slow,
    ease: INK_EASE.soft,
  });
}

/** 任意 CSS 變數由 from 滑到 to（例如血條殘影 --pct） */
export function inkTweenVar(
  target: El,
  name: string,
  from: number,
  to: number,
  opts: { delay?: number; duration?: number } = {},
): JSAnimation | null {
  const el = target as HTMLElement | null | undefined;
  if (!el) return null;
  if (motionReduced()) {
    el.style.setProperty(name, String(to));
    return null;
  }
  const o = { v: from };
  el.style.setProperty(name, String(from));
  return animate(o, {
    v: to,
    delay: opts.delay ?? 0,
    duration: opts.duration ?? INK_MS.slow,
    ease: INK_EASE.soft,
    onUpdate: () => el.style.setProperty(name, o.v.toFixed(2)),
  });
}

/**
 * 貨幣增加：金色掃光由左掃到右（CSS 用 --glint 0→1 定位高光帶，見 `.ink-glint`）。
 * 減少動態時唔播。
 */
export function inkGlint(target: El, delay = 0): JSAnimation | null {
  const el = target as HTMLElement | null | undefined;
  if (!el || motionReduced()) return null;
  el.classList.add('is-glinting');
  const o = { v: 0 };
  el.style.setProperty('--glint', '0');
  return animate(o, {
    v: 1,
    delay,
    duration: INK_MS.slow,
    ease: INK_EASE.soft,
    onUpdate: () => el.style.setProperty('--glint', o.v.toFixed(3)),
    onComplete: () => el.classList.remove('is-glinting'),
  });
}
