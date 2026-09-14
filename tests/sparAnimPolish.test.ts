import { describe, expect, it } from 'vitest';
import { AnimDirector } from '../src/spar/animDirector';
import {
  HERO_ATK_FRAMES,
  HERO_LAYERS,
  HERO_WALK_FRAMES,
  attackFrameIndex,
  walkFrameIndex,
} from '../src/spar/silhouetteDraw';

describe('spar A+B+C animation polish', () => {
  it('A：行路／揮擊幀路徑齊全', () => {
    expect(HERO_WALK_FRAMES).toHaveLength(4);
    expect(HERO_ATK_FRAMES).toHaveLength(3);
    expect(HERO_WALK_FRAMES[0]!.src).toContain('frames/hero-walk-0.webp');
    expect(HERO_ATK_FRAMES[1]!.src).toContain('frames/hero-atk-1.webp');
    expect(walkFrameIndex(0)).toBe(0);
    expect(attackFrameIndex(0.1)).toBe(0);
    expect(attackFrameIndex(0.3)).toBe(1);
    expect(attackFrameIndex(0.55)).toBe(2);
  });

  it('B：導演由 enter 加速到 approach，近戰可 windup→strike', () => {
    const d = new AnimDirector();
    let s = d.update(0.05);
    expect(s.phase).toBe('enter');
    for (let i = 0; i < 20; i++) s = d.update(0.05);
    expect(s.phase).toBe('approach');
    expect(s.walkMul).toBeGreaterThan(0.4);
    d.notifyMelee(true);
    expect(d.requestWindup()).toBe(true);
    s = d.update(0.05);
    expect(s.phase).toBe('windup');
    for (let i = 0; i < 10; i++) {
      d.update(0.05);
      d.consumeWindupReady();
    }
    s = d.update(0);
    expect(s.phase).toBe('strike');
  });

  it('C：分層素材定義齊全', () => {
    expect(HERO_LAYERS.body.src).toContain('layers/hero-body.webp');
    expect(HERO_LAYERS.hat.src).toContain('layers/hero-hat.webp');
    expect(HERO_LAYERS.arm.src).toContain('layers/hero-arm.webp');
    expect(HERO_LAYERS.arm.dy).toBeLessThan(0);
  });
});
