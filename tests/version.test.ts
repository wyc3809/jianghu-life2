import { describe, expect, it } from 'vitest';
import { APP_VERSION, APP_VERSION_LABEL } from '../src/version';
import readiness from '../production/ios/release-readiness.json';
import packageInfo from '../package.json';
import packageLock from '../package-lock.json';

describe('app version', () => {
  it('exposes Early Access release EA0.97.2', () => {
    expect(APP_VERSION).toBe('EA0.97.2');
    expect(APP_VERSION_LABEL).toContain('EA0.97.2');
  });

  it('test_ios_內測準備及套件版本必須跟隨遊戲版本', () => {
    expect(readiness.gameVersion).toBe(APP_VERSION);
    const packageVersion = `${APP_VERSION.slice(2)}-ea`;
    expect(packageInfo.version).toBe(packageVersion);
    expect(packageLock.version).toBe(packageVersion);
    expect(packageLock.packages[''].version).toBe(packageVersion);
  });
});
