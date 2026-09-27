/**
 * 震動回饋（手機）：用 navigator.vibrate，唔支援（iOS Safari、桌面）就靜靜略過。
 * 設定「震動」可關（localStorage `ink_haptics`）；減少動態時亦唔震。
 * 由 src/audio/inkAudio.ts 各音效入口順手觸發——聲同震同一刻。
 */

const KEY = 'ink_haptics';

/** 震動強度：輕（撳掣）／中（落印、擊中）／重（暴擊、重傷）／儀式（勝、突破） */
export type HapticKind = 'light' | 'medium' | 'heavy' | 'ritual' | 'fail';

const PATTERN: Readonly<Record<HapticKind, number | number[]>> = {
  light: 8,
  medium: 18,
  heavy: [28, 30, 44],
  ritual: [14, 50, 14, 50, 36],
  fail: [50, 40, 70],
};

let enabled = true;
try {
  if (typeof localStorage !== 'undefined') enabled = localStorage.getItem(KEY) !== '0';
} catch {
  enabled = true;
}

export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

export function setHapticsEnabled(next: boolean): void {
  enabled = next;
  try {
    localStorage.setItem(KEY, next ? '1' : '0');
  } catch {
    /* 私隱模式：只記喺記憶體 */
  }
}

function reduceMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.inkMotion === 'reduce') return true;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** 震一下；唔支援／已關／減少動態 → 乜都唔做 */
export function haptic(kind: HapticKind): void {
  if (!enabled || !hapticsSupported() || reduceMotion()) return;
  try {
    navigator.vibrate(PATTERN[kind]);
  } catch {
    /* 部分瀏覽器喺未有用戶手勢前會拋錯 */
  }
}
