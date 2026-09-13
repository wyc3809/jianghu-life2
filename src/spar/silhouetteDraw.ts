/**
 * 演武台剪影素材（位圖）：唔再用路徑／SVG 砌人偶。
 * AI 生成嘅純黑影 WebP，腳底錨點，引擎用 drawImage 播。
 *
 * 工作室規範：遊戲內容美術禁止 SVG／向量路徑人偶；一律用位圖（WebP）。
 */

export const SIL_BASE = `${import.meta.env.BASE_URL || '/'}ink/spar/sil/`;

/** 剪影設計高度（同 WebP 腳底錨點一致） */
export const SILHOUETTE_DESIGN_H = 788;

export const HERO_SIL = {
  idle: { src: `${SIL_BASE}hero-idle.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  attack: { src: `${SIL_BASE}hero-attack.webp`, w: 616, h: 788, dx: -308, dy: -788 },
} as const;

/** 鋒尖相對腳底（設計單位）——拖墨軌用 */
export function weaponTipLocal(_weapon: string, k: number): { x: number; y: number } {
  return { x: 210 * k, y: -420 * k };
}

export function weaponFromKind(kind: string | null | undefined): string {
  if (!kind) return 'fist';
  return kind;
}

export function enemyKeyFromSrc(src: string): string {
  const m = /enemy-([a-z0-9]+)/i.exec(src);
  return (m?.[1] ?? 'shadow').toLowerCase();
}

/** @deprecated 測試兼容 */
export function enemyArchetypeFromSrc(src: string): string {
  const key = enemyKeyFromSrc(src);
  return key === 'shadow' ? 'boss' : key;
}

/**
 * 喺腳底錨點畫一張全身剪影位圖。
 * ctx 應已 translate 到腳底、套上旋轉／縮放。
 */
export function drawSilhouetteSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  opts: {
    k: number;
    flipX?: boolean;
    alpha?: number;
    w?: number;
    h?: number;
    dx?: number;
    dy?: number;
  },
) {
  const k = opts.k;
  const natW =
    'naturalWidth' in img && (img as HTMLImageElement).naturalWidth
      ? (img as HTMLImageElement).naturalWidth
      : opts.w || 616;
  const natH =
    'naturalHeight' in img && (img as HTMLImageElement).naturalHeight
      ? (img as HTMLImageElement).naturalHeight
      : opts.h || 788;
  const duW = opts.w ?? natW;
  const duH = opts.h ?? natH;
  const w = duW * k;
  const h = duH * k;
  const dx = (opts.dx ?? -duW / 2) * k;
  const dy = (opts.dy ?? -duH) * k;
  ctx.save();
  if (opts.alpha != null) ctx.globalAlpha *= Math.max(0, Math.min(1, opts.alpha));
  if (opts.flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, dx, dy, w, h);
  ctx.restore();
}
