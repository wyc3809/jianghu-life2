/**
 * 卡通分階材質：MeshToonMaterial ＋ 4 階漸變貼圖（NearestFilter，分界硬但唔鋸齒——鋸齒由描邊蓋）。
 */
import * as THREE from 'three';

let gradientMap: THREE.DataTexture | null = null;

/** 4 階：暗部、陰影、亮面、高光 */
export function toonGradient(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const steps = [90, 150, 215, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  gradientMap = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

export function toon(
  color: THREE.ColorRepresentation,
  opts: { emissive?: THREE.ColorRepresentation; emissiveIntensity?: number } = {},
) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

/** 發光核心（縫隙透光用）：唔受光，只受 intensity 控制亮度 */
export function glowCore(color: THREE.ColorRepresentation) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, depthWrite: true });
}
