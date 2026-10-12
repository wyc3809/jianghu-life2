export type UiReviewVariant = 'a' | 'b';

/** 樣板只喺開發版明確指定時開啟，唔改正式版預設介面。 */
export function parseUiReviewVariant(search: string, enabled: boolean): UiReviewVariant | null {
  if (!enabled) return null;
  const value = new URLSearchParams(search).get('ui-preview');
  return value === 'a' || value === 'b' ? value : null;
}

/** 讀取目前樣板；冇瀏覽器環境時保持原版。 */
export function activeUiReview(): UiReviewVariant | null {
  return typeof window === 'undefined' ? null : parseUiReviewVariant(window.location.search, import.meta.env.DEV);
}
