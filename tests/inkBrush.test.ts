import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clampPct } from '../src/components/ink/InkBrush';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('InkBrush', () => {
  it('clampPct maps raw/max to 0–100 and clamps', () => {
    expect(clampPct(50, 200)).toBe(25);
    expect(clampPct(-5, 100)).toBe(0);
    expect(clampPct(150, 100)).toBe(100);
    expect(clampPct(10, 0)).toBe(0);
    expect(clampPct(Number.NaN, 100)).toBe(0);
  });
});

describe('no-svg rule (.claude/rules/no-svg-game-art.md)', () => {
  it('src/ contains no inline <svg>, svg data URIs or .svg imports', () => {
    const offenders = walk('src')
      .filter((f) => /\.(tsx?|css)$/.test(f))
      .filter((f) => /<svg[\s>]|data:image\/svg\+xml|\.svg['"?]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
