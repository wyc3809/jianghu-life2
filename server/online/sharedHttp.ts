import { SharedWorldService, type SharedRepository, type SharedWorld, type WorldReceipt } from '../../core/online/sharedWorld';
import type { OnlineBattle } from '../../interfaces/online';
import { OnlineError } from '../../core/online/commands';
import { createOnlineHandler } from './pairHttp';
import { lifeGameStateSchema } from '../../interfaces/lifeEngine';
import { migrateLifeState } from '../../core/life/gameState';

type Config = { url: string; anonKey: string; serviceKey: string };
/** 世界、收據及戰報分開儲存；只喺一個Postgres RPC交易內提交。 */
export function sharedRepository(config: Config, fetcher: typeof fetch): SharedRepository {
  const request = async <T>(path: string, data?: unknown): Promise<T> => {
    const response = await fetcher(`${config.url}/rest/v1/${path}`, { method: data === undefined ? 'GET' : 'POST',
      headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new OnlineError(503, '江湖資料暫時未能儲存，請用同一指令重試。');
    return response.json() as Promise<T>;
  };
  return {
    profile: async user => {
      const rows=await request<{payload:{life:unknown}}[]>(`saves?user_id=eq.${encodeURIComponent(user)}&select=payload`);
      const parsed=lifeGameStateSchema.safeParse(rows[0]?.payload.life);
      if(!parsed.success||parsed.data.phase!=='playing'||!parsed.data.character.alive)return null;
      const hasDuel=parsed.data.character.combatLoadout!==undefined;
      const character=migrateLifeState(parsed.data).character;character.flags.cloud_has_duel_preset=hasDuel;return character;
    },
    load: async () => (await request<SharedWorld[]>('jianghu_world?id=eq.1&select=revision,payload'))[0],
    receipt: async (user, id) => (await request<WorldReceipt[]>(`jianghu_world_receipts?user_id=eq.${user}&request_id=eq.${encodeURIComponent(id)}&select=user_id,request_id,input,result`))[0] ?? null,
    history: async user => (await request<{ payload: OnlineBattle }[]>(`jianghu_world_battles?or=(attacker.eq.${user},defender.eq.${user})&order=started_at.desc,id.desc&limit=10&select=payload`)).map(r => r.payload),
    confirmed: async user => (await request<{ request_id: string }[]>(`jianghu_world_receipts?user_id=eq.${user}&order=created_at.desc&limit=20&select=request_id`)).map(r => r.request_id),
    save: (state, expected, battles, receipt) => request<boolean>('rpc/commit_jianghu_world', { p_expected: expected, p_payload: state.payload, p_battles: battles, p_receipt: receipt }),
  };
}

/** 非同步共用江湖HTTP入口；對方離線亦可挑戰。 */
export function createSharedHandler(config: Config, fetcher: typeof fetch = fetch) {
  const service = new SharedWorldService(sharedRepository(config, fetcher), Date.now, () => ({ seed: crypto.getRandomValues(new Uint32Array(1))[0], battleId: crypto.randomUUID() }));
  return createOnlineHandler(config, service, fetcher);
}
