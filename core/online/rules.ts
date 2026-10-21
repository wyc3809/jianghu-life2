import type { OnlinePlayer, OnlineWorld } from '@interfaces/online';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';

/** 按伺服器在線租約積分收益；跨多次讀取仍保留48小時離線累積上限。 */
export function accrueOnlineRewards(p: OnlinePlayer, now: number): void {
  if (now <= p.rewardAt) return;
  const onlineMs = Math.max(0, Math.min(now, p.onlineUntil) - p.rewardAt);
  const offlineMs = now - p.rewardAt - onlineMs;
  const allowed = Math.min(offlineMs, Math.max(0, ONLINE_TEST.offlineCapMs - p.offlineAccruedMs));
  p.onlineRemainder += onlineMs * ONLINE_TEST.onlineSilverPerMinute;
  p.offlineRemainder += allowed * ONLINE_TEST.offlineSilverPerMinute;
  p.pendingOnline += Math.floor(p.onlineRemainder / 60_000);
  p.pendingOffline += Math.floor(p.offlineRemainder / 60_000);
  p.onlineRemainder %= 60_000;
  p.offlineRemainder %= 60_000;
  p.offlineAccruedMs += offlineMs;
  p.rewardAt = now;
}

/** 逾期戰鬥只結算一次；較低名次勝出先交換，唔改人生血量／內力或傷勢。 */
export function settleOnlineWorld(world: OnlineWorld, now: number): void {
  for (const p of Object.values(world.players)) accrueOnlineRewards(p, now);
  for (const battle of world.battles) {
    if (battle.settledAt !== null || battle.endsAt > now) continue;
    if (battle.winner) {
      const loserId = battle.winner === battle.attacker ? battle.defender : battle.attacker;
      const winner = world.players[battle.winner], loser = world.players[loserId];
      if (winner.rank > loser.rank) [winner.rank, loser.rank] = [loser.rank, winner.rank];
      loser.protectedUntil = battle.endsAt + ONLINE_TEST.protectionMs;
    }
    for (const id of [battle.attacker, battle.defender]) {
      if (world.players[id].busy === battle.id) world.players[id].busy = null;
    }
    battle.after = { river: world.players.river.rank, cloud: world.players.cloud.rank };
    battle.settledAt = battle.endsAt;
  }
}
