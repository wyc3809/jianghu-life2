import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OnlineService } from '../server/online/service';
import { createOnlineHttpServer } from '../server/online/http';
import { ONLINE_TEST } from '../data/redesign/onlineTestParams';

const cleanups: (() => void)[] = [];
afterEach(() => { for (const close of cleanups.splice(0).reverse()) close(); });
function fixture(file = ':memory:') {
  let now = 1_000_000;
  const service = new OnlineService({ file, now: () => now, seed: () => 42 });
  cleanups.push(() => { try { service.close(); } catch { /* 重啟測試已關閉舊連線 */ } });
  const a = service.login({ account: 'river' }), b = service.login({ account: 'cloud' });
  return { service, a: a.token, b: b.token, advance: (ms: number) => { now += ms; }, now: () => now };
}

describe('真正本機多人服務', () => {
  it('test_online_雙帳戶離線應戰_同戰報同排名且人物不受傷', () => {
    const f = fixture(), original = f.service.world(f.b).me.character;
    f.service.leave(f.b);
    const result = f.service.challenge(f.a, { requestId: 'challenge-1', target: 'cloud' });
    expect(f.service.world(f.b).me.busy).toBe(result.battleId);
    f.advance(ONLINE_TEST.battleMs); f.service.tick();
    const a = f.service.world(f.a), b = f.service.world(f.b);
    expect([a.me.rank, b.me.rank]).toEqual([20, 100]);
    expect(a.battles[0]!.id).toBe(b.battles[0]!.id);
    expect(b.me.character).toEqual(original);
    expect(a.peers.find(p => p.id === 'cloud')!.online).toBe(false);
  });
  it('test_online_連點與雙方同時挑戰_只產生一場且重用收據', () => {
    const f = fixture(), command = { requestId: 'challenge-1', target: 'cloud' };
    const result = f.service.challenge(f.a, command);
    expect(f.service.challenge(f.a, command)).toEqual(result);
    expect(() => f.service.challenge(f.b, { requestId: 'challenge-2', target: 'river' })).toThrow('仍在交戰');
    expect(() => f.service.challenge(f.a, { requestId: 'challenge-1', target: 'river' })).toThrow('不可變更內容');
    expect(f.service.world(f.a).battles).toHaveLength(1);
  });
  it('test_online_戰敗保護與主動反擊_拒絕再襲擊但主動出擊可解除', () => {
    const f = fixture(); f.service.challenge(f.a, { requestId: 'challenge-1', target: 'cloud' });
    f.advance(ONLINE_TEST.battleMs); f.service.tick();
    expect(() => f.service.challenge(f.a, { requestId: 'challenge-2', target: 'cloud' })).toThrow('戰敗保護');
    expect(f.service.world(f.b).me.protectedUntil).toBeGreaterThan(f.now());
    f.service.challenge(f.b, { requestId: 'challenge-3', target: 'river' });
    expect(f.service.world(f.b).me.protectedUntil).toBe(0);
    f.advance(ONLINE_TEST.battleMs); f.service.tick();
    expect([f.service.world(f.a).me.rank, f.service.world(f.b).me.rank]).toEqual([20, 100]);
  });
  it('test_online_保護期到期_可再挑戰', () => {
    const f = fixture(); f.service.challenge(f.a, { requestId: 'challenge-1', target: 'cloud' });
    f.advance(ONLINE_TEST.battleMs + ONLINE_TEST.protectionMs); f.service.tick();
    expect(f.service.challenge(f.a, { requestId: 'challenge-2', target: 'cloud' }).battleId).toBeTruthy();
  });
  it('test_online_收益領取重送_一次入帳且離線對手仍可累積', () => {
    const f = fixture(); f.service.leave(f.b); f.advance(60_000);
    const command = { requestId: 'claim-001' }, result = f.service.claim(f.b, command);
    expect(result.offline).toBe(1); expect(f.service.claim(f.b, command)).toEqual(result);
    expect(f.service.world(f.b).me.silver).toBe(1);
  });
  it('test_online_多頁同帳戶_單頁離場不誤判整個帳戶離線', () => {
    const f = fixture(), second = f.service.login({ account: 'river' });
    f.service.leave(f.a); expect(f.service.world(f.b).peers.find(p => p.id === 'river')!.online).toBe(true);
    f.service.leave(second.token); expect(f.service.world(f.b).peers.find(p => p.id === 'river')!.online).toBe(false);
  });
  it('test_online_突斷線及重連_按租約分段計收益且不重複領取', () => {
    const f = fixture(); f.advance(68_000);
    let me = f.service.world(f.a).me;
    expect(me.pendingOffline).toBe(1); expect(me.pendingOnline).toBe(1);
    f.service.heartbeat(f.a); me = f.service.world(f.a).me;
    expect(me.onlineUntil).toBeGreaterThan(f.now()); expect(me.pendingOffline).toBe(1);
  });
  it('test_online_篡改戰力及未學識武學_被拒絕且現有配搭不變', () => {
    const f = fixture(), before = f.service.world(f.a).me.character;
    expect(() => f.service.challenge(f.a, { requestId: 'challenge-1', target: 'cloud', attack: 99999 })).toThrow();
    expect(() => f.service.loadout(f.a, { requestId: 'loadout-1', external: ['pr_crimson_moon'], internal: null, qinggong: null })).toThrow('尚未習得');
    expect(() => f.service.loadout(f.a, { requestId: 'loadout-2', external: ['art_river_fist', 'art_river_fist'], internal: null, qinggong: null })).toThrow('不能重複');
    expect(f.service.world(f.a).me.character).toEqual(before);
  });
  it('test_online_只改已知配搭_保留五外功與獨立內功身法', () => {
    const f = fixture(); f.service.loadout(f.a, { requestId: 'loadout-1', external: ['art_stone_palm'], internal: 'art_iron_body', qinggong: 'qg_broken_bridge' });
    const c = f.service.world(f.a).me.character;
    expect(c.equippedArts).toEqual(['art_stone_palm', null, null, null, null]);
    expect(c.supportArts).toEqual({ internal: 'art_iron_body', qinggong: 'qg_broken_bridge' });
  });
  it('test_online_重啟SQLite_離線完成戰鬥且收據及排名不重結算', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jianghu-online-')); cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    const file = join(dir, 'world.sqlite'), f = fixture(file), command = { requestId: 'challenge-1', target: 'cloud' };
    const battle = f.service.challenge(f.a, command); f.advance(60_000); f.service.close();
    const restarted = new OnlineService({ file, now: f.now, seed: () => 42 }); cleanups.push(() => restarted.close());
    expect(restarted.world(f.a).me.rank).toBe(20);
    expect(restarted.challenge(f.a, command)).toEqual(battle); expect(restarted.world(f.a).battles).toHaveLength(1);
    const claim = { requestId: 'claim-001' }; restarted.claim(f.b, claim); const silver = restarted.world(f.b).me.silver;
    restarted.claim(f.b, claim); expect(restarted.world(f.b).me.silver).toBe(silver);
  });
  it('test_online_HTTP真請求_隔離身份與拒絕跨來源及篡改', async () => {
    const f = fixture(), server = createOnlineHttpServer(f.service);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const port = (server.address() as { port: number }).port, base = `http://127.0.0.1:${port}/api/jianghu`;
      expect((await fetch(base + '/world')).status).toBe(401);
      const bad = await fetch(base + '/login', { method: 'POST', headers: { Origin: 'https://other.example' }, body: '{"account":"river"}' });
      expect(bad.status).toBe(403);
      const login = await (await fetch(base + '/login', { method: 'POST', body: '{"account":"river"}' })).json();
      const headers = { Authorization: 'Bearer ' + login.token };
      const result = await fetch(base + '/challenge', { method: 'POST', headers, body: JSON.stringify({ requestId: 'http-test-1', target: 'cloud' }) });
      expect(result.status).toBe(200);
      const spoof = await fetch(base + '/claim', { method: 'POST', headers, body: '{"requestId":"claim-001","silver":999999}' });
      expect(spoof.status).toBe(400);
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});
