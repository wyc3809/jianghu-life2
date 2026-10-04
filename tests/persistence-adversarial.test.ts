import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createNewLife, migrateLifeState } from '../core/life/gameState';
import { persistLife, saveLifeToIndexedDb, loadLifeFromIndexedDb, saveLifeToLocalStorage, loadLifeSave, clearLifeSave, getLifeSaveError } from '../core/life/saveIndexedDb';

describe('local persistence acceptance checks', () => {
  let data: Map<string, string>;
  beforeEach(() => {
    data = new Map();
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('round trips a real game through both storage layers', async () => {
    const state = createNewLife({ seed: 42 });
    await persistLife(state);
    expect((await loadLifeSave())?.state).toEqual(migrateLifeState(structuredClone(state)));
  });

  it('still saves to IndexedDB when localStorage is unavailable or full', async () => {
    localStorage.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); };
    const state = createNewLife({ seed: 42 });
    let error: unknown;
    try { await persistLife(state); } catch (e) { error = e; }
    expect({ error: Boolean(error), saved: Boolean(await loadLifeFromIndexedDb()) }).toEqual({ error: false, saved: true });
  });

  it('loads the newer localStorage copy after an IndexedDB write failure', async () => {
    const state = createNewLife({ seed: 42 });
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    await saveLifeToIndexedDb(state);
    state.character.money += 123;
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    saveLifeToLocalStorage(state);
    const loaded = await loadLifeSave();
    vi.restoreAllMocks();
    expect(loaded?.state.character.money).toBe(state.character.money);
  });

  it('falls back from an invalid IndexedDB record to valid localStorage', async () => {
    const state = createNewLife({ seed: 42 });
    saveLifeToLocalStorage(state);
    await saveLifeToIndexedDb(state);
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open('jianghu_life_v1', 1);
      req.onsuccess = () => resolve(req.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put({ version: 1, savedAt: 0, state: { broken: true } }, 'current');
      tx.oncomplete = () => resolve();
    });
    expect((await loadLifeSave())?.state).toEqual(migrateLifeState(structuredClone(state)));
  });

  it('reports both storage failures and clears the warning after retry succeeds', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const write = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('full'); };
    const state = createNewLife({ seed: 42 });
    await expect(persistLife(state)).rejects.toThrow('未能儲存');
    expect(getLifeSaveError()).toContain('未能儲存');
    localStorage.setItem = write;
    await persistLife(state);
    expect(getLifeSaveError()).toBeNull();
  });

  it('keeps the latest of rapid writes and does not resurrect progress after clearing', async () => {
    const state = createNewLife({ seed: 42 });
    const writes: Promise<void>[] = [];
    for (let i = 0; i < 15; i++) {
      state.character.money = i;
      writes.push(persistLife(state));
    }
    await Promise.all(writes);
    expect((await loadLifeFromIndexedDb())?.state.character.money).toBe(14);
    expect((await loadLifeSave())?.state.character.money).toBe(14);
    const writing = persistLife(state);
    await clearLifeSave();
    await writing;
    expect(await loadLifeSave()).toBeNull();
  });
});
