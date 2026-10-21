import { cloudAccess } from './cloud';
import type { OnlineSnapshot } from '@interfaces/online';

export const publicOnline = import.meta.env.VITE_ONLINE_PUBLIC === '1';
const ROOM = 'jianghu-pair-room';
const clientId = crypto.randomUUID();
// 每頁獨立租約及房間；另一分頁接受新邀請，唔會搬走本頁或改變指令目標。
let activeRoom: string | null = null;
try { activeRoom = localStorage.getItem(ROOM); } catch { /* 私密瀏覽後備 */ }

/** 邀請只存在URL片段，唔作HTTP referrer傳去其他網站。 */
export function pairInvite(): string {
  return new URLSearchParams(window.location.hash.slice(1)).get('invite') ?? '';
}
/** 本頁已綁定嘅房間；其他分頁唔能改寫本頁指令目標。 */
export function pairRoomId(): string | null {
  return activeRoom;
}

/** 使用現有Supabase身份，JWT每次向SDK取得最新值；唔另建可冒認角色嘅登入。 */
export async function publicOnlineRequest(path: string, data: unknown, keepalive: boolean): Promise<Response> {
  const access = await cloudAccess();
  if (!access) throw new Error('暫時連唔到雲端身份，請稍後重試。');
  let action = path, payload = data ?? {};
  if (path === 'login') {
    const login = payload as { action: string; invite?: string };
    action = login.action; payload = login.invite ? { invite: login.invite } : {};
  }
  const response = await fetch(`${access.url}/functions/v1/jianghu-pair`, {
    method: 'POST', headers: { Authorization: `Bearer ${access.token}`, apikey: access.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, roomId: pairRoomId(), clientId, data: payload }),
    signal: AbortSignal.timeout(15_000), keepalive,
  });
  if (response.ok && path === 'login') {
    const snapshot = await response.clone().json() as OnlineSnapshot;
    if (snapshot.room) {
      activeRoom = snapshot.room.id;
      try { localStorage.setItem(ROOM, snapshot.room.id); } catch { /* 本頁仍可繼續玩 */ }
    }
  }
  return response;
}
