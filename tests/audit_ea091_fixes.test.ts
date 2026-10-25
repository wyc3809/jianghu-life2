/**
 * 2026-10-25 全面審計（production/balance/audit-ea091.md）修正回歸：
 * A1 事件開打只認 combat 標籤／選項 combat 欄；A2 測試玉石每日一次。
 */
import { describe, expect, it } from 'vitest';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { applyChoice, lookupEvent } from '../core/life/eventEngine';
import { buildArcVisitEvent } from '../core/life/arcs';
import { emptyAncestry } from '../core/life/ancestry';
import { grantTestPaidJade, testPaidJadeClaimedToday } from '../core/life/gacha';
import { TEST_PAID_JADE_GRANT } from '../data/redesign/testParams';
import { JIANGHU_EXTRA_EVENTS } from '../data/events/jianghuExtra100';
import { ROAD_ENCOUNTER_EVENTS } from '../data/events/roadEncounters';
import type { GameEvent, LifeGameState } from '../interfaces/lifeEngine';

function freshLife(): LifeGameState {
  initRng(1);
  return createNewLife({ seed: 1, skipCoach: true });
}

function choose(ev: GameEvent, choiceId: string): LifeGameState {
  const s = freshLife();
  s.pending = { eventId: ev.id } as LifeGameState['pending'];
  applyChoice(s, ev, choiceId);
  return s;
}

const extra = (id: string) => JIANGHU_EXTRA_EVENTS.find((e) => e.id === id)!;
const road = (id: string) => ROAD_ENCOUNTER_EVENTS.find((e) => e.id === id)!;

describe('審計 A1：事件開打判定', () => {
  it('test_arc_zhan_rival_visit_go_advances_beat_without_combat', () => {
    const s = freshLife();
    s.character.martial = 30;
    s.lifeArc = { id: 'arc_zhan_rival', title: '驚鴻論劍', beat: 0, maxBeats: 6, npcId: 'npc_zhan_jinghong', monthsLeft: 0 };
    const ev = buildArcVisitEvent(s)!;
    applyChoice(s, ev, 'go');
    expect(s.pendingCombat).toBeFalsy();
    expect(s.lifeArc?.beat).toBe(1);
    expect(s.lifeArc?.monthsLeft).toBeGreaterThan(0);
  });

  it('test_jx_events_only_marked_choices_start_combat', () => {
    const cases: [string, string, boolean][] = [
      ['jx_bandit_toll', 'a', false], ['jx_bandit_toll', 'b', true], ['jx_bandit_toll', 'c', false],
      ['jx_bridge_duel', 'a', true], ['jx_bridge_duel', 'b', false],
      ['jx_rival_letter', 'a', true], ['jx_rival_letter', 'b', false],
      ['jx_rival_spare', 'a', false], ['jx_rival_spare', 'b', true], ['jx_rival_spare', 'c', false],
    ];
    for (const [id, choice, fights] of cases) {
      expect(Boolean(choose(extra(id), choice).pendingCombat), `${id}/${choice}`).toBe(fights);
    }
  });

  it('test_peaceful_choices_in_combat_events_do_not_start_combat', () => {
    const paid = choose(road('road_bandit_pass'), 'pay');
    expect(paid.pendingCombat).toBeFalsy();
    expect(choose(road('road_bandit_pass'), 'fight').pendingCombat).toBeTruthy();
    expect(choose(road('road_rival_spar'), 'decline_politely').pendingCombat).toBeFalsy();
    const retire = lookupEvent('final_duel')!;
    expect(choose(retire, 'retire').pendingCombat).toBeFalsy();
  });

  it('test_combat_choice_still_writes_its_flags', () => {
    const s = freshLife();
    s.character.flags.legacy_script_rival = true;
    s.character.flags.born_with_rival_hint = '鐵掌幫';
    const ev: GameEvent = {
      id: 'legacy_script_rival', title: '舊怨叩門', tags: ['story', 'legacy', 'combat'],
      choices: [{ id: 'draw', text: '拔刀問清楚', outcomes: [{ effects: [{ type: 'flag', key: 'done_legacy_script_rival', value: true }] }] }],
    };
    applyChoice(s, ev, 'draw');
    expect(s.pendingCombat).toBeTruthy();
    expect(s.character.flags.done_legacy_script_rival).toBe(true);
  });
});

