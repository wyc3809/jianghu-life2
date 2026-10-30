/**
 * 高光時刻入口：按需載入（Three.js／GSAP 唔入首屏）。
 * prefetchHighlight() 喺開局後閒時預載，真正要播時唔使等。
 */
import { lazy } from 'react';
import type { HighlightSubject } from './types';

const load = () => import('./HighlightFx');

export const HighlightFxLazy = lazy(load);

/** 高光級打鬥演出（subject「duel」）：自動交手用，同樣按需載入 */
const loadDuel = () => import('./duel/DuelFx');
export const DuelFxLazy = lazy(loadDuel);

let webgl: boolean | null = null;
/** 有冇 WebGL（冇就退返水墨特效） */
export function canUseWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webgl = false;
  }
  return webgl;
}

const prefetched = new Set<HighlightSubject>();
/** 按將進入的功能預載；自動交手仍維持真正使用時才載入。 */
export function prefetchHighlight(subject: HighlightSubject = 'chest'): void {
  if (prefetched.has(subject)) return;
  prefetched.add(subject);
  void load().then(module => module.prefetchHighlightAssets(subject)).catch(() => { prefetched.delete(subject); });
}

export type { HighlightConfig, RewardCard, Grade, HighlightSubject } from './types';

/** 減少動態（遊戲設定或系統設定）：打鬥演出退返 2D */
export function prefersReducedMotion(): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dataset.inkMotion === 'reduce') return true;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** 抽卡待機書冊按頁面需要載入。 */
export const CodexStageLazy = lazy(() => import('./CodexStage'));
