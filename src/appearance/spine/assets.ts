import { readAppearance } from '@interfaces/appearance';
import { APPEARANCE_COLOURS } from '@data/appearances';
import { SPINE_CATALOG, spineSkinKey } from './frames';

export type SpineTextureKind = 'atlas' | 'idle' | 'seated';
export interface SpineTextures {
  get(value: unknown, kind: SpineTextureKind): CanvasImageSource | undefined;
  prepare(value: unknown, kind: SpineTextureKind): Promise<void>;
  readonly degraded: boolean;
}

/** 圖集及高解像立繪共用有界LRU；不在畫面每幀調色或讀回WebGL。 */
export function createSpineTextures(): SpineTextures {
  const entries = new Map<string, CanvasImageSource>(), pending = new Map<string, Promise<void>>();
  let degraded = false;
  const keyOf = (value: unknown, kind: SpineTextureKind) => `${spineSkinKey(value)}:${readAppearance(value).tone}:${kind}`;
  const image = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image(), timeout = setTimeout(() => { im.onload = im.onerror = null; reject(Error('人物素材載入逾時')); }, 6000);
    im.onload = () => { clearTimeout(timeout); resolve(im); }; im.onerror = () => { clearTimeout(timeout); reject(Error('人物素材未能載入')); }; im.src = src;
  });
  const store = (key: string, value: CanvasImageSource) => { entries.delete(key); entries.set(key, value); while (entries.size > 4) entries.delete(entries.keys().next().value!); };
  const prepare = async (value: unknown, kind: SpineTextureKind) => {
    const key = keyOf(value, kind); if (entries.has(key)) return;
    if (pending.has(key)) return pending.get(key)!;
    const task = (async () => {
      const a = readAppearance(value), skin = SPINE_CATALOG.skins[spineSkinKey(a)];
      const src = kind === 'atlas' ? skin.src : skin[kind]; let im: HTMLImageElement;
      try { im = await image(window.__jianghuAppearanceAssets?.[src] ?? `${import.meta.env.BASE_URL}${src}`); }
      catch { im = await image(kind === 'seated' ? skin.fallbackSeated : skin.fallback); degraded = true; }
      const canvas = document.createElement('canvas'); canvas.width = im.naturalWidth; canvas.height = im.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(im, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height), d = pixels.data, colour = APPEARANCE_COLOURS[a.tone];
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i + 2] - d[i] > 5 && d[i + 2] >= d[i + 1]) {
        const light = (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 92;
        for (let c = 0; c < 3; c++) d[i + c] = Math.min(247, colour[c] * light);
      }
      ctx.putImageData(pixels, 0, 0); store(key, canvas);
    })().finally(() => pending.delete(key));
    pending.set(key, task); return task;
  };
  return {
    get(value, kind) { const key = keyOf(value, kind), item = entries.get(key); if (item) { store(key, item); return item; } void prepare(value, kind).catch(() => { degraded = true; }); return undefined; },
    prepare, get degraded() { return degraded; },
  };
}
