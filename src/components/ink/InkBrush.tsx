/**
 * 水墨筆觸進度元件（取代所有 UI 內嵌 SVG）。
 * 紋理：`public/ink/art/ui/*.webp`（`scripts/art/build_ink_ui.py` 產生）
 * 做法：WebP alpha 作 CSS mask，background-color 染色；進度用 clip-path／conic mask，
 * 入場「落筆」動畫與數值變化過渡全由 CSS 驅動（見 styles.css「水墨筆觸 UI」段）。
 */
import type { CSSProperties } from 'react';

export type InkBrushTone = 'ink' | 'cinnabar' | 'jade' | 'blue' | 'gold';

type BarProps = {
  /** 0–100 */
  pct: number;
  tone?: InkBrushTone;
  /** 入場落筆動畫（定鏡／減少動態時傳 false） */
  intro?: boolean;
  /** 入場延遲（秒） */
  delay?: number;
  /** 入場時長（秒） */
  duration?: number;
  className?: string;
  style?: CSSProperties;
};

/** raw/max → 0–100 夾值（NaN／max≤0 當 0） */
export function clampPct(raw: number, max = 100): number {
  const pct = (raw / max) * 100;
  if (!(max > 0) || !Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}

/** 橫向毛筆進度條：淡乾筆底軌 + 墨色筆劃按比例露出 */
export function InkBrushBar({ pct, tone = 'ink', intro = false, delay = 0, duration = 1, className, style }: BarProps) {
  return (
    <span
      className={`ink-brush-bar ink-brush--${tone}${intro ? ' ink-brush-bar--intro' : ''}${className ? ` ${className}` : ''}`}
      style={{
        ['--pct' as string]: clampPct(pct),
        ['--brush-delay' as string]: `${delay}s`,
        ['--brush-dur' as string]: `${duration}s`,
        ...style,
      }}
      aria-hidden
    >
      <span className="ink-brush-bar__rail" />
      <span className="ink-brush-bar__fill" />
    </span>
  );
}

type RingProps = {
  /** 0–100 */
  pct: number;
  tone?: InkBrushTone;
  /** 未滿時沿環遊走的一點墨光 */
  flow?: boolean;
  className?: string;
};

/** 一筆圓進度環：自 12 點順時針「寫」出去 */
export function InkBrushRing({ pct, tone = 'blue', flow = false, className }: RingProps) {
  return (
    <span
      className={`ink-brush-ring ink-brush--${tone}${className ? ` ${className}` : ''}`}
      style={{ ['--pct' as string]: clampPct(pct) }}
      aria-hidden
    >
      <span className="ink-brush-ring__rail" />
      <span className="ink-brush-ring__fill" />
      {flow && <span className="ink-brush-ring__flow" />}
    </span>
  );
}
