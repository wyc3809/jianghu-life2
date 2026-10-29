import { afterAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jianghu-ios-internal-'));
fs.mkdirSync(path.join(dir, 'production/ios'), { recursive: true });
fs.mkdirSync(path.join(dir, 'src'));
fs.mkdirSync(path.join(dir, 'bin'));
const readinessFile = path.join(dir, 'production/ios/release-readiness.json');
const readiness = {
  gameVersion: 'EA0.89.0', candidateBundleId: 'com.example.jianghu', appStoreAppId: '1234567890',
  checks: [{ id: 'device-save-upgrade', done: false, detail: '真機驗收未完成' }],
};
fs.writeFileSync(readinessFile, JSON.stringify(readiness));
fs.writeFileSync(path.join(dir, 'src/version.ts'), "export const APP_VERSION = 'EA0.89.0';\n");
fs.writeFileSync(path.join(dir, 'bin/app-store-connect'), [
  '#!/usr/bin/env bash',
  'printf \'%s\' "${TEST_LATEST_BUILD:-}"',
  'exit "${TEST_CLI_STATUS:-0}"',
].join('\n'), { mode: 0o755 });
const publicKey = (role = 'anon', ref = 'fixture') =>
  `fixture.${Buffer.from(JSON.stringify({ role, ref })).toString('base64url')}.fixture-signature`;
const env = {
  ...process.env,
  APP_STORE_APP_ID: readiness.appStoreAppId,
  IOS_BUNDLE_ID: readiness.candidateBundleId,
  IOS_MARKETING_VERSION: '1.0', VITE_ONLINE_PUBLIC: '1',
  VITE_SUPABASE_URL: 'https://fixture.supabase.co', VITE_SUPABASE_ANON_KEY: publicKey(),
};
const check = (overrides: Record<string, string | undefined> = {}) => spawnSync(process.execPath,
  [path.join(root, 'scripts/ios/internal-check.mjs')], { cwd: dir, env: { ...env, ...overrides }, encoding: 'utf8' });
const buildNumber = (latest: string, status = '0') => spawnSync('bash',
  [path.join(root, 'scripts/ios/next-build-number.sh')], {
    cwd: dir, encoding: 'utf8', env: { ...env, PATH: `${dir}/bin:${process.env.PATH}`,
      TEST_LATEST_BUILD: latest, TEST_CLI_STATUS: status },
  });
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('iOS首次內測', () => {
  it('test_ios_內測可開始但真機待辦不會被標為完成', () => {
    const before = fs.readFileSync(readinessFile, 'utf8');
    const result = check();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('未驗收 device-save-upgrade');
    expect(fs.readFileSync(readinessFile, 'utf8')).toBe(before);
  });
  it('test_ios_內測接受公開publishable金鑰', () => {
    expect(check({ VITE_SUPABASE_ANON_KEY: 'sb_publishable_fixture' }).status).toBe(0);
  });
  it('test_ios_準備版本過期會停止且不改待辦狀態', () => {
    const before = fs.readFileSync(readinessFile, 'utf8');
    try {
      fs.writeFileSync(readinessFile, JSON.stringify({ ...readiness, gameVersion: 'EA0.88.0' }));
      const result = check();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('內測內容版本與準備紀錄不同');
      expect(result.stdout).toContain('未驗收 device-save-upgrade');
      expect(JSON.parse(fs.readFileSync(readinessFile, 'utf8')).checks).toEqual(readiness.checks);
    } finally {
      fs.writeFileSync(readinessFile, before);
    }
  });
  it('test_ios_外測仍拒絕未完成驗收', () => {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/ios/release-check.mjs')], {
      cwd: dir, env, encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('device-save-upgrade');
  });
  it.each([
    { APP_STORE_APP_ID: '9999999999' },
    { IOS_BUNDLE_ID: 'com.example.other' },
    { VITE_SUPABASE_URL: 'https://supabase.com/dashboard/project/fixture' },
    { VITE_SUPABASE_ANON_KEY: '' },
    { VITE_SUPABASE_ANON_KEY: publicKey('anon', 'another-project') },
  ])('test_ios_內測拒絕缺漏或不匹配設定_%j', overrides => {
    expect(check(overrides).status).not.toBe(0);
  });
  it.each([publicKey('service_role'), 'sb_secret_backend-fixture'])('test_ios_拒絕後端金鑰且不印出內容_%#', key => {
    const result = check({ VITE_SUPABASE_ANON_KEY: key });
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).not.toContain(key);
  });
  it.each([['', '1'], ['0', '1'], ['41', '42']])('test_ios_查詢成功後build從%s遞增為%s', (latest, next) => {
    const result = buildNumber(latest);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(next);
  });
  it('test_ios_Apple查詢失敗不能重設build為1', () => {
    const result = buildNumber('', '65');
    expect(result.status).toBe(65);
    expect(result.stdout).toBe('');
  });
  it.each(['2.3', 'invalid', '2147483647', '999999999999999999999'])('test_ios_不可遞增build號會停止_%s', latest => {
    expect(buildNumber(latest).status).not.toBe(0);
  });
});
