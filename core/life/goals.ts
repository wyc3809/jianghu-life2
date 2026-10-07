/**
 * 主畫面「當前目標」（design/agreed-design-2026-10.md §2、§5）：
 *   新手先完成：挑戰 → 得到有用裝備 → 裝備後變強 → 看到下一個目標；
 *   之後跟修為進度：未滿＝儲修為，滿咗＝突破。
 * 純函數、唔用 RNG；新手試煉嘅敵人同獎勵喺 data/redesign/newbie.ts。
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import { NEWBIE_TRIAL } from '@data/redesign/newbie';
import { getGearDef } from '@data/equipment/catalog';
import {
  CULTIVATION_TIERS,
  breakthroughChance,
  canAttemptBreakthrough,
  currentCultivationTier,
} from './cultivation';
import { startCombat } from './combat';

export type GoalAction = 'trial' | 'equip' | 'breakthrough';

export interface CurrentGoal {
  id: string;
  /** 「新手 1／3」之類 */
  kicker: string;
  title: string;
  detail: string;
  progress?: { cur: number; max: number };
  action?: GoalAction;
  actionLabel?: string;
}

/** 新手流程仲未行完？（新角色先有；舊存檔／接班後人唔使行） */
export function newbieActive(state: LifeGameState): boolean {
  const f = state.character.flags;
  return Boolean(f.newbie_active) && !f.newbie_done;
}

/** 而家應該做乜 */
export function currentGoal(state: LifeGameState): CurrentGoal {
  const c = state.character;
  const f = c.flags;
  const reward = getGearDef(NEWBIE_TRIAL.rewardGearId);
  if (newbieActive(state) && reward) {
    if (!f.newbie_trial_won) {
      return {
        id: 'newbie_trial',
        kicker: '新手 1／3 · 挑戰',
        title: `試煉：擊敗${NEWBIE_TRIAL.foeName}`,
        detail: `贏咗得「${reward.name}」——比你手上嗰把好用。`,
        action: 'trial',
        actionLabel: '應戰',
      };
    }
    if (c.equipment[reward.slot] !== reward.id) {
      const curId = c.equipment[reward.slot];
      const cur = curId ? getGearDef(curId) : undefined;
      const from = cur?.attack ?? 0;
      const to = reward.attack ?? 0;
      return {
        id: 'newbie_equip',
        kicker: '新手 2／3 · 換裝',
        title: `換上「${reward.name}」`,
        detail: `攻擊 ${from} → ${to}（${cur ? `${cur.name}換${reward.name}` : '空手換刀'}），演武台即刻打得快啲。`,
        action: 'equip',
        actionLabel: '換上',
      };
    }
  }
  const tier = currentCultivationTier(state);
  const next = CULTIVATION_TIERS[tier.level + 1];
  const kicker = newbieActive(state) ? '新手 3／3 · 下個目標' : '當前目標';
  if (!next) {
    return { id: 'peak', kicker, title: '已至武道巔峰', detail: '繼續過月，闖蕩江湖、傳承家族。' };
  }
  if (canAttemptBreakthrough(state)) {
    return {
      id: 'breakthrough',
      kicker,
      title: `突破至「${next.name}」`,
      detail: `修為已滿。成功率約 ${Math.round(breakthroughChance(state) * 100)}%，失敗修為保留。`,
      action: 'breakthrough',
      actionLabel: '突破',
    };
  }
  return {
    id: 'cultivate',
    kicker,
    title: `修為儲滿 → 突破至「${next.name}」`,
    detail: '掛機都會自己儲；過月推進門派、歷練同新武學。',
    progress: { cur: Math.floor(c.cultivation.xp), max: tier.cap },
  };
}

/** 開新手試煉（弱敵、贏咗得裝備）；已贏過就唔再開 */
export function startNewbieTrial(state: LifeGameState): string[] {
  const c = state.character;
  if (!newbieActive(state) || c.flags.newbie_trial_won) return [];
  if (state.pendingCombat || state.phase !== 'playing' || !c.alive) return [];
  return startCombat(state, {
    source: 'event',
    title: NEWBIE_TRIAL.title,
    foeName: NEWBIE_TRIAL.foeName,
    foePower: 'weak',
    rewardOnWin: { gearId: NEWBIE_TRIAL.rewardGearId, money: NEWBIE_TRIAL.rewardMoney },
    rewardOnLose: {},
    eventId: NEWBIE_TRIAL.eventId,
  });
}

/**
 * 新手試煉已贏但精鋼刀唔喺行囊（舊版擊暈會整走獎勵）：補返，等「換裝」一步做得到。
 * 返回有冇補。
 */
export function ensureNewbieReward(state: LifeGameState): boolean {
  const c = state.character;
  if (!c.flags.newbie_trial_won) return false;
  const id = NEWBIE_TRIAL.rewardGearId;
  c.gear ??= [];
  if (c.gear.includes(id)) return false;
  c.gear.push(id);
  return true;
}

/** 換好裝之後第一次過月：新手完成（之後目標標「當前目標」） */
export function settleNewbie(state: LifeGameState): void {
  const c = state.character;
  if (!newbieActive(state) || !c.flags.newbie_trial_won) return;
  const reward = getGearDef(NEWBIE_TRIAL.rewardGearId);
  if (reward && c.equipment[reward.slot] === reward.id) c.flags.newbie_done = true;
}
