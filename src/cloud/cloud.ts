/**
 * 雲端（Supabase）：匿名身份＋可綁電郵、雲端存檔、排行榜。
 * 設計見 docs/architecture/adr-003-cloud-supabase.md。
 *
 * - 未設定 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY → 全部功能靜默停用（cloudConfigured() 為 false）
 * - SDK 按需載入（dynamic import），唔拖慢首屏
 * - 網絡失敗一律吞掉、記 lastError，唔影響本機存檔同遊玩
 */
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { liveBoardEntry, lifeScoreEntry } from '@core/life/leaderboardScore';
import { APP_VERSION } from '../version';

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export function cloudConfigured(): boolean {
  return Boolean(URL && ANON_KEY);
}

let clientPromise: Promise<SupabaseClient> | null = null;

function client(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL, ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        global: {
          fetch: (input, init) => fetch(input, {
            ...init,
            signal: init?.signal
              ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)])
              : AbortSignal.timeout(15_000),
          }),
        },
      }),
    );
  }
  return clientPromise;
}

export interface CloudIdentity {
  userId: string;
  /** 已綁定（確認咗）嘅電郵；匿名身份為 null */
  email: string | null;
  /** 已提交、等緊確認嘅電郵 */
  pendingEmail: string | null;
  anonymous: boolean;
}

function toIdentity(u: User): CloudIdentity {
  return {
    userId: u.id,
    email: u.email && !u.is_anonymous ? u.email : null,
    pendingEmail: u.new_email ?? null,
    anonymous: Boolean(u.is_anonymous),
  };
}

let identityPromise: Promise<CloudIdentity | null> | null = null;

/** 取得身份：已有 session 就用返，冇就開匿名身份 */
export function ensureIdentity(): Promise<CloudIdentity | null> {
  if (!cloudConfigured()) return Promise.resolve(null);
  if (!identityPromise) {
    identityPromise = (async () => {
      const sb = await client();
      const { data } = await sb.auth.getSession();
      if (data.session?.user) return toIdentity(data.session.user);
      const { data: anon, error } = await sb.auth.signInAnonymously();
      if (error || !anon.user) throw error ?? new Error('anonymous sign-in failed');
      return toIdentity(anon.user);
    })().catch((e) => {
      identityPromise = null;
      noteError(e);
      return null;
    });
  }
  return identityPromise;
}

/** 重新讀身份（綁定電郵確認後） */
export async function refreshIdentity(): Promise<CloudIdentity | null> {
  if (!cloudConfigured()) return null;
  const sb = await client();
  const { data } = await sb.auth.getUser();
  identityPromise = Promise.resolve(data.user ? toIdentity(data.user) : null);
  return identityPromise;
}

let lastError = '';
function noteError(e: unknown) {
  lastError = e instanceof Error ? e.message : String(e ?? '');
}
export function cloudLastError(): string {
  return lastError;
}

function redirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}`;
}

/** 匿名身份綁定電郵：寄確認信，確認後同一個身份變永久（存檔、榜位都跟住） */
export async function linkEmail(email: string): Promise<{ ok: boolean; message: string }> {
  if (!(await ensureIdentity())) return { ok: false, message: '連唔到雲端。' };
  const sb = await client();
  const { error } = await sb.auth.updateUser({ email }, { emailRedirectTo: redirectUrl() });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `確認信已寄去 ${email}，撳信入面條連結就綁定完成。` };
}

/** 換機：用已綁定嘅電郵登入（寄魔法連結） */
export async function signInWithEmail(email: string): Promise<{ ok: boolean; message: string }> {
  if (!cloudConfigured()) return { ok: false, message: '雲端未設定。' };
  const sb = await client();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectUrl() },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `登入連結已寄去 ${email}，喺呢部機撳開就會載入雲端存檔。` };
}

export async function signOut(): Promise<void> {
  if (!cloudConfigured()) return;
  const sb = await client();
  await sb.auth.signOut();
  identityPromise = null;
}

// ───────── 雲端存檔 ─────────

export interface CloudSavePayload {
  version: 1;
  savedAt: number;
  life: LifeGameState | null;
  /** 祖蔭（localStorage jianghu_ancestry_v1 原文） */
  ancestry: string | null;
}

export interface CloudSaveRow {
  payload: CloudSavePayload;
  saved_at: string;
  app_version: string;
}

export async function uploadSave(payload: CloudSavePayload): Promise<boolean> {
  const id = await ensureIdentity();
  if (!id) return false;
  try {
    const sb = await client();
    const { error } = await sb.from('saves').upsert({
      user_id: id.userId,
      payload,
      app_version: APP_VERSION,
      saved_at: new Date(payload.savedAt).toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (e) {
    noteError(e);
    return false;
  }
}

export async function downloadSave(): Promise<CloudSaveRow | null> {
  const id = await ensureIdentity();
  if (!id) return null;
  try {
    const sb = await client();
    const { data, error } = await sb
      .from('saves')
      .select('payload, saved_at, app_version')
      .eq('user_id', id.userId)
      .maybeSingle();
    if (error) throw error;
    return (data as CloudSaveRow | null) ?? null;
  } catch (e) {
    noteError(e);
    return null;
  }
}

// ───────── 排行榜 ─────────

export async function submitLive(state: LifeGameState): Promise<boolean> {
  const id = await ensureIdentity();
  if (!id) return false;
  try {
    const sb = await client();
    const { error } = await sb
      .from('leaderboard_live')
      .upsert({ user_id: id.userId, ...liveBoardEntry(state), updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  } catch (e) {
    noteError(e);
    return false;
  }
}

export async function submitLifeScore(state: LifeGameState): Promise<boolean> {
  const id = await ensureIdentity();
  if (!id) return false;
  try {
    const sb = await client();
    const { error } = await sb
      .from('life_scores')
      .upsert({ user_id: id.userId, ...lifeScoreEntry(state) }, { onConflict: 'user_id,life_key', ignoreDuplicates: true });
    if (error) throw error;
    return true;
  } catch (e) {
    noteError(e);
    return false;
  }
}

export type BoardKind = 'rank' | 'cultivation' | 'life';

export interface BoardRow {
  userId: string;
  name: string;
  /** 主數值顯示（第 N 位／境界名／分數） */
  value: number;
  sub: number;
  age: number;
}

export const BOARD_LIMIT = 50;

export async function fetchBoard(kind: BoardKind): Promise<BoardRow[] | null> {
  if (!cloudConfigured()) return null;
  try {
    const sb = await client();
    if (kind === 'life') {
      const { data, error } = await sb
        .from('life_scores')
        .select('user_id, name, score, age, cult_tier')
        .order('score', { ascending: false })
        .limit(BOARD_LIMIT);
      if (error) throw error;
      return (data ?? []).map((r) => ({ userId: r.user_id, name: r.name, value: r.score, sub: r.cult_tier, age: r.age }));
    }
    const q = sb.from('leaderboard_live').select('user_id, name, jianghu_rank, cult_tier, cult_xp, age');
    const { data, error } =
      kind === 'rank'
        ? await q.order('jianghu_rank', { ascending: true }).limit(BOARD_LIMIT)
        : await q.order('cult_tier', { ascending: false }).order('cult_xp', { ascending: false }).limit(BOARD_LIMIT);
    if (error) throw error;
    return (data ?? []).map((r) =>
      kind === 'rank'
        ? { userId: r.user_id, name: r.name, value: r.jianghu_rank, sub: r.cult_tier, age: r.age }
        : { userId: r.user_id, name: r.name, value: r.cult_tier, sub: Number(r.cult_xp), age: r.age },
    );
  } catch (e) {
    noteError(e);
    return null;
  }
}
