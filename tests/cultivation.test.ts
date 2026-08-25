import { describe, expect, it } from 'vitest';
import {
  CULTIVATION_TIERS,
  applyOfflineCultivation,
  attemptCultivationBreakthrough,
  calculateCultivationRate,
  canAttemptBreakthrough,
  cultivationProgressPercent,
  currentCultivationTier,
  isCultivationCapped,
  isMaxCultivationTier,
  OFFLINE_CULTIVATION_CAP_MS,
  tickCultivation,
} from '../core/life/cultivation';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { lifeGameStateSchema, type LifeGameState } from '../interfaces/lifeEngine';
import { initRng } from '../core/random';

describe('cultivation: rate breakdown', () => {
  it('gives every fresh character a non-zero baseline rate', () => {
    initRng(1);
    const state = createNewLife(1);
    const rate = calculateCultivationRate(state);
    expect(rate.base).toBeGreaterThan(0);
    expect(rate.total).toBeGreaterThan(0);
    expect(rate.total).toBeCloseTo(
      rate.base + rate.fromMartial + rate.fromSkills + rate.fromSect + rate.fromGear,
      6,
    );
  });

  it('has no sect bonus when the character has not joined a sect', () => {
    initRng(2);
    const state = createNewLife(2);
    state.character.sectId = null;
    expect(calculateCultivationRate(state).fromSect).toBe(0);
  });

  it('raises the rate when martial rises', () => {
    initRng(3);
    const state = createNewLife(3);
    const before = calculateCultivationRate(state).total;
    state.character.martial += 100;
    const after = calculateCultivationRate(state).total;
    expect(after).toBeGreaterThan(before);
  });

  it('gives a sect bonus proportional to sect standing once joined', () => {
    initRng(4);
    const state = createNewLife(4);
    const sectId = Object.keys(state.sects)[0]!;
    state.character.sectId = sectId;
    state.character.sectStanding = 1;
    const low = calculateCultivationRate(state).fromSect;
    state.character.sectStanding = 3;
    const high = calculateCultivationRate(state).fromSect;
    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(low);
  });
});

describe('cultivation: tiers and cap', () => {
  it('starts every new life at tier 0, uncapped', () => {
    initRng(5);
    const state = createNewLife(5);
    expect(currentCultivationTier(state).level).toBe(0);
    expect(isCultivationCapped(state)).toBe(false);
    expect(isMaxCultivationTier(state)).toBe(false);
  });

  it('reports capped once xp reaches the current tier cap', () => {
    initRng(6);
    const state = createNewLife(6);
    const cap = currentCultivationTier(state).cap;
    state.character.cultivation.xp = cap;
    expect(isCultivationCapped(state)).toBe(true);
    expect(cultivationProgressPercent(state)).toBe(100);
  });

  it('the final tier has an infinite cap and is never "capped"', () => {
    initRng(7);
    const state = createNewLife(7);
    state.character.cultivation.tier = CULTIVATION_TIERS.length - 1;
    state.character.cultivation.xp = 1e9;
    expect(isMaxCultivationTier(state)).toBe(true);
    expect(isCultivationCapped(state)).toBe(false);
    expect(cultivationProgressPercent(state)).toBe(100);
  });
});

describe('cultivation: real-time ticking', () => {
  it('adds rate * deltaSeconds and stops exactly at the tier cap', () => {
    initRng(8);
    const state = createNewLife(8);
    const rate = calculateCultivationRate(state).total;
    const gained = tickCultivation(state, 10);
    expect(gained).toBeCloseTo(rate * 10, 6);
    expect(state.character.cultivation.xp).toBeCloseTo(rate * 10, 6);

    const cap = currentCultivationTier(state).cap;
    state.character.cultivation.xp = cap - 1;
    tickCultivation(state, 1000);
    expect(state.character.cultivation.xp).toBe(cap);
  });

  it('does nothing for a dead or non-playing character', () => {
    initRng(9);
    const state = createNewLife(9);
    state.character.alive = false;
    const gained = tickCultivation(state, 100);
    expect(gained).toBe(0);
    expect(state.character.cultivation.xp).toBe(0);
  });

  it('does nothing for zero or negative delta', () => {
    initRng(10);
    const state = createNewLife(10);
    expect(tickCultivation(state, 0)).toBe(0);
    expect(tickCultivation(state, -5)).toBe(0);
  });
});

describe('cultivation: offline gain (deterministic, capped)', () => {
  it('is deterministic — same state + same elapsedMs always gives the same result', () => {
    initRng(11);
    const stateA = createNewLife(11);
    initRng(11);
    const stateB = createNewLife(11);
    const resultA = applyOfflineCultivation(stateA, 3_600_000);
    const resultB = applyOfflineCultivation(stateB, 3_600_000);
    expect(resultA.gainedXp).toBeCloseTo(resultB.gainedXp, 9);
    expect(stateA.character.cultivation.xp).toBeCloseTo(stateB.character.cultivation.xp, 9);
  });

  it('matches rate * elapsedSeconds when well under the tier cap', () => {
    initRng(12);
    const state = createNewLife(12);
    const rate = calculateCultivationRate(state).total;
    const result = applyOfflineCultivation(state, 60_000);
    expect(result.timeCapped).toBe(false);
    expect(result.tierCapped).toBe(false);
    expect(result.gainedXp).toBeCloseTo(rate * 60, 6);
  });

  it('clamps elapsed time to the 8-hour offline cap', () => {
    initRng(13);
    const stateShort = createNewLife(13);
    initRng(13);
    const stateLong = createNewLife(13);
    const atCap = applyOfflineCultivation(stateShort, OFFLINE_CULTIVATION_CAP_MS);
    const wayOver = applyOfflineCultivation(stateLong, OFFLINE_CULTIVATION_CAP_MS * 10);
    expect(wayOver.timeCapped).toBe(true);
    expect(atCap.timeCapped).toBe(false);
    expect(wayOver.gainedXp).toBeCloseTo(atCap.gainedXp, 6);
  });

  it('never grants xp past the current tier cap', () => {
    initRng(14);
    const state = createNewLife(14);
    const cap = currentCultivationTier(state).cap;
    const result = applyOfflineCultivation(state, OFFLINE_CULTIVATION_CAP_MS);
    expect(state.character.cultivation.xp).toBeLessThanOrEqual(cap);
    if (state.character.cultivation.xp >= cap) {
      expect(result.tierCapped).toBe(true);
    }
  });

  it('grants nothing while dead', () => {
    initRng(15);
    const state = createNewLife(15);
    state.character.alive = false;
    const result = applyOfflineCultivation(state, 3_600_000);
    expect(result.gainedXp).toBe(0);
    expect(result.countedSeconds).toBe(0);
  });

  it('clamps negative elapsed time to zero gain', () => {
    initRng(16);
    const state = createNewLife(16);
    const result = applyOfflineCultivation(state, -5000);
    expect(result.gainedXp).toBe(0);
  });
});

