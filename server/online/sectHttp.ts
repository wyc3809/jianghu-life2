import type {
  SectWarRepository,
  SectWarWorld,
  SectWarReport,
  SectWarReceipt,
} from "../../interfaces/sectWar";
import {
  lifeGameStateSchema,
  type LifeGameState,
} from "../../interfaces/lifeEngine";
import { migrateLifeState } from "../../core/life/gameState";
import { SectWarService } from "../../core/online/sectWar";
import { OnlineError } from "../../core/online/commands";
import { createOnlineHandler } from "./pairHttp";
type Config = { url: string; anonKey: string; serviceKey: string };
/** 門派名冊與戰報獨立CAS交易；RLS禁止前端直寫，只讀伺服器存檔快照。 */
export function sectWarRepository(
  config: Config,
  fetcher: typeof fetch,
): SectWarRepository {
  const request = async <T>(path: string, data?: unknown): Promise<T> => {
    const response = await fetcher(`${config.url}/rest/v1/${path}`, {
      method: data === undefined ? "GET" : "POST",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "application/json",
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new OnlineError(503, "會武資料暫時未能儲存，請用同一操作重試。");
    return response.json() as Promise<T>;
  };
  return {
    load: async () =>
      (
        await request<SectWarWorld[]>(
          "jianghu_sect_world?id=eq.1&select=revision,payload",
        )
      )[0],
    profiles: async (ids) => {
      const rows = await request<
        { user_id: string; payload: { life: unknown } }[]
      >(
        `saves?user_id=in.(${ids.map(encodeURIComponent).join(",")})&select=user_id,payload`,
      );
      const out: Record<string, LifeGameState> = {};
      for (const row of rows) {
        const parsed = lifeGameStateSchema.safeParse(row.payload.life);
        if (parsed.success) out[row.user_id] = migrateLifeState(parsed.data);
      }
      return out;
    },
    receipt: async (user, id) =>
      (
        await request<SectWarReceipt[]>(
          `jianghu_sect_receipts?user_id=eq.${encodeURIComponent(user)}&request_id=eq.${encodeURIComponent(id)}&select=user_id,request_id,input,result`,
        )
      )[0] ?? null,
    report: async (id) =>
      (
        await request<{ payload: SectWarReport }[]>(
          `jianghu_sect_reports?id=eq.${encodeURIComponent(id)}&select=payload`,
        )
      )[0]?.payload ?? null,
    save: (world, expected, report, receipt) =>
      request<boolean>("rpc/commit_jianghu_sect", {
        p_expected: expected,
        p_payload: world.payload,
        p_report: report,
        p_receipt: receipt,
      }),
  };
}
/** 延用真正JWT驗證、來源白名單及請求長度限制；不接受前端提交人物、隊伍或戰果。 */
export function createSectWarHandler(
  config: Config,
  fetcher: typeof fetch = fetch,
) {
  return createOnlineHandler(
    config,
    new SectWarService(sectWarRepository(config, fetcher), Date.now, () => ({
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
      id: crypto.randomUUID(),
    })),
    fetcher,
  );
}
