/**
 * 定鏡模式（URL 帶 `?still=1`）：跳過入場動畫，直接顯示動畫最終幀，
 * 方便截圖測試（見水墨武俠 UI 套件 README）。
 */
export function useStillMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('still');
}
