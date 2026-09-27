/**
 * 高光時刻入口：按需載入（Three.js／GSAP 唔入首屏）。
 * prefetchHighlight() 喺開局後閒時預載，真正要播時唔使等。
 */
import { lazy } from 'react';

const load = () => import('./HighlightFx');

export const HighlightFxLazy = lazy(load);

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

let prefetched = false;
export function prefetchHighlight(): void {
  if (prefetched) return;
  prefetched = true;
  void load();
}

export type { HighlightConfig, RewardCard, Grade, HighlightSubject } from './types';