describe('審計 A2：測試付費玉石每日一次', () => {
  const noon = Date.UTC(2026, 9, 25, 4); // 香港 12:00
  it('test_test_jade_second_claim_same_day_gives_nothing', () => {
    const m = emptyAncestry();
    expect(grantTestPaidJade(m, noon)).toBe(TEST_PAID_JADE_GRANT);
    expect(grantTestPaidJade(m, noon + 3600_000)).toBe(0);
    expect(m.jade!.paidTest).toBe(TEST_PAID_JADE_GRANT);
    expect(testPaidJadeClaimedToday(m, noon)).toBe(true);
  });

  it('test_test_jade_resets_at_4am_hong_kong', () => {
    const m = emptyAncestry();
    grantTestPaidJade(m, noon);
    const before4am = Date.UTC(2026, 9, 25, 19, 59); // 香港 26 日 03:59
    const after4am = Date.UTC(2026, 9, 25, 20, 1); // 香港 26 日 04:01
    expect(grantTestPaidJade(m, before4am)).toBe(0);
    expect(grantTestPaidJade(m, after4am)).toBe(TEST_PAID_JADE_GRANT);
    expect(m.jade!.paidTest).toBe(TEST_PAID_JADE_GRANT * 2);
  });

  it('test_test_jade_daily_amount_is_one_ten_pull', () => {
    expect(TEST_PAID_JADE_GRANT).toBe(600);
  });
});

describe('審計 B2：主動玩修為按掛機速率', () => {
  it('test_spar_stage_clear_xp_scales_with_idle_rate', async () => {
    const { sparStageClearXp, sparStageReward } = await import('../core/life/sparDuel');
    const { effectiveCultivationRate } = await import('../core/life/cultivation');
    const { TEST_ACTIVE_CULTIVATION_SECONDS } = await import('../data/redesign/testParams');
    const low = freshLife();
    const high = freshLife();
    high.character.martial += 500; // 掛機速率高咗
    const expectLow = sparStageReward(25).xp + Math.round(effectiveCultivationRate(low) * TEST_ACTIVE_CULTIVATION_SECONDS.sparStageClear);
    expect(sparStageClearXp(low, 25)).toBe(expectLow);
    expect(sparStageClearXp(high, 25)).toBeGreaterThan(sparStageClearXp(low, 25));
  });

  it('test_event_cultivation_keeps_rng_sequence', async () => {
    const { grantEventCultivation } = await import('../core/life/cultivation');
    const { getRng } = await import('../core/random');
    const a = freshLife();
    grantEventCultivation(a);
    const nextA = getRng().nextInt(0, 1_000_000);
    freshLife();
    getRng().nextInt(2, 6);
    expect(getRng().nextInt(0, 1_000_000)).toBe(nextA);
  });
});

describe('審計 B3：江湖敵人跟境界基準', () => {
  it('test_event_foe_ignores_player_live_stats', async () => {
    const { startCombat } = await import('../core/life/combat');
    const weak = freshLife();
    const strong = freshLife();
    strong.character.martial += 400;
    strong.character.maxHealth += 2000;
    startCombat(weak, { source: 'event', title: '試', foeName: '山賊', foePower: 'normal' });
    startCombat(strong, { source: 'event', title: '試', foeName: '山賊', foePower: 'normal' });
    expect(strong.pendingCombat!.foe.maxHp).toBe(weak.pendingCombat!.foe.maxHp);
    expect(strong.pendingCombat!.foe.attack).toBe(weak.pendingCombat!.foe.attack);
  });

  it('test_event_foe_grows_with_tier_and_power', async () => {
    const { buildFoe, eventFoeScale } = await import('../core/life/combat');
    const low = buildFoe('山賊', 'normal', eventFoeScale(0, 'normal'));
    const high = buildFoe('山賊', 'normal', eventFoeScale(10, 'normal'));
    expect(high.maxHp).toBeGreaterThan(low.maxHp);
    expect(high.attack).toBeGreaterThan(low.attack);
    // 頂境之後冇上限，沿用最後一格
    expect(eventFoeScale(99, 'boss')).toEqual(eventFoeScale(14, 'boss'));
  });
});

