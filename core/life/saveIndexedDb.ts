import { lifeGameStateSchema, type LifeGameState } from '@interfaces/lifeEngine';
import { migrateLifeState } from './gameState';

const DB_NAME = 'jianghu_life_v1';
const STORE = 'saves';
const KEY = 'current';
const LS_KEY = 'jianghu_life_v1_ls';
let lastSavedAt = 0;
let idbWrites: Promise<unknown> = Promise.resolve();
let saveError: string | null = null;
/** 最近一次成功存到本機（任一方式）嘅時間；0＝未有 */
let lastOkAt = 0;
const statusListeners = new Set<() => void>();

/** 最近成功存檔時間（ms epoch），設定頁顯示用；未存過＝0 */
export function getLastLocalSaveAt(): number {
  return lastOkAt;
}

function markSavedOk(at: number): void {
  if (at <= lastOkAt) return;
  lastOkAt = at;
  for (const listener of statusListeners) listener();
}

/** 本機兩種保存方式都失敗時，介面顯示提醒而唔會假裝已存檔。 */
export function getLifeSaveError(): string | null {
  return saveError;
}

/** 訂閱儲存狀態；返回取消訂閱函數。 */
export function subscribeLifeSaveStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => { statusListeners.delete(listener); };
}

function setSaveError(error: string | null): void {
  if (saveError === error) return;
  saveError = error;
  for (const listener of statusListeners) listener();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export interface LifePersistedSave {
  version: 1;
  savedAt: number;
  state: LifeGameState;
}

function normalize(state: LifeGameState): LifeGameState {
  return migrateLifeState(lifeGameStateSchema.parse(state) as LifeGameState);
}

function makePayload(state: LifeGameState): LifePersistedSave {
  lastSavedAt = Math.max(Date.now(), lastSavedAt + 1);
  return { version: 1, savedAt: lastSavedAt, state: normalize(state) };
}

function parsePayload(raw: unknown): LifePersistedSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as LifePersistedSave;
  if (value.version !== 1 || !Number.isFinite(value.savedAt) || value.savedAt < 0 || !value.state) return null;
  try {
    return { version: 1, savedAt: value.savedAt, state: normalize(value.state) };
  } catch {
    return null;
  }
}

async function writeIndexedDb(payload: LifePersistedSave): Promise<void> {
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB unavailable');
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(payload, KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

/** 保存一份獨立 IndexedDB snapshot（一般遊戲流程使用 persistLife）。 */
export async function saveLifeToIndexedDb(state: LifeGameState): Promise<void> {
  await writeIndexedDb(makePayload(state));
}

export async function loadLifeFromIndexedDb(): Promise<LifePersistedSave | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => {
      resolve(parsePayload(req.result));
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = tx.onabort = () => db.close();
  });
}

export async function clearLifeIndexedDb(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export function saveLifeToLocalStorage(state: LifeGameState): void {
  if (typeof localStorage === 'undefined') throw new Error('localStorage unavailable');
  localStorage.setItem(LS_KEY, JSON.stringify(makePayload(state)));
}

export function loadLifeFromLocalStorage(): LifePersistedSave | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return parsePayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function persistLife(state: LifeGameState): Promise<void> {
  const payload = makePayload(state);
  let localSaved = false;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    localSaved = true;
  } catch {
    /* 獨立嘗試 IndexedDB；localStorage 配額／私隱限制唔會阻止另一份保存。 */
  }
  // 保持 IDB 寫入次序，避免較慢嘅舊 snapshot 最後覆蓋新一份。
  const write = idbWrites.catch(() => {}).then(() => writeIndexedDb(payload));
  idbWrites = write;
  let idbSaved = false;
  try { await write; idbSaved = true; } catch { /* localStorage may have succeeded */ }
  if (localSaved || idbSaved) { setSaveError(null); markSavedOk(payload.savedAt); return; }
  const message = '進度暫時未能儲存，請保持此頁開啟，再試一次。';
  setSaveError(message);
  throw new Error(message);
}

export async function loadLifeSave(): Promise<LifePersistedSave | null> {
  const local = loadLifeFromLocalStorage();
  try {
    const idb = await loadLifeFromIndexedDb();
    const newest = !idb ? local : !local || idb.savedAt >= local.savedAt ? idb : local;
    if (newest) {
      lastSavedAt = Math.max(lastSavedAt, newest.savedAt);
      markSavedOk(newest.savedAt);
    }
    return newest;
  } catch {
    /* fall through */
  }
  if (local) {
    lastSavedAt = Math.max(lastSavedAt, local.savedAt);
    markSavedOk(local.savedAt);
  }
  return local;
}

export async function clearLifeSave(): Promise<void> {
  await idbWrites.catch(() => {});
  try { localStorage.removeItem(LS_KEY); } catch { /* IndexedDB still needs clearing */ }
  try {
    await clearLifeIndexedDb();
  } catch {
    /* ignore */
  }
  setSaveError(null);
}
