import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { emptyAncestry } from '../core/life/ancestry';
import { settleLifeIntoAccount } from '../core/life/accountSettle';
import { tickMonthlyEconomy } from '../core/life/economy';
import { buildLegacyScriptEvent, scheduleLegacyScripts } from '../core/life/lifeVariance';
import { achievementProgress, listAchievementStatus, syncAchievements } from '../core/life/achievements';
import { PRACTICE_ACTIONS, performPracticeAction } from '../core/life/actions';
import { applyChoice, listEligibleEvents, lookupEvent, resolvePendingEvent } from '../core/life/eventEngine';
import { buildLifeSummary } from '../core/life/summary';
import { useAncestryStore } from '../src/store/ancestryStore';
import { useLifeStore } from '../src/store/lifeStore';
import { discardPendingPersist } from '../src/store/persistSchedule';

vi.mock('../src/cloud/sync', () => ({ queueCloudSync: vi.fn(), flushCloudSync: vi.fn() }));
afterEach(() => { discardPendingPersist(); vi.restoreAllMocks(); });

describe('paused ancestral features in production paths', () => {
  it('test_paused_old_save_keeps_current_stats_and_history_but_drops_queued_legacy_event', () => {
    const old = createNewLife({ seed: 42, skipCoach: true });
    old.character.flags.legacy_script_rival = true;
    old.character.flags.legacy_rival = '舊敵';
    old.character.flags.legacy_generation = 3;
    old.character.attributes.genGu = 91;
    old.lifeLog.push('祖蔭：舊時已生效。');
    const baseline = migrateLifeState(structuredClone(old));
    const queued = { ...structuredClone(old), pending: { eventId: 'legacy_script_rival', year: old.year } };
    const restored = migrateLifeState(queued);
    expect(restored).toEqual(baseline);
    expect(restored.character.attributes.genGu).toBe(91);
    expect(restored.lifeLog).toContain('祖蔭：舊時已生效。');
    expect(restored.character.flags.legacy_generation).toBe(3);
    const flags = structuredClone(restored.character.flags);
    scheduleLegacyScripts(restored);
    expect(restored.character.flags).toEqual(flags);
    expect(buildLegacyScriptEvent(restored)).toBeNull();
  });

  it('test_paused_store_commands_do_not_spend_award_or_reselect_archived_assets', () => {
    const meta = emptyAncestry();
    meta.points = 100;
    meta.talents.genGu = 2;
    meta.familyArts = ['art_river_fist'];
    meta.unlockedArts = ['art_river_fist'];
    meta.artsSeen = ['art_river_fist'];
    meta.lives = 5;
    const life = createNewLife({ seed: 42 });
    life.phase = 'summary';
    useLifeStore.setState({ state: life });
    useAncestryStore.setState({ meta: structuredClone(meta), award: null, panelOpen: false });
    const store = useAncestryStore.getState();
    store.buyTalent('genGu'); store.unlockArt('art_river_fist'); store.buySecondSlot();
    store.toggleFamilyArt('art_river_fist'); store.awardCurrentLife(); store.setPanelOpen(true);
    expect(useAncestryStore.getState().meta).toEqual(meta);
    expect(useAncestryStore.getState().award).toBeNull();
    expect(useAncestryStore.getState().panelOpen).toBe(false);
    expect(useLifeStore.getState().state).toBe(life);
  });

  it('test_paused_settlement_keeps_normal_jade_without_family_milestone_or_rebirth_reward', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const state = createNewLife({ seed: 42 });
    state.character.childrenCount = 1;
    state.character.flags.legacy_generation = 3;
    state.character.flags.achievements = 'ach_legacy';
    state.character.flags.jade_pending = 17;
    const meta = emptyAncestry();
    meta.points = 37; meta.lives = 5; meta.milestones = ['fm_old'];
    const result = settleLifeIntoAccount(meta, state);
    expect(result.milestones).toEqual([]);
    expect(meta.points).toBe(37); expect(meta.lives).toBe(5);
    expect(meta.milestones).toEqual(['fm_old']);
    expect(meta.jadeAchv ?? []).not.toContain('ach_legacy');
    expect(result.jade).toBe(17);
    expect(meta.jade?.free).toBe(17);
    syncAchievements(state);
    expect(listAchievementStatus(state).some(r => r.id === 'ach_legacy')).toBe(false);
    expect(achievementProgress(state).unlocked).toBe(listAchievementStatus(state).filter(r => r.unlocked).length);
  });

  it('test_paused_family_flag_no_longer_grants_monthly_income', () => {
    const plain = createNewLife({ seed: 42 });
    const old = structuredClone(plain);
    old.character.flags.family_legacy = true;
    old.character.flags.born_with_family_legacy = true;
    tickMonthlyEconomy(plain); tickMonthlyEconomy(old);
    expect(old.character.money).toBe(plain.character.money);
    expect(old.character.flags.family_legacy).toBe(true);
  });

  it('test_paused_succession_action_and_retire_cannot_spend_turn_or_end_life', () => {
    const life = createNewLife({ seed: 42 });
    life.character.family.childrenNames = ['甲童'];
    life.character.flags.heir_name = '甲童';
    const original = structuredClone(life);
    expect(PRACTICE_ACTIONS.some(a => a.id === 'designate_heir')).toBe(false);
    expect(performPracticeAction(life, 'designate_heir')).toEqual(['此項已暫停。']);
    expect(life).toEqual(original);
    useLifeStore.setState({ state: life });
    useLifeStore.getState().retire();
    expect(useLifeStore.getState().state).toEqual(original);
    expect(buildLifeSummary(life)).not.toMatch(/可傳後世|家族銀庫|裝備庫|繼承人|族譜/);
  });
  it('test_restart_does_not_carry_estate_or_show_succession', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const old = createNewLife({ seed: 7 });
    old.phase = 'summary'; old.character.money = 999999;
    old.character.flags.family_legacy = true;
    useLifeStore.setState({ state: old, succession: null });
    const meta = structuredClone(useAncestryStore.getState().meta);
    expect(useLifeStore.getState().reincarnate()).toBe(false);
    expect(useLifeStore.getState().startAfterEnding()).toBe(true);
    const next = useLifeStore.getState();
    expect(next.state?.phase).toBe('playing');
    expect(next.state?.character.money).toBeLessThan(999999);
    expect(next.state?.character.flags.born_with_family_legacy).toBeUndefined();
    expect(next.state?.character.flags.legacy_generation).toBe(1);
    expect(next.succession).toBeNull();
    expect(useAncestryStore.getState().meta).toEqual(meta);
  });

  it('test_paused_inheritance_events_cannot_be_drawn_or_resolved_from_old_queue', () => {
    for (const id of ['inheritance', 'event_064']) {
      const state = createNewLife({ seed: 42 });
      state.character.money = 10000;
      const event = lookupEvent(id)!;
      expect(event).toBeDefined();
      expect(listEligibleEvents([event], state)).toEqual([]);
      state.pending = { eventId: id, year: state.year };
      expect(resolvePendingEvent(state)).toBeNull();
      const previous = structuredClone(state);
      expect(applyChoice(state, event, event.choices[0]!.id).state).toEqual(previous);
      expect(migrateLifeState(state).pending).toBeNull();
    }
  });

});
