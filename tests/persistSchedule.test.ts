import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { getLifeSaveError, loadLifeSave } from '../core/life/saveIndexedDb';
import { discardPendingPersist, flushPersist, schedulePersist } from '../src/store/persistSchedule';

vi.mock('../src/cloud/sync', () => ({ queueCloudSync: vi.fn(), flushCloudSync: vi.fn() }));

describe('save scheduling under storage failure', () => {
  let data: Map<string, string>;
  beforeEach(() => {
    data = new Map();
    vi.stubGlobal('indexedDB', undefined);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
    });
  });
  afterEach(() => { discardPendingPersist(); vi.unstubAllGlobals(); });

  it('writes synchronously on flush so pagehide has a local copy before returning', () => {
    const state = createNewLife({ seed: 42 });
    schedulePersist(state);
    flushPersist();
    expect(JSON.parse(data.get('jianghu_life_v1_ls')!).state.character.name).toBe(state.character.name);
  });

  it('retains only the newest failed snapshot for retry', async () => {
    const write = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('storage full'); };
    schedulePersist(createNewLife({ seed: 42 }), { immediate: true });
    const newest = createNewLife({ seed: 43, name: '新進度' });
    schedulePersist(newest, { immediate: true });
    await vi.waitFor(() => expect(getLifeSaveError()).not.toBeNull());
    localStorage.setItem = write;
    flushPersist();
    await vi.waitFor(() => expect(getLifeSaveError()).toBeNull());
    expect((await loadLifeSave())?.state.character.name).toBe('新進度');
  });

  it('does not retry a failed old life after the user clears it', async () => {
    localStorage.setItem = () => { throw new Error('storage full'); };
    schedulePersist(createNewLife({ seed: 42 }), { immediate: true });
    discardPendingPersist();
    await new Promise(resolve => setTimeout(resolve, 0));
    localStorage.setItem = (key: string, value: string) => { data.set(key, value); };
    flushPersist();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(data.has('jianghu_life_v1_ls')).toBe(false);
  });
});
