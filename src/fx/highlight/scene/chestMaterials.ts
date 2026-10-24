/** 原創水彩材質：細木紋、雲紋金屬、絲襯及硯石；圖片沿用同一快取。 */
import * as THREE from 'three';
import { inkArtUrl } from '../../../ui/inkAssets';

const textures = new Map<string, THREE.Texture>();
const listeners = new Set<() => void>();

/** 所有App共用同一組材質圖片；不用每次開箱重新下載或生成雜訊。 */
export function chestTexture(name: 'wood' | 'metal' | 'lining' | 'stone'): THREE.Texture {
  const cached = textures.get(name);
  if (cached) return cached;
  const notify = () => listeners.forEach(listener => listener());
  const texture = typeof document === 'undefined' ? new THREE.Texture()
    : new THREE.TextureLoader().load(inkArtUrl(`art/chest/${name}.webp`), notify, undefined, () => {
      // 缺圖仍可閱讀及領取：用單色材質後備，不重試或重播抽取。
      const fallback = document.createElement('canvas'); fallback.width = fallback.height = 1;
      const context = fallback.getContext('2d');
      if (context) { context.fillStyle = '#ffffff'; context.fillRect(0, 0, 1, 1); }
      texture.image = fallback; texture.needsUpdate = true; notify();
    });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textures.set(name, texture);
  return texture;
}

/** 遲到的圖片只要求一次重畫；離場後不留下舊renderer引用。 */
export function watchChestTextures(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** 開局閒時先載入，避免第一次旋轉才解碼材質。 */
export function preloadChestTextures(): void {
  for (const name of ['wood', 'metal', 'lining', 'stone'] as const) chestTexture(name);
}

/** 柔和設色配合真正燈光；刻紋靠位圖，不以高頻螢幕雜訊代替。 */
export function chestMaterial(name: 'wood' | 'metal' | 'lining' | 'stone', color: string): THREE.MeshLambertMaterial | THREE.MeshPhongMaterial {
  const options = { color, map: chestTexture(name) };
  return name === 'metal'
    ? new THREE.MeshPhongMaterial({ ...options, shininess: 28, specular: '#8e8576' })
    : new THREE.MeshLambertMaterial(options);
}
