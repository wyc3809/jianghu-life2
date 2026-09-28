/**
 * 主頁 3D 劍客入口：按需載入（Three.js／GSAP 唔入首屏）。
 * 載入前主頁顯示靜態後備圖（public/ink/art/title/swordsman.webp），冇 WebGL 就一直用後備圖。
 */
import { lazy } from 'react';

export const TitleHeroLazy = lazy(() => import('./TitleHero'));
export type { TitleHeroProps } from './TitleHero';
