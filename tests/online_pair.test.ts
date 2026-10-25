import { describe, expect, it } from 'vitest';
import { PairService, type PairRepository, type PairRoom } from '../core/online/pairRoom';
import type { OnlineSnapshot } from '../interfaces/online';
import { createPairHandler } from '../server/online/pairHttp';

const host = '00000000-0000-4000-8000-000000000001';
const guest = '00000000-0000-4000-8000-000000000002';
const third = '00000000-0000-4000-8000-000000000003';
const client = '10000000-0000-4000-8000-000000000001';
const secondClient = '10000000-0000-4000-8000-000000000002';
const invite = '20000000-0000-4000-8000-000000000001';
function fixture() {
  const rows = new Map<string, PairRoom>(); let now = 1_000_000, retries = 0;
  const clone = (r?: PairRoom) => r ? structuredClone(r) : null;
  const repo: PairRepository = {
    load: async id => clone(rows.get(id)),
    byHost: async user => clone([...rows.values()].find(r => r.host_id === user)),
    byInvite: async code => clone([...rows.values()].find(r => r.invite === code)),
    insert: async r => { if (rows.has(r.id)) return false; rows.set(r.id, structuredClone(r)); return true; },
    save: async (r, expected) => {
      if (retries > 0) { retries--; return false; }
      if (rows.get(r.id)?.revision !== expected) return false;
      rows.set(r.id, structuredClone(r)); return true;
    },
  };
  const service = new PairService(repo, () => now, () => ({ seed: 42, battleId: 'battle-' + now, invite }));
  const call = (user: string, action: string, data: unknown = {}, clientId = client) => service.execute(user, { action, roomId: host, clientId, data });
  const setup = async () => { await call(host, 'create'); await call(guest, 'join', { invite }); };
  return { rows, repo, call, setup, advance: (ms: number) => { now += ms; }, failSaves: (n: number) => { retries = n; } };
}

describe('二人雲端試場', () => {
  it('test_pair_開房重送_同一房同一角色並等朋友', async () => {
    const f = fixture();
    const [a, b] = await Promise.all([f.call(host, 'create'), f.call(host, 'create')]) as OnlineSnapshot[];
    expect(f.rows.size).toBe(1); expect(a.me.id).toBe('river');
    expect(b.room).toEqual({ id: host, invite, waiting: true }); expect(b.peers).toHaveLength(1);
    await expect(f.call(host, 'challenge', { requestId: 'waiting-001' })).rejects.toMatchObject({ status: 409 });
  });
  it('test_pair_邀請綁身份_第三人及非成員均拒絕', async () => {
    const f = fixture(); await f.setup();
    const b = await f.call(guest, 'resume') as OnlineSnapshot;
    expect(b.me.id).toBe('cloud'); expect(b.room?.invite).toBeUndefined();
    await expect(f.call(third, 'join', { invite })).rejects.toMatchObject({ status: 409 });
    await expect(f.call(third, 'heartbeat')).rejects.toMatchObject({ status: 403 });
    await expect(f.call(third, 'join', { invite: client })).rejects.toMatchObject({ status: 404 });
  });
  it('test_pair_同時搶第二席_只容許一位朋友', async () => {
    const f = fixture(); await f.call(host, 'create');
    const result = await Promise.allSettled([f.call(guest, 'join', { invite }), f.call(third, 'join', { invite })]);
    expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect([guest, third]).toContain(f.rows.get(host)?.guest_id);
  });
  it('test_pair_交戰重送競爭及重讀_只有一場一次互換', async () => {
    const f = fixture(); await f.setup(); f.failSaves(1);
    const data = { requestId: 'challenge-001' };
    const result = await Promise.all([f.call(host, 'challenge', data), f.call(host, 'challenge', data)]);
    expect(result[0]).toEqual(result[1]); expect(f.rows.get(host)?.payload.world.battles).toHaveLength(1);
    f.advance(2000);
    const a = await f.call(host, 'world') as OnlineSnapshot, b = await f.call(guest, 'world') as OnlineSnapshot;
    expect(a.me.rank).toBe(20); expect(b.me.rank).toBe(100);
    expect(a.battles[0].after).toEqual({ river: 20, cloud: 100 });
    await f.call(host, 'challenge', data);
    const again = await f.call(host, 'world') as OnlineSnapshot;
    expect(again.me.rank).toBe(20); expect(again.battles).toHaveLength(1);
    expect(again.me.character.health).toBe(a.me.character.health);
    expect(again.confirmedRequests).toContain(data.requestId);
  });
  it('test_pair_主動解除保護與挑戰失敗_名次不變', async () => {
    const f = fixture(); await f.setup();
    await f.call(host, 'challenge', { requestId: 'challenge-001' }); f.advance(2000);
    await f.call(guest, 'challenge', { requestId: 'challenge-002' }); f.advance(2000);
    const b = await f.call(guest, 'world') as OnlineSnapshot;
    expect(b.me.rank).toBe(100); expect(b.battles[0].before).toEqual(b.battles[0].after);
    expect(b.battles[0].winner).toBe('river');
  });
  it('test_pair_同身份多頁_單頁離場不踢走另一頁', async () => {
    const f = fixture(); await f.setup();
    await f.call(host, 'heartbeat', {}, secondClient); await f.call(host, 'leave');
    let b = await f.call(guest, 'world') as OnlineSnapshot;
    expect(b.peers.find(p => p.id === 'river')?.online).toBe(true);
    await f.call(host, 'leave', {}, secondClient);
    b = await f.call(guest, 'world') as OnlineSnapshot;
    expect(b.peers.find(p => p.id === 'river')?.online).toBe(false);
  });
  it('test_pair_離線收益及領獎競爭_只領一次', async () => {
    const f = fixture(); await f.setup(); await f.call(guest, 'leave'); f.advance(60_000);
    const b = await f.call(guest, 'world') as OnlineSnapshot;
    expect(b.me.pendingOffline).toBe(1);
    const data = { requestId: 'claim-00001' };
    const claims = await Promise.all([f.call(guest, 'claim', data), f.call(guest, 'claim', data)]);
    expect(claims[0]).toEqual(claims[1]);
    expect((await f.call(guest, 'world') as OnlineSnapshot).me.silver).toBe(1);
    await expect(f.call(guest, 'challenge', { ...data })).rejects.toMatchObject({ status: 409 });
  });
  it('test_pair_篡改身份戰力配搭_唔修改權威資料', async () => {
    const f = fixture(); await f.setup();
    const before = structuredClone(f.rows.get(host)?.payload.world.players);
    await expect(f.call(guest, 'challenge', { requestId: 'tamper-0001', damage: 9999 })).rejects.toThrow();
    await expect(f.call(guest, 'loadout', { requestId: 'tamper-0002', external: ['art_river_fist', 'art_river_fist'], internal: null, qinggong: null })).rejects.toMatchObject({ status: 400 });
    await expect(f.call(guest, 'loadout', { requestId: 'tamper-0003', external: ['art_iron_body'], internal: null, qinggong: null })).rejects.toMatchObject({ status: 400 });
    expect(f.rows.get(host)?.payload.world.players).toEqual(before);
  });
  it('test_pair_CAS繁忙_可安全重試且未寫入', async () => {
    const f = fixture(); await f.setup(); f.failSaves(10);
    const data = { requestId: 'retry-00001' };
    await expect(f.call(host, 'challenge', data)).rejects.toMatchObject({ status: 503 });
    expect(f.rows.get(host)?.payload.world.battles).toHaveLength(0);
    await f.call(host, 'challenge', data); expect(f.rows.get(host)?.payload.world.battles).toHaveLength(1);
  });
  it('test_pair_封測容量限制_保留舊收據仍可重試', async () => {
    const f = fixture(); await f.setup();
    await f.call(host, 'claim', { requestId: 'claim-00001' });
    const room = f.rows.get(host)!;
    for (let i = 0; i < 500; i++) room.payload.receipts['dummy:' + i] = { input: '', result: null };
    await expect(f.call(host, 'claim', { requestId: 'claim-00001' })).resolves.toMatchObject({ total: 0 });
    await expect(f.call(host, 'claim', { requestId: 'claim-00002' })).rejects.toMatchObject({ status: 429 });
  });
});

