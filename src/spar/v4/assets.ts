/**
 * 演武台 v4 圖檔路徑同載入（全部 WebP 點陣；見 scripts/art/build_spar_v4.py）。
 * 同一張圖只載一次（快取 Promise）；載唔到就回傳 null，渲染器照畫其他層。
 */
import type { WeaponKind } from '@data/equipment/catalog';
import type { EnemyClipId, HeroClipId } from '@data/spar/clips';
import type { SlashStyle, SparPlace, SparSeason } from '@data/spar/tuning';
import { SEASON_DROPS } from '@data/spar/tuning';

const BASE = `${import.meta.env.BASE_URL || '/'}ink/spar/v4/`;

export type HeroLayer = 'back' | 'robe' | 'front' | 'armor' | 'acc' | 'hand';
export const HERO_LAYERS: readonly HeroLayer[] = ['back', 'robe', 'front', 'armor', 'acc', 'hand'];

export const sparUrl = {
  hero: (clip: HeroClipId, layer: HeroLayer) => `${BASE}hero/${clip}.${layer}.webp`,
  enemy: (boss: boolean, tier: number, clip: EnemyClipId) => `${BASE}${boss ? 'boss' : 'enemy'}/t${tier}/${clip}.webp`,
  weapon: (kind: WeaponKind) => `${BASE}weapon/${kind}.webp`,
  slash: (style: SlashStyle) => `${BASE}fx/slash-${style}.webp`,
  drop: (season: SparSeason) => `${BASE}fx/drop-${SEASON_DROPS[season].sprite}.webp`,
  bg: (place: SparPlace, layer: 'far' | 'mid' | 'near') => `${BASE}bg/${place}-${layer}.webp`,
  splash: () => `${import.meta.env.BASE_URL || '/'}ink/spar/fx-splash.webp`,
};

const cache = new Map<string, Promise<HTMLImageElement | null>>();
const ready = new Map<string, HTMLImageElement>();

/** 載入（快取）；失敗回傳 null */
export function loadImage(url: string): Promise<HTMLImageElement | null> {
  let p = cache.get(url);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        ready.set(url, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
    cache.set(url, p);
  }
  return p;
}

/** 已經載好就即刻攞到，未好回傳 null（渲染迴圈用，唔會等） */
export function imageNow(url: string): HTMLImageElement | null {
  const img = ready.get(url);
  if (img) return img;
  void loadImage(url);
  return null;
}
