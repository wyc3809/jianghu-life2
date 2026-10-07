import { describe, expect, it } from 'vitest';
import { APP_VERSION, APP_VERSION_LABEL } from '../src/version';

describe('app version', () => {
  it('exposes Early Access release EA0.57.0', () => {
    expect(APP_VERSION).toBe('EA0.57.0');
    expect(APP_VERSION_LABEL).toContain('EA0.57.0');
  });
});