it('test_pair_http_偽造JWT及跨站_入核心前拒絕', async () => {
  let authCalls = 0;
  const handler = createPairHandler({ url: 'https://test.invalid', anonKey: 'test-public', serviceKey: 'test-private' }, async () => { authCalls++; return new Response('{}', { status: 401 }); });
  const badOrigin = await handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://evil.invalid', Authorization: 'Bearer fake' } }));
  expect(badOrigin.status).toBe(403); expect(authCalls).toBe(0);
  const missing = await handler(new Request('https://test.invalid', { method: 'POST' }));
  expect(missing.status).toBe(401); expect(authCalls).toBe(0);
  const forged = await handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://wyc3809.github.io', Authorization: 'Bearer fake' }, body: '{}' }));
  expect(forged.status).toBe(401); expect(authCalls).toBe(1);
  const options = await handler(new Request('https://test.invalid', { method: 'OPTIONS', headers: { Origin: 'https://wyc3809.github.io' } }));
  expect(options.headers.get('Access-Control-Allow-Origin')).toBe('https://wyc3809.github.io');
});

it('test_pair_http_iOS固定來源_允許預檢但仍驗證身份', async () => {
  // 原生App固定使用capacitor://localhost，不能開放任意同名scheme主機。
  let authCalls = 0;
  const handler = createPairHandler({ url: 'https://test.invalid', anonKey: 'test-public', serviceKey: 'test-private' }, async () => { authCalls++; return new Response('{}', { status: 401 }); });
  const options = await handler(new Request('https://test.invalid', { method: 'OPTIONS', headers: { Origin: 'capacitor://localhost' } }));
  expect(options.status).toBe(200);
  expect(options.headers.get('Access-Control-Allow-Origin')).toBe('capacitor://localhost');
  expect(authCalls).toBe(0);
  const forged = await handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'capacitor://localhost', Authorization: 'Bearer fake' }, body: '{}' }));
  expect(forged.status).toBe(401);
  expect(forged.headers.get('Access-Control-Allow-Origin')).toBe('capacitor://localhost');
  expect(authCalls).toBe(1);
  const other = await handler(new Request('https://test.invalid', { method: 'OPTIONS', headers: { Origin: 'capacitor://evil.invalid' } }));
  expect(other.status).toBe(403);
  expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull();
});
