import { cloudAccess } from "./cloud";
import { useLifeStore } from "../store/lifeStore";
import { saveProfileForOnline } from "./sync";
type Action = "overview" | "join" | "selection" | "challenge" | "report";
/** 會武只傳操作意圖；同一未回覆指令跨切頁／重開沿用編號，前端不提交快照或勝負。 */
export async function sectWarRequest<T>(
  action: Action,
  data: Record<string, unknown> = {},
): Promise<T> {
  const mutation = !["overview", "report"].includes(action);
  const access = await cloudAccess();
  if (!access) throw new Error("請先在設定連接雲端身份。");
  if (mutation) {
    const state = useLifeStore.getState().state;
    if (!state || !(await saveProfileForOnline(state)))
      throw new Error("對戰配搭尚未保存，請恢復連線後重試。");
  }
  const key = `jianghu-sect-pending:${access.url}:${action}`,
    signature = JSON.stringify(data);
  let requestId: string | undefined;
  if (mutation) {
    try {
      const old = JSON.parse(localStorage.getItem(key) ?? "null");
      requestId =
        old?.signature === signature ? old.requestId : crypto.randomUUID();
      localStorage.setItem(key, JSON.stringify({ signature, requestId }));
    } catch {
      requestId = crypto.randomUUID();
    }
  }
  const response = await fetch(`${access.url}/functions/v1/jianghu-sect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access.token}`,
      apikey: access.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, data, ...(requestId ? { requestId } : {}) }),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json().catch(() => null);
  if (mutation && (response.ok || response.status < 500)) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 不影響伺服器收據 */
    }
  }
  if (!response.ok || !result)
    throw new Error(result?.error ?? "會武暫時未能連線，請用原操作重試。");
  return result as T;
}
