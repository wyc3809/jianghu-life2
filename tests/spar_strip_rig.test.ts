import { describe, expect, it } from 'vitest';
import { StripRig, stepSpring, stripOffset } from '../src/spar/stripRig';

describe('spar strip rig (條帶變形骨架)', () => {
  it('test_feet_never_move', () => {
    for (const time of [0, 0.7, 3.1]) {
      expect(stripOffset(1, 50, 40, 30, time)).toBeCloseTo(0, 9);
    }
  });

  it('test_lean_moves_head_more_than_waist', () => {
    const head = Math.abs(stripOffset(0, 40, 0, 0, 0));
    const waist = Math.abs(stripOffset(0.5, 40, 0, 0, 0));
    expect(head).toBeGreaterThan(waist);
    expect(waist).toBeGreaterThan(0);
  });

  it('test_cloth_only_moves_hem_region', () => {
    expect(stripOffset(0.3, 0, 40, 0, 0)).toBe(0);
    expect(Math.abs(stripOffset(0.75, 0, 40, 0, 0))).toBeGreaterThan(20);
  });

  it('test_spring_settles_to_target', () => {
    const s = { x: 0, v: 0 };
    for (let i = 0; i < 600; i++) stepSpring(s, 10, { k: 90, c: 11 }, 1 / 60);
    expect(s.x).toBeCloseTo(10, 2);
  });

  it('test_walking_right_drags_cloth_left', () => {
    const rig = new StripRig();
    let x = 0;
    for (let i = 0; i < 30; i++) {
      x += 2;
      rig.update(1 / 60, x, 0.1);
    }
    expect(rig.cloth.x).toBeLessThan(-5);
  });

  it('test_kick_then_recover', () => {
    const rig = new StripRig();
    rig.kick(400);
    let peak = 0;
    for (let i = 0; i < 20; i++) {
      rig.update(1 / 60, 0, 0.1);
      peak = Math.max(peak, rig.lean.x);
    }
    for (let i = 0; i < 240; i++) rig.update(1 / 60, 0, 0.1);
    expect(peak).toBeGreaterThan(10);
    expect(Math.abs(rig.lean.x)).toBeLessThan(1);
  });
});

describe('spar strip rig limits (唔好錯位成鋸齒)', () => {
  it('test_offsets_clamped_after_huge_kick', async () => {
    const { RIG_LIMIT } = await import('../src/spar/stripRig');
    const rig = new StripRig();
    rig.kick(5000, 5000);
    for (let i = 0; i < 6; i++) rig.update(1 / 60, 0, 0.1);
    const max = RIG_LIMIT.lean + RIG_LIMIT.cloth * 1.12 + RIG_LIMIT.hair;
    for (let t = 0; t <= 1; t += 0.05) expect(Math.abs(rig.offsetAt(t))).toBeLessThanOrEqual(max + 1e-6);
  });

  it('test_adjacent_strips_stay_close', () => {
    // 40 條帶時，相鄰兩條位移差唔超過 6 設計單位（約 0.5px），唔會見到梯級
    let worst = 0;
    for (let i = 1; i < 40; i++) {
      const a = stripOffset((i - 0.5) / 40, 38, 30, 26, 1.3);
      const b = stripOffset((i + 0.5) / 40, 38, 30, 26, 1.3);
      worst = Math.max(worst, Math.abs(a - b));
    }
    expect(worst).toBeLessThan(6);
  });
});
