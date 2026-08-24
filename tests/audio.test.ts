import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('inkAudio', () => {
  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    // Reset module state by re-importing
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should export audio functions', async () => {
    const {
      isInkAudioMuted,
      toggleInkAudioMuted,
      isAmbientEnabled,
      setAmbientEnabled,
      playInkTap,
      playInkHit,
      playInkCrit,
      setAmbientVolume,
    } = await import('../src/audio/inkAudio');

    expect(typeof isInkAudioMuted).toBe('function');
    expect(typeof toggleInkAudioMuted).toBe('function');
    expect(typeof isAmbientEnabled).toBe('function');
    expect(typeof setAmbientEnabled).toBe('function');
    expect(typeof setAmbientVolume).toBe('function');
    expect(typeof playInkTap).toBe('function');
    expect(typeof playInkHit).toBe('function');
    expect(typeof playInkCrit).toBe('function');
  });

  it('toggleInkAudioMuted should flip muted state', async () => {
    const { toggleInkAudioMuted, isInkAudioMuted } = await import('../src/audio/inkAudio');
    const initial = isInkAudioMuted();
    const after = toggleInkAudioMuted();
    expect(after).toBe(!initial);
  });
});
