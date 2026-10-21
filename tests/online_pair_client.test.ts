import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../src/cloud/cloud', () => ({ cloudAccess: async () => ({ url: 'https://test.invalid', key: 'test-public', token: 'test-session' }) }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it('test_pair_client_另一分頁轉房_本頁心跳及指令仍送原房', async () => {
  // 已入A房嘅頁面；B分頁之後改寫「上次房間」。
  let saved = 'room-a';
  vi.stubGlobal('localStorage', { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } });
  const bodies: { roomId: string; clientId: string }[] = [];
  vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(init.body as string));
    return new Response(JSON.stringify({ room: { id: 'room-c' } }), { status: 200 });
  });
  const { publicOnlineRequest, pairRoomId } = await import('../src/cloud/online');
  saved = 'room-b';
  await publicOnlineRequest('heartbeat', {}, false);
  await publicOnlineRequest('challenge', { requestId: 'command-001', target: 'cloud' }, false);
  expect(bodies.map(b => b.roomId)).toEqual(['room-a', 'room-a']);
  expect(bodies[0].clientId).toBe(bodies[1].clientId);
  // 只有本頁成功接受邀請先改成新房；下次重開用新房。
  await publicOnlineRequest('login', { action: 'join', invite: 'new-invite' }, false);
  await publicOnlineRequest('heartbeat', {}, false);
  expect(pairRoomId()).toBe('room-c'); expect(saved).toBe('room-c');
  expect(bodies.at(-1)?.roomId).toBe('room-c');
});
