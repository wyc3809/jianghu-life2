export class OnlineApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

/** 本機同源API；伺服器未回覆時保留原請求編號供安全重試。 */
export async function onlineRequest<T>(path: string, token: string | null, data?: unknown, keepalive = false): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/jianghu/' + path, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(8_000), keepalive,
    });
  } catch { throw new OnlineApiError('暫時連唔到本機江湖，恢復連線後可重試。'); }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new OnlineApiError(result?.error ?? '本機江湖未能回覆。', response.status);
  return result as T;
}

/** 只有已知結果先清除請求；遺失回覆／重開頁後重試仍用同一指令。 */
export async function onlineCommand<T>(path: string, token: string, payload: Record<string, unknown>): Promise<T> {
  const key = 'jianghu-online-pending:' + path;
  const signature = JSON.stringify({ token, payload });
  let requestId: string;
  try {
    const old = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    requestId = old?.signature === signature ? old.requestId : crypto.randomUUID();
    sessionStorage.setItem(key, JSON.stringify({ signature, requestId }));
  } catch { requestId = crypto.randomUUID(); }
  try {
    const result = await onlineRequest<T>(path, token, { ...payload, requestId });
    sessionStorage.removeItem(key); return result;
  } catch (error) {
    if (error instanceof OnlineApiError && error.status && error.status < 500) sessionStorage.removeItem(key);
    throw error;
  }
}

/** 回覆遺失但新快照已確認收據時，完成重試狀態，下一次點擊可發起新動作。 */
export function confirmOnlineCommands(ids: string[]) {
  for (const path of ['challenge', 'claim', 'loadout']) {
    const key = 'jianghu-online-pending:' + path;
    try {
      const pending = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (pending && ids.includes(pending.requestId)) sessionStorage.removeItem(key);
    } catch { /* 儲存不可用時仍可讀取伺服器結果 */ }
  }
}
