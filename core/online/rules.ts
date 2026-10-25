import type { OnlinePlayer, OnlineWorld } from '@interfaces/online';
import { ONLINE_TEST } from '@data/redesign/onlineTestParams';
import { economyDay } from '@core/life/accountEconomy';
import { ONLINE_ATTACK_WIN_JADE, ONLINE_DEFEND_WIN_JADE, ONLINE_DAILY_WIN_LIMIT } from '@data/redesign/martialEconomyParams';

/** 只讀伺服器當日獎勵進度，不因展示而重置或回撥台帳。 */
export function onlineJadeProgress(player:OnlinePlayer,now:number):{attackWins:number;defendWins:number} {
  const d=player.jadeDay;
  return d?.day===economyDay(now)?{attackWins:d.attackWins,defendWins:d.defendWins}:{attackWins:0,defendWins:0};
}

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
      const day = economyDay(battle.endsAt);
      if(!winner.jadeDay || day>winner.jadeDay.day)winner.jadeDay={day,attackWins:0,defendWins:0,opponents:[]};
      const d=winner.jadeDay,role=battle.winner===battle.attacker?'attackWins':'defendWins';
      if(d.day===day && d[role]<ONLINE_DAILY_WIN_LIMIT && !d.opponents.includes(loserId)) {
        const jade=role==='attackWins'?ONLINE_ATTACK_WIN_JADE:ONLINE_DEFEND_WIN_JADE;
        d[role]++;d.opponents.push(loserId);winner.jadeEarnedTotal=(winner.jadeEarnedTotal??0)+jade;
        battle.jadeAwards={ [winner.id]:jade };
      }
    }
    for (const id of [battle.attacker, battle.defender]) {
      if (world.players[id].busy === battle.id) world.players[id].busy = null;
    }
    battle.after = { [battle.attacker]: world.players[battle.attacker].rank, [battle.defender]: world.players[battle.defender].rank };
    battle.settledAt = battle.endsAt;
  }
}
