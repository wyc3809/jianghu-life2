import { describe, expect, it } from 'vitest';
import { VOLUME_STROKES, strokeForVol } from '../src/fx/highlight/duel/strokes';
import { DUEL_TUNING } from '../src/fx/highlight/duel/tuning';

describe('高光級打鬥演出：七卷筆觸表', () => {
  it('test_every_volume_has_a_distinct_stroke_shape', () => {
    const shapes = [1, 2, 3, 4, 5, 6, 7].map((v) => VOLUME_STROKES[v]!.shape);
    expect(new Set(shapes).size).toBe(7);
  });

  it('test_volume_seven_has_gold_edge', () => {
    expect(VOLUME_STROKES[7]!.edgeAmt).toBeGreaterThan(0);
  });

  it('test_basic_strike_falls_back_to_volume_one', () => {
    expect(strokeForVol(undefined)).toBe(VOLUME_STROKES[1]);
  });

  it('test_tuning_matches_spec_limits', () => {
    expect(DUEL_TUNING.openSec).toBe(1.2);
    expect(DUEL_TUNING.hitStopSec).toBe(0.12);
    expect(DUEL_TUNING.slowMoSec).toBe(0.5);
    expect(DUEL_TUNING.particleCap).toBe(300);
    expect(DUEL_TUNING.playerBeatSec).toBeGreaterThanOrEqual(0.6);
    expect(DUEL_TUNING.playerBeatSec).toBeLessThanOrEqual(0.9);
    expect(DUEL_TUNING.foeBeatSec).toBeGreaterThanOrEqual(0.6);
    expect(DUEL_TUNING.foeBeatSec).toBeLessThanOrEqual(0.9);
  });
});
