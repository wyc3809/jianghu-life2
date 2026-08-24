/** 定鏡模式（?still=1）下，將動畫元素切去「已完成」嘅樣式 class */
export function stillClassName(base: string, stillCls: string | undefined, still: boolean): string {
  return `${base}${still && stillCls ? ` ${stillCls}` : ''}`;
}

/** SVG 進度條：由 0–100% 數值轉做 stroke-dashoffset 用嘅 offset */
export function barOffset(len: number, raw: number, max: number): number {
  const pct = Math.max(0, Math.min(1, max > 0 ? raw / max : 0));
  return Math.round(len * (1 - pct));
}
