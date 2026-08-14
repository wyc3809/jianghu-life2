import { describe, expect, it } from 'vitest';
import { APP_VERSION, APP_VERSION_LABEL } from '../src/version';

describe('app version', () => {
  it('exposes Early Access release EA0.7.0', () => {
    expect(APP_VERSION).toBe('EA0.7.0');
    expect(APP_VERSION_LABEL).toContain('EA0.7.0');
  });
});
