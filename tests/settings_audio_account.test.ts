import { describe, expect, it } from 'vitest';
import { formatSaveTime } from '../src/ui/formatSaveTime';
import { getAudioMix, isInkAudioMuted, setAudioMix, sfxGainFactor } from '../src/audio/inkAudio';

describe('settings: account save time (agreed-design §6)', () => {
  const now = new Date(2026, 9, 5, 20, 0).getTime();

  it('test_format_save_time_today_yesterday_and_older', () => {
    expect(formatSaveTime(0, now)).toBe('未有存檔');
    expect(formatSaveTime(new Date(2026, 9, 5, 8, 31).getTime(), now)).toBe('今日 08:31');
    expect(formatSaveTime(new Date(2026, 9, 4, 21, 5).getTime(), now)).toBe('昨日 21:05');
    expect(formatSaveTime(new Date(2026, 9, 1, 7, 2).getTime(), now)).toBe('10月1日 07:02');
  });
});

describe('settings: music and SFX controlled separately (agreed-design §5)', () => {
  it('test_audio_mix_channels_are_independent_and_clamped', () => {
    setAudioMix({ musicOn: true, musicLevel: 80, sfxOn: true, sfxLevel: 80 });
    setAudioMix({ musicOn: false });
    expect(getAudioMix()).toMatchObject({ musicOn: false, sfxOn: true, sfxLevel: 80 });
    expect(isInkAudioMuted()).toBe(false);
    expect(sfxGainFactor()).toBeCloseTo(0.8);

    setAudioMix({ sfxLevel: 140 });
    expect(getAudioMix().sfxLevel).toBe(100);
    setAudioMix({ sfxLevel: -5 });
    expect(getAudioMix().sfxLevel).toBe(0);
    expect(sfxGainFactor()).toBe(0);
    expect(isInkAudioMuted()).toBe(true);
  });
});
