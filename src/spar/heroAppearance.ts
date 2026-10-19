/** 主角全狀態細節人物：只選畫面幀，唔讀寫戰鬥、裝備或核心RNG。 */
import { MARTIAL_FALLBACK } from '../fx/art/martialFallback';
import { collapseSample, gaitFrame } from './presentation';
import heroStanceScale from '../fx/art/heroStanceScale.json';

/** 主角全程細比例；只影響繪圖，唔改演武距離、速度或核心時間。 */
export const HERO_VISUAL_SCALE = .65;

/** 每套圖按守勢身高固定校準；唔逐幀fit，蹲低／倒地唔會反而放大。 */
export function heroFigureScale(artId?: string): number {
  return HERO_VISUAL_SCALE / (artId ? (heroStanceScale as Record<string, number>)[artId] ?? 1 : 1);
}

export interface HeroAppearance {
  image: HTMLImageElement;
  /** 網絡圖集失敗時用嵌入同款人物，唔退回黑影。 */
  guard: boolean;
  /** 冇武學嘅基本攻擊亦有細節人物，唔用舊黑影揮擊。 */
  basic?: { image: HTMLImageElement; guard: boolean };
}

/** 頭四格行路、兩格待機、兩格受擊、四格倒地；腳底固定喺256／328。 */
export function heroAppearanceFrame(state: { moving: boolean; gait: number; idle: number; hurt: number; down: number | null; reduced: boolean }): number {
  if (state.down !== null) return 8 + (state.reduced ? 3 : collapseSample(state.down, .9).frame);
  if (state.hurt < .22) return state.reduced || state.hurt < .1 ? 6 : 7;
  if (state.moving && !state.reduced) return gaitFrame(state.gait);
  return state.reduced ? 4 : 4 + Math.floor(state.idle / 1.4) % 2;
}

let pending: Promise<HeroAppearance> | null = null;
/** 入場前等真正圖集或嵌入細節後備解碼完成，避免載入期間先畫黑影。 */
export function loadHeroAppearance(): Promise<HeroAppearance> {
  if (pending) return pending;
  const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('主角人物圖載入失敗')); im.src = src;
  });
  const fallback = () => load(MARTIAL_FALLBACK.fist).then(image => ({ image, guard: true }));
  pending = Promise.all([
    load(`${import.meta.env.BASE_URL}ink/spar/hero-detail/lifecycle.webp`).then(image => ({ image, guard: false })).catch(fallback),
    load(`${import.meta.env.BASE_URL}ink/art/martial/art_river_fist.webp`).then(image => ({ image, guard: false })).catch(fallback),
  ]).then(([appearance, basic]) => ({ ...appearance, basic }))
    .catch(error => { pending = null; throw error; });
  return pending;
}
