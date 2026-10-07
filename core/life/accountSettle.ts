/**
 * 人生 ↔ 帳戶結算（純函數；src/store/ancestryStore.ts 每次人生狀態變就叫）：
 *   - 家族里程碑（首次）→ 祖蔭＋免費玉石
 *   - 成就（帳戶首次）→ 免費玉石
 *   - 人生入面賺到嘅「待入帳玉石」（過月、突破、演武台每 10 關）→ 免費玉石
 *   - 秘笈升階（帳戶收藏）→ 鏡像去角色 manualStars，畀戰鬥用
 *   - 外功七卷（帳戶收藏）→ 同步落角色 volumes
 */
import { syncCollectionVolumes } from './volumes';
import type { AncestryMeta } from '@interfaces/ancestry';
import type { LifeGameState } from '@interfaces/lifeEngine';
import type { FamilyMilestone } from '@data/ancestry/milestones';
import { JADE_PER_ACHIEVEMENT, JADE_PER_MILESTONE } from '@data/redesign/testParams';
import { claimFamilyMilestones } from './ancestry';
import { readAchievementIds } from './achievements';
import { takeJadePending } from './jadePending';
import { addFreeJade, manualStarMap } from './gacha';

export interface AccountSettlement {
  milestones: FamilyMilestone[];
  jade: number;
  metaChanged: boolean;
  lifeChanged: boolean;
}

export function settleLifeIntoAccount(meta: AncestryMeta, state: LifeGameState): AccountSettlement {
  const milestones = claimFamilyMilestones(meta, state);
  let jade = milestones.length * JADE_PER_MILESTONE;

  const seen = new Set(meta.jadeAchv ?? []);
  const fresh = readAchievementIds(state).filter((id) => !seen.has(id));
  if (fresh.length) {
    meta.jadeAchv = [...seen, ...fresh];
    jade += fresh.length * JADE_PER_ACHIEVEMENT;
  }

  const pending = takeJadePending(state);
  jade += pending;
  addFreeJade(meta, jade);

  const want = manualStarMap(meta);
  const have = state.character.manualStars ?? {};
  const starsDiffer = JSON.stringify(want) !== JSON.stringify(have);
  if (starsDiffer) state.character.manualStars = want;
  // 家族收藏嘅外功卷 → 同步落今世角色已學嘅外功
  const volsChanged = syncCollectionVolumes(state.character, meta);

  return {
    milestones,
    jade,
    metaChanged: milestones.length > 0 || fresh.length > 0 || jade > 0,
    lifeChanged: pending > 0 || starsDiffer || volsChanged,
  };
}
