import { cloudAccess } from './cloud';

export const publicOnline = import.meta.env.VITE_ONLINE_PUBLIC === '1';
const JOINED = 'jianghu-world-joined';
const clientId = crypto.randomUUID();

/** 同一瀏覽器保留入籍提示；真正身份仍由Supabase JWT決定。 */
export function worldJoined(): boolean {
  try { return localStorage.getItem(JOINED) === '1'; } catch { return false; }
}

/** 離場唔刪身份；只有認證失效或尚未入籍先重顯入籍入口。 */
export function forgetWorldHint(): void {
  try { localStorage.removeItem(JOINED); } catch { /* 私密瀏覽後備 */ }
}

/** 共用非同步江湖：每次由SDK取得最新JWT，唔發送房間／帳戶選擇。 */
export async function publicOnlineRequest(path: string, data: unknown, keepalive: boolean): Promise<Response> {
  if(path==='login'||path==='challenge') {
    const [{useLifeStore},{saveProfileForOnline}]=await Promise.all([import('../store/lifeStore'),import('./sync')]);
    const state=useLifeStore.getState().state;
    if(!state || !await saveProfileForOnline(state))throw new Error('對戰配搭尚未保存，請待連線恢復後再試。');
  }
  const access = await cloudAccess();
  if (!access) throw new Error('暫時無法驗證雲端身份，請稍後重試。');
  const action = path === 'login' ? 'register' : path;
  const response = await fetch(`${access.url}/functions/v1/jianghu-world`, {
    method: 'POST', headers: { Authorization: `Bearer ${access.token}`, apikey: access.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, clientId, data: data ?? {} }),
    signal: AbortSignal.timeout(15_000), keepalive,
  });
  if (response.ok && path === 'login') {
    try { localStorage.setItem(JOINED, '1'); } catch { /* 本頁仍可繼續玩 */ }
  }
  return response;
}
