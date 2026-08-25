import { describe, expect, it } from 'vitest';
import { isLifespanUrgent, lifespanRemainingPercent } from '../core/life/lifespanPressure';

describe('lifespan pressure line', () => {
  it('starts near full at birth and monotonically decreases with age', () => {
    let prev = lifespanRemainingPercent(0);
    expect(prev).toBe(100);
    for (let age = 1; age <= 100; age += 1) {
      const pct = lifespanRemainingPercent(age);
      expect(pct).toBeLessThanOrEqual(prev);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
      prev = pct;
    }
  });

  it('drains fully to 0 by the endgame age and stays there', () => {
    expect(lifespanRemainingPercent(85)).toBe(0);
    expect(lifespanRemainingPercent(120)).toBe(0);
  });

  it('drains noticeably faster past the frailty/mortality breakpoints', () => {
    const earlySpan = lifespanRemainingPercent(0) - lifespanRemainingPercent(65);
    const midSpan = lifespanRemainingPercent(65) - lifespanRemainingPercent(72);
    const lateSpan = lifespanRemainingPercent(72) - lifespanRemainingPercent(79);
    expect(midSpan / 7).toBeGreaterThan(earlySpan / 65);
    expect(lateSpan / 7).toBeGreaterThan(midSpan / 7);
  });

  it('flags the urgent (warm-color) zone starting at the frailty age', () => {
    expect(isLifespanUrgent(64)).toBe(false);
    expect(isLifespanUrgent(65)).toBe(true);
    expect(isLifespanUrgent(80)).toBe(true);
  });
});
