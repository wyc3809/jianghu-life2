/**
 * 雲端同步編排：本機存檔照舊（IndexedDB＋localStorage），雲端係後備＋換機用。
 * - 寫盤後排隊上傳（節流：最多每 45 秒一次，頁面隱藏時沖刷）
 * - 開機：雲端存檔比本機新 → 用雲端（換機／清咗瀏覽器都揾得返）
 * - 一世完結：一生榜記一次
 */
import type { LifeGameState } from '@interfaces/lifeEngine';
import { lifeKey } from '@core/life/leaderboardScore';
import {
  cloudConfigured,
  downloadSave,
  ensureIdentity,
  submitLifeScore,
  submitLive,
  uploadSave,
  type CloudSavePayload,
} from './cloud';

const ANCESTRY_KEY = 'jianghu_ancestry_v1';
const UPLOAD_INTERVAL_MS = 45_000;
/** 時鐘誤差容忍：雲端要新過本機呢個數先當係「較新」 */
const NEWER_MARGIN_MS = 5_000;

function readAncestryRaw(): string | null {
  try {
    return localStorage.getItem(ANCESTRY_KEY);
  } catch {
    return null;
  }
}

let pending: LifeGameState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastUploadAt = 0;
const submittedLives = new Set<string>();

async function uploadNow(state: LifeGameState): Promise<void> {
  pending = null;
  lastUploadAt = Date.now();
  const payload: CloudSavePayload = { version: 1, savedAt: Date.now(), life: state, ancestry: readAncestryRaw() };
  await uploadSave(payload);
  if (state.character.alive && state.phase === 'playing') {
    await submitLive(state);
  }
  if (state.phase === 'summary') {
    const key = lifeKey(state);
    if (!submittedLives.has(key) && (await submitLifeScore(state))) submittedLives.add(key);
  }
}

/** 本機寫盤後叫：節流上傳 */
export function queueCloudSync(state: LifeGameState): void {
  if (!cloudConfigured()) return;
  pending = state;
  if (timer) return;
  const wait = Math.max(0, UPLOAD_INTERVAL_MS - (Date.now() - lastUploadAt));
  // 一世完結即刻上傳，唔等節流
  const delay = state.phase === 'summary' ? 0 : wait;
  timer = setTimeout(() => {
    timer = null;
    if (pending) void uploadNow(pending);
  }, delay);
}

export function flushCloudSync(): void {
  if (!cloudConfigured() || !pending) return;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  void uploadNow(pending);
}

export interface BootResult {
  restored: boolean;
}

/**
 * 開機：確保身份（亦會處理電郵登入連結帶返嚟嘅 session），
 * 雲端存檔較新就寫返落本機。最多等 timeoutMs，唔好卡住首屏。
 */
export async function bootCloud(
  readLocalSavedAt: () => Promise<number | null>,
  writeLocal: (life: LifeGameState | null, ancestry: string | null) => Promise<void>,
  timeoutMs = 2500,
): Promise<BootResult> {
  if (!cloudConfigured()) return { restored: false };
  const work = (async (): Promise<BootResult> => {
    const id = await ensureIdentity();
    if (!id) return { restored: false };
    const [row, localAt] = await Promise.all([downloadSave(), readLocalSavedAt()]);
    if (!row?.payload) return { restored: false };
    const cloudAt = row.payload.savedAt ?? Date.parse(row.saved_at);
    if (localAt != null && cloudAt <= localAt + NEWER_MARGIN_MS) return { restored: false };
    await writeLocal(row.payload.life, row.payload.ancestry);
    lastUploadAt = Date.now();
    return { restored: true };
  })();
  const timeout = new Promise<BootResult>((r) => setTimeout(() => r({ restored: false }), timeoutMs));
  return Promise.race([work.catch(() => ({ restored: false })), timeout]);
}

/** 設定頁「由雲端載入」：唔理新舊，強制覆蓋本機 */
export async function restoreFromCloud(
  writeLocal: (life: LifeGameState | null, ancestry: string | null) => Promise<void>,
): Promise<boolean> {
  const row = await downloadSave();
  if (!row?.payload) return false;
  await writeLocal(row.payload.life, row.payload.ancestry);
  return true;
}