describe('審計 C1：舊 maxAge 改做境界上限', () => {
  it('test_childhood_event_hidden_after_its_tier', async () => {
    const { meetsRequirements, requirementMaxTier } = await import('../core/life/requirements');
    const ev = lookupEvent('family_poverty')!;
    expect(requirementMaxTier(ev.requirements!)).toBe(3);
    const s = freshLife();
    expect(meetsRequirements(s, ev.requirements, ev.id)).toBe(true);
    s.character.cultivation.tier = 14;
    expect(meetsRequirements(s, ev.requirements, ev.id)).toBe(false);
  });

  it('test_explicit_max_tier_overrides_legacy_age', async () => {
    const { requirementMaxTier } = await import('../core/life/requirements');
    expect(requirementMaxTier({ maxAge: 16, maxTier: 9 })).toBe(9);
    expect(requirementMaxTier({ minAge: 16 })).toBeUndefined();
    expect(requirementMaxTier({ maxAge: 99 })).toBeUndefined();
  });
});

describe('審計：普通事件唔致死、墜崖改重傷', () => {
  it('test_event_health_loss_leaves_one_hp', () => {
    const s = freshLife();
    s.character.health = 5;
    const ev: GameEvent = { id: 'qa_hurt', title: '試', choices: [{ id: 'a', text: '試', outcomes: [{ effects: [{ type: 'health', amount: -50 }] }] }] };
    const r = applyChoice(s, ev, 'a');
    expect(r.died).toBe(false);
    expect(s.character.alive).toBe(true);
    expect(s.character.health).toBe(1);
  });

  it('test_explicit_die_effect_still_kills', () => {
    const s = freshLife();
    const ev: GameEvent = { id: 'qa_die', title: '試', choices: [{ id: 'a', text: '試', outcomes: [{ effects: [{ type: 'die', reason: '試死。' }] }] }] };
    expect(applyChoice(s, ev, 'a').died).toBe(true);
  });

  it('test_cliff_fall_never_kills_and_is_once', () => {
    const ev = lookupEvent('accident_fall')!;
    expect(ev.requirements?.once).toBe(true);
    const effects = ev.choices.flatMap((c) => c.outcomes.flatMap((o) => o.effects.map((e) => e.type)));
    expect(effects).not.toContain('die');
    for (let seed = 1; seed <= 30; seed++) {
      initRng(seed);
      const s = createNewLife({ seed, skipCoach: true });
      applyChoice(s, ev, 'lucky');
      expect(s.character.alive).toBe(true);
    }
  });
});

describe('審計 C2：歸隱傳位', () => {
  it('test_retire_requires_tier_8', async () => {
    const { canRetire, retireLife } = await import('../core/life/retire');
    const s = freshLife();
    expect(canRetire(s).ok).toBe(false);
    expect(retireLife(s)).toBe(false);
    s.character.cultivation.tier = 8;
    expect(canRetire(s).ok).toBe(true);
    expect(retireLife(s)).toBe(true);
    expect(s.phase).toBe('summary');
    expect(s.character.alive).toBe(false);
    expect(s.character.flags.retired).toBe(true);
    expect(s.summaryText).toBeTruthy();
  });

  it('test_golden_basin_event_retires_without_tier_gate', () => {
    const s = freshLife();
    s.pending = { eventId: 'final_duel' } as LifeGameState['pending'];
    const r = applyChoice(s, lookupEvent('final_duel')!, 'retire');
    expect(r.died).toBe(false);
    expect(s.phase).toBe('summary');
    expect(s.pendingCombat).toBeFalsy();
  });

  it('test_old_save_with_retired_flag_does_not_retire_on_next_event', () => {
    const s = freshLife();
    s.character.flags.retired = true;
    const ev: GameEvent = { id: 'qa_plain', title: '試', choices: [{ id: 'a', text: '試', outcomes: [{ effects: [{ type: 'narrate', text: '無事。' }] }] }] };
    applyChoice(s, ev, 'a');
    expect(s.phase).toBe('playing');
  });
});

