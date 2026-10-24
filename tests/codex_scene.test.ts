import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCodexLeaf } from '../src/fx/highlight/scene/codexLeaf';
import { buildCodex } from '../src/fx/highlight/scene/codex';
import { codexTexture } from '../src/fx/highlight/scene/codexTextures';
import { CodexRenderBudget } from '../src/fx/highlight/scene/codexRenderBudget';
import { GRADES } from '../src/fx/highlight/grades';

describe('秘笈紙頁及繪製預算', () => {
  it('test_codex_leaf_bend_keeps_spine_and_uv', () => {
    const leaf = createCodexLeaf(1.4, 2.1);
    const originalUv = Array.from(leaf.geometry.getAttribute('uv').array);
    leaf.bend(.5);
    const positions = leaf.geometry.getAttribute('position');
    const zs = [];
    for (let i = 0; i < positions.count; i++) {
      if (Math.abs(positions.getX(i)) < .0001) expect(positions.getZ(i)).toBeCloseTo(0);
      zs.push(positions.getZ(i));
    }
    expect(Math.max(...zs)).toBeCloseTo(.16);
    expect(Array.from(leaf.geometry.getAttribute('uv').array)).toEqual(originalUv);
    leaf.geometry.dispose();
  });
  it('test_codex_leaf_normal_continuous_and_unit', () => {
    const leaf = createCodexLeaf(1.4, 2.1);
    leaf.bend(.5);
    const normal = leaf.geometry.getAttribute('normal');
    for (let i = 0; i < normal.count; i++) expect(new THREE.Vector3().fromBufferAttribute(normal, i).length()).toBeCloseTo(1);
    expect(normal.getX(0)).toBeLessThan(0);
    expect(normal.getX(20)).toBeGreaterThan(0);
    leaf.geometry.dispose();
  });
  it('test_codex_leaf_reopen_returns_flat_without_accumulation', () => {
    const leaf = createCodexLeaf(1.4, 2.1);
    for (let cycle = 0; cycle < 12; cycle++) {
      leaf.bend(.5); leaf.bend(1); leaf.bend(0);
      const positions = leaf.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) expect(positions.getZ(i)).toBeCloseTo(0);
    }
    leaf.geometry.dispose();
  });
  it('test_codex_batching_keeps_eight_movable_pages_and_hinge', () => {
    const codex = buildCodex();
    const cover = codex.root.getObjectByName('codex-cover-hinge')!;
    const pivot = cover.position.clone();
    codex.setOpen(.5);
    expect(cover.position.equals(pivot)).toBe(true);
    expect(cover.rotation.y).toBeCloseTo(-1.45);
    for (let i = 1; i <= 8; i++) expect(codex.root.getObjectByName(`codex-leaf-${i}`)).toBeDefined();
    codex.setOpen(0);
    expect(cover.rotation.y).toBeCloseTo(0);
    codex.root.userData.dispose();
  });
  it('test_codex_batching_mesh_budget_at_most_twenty', () => {
    for (const premium of [false, true]) {
      const codex = buildCodex(premium); let meshes = 0;
      codex.root.traverse(o => { if (o instanceof THREE.Mesh) meshes++; });
      expect(meshes).toBeLessThanOrEqual(20);
      codex.root.userData.dispose();
    }
  });
  it('test_codex_wish_grade_never_recolors_true_rarity', () => {
    const ordinary = buildCodex(false), premium = buildCodex(true);
    const mapped = (root: THREE.Group, texture: THREE.Texture) => {
      const matches: THREE.Mesh[] = [];
      root.traverse(o => { if (o instanceof THREE.Mesh && (o.material as THREE.MeshLambertMaterial).map === texture) matches.push(o); });
      return matches;
    };
    Object.values(GRADES).forEach(grade => ordinary.setGrade(grade));
    expect(mapped(ordinary.root, codexTexture('ordinary')).length).toBe(1);
    expect(mapped(ordinary.root, codexTexture('premium')).length).toBe(0);
    expect(mapped(premium.root, codexTexture('premium')).length).toBe(1);
    expect(codexTexture('ordinary').colorSpace).toBe(THREE.SRGBColorSpace);
    ordinary.root.userData.dispose(); premium.root.userData.dispose();
  });
});

describe('秘笈動態解像度', () => {
  it('test_codex_budget_stable_frames_keep_full_quality', () => {
    const budget = new CodexRenderBudget(2);
    for (let i = 0; i < 120; i++) expect(budget.sample(16.7)).toBe(2);
  });
  it('test_codex_budget_three_slow_frames_reduce_once', () => {
    const budget = new CodexRenderBudget(2);
    expect(budget.sample(60)).toBe(2);
    expect(budget.sample(60)).toBe(2);
    expect(budget.sample(60)).toBe(1.75);
    expect(budget.sample(16.7)).toBe(1.75);
  });
  it('test_codex_budget_pause_is_not_a_slow_frame', () => {
    const budget = new CodexRenderBudget(2);
    budget.sample(60); budget.sample(60); budget.sample(3000);
    expect(budget.sample(60)).toBe(2);
  });
  it('test_codex_budget_severe_slow_frames_still_reduce', () => {
    const budget = new CodexRenderBudget(2);
    budget.sample(300); budget.sample(300);
    expect(budget.sample(300)).toBe(1.75);
  });
  it('test_codex_budget_floor_and_result_restore', () => {
    const budget = new CodexRenderBudget(2);
    for (let i = 0; i < 120; i++) budget.sample(60);
    expect(budget.sample(60)).toBe(.8);
    expect(budget.settle()).toBe(2);
  });
});
