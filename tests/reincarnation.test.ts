import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wuxiaAttributeKeys } from '../interfaces/lifeEngine';
import { createNewLife } from '../core/life/gameState';
import { economyDay } from '../core/life/accountEconomy';
import { REINCARNATION_MIN_TIER, recordLifeDay, reincarnationStatus } from '../core/life/reincarnation';
import { clearLifeIndexedDb, loadLifeFromIndexedDb, saveLifeToIndexedDb } from '../core/life/saveIndexedDb';
import { useLifeStore } from '../src/store/lifeStore';
import { discardPendingPersist } from '../src/store/persistSchedule';

vi.mock('../src/cloud/sync', () => ({ queueCloudSync: vi.fn(), flushCloudSync: vi.fn() }));

afterEach(async () => {
  vi.restoreAllMocks();
  discardPendingPersist();
  useLifeStore.setState({ state: null, combatReplay: null });
  await clearLifeIndexedDb();
});

describe('轉世', () => {
  it('test_reincarnation_requires_both_rank_and_seven_days_on_store_action', () => {
    const life = createNewLife(7);
    life.character.cultivation.tier = REINCARNATION_MIN_TIER - 1;
    life.character.flags.reincarnation_days = 7;
    useLifeStore.setState({ state: life });
    expect(useLifeStore.getState().reincarnate()).toBe(false);

    life.character.cultivation.tier = REINCARNATION_MIN_TIER;
    life.character.flags.reincarnation_days = 6;
    useLifeStore.setState({ state: life });
    expect(useLifeStore.getState().reincarnate()).toBe(false);

    life.character.flags.reincarnation_days = 7;
    life.character.flags.spar_stage = 100;
    life.character.money = 12000;
    useLifeStore.setState({ state: life });
    expect(useLifeStore.getState().reincarnate()).toBe(true);
    expect(useLifeStore.getState().reincarnate()).toBe(false);

    const next = useLifeStore.getState().state!;
    expect(reincarnationStatus(next)).toMatchObject({ count: 1, days: 1, bonus: 3, tierMet: false });
    expect(next.character.flags.spar_stage).toBeUndefined();
    expect(next.character.money).toBeLessThan(12000);
  });

  it('test_reincarnation_days_count_once_per_real_day_with_gaps_and_clock_rollback', () => {
    const life = createNewLife(8);
    const before = Date.parse('2026-11-26T19:59:59Z');
    const boundary = before + 1000;
    expect(recordLifeDay(life, economyDay(before))).toBe(true);
    expect(recordLifeDay(life, economyDay(before))).toBe(false);
    expect(recordLifeDay(life, economyDay(boundary))).toBe(true);
    expect(recordLifeDay(life, economyDay(before))).toBe(false);
    expect(recordLifeDay(life, '2026-12-12')).toBe(true);
    expect(reincarnationStatus(life).days).toBe(3);
  });

  it('test_reincarnation_old_save_roundtrip_and_resume_counts_only_current_day', async () => {
    const life = createNewLife(9);
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-02T12:00:00Z'));
    await saveLifeToIndexedDb(life);
    vi.mocked(Date.now).mockReturnValue(Date.parse('2026-11-20T12:00:00Z'));

    expect(reincarnationStatus((await loadLifeFromIndexedDb())!.state).days).toBe(0);
    expect(await useLifeStore.getState().continueLife()).toBe(true);
    expect(reincarnationStatus(useLifeStore.getState().state!).days).toBe(1);
    const loaded = useLifeStore.getState().state!;
    await saveLifeToIndexedDb(loaded);
    expect(await useLifeStore.getState().continueLife()).toBe(true);
    expect(reincarnationStatus(useLifeStore.getState().state!).days).toBe(1);
  });

  it('test_reincarnation_bonus_applies_once_on_creation_and_roundtrip_preserves_current_stats', async () => {
    const base = createNewLife(10);
    const second = createNewLife({ seed: 10, reincarnationCount: 1 });
    const capped = createNewLife({ seed: 10, reincarnationCount: 8 });
    for (const key of wuxiaAttributeKeys) {
      expect(second.character.attributes[key] - base.character.attributes[key]).toBe(3);
      expect(capped.character.attributes[key] - base.character.attributes[key]).toBe(15);
    }
    expect(second.character.maxHealth).toBeGreaterThan(base.character.maxHealth);
    expect(second.character.maxQi).toBeGreaterThan(base.character.maxQi);
    recordLifeDay(capped, '2026-11-26');
    await saveLifeToIndexedDb(capped);
    const restored = (await loadLifeFromIndexedDb())!.state;
    expect(restored.character.attributes).toEqual(capped.character.attributes);
    expect(reincarnationStatus(restored)).toMatchObject({ count: 8, bonus: 15, nextBonus: 15, days: 1 });
  });

  it('test_reincarnation_ineligible_ended_life_can_start_without_incrementing_bonus', () => {
    const life = createNewLife({ seed: 11, reincarnationCount: 2 });
    life.phase = 'summary';
    life.character.alive = false;
    expect(recordLifeDay(life, '2026-11-26')).toBe(false);
    useLifeStore.setState({ state: life });
    expect(useLifeStore.getState().reincarnate()).toBe(false);
    expect(useLifeStore.getState().startAfterEnding()).toBe(true);
    expect(reincarnationStatus(useLifeStore.getState().state!)).toMatchObject({ count: 2, days: 1, bonus: 6 });
    expect(useLifeStore.getState().startAfterEnding()).toBe(false);
  });
});
