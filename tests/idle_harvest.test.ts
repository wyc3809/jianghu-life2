import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import {
  accrueIdleSilver,
  harvestIdleSilver,
  idleSilverCap,
  idleSilverPending,
  idleSilverPerHour,
} from '../core/life/idleHarvest';

describe('idle silver harvest (agreed-design §4)', () => {
  it('test_accrues_per_hour_and_caps_at_48_hours', () => {
    initRng(1);
    const s = createNewLife({ seed: 1, skipCoach: true });
    const rate = idleSilverPerHour(s);
    accrueIdleSilver(s, 3600);
    expect(idleSilverPending(s)).toBeCloseTo(rate, 6);
    accrueIdleSilver(s, 3600 * 1000);
    expect(idleSilverPending(s)).toBe(idleSilverCap(s));
    expect(idleSilverCap(s)).toBe(Math.floor(rate * 48));
  });

  it('test_harvest_moves_whole_silver_into_purse_keeps_fraction', () => {
    initRng(2);
    const s = createNewLife({ seed: 2, skipCoach: true });
    const before = s.character.money;
    s.character.flags.idle_silver = 12.75;
    expect(harvestIdleSilver(s)).toBe(12);
    expect(s.character.money).toBe(before + 12);
    expect(idleSilverPending(s)).toBeCloseTo(0.75, 6);
    expect(harvestIdleSilver(s)).toBe(0);
  });

  it('test_higher_spar_stage_earns_more', () => {
    initRng(3);
    const s = createNewLife({ seed: 3, skipCoach: true });
    const low = idleSilverPerHour(s);
    s.character.flags.spar_stage = 30;
    expect(idleSilverPerHour(s)).toBeGreaterThan(low);
  });
});
