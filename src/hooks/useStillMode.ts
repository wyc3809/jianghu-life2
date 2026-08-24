/**
 * 定鏡模式（URL 帶 `?still=1`）：跳過入場動畫，直接顯示動畫最終幀，
 * 方便截圖測試（見水墨武俠 UI 套件 README）。
 */
export function useStillMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('still');
}

/** 使用者系統設定「減少動態效果」 */
export function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * JS 驅動嘅動畫（canvas 粒子、setTimeout 自動跳轉）要唔要跳過。
 * CSS keyframes 已經有 `@media (prefers-reduced-motion: reduce)` 處理，
 * 呢個 hook 淨係俾冇辦法用純 CSS 表達嘅 JS 動畫用。
 */
export function useSkipJsAnimation(): boolean {
  return useStillMode() || usePrefersReducedMotion();
}
