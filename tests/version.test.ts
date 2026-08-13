import { describe, expect, it } from 'vitest';
import { APP_VERSION, APP_VERSION_LABEL } from '../src/version';

describe('app version', () => {
  it('exposes Early Access release EA0.4.4', () => {
    expect(APP_VERSION).toBe('EA0.4.4');
    expect(APP_VERSION_LABEL).toContain('EA0.4.4');
  });
});
