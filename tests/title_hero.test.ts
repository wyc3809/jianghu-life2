import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSwordsman, defaultPose } from '../src/fx/highlight/title/swordsman';

describe('title hero swordsman model (主頁斗笠劍客)', () => {
  it('test_swordsman_builds_with_expected_height', () => {
    const hero = buildSwordsman();
    // 靴底到斗笠頂約 2.3 單位；鏡頭取景靠呢個高度
    expect(hero.height).toBeGreaterThan(2.1);
    expect(hero.height).toBeLessThan(2.6);
  });

  it('test_swordsman_update_with_strong_wind_keeps_geometry_finite', () => {
    const hero = buildSwordsman();
    const pose = { ...defaultPose(), wind: 1, crouch: 1, breath: 1 };
    for (let t = 0; t < 3; t += 0.25) hero.update(t, pose);
    const box = new THREE.Box3().setFromObject(hero.root);
    for (const v of [box.min, box.max]) {
      expect(Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)).toBe(true);
    }
    // 披風受風都唔會飛出老遠（最多約兩個身位闊）
    expect(box.max.x - box.min.x).toBeLessThan(3);
  });

  it('test_draw_sword_moves_tip_away_from_scabbard_and_sheath_restores', () => {
    const hero = buildSwordsman();
    hero.update(0, defaultPose());
    const sheathed = hero.swordTip(new THREE.Vector3()).clone();
    hero.drawSword();
    // 揮劍姿勢：右臂向外平舉
    hero.update(0, { ...defaultPose(), rArmX: -0.75, rArmZ: -1.45 });
    const drawn = hero.swordTip(new THREE.Vector3()).clone();
    // 右手喺世界 −x：劍尖應該喺身體左外側（畫面左）
    expect(drawn.x).toBeLessThan(-1);
    expect(drawn.distanceTo(sheathed)).toBeGreaterThan(1);
    hero.sheathSword();
    hero.update(0, defaultPose());
    expect(hero.swordTip(new THREE.Vector3()).distanceTo(sheathed)).toBeLessThan(1e-6);
  });
});
