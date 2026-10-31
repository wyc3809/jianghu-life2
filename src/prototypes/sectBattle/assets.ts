import { SECT_PREVIEW_ARTS } from './fixtures';
import manifest from './assets.json';

declare global { interface Window { __sectPreviewAssets?: Record<string, string> } }
export const SECT_ASSET_PATHS: Record<string, string> = manifest;

/** App使用原素材路徑；可下載原型可嵌入相同原圖，不依賴外站或雲端。 */
export function sectAssetUrl(path: string): string {
  return window.__sectPreviewAssets?.[path] ?? `${import.meta.env.BASE_URL}${path}`;
}

export interface SectPreviewImages { images: Record<string, HTMLImageElement>; simplified: boolean }
/** 先等詳細人物解碼；個別動作缺圖仍用相同細節人物，全部人物缺失才提供重試。 */
export async function loadSectPreviewImages(): Promise<SectPreviewImages> {
  const images: Record<string, HTMLImageElement> = {};
  let simplified = false;
  await Promise.all(Object.entries(SECT_ASSET_PATHS).map(async ([key, path]) => {
    try {
      images[key] = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error(path)); im.src = sectAssetUrl(path);
      });
    } catch { simplified = true; }
  }));
  if (!images.lifecycle && !SECT_PREVIEW_ARTS.some(id => images[id])) throw new Error('人物圖未能載入，請重試。');
  return { images, simplified };
}