describe('審計 B4：銀兩用途', () => {
  it('test_full_heal_costs_tenth_of_max_hp_and_restores_full', async () => {
    const { performPracticeAction, fullHealCost } = await import('../core/life/actions');
    const s = freshLife();
    s.character.health = 1;
    s.character.money = 10_000;
    const cost = fullHealCost(s.character);
    expect(cost).toBe(Math.max(15, Math.round(s.character.maxHealth * 0.1)));
    performPracticeAction(s, 'heal_full');
    expect(s.character.health).toBe(s.character.maxHealth);
    expect(s.character.money).toBe(10_000 - cost);
  });

  it('test_sect_donate_promotes_once_per_month', async () => {
    const { performPracticeAction, sectDonateCost } = await import('../core/life/actions');
    const s = freshLife();
    s.character.sectId = Object.keys(s.sects)[0] ?? 'sect_qa';
    s.character.sectStanding = 0;
    s.character.money = 10_000;
    const cost = sectDonateCost(s.character);
    performPracticeAction(s, 'sect_donate');
    expect(s.character.sectStanding).toBe(1);
    expect(s.character.money).toBe(10_000 - cost);
    performPracticeAction(s, 'sect_donate');
    expect(s.character.sectStanding).toBe(1);
  });

  it('test_fine_forge_cost_scales_with_tier', async () => {
    const { fineForgeCost, performPracticeAction } = await import('../core/life/actions');
    const s = freshLife();
    expect(fineForgeCost(s)).toBe(40);
    s.character.cultivation.tier = 9;
    expect(fineForgeCost(s)).toBe(400);
    s.character.money = 400;
    const gearBefore = (s.character.gear ?? []).length;
    performPracticeAction(s, 'forge_fine');
    expect(s.character.money).toBe(0);
    expect((s.character.gear ?? []).length).toBeGreaterThanOrEqual(gearBefore);
  });

  it('test_silver_pages_daily_limit', async () => {
    const { exchangeSilverForPages, silverPagesLeft } = await import('../core/life/gacha');
    const m = emptyAncestry();
    const who = { money: 10_000 };
    const noon = Date.UTC(2026, 9, 25, 4);
    for (let i = 0; i < 3; i++) expect(exchangeSilverForPages(m, who, noon)).toBe(10);
    expect(exchangeSilverForPages(m, who, noon)).toBe(0);
    expect(silverPagesLeft(m, noon)).toBe(0);
    expect(m.pages).toBe(30);
    expect(who.money).toBe(10_000 - 600);
    expect(exchangeSilverForPages(m, who, noon + 24 * 3600_000)).toBe(10);
    expect(exchangeSilverForPages(m, { money: 199 }, noon + 24 * 3600_000)).toBe(0);
  });
});

describe('審計：每月傷勢扣血唔致死', () => {
  it('test_monthly_bleeding_leaves_one_hp', async () => {
    const { simulateMonthBody } = await import('../core/life/monthly');
    const s = freshLife();
    s.character.health = 2;
    s.character.actionPoints = 0;
    s.character.conditions = [
      { id: 'bleeding', name: '流血', severity: 9, monthsLeft: 3 },
      { id: 'poison', name: '中毒', severity: 1, monthsLeft: 3 },
      { id: 'internal', name: '內傷', severity: 1, monthsLeft: 3 },
    ] as LifeGameState['character']['conditions'];
    simulateMonthBody(s);
    expect(s.character.alive).toBe(true);
    expect(s.character.health).toBe(1);
  });
});