describe('cultivation: breakthrough', () => {
  function cappedState(seed: number): LifeGameState {
    initRng(seed);
    const state = createNewLife(seed);
    state.character.cultivation.xp = currentCultivationTier(state).cap;
    return state;
  }

  it('refuses to attempt when not capped', () => {
    initRng(20);
    const state = createNewLife(20);
    expect(canAttemptBreakthrough(state)).toBe(false);
    const result = attemptCultivationBreakthrough(state);
    expect(result.success).toBe(false);
    expect(result.lines[0]).toContain('未滿');
  });

  it('finds both a success and a failure branch across seeds, each with the right effects', () => {
    let sawSuccess = false;
    let sawFailure = false;

    for (let seed = 1; seed <= 300 && !(sawSuccess && sawFailure); seed += 1) {
      const state = cappedState(seed);
      const before = {
        martial: state.character.martial,
        health: state.character.health,
        qi: state.character.qi,
        tier: state.character.cultivation.tier,
      };
      const result = attemptCultivationBreakthrough(state);

      if (result.success && !sawSuccess) {
        sawSuccess = true;
        expect(state.character.cultivation.tier).toBe(before.tier + 1);
        expect(state.character.cultivation.xp).toBe(0);
        expect(state.character.martial).toBeGreaterThan(before.martial);
        expect(result.lines.join('')).toContain('打通任督');
      }

      if (!result.success && !sawFailure) {
        sawFailure = true;
        expect(state.character.cultivation.tier).toBe(before.tier);
        expect(state.character.cultivation.xp).toBeLessThan(currentCultivationTier(state).cap);
        expect(state.character.health).toBeLessThan(before.health);
        expect(state.character.qi).toBeLessThanOrEqual(before.qi);
        expect(result.lines.join('')).toContain('走火入魔');
      }
    }

    expect(sawSuccess).toBe(true);
    expect(sawFailure).toBe(true);
  });

  it('never lets health drop below 1 or qi below 0 on failure', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const state = cappedState(seed);
      state.character.health = 2;
      state.character.qi = 1;
      const result = attemptCultivationBreakthrough(state);
      if (!result.success) {
        expect(state.character.health).toBeGreaterThanOrEqual(1);
        expect(state.character.qi).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('cannot breakthrough past the final tier', () => {
    initRng(21);
    const state = createNewLife(21);
    state.character.cultivation.tier = CULTIVATION_TIERS.length - 1;
    state.character.cultivation.xp = 1e9;
    expect(canAttemptBreakthrough(state)).toBe(false);
  });
});

describe('cultivation: old-save migration', () => {
  it('migrateLifeState backfills cultivation on a save that predates the feature', () => {
    initRng(30);
    const state = createNewLife(30);
    // Simulate an old save captured before `cultivation` existed on LifeCharacter.
    const legacy = JSON.parse(JSON.stringify(state)) as LifeGameState;
    delete (legacy.character as { cultivation?: unknown }).cultivation;

    const migrated = migrateLifeState(legacy);
    expect(migrated.character.cultivation).toEqual({ xp: 0, tier: 0 });
  });

  it('repairs a corrupted (non-numeric) cultivation field rather than crashing', () => {
    initRng(31);
    const state = createNewLife(31);
    const legacy = JSON.parse(JSON.stringify(state)) as LifeGameState;
    (legacy.character as unknown as { cultivation: unknown }).cultivation = { xp: 'nope', tier: null };

    const migrated = migrateLifeState(legacy);
    expect(migrated.character.cultivation.xp).toBe(0);
    expect(migrated.character.cultivation.tier).toBe(0);
  });

  it('round-trips an old save through the zod schema (as saveIndexedDb.normalize does)', () => {
    initRng(32);
    const state = createNewLife(32);
    const legacy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
    delete (legacy.character as Record<string, unknown>).cultivation;

    const parsed = lifeGameStateSchema.parse(legacy) as LifeGameState;
    expect(parsed.character.cultivation).toEqual({ xp: 0, tier: 0 });
    const migrated = migrateLifeState(parsed);
    expect(migrated.character.cultivation).toEqual({ xp: 0, tier: 0 });
  });

  it('preserves an existing in-progress cultivation state across migration', () => {
    initRng(33);
    const state = createNewLife(33);
    state.character.cultivation = { xp: 1234, tier: 2 };
    const roundTripped = JSON.parse(JSON.stringify(state)) as LifeGameState;
    const migrated = migrateLifeState(roundTripped);
    expect(migrated.character.cultivation).toEqual({ xp: 1234, tier: 2 });
  });
});
