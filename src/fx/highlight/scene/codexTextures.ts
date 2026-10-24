/** 書冊原畫共用快取：預先解碼、正確色域與斜角取樣，避免啟封重新載圖。 */
import * as THREE from 'three';
import { codexCoverUrl } from '../codexAppearance';

type CodexTexture = 'ordinary' | 'premium' | 'left' | 'right';
const images = new Map<CodexTexture, THREE.Texture>();
const listeners = new Set<() => void>();

/** 沿用原創書封／山水內頁；缺圖用素紙後備，結果不受圖片影響。 */
export function codexTexture(name: CodexTexture): THREE.Texture {
  const cached = images.get(name);
  if (cached) return cached;
  const url = name === 'ordinary' || name === 'premium' ? codexCoverUrl(name === 'premium')
    : `${import.meta.env.BASE_URL}ink/art/gacha/codex-page-${name}.webp`;
  const notify = () => listeners.forEach(listener => listener());
  const texture = typeof document === 'undefined' ? new THREE.Texture()
    : new THREE.TextureLoader().load(url, notify, undefined, () => {
      const paper = document.createElement('canvas'); paper.width = paper.height = 1;
      const ctx = paper.getContext('2d');
      if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1, 1); }
      texture.image = paper; texture.needsUpdate = true; notify();
    });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  images.set(name, texture);
  return texture;
}

/** 閒時預載四張原畫，圖片沿用同一份，GPU引用由各舞台清理。 */
export function preloadCodexTextures(): void {
  for (const name of ['ordinary', 'premium', 'left', 'right'] as const) codexTexture(name);
}

/** 遲到圖片只要求活躍舞台補畫，離場解除訂閱。 */
export function watchCodexTextures(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
