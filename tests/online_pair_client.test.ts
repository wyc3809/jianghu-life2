import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../src/cloud/cloud', () => ({ cloudAccess: async () => ({ url: 'https://test.invalid', key: 'test-public', token: 'test-session' }) }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it('test_world_client_舊房間資料_唔改身份或發送房間選擇', async () => {
  const saved = new Map([['jianghu-pair-room', 'old-room']]);
  vi.stubGlobal('localStorage', { getItem: (key: string) => saved.get(key), setItem: (key: string, value: string) => { saved.set(key, value); } });
  const calls: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(init.body as string), headers: init.headers as Record<string, string> });
    return new Response('{}', { status: 200 });
  });
  const { publicOnlineRequest, worldJoined } = await import('../src/cloud/online');
  expect(worldJoined()).toBe(false);
  await publicOnlineRequest('login', { name: '測試俠客' }, false);
  expect(worldJoined()).toBe(true);
  saved.set('jianghu-pair-room', 'another-old-room');
  await publicOnlineRequest('heartbeat', {}, false);
  expect(calls[0].url).toBe('https://test.invalid/functions/v1/jianghu-world');
  expect(calls[0].body).toMatchObject({ action: 'register', data: { name: '測試俠客' } });
  expect(calls[1].body).toMatchObject({ action: 'heartbeat', data: {} });
  expect(calls[0].body.clientId).toBe(calls[1].body.clientId);
  for (const call of calls) {
    expect(call.body).not.toHaveProperty('roomId');
    expect(call.body).not.toHaveProperty('account');
    expect(call.headers.Authorization).toBe('Bearer test-session');
  }
});
