/**
 * 演武台剪影素材（位圖）：唔再用路徑／SVG 砌人偶。
 *
 * A：多幀行路／揮擊全身幀
 * C：分層傀儡（身／笠／臂）+ 武器掛點
 *
 * 工作室規範：遊戲內容美術禁止 SVG／向量路徑人偶；一律用位圖（WebP）。
 */

export const SIL_BASE = `${import.meta.env.BASE_URL || '/'}ink/spar/sil/`;
export const SIL_FRAMES = `${SIL_BASE}frames/`;
export const SIL_LAYERS = `${SIL_BASE}layers/`;

/** 剪影設計高度（同 WebP 腳底錨點一致） */
export const SILHOUETTE_DESIGN_H = 788;

export const HERO_SIL = {
  idle: { src: `${SIL_BASE}hero-idle.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  attack: { src: `${SIL_BASE}hero-attack.webp`, w: 616, h: 788, dx: -308, dy: -788 },
} as const;

/** A：行路循環 4 幀（腳底錨點全身） */
export const HERO_WALK_FRAMES = [
  { src: `${SIL_FRAMES}hero-walk-0.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  { src: `${SIL_FRAMES}hero-walk-1.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  { src: `${SIL_FRAMES}hero-walk-2.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  { src: `${SIL_FRAMES}hero-walk-3.webp`, w: 616, h: 788, dx: -308, dy: -788 },
] as const;

/** A：揮擊 3 幀（蓄勢／中斬／收招） */
export const HERO_ATK_FRAMES = [
  { src: `${SIL_FRAMES}hero-atk-0.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  { src: `${SIL_FRAMES}hero-atk-1.webp`, w: 616, h: 788, dx: -308, dy: -788 },
  { src: `${SIL_FRAMES}hero-atk-2.webp`, w: 616, h: 788, dx: -308, dy: -788 },
] as const;

/**
 * C：分層剪影（相對腳底設計單位）。
 * 繪製順序：身 → 笠 → 臂（臂跟肩轉）。
 */
export const HERO_LAYERS = {
  body: { src: `${SIL_LAYERS}hero-body.webp`, w: 420, h: 640, dx: -210, dy: -640 },
  hat: { src: `${SIL_LAYERS}hero-hat.webp`, w: 93, h: 160, dx: -46, dy: -150 },
  arm: { src: `${SIL_LAYERS}hero-arm.webp`, w: 161, h: 220, dx: -28, dy: -24 },
} as const;

/** 鋒尖相對腳底（設計單位）——拖墨軌用 */
export function weaponTipLocal(_weapon: string, k: number): { x: number; y: number } {
  return { x: 210 * k, y: -420 * k };
}

/** 武器尖相對握點（設計單位） */
export function weaponTipFromGrip(weapon: string, k: number): { x: number; y: number } {
  switch (weapon) {
    case 'spear':
      return { x: 18 * k, y: 320 * k };
    case 'staff':
      return { x: 12 * k, y: 300 * k };
    case 'blade':
      return { x: 20 * k, y: 260 * k };
    case 'fist':
      return { x: 40 * k, y: 80 * k };
    default:
      return { x: 16 * k, y: 280 * k };
  }
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

/** 行路幀索引：stride 秒／循環 */
export function walkFrameIndex(walkT: number, strideSec = 0.42): number {
  const n = HERO_WALK_FRAMES.length;
  const u = ((walkT / strideSec) % 1 + 1) % 1;
  return Math.min(n - 1, Math.floor(u * n));
}

/** 揮擊幀：對齊 attack clip 時間軸 */
export function attackFrameIndex(attackT: number, dur = 0.72): number {
  const p = Math.max(0, Math.min(0.999, attackT / dur));
  if (p < 0.28) return 0;
  if (p < 0.55) return 1;
  return 2;
}
