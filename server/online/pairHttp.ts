import { z } from 'zod';
import { PairService, type PairRepository, type PairRoom } from '../../core/online/pairRoom';
import { OnlineError } from '../../core/online/commands';

type Config = { url: string; anonKey: string; serviceKey: string };
const allowedOrigin = (origin: string) => origin === 'https://wyc3809.github.io' || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);

/** Edge服務專用資料庫存取；RLS禁止瀏覽器直接讀寫呢張表。 */
export function pairRepository(config: Config, fetcher: typeof fetch): PairRepository {
  const query = async (params: Record<string, string>, method = 'GET', body?: PairRoom): Promise<PairRoom[]> => {
    const response = await fetcher(`${config.url}/rest/v1/jianghu_pair_rooms?${new URLSearchParams(params)}`, {
      method, headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 409 && method === 'POST') return [];
    if (!response.ok) throw new OnlineError(503, '試場資料暫時未能儲存，請用同一指令重試。');
    return response.json();
  };
  const one = async (params: Record<string, string>) => (await query({ ...params, select: '*', limit: '1' }))[0] ?? null;
  return {
    load: id => one({ id: `eq.${id}` }),
    byInvite: invite => one({ invite: `eq.${invite}` }),
    byHost: user => one({ host_id: `eq.${user}` }),
    insert: async room => (await query({ select: 'id' }, 'POST', room)).length === 1,
    save: async (room, expected) => (await query({ id: `eq.${room.id}`, revision: `eq.${expected}`, select: 'id' }, 'PATCH', room)).length === 1,
  };
}

/** 真正驗證Supabase身份，再執行房間交易；唔接受前端自行指定account。 */
export function createPairHandler(config: Config, fetcher: typeof fetch = fetch) {
  const service = new PairService(pairRepository(config, fetcher), Date.now, () => ({ seed: crypto.getRandomValues(new Uint32Array(1))[0], battleId: crypto.randomUUID(), invite: crypto.randomUUID() }));
  return createOnlineHandler(config, service, fetcher);
}

/** 共用JWT／來源／內容長度驗證，權威服務自行處理所屬玩家。 */
export function createOnlineHandler(config: Config, service: { execute(user: string, raw: unknown): Promise<unknown> }, fetcher: typeof fetch = fetch) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin') ?? '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (allowedOrigin(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
    const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    try {
      if (origin && !allowedOrigin(origin)) throw new OnlineError(403, '呢個網址未開放試場。');
      if (request.method === 'OPTIONS') return response({ ok: true });
      if (request.method !== 'POST') throw new OnlineError(405, '只接受試場指令。');
      const auth = request.headers.get('Authorization');
      if (!auth?.startsWith('Bearer ')) throw new OnlineError(401, '請重新連接試玩身份。');
      const identity = await fetcher(`${config.url}/auth/v1/user`, { headers: { apikey: config.anonKey, Authorization: auth }, signal: AbortSignal.timeout(8_000) });
      if (!identity.ok) throw new OnlineError(identity.status >= 500 || identity.status === 429 ? 503 : 401, '暫時未能驗證試玩身份，請重試。');
      const user = z.object({ id: z.uuid() }).parse(await identity.json());
      const reader = request.body?.getReader();
      if (!reader) throw new OnlineError(400, '欠缺試場指令。');
      const chunks: Uint8Array[] = []; let length = 0;
      for (;;) {
        const next = await reader.read(); if (next.done) break;
        length += next.value.length;
        if (length > 16_384) { await reader.cancel(); throw new OnlineError(413, '指令內容太長。'); }
        chunks.push(next.value);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      const raw = JSON.parse(new TextDecoder().decode(bytes));
      return response(await service.execute(user.id, raw));
    } catch (e) {
      if (e instanceof OnlineError) return response({ error: e.message }, e.status);
      if (e instanceof z.ZodError || e instanceof SyntaxError) return response({ error: '指令格式不符，請重新操作。' }, 400);
      return response({ error: '江湖暫時未能回覆，稍後可用同一指令重試。' }, 503);
    }
  };
}
