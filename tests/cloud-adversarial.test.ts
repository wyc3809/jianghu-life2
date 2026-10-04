import { createNewLife } from '../core/life/gameState';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  configured: true,
  download: vi.fn(), upload: vi.fn(), live: vi.fn(), score: vi.fn(),
}));
vi.mock('../src/cloud/cloud', () => ({
  cloudConfigured: () => mock.configured,
  ensureIdentity: async () => ({ userId: 'test' }),
  downloadSave: (...args: unknown[]) => mock.download(...args),
  uploadSave: (...args: unknown[]) => mock.upload(...args),
  submitLive: (...args: unknown[]) => mock.live(...args),
  submitLifeScore: (...args: unknown[]) => mock.score(...args),
}));

describe('cloud safety acceptance checks', () => {
  beforeEach(() => {
    vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(100000);
    mock.configured = true; mock.download.mockReset(); mock.upload.mockReset();
    mock.live.mockReset(); mock.score.mockReset();
    mock.upload.mockResolvedValue(true); mock.live.mockResolvedValue(true); mock.score.mockResolvedValue(true);
    vi.stubGlobal('localStorage', { getItem: () => null });
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('does not write a late cloud save after boot timeout and new play begins', async () => {
    let complete!: (v: unknown) => void;
    mock.download.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    const { bootCloud } = await import('../src/cloud/sync');
    const write = vi.fn(async () => {});
    const boot = bootCloud(async () => 50000, write, 2500);
    await vi.advanceTimersByTimeAsync(2500);
    expect(await boot).toEqual({ restored: false });
    complete({ payload: { savedAt: 90000, life: { old: true }, ancestry: null } });
    await vi.advanceTimersByTimeAsync(1);
    expect(write).not.toHaveBeenCalled();
  });

  it('retains a failed upload for retry on next flush', async () => {
    mock.upload.mockResolvedValue(false);
    const { queueCloudSync, flushCloudSync, getCloudSyncStatus } = await import('../src/cloud/sync');
    queueCloudSync(createNewLife({ seed: 42 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(mock.upload).toHaveBeenCalledTimes(1);
    expect(getCloudSyncStatus()).toBe('retrying');
    mock.upload.mockResolvedValue(true);
    flushCloudSync();
    await vi.advanceTimersByTimeAsync(1);
    expect(mock.upload).toHaveBeenCalledTimes(2);
    expect(getCloudSyncStatus()).toBe('synced');
  });

  it('serializes overlapping writes so an older upload cannot finish last', async () => {
    const completions: Array<() => void> = [];
    mock.upload.mockImplementation(() => new Promise(resolve => completions.push(() => resolve(true))));
    const { queueCloudSync, flushCloudSync } = await import('../src/cloud/sync');
    queueCloudSync(createNewLife({ seed: 42 }));
    await vi.advanceTimersByTimeAsync(0);
    queueCloudSync(createNewLife({ seed: 43 }));
    flushCloudSync();
    await vi.advanceTimersByTimeAsync(1);
    const concurrentCalls = mock.upload.mock.calls.length;
    completions[0]();
    await vi.advanceTimersByTimeAsync(1);
    expect(concurrentCalls).toBe(1);
    expect(mock.upload).toHaveBeenCalledTimes(2);
    expect(mock.upload.mock.calls[1][0].life).toEqual(createNewLife({ seed: 43 }));
    completions[1]();
    await vi.advanceTimersByTimeAsync(1);
  });

  it('keeps the complete local snapshot when its life timestamp is newer', async () => {
    mock.download.mockResolvedValue({ payload: { savedAt: 90000, life: null, ancestry: '{"points":10}' } });
    const { bootCloud } = await import('../src/cloud/sync');
    const write = vi.fn(async () => {});
    await bootCloud(async () => 100000, write);
    expect(write).not.toHaveBeenCalled();
  });

  it('does not restore when local progress changes during the download', async () => {
    mock.download.mockResolvedValue({ payload: { savedAt: 90000, life: null, ancestry: null } });
    const { bootCloud } = await import('../src/cloud/sync');
    const read = vi.fn().mockResolvedValueOnce(10000).mockResolvedValueOnce(20000);
    const write = vi.fn(async () => {});
    expect(await bootCloud(read, write)).toEqual({ restored: false });
    expect(write).not.toHaveBeenCalled();
  });

  it('waits for a restore already writing before allowing play', async () => {
    mock.download.mockResolvedValue({ payload: { savedAt: 90000, life: null, ancestry: null } });
    let complete!: () => void;
    const write = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    const { bootCloud } = await import('../src/cloud/sync');
    let finished = false;
    const boot = bootCloud(async () => null, write, 2500).then(result => { finished = true; return result; });
    await vi.advanceTimersByTimeAsync(3000);
    expect(write).toHaveBeenCalledTimes(1);
    expect(finished).toBe(false);
    complete();
    expect(await boot).toEqual({ restored: true });
  });

  it('automatically retries and keeps the original snapshot time and ancestry', async () => {
    let ancestry = '{"points":3}';
    vi.stubGlobal('localStorage', { getItem: () => ancestry });
    mock.upload.mockResolvedValueOnce(false).mockResolvedValue(true);
    const { queueCloudSync } = await import('../src/cloud/sync');
    queueCloudSync(null);
    await vi.advanceTimersByTimeAsync(0);
    ancestry = '{"points":4}';
    await vi.advanceTimersByTimeAsync(5000);
    expect(mock.upload).toHaveBeenCalledTimes(2);
    expect(mock.upload.mock.calls[1][0]).toEqual(mock.upload.mock.calls[0][0]);
    expect(mock.upload.mock.calls[1][0].ancestry).toBe('{"points":3}');
  });

  it('retries a failed life score after the save itself uploaded', async () => {
    const state = createNewLife({ seed: 42 });
    state.phase = 'summary';
    mock.score.mockResolvedValueOnce(false).mockResolvedValue(true);
    const { queueCloudSync } = await import('../src/cloud/sync');
    queueCloudSync(state);
    await vi.advanceTimersByTimeAsync(0);
    expect(mock.score).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(mock.score).toHaveBeenCalledTimes(2);
    expect(mock.upload).toHaveBeenCalledTimes(2);
  });
});
