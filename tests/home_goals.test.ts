import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';
import { currentGoal, ensureNewbieReward, newbieActive, startNewbieTrial } from '../core/life/goals';
import { playerCombatTurn, resolveCombatDisposition } from '../core/life/combat';
import { equipGear } from '../core/life/equipment';
import { startMonth } from '../core/life/eventEngine';
import { NEWBIE_TRIAL } from '../data/redesign/newbie';
import { currentCultivationTier } from '../core/life/cultivation';

describe('home goal + newbie flow (agreed-design §2 §5)', () => {
  it('test_newbie_flow_trial_then_equip_then_next_goal', () => {
    initRng(11);
    const s = createNewLife({ seed: 11 });
    expect(newbieActive(s)).toBe(true);
    expect(currentGoal(s).action).toBe('trial');

    startNewbieTrial(s);
    expect(s.pendingCombat?.eventId).toBe(NEWBIE_TRIAL.eventId);
    // 打到贏（弱敵）
    for (let i = 0; i < 40 && s.pendingCombat && s.pendingCombat.phase === 'player'; i++) {
      s.pendingCombat.foe.hp = Math.min(s.pendingCombat.foe.hp, 1);
      playerCombatTurn(s, 'basic_strike');
    }
    expect(s.pendingCombat?.phase).toBe('resolve');
    resolveCombatDisposition(s, 'release');
    expect(s.character.flags.newbie_trial_won).toBe(true);
    expect(s.character.gear).toContain(NEWBIE_TRIAL.rewardGearId);
    expect(currentGoal(s).action).toBe('equip');

    equipGear(s, NEWBIE_TRIAL.rewardGearId);
    const g = currentGoal(s);
    expect(g.kicker).toContain('3／3');
    expect(g.id).toBe('cultivate');

    s.pending = null;
    startMonth(s);
    expect(newbieActive(s)).toBe(false);
    expect(currentGoal(s).kicker).toBe('當前目標');
  });

  it('test_newbie_reward_kept_when_foe_stunned_for_all_seeds', () => {
    for (let seed = 1; seed <= 12; seed++) {
      initRng(seed);
      const s = createNewLife({ seed });
      startNewbieTrial(s);
      for (let i = 0; i < 40 && s.pendingCombat && s.pendingCombat.phase === 'player'; i++) {
        s.pendingCombat.foe.hp = Math.min(s.pendingCombat.foe.hp, 1);
        playerCombatTurn(s, 'basic_strike');
      }
      resolveCombatDisposition(s, 'stun');
      expect(s.character.gear).toContain(NEWBIE_TRIAL.rewardGearId);
    }
  });

  it('test_old_save_missing_newbie_blade_is_repaired_so_equip_works', () => {
    initRng(14);
    const s = createNewLife({ seed: 14 });
    s.character.flags.newbie_trial_won = true;
    s.character.gear = s.character.gear.filter((g) => g !== NEWBIE_TRIAL.rewardGearId);
    expect(equipGear(s, NEWBIE_TRIAL.rewardGearId)).toContain('尚未擁有');
    expect(ensureNewbieReward(s)).toBe(true);
    expect(equipGear(s, NEWBIE_TRIAL.rewardGearId)).toContain('已裝備');
  });

  it('test_heir_and_old_saves_skip_newbie', () => {
    initRng(12);
    const s = createNewLife({ seed: 12, skipCoach: true });
    expect(newbieActive(s)).toBe(false);
    expect(currentGoal(s).action).not.toBe('trial');
  });

  it('test_goal_is_breakthrough_when_capped', () => {
    initRng(13);
    const s = createNewLife({ seed: 13, skipCoach: true });
    s.character.cultivation.xp = currentCultivationTier(s).cap;
    expect(currentGoal(s).action).toBe('breakthrough');
  });
});
