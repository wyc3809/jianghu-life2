import { beforeEach, describe, expect, it, vi } from 'vitest';

const cloud = vi.hoisted(() => ({
  configured: true,
  row: null as null | { payload: { savedAt: number; life: unknown; ancestry: string | null }; saved_at: string },
}));

vi.mock('../src/cloud/cloud', () => ({
  cloudConfigured: () => cloud.configured,
  ensureIdentity: async () => ({ userId: 'u1', email: null, pendingEmail: null, anonymous: true }),
  downloadSave: async () => cloud.row,
  uploadSave: async () => true,
  submitLive: async () => true,
  submitLifeScore: async () => true,
}));

import { bootCloud } from '../src/cloud/sync';

function row(savedAt: number) {
  return { payload: { savedAt, life: { tag: 'cloud' }, ancestry: '{"points":3}' }, saved_at: new Date(savedAt).toISOString() };
}

describe('cloud sync boot (雲端開機同步)', () => {
  beforeEach(() => {
    cloud.configured = true;
    cloud.row = null;
  });

  it('test_boot_restores_when_cloud_newer_than_local', async () => {
    cloud.row = row(100_000);
    const write = vi.fn(async () => {});
    const r = await bootCloud(async () => 50_000, write);
    expect(r.restored).toBe(true);
    expect(write).toHaveBeenCalledWith({ tag: 'cloud' }, '{"points":3}');
  });

  it('test_boot_restores_when_no_local_save', async () => {
    cloud.row = row(100_000);
    const write = vi.fn(async () => {});
    expect((await bootCloud(async () => null, write)).restored).toBe(true);
  });

  it('test_boot_keeps_local_when_local_newer_or_close', async () => {
    cloud.row = row(100_000);
    const write = vi.fn(async () => {});
    expect((await bootCloud(async () => 98_000, write)).restored).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });

  it('test_boot_noop_when_not_configured', async () => {
    cloud.configured = false;
    cloud.row = row(100_000);
    const write = vi.fn(async () => {});
    expect((await bootCloud(async () => null, write)).restored).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
});
