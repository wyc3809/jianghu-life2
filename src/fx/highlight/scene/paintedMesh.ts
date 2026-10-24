/** 合併器物靜態零件；活動書頁／鉸鏈維持分組，寶箱另加細墨輪廓。 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** 把同材質零件合併為一次繪製；不跨活動鉸鏈，書冊可略過薄殼描邊。 */
export function batchPaintedParts(group: THREE.Group, inkOutline = true): void {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const originals = new Set<THREE.BufferGeometry>();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    const source = object.geometry;
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
    const list = parts.get(object.material) ?? [];
    list.push(geometry); parts.set(object.material, list); originals.add(source);
  });
  group.clear();
  const merged: THREE.BufferGeometry[] = [];
  for (const [material, geometries] of parts) {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) throw new Error('寶箱靜態零件格式不一致');
    group.add(new THREE.Mesh(geometry, material));
    merged.push(geometry);
    geometries.forEach(g => g.dispose());
  }
  originals.forEach(g => g.dispose());
  if (!inkOutline) return;
  const hull = mergeGeometries(merged, false);
  if (!hull) return;
  // 背面薄殼只出現於物件外緣；無全屏深度／法線取樣，也無逐像素飛白碎點。
  const ink = new THREE.ShaderMaterial({
    vertexShader: `void main(){vec3 p=position+normal*.006;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `void main(){gl_FragColor=vec4(.21,.17,.13,1.);\n#include <colorspace_fragment>\n}`,
    side: THREE.BackSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const outline = new THREE.Mesh(hull, ink);
  outline.name = 'painted-ink-outline';
  group.add(outline);
}
