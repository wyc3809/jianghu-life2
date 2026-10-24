/** 可彎曲紙面：書脊不漂移，逐頁翻轉時以連續法線表達柔軟紙張。 */
import * as THREE from 'three';

/** 紙張彎度只改幾何，不更換整張靜圖；0／1進度完全展平。 */
export function createCodexLeaf(width: number, height: number) {
  const geometry = new THREE.PlaneGeometry(width, height, 20, 2);
  geometry.translate(width / 2, 0, 0);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
  let previous = -1;
  return {
    geometry,
    bend(progress: number): void {
      const p = THREE.MathUtils.clamp(progress, 0, 1);
      const curl = Math.sin(p * Math.PI) * .16;
      if (Math.abs(curl - previous) < .0001) return;
      previous = curl;
      for (let i = 0; i < positions.count; i++) {
        const u = positions.getX(i) / width;
        positions.setZ(i, Math.sin(u * Math.PI) * curl);
        const slope = Math.cos(u * Math.PI) * curl * Math.PI / width;
        const length = Math.sqrt(1 + slope * slope);
        normals.setXYZ(i, -slope / length, 0, 1 / length);
      }
      positions.needsUpdate = true; normals.needsUpdate = true;
      geometry.computeBoundingSphere();
    },
  };
}
