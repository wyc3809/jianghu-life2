import { describe, expect, it } from 'vitest';
import { emptyAncestry } from '../core/life/ancestry';
import { chooseEncounterRoute, claimEncounter, encounterRoute, tickEncounter } from '../core/life/encounters';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import {
  ENCOUNTERS,
  ENCOUNTER_FIRST_DELAY_MINUTES,
  ENCOUNTER_GAP_MAX_HOURS,
  ENCOUNTER_GAP_MIN_HOURS,
  ENCOUNTER_OFFER_HOURS,
} from '../data/redesign/encounters';
import { getSkillDef } from '../data/skills/catalog';

const H = 3_600_000;
const T0 = 1_800_000_000_000;

function setup() {
  initRng(1);
  const s = createNewLife({ seed: 1, skipCoach: true });
  const m = emptyAncestry();
  tickEncounter(m, s, T0); // 第一次開遊戲：排第一個奇遇
  return { s, m };
}

describe('online encounters (agreed-design §3.3)', () => {
  it('test_all_rewards_are_premium_arts_and_routes_last_1_to_3_days', () => {
    for (const t of ENCOUNTERS) {
      for (const id of t.rewards) expect(getSkillDef(id)?.premium).toBe(true);
      for (const r of t.routes) {
        expect(r.days).toBeGreaterThanOrEqual(1);
        expect(r.days).toBeLessThanOrEqual(3);
      }
    }
  });

  it('test_first_offer_after_delay_then_gap_is_2_to_3_times_a_week', () => {
    const { s, m } = setup();
    expect(tickEncounter(m, s, T0 + ENCOUNTER_FIRST_DELAY_MINUTES * 60_000)).toBe('offered');
    // 唔揀：一日後散，之後排下一次
    const lapse = T0 + (ENCOUNTER_OFFER_HOURS + 1) * H;
    expect(tickEncounter(m, s, lapse)).toBe('offer_lapsed');
    const gap = (m.encounter!.nextAt - lapse) / H;
    expect(gap).toBeGreaterThanOrEqual(ENCOUNTER_GAP_MIN_HOURS);
    expect(gap).toBeLessThanOrEqual(ENCOUNTER_GAP_MAX_HOURS);
  });

  it('test_timer_starts_on_first_choice_and_progress_completes_and_claims_premium', () => {
    const { s, m } = setup();
    tickEncounter(m, s, T0 + ENCOUNTER_FIRST_DELAY_MINUTES * 60_000);
    const tpl = m.encounter!.offer!.tpl;
    const routeMonths = ENCOUNTERS.find((t) => t.id === tpl)!.routes[0]!;
    const tChoose = T0 + 5 * H; // 隔幾個鐘先揀
    expect(chooseEncounterRoute(m, s, routeMonths.id, tChoose)).toBe(true);
    expect(m.encounter!.active!.deadline).toBe(tChoose + routeMonths.days * 24 * H);
    // 用遊戲進度完成
    const route = encounterRoute(tpl, routeMonths.id)!;
    if (route.trial === 'months') s.character.stats.monthsLived += route.target;
    if (route.trial === 'harvest') s.character.money += route.target;
    if (route.trial === 'stages') s.character.flags.spar_stage = Number(s.character.flags.spar_stage ?? 1) + route.target;
    if (route.trial === 'wins') s.character.stats.combatsWon += route.target;
    expect(tickEncounter(m, s, tChoose + H)).toBe('completed');
    const reward = claimEncounter(m, tChoose + 2 * H)!;
    expect(getSkillDef(reward)?.premium).toBe(true);
    expect(m.manuals![reward]).toBeDefined();
    expect(m.encounter!.active).toBeUndefined();
  });

  it('test_expired_gives_nothing_and_offline_time_counts', () => {
    const { s, m } = setup();
    tickEncounter(m, s, T0 + ENCOUNTER_FIRST_DELAY_MINUTES * 60_000);
    const tpl = ENCOUNTERS.find((t) => t.id === m.encounter!.offer!.tpl)!;
    chooseEncounterRoute(m, s, tpl.routes[0]!.id, T0 + H);
    // 離線咗好耐先返嚟：期限照過
    expect(tickEncounter(m, s, T0 + H + 4 * 24 * H)).toBe('expired');
    expect(Object.keys(m.manuals ?? {})).toHaveLength(0);
    expect(m.encounter!.last?.result).toBe('expired');
  });

  it('test_silver_trial_counts_any_income_not_spending', () => {
    const { s, m } = setup();
    tickEncounter(m, s, T0 + ENCOUNTER_FIRST_DELAY_MINUTES * 60_000);
    m.encounter!.offer!.tpl = 'enc_thunder_widow';
    const route = encounterRoute('enc_thunder_widow', 'shelter')!;
    expect(route.trial).toBe('harvest');
    chooseEncounterRoute(m, s, 'shelter', T0 + H);
    s.character.money += 50; // 演武台／事件賺到
    tickEncounter(m, s, T0 + 2 * H);
    expect(m.encounter!.active!.progress).toBe(50);
    s.character.money -= 30; // 使錢唔扣進度
    tickEncounter(m, s, T0 + 3 * H);
    expect(m.encounter!.active!.progress).toBe(50);
    s.character.money += 20;
    tickEncounter(m, s, T0 + 4 * H);
    expect(m.encounter!.active!.progress).toBe(70);
  });

  it('test_progress_carries_across_generations', () => {
    const { s, m } = setup();
    tickEncounter(m, s, T0 + ENCOUNTER_FIRST_DELAY_MINUTES * 60_000);
    m.encounter!.offer!.tpl = 'enc_blood_monk';
    chooseEncounterRoute(m, s, 'feed', T0 + H); // 過 3 個月
    s.character.stats.monthsLived += 2;
    tickEncounter(m, s, T0 + 2 * H);
    expect(m.encounter!.active!.progress).toBe(2);
    // 換代：新角色由 0 計，舊進度保留
    initRng(9);
    const heir = createNewLife({ seed: 9, skipCoach: true });
    tickEncounter(m, heir, T0 + 3 * H);
    expect(m.encounter!.active!.progress).toBe(2);
    heir.character.stats.monthsLived += 1;
    expect(tickEncounter(m, heir, T0 + 4 * H)).toBe('completed');
  });
});
