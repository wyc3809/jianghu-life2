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

export type CloudSyncStatus = 'idle' | 'pending' | 'uploading' | 'synced' | 'retrying';
let syncStatus: CloudSyncStatus = 'idle';
const statusListeners = new Set<() => void>();

export function getCloudSyncStatus(): CloudSyncStatus { return syncStatus; }
export function subscribeCloudSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => { statusListeners.delete(listener); };
}
function setCloudSyncStatus(status: CloudSyncStatus): void {
  if (syncStatus === status) return;
  syncStatus = status;
  for (const listener of statusListeners) listener();
}

let pending: CloudSavePayload | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let flushRequested = false;
let restoring = false;
let lastUploadAt = 0;
const submittedLives = new Set<string>();

function scheduleUpload(delay: number): void {
  if (timer || restoring) return;
  timer = setTimeout(() => {
    timer = null;
    void uploadNow();
  }, delay);
}

async function uploadNow(): Promise<void> {
  if (inFlight || restoring || !pending) return;
  const payload = pending;
  pending = null;
  setCloudSyncStatus('uploading');
  lastUploadAt = Date.now();
  let succeeded = false;
  inFlight = (async () => {
    try {
      succeeded = await uploadSave(payload);
      if (!succeeded) return;
      const state = payload.life;
      if (state?.character.alive && state.phase === 'playing') succeeded = await submitLive(state);
      if (state?.phase === 'summary') {
        const key = lifeKey(state);
        if (!submittedLives.has(key)) {
          const scored = await submitLifeScore(state);
          if (scored) submittedLives.add(key);
          else succeeded = false;
        }
      }
    } catch {
      succeeded = false;
      // 網絡例外同回傳 false 一樣：保留 snapshot 供重試。
    }
  })();
  await inFlight;
  inFlight = null;
  if (!succeeded && !pending) pending = payload;
  setCloudSyncStatus(!succeeded ? 'retrying' : pending ? 'pending' : 'synced');
  if (pending) scheduleUpload(flushRequested ? 0 : succeeded ? UPLOAD_INTERVAL_MS : 5_000);
  flushRequested = false;
}

/** Snapshot 喺排隊時固定，失敗保留，單一上傳避免舊進度最後蓋過新進度。 */
export function queueCloudSync(state: LifeGameState | null): void {
  if (!cloudConfigured()) return;
  pending = { version: 1, savedAt: Date.now(), life: state, ancestry: readAncestryRaw() };
  if (inFlight) return;
  setCloudSyncStatus('pending');
  if (state?.phase === 'summary' && timer) { clearTimeout(timer); timer = null; }
  scheduleUpload(state?.phase === 'summary' ? 0 : Math.max(0, UPLOAD_INTERVAL_MS - (Date.now() - lastUploadAt)));
}

export function flushCloudSync(): void {
  if (!cloudConfigured()) return;
  if (timer) { clearTimeout(timer); timer = null; }
  if (inFlight) { flushRequested = true; return; }
  void uploadNow();
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
  let expired = false;
  let writing = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const work = (async (): Promise<BootResult> => {
    const initialLocalAt = await readLocalSavedAt();
    const id = await ensureIdentity();
    if (!id || expired) return { restored: false };
    const row = await downloadSave();
    if (!row?.payload || expired) return { restored: false };
    const localAt = await readLocalSavedAt();
    if (expired || localAt !== initialLocalAt) return { restored: false };
    const cloudAt = row.payload.savedAt ?? Date.parse(row.saved_at);
    if (!Number.isFinite(cloudAt) || (localAt != null && cloudAt <= localAt + NEWER_MARGIN_MS)) return { restored: false };
    writing = true;
    await writeLocal(row.payload.life, row.payload.ancestry);
    lastUploadAt = Date.now();
    return { restored: true };
  })();
  const timeout = new Promise<BootResult>((resolve) => {
    timeoutHandle = setTimeout(() => {
      // 寫盤已開始就等完成；唔會放玩家入遊戲同時喺背景覆蓋。
      if (writing) return;
      expired = true;
      resolve({ restored: false });
    }, timeoutMs);
  });
  try { return await Promise.race([work.catch(() => ({ restored: false })), timeout]); }
  finally { clearTimeout(timeoutHandle); }
}

/** 設定頁「由雲端載入」：唔理新舊，強制覆蓋本機 */
export async function restoreFromCloud(
  writeLocal: (life: LifeGameState | null, ancestry: string | null) => Promise<void>,
): Promise<boolean> {
  restoring = true;
  if (timer) { clearTimeout(timer); timer = null; }
  try {
    await inFlight;
    const row = await downloadSave();
    if (!row?.payload) return false;
    await writeLocal(row.payload.life, row.payload.ancestry);
    pending = null;
    return true;
  } finally {
    restoring = false;
    if (pending) scheduleUpload(UPLOAD_INTERVAL_MS);
  }
}
