import { describe, expect, it } from 'vitest';
import { SPAR_CLIPS } from '../src/spar/rig';
import {
  HERO_SIL,
  SILHOUETTE_DESIGN_H,
  enemyArchetypeFromSrc,
  weaponFromKind,
  weaponTipLocal,
} from '../src/spar/silhouetteDraw';

describe('AI 位圖剪影演武台', () => {
  it('SPAR_CLIPS 齊全且攻擊有 strike 事件', () => {
    expect(SPAR_CLIPS.idle.loop).toBe(true);
    expect(SPAR_CLIPS.attack.dur).toBeGreaterThan(0.5);
    expect(SPAR_CLIPS.attack.events?.some((e) => e.id === 'strike')).toBe(true);
  });

  it('攻擊骨骼含誇張可讀軌道', () => {
    const arm = SPAR_CLIPS.attack.tracks.find((t) => t.bone === 'arm' && t.prop === 'rot');
    const bodyX = SPAR_CLIPS.attack.tracks.find((t) => t.bone === 'body' && t.prop === 'x');
    expect(arm).toBeTruthy();
    expect(bodyX).toBeTruthy();
    const armMin = Math.min(...(arm?.keys.map((k) => k.v) ?? [0]));
    const xMax = Math.max(...(bodyX?.keys.map((k) => k.v) ?? [0]));
    expect(armMin).toBeLessThanOrEqual(-90);
    expect(xMax).toBeGreaterThanOrEqual(70);
  });

  it('位圖剪影素材路徑同設計高度', () => {
    expect(SILHOUETTE_DESIGN_H).toBe(788);
    expect(HERO_SIL.idle.src).toContain('sil/hero-idle.webp');
    expect(HERO_SIL.attack.src).toContain('sil/hero-attack.webp');
    expect(enemyArchetypeFromSrc('/ink/spar/sil/enemy-daoke.webp')).toBe('daoke');
    expect(enemyArchetypeFromSrc('/ink/spar/sil/enemy-shadow.webp')).toBe('boss');
    expect(weaponFromKind(null)).toBe('fist');
    expect(weaponTipLocal('sword', 1).y).toBeLessThan(0);
  });
});
