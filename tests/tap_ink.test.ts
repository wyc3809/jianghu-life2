import { describe, expect, it } from 'vitest';
import { appendTapInk, createTapInk, isInkTap, TAP_INK, tapInkPose } from '../src/fx/ambient/tapInk';

describe('點按墨跡', () => {
  it('test_tap_ink_同seed重現_不使用遊戲隨機狀態', () => {
    expect(createTapInk(90, 180, 1000, 5)).toEqual(createTapInk(90, 180, 1000, 5));
    expect(createTapInk(90, 180, 1000, 5).particles).not.toEqual(createTapInk(90, 180, 1000, 6).particles);
  });
  it('test_tap_ink_拖動長按及異常時間_不視為點擊', () => {
    expect(isInkTap(3, 4, 100)).toBe(true);
    expect(isInkTap(8, 8, 100)).toBe(false);
    expect(isInkTap(0, 0, TAP_INK.maxHoldMs + 1)).toBe(false);
    expect(isInkTap(0, 0, -1)).toBe(false);
  });
  it('test_tap_ink_大量連點_只留最新三組並清除過期墨跡', () => {
    let list = [createTapInk(0, 0, 0, 1)];
    for (let i = 1; i <= 20; i++) list = appendTapInk(list, createTapInk(i, 0, i * 90, i));
    expect(list.map(b => b.x)).toEqual([18, 19, 20]);
    expect(appendTapInk(list, createTapInk(21, 0, 5000, 21))).toHaveLength(1);
  });
  it('test_tap_ink_首幀落墨且暈染稍後_全部在520ms結束', () => {
    const burst = createTapInk(0, 0, 0, 2);
    expect(tapInkPose(burst.particles[0], 0)?.alpha).toBeGreaterThan(0);
    expect(tapInkPose(burst.particles[1], 0)).toBeNull();
    expect(tapInkPose(burst.particles[1], 80)?.size).toBeGreaterThan(burst.particles[1].size);
    expect(burst.particles.every(p => tapInkPose(p, TAP_INK.durationMs) === null)).toBe(true);
  });
  it('test_tap_ink_所有採樣墨跡_不超出清理範圍或遮黑文字', () => {
    for (let seed = 0; seed < 30; seed++) for (const particle of createTapInk(0, 0, 0, seed).particles) {
      for (let ms = 0; ms < TAP_INK.durationMs; ms += 8) {
        const pose = tapInkPose(particle, ms);
        if (!pose) continue;
        expect(Math.hypot(pose.x, pose.y) + pose.size / 2).toBeLessThan(TAP_INK.radius);
        expect(pose.alpha).toBeGreaterThanOrEqual(0);
        expect(pose.alpha).toBeLessThanOrEqual(.28);
      }
    }
  });
});
