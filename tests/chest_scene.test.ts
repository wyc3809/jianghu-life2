import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSubject } from '../src/fx/highlight/scene/models';
import { GRADES } from '../src/fx/highlight/grades';
import { batchPaintedParts } from '../src/fx/highlight/scene/paintedMesh';

const meshes = (root: THREE.Object3D): THREE.Mesh[] => {
  const found: THREE.Mesh[] = [];
  root.traverse(object => { if (object instanceof THREE.Mesh) found.push(object); });
  return found;
};
const dispose = (root: THREE.Object3D) => {
  root.userData.dispose?.();
  for (const mesh of meshes(root)) {
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(material => material.dispose());
  }
};

describe('寶箱實體材質及批次繪製', () => {
  it('test_chest_合併巢狀零件後世界輪廓不變且只需一個表面批次', () => {
    const group = new THREE.Group(); group.position.set(2, 1, -3);
    const nested = new THREE.Group(); nested.rotation.y = .6; group.add(nested);
    const material = new THREE.MeshLambertMaterial();
    const geometry = new THREE.BoxGeometry(1, .5, .3);
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.x = i * .7; nested.add(mesh);
    }
    const before = new THREE.Box3().setFromObject(group);
    batchPaintedParts(group);
    const surfaces = meshes(group).filter(mesh => mesh.name !== 'painted-ink-outline');
    const after = new THREE.Box3().setFromObject(group);
    expect(surfaces).toHaveLength(1);
    expect(before.min.distanceTo(after.min)).toBeLessThan(1e-5);
    expect(before.max.distanceTo(after.max)).toBeLessThan(1e-5);
    dispose(group);
  });
  it('test_chest_箱蓋繞鉸鏈真實開啟且箱身不跟住改位', () => {
    const model = buildSubject('chest');
    const body = model.root.children[0]!;
    const lid = model.root.children[1]!;
    const bodyBefore = new THREE.Box3().setFromObject(body);
    const lidBefore = new THREE.Box3().setFromObject(lid);
    const pivot = lid.position.clone();
    model.setOpen(1);
    const lidAfter = new THREE.Box3().setFromObject(lid);
    expect(lid.position.equals(pivot)).toBe(true);
    expect(Math.abs(lid.rotation.x)).toBeGreaterThan(1);
    expect(lidAfter.min.distanceTo(lidBefore.min)).toBeGreaterThan(.1);
    expect(new THREE.Box3().setFromObject(body).equals(bodyBefore)).toBe(true);
    model.setOpen(0);
    expect(new THREE.Box3().setFromObject(lid).min.distanceTo(lidBefore.min)).toBeLessThan(1e-5);
    dispose(model.root);
  });
  it('test_chest_六品階沿用真實主色而木紋材質不被替換', () => {
    const model = buildSubject('chest');
    const materials = meshes(model.root).map(mesh => mesh.material).filter(material => !Array.isArray(material));
    const metal = materials.find(material => material instanceof THREE.MeshPhongMaterial && material.map);
    expect(metal).toBeInstanceOf(THREE.MeshPhongMaterial);
    const texture = (metal as THREE.MeshPhongMaterial).map;
    for (const grade of Object.values(GRADES)) {
      model.setGrade(grade);
      expect((metal as THREE.MeshPhongMaterial).color.equals(new THREE.Color(grade.main))).toBe(true);
      expect((metal as THREE.MeshPhongMaterial).map).toBe(texture);
    }
    dispose(model.root);
  });
  it('test_chest_低繪製數仍保留所有表面法線及UV', () => {
    const model = buildSubject('chest');
    const parts = meshes(model.root);
    expect(parts.length).toBeLessThanOrEqual(20);
    expect(parts.some(mesh => mesh.material instanceof THREE.MeshLambertMaterial && mesh.material.map)).toBe(true);
    expect(parts.every(mesh => mesh.geometry.getAttribute('position') && mesh.geometry.getAttribute('normal') && mesh.geometry.getAttribute('uv'))).toBe(true);
    dispose(model.root);
  });
});
