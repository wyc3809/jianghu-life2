import { describe, expect, it } from 'vitest';
import { SPAR_CLIPS } from '../src/spar/rig';
import {
  enemyArchetypeFromSrc,
  weaponFromKind,
  weaponTipLocal,
} from '../src/spar/silhouetteDraw';

describe('純黑影骨骼／剪影人偶', () => {
  it('SPAR_CLIPS 齊全且攻擊有 strike 事件', () => {
    expect(SPAR_CLIPS.idle.loop).toBe(true);
    expect(SPAR_CLIPS.attack.dur).toBeGreaterThan(0.5);
    expect(SPAR_CLIPS.attack.events?.some((e) => e.id === 'strike')).toBe(true);
    expect(SPAR_CLIPS['enemy-death'].dur).toBeGreaterThan(0.4);
    expect(SPAR_CLIPS['enemy-spawn'].dur).toBeGreaterThan(0.3);
  });

  it('攻擊骨骼含誇張剪影可讀軌道（大後引／踏步）', () => {
    const arm = SPAR_CLIPS.attack.tracks.find((t) => t.bone === 'arm' && t.prop === 'rot');
    const bodyX = SPAR_CLIPS.attack.tracks.find((t) => t.bone === 'body' && t.prop === 'x');
    expect(arm).toBeTruthy();
    expect(bodyX).toBeTruthy();
    const armMin = Math.min(...(arm?.keys.map((k) => k.v) ?? [0]));
    const xMax = Math.max(...(bodyX?.keys.map((k) => k.v) ?? [0]));
    expect(armMin).toBeLessThanOrEqual(-90);
    expect(xMax).toBeGreaterThanOrEqual(70);
  });

  it('敵人原型同武器種類推斷', () => {
    expect(enemyArchetypeFromSrc('/ink/spar/enemy-daoke.webp')).toBe('daoke');
    expect(enemyArchetypeFromSrc('/ink/spar/enemy-shadow.webp')).toBe('boss');
    expect(weaponFromKind(null)).toBe('fist');
    expect(weaponFromKind('spear')).toBe('spear');
    expect(weaponTipLocal('sword', 1).y).toBeLessThan(0);
  });
});
