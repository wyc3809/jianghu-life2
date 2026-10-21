import { describe, expect, it } from 'vitest';
import { createOnlineFixture } from '../server/online/fixtures';
import { simulateOnlineBattle } from '../core/online/combat';
import { accrueOnlineRewards, settleOnlineWorld } from '../core/online/rules';
import { ONLINE_TEST } from '../data/redesign/onlineTestParams';
import type { OnlineAccountId, OnlineBattle } from '../interfaces/online';

const NOW = 1_000_000;
function scenario(winner: OnlineAccountId | null) {
  const w = createOnlineFixture(NOW);
  const result = simulateOnlineBattle(w.players.river.character, w.players.cloud.character, 42);
  const battle: OnlineBattle = { id: 'battle-1', attacker: 'river', defender: 'cloud', winner,
    startedAt: NOW, endsAt: NOW + ONLINE_TEST.battleMs, settledAt: null,
    before: { river: 100, cloud: 20 }, after: null,
    replays: { river: result.forward, cloud: result.reverse },
    characters: { river: structuredClone(w.players.river.character), cloud: structuredClone(w.players.cloud.character) } };
  w.battles.push(battle); w.players.river.busy = battle.id; w.players.cloud.busy = battle.id;
  return w;
}

describe('多人核心規則', () => {
  it('test_online_低排名勝出_直接互換且人物不受傷', () => {
    const w = scenario('river'), original = structuredClone(w.players.river.character);
    settleOnlineWorld(w, NOW + ONLINE_TEST.battleMs);
    expect([w.players.river.rank, w.players.cloud.rank]).toEqual([20, 100]);
    expect(w.players.river.character).toEqual(original);
    expect(w.players.cloud.protectedUntil).toBe(NOW + ONLINE_TEST.battleMs + ONLINE_TEST.protectionMs);
    expect(w.players.river.busy).toBeNull();
  });
  it('test_online_挑戰失敗_雙方名次不變且只保護敗方', () => {
    const w = scenario('cloud');
    settleOnlineWorld(w, NOW + ONLINE_TEST.battleMs);
    expect([w.players.river.rank, w.players.cloud.rank]).toEqual([100, 20]);
    expect(w.players.river.protectedUntil).toBeGreaterThan(NOW);
    expect(w.players.cloud.protectedUntil).toBe(0);
  });
  it('test_online_未到結算及重播_不提早或重複換位', () => {
    const w = scenario('river');
    settleOnlineWorld(w, NOW); expect(w.players.river.rank).toBe(100);
    settleOnlineWorld(w, NOW + ONLINE_TEST.battleMs);
    settleOnlineWorld(w, NOW + ONLINE_TEST.battleMs + 1);
    expect(w.players.river.rank).toBe(20); expect(w.players.cloud.rank).toBe(100);
  });
  it('test_online_平手_不換位及不加戰敗保護', () => {
    const w = scenario(null); settleOnlineWorld(w, NOW + ONLINE_TEST.battleMs);
    expect(w.players.river.rank).toBe(100); expect(w.players.cloud.protectedUntil).toBe(0);
  });
  it('test_online_真武學推演_固定種子雙方戰報鏡像且來源不變', () => {
    const w = createOnlineFixture(NOW), original = structuredClone(w);
    const result = simulateOnlineBattle(w.players.river.character, w.players.cloud.character, 42);
    expect(result).toEqual(simulateOnlineBattle(w.players.river.character, w.players.cloud.character, 42));
    expect(result.winner).toBe(0); expect(w).toEqual(original);
    const a = result.forward.rounds.flatMap(r => r.hits), b = result.reverse.rounds.flatMap(r => r.hits);
    expect(a.length).toBeGreaterThan(2);
    a.forEach((h, i) => {
      expect(h.playerHp).toBe(b[i]!.foeHp); expect(h.damage).toBe(b[i]!.damage);
      expect(h.side).not.toBe(b[i]!.side);
    });
    expect(a.some(h => h.skillId === 'art_river_fist' && h.vol === 6)).toBe(true);
  });
  it('test_online_在線與離線分段_收益比例正確且重讀不重計', () => {
    const p = createOnlineFixture(NOW).players.river; p.onlineUntil = NOW + 60_000;
    accrueOnlineRewards(p, NOW + 120_000);
    expect([p.pendingOnline, p.pendingOffline]).toEqual([10, 1]);
    accrueOnlineRewards(p, NOW + 120_000);
    expect([p.pendingOnline, p.pendingOffline]).toEqual([10, 1]);
  });
  it('test_online_多次觀察離線玩家_不繞過48小時上限', () => {
    const p = createOnlineFixture(NOW).players.river;
    for (let hour = 1; hour <= 72; hour++) accrueOnlineRewards(p, NOW + hour * 3_600_000);
    expect(p.pendingOffline).toBe(48 * 60);
    accrueOnlineRewards(p, NOW + 100 * 3_600_000); expect(p.pendingOffline).toBe(48 * 60);
  });
});
