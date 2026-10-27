import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSubject } from '../src/fx/highlight/scene/models';
import { GRADES } from '../src/fx/highlight/grades';

const surfaces=(root:THREE.Object3D)=>{
 const found:THREE.Mesh[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh)found.push(o);});return found;
};
const dispose=(root:THREE.Object3D)=>{
 root.userData.dispose?.();for(const m of surfaces(root)){m.geometry.dispose();const mats=Array.isArray(m.material)?m.material:[m.material];mats.forEach(mat=>mat.dispose());}
};

describe('武學令剛性與懸穗',()=>{
 it('test_token_轉面保留牌面結構_流蘇另有鉸點並收束',()=>{
  const model=buildSubject('token'),tassel=model.root.getObjectByName('token-tassel-pivot')!;
  const points=surfaces(model.root).map(m=>m.geometry.getAttribute('position').array.slice());
  model.setOpen(.25);expect(Math.abs(tassel.rotation.z)).toBeGreaterThan(.05);
  expect(model.root.scale.toArray()).toEqual([1,1,1]);
  model.setSway?.(.2);model.setOpen(1);expect(tassel.rotation.z).toBeCloseTo(.2);
  model.setSway?.(0);expect(tassel.rotation.z).toBeCloseTo(0);expect(tassel.rotation.x).toBeCloseTo(0);
  expect(surfaces(model.root).map(m=>m.geometry.getAttribute('position').array.slice())).toEqual(points);
  dispose(model.root);
 });
 it('test_token_高光層次_增加實體刻飾而不只換顏色',()=>{
  const model=buildSubject('token');const first=model.root.getObjectByName('token-engraving-0')!,second=model.root.getObjectByName('token-engraving-1')!;
  model.setGrade(GRADES[1]);expect(first.visible).toBe(false);expect(second.visible).toBe(false);
  model.setGrade(GRADES[3]);expect(first.visible).toBe(true);expect(second.visible).toBe(false);
  model.setGrade(GRADES[5]);expect(first.visible).toBe(true);expect(second.visible).toBe(true);
  dispose(model.root);
 });
 it('test_token_合併靜態零件_保留玉紋與法線且不合併活動懸穗',()=>{
  const model=buildSubject('token'),parts=surfaces(model.root);
  expect(parts.length).toBeLessThanOrEqual(20);
  expect(parts.some(m=>m.material instanceof THREE.MeshPhongMaterial&&m.material.map)).toBe(true);
  expect(parts.every(m=>m.geometry.getAttribute('normal')&&m.geometry.getAttribute('uv'))).toBe(true);
  expect(model.root.getObjectByName('token-tassel-pivot')!.children.length).toBeGreaterThan(0);
  dispose(model.root);
 });
});
